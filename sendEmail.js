const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

/* =====================
   SEND EMAIL CORE
===================== */
async function sendEmail({ to, subject, html }) {
  try {
    if (!to || !subject || !html) {
      throw new Error("Missing email fields");
    }

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "KNHS Portal <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    if (error) {
      console.error("EMAIL ERROR:", error);
      return false;
    }

    console.log("EMAIL SENT:", data?.id);
    return true;
  } catch (err) {
    console.error("EMAIL FAILED:", err.message);
    return false;
  }
}

/* =====================
   OTP EMAIL
===================== */
async function sendOTP(email, otp) {
  return sendEmail({
    to: email,
    subject: "KNHS OTP Verification",
    html: `
      <div style="font-family:Arial;padding:20px">
        <h2>OTP Code</h2>
        <h1 style="letter-spacing:6px">${otp}</h1>
        <p>Valid for 5 minutes</p>
      </div>
    `,
  });
}

module.exports = { sendEmail, sendOTP };