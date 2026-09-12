const express = require('express');

const router = express.Router();

const { login, refresh, logout } = require('../controllers/adminController');
const {
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    searchUsers,
} = require('../controllers/adminUserController');
const {
  dashboard,
} = require('../controllers/dashboardController');

const adminMiddleware = require('../middleware/adminMiddleware');

router.post('/login', login);

// Silent renewal of an expired admin access token, and revocation on logout.
router.post('/refresh', refresh);

router.post('/logout', adminMiddleware, logout);

const {
  creditWallet,
  debitWallet,
  getWallet,
} = require('../controllers/adminWalletController');

router.get(
  '/wallet/:id',
  adminMiddleware,
  getWallet
);

router.post(
  '/wallet/:id/credit',
  adminMiddleware,
  creditWallet
);

router.post(
  '/wallet/:id/debit',
  adminMiddleware,
  debitWallet
);


router.get(
  '/dashboard',
  adminMiddleware,
  dashboard
);

router.get(
    '/users',
    adminMiddleware,
    getUsers
);

router.get(
    '/users/:id',
    adminMiddleware,
    getUser
);

router.put(
    '/users/:id',
    adminMiddleware,
    updateUser
);

router.delete(
    '/users/:id',
    adminMiddleware,
    deleteUser
);

router.get(
    '/users/search',
    adminMiddleware,
    searchUsers
);


module.exports = router;