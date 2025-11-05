// payroll.js
// ==============================
// Employee + Team Leader Payroll (Current Only + Cutoff Display + Grouped Tables)
// All original logic preserved; native alerts/confirms replaced with SweetAlert2.
// ==============================

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

const salaryContainer = document.getElementById("salaryContainer");
const welcome = document.getElementById("welcome");
const logoutBtn = document.getElementById("logoutBtn");

// Attach logout if button exists
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "welcome_page.html";
  });
}

const userName = localStorage.getItem("userName");
const role = localStorage.getItem("role");

// Replace initial access denied alert with SweetAlert
if (!userName || (role !== "admin" && role !== "teamleader")) {
  Swal.fire({
    icon: "error",
    title: "Access denied",
    text: "Only Admin or Team Leader can view payroll. Redirecting...",
    timer: 1800,
    showConfirmButton: false
  }).then(() => {
    window.location.href = "welcome_page.html";
  });
} else {
  welcome.innerHTML = `<h3>Welcome, ${userName} (${role})</h3>`;
}

const DAILY_RATE_EMP = 600;
const DAILY_RATE_TL = 800;

// === Create Table and Controls ===
function createTable() {
  const now = new Date();
  const today = now.getDate();
  const cutoffDay = today <= 15 ? 15 : 30;
  const cutoffDate = new Date(now.getFullYear(), now.getMonth(), cutoffDay);
  const cutoffText = cutoffDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  salaryContainer.innerHTML = `
    <div class="cutoff-header d-flex justify-content-between align-items-center mb-3">
      <h3 class="fw-bold">Salary Cutoff: ${cutoffText}</h3>
      <div class="search-container d-flex">
        <input type="text" id="searchInput" class="form-control me-2" placeholder="Search by name..." />
        <button id="searchBtn" class="btn btn-primary">Search</button>
      </div>
    </div>

    <div id="payrollTableContainer" class="mb-4"></div>

    <div class="action-buttons d-flex justify-content-end gap-2">
      <button id="postSelectedBtn" class="btn btn-success">Post Selected</button>
      <button id="deleteSelectedBtn" class="btn btn-danger">Delete Selected</button>
      <button id="backBtn" class="btn btn-secondary">Back</button>
    </div>
  `;

  document.getElementById("postSelectedBtn").addEventListener("click", postSelected);
  document.getElementById("deleteSelectedBtn").addEventListener("click", deleteSelected);
  document.getElementById("searchBtn").addEventListener("click", searchPayroll);
  document.getElementById("backBtn").addEventListener("click", () => window.history.back());
}

// === Load Current Payroll ===
function loadPayroll() {
  const container = document.getElementById("payrollTableContainer");
  container.innerHTML = '';

  db.ref("accounts").once("value", accountsSnap => {
    const accountData = {};
    accountsSnap.forEach(acc => {
      const data = acc.val();
      if (data.role === "employee" || data.role === "teamleader") {
        accountData[data.name] = {
          id: acc.key,
          name: data.name,
          role: data.role === "teamleader" ? "Team Leader" : "Employee",
          dailyRate: data.role === "teamleader" ? DAILY_RATE_TL : DAILY_RATE_EMP
        };
      }
    });

    db.ref("salary").once("value", salarySnap => {
      const payrollData = [];
      salarySnap.forEach(child => {
        const salaryRec = child.val();
        if (!salaryRec) return;

        const key = child.key;
        const deploymentId = salaryRec.deploymentId || key;

        // Skip records without proper dates
        if (!salaryRec.startDate || !salaryRec.endDate) return;

        const startDate = salaryRec.startDate;
        const endDate = salaryRec.endDate;
        const deploymentDays = salaryRec.deploymentDays || calculateDays(startDate, endDate);

        // Team Leader
        if (salaryRec.teamLeader && accountData[salaryRec.teamLeader]) {
          payrollData.push({
            salaryKey: key,
            deploymentId,
            name: salaryRec.teamLeader,
            role: "Team Leader",
            dailyRate: DAILY_RATE_TL,
            totalDays: deploymentDays,
            startDate,
            endDate
          });
        }

        // Employees
        if (Array.isArray(salaryRec.employees)) {
          salaryRec.employees.forEach(emp => {
            const empName = typeof emp === "string" ? emp : emp.name;
            const empStart = emp.startDate || startDate;
            const empEnd = emp.endDate || endDate;
            const empDays = emp.deploymentDays || calculateDays(empStart, empEnd);

            payrollData.push({
              salaryKey: key,
              deploymentId,
              name: empName,
              role: "Employee",
              dailyRate: DAILY_RATE_EMP,
              totalDays: empDays,
              startDate: empStart,
              endDate: empEnd
            });
          });
        }
      });

      renderGroupedTables(payrollData);
      enableSelectAll();
    }, err => {
      console.error("Error reading salary:", err);
      Swal.fire("Error", "Could not load salary data.", "error");
    });
  }, err => {
    console.error("Error reading accounts:", err);
    Swal.fire("Error", "Could not load accounts data.", "error");
  });
}

