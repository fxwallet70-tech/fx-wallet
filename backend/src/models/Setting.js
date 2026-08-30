const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    appName: {
      type: String,
      default: "FX Wallet",
    },

    logo: {
      type: String,
      default: "",
    },

    bannerImages: [
      {
        type: String,
      },
    ],

    supportEmail: {
      type: String,
      default: "",
    },

    supportPhone: {
      type: String,
      default: "",
    },

    whatsapp: {
      type: String,
      default: "",
    },

    telegram: {
      type: String,
      default: "",
    },

    supportPublicGroup: {
      type: String,
      default: "https://t.me/FXwallet0",
    },

    supportOfficialChannel: {
      type: String,
      default: "https://t.me/+8tV1IrL6cdw3Zjc1",
    },

    supportOfficialGmail: {
      type: String,
      default: "fxwallet@gmail.com",
    },

    supportCustomerSupport: {
      type: String,
      default: "@FXwallet70",
    },

    website: {
      type: String,
      default: "",
    },

    privacyPolicy: {
      type: String,
      default: "",
    },

    termsConditions: {
      type: String,
      default: "",
    },

    aboutUs: {
      type: String,
      default: "",
    },

    maintenanceMode: {
      type: Boolean,
      default: false,
    },

    appVersion: {
      type: String,
      default: "1.0.0",
    },

    forceUpdate: {
      type: Boolean,
      default: false,
    },

    // New Settings
    darkMode: {
      type: Boolean,
      default: false,
    },

    pushNotification: {
      type: Boolean,
      default: true,
    },

    emailNotification: {
      type: Boolean,
      default: true,
    },

    language: {
      type: String,
      default: "English",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Setting", settingSchema);