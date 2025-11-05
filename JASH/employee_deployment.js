// ==============================
// Employee JS (View + Delete)
// ==============================

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyB1Gbmp2j2cTfnUmuWTjcL2ypauUpQn8Qc",
  authDomain: "jahsportal.firebaseapp.com",
  databaseURL: "https://jahsportal-default-rtdb.firebaseio.com",
  projectId: "jahsportal",
  storageBucket: "jahsportal.firebasestorage.app",
  messagingSenderId: "798312139932",
  appId: "1:798312139932:web:2f6654cdd82a23406ff159"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Elements
const deploymentTable = document.querySelector("#deploymentTable tbody");
const welcome = document.getElementById("welcome");
const logoutBtn = document.getElementById("logoutBtn");

// ---- Logout Function ----
logoutBtn.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "welcome_page.html";
});

// ---- Check LocalStorage Login ----
const userName = localStorage.getItem("userName");
const role = localStorage.getItem("role");

if (!userName || role !== "employee") {
  Swal.fire({
    icon: "error",
    title: "Access Denied",
    text: "Please login as Employee."
  }).then(() => {
    window.location.href = "welcome_page.html";
  });
}

// ---- Show Welcome Message ----
welcome.innerHTML = `<h5>Welcome, ${userName}</h5>`;

// ---- Load Deployments for This Employee ----
db.ref("deployments").on("value", snapshot => {
  deploymentTable.innerHTML = "";

  snapshot.forEach(child => {
    const dep = child.val();
    const depKey = child.key;

    if (dep.employees && dep.employees.includes(userName)) {
      // Create table row
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${dep.teamLeader || "-"}</td>
        <td>${dep.location || "-"}</td>
        <td><button class="btn btn-info btn-sm info-btn" data-key="${depKey}">View Info</button></td>
        <td><button class="btn btn-danger btn-sm delete-btn" data-key="${depKey}">Delete</button></td>
      `;
      deploymentTable.appendChild(row);
    }
  });

  // ---- Info Button ----
  deploymentTable.querySelectorAll(".info-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-key");
      db.ref("deployments/" + key).once("value").then(snap => {
        const data = snap.val();
        Swal.fire({
          title: 'Deployment Details',
          html: `
            <p><strong>Team Leader:</strong> ${data.teamLeader || "-"}</p>
            <p><strong>Employees:</strong> ${data.employees ? data.employees.join(", ") : "-"}</p>
            <p><strong>Location:</strong> ${data.location || "-"}</p>
            <p><strong>Start Date:</strong> ${data.startDate || "-"}</p>
            <p><strong>End Date:</strong> ${data.endDate || "-"}</p>
            <p><strong>Inventory:</strong> ${data.inventory ? data.inventory.map(i => i.qty + " x " + i.name).join("<br>") : "-"}</p>
            <p><strong>Status:</strong> ${data.completed ? "Completed" : data.accepted ? "Accepted" : "Pending"}</p>
            <p><strong>Accepted At:</strong> ${data.acceptedAt || "-"}</p>
            <p><strong>Completed At:</strong> ${data.completedAt || "-"}</p>
          `,
          showCloseButton: true,
          focusConfirm: false,
        });
      });
    });
  });

  // ---- Delete Button ----
  deploymentTable.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-key");

      Swal.fire({
        title: 'Are you sure?',
        text: "This will permanently delete the deployment!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
      }).then((result) => {
        if (result.isConfirmed) {
          db.ref("deployments/" + key).remove()
            .then(() => {
              Swal.fire(
                'Deleted!',
                'The deployment has been deleted.',
                'success'
              );
            })
            .catch(err => {
              Swal.fire(
                'Error!',
                'Failed to delete deployment: ' + err.message,
                'error'
              );
            });
        }
      });
    });
  });
});
