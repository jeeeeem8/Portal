const role = localStorage.getItem("role");
const userName = localStorage.getItem("userName");

document.addEventListener("DOMContentLoaded", () => {
  if (userName) {
    const userDisplay = document.getElementById("userDisplay");
    if (userDisplay) {
      userDisplay.textContent = `Welcome, ${userName}`;
    }
  }
});

// If not logged in at all
if (!role || !userName) {
  alert("You must be logged in first");
  window.location.href = "index.html";
}

// Only allow team leaders
if (role !== "teamleader") {
  alert("Unauthorized access");
  window.location.href = "index.html";
}

// Logout function
function logout() {
  localStorage.clear();
  window.location.href = "welcome_page.html";
}
