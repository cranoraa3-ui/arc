const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const validator = require("email-validator");

const User = require("../models/User");
const { sendEmail, sendOTP } = require("../utils/sendEmail");
const generateToken = require("../utils/generateToken");

/* =====================
   VALIDATION HELPERS
===================== */

// Email validation
function isValidEmail(email) {
  return validator.validate(email);
}

// Password validation - enforce minimum security
function validatePassword(password) {
  if (!password || password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one special character" };
  }
  
  return { valid: true };
}

// Name validation
function validateName(name) {
  if (!name || name.trim().length < 2) {
    return false;
  }
  // Allow letters, spaces, hyphens, apostrophes
  return /^[a-zA-Z\s\-']+$/.test(name);
}

/* =====================
   SIGNUP
===================== */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role, yearLevel } = req.body;

    // Validate all required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: name, email, password, role" 
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email address" 
      });
    }

    // Validate name format
    if (!validateName(name)) {
      return res.status(400).json({ 
        success: false, 
        message: "Name must contain only letters, spaces, hyphens, and apostrophes" 
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: passwordValidation.message 
      });
    }

    // Validate role
    if (!["student", "teacher"].includes(role)) {
      return res.status(403).json({ 
        success: false, 
        message: "Invalid role. Must be 'student' or 'teacher'" 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: "Email already registered" 
      });
    }

    // Hash password with bcrypt (10 rounds)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate OTP (6 digits)
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Generate unique ID
    const count = await User.countDocuments();
    const idNumber = "2026" + String(count + 1).padStart(4, "0");

    // Create user
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      yearLevel: yearLevel?.trim() || "",
      idNumber,
      otp,
      otpExpires,
      isVerified: false,
      status: role === "teacher" ? "pending" : "approved" // Teachers need approval
    });

    // Send OTP email
    try {
      await sendOTP(email, otp);
    } catch (emailErr) {
      console.error("Failed to send OTP email:", emailErr);
      // Delete user if email send fails
      await User.deleteOne({ _id: newUser._id });
      return res.status(500).json({ 
        success: false, 
        message: "Failed to send OTP. Please try again." 
      });
    }

    return res.status(201).json({ 
      success: true, 
      message: "Signup successful! OTP sent to your email.",
      userId: newUser._id
    });

  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Server error during signup" 
    });
  }
});

/* =====================
   VERIFY OTP
===================== */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and OTP required" 
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select("+otp +otpExpires");

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Check if OTP expired
    if (!user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(400).json({ 
        success: false, 
        message: "OTP expired. Request a new one." 
      });
    }

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid OTP" 
      });
    }

    // Mark as verified
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    return res.json({ 
      success: true, 
      message: "Email verified successfully" 
    });

  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Server error during OTP verification" 
    });
  }
});

/* =====================
   RESEND OTP
===================== */
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email required" 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    if (user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: "Email already verified" 
      });
    }

    // Generate new OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    // Send OTP
    try {
      await sendOTP(email, otp);
    } catch (emailErr) {
      console.error("Failed to resend OTP:", emailErr);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to send OTP" 
      });
    }

    return res.json({ 
      success: true, 
      message: "OTP sent to your email" 
    });

  } catch (err) {
    console.error("Resend OTP error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

/* =====================
   LOGIN
===================== */
router.post("/login", async (req, res) => {
  try {
    const { identifier, password, role } = req.body;

    if (!identifier || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        message: "Email/username and password required" 
      });
    }

    // Find user (case-insensitive email)
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { idNumber: identifier }
      ]
    }).select("+password");

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Check if email verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        success: false, 
        message: "Email not verified. Complete OTP verification first." 
      });
    }

    // Check role
    if (user.role !== role) {
      return res.status(403).json({ 
        success: false, 
        message: "Role mismatch" 
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Check if teacher is approved
    if (user.role === "teacher" && user.status !== "approved") {
      return res.status(403).json({ 
        success: false, 
        message: "Your account is awaiting admin approval" 
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        idNumber: user.idNumber
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Server error during login" 
    });
  }
});

/* =====================
   FORGOT PASSWORD
===================== */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Valid email required" 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists (prevent email enumeration)
      return res.json({ 
        success: true, 
        message: "If email exists, reset link will be sent" 
      });
    }

    // Generate secure reset token (32 bytes)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = resetHash;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Send reset link (use backend URL for security)
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

    try {
      await sendEmail({
        to: email,
        subject: "Reset Your Password - KNHS Portal",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
              
              <p style="color: #666; line-height: 1.6;">
                We received a password reset request for your KNHS Portal account. Click the button below to reset your password.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="
                  padding: 12px 30px;
                  background-color: #6b21a8;
                  color: white;
                  text-decoration: none;
                  border-radius: 5px;
                  display: inline-block;
                  font-weight: bold;
                ">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                This link will expire in 15 minutes for security reasons.
              </p>
              
              <p style="color: #999; font-size: 12px;">
                If you didn't request this, please ignore this email.
              </p>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Failed to send reset email:", emailErr);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to send reset email" 
      });
    }

    return res.json({ 
      success: true, 
      message: "If email exists, reset link will be sent" 
    });

  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

/* =====================
   RESET PASSWORD
===================== */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Token and new password required" 
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: passwordValidation.message 
      });
    }

    // Hash token to find user
    const resetHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({ 
      resetPasswordToken: resetHash 
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or expired reset token" 
      });
    }

    // Check if token expired
    if (!user.resetPasswordExpires || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ 
        success: false, 
        message: "Reset token expired. Request a new one." 
      });
    }

    // Update password
    const saltRounds = 10;
    user.password = await bcrypt.hash(newPassword, saltRounds);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.json({
      success: true,
      message: "Password reset successful. You can now login with your new password."
    });

  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

module.exports = router;
