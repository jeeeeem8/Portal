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

document.getElementById("navbarUserName").innerText = currentUserName || "-";

// Restrict access (normalize casing)
if (currentUserRole.toLowerCase() !== "employee") {
  payslipContainer.style.display = "block";
  payslipContainer.innerHTML = "<p style='text-align:center; color:red;'>Access denied. Only Employees can view this page.</p>";
  throw new Error("Access denied: not an Employee");
}

// ==================== Config ====================
let allRecords = [];

// ==================== Load Records ====================
db.ref("posted_salary_record").once("value", snapshot => {

  snapshot.forEach(child => {
    const rec = child.val();

    if ((rec.role || "").toLowerCase() !== "employee") return;
    if ((rec.name || "").toLowerCase() !== currentUserName.toLowerCase()) return;

    const recordObj = {
      key: child.key,
      name: rec.name,
      role: rec.role,
      dailyRate: Number(rec.dailyRate) || 0,
      totalDays: Number(rec.totalDays) || 0,
      startDate: rec.startDate,
      endDate: rec.endDate,
      salary: Number(rec.totalSalary) || 0,
      postedDate: rec.postedDate || "N/A",
      postedAt: rec.postedAt || new Date().toISOString() // ensure we can sort
    };

    allRecords.push(recordObj);
  });

  // ✅ Sort records by postedAt descending (latest first)
  allRecords.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));

  // Group by postedDate for rendering
  const grouped = groupByPostedDate(allRecords);

  payslipContainer.style.display = "block";
  if (Object.keys(grouped).length > 0) {
    Object.keys(grouped).forEach(postedDate => {
      renderPayslip(grouped[postedDate], postedDate);
    });
  } else {
    payslipContainer.innerHTML += `<p style="color:red; text-align:center;">No payroll records found.</p>`;
  }
});

// ==================== Render Payslip ====================
function renderPayslip(records, postedDate) {
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
    <h2>Pay Slip (${postedDate})</h2>
    <div class="employee-info">
      <p><strong>Employee:</strong> ${currentUserName}</p>
      <p><strong>Role:</strong> Employee</p>
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

// ==================== Search Function ====================
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");

if (searchBtn) {
  searchBtn.addEventListener("click", () => {
    const searchVal = searchInput.value.trim().toLowerCase();
    payslipContainer.innerHTML = "";

    let filtered = allRecords;
    if (searchVal) {
      filtered = allRecords.filter(r =>
        r.postedDate && r.postedDate.toLowerCase().includes(searchVal)
      );
    }

    if (filtered.length === 0) {
      payslipContainer.innerHTML = `<p style="color:red; text-align:center;">No records found for "${searchVal}"</p>`;
      return;
    }

    // ✅ Sort filtered by postedAt descending
    filtered.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));

    const grouped = groupByPostedDate(filtered);
    Object.keys(grouped).forEach(date => {
      renderPayslip(grouped[date], date);
    });
  });
}

// ==================== Helper ====================
function groupByPostedDate(records) {
  const grouped = {};
  records.forEach(r => {
    if (!grouped[r.postedDate]) grouped[r.postedDate] = [];
    grouped[r.postedDate].push(r);
  });
  return grouped;
}