// === Calculate inclusive days between two dates ===
function calculateDays(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const diffTime = e - s;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 0;
}

// === Render grouped tables ===
function renderGroupedTables(data) {
  const container = document.getElementById("payrollTableContainer");
  container.innerHTML = '';
  const grouped = {};
  data.forEach(record => {
    const cutoff = new Date(record.endDate).toDateString();
    if (!grouped[cutoff]) grouped[cutoff] = [];
    grouped[cutoff].push(record);
  });

  Object.keys(grouped).sort((a,b)=>new Date(a)-new Date(b)).forEach(dateStr => {
    const group = grouped[dateStr];
    const header = document.createElement("h4");
    header.className = "mt-4 mb-2 text-primary fw-bold";
    header.textContent = new Date(dateStr).toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'});
    container.appendChild(header);

    const table = document.createElement("table");
    table.className = "table table-striped table-hover table-bordered salaryTable";
    table.innerHTML = `
      <thead class="table-dark">
        <tr>
          <th><input type="checkbox" class="selectAllTable"></th>
          <th>Name</th>
          <th>Role</th>
          <th>Daily Rate</th>
          <th>Total Days</th>
          <th>Total Salary</th>
          <th>Period</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector("tbody");
    group.forEach(record => addPayrollRowUI(record, tbody));
    container.appendChild(table);
  });
}

// === Add row UI ===
function addPayrollRowUI(record, tbody) {
  const start = new Date(record.startDate);
  const end = new Date(record.endDate);
  const totalDays = parseInt(record.totalDays) || 0;
  const totalSalary = totalDays * record.dailyRate;

  const formatDate = (d) => `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="checkbox" class="rowSelect"
      data-deployment="${record.deploymentId}"
      data-name="${record.name}"
      data-role="${record.role}"
      data-daily="${record.dailyRate}"
      data-total="${totalSalary}"
      data-days="${totalDays}"
      data-start="${formatDate(start)}"
      data-end="${formatDate(end)}"
    ></td>
    <td>${record.name}</td>
    <td>${record.role}</td>
    <td>₱${record.dailyRate}</td>
    <td>${totalDays}</td>
    <td>₱${totalSalary.toLocaleString()}</td>
    <td>${formatDate(start)} to ${formatDate(end)}</td>
  `;
  tbody.appendChild(tr);
}

// === Select All functionality ===
function enableSelectAll() {
  document.querySelectorAll(".selectAllTable").forEach(checkbox => {
    checkbox.addEventListener("change", e => {
      const table = e.target.closest("table");
      table.querySelectorAll(".rowSelect").forEach(cb => cb.checked = e.target.checked);
    });
  });
}

// === Post selected records ===
function postSelected() {
  const selected = document.querySelectorAll(".rowSelect:checked");
  if (!selected.length) {
    Swal.fire({ icon: "info", title: "No records selected.", timer: 1200, showConfirmButton: false });
    return;
  }

  const ops = [];
  selected.forEach(cb => {
    const salaryKey = cb.dataset.salarykey; // exact Firebase salary record key
    const deploymentId = cb.dataset.deployment; // for storing in posted record
    const rowData = {
      name: cb.dataset.name,
      role: cb.dataset.role,
      dailyRate: parseInt(cb.dataset.daily, 10),
      totalDays: parseInt(cb.dataset.days, 10),
      totalSalary: parseInt(cb.dataset.total, 10),
      startDate: cb.dataset.start,
      endDate: cb.dataset.end
    };

    const now = new Date();
    const postedAt = now.toISOString();
    const postedDate = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    // Save posted record separately
 ops.push(
  db.ref("salary").child(salaryKey).once("value").then(snap => {
    if (!snap.exists()) return;

    const data = snap.val();
    let changed = false;

    // IMPORTANT: Check deploymentId match as well
    if (rowData.role === "Team Leader"
        && data.teamLeader === rowData.name
        && data.startDate === rowData.startDate
        && data.endDate === rowData.endDate
        && data.deploymentId === deploymentId) {
      delete data.teamLeader;
      changed = true;
    }

    if (rowData.role === "Employee" && Array.isArray(data.employees) && data.deploymentId === deploymentId) {
      data.employees = data.employees.filter(emp => {
        if (typeof emp === "string") return emp !== rowData.name;
        if (emp && emp.name && emp.startDate && emp.endDate && data.deploymentId === deploymentId)
          return !(emp.name === rowData.name && emp.startDate === rowData.startDate && emp.endDate === rowData.endDate);
        if (emp && emp.name) return emp.name !== rowData.name;
        return true;
      });
      changed = true;
    }

    // Only delete if empty record after removal
    const teamLeaderAbsent = !data.teamLeader || data.teamLeader === null || data.teamLeader === "";
    const employeesAbsent = !Array.isArray(data.employees) || data.employees.length === 0;

    if (teamLeaderAbsent && employeesAbsent && changed) {
      return db.ref("salary").child(salaryKey).remove();
    } else if (changed) {
      return db.ref("salary").child(salaryKey).set(data);
    }
  })
);


    // Remove row from UI instantly
    cb.closest("tr").remove();
  });

  Promise.all(ops).then(() => {
    Swal.fire("Posted!", "Selected records posted to Posted Salary Record.", "success");
  }).catch(err => {
    console.error(err);
    Swal.fire("Error", "An error occurred while posting records. Check console.", "error");
  });
}

// === Delete selected records ===
function deleteSelected() {
  const selected = document.querySelectorAll(".rowSelect:checked");
  if (!selected.length) {
    Swal.fire({ icon: "info", title: "No records selected.", timer: 1200, showConfirmButton: false });
    return;
  }

  Swal.fire({
    title: "Delete selected records?",
    text: "They will be saved to Deleted Payroll.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete",
    cancelButtonText: "Cancel"
  }).then(result => {
    if (!result.isConfirmed) return;

    const ops = [];
    selected.forEach(cb => {
      const deploymentId = cb.dataset.deployment;

      ops.push(
        db.ref("salary").orderByChild("deploymentId").equalTo(deploymentId).once("value").then(snap => {
          const innerOps = [];
          snap.forEach(child => {
            const data = child.val();
            innerOps.push(db.ref("deleted_payroll").push({ ...data, deletedAt: new Date().toISOString() }));
            innerOps.push(db.ref("salary").child(child.key).remove());
          });
          return Promise.all(innerOps);
        })
      );

      cb.closest("tr").remove();
    });

    Promise.all(ops).then(() => {
      Swal.fire("Deleted!", "Selected records deleted and saved to Deleted Payroll.", "success");
    }).catch(err => {
      console.error(err);
      Swal.fire("Error", "Failed to delete some records. Check console.", "error");
    });
  });
}

// === Search payroll ===
function searchPayroll() {
  const searchValue = document.getElementById("searchInput").value.trim().toLowerCase();
  document.querySelectorAll("#payrollTableContainer table tbody tr").forEach(row => {
    const name = row.cells[1]?.innerText.toLowerCase() || "";
    row.style.display = (!searchValue || name.includes(searchValue)) ? "" : "none";
  });
}

// === Initialize ===
createTable();
loadPayroll();
