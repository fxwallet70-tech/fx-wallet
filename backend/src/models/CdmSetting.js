const mongoose = require("mongoose");

/**
 * Single-document settings record describing how users should pay via
 * Cash Deposit (CDM). Admin uploads an optional image (bank/UPI details)
 * plus text instructions shown to users in the app.
 */
const cdmSettingSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CdmSetting", cdmSettingSchema);