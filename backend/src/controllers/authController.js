const bcrypt = require('bcryptjs');

const User = require('../models/User');
const { sendPasswordResetEmail } = require('../utils/sendEmail');
const {
  verifyRefreshToken,
  hashToken,
  findSession,
  issueTokens,
  revokeSession,
  clearSessions,
} = require('../utils/tokens');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;

const generateReferralCode = require('../utils/generateReferralCode');
const ReferralSettings = require('../models/ReferralSettings');

// Register - creates a verified account and returns a JWT immediately.
// (Phone OTP / Twilio verification has been removed.)
const register = async (req, res) => {
  try {
    const { fullName, email, mobile, password, referralCode } = req.body;

    if (!fullName || !email || !mobile || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.trim();

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    if (!MOBILE_REGEX.test(cleanMobile)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number' });
    }

    let user = await User.findOne({
      $or: [{ email: cleanEmail }, { mobile: cleanMobile }],
    });

    if (user && user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email or mobile already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (user && !user.isVerified) {
      user.fullName = fullName;
      user.email = cleanEmail;
      user.mobile = cleanMobile;
      user.password = hashedPassword;
      user.isVerified = true;
      await user.save();
    } else {
      let referredBy = null;

      if (referralCode) {
        const referrer = await User.findOne({
          referralCode: referralCode.trim().toUpperCase(),
        });

        if (referrer) {
          referredBy = referrer._id;
        }
      }

      const newReferralCode = await generateReferralCode();

      user = await User.create({
        fullName,
        email: cleanEmail,
        mobile: cleanMobile,
        password: hashedPassword,
        isVerified: true,
        referralCode: newReferralCode,
        referredBy,
      });

      if (referredBy && !user.referralRewardGiven) {
        const settings = await ReferralSettings.findOne();

        if (settings?.enabled && settings.newUserBonus > 0) {
          user.walletBalance = Number(user.walletBalance || 0) + settings.newUserBonus;
          user.referralRewardGiven = true;
          await user.save();
        }
      }
    }

    // Access token for immediate use, plus a refresh token so the session can be
    // renewed silently for as long as JWT_REFRESH_EXPIRES_IN allows.
    const { token, refreshToken } = await issueTokens(user, { id: user._id });

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Login - verifies email/password and returns a JWT.
const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    email = email.trim().toLowerCase();
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account is inactive' });
    }

    const passwordMatched = await bcrypt.compare(password, user.password);

    if (!passwordMatched) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Access token for immediate use, plus a refresh token so the session can be
    // renewed silently for as long as JWT_REFRESH_EXPIRES_IN allows.
    const { token, refreshToken } = await issueTokens(user, { id: user._id });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must contain at least 6 characters' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, message: 'New password must be different from current password' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const passwordMatched = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatched) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Step 1: request password reset - generates a 6-digit code and emails it (free Gmail SMTP).
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Do not reveal whether the account is registered.
    const notFoundMessage = 'If this email is registered, a reset code has been sent.';

    if (!user) {
      return res.status(200).json({ success: true, message: notFoundMessage });
    }

    // 6-digit code, valid for 10 minutes.
    const code = String(Math.floor(100000 + Math.random() * 900000));
    user.resetCode = code;
    user.resetCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      await sendPasswordResetEmail({
        to: user.email,
        fullName: user.fullName,
        code,
      });
    } catch (mailError) {
      console.error('Forgot password email failed:', mailError.message);
      return res.status(500).json({
        success: false,
        message: 'Unable to send reset email. Please try again later or contact support on Telegram @FXwallet70.',
      });
    }

    // NOTE: resetCode is intentionally NOT returned — user must read it from email.
    return res.status(200).json({
      success: true,
      message: `A reset code has been sent to ${user.email}. Check inbox / spam. Valid for 10 minutes.`,
      mobile: user.mobile,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Step 2: validate the reset code and set a new password.
const resetPassword = async (req, res) => {
  try {
    const { mobile, otp, newPassword } = req.body;

    if (!mobile || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mobile, reset code, and new password are required',
      });
    }

    if (String(otp).length !== 6) {
      return res.status(400).json({ success: false, message: 'Reset code must be 6 digits' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must contain at least 6 characters',
      });
    }

    const user = await User.findOne({ mobile: mobile.trim() });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const codeValid =
      user.resetCode &&
      String(user.resetCode) === String(otp) &&
      user.resetCodeExpiresAt &&
      new Date(user.resetCodeExpiresAt) > new Date();

    if (!codeValid) {
      return res.status(401).json({ success: false, message: 'Invalid or expired code' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetCode = null;
    user.resetCodeExpiresAt = null;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Step 3: exchange a valid refresh token for a new access token. The refresh
// token is rotated on every call and the used one is dropped, so a stolen copy
// stops working as soon as the real client refreshes.
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    let decoded;

    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (tokenError) {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }

    // refreshSessions is not selected by default, so it must be asked for.
    const user = await User.findById(decoded.id).select('+refreshSessions');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }

    const session = findSession(user, refreshToken);

    if (!session) {
      // Signed correctly but no longer on the account: the token was already
      // rotated or revoked. Treat it as a replay and drop every session.
      await clearSessions(user);

      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }

    const tokens = await issueTokens(user, { id: user._id }, hashToken(refreshToken));

    return res.status(200).json({
      success: true,
      message: 'Session refreshed',
      ...tokens,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Logout - revokes the refresh token so a copied one cannot be replayed, then the
// client clears its own copy.
const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await revokeSession(user, refreshToken);
      } else {
        // No token supplied: end every session on the account.
        await clearSessions(user);
      }
    }

    return res.status(200).json({ success: true, message: 'Logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
};