// ==================== Firebase Config ====================
const firebaseConfig = {
  apiKey: "AIzaSyB1Gbmp2j2cTfnUmuWTjcL2ypauUpQn8Qc",
  authDomain: "jahsportal.firebaseapp.com",
  databaseURL: "https://jahsportal-default-rtdb.firebaseio.com",
  projectId: "jahsportal",
  storageBucket: "jahsportal.firebasestorage.app",
  messagingSenderId: "798312139932",
  appId: "1:798312139932:web:2f6654cdd82a23406ff159"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ==================== Elements & User Info ====================
const payslipContainer = document.querySelector(".container");
const currentUserName = localStorage.getItem("userName") || "";
const currentUserRole = localStorage.getItem("role") || "";

const currentUserSpan = document.getElementById("currentUser");
if (currentUserSpan) currentUserSpan.innerText = currentUserName || "-";

// Buttons
const backBtn = document.getElementById("backBtn");
const logoutBtn = document.getElementById("logoutBtn");
const searchBtn = document.getElementById("searchBtn");
const searchDateInput = document.getElementById("searchDate");

// Restrict access (normalize casing & spacing)
if (!["teamleader", "team leader"].includes(currentUserRole.toLowerCase())) {
  payslipContainer.style.display = "block";
  payslipContainer.innerHTML = "<p style='text-align:center; color:red;'>Access denied. Only Team Leaders can view this page.</p>";
  throw new Error("Access denied: not a Team Leader");
}

// ==================== Load Team Leader Records ====================
let allRecords = [];

db.ref("posted_salary_record").once("value", snapshot => {
  snapshot.forEach(child => {
    const rec = child.val();

    if (!rec.startDate || !rec.endDate || !rec.postedAt) return;

    // ✅ Only Team Leader records
    if ((rec.role || "").toLowerCase() !== "team leader") return;

    // ✅ Only for logged-in Team Leader
    if ((rec.name || "").toLowerCase() !== currentUserName.toLowerCase()) return;

    allRecords.push({
      key: child.key,
      name: rec.name,
      role: rec.role,
      dailyRate: Number(rec.dailyRate) || 0,
      totalDays: Number(rec.totalDays) || 0,
      startDate: rec.startDate,
      endDate: rec.endDate,
      salary: Number(rec.totalSalary) || 0,
      postedDate: rec.postedDate || "Unknown Period",
      postedAt: rec.postedAt // ISO string
    });
  });

  // ✅ Sort records by postedAt descending (latest first)
  allRecords.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));

  // Group by postedDate for rendering
  const grouped = {};
  allRecords.forEach(r => {
    if (!grouped[r.postedDate]) grouped[r.postedDate] = [];
    grouped[r.postedDate].push(r);
  });

  // Render payslips in order (latest first)
  payslipContainer.style.display = "block";
  for (const periodKey of Object.keys(grouped)) {
    renderPayslip(grouped[periodKey], periodKey);
  }

  if (allRecords.length === 0) {
    payslipContainer.innerHTML += `<p style="color:red; text-align:center;">No payroll records found.</p>`;
  }
});

function renderPayslip(records, periodKey) {
  const card = document.createElement("div");
  card.className = "payslip-card";

  let totalSalary = 0;
  records.forEach(r => totalSalary += r.salary);

  const startDates = records.map(r => r.startDate).sort();
  const endDates = records.map(r => r.endDate).sort();
  const periodStart = startDates[0];
  const periodEnd = endDates[endDates.length - 1];

  card.innerHTML = `
    <div class="company-info">
      <h1>Company Name: JAHS Telecon Company</h1>
    </div>
    <h2>Pay Slip (${periodKey})</h2>
    <div class="employee-info">
      <p><strong>Employee:</strong> ${currentUserName}</p>
      <p><strong>Role:</strong> Team Leader</p>
      <p><strong>Period:</strong> ${periodStart} to ${periodEnd}</p>
    </div>
    <table class="payslip-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Rate</th>
          <th>Days</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${records.map(r => `
          <tr>
            <td>${r.name}</td>
            <td>₱${r.dailyRate}</td>
            <td>${r.totalDays}</td>
            <td>₱${r.salary.toLocaleString()}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <div class="totals">
      <p><strong>Total Salary: ₱${totalSalary.toLocaleString()}</strong></p>
    </div>
  `;

  payslipContainer.appendChild(card);
}

// ==================== Buttons ====================
if (backBtn) backBtn.addEventListener("click", () => window.history.back());
if (logoutBtn) logoutBtn.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "index.html"; 
});

// Search by postedDate (month or full date)
if (searchBtn) {
  searchBtn.addEventListener("click", () => {
    const searchVal = searchDateInput.value.trim().toLowerCase(); 
    payslipContainer.innerHTML = `<p>Welcome, <span id="currentUser">${currentUserName}</span></p>`;

    let filtered = allRecords;
    if (searchVal) {
      filtered = allRecords.filter(r => r.postedDate && r.postedDate.toLowerCase().includes(searchVal));
    }

    if (filtered.length === 0) {
      payslipContainer.innerHTML += `<p style="color:red; text-align:center;">No records found for "${searchVal}"</p>`;
      return;
    }

    // Group filtered records
    const grouped = {};
    filtered.forEach(r => {
      if (!grouped[r.postedDate]) grouped[r.postedDate] = [];
      grouped[r.postedDate].push(r);
    });

    // Render grouped filtered records (latest first)
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      const aRec = grouped[a][0];
      const bRec = grouped[b][0];
      return new Date(bRec.postedAt) - new Date(aRec.postedAt);
    });

    sortedKeys.forEach(periodKey => {
      renderPayslip(grouped[periodKey], periodKey);
    });
  });
}
