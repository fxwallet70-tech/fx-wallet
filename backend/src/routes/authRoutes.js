const express = require('express');

const router = express.Router();

const {
  register,
  login,
  refresh,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

const authMiddleware = require(
  '../middleware/authMiddleware',
);

router.post('/register', register);

router.post('/login', login);

// Silent renewal of an expired access token, and revocation on logout. Both are
// called by the clients' axios layer, not by the user directly.
router.post('/refresh', refresh);

router.post('/logout', authMiddleware, logout);

router.put(
  '/change-password',
  authMiddleware,
  changePassword,
);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
module.exports = router;