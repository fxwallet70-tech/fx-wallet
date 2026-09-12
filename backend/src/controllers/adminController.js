const bcrypt = require('bcryptjs');

const Admin = require('../models/Admin');
const {
  verifyRefreshToken,
  hashToken,
  findSession,
  issueTokens,
  revokeSession,
  clearSessions,
} = require('../utils/tokens');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: 'Admin not found',
      });
    }

    const match = await bcrypt.compare(password, admin.password);

    if (!match) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password',
      });
    }

    // Admins get the same short access token + long refresh token pair as users,
    // so an open admin panel is not signed out mid-session.
    const { token, refreshToken } = await issueTokens(admin, {
      id: admin._id,
      role: 'admin',
    });

    return res.json({
      success: true,
      token,
      refreshToken,
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// Exchange a valid admin refresh token for a new access token, rotating the
// refresh token in the process.
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

    const admin = await Admin.findById(decoded.id).select('+refreshSessions');

    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }

    const session = findSession(admin, refreshToken);

    if (!session) {
      await clearSessions(admin);

      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }

    const tokens = await issueTokens(
      admin,
      { id: admin._id, role: 'admin' },
      hashToken(refreshToken)
    );

    return res.json({
      success: true,
      message: 'Session refreshed',
      ...tokens,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// Logout - revokes the admin refresh token so a copied one cannot be replayed.
const logout = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);

    if (admin) {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await revokeSession(admin, refreshToken);
      } else {
        await clearSessions(admin);
      }
    }

    return res.json({ success: true, message: 'Logged out' });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

module.exports = {
  login,
  refresh,
  logout,
};