/* =============================================
   KNHS Portal — login.js  (FIXED)
   Bugs fixed:
   - API URL was /login  →  now /api/auth/login
   - JWT token was never saved  →  now saves knhs_token
   - Works with both .role-btn and .role-card class names
============================================= */

let selectedRole = null;

/* ── ROLE SELECTION ── */
document.querySelectorAll(".role-btn, .role-card").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedRole = btn.dataset.role;
    document.querySelectorAll(".role-btn, .role-card").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.body.classList.remove("student", "teacher", "admin");
    document.body.classList.add(selectedRole);
  });
});

/* ── SHOW / HIDE PASSWORD ── */
const passwordInput = document.getElementById("password");
const togglePw = document.getElementById("togglePw");
if (togglePw && passwordInput) {
  togglePw.addEventListener("click", () => {
    const hidden = passwordInput.type === "password";
    passwordInput.type = hidden ? "text" : "password";
    const eye = document.getElementById("eyeIcon");
    if (eye) eye.textContent = hidden ? "🙈" : "👁";
  });
}

/* ── MSG HELPER ── */
function showMsg(text, type = "error") {
  const box = document.getElementById("msgBox") || document.getElementById("messageBox");
  if (!box) return;
  box.textContent = text;
  box.className = (box.id === "msgBox" ? "msg-box " : "message-box ") + type;
}

/* ── LOADING ── */
function setLoading(loading) {
  const btn = document.getElementById("loginBtn");
  const text = btn?.querySelector(".btn-text");
  const spinner = document.getElementById("loginSpinner");
  if (btn) btn.disabled = loading;
  if (text) text.textContent = loading ? "Signing in..." : "Sign In";
  if (spinner) spinner.classList.toggle("hidden", !loading);
}

/* ── LOGIN ── */
async function login() {
  const identifierEl = document.getElementById("identifier") || document.querySelector('input[type="text"]');
  const passwordEl   = document.getElementById("password")   || document.querySelector('input[type="password"]');
  const identifier   = identifierEl?.value.trim();
  const password     = passwordEl?.value.trim();

  if (!selectedRole)        return showMsg("Please select a role.");
  if (!identifier || !password) return showMsg("Please fill in all fields.");

  setLoading(true);

  try {
    const res  = await fetch("http://localhost:5000/api/auth/login", {   // FIXED URL
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password, role: selectedRole })
    });
    const data = await res.json();

    if (!res.ok) { showMsg(data.message || "Login failed."); setLoading(false); return; }

    // FIXED: save the JWT token so dashboards can verify it
    localStorage.setItem("knhs_token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    showMsg("Login successful! Redirecting...", "success");
    setTimeout(() => {
      if      (data.user.role === "admin")   window.location.href = "admin-dashboard.html";
      else if (data.user.role === "teacher") window.location.href = "teacher-dashboard.html";
      else                                   window.location.href = "student-dashboard.html";
    }, 700);

  } catch (err) {
    console.error(err);
    showMsg("Cannot connect to server.");
    setLoading(false);
  }
}

/* ── ENTER KEY + BUTTON ── */
document.addEventListener("keydown", e => { if (e.key === "Enter") login(); });
document.getElementById("loginBtn")?.addEventListener("click", login);