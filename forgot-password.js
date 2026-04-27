const btn = document.getElementById("btn");
const msgBox = document.getElementById("msgBox");
const spinner = document.getElementById("spinner");

const API_URL = "http://127.0.0.1:5000";

function showMsg(text, type = "error") {
  msgBox.className = "msg-box " + type;
  msgBox.innerText = text;
}

btn.addEventListener("click", sendReset);

async function sendReset() {
  const email = document.getElementById("email").value.trim();

  if (!email) {
    showMsg("Please enter your email", "error");
    return;
  }

  try {
    btn.disabled = true;
    spinner.classList.remove("hidden");
    showMsg("Sending reset link...", "success");

    // ✅ FIX: point to backend, not Live Server
    const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    // safe JSON handling
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("Server returned invalid response");
    }

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to send reset link");
    }

    showMsg("Check your email for reset link", "success");

  } catch (err) {
    showMsg(err.message, "error");
  } finally {
    btn.disabled = false;
    spinner.classList.add("hidden");
  }
}