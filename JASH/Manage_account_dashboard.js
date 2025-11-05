const firebaseConfig = {
  apiKey: "AIzaSyB1Gbmp2j2cTfnUmuWTjcL2ypauUpQn8Qc",
  authDomain: "jahsportal.firebaseapp.com",
  projectId: "jahsportal",
  storageBucket: "jahsportal.firebasestorage.app",
  messagingSenderId: "798312139932",
  appId: "1:798312139932:web:2f6654cdd82a23406ff159"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const accountListTableBody = document.querySelector("#accountList tbody");
const addForm = document.getElementById("addForm");

// Generate next sequential account number
async function getNextAccountNumber() {
  const snapshot = await database.ref("accounts").once("value");
  let maxNum = 0;
  snapshot.forEach(child => {
    const accNum = child.val().accountNumber;
    if (accNum) {
      const num = parseInt(accNum.replace("ACC-", ""), 10);
      if (num > maxNum) maxNum = num;
    }
  });
  const nextNum = (maxNum + 1).toString().padStart(3, "0");
  return "ACC-" + nextNum;
}

// Add new account
addForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("newName").value.trim();
  const email = document.getElementById("newEmail").value.trim();
  const password = document.getElementById("newPassword").value;
  const role = document.getElementById("newRole").value;

  if (!email || !password || !role) {
    alert("Please fill in all required fields.");
    return;
  }

  const accountNumber = await getNextAccountNumber();

  database.ref("accounts").push({ name, email, password, role, accountNumber })
    .then(() => {
      alert("Account added.");
      addForm.reset();
      fetchAccounts();
    });
});

// Fetch and display all accounts as table rows
function fetchAccounts() {
  database.ref("accounts").once("value").then(snapshot => {
    accountListTableBody.innerHTML = ""; // Clear existing rows

    snapshot.forEach(child => {
      const id = child.key;
      const account = child.val();

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${account.accountNumber || "-"}</td> <!-- New Column -->
        <td>${account.name || "No Name"}</td>
        <td>${account.email}</td>
        <td>${account.role}</td>
        <td>
          <button 
            class="edit-btn"
            style="background-color: green; color: white; border: none; padding: 5px 10px; cursor: pointer;"
            data-id="${id}"
            data-name="${account.name || ""}"
            data-email="${account.email}"
            data-role="${account.role}"
            data-password="${account.password}"
            data-accountnumber="${account.accountNumber || ""}" <!-- New data attribute -->
          >Edit</button>
          <button 
            onclick="deleteAccount('${id}')"
            style="background-color: red; color: white; border: none; padding: 5px 10px; cursor: pointer;"
          >Delete</button>
        </td>
      `;

      accountListTableBody.appendChild(row);
    });

    // Attach edit event listeners after buttons are rendered
    const editButtons = document.querySelectorAll(".edit-btn");
    editButtons.forEach(button => {
      button.addEventListener("click", function () {
        const id = this.dataset.id;
        const name = this.dataset.name;
        const email = this.dataset.email;
        const role = this.dataset.role;
        const password = this.dataset.password;
        const accountNumber = this.dataset.accountnumber;

        editAccount(id, name, email, role, password, accountNumber);
      });
    });
  });
}

// Edit account
function editAccount(id, name, email, role, password, accountNumber) {
  const newAccountNumber = prompt("Update account number:", accountNumber || "");
  const newName = prompt("Update name:", name || "");
  const newEmail = prompt("Update email:", email);
  const newRole = prompt("Update role:", role);
  const newPassword = prompt("Update password:", password);

  if (newEmail && newRole && newPassword !== null) {
    database.ref("accounts/" + id).update({
      accountNumber: newAccountNumber || accountNumber, // update number
      name: newName || "",
      email: newEmail,
      role: newRole,
      password: newPassword
    }).then(() => {
      alert("Account updated.");
      fetchAccounts();
    });
  }
}

// Delete account
function deleteAccount(id) {
  if (confirm("Are you sure you want to delete this account?")) {
    database.ref("accounts/" + id).remove()
      .then(() => {
        alert("Account deleted.");
        fetchAccounts();
      });
  }
}

// Initial load
window.onload = fetchAccounts;
