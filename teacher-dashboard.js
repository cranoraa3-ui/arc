const menuBtn = document.getElementById("menuBtn");
const sidebar = document.querySelector(".sidebar");
const overlay = document.getElementById("overlay");
const sidebarClose = document.getElementById("sidebarClose");

function openSidebar() {
  sidebar.classList.add("active");
  overlay.classList.add("active");
  document.body.style.overflow = "hidden"; // Prevent body scroll
}

function closeSidebar() {
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
  document.body.style.overflow = ""; // Restore
}

if (menuBtn) menuBtn.addEventListener("click", openSidebar);
if (sidebarClose) sidebarClose.addEventListener("click", closeSidebar);
if (overlay) overlay.addEventListener("click", closeSidebar);
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeSidebar();
});

// ============ LOGOUT BUTTON (Optional confirmation) ===========
const logoutBtn = document.querySelector('.logout');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    // Optionally, add actual logout logic here
    if (confirm("Are you sure you want to logout?")) {
      window.location.href = "../knhs-website/login.html"; // Or your logout route
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  if (!token || token.split(".").length !== 3) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  }
});

const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

fetch("http://127.0.0.1:5000/api/dashboard/teacher", {
  headers: {
    Authorization: "Bearer " + token
  }
})
.then(res => {
  if (!res.ok) {
    window.location.href = "login.html";
  }
});