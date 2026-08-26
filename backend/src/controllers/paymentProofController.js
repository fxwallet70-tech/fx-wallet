const PaymentProof = require('../models/PaymentProof');

// User: delete their own pending proof
const deleteProof = async (req, res) => {
  try {
    const proof = await PaymentProof.findOne({
      _id: req.params.id,
      user: req.user.id,
      status: 'pending',
    });

    if (!proof) {
      return res.status(404).json({
        success: false,
        message: 'Proof not found or cannot be deleted',
      });
    }

    await PaymentProof.deleteOne({ _id: proof._id });

    return res.status(200).json({
      success: true,
      message: 'Proof deleted successfully',
    });
  } catch (error) {
    console.error('Delete proof error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// User: get count of pending proofs
const getPendingProofCount = async (req, res) => {
  try {
    const count = await PaymentProof.countDocuments({
      user: req.user.id,
      status: 'pending',
    });

    return res.status(200).json({ success: true, count });
  } catch (error) {
    console.error('Pending proof count error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// User: get their own submitted proofs + status
const getMyProofs = async (req, res) => {
  try {
    const proofs = await PaymentProof.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, proofs });
  } catch (error) {
    console.error('Get my proofs error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// User: submit a payment proof
const submitProof = async (req, res) => {
  try {
    const { accountDetails } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Screenshot is required' });
    }

    if (!accountDetails) {
      return res.status(400).json({ success: false, message: 'Account details are required' });
    }

    const proof = await PaymentProof.create({
      user: req.user.id,
      screenshot: `/uploads/proofs/${req.file.filename}`,
      accountDetails,
    });

    return res.status(201).json({
      success: true,
      message: 'Payment proof submitted successfully. Our team will review it shortly.',
      data: proof,
    });
  } catch (error) {
    console.error('Submit proof error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Admin: list all submitted proofs (wallet-deposit proofs only; CDM
// plan-purchase requests are managed on the CDM page)
const getProofs = async (req, res) => {
  try {
    const proofs = await PaymentProof.find({
      type: { $ne: 'plan_cdm' },
    })
      .populate('user', 'fullName email mobile')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, proofs });
  } catch (error) {
    console.error('Get proofs error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Admin: update proof status
const updateProofStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const proof = await PaymentProof.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!proof) {
      return res.status(404).json({ success: false, message: 'Proof not found' });
    }

    return res.status(200).json({ success: true, data: proof });
  } catch (error) {
    console.error('Update proof error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  submitProof,
  getProofs,
  updateProofStatus,
  getMyProofs,
  deleteProof,
  getPendingProofCount,
};