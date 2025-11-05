const role = localStorage.getItem("role");
const userName = localStorage.getItem("userName");

// =======================
// ACCESS CONTROL
// =======================
if (!role || !userName) {
  alert("You must be logged in first");
  window.location.href = "index.html";
}

if (role !== "admin") {
  alert("Unauthorized access");
  window.location.href = "index.html";
}

// =======================
// ON PAGE LOAD
// =======================
document.addEventListener("DOMContentLoaded", () => {
  // Show welcome message
  const welcomeUser = document.getElementById("welcomeUser");
  if (welcomeUser && userName) {
    welcomeUser.innerText = `Welcome, ${userName}`;
  }

  // Optional second display (ex: header / sidebar)
  const userDisplay = document.getElementById("userDisplay");
  if (userDisplay && userName) {
    userDisplay.textContent = `Welcome, ${userName}`;
  }
});

// =======================
// LOGOUT FUNCTION
// =======================
function logout() {
  localStorage.clear();
  window.location.href = "welcome_page.html";
}
