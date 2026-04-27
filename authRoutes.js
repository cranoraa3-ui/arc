const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/User");
const { sendEmail, sendOTP } = require("../utils/sendEmail");
const generateToken = require("../utils/generateToken");

/* =====================
   SIGNUP
===================== */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role, yearLevel } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (!["student", "teacher"].includes(role)) {
      return res.status(403).json({ success: false, message: "Invalid role" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = crypto.randomInt(100000, 999999).toString();

    const count = await User.countDocuments();
    const idNumber = "2026" + String(count + 1).padStart(4, "0");

    await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      yearLevel: yearLevel || "",
      idNumber,
      otp,
      otpExpires: Date.now() + 5 * 60 * 1000,
      isVerified: false,
      status: "pending"
    });

    await sendOTP(email, otp);

    return res.json({ success: true, message: "OTP sent" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* =====================
   LOGIN
===================== */
router.post("/login", async (req, res) => {
  try {
    const { identifier, password, role } = req.body;

    const user = await User.findOne({
      $or: [{ email: identifier }, { name: identifier }]
    }).select("+password");

    if (!user) return res.status(400).json({ success: false, message: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: "Verify OTP first" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ success: false, message: "Invalid credentials" });

    if (user.role !== role) {
      return res.status(403).json({ success: false, message: "Wrong role" });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* =====================
   FORGOT PASSWORD (FIXED)
===================== */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

    await user.save();

    // ❗ IMPORTANT FIX: USE BACKEND URL OR FRONTEND LIVE SERVER
    const link = `http://127.0.0.1:5000/reset-password.html?token=${token}`;

    await sendEmail({
      to: email,
      subject: "Reset Password - KNHS",
      html: `
        <div style="font-family:Arial;padding:20px">
          <h2>Reset Password</h2>

          <a href="${link}" style="
            padding:10px 20px;
            background:#6b21a8;
            color:white;
            text-decoration:none;
            display:inline-block;
            border-radius:5px;
          ">
            Click to Reset
          </a>
        </div>
      `,
    });

    return res.json({ success: true, message: "Reset link sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* =====================
   RESET PASSWORD (FIXED)
===================== */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }

    const user = await User.findOne({ resetPasswordToken: token });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ success: false, message: "Token expired" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.json({
      success: true,
      message: "Password reset successful",
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;