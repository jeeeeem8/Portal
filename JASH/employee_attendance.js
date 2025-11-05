// ==============================
// Employee Attendance JS (Final + Correct CreatedAt)
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

// ---- Initialize Firebase ----
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// ---- Elements ----
const attendanceContainer = document.getElementById("attendanceContainer");
const welcome = document.getElementById("welcome");

// ---- Check Login ----
const employeeName = localStorage.getItem("userName");
const role = localStorage.getItem("role");

if (!employeeName || role !== "employee") {
  alert("Access denied. Please login as Employee.");
  window.location.href = "welcome_page.html";
}

// ---- Welcome Message ----
welcome.innerHTML = `<h6>Welcome, ${employeeName}</h6>`;

// ---- Load Attendance Records (Filtered + De-Duplicated) ----
db.ref("attendance").on("value", snapshot => {
  attendanceContainer.innerHTML = "";
  const monthlyGroups = {};
  const seen = new Set();

  // Temporary map to find createdAt by deploymentId
  const createdAtMap = {};

  // First pass: collect createdAt by deploymentId
  snapshot.forEach(child => {
    const att = child.val();
    if (att.deploymentId && att.createdAt) {
      createdAtMap[att.deploymentId] = att.createdAt;
    }
  });

  // Second pass: process records
  snapshot.forEach(child => {
    const att = child.val();

    const allEmployees = [];
    if (att.employee && typeof att.employee === "string") {
      allEmployees.push(att.employee.trim());
    }
    if (att.employees && Array.isArray(att.employees)) {
      att.employees.forEach(e => {
        if (typeof e === "string") allEmployees.push(e.trim());
      });
    }

    const uniqueEmployees = [...new Set(allEmployees.map(e => e.toLowerCase()))];
    const matchesEmployee = uniqueEmployees.includes(employeeName.toLowerCase());

    if (matchesEmployee) {
      const uniqueKey = `${att.deploymentId || "noId"}-${att.startDate || "noStart"}-${att.endDate || "noEnd"}`;
      if (seen.has(uniqueKey)) return;
      seen.add(uniqueKey);

      // ✅ Use the createdAt from the map if missing
      const finalCreatedAt = att.createdAt || createdAtMap[att.deploymentId] || null;

      // ---- Group by month ----
      const date = att.startDate
        ? new Date(att.startDate + "T00:00:00")
        : finalCreatedAt
        ? new Date(finalCreatedAt)
        : new Date();

      const monthKey = date.toLocaleString("default", {
        month: "long",
        year: "numeric"
      });

      if (!monthlyGroups[monthKey]) monthlyGroups[monthKey] = [];
      monthlyGroups[monthKey].push({ ...att, createdAt: finalCreatedAt });
    }
  });

  const sortedMonths = Object.keys(monthlyGroups).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  if (sortedMonths.length === 0) {
    attendanceContainer.innerHTML = `<p>No attendance records found for you.</p>`;
    return;
  }

  // ---- Display Filtered Attendance ----

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
        <th>Deployment ID</th>
        <th>Employee(s)</th>
        <th>Date Start</th>
        <th>Date End</th>
        <th>Created At</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");

  monthlyGroups[monthName].forEach(att => {
    const createdAtText = att.createdAt
      ? new Date(att.createdAt).toLocaleString()
      : "-";

    const employeesText = Array.isArray(att.employees)
      ? att.employees.join(", ")
      : att.employee || "-";

    tbody.innerHTML += `
      <tr>
        <td>${att.deploymentId || "-"}</td>
        <td>${employeesText}</td>
        <td>${att.startDate || "-"}</td>
        <td>${att.endDate || "-"}</td>
        <td>${createdAtText}</td>
      </tr>
    `;
  });

  monthSection.appendChild(table);
  attendanceContainer.appendChild(monthSection);
});
});
