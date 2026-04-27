const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // =====================
    // BASIC INFO
    // =====================
    name: {
      type: String,
      required: true,
      trim: true
    },

    idNumber: {
      type: String,
      required: true,
      unique: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },

    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    // =====================
    // OTP SYSTEM
    // =====================
    otp: {
      type: String,
      default: null,
      select: false
    },

    otpExpires: {
      type: Date,
      default: null
    },

    // =====================
    // FORGOT PASSWORD
    // =====================
    resetPasswordToken: {
      type: String,
      default: null
    },

    resetPasswordExpires: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);