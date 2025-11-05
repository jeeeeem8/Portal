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

const announcementForm = document.getElementById("announcementForm");
const announcementText = document.getElementById("announcementText");
const announcementsList = document.getElementById("announcementsList");
const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");

const announcementsRef = db.ref("announcements");

// Get current logged in user's info from localStorage
const currentUserName = localStorage.getItem("userName") || "Unknown User";
const currentUserEmail = localStorage.getItem("email") || "Unknown Email";

function renderAnnouncements(snapshot) {
  announcementsList.innerHTML = "";
  const announcements = [];
  snapshot.forEach(childSnapshot => {
    announcements.push({ id: childSnapshot.key, ...childSnapshot.val() });
  });
  announcements.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  announcements.forEach(ann => {
    const div = document.createElement("div");
    div.className = "announcement";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "select-announcement";
    checkbox.style.marginRight = "10px";
    checkbox.setAttribute("data-id", ann.id);

    const textSpan = document.createElement("span");
    textSpan.textContent = ann.text + " ";

    const postedBySpan = document.createElement("small");
    postedBySpan.style.color = "#555";
    postedBySpan.style.marginLeft = "10px";
    postedBySpan.textContent = `(Posted by: ${ann.postedBy || "Unknown"}, ${ann.postedByEmail || "Unknown"})`;

    const timestamp = document.createElement("div");
    timestamp.className = "timestamp";
    timestamp.textContent = new Date(ann.timestamp).toLocaleString();

    div.appendChild(checkbox);
    div.appendChild(textSpan);
    div.appendChild(postedBySpan);
    div.appendChild(timestamp);

    announcementsList.appendChild(div);
  });
}

announcementsRef.on("value", renderAnnouncements);

announcementForm.addEventListener("submit", e => {
  e.preventDefault();
  const text = announcementText.value.trim();
  if (!text) {
    alert("Please write an announcement.");
    return;
  }
  
  announcementsRef.push({
    text,
    timestamp: new Date().toISOString(),
    postedBy: currentUserName,
    postedByEmail: currentUserEmail
  }).then(() => {
    announcementText.value = "";
  }).catch(err => {
    alert("Error posting announcement: " + err.message);
  });
});

deleteSelectedBtn.addEventListener("click", () => {
  const checkedBoxes = document.querySelectorAll(".select-announcement:checked");
  if (checkedBoxes.length === 0) {
    alert("Please select at least one announcement to delete.");
    return;
  }
  if (!confirm(`Delete ${checkedBoxes.length} selected announcement(s)? This cannot be undone.`)) {
    return;
  }
  checkedBoxes.forEach(box => {
    const id = box.getAttribute("data-id");
    if (id) {
      announcementsRef.child(id).remove().catch(err => {
        alert("Error deleting announcement: " + err.message);
      });
    }
  });
});


const backButton = document.getElementById("backButton");
const logoutButton = document.getElementById("logoutButton");

// Back button - goes back to previous page
backButton.addEventListener("click", () => {
  window.history.back();
});

// Logout button - clears localStorage and redirects to login/welcome page
logoutButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to log out?")) {
    localStorage.clear();
    // Change below to your login or welcome page's URL
    window.location.href = "welcome_page.html";
  }
});
