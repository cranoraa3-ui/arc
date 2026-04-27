const cron = require("node-cron");

/* =====================
   CLEAN EXPIRED OTPs
===================== */
cron.schedule("*/10 * * * *", async () => {
  try {
    const User = require("../models/User"); // 👈 MOVE INSIDE

    const now = new Date();

    const result = await User.updateMany(
      {
        otpExpires: { $lt: now }
      },
      {
        $set: {
          otp: null,
          otpExpires: null
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`🧹 Cleaned ${result.modifiedCount} expired OTPs`);
    }

  } catch (err) {
    console.error("OTP cleanup error:", err);
  }
});