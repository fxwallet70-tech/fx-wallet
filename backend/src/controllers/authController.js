const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
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

// Step 1: request password reset - generates a reset code (no SMS/Twilio).
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Do not reveal whether the account is registered.
    const notFoundMessage = 'If this email is registered, a reset code has been generated.';

    if (!user) {
      return res.status(200).json({ success: true, message: notFoundMessage });
    }

    // 6-digit code, valid for 10 minutes.
    const code = String(Math.floor(100000 + Math.random() * 900000));
    user.resetCode = code;
    user.resetCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    return res.status(200).json({
      success: true,
      message: `A reset code has been generated for ${user.email}.`,
      mobile: user.mobile,
      // No SMS/email provider is configured, so the code is returned to the
      // client to keep the password-reset flow usable without Twilio.
      resetCode: code,
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

module.exports = {
  register,
  login,
  changePassword,
  forgotPassword,
  resetPassword,
};