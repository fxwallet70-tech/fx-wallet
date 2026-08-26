const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const uploadProof = require("../middleware/uploadProof");
const uploadCdm = require("../middleware/uploadCdm");

const {
  getCdmSetting,
  updateCdmSetting,
  createCdmRequest,
  getMyCdmRequests,
  getAllCdmRequests,
  updateCdmRequestStatus,
} = require("../controllers/cdmController");

// Deposit instructions (public GET for the app; admin can update)
router.get("/setting", getCdmSetting);
router.put("/setting", adminMiddleware, uploadCdm.single("image"), updateCdmSetting);

// User: submit a CDM plan purchase + view their requests
router.post("/", authMiddleware, uploadProof.single("screenshot"), createCdmRequest);
router.get("/my", authMiddleware, getMyCdmRequests);

// Admin: review & approve/reject CDM requests
router.get("/admin", adminMiddleware, getAllCdmRequests);
router.put("/admin/:id", adminMiddleware, updateCdmRequestStatus);

module.exports = router;