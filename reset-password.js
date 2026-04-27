const API_URL = "http://127.0.0.1:5000";

const btn = document.getElementById("btn");
const msg = document.getElementById("msg");
const input = document.getElementById("newPassword");

btn.addEventListener("click", async () => {
  const token = new URLSearchParams(window.location.search).get("token");
  const newPassword = input.value.trim();

  if (!token) return show("Invalid link", "error");
  if (!newPassword) return show("Enter password", "error");

  try {
    btn.disabled = true;
    show("Processing...", "success");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword })
    });

    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    show("Password reset success", "success");

    setTimeout(() => {
      window.location.href = "/login.html";
    }, 1500);

  } catch (err) {
    show(err.message, "error");
  } finally {
    btn.disabled = false;
  }
});

function show(text, type) {
  msg.innerText = text;
  msg.style.color = type === "error" ? "red" : "green";
}

    const container = document.getElementById('stars');
    for (let i = 0; i < 80; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      s.style.cssText = `
        left:${Math.random()*100}%;
        top:${Math.random()*100}%;
        width:${Math.random()*2+1}px;
        height:${Math.random()*2+1}px;
        animation-delay:${Math.random()*4}s;
        animation-duration:${Math.random()*3+2}s;
      `;
      container.appendChild(s);
    }

    function show(text) {
  if (!msgBox) return console.error("msgBox not found in HTML");
  msgBox.innerText = text;
}