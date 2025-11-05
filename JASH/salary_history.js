
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

const salaryBody = document.getElementById("salaryBody");
const searchInput = document.getElementById("searchInput");
const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
const selectAllCheckbox = document.getElementById("selectAll");

const DAILY_RATE_EMP = 600;
const DAILY_RATE_TL = 800;
const addedRecords = new Set();

// Load posted salary history
db.ref("posted_salary_record").once("value", snap => {
  const allRecords = [];

  snap.forEach(child => {
    const rec = child.val();
    const key = child.key;

    if (!rec.startDate || !rec.endDate || !rec.postedAt) return;

    const uniqueId = rec.deploymentId + "_" + rec.name;
    if (!addedRecords.has(uniqueId)) {
      addedRecords.add(uniqueId);
      allRecords.push({
        key: key,
        name: rec.name,
        role: rec.role,
        dailyRate: rec.dailyRate,
        totalDays: rec.totalDays || calculateDays(rec.startDate, rec.endDate),
        startDate: rec.startDate,
        endDate: rec.endDate,
        postedAt: rec.postedAt,
        totalSalary: rec.totalSalary || rec.dailyRate * rec.totalDays
      });
    }
  });

  // ✅ Sort by postedAt descending (latest first)
  allRecords.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));

  // Add rows to table
  allRecords.forEach(record => addRow(record));
});

function addRow(record) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td><input type="checkbox" class="rowSelect" data-key="${record.key}"></td>
    <td>${record.name}</td>
    <td>${record.role}</td>
    <td>₱${record.dailyRate}</td>
    <td>${record.totalDays}</td>
    <td>₱${record.totalSalary.toLocaleString()}</td>
    <td>${record.startDate} to ${record.endDate}</td>
  `;

  salaryBody.appendChild(tr);
}

function calculateDays(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
}

// Search by name
searchInput.addEventListener("input", () => {
  const val = searchInput.value.toLowerCase();
  salaryBody.querySelectorAll("tr").forEach(row => {
    const name = row.cells[1].textContent.toLowerCase();
    row.style.display = name.includes(val) ? "" : "none";
  });
});

// Select all checkboxes
selectAllCheckbox.addEventListener("change", () => {
  const checked = selectAllCheckbox.checked;
  salaryBody.querySelectorAll(".rowSelect").forEach(cb => cb.checked = checked);
});

// Delete selected rows permanently
deleteSelectedBtn.addEventListener("click", () => {
  const selected = Array.from(document.querySelectorAll(".rowSelect:checked"));
  if (!selected.length) return alert("No rows selected.");

  if (!confirm("Are you sure you want to permanently delete selected records?")) return;

  selected.forEach(cb => {
    const key = cb.dataset.key;
    db.ref("posted_salary_record").child(key).remove();
    cb.closest("tr").remove();
  });
});

