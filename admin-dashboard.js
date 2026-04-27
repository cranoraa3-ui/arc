// ============ SIDEBAR TOGGLE ============
const sidebar = document.querySelector(".sidebar");
const menuBtn = document.querySelector("#menuBtn");
const sidebarClose = document.querySelector(".sidebar-close");
const overlay = document.querySelector("#overlay");

function toggleSidebar(open) {
  if (open) {
    sidebar.classList.add("active");
    overlay.classList.add("active");
  } else {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
  }
}

menuBtn.addEventListener("click", () => {
  const isOpen = sidebar.classList.contains("active");
  toggleSidebar(!isOpen);
});

sidebarClose?.addEventListener("click", () => toggleSidebar(false));
overlay.addEventListener("click", () => toggleSidebar(false));

// ============ NAVIGATION ============
document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    
    document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
    link.classList.add("active");
    
    toggleSidebar(false);
  });
});

// ============ NOTIFICATIONS ============
const notificationBtn = document.querySelector("#notificationBtn");
const notificationDropdown = document.querySelector("#notificationDropdown");

notificationBtn.addEventListener("click", () => {
  notificationDropdown.classList.toggle("active");
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".notifications")) {
    notificationDropdown.classList.remove("active");
  }
});

// ============ ALERTS ============
function showAlert(message, type = "info") {
  const alertsContainer = document.querySelector("#alertsContainer");
  const alert = document.createElement("div");
  alert.className = `alert ${type}`;
  alert.innerHTML = `
    <span>${message}</span>
    <button class="alert-close">✕</button>
  `;
  
  alertsContainer.appendChild(alert);
  
  alert.querySelector(".alert-close").addEventListener("click", () => {
    alert.remove();
  });
  
  setTimeout(() => {
    if (alert.parentNode) alert.remove();
  }, 5000);
}

// ============ ACTION BUTTONS ============
document.querySelectorAll("[data-action]").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const action = btn.getAttribute("data-action");
    handleAction(action);
  });
});

function handleAction(action) {
  switch (action) {
    case "create-user":
      showAlert("Opening user creation form...", "info");
      break;
    case "view-users":
      showAlert("Loading user management panel...", "info");
      break;
    case "create-class":
      showAlert("Opening class creation form...", "info");
      break;
    case "view-classes":
      showAlert("Loading classes management...", "info");
      break;
    case "open-grades":
      showAlert("Opening gradebook interface...", "info");
      break;
    case "grade-reports":
      showAlert("Generating grade reports...", "warning");
      break;
    case "create-announce":
      showAlert("Opening announcement composer...", "info");
      break;
    case "view-announces":
      showAlert("Loading announcements...", "info");
      break;
    case "emergency":
      if (confirm("⚠️ Enter system maintenance mode?")) {
        showAlert("System is now in maintenance mode", "danger");
      }
      break;
    case "lockdown":
      if (confirm("🔒 Lock down entire system?")) {
        showAlert("System lockdown initiated", "danger");
      }
      break;
    case "backup":
      showAlert("Starting system backup...", "warning");
      setTimeout(() => {
        showAlert("✅ Backup completed successfully", "success");
      }, 2000);
      break;
    case "security":
      showAlert("Running security scan...", "warning");
      setTimeout(() => {
        showAlert("✅ Security scan complete - No issues found", "success");
      }, 3000);
      break;
    case "attendance-report":
      showAlert("Generating attendance report...", "info");
      break;
    case "performance-report":
      showAlert("Generating performance report...", "info");
      break;
    default:
      showAlert("Action: " + action, "info");
  }
}

// ============ SEARCH ============
const searchInput = document.querySelector("#searchInput");
searchInput?.addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();
  console.log("Searching for:", query);
  // Implement search functionality here
});

// ============ LOG FILTER ============
const logFilter = document.querySelector("#logFilter");
logFilter?.addEventListener("change", (e) => {
  const filter = e.target.value;
  const activityItems = document.querySelectorAll(".activity-item");
  
  activityItems.forEach(item => {
    if (filter === "all") {
      item.style.display = "flex";
    } else {
      item.style.display = item.classList.contains(filter) ? "flex" : "none";
    }
  });
});

// ============ INITIALIZE ============
document.addEventListener("DOMContentLoaded", () => {
  console.log("Admin Dashboard Loaded");
  // Initialize any real-time data here
});

// ============ RESPONSIVE MENU ============
window.addEventListener("resize", () => {
  if (window.innerWidth > 768) {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
  }
});

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

fetch("http://127.0.0.1:5000/api/dashboard/admin", {
  headers: {
    Authorization: "Bearer " + token
  }
})
.then(res => {
  if (!res.ok) {
    window.location.href = "login.html";
  }
});

