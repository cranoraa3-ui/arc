/* =============================================
   KNHS Portal — signup.js  (FIXED)
   Bugs fixed:
   - API URL was /signup  →  now /api/auth/signup
   - messageBox reference worked but msgBox is the new id  →  supports both
   - After signup redirects to verify-otp.html (OTP flow) not login.html
============================================= */

let selectedRole = null;

/* ── MSG HELPER ── works with both id="msgBox" and id="messageBox" ── */
function showMessage(text, type = "error") {
  const box = document.getElementById("msgBox") || document.getElementById("messageBox");
  if (!box) return;
  box.textContent = text;
  box.className = (box.id === "msgBox" ? "msg-box " : "message-box ") + type;
  box.style.display = "block";
}

/* ── ROLE SELECTION ── */
const roleInput = document.getElementById("roleInput");
document.querySelectorAll(".role-btn, .role-card").forEach(card => {
  card.addEventListener("click", () => {
    selectedRole = card.dataset.role;
    document.querySelectorAll(".role-btn, .role-card").forEach(c => c.classList.remove("active"));
    card.classList.add("active");
    if (roleInput) roleInput.value = selectedRole;
  });
});

/* ── PASSWORD STRENGTH ── */
document.getElementById("password")?.addEventListener("input", function () {
  const val  = this.value;
  const fill  = document.getElementById("strengthFill");
  const label = document.getElementById("strengthLabel");
  if (!fill || !label) return;
  if (!val) { fill.style.width = "0%"; label.textContent = ""; return; }
  let score = 0;
  if (val.length >= 8)          score++;
  if (/[A-Z]/.test(val))        score++;
  if (/[0-9]/.test(val))        score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const levels = [
    { pct: "25%", color: "#f0546a", text: "Weak"   },
    { pct: "50%", color: "#fbbf24", text: "Fair"   },
    { pct: "75%", color: "#60a5fa", text: "Good"   },
    { pct: "100%",color: "#34d399", text: "Strong" }
  ];
  const lvl = levels[Math.max(score - 1, 0)];
  fill.style.width      = lvl.pct;
  fill.style.background = lvl.color;
  label.textContent     = lvl.text;
  label.style.color     = lvl.color;
});

/* ── SHOW / HIDE PASSWORD ── */
function setupToggle(btnId, eyeId, inputId) {
  const btn   = document.getElementById(btnId);
  const eye   = document.getElementById(eyeId);
  const input = document.getElementById(inputId);
  if (!btn || !input) return;
  btn.addEventListener("click", () => {
    const hidden = input.type === "password";
    input.type   = hidden ? "text" : "password";
    if (eye) eye.textContent = hidden ? "🙈" : "👁";
  });
}
setupToggle("togglePw1", "eye1", "password");
setupToggle("togglePw2", "eye2", "confirmPassword");

/* ── LOADING ── */
function setLoading(loading) {
  const btn     = document.getElementById("signupBtn");
  const text    = btn?.querySelector(".btn-text");
  const spinner = document.getElementById("signupSpinner");
  if (btn)     btn.disabled          = loading;
  if (text)    text.textContent      = loading ? "Creating account..." : "Create Account";
  if (spinner) spinner.classList.toggle("hidden", !loading);
}

/* ── SUBMIT ── */
const form = document.getElementById("signupForm");
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name            = document.getElementById("name")?.value.trim()            || form.name?.value.trim();
    const email           = document.getElementById("email")?.value.trim()           || form.email?.value.trim();
    const password        = document.getElementById("password")?.value               || form.password?.value;
    const confirmPassword = document.getElementById("confirmPassword")?.value        || form.confirmPassword?.value;
    const yearLevel       = document.getElementById("yearLevel")?.value?.trim()      || form.yearLevel?.value?.trim() || "";
    const terms           = document.getElementById("termsCheck")?.checked;
    const role            = selectedRole || (roleInput?.value);

    if (!role)                        return showMessage("Select a role.");
    if (terms === false)              return showMessage("You must agree to the Terms & Conditions.");
    if (!name)                        return showMessage("Full name is required.");
    if (!email)                       return showMessage("Email is required.");
    if (!password)                    return showMessage("Password is required.");
    if (password.length < 6)          return showMessage("Password must be at least 6 characters.");
    if (password !== confirmPassword) return showMessage("Passwords do not match.");

    setLoading(true);

    try {
      // FIXED: was /signup  →  /api/auth/signup
      const res  = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, yearLevel })
      });
      const data = await res.json();

      if (!res.ok) { showMessage(data.message || "Signup failed."); setLoading(false); return; }

      // Store email so verify-otp page knows who to verify
      sessionStorage.setItem("pending_email", email);

      showMessage(`Account created! Check your email for the OTP code.`, "success");

      // FIXED: redirect to verify-otp (not login) because authRoutes requires OTP verification first
      setTimeout(() => { window.location.href = "verify-otp.html"; }, 1800);

    } catch (err) {
      console.error(err);
      showMessage("Cannot connect to server.");
      setLoading(false);
    }
  });
}