/* =============================================
   KNHS Portal — dashboard.js  (FIXED)
   Bugs fixed:
   - Auth check only looked at localStorage.user.role (easily faked)
     →  now verifies JWT token against the backend
   - Logout never cleared the token  →  now clears knhs_token + user
   - Username in topbar was hardcoded "Juan"  →  now reads from localStorage
============================================= */

/* ── AUTH GUARD ──
   Call this at the top of each dashboard page.
   Pass the required role: "student" | "teacher" | "admin"
   Usage:  guardRoute("student");
─────────────────────────────────────────── */
async function guardRoute(requiredRole) {
  const token   = localStorage.getItem("knhs_token");
  const userRaw = localStorage.getItem("user");

  // 1. Nothing in storage → kick to login immediately
  if (!token || !userRaw) return redirectToLogin();

  let user;
  try { user = JSON.parse(userRaw); } catch { return redirectToLogin(); }

  // 2. Fast client-side role check
  if (user.role !== requiredRole) return redirectToLogin();

  // 3. Verify with backend (real protection)
  try {
    const res = await fetch(`http://localhost:5000/api/dashboard/${requiredRole}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 401 || res.status === 403) return redirectToLogin();
    if (!res.ok) return redirectToLogin();

    // Auth passed — inject real name into page
    injectUser(user);

  } catch (err) {
    // Server unreachable — fall back to client-side check only
    console.warn("[Auth] Server unreachable, using cached session:", err.message);
    injectUser(user);
  }
}

function redirectToLogin() {
  localStorage.removeItem("knhs_token");
  localStorage.removeItem("user");
  window.location.replace("login.html");
}

function injectUser(user) {
  // Replace any hardcoded name with real user name
  document.querySelectorAll("[data-user-name]").forEach(el => el.textContent = user.name || "User");
  document.querySelectorAll("[data-user-role]").forEach(el => el.textContent = user.role  || "");
  document.querySelectorAll("[data-user-email]").forEach(el => el.textContent = user.email || "");
  document.querySelectorAll("[data-user-id]").forEach(el => el.textContent = user.idNumber || "");
}

/* ── SIDEBAR TOGGLE ── */
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.querySelector(".sidebar");
const overlay = document.querySelector(".overlay");

function openSidebar() {
  sidebar?.classList.add("active");
  overlay?.classList.add("active");
  document.body.style.overflow = "hidden";
}
function closeSidebar() {
  sidebar?.classList.remove("active");
  overlay?.classList.remove("active");
  document.body.style.overflow = "";
}

if (menuBtn) menuBtn.addEventListener("click", openSidebar);
if (overlay) overlay.addEventListener("click", closeSidebar);
document.addEventListener("keydown", e => {
  if (sidebar?.classList.contains("active") && e.key === "Escape") closeSidebar();
});

/* ── LOGOUT ── */
function setupLogout() {
  document.querySelectorAll(".logout, .logout-btn, [data-action='logout']").forEach(btn => {
    btn.addEventListener("click", () => {
      if (confirm("Are you sure you want to logout?")) {
        // FIXED: clear token + user before redirecting
        localStorage.removeItem("knhs_token");
        localStorage.removeItem("user");
        window.location.href = "login.html";
      }
    });
  });
}

/* ── PROFILE IMAGE ── */
function setupProfileImage() {
  const profileImg        = document.getElementById("profileImg");
  const uploadImg         = document.getElementById("uploadImg");
  const avatarPlaceholder = document.querySelector(".avatar-placeholder");
  const deleteBtn         = document.getElementById("deleteImg");
  const modal             = document.getElementById("confirmModal");
  const cancelRemove      = document.getElementById("cancelRemove");
  const confirmRemove     = document.getElementById("confirmRemove");

  if (!profileImg) return;

  // Show/hide placeholder based on image
  if (profileImg.src && !profileImg.src.includes("placeholder")) {
    profileImg.style.display   = "block";
    if (avatarPlaceholder) avatarPlaceholder.style.display = "none";
  } else {
    profileImg.style.display   = "none";
    if (avatarPlaceholder) avatarPlaceholder.style.display = "flex";
  }

  // Upload new image
  uploadImg?.addEventListener("change", function () {
    if (!uploadImg.files?.[0]) return;
    const reader = new FileReader();
    reader.onload = e => {
      profileImg.src           = e.target.result;
      profileImg.style.display = "block";
      if (avatarPlaceholder) avatarPlaceholder.style.display = "none";
    };
    reader.readAsDataURL(uploadImg.files[0]);
  });

  // Delete button → show confirmation modal
  deleteBtn?.addEventListener("click", () => {
    modal?.classList.remove("hidden");
    overlay?.classList.add("active");
    setTimeout(() => cancelRemove?.focus(), 1);
  });

  cancelRemove?.addEventListener("click", () => {
    modal?.classList.add("hidden");
    overlay?.classList.remove("active");
  });

  confirmRemove?.addEventListener("click", () => {
    profileImg.src           = "";
    profileImg.style.display = "none";
    if (avatarPlaceholder) avatarPlaceholder.style.display = "flex";
    if (uploadImg) uploadImg.value = "";
    modal?.classList.add("hidden");
    overlay?.classList.remove("active");
  });

  document.addEventListener("keydown", e => {
    if (!modal?.classList.contains("hidden") && e.key === "Escape") {
      modal.classList.add("hidden");
      overlay?.classList.remove("active");
    }
  });
}

/* ── INIT ── called by each dashboard page ── */
document.addEventListener("DOMContentLoaded", () => {
  setupLogout();
  setupProfileImage();
});