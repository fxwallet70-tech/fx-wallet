const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const uploadProof = require('../middleware/uploadProof');

const {
  submitProof,
  getProofs,
  updateProofStatus,
  getMyProofs,
  getPaymentHistory,
} = require('../controllers/paymentProofController');

// User submits proof (needs to be logged in)
router.post('/', authMiddleware, uploadProof.single('screenshot'), submitProof);

// User views their own submissions
router.get('/my', authMiddleware, getMyProofs);

// User payment history
router.get('/history', authMiddleware, getPaymentHistory);

// Admin views/manages proofs
router.get('/admin', adminMiddleware, getProofs);
router.put('/admin/:id', adminMiddleware, updateProofStatus);

module.exports = router;