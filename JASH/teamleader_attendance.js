// ==============================
// Attendance (Timesheet) JS
// ==============================

// ---- Firebase Config ----
const firebaseConfig = {
  apiKey: "AIzaSyB1Gbmp2j2cTfnUmuWTjcL2ypauUpQn8Qc",
  authDomain: "jahsportal.firebaseapp.com",
  databaseURL: "https://jahsportal-default-rtdb.firebaseio.com",
  projectId: "jahsportal",
  storageBucket: "jahsportal.firebasestorage.app",
  messagingSenderId: "798312139932",
  appId: "1:798312139932:web:2f6654cdd82a23406ff159"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// ---- Elements ----
const attendanceContainer = document.getElementById("attendanceContainer");
const welcome = document.getElementById("welcome");
const logoutBtn = document.getElementById("logoutBtn");

// ---- Logout ----
logoutBtn.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "welcome_page.html";
});

// ---- Check Login ----
const teamLeaderName = localStorage.getItem("userName");
const role = localStorage.getItem("role");

// TEAMLEADER ACCESS ONLY
if (!teamLeaderName || role !== "teamleader") {
  alert("Access denied. Only Team Leaders can view attendance.");
  window.location.href = "welcome_page.html";
}

// ---- Welcome Message ----
welcome.innerHTML = `<h3>Welcome, ${teamLeaderName}</h3>`;

// ---- Load Accepted Deployments ----
db.ref("deployments").on("value", snapshot => {
  attendanceContainer.innerHTML = "";

  const monthlyGroups = {};

  snapshot.forEach(child => {
    const dep = child.val();

    // Show only accepted deployments for this team leader
    if (dep.teamLeader === teamLeaderName && dep.accepted) {
      // Safely parse start date (primary reference)
      const startDate = dep.startDate
        ? new Date(dep.startDate + "T00:00:00")
        : dep.acceptedAt
        ? new Date(dep.acceptedAt)
        : new Date();

      // Group by month-year of startDate
      const monthKey = startDate.toLocaleString("default", {
        month: "long",
        year: "numeric"
      });

      if (!monthlyGroups[monthKey]) monthlyGroups[monthKey] = [];
      monthlyGroups[monthKey].push(dep);
    }
  });

  const sortedMonths = Object.keys(monthlyGroups).sort((a, b) => {
    return new Date(b) - new Date(a);
  });

  // Render each month in its own table
  sortedMonths.forEach(monthName => {
    const monthSection = document.createElement("div");
    monthSection.classList.add("month-section");

    const title = document.createElement("h3");
    title.textContent = monthName;
    monthSection.appendChild(title);

    const table = document.createElement("table");
    table.classList.add("attendanceTable");
    table.innerHTML = `
      <thead>
        <tr>
          <th>Deployment Location</th>
          <th>Date Start</th>
          <th>Date End</th>
          <th>Accepted At</th>
          <th>Completed At</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");

    monthlyGroups[monthName].forEach(dep => {
      const row = document.createElement("tr");

      const acceptedAtText = dep.acceptedAt
        ? new Date(dep.acceptedAt).toLocaleString()
        : "-";
      const completedAtText = dep.completedAt
        ? new Date(dep.completedAt).toLocaleString()
        : dep.completed
        ? "Completed (no timestamp)"
        : "-";

      row.innerHTML = `
        <td>${dep.location || "-"}</td>
        <td>${dep.startDate || "-"}</td>
        <td>${dep.endDate || "-"}</td>
        <td>${acceptedAtText}</td>
        <td>${completedAtText}</td>
      `;
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    monthSection.appendChild(table);
    attendanceContainer.appendChild(monthSection);
  });

  // Show "no data" message if empty
  if (sortedMonths.length === 0) {
    attendanceContainer.innerHTML = `<p>No accepted deployments yet</p>`;
  }
});
