const API_URL = "http://localhost:5000";

/* =====================
   STATE
===================== */
let resendCooldown = false;

/* =====================
   UI HELPERS
===================== */
function showMessage(text, type = "error") {
  const box = document.getElementById("msgBox");

  if (!box) return;

  box.style.display = "block";
  box.textContent = text;

  box.className = "msg-box";

  if (type === "success") box.classList.add("success");
  else if (type === "info") box.classList.add("info");
  else box.classList.add("error");
}

/* =====================
   VERIFY OTP
===================== */
async function verifyOTP() {
  const email = localStorage.getItem("verifyEmail");
  const otpInput = document.getElementById("otp");

  if (!otpInput) return;

  const otp = otpInput.value.trim();

  if (!email) {
    return showMessage("No email found. Please sign up again.", "error");
  }

  if (!otp) {
    return showMessage("Please enter OTP code", "error");
  }

  if (otp.length !== 6) {
    return showMessage("OTP must be 6 digits", "error");
  }

  try {
    showMessage("Verifying OTP...", "info");

    const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp })
    });

    const data = await res.json();

    if (!res.ok) {
      return showMessage(data.message || "Verification failed", "error");
    }

    showMessage("Verified successfully!", "success");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1200);

  } catch (err) {
    console.error(err);
    showMessage("Server error. Try again later.", "error");
  }
}

/* =====================
   RESEND OTP (REAL VERSION)
===================== */
async function resendOTP() {
  const email = localStorage.getItem("verifyEmail");

  if (!email) {
    return showMessage("No email found. Please sign up again.", "error");
  }

  if (resendCooldown) {
    return showMessage("Please wait before resending again.", "info");
  }

  try {
    resendCooldown = true;

    showMessage("Sending new OTP...", "info");

    const res = await fetch(`${API_URL}/api/auth/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (!res.ok) {
      resendCooldown = false;
      return showMessage(data.message || "Failed to resend OTP", "error");
    }

    showMessage("New OTP sent to your email!", "success");

    // cooldown 30 seconds
    setTimeout(() => {
      resendCooldown = false;
    }, 30000);

  } catch (err) {
    console.error(err);
    resendCooldown = false;
    showMessage("Server error. Try again later.", "error");
  }
}