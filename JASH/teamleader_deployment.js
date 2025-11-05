// ==============================
// Team Leader JS (Deployment + Report + Cloudinary + Salary + Attendance + Search)
// ==============================

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyB1Gbmp2j2cTfnUmuWTjcL2ypauUpQn8Qc",
  authDomain: "jahsportal.firebaseapp.com",
  databaseURL: "https://jahsportal-default-rtdb.firebaseio.com",
  projectId: "jahsportal",
  storageBucket: "jahsportal.appspot.com",
  messagingSenderId: "798312139932",
  appId: "1:798312139932:web:2f6654cdd82a23406ff159"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Cloudinary Config
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dfmgyugqp/upload";
const CLOUDINARY_UPLOAD_PRESET = "Jahs_report";

// Elements
const deploymentTable = document.querySelector("#deploymentTable tbody");
const salaryTable = document.querySelector("#salaryTable tbody");
const welcome = document.getElementById("welcome");
const logoutBtn = document.getElementById("logoutBtn");

// ---- Logout ----
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "welcome_page.html";
  });
}

// ---- Check Login ----
const teamLeaderName = localStorage.getItem("userName");
const role = localStorage.getItem("role");
if (!teamLeaderName || role !== "teamleader") {
  Swal.fire("Access Denied", "Please login as Team Leader.", "error").then(() => {
    window.location.href = "welcome_page.html";
  });
}
if (welcome) welcome.innerHTML = `<h3>Welcome, ${teamLeaderName}</h3>`;

// ---- Salary + Attendance Creation ----
function createSalaryAndAttendance(depKey, dep) {
  const now = new Date().toISOString();
  const salaryData = {
    deploymentId: depKey,
    teamLeader: dep.teamLeader || teamLeaderName,
    employees: dep.employees || [],
    deploymentDays: dep.deploymentDays || 0,
    startDate: dep.startDate || null,
    endDate: dep.endDate || null,
    createdAt: now,
    status: "pending"
  };
  db.ref("salary").push(salaryData);

  const attendanceData = {
    deploymentId: depKey,
    employees: dep.employees || [],
    startDate: dep.startDate || null,
    endDate: dep.endDate || null,
    deploymentDays: dep.deploymentDays || 0,
    createdAt: now
  };
  db.ref("attendance").push(attendanceData);
}

// ---- Format Date ----
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateStr).toLocaleDateString("en-US", options);
}

// ---- Display Report Images ----
function displayReportImages(row, images) {
  let existingContainer = row.nextSibling;
  if (existingContainer && existingContainer.classList.contains("report-images-row")) {
    existingContainer.remove();
  }
  const imgRow = document.createElement("tr");
  imgRow.classList.add("report-images-row");
  const td = document.createElement("td");
  td.colSpan = 4;
  td.innerHTML = images.map(url => `<img src="${url}" class="report-image img-thumbnail" style="max-height:100px;margin:5px;">`).join("");
  imgRow.appendChild(td);
  row.parentNode.insertBefore(imgRow, row.nextSibling);
}

// ---- Setup Report Button ----
function setupReportButton(reportBtn, depKey, row, dep, callback) {
  reportBtn.addEventListener("click", () => {
    const modal = document.createElement("div");
    modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.5);display:flex;align-items:center;
      justify-content:center;z-index:1000;`;

    const content = document.createElement("div");
    content.style.cssText = `background:#fff;padding:20px;border-radius:10px;
      max-height:80%;overflow-y:auto;width:500px;`;
    modal.appendChild(content);

    const title = document.createElement("h3");
    title.innerText = "Deployment Report";
    content.appendChild(title);

      // Add a paragraph with text below the title
    const textElement = document.createElement("p");
    textElement.innerText = "Reminder Once You submit the report you can not undo or edit.";
    content.appendChild(textElement);

    const reportLabel = document.createElement("label");
    reportLabel.innerText = "Write your report:";
    const reportInput = document.createElement("textarea");
    reportInput.style.cssText = "width:100%;height:100px;margin-bottom:10px;";
    content.appendChild(reportLabel);
    content.appendChild(reportInput);

    const fileLabel = document.createElement("label");
    fileLabel.innerText = "Upload pictures (optional):";
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.multiple = true;
    fileInput.style.display = "block";
    fileInput.style.marginBottom = "10px";
    content.appendChild(fileLabel);
    content.appendChild(fileInput);

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Submit Report";
    saveBtn.className = "btn btn-warning w-100 mt-2";
    content.appendChild(saveBtn);

    saveBtn.addEventListener("click", async () => {
      const reportText = reportInput.value.trim();
      if (!reportText && fileInput.files.length === 0) {
        Swal.fire("Missing Data", "Please add text or at least one image.", "warning");
        return;
      }

      saveBtn.disabled = true;
      saveBtn.textContent = "Uploading...";

      try {
        const uploadedImages = [];
        for (let i = 0; i < fileInput.files.length; i++) {
          const file = fileInput.files[i];
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

          const res = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
          const data = await res.json();
          uploadedImages.push(data.secure_url);
        }

        const now = new Date().toISOString();
        await db.ref("deployment_reports").push({
          deploymentId: depKey,
          teamLeader: teamLeaderName,
          report: reportText,
          images: uploadedImages,
          createdAt: now
        });

        displayReportImages(row, uploadedImages);

        dep.reported = true;
        Swal.fire("Success", "Report submitted successfully!", "success");
        callback();
        modal.remove();
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to submit report. Try again.", "error");
        saveBtn.disabled = false;
        saveBtn.textContent = "Submit Report";
      }
    });

    modal.addEventListener("click", e => { if(e.target===modal) modal.remove(); });
    document.body.appendChild(modal);
  });
}

// ---- Setup Complete Button ----
function setupCompleteButton(completeBtn, depKey, dep, row, callback) {
  completeBtn.addEventListener("click", () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Mark this deployment as completed?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Complete",
      cancelButtonText: "Cancel"
    }).then(result => {
      if (!result.isConfirmed) return;

      const now = new Date().toISOString();
      let deploymentDays = 0;
      if (dep.startDate && dep.endDate) {
        const start = new Date(dep.startDate);
        const end = new Date(dep.endDate);
        deploymentDays = Math.max(1, Math.ceil((end-start)/(1000*60*60*24)));
      }

      db.ref("deployments").child(depKey).update({ completed:true, completedAt:now, deploymentDays });
      createSalaryAndAttendance(depKey, {...dep, deploymentDays});
      dep.completed = true;
      Swal.fire("Success", "Deployment marked as completed and Salary + Attendance created!", "success");
      callback();
      loadSalaryTable();
    });
  });
}

// ---- Render Action Buttons ----
// function renderActionButtons(row, depKey, dep) {
//   const tdActions = row.querySelector(".actions");
//   tdActions.innerHTML = "";

//   if (!dep.accepted) {
//     const acceptBtn = document.createElement("button");
//     acceptBtn.textContent = "Accept";
//     acceptBtn.className = "btn btn-success btn-sm me-2";
//     tdActions.appendChild(acceptBtn);

//     acceptBtn.addEventListener("click", () => {
//       const now = new Date().toISOString();
//       db.ref("deployments").child(depKey).update({ accepted:true, acceptedAt:now }).then(() => {
//         dep.accepted = true;
//         dep.acceptedAt = now;
//         Swal.fire("Accepted", "Deployment accepted!", "success");
//         renderActionButtons(row, depKey, dep);
//       });
//     });

//   } else if (dep.accepted && !dep.reported) {
//     const reportBtn = document.createElement("button");
//     reportBtn.textContent = "Report Status";
//     reportBtn.className = "btn btn-warning btn-sm me-2";
//     tdActions.appendChild(reportBtn);

//     reportBtn.addEventListener("click", () => {
//       Swal.fire({
//         title: "Deployment Report",
//         html: `
//           <p class="mb-2">Reminder Once You submit the report you can not undo or edit.</p>
//           <label>Write your report:</label>
//           <textarea id="report-text" class="form-control mb-2" rows="4"></textarea>
//           <label>Upload pictures (optional):</label>
//           <input type="file" id="report-files" multiple class="form-control mb-2" />
//           <div class="d-flex align-items-center mb-2">
//             <button type="button" id="get-location-btn" class="btn btn-info btn-sm me-2">Get Location</button>
//             <span id="location-coords" style="font-size:0.95em;color:#333;"></span>
//           </div>
//           <input type="hidden" id="report-latitude" />
//           <input type="hidden" id="report-longitude" />
//         `,
//         showCancelButton: true,
//         confirmButtonText: "Submit Report",
//         customClass: { confirmButton: "btn btn-warning", cancelButton: "btn btn-secondary" },
//         buttonsStyling: false,
//         preConfirm: () => {
//           const reportText = document.getElementById("report-text").value;
//           const latitude = document.getElementById("report-latitude").value;
//           const longitude = document.getElementById("report-longitude").value;
//           const files = document.getElementById("report-files").files;
//           return { reportText, latitude, longitude, files };
//         }
//       }).then(result => {
//         if (result.isConfirmed) {
//           const { reportText, latitude, longitude, files } = result.value;

//           // Generate a new key for the report
//           const newReportKey = db.ref().child('deployment_reports').push().key;

//           // Prepare data to save
//           const reportData = {
//             deploymentId: depKey,
//             report: reportText,
//             latitude: latitude ? parseFloat(latitude) : null,
//             longitude: longitude ? parseFloat(longitude) : null,
//             images: [], // You need to implement upload to storage and get URLs
//             teamLeader: dep.teamLeader || 'yourTeamLeaderName', 
//           };

//           // Save report data to Firebase under deployment_reports node
//           db.ref('deployment_reports/' + newReportKey).set(reportData).then(() => {
//             Swal.fire("Report Submitted", "Your report and location (if provided) have been added.", "success");

//             // Optionally update deployment to mark as reported
//             db.ref("deployments").child(depKey).update({ reported: true, reportedAt: new Date().toISOString() });
//             dep.reported = true;
//             renderActionButtons(row, depKey, dep);
//           }).catch((err) => {
//             Swal.fire("Error", "Failed to save the report: " + err.message, "error");
//           });

//           // TODO: Add your file upload handling here to storage, then save URLs to reportData.images
//         }
//       });

//       setTimeout(() => {
//         const getLocationBtn = document.getElementById("get-location-btn");
//         const coordsSpan = document.getElementById("location-coords");
//         getLocationBtn.addEventListener("click", () => {
//           if (!navigator.geolocation) {
//             coordsSpan.textContent = "Geolocation is not supported by your browser.";
//             return;
//           }
//           getLocationBtn.disabled = true;
//           coordsSpan.textContent = "Getting your location via IP address...";
//           // Use IP address geolocation as fallback
//           fetch('https://ipapi.co/json/')
//             .then(response => response.json())
//             .then(data => {
//               const latitude = data.latitude;
//               const longitude = data.longitude;
//               document.getElementById("report-latitude").value = latitude;
//               document.getElementById("report-longitude").value = longitude;
//               coordsSpan.textContent = `Latitude: ${latitude}, Longitude: ${longitude}`;
//               getLocationBtn.disabled = false;
//             })
//             .catch(() => {
//               // If IP API fail, fallback to browser geolocation
//               navigator.geolocation.getCurrentPosition(
//                 (pos) => {
//                   const { latitude, longitude } = pos.coords;
//                   document.getElementById("report-latitude").value = latitude;
//                   document.getElementById("report-longitude").value = longitude;
//                   coordsSpan.textContent = `Latitude: ${latitude}, Longitude: ${longitude}`;
//                   getLocationBtn.disabled = false;
//                 },
//                 (err) => {
//                   coordsSpan.textContent = `Error: ${err.message}`;
//                   getLocationBtn.disabled = false;
//                 },
//                 {
//                   enableHighAccuracy: false,
//                   timeout: 10000,
//                   maximumAge: 0
//                 }
//               );
//             });
//         });
//       }, 0);
//     });

//   } else if (dep.accepted && dep.reported && !dep.completed) {
//     const completeBtn = document.createElement("button");
//     completeBtn.textContent = "Project Complete";
//     completeBtn.className = "btn btn-primary btn-sm me-2";
//     tdActions.appendChild(completeBtn);

//     setupCompleteButton(completeBtn, depKey, dep, row, () => {
//       renderActionButtons(row, depKey, dep);
//     });
//   }

//   const deleteBtn = document.createElement("button");
//   deleteBtn.textContent = "Delete";
//   deleteBtn.className = "btn btn-danger btn-sm";
//   tdActions.appendChild(deleteBtn);

//   deleteBtn.addEventListener("click", () => {
//     Swal.fire({
//       title: "Delete Deployment?",
//       text: "Are you sure you want to remove this deployment from your view?",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonText: "Yes, Delete",
//       cancelButtonText: "Cancel"
//     }).then(result => {
//       if (!result.isConfirmed) return;
//       db.ref("deployments").child(depKey).update({ deletedBy: { ...(dep.deletedBy||{}), [teamLeaderName]: true } });
//       row.remove();
//       Swal.fire("Deleted", "Deployment removed from view.", "success");
//     });
//   });
// }


function renderActionButtons(row, depKey, dep) {
  const tdActions = row.querySelector(".actions");
  tdActions.innerHTML = "";

  if (!dep.accepted) {
    const acceptBtn = document.createElement("button");
    acceptBtn.textContent = "Accept";
    acceptBtn.className = "btn btn-success btn-sm me-2";
    tdActions.appendChild(acceptBtn);

    acceptBtn.addEventListener("click", () => {
      const now = new Date().toISOString();
      db.ref("deployments").child(depKey).update({ accepted: true, acceptedAt: now }).then(() => {
        dep.accepted = true;
        dep.acceptedAt = now;
        Swal.fire("Accepted", "Deployment accepted!", "success");
        renderActionButtons(row, depKey, dep);
      });
    });

  } else if (dep.accepted && !dep.reported) {
    const reportBtn = document.createElement("button");
    reportBtn.textContent = "Report Status";
    reportBtn.className = "btn btn-warning btn-sm me-2";
    tdActions.appendChild(reportBtn);

    reportBtn.addEventListener("click", () => {
      // Utility to format dates
      const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
      };

      const deploymentLocation = dep.location || "Unknown location";
      const deploymentStart = dep.startDate ? formatDate(dep.startDate) : "-";
      const deploymentEnd = dep.endDate ? formatDate(dep.endDate) : "-";
      const reportCreatedAt = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

      Swal.fire({
        title: "Deployment Report",
        html: `
          <p><strong>Deployment Location:</strong> ${deploymentLocation}</p>
          <p><strong>Deployment Start:</strong> ${deploymentStart}</p>
          <p><strong>Deployment End:</strong> ${deploymentEnd}</p>
          <p><strong>Report Created At:</strong> ${reportCreatedAt}</p>
          <p class="mb-2">Reminder Once You submit the report you can not undo or edit.</p>
          <label>Write your report:</label>
          <textarea id="report-text" class="form-control mb-2" rows="4"></textarea>
          <label>Upload pictures (optional):</label>
          <input type="file" id="report-files" multiple class="form-control mb-2" />
          <div class="d-flex align-items-center mb-2">
            <button type="button" id="get-location-btn" class="btn btn-info btn-sm me-2">Get Location</button>
            <span id="location-coords" style="font-size:0.95em;color:#333;"></span>
          </div>
          <input type="hidden" id="report-latitude" />
          <input type="hidden" id="report-longitude" />
        `,
        showCancelButton: true,
        confirmButtonText: "Submit Report",
        customClass: { confirmButton: "btn btn-warning", cancelButton: "btn btn-secondary" },
        buttonsStyling: false,
        preConfirm: () => {
          const reportText = document.getElementById("report-text").value;
          const latitude = document.getElementById("report-latitude").value;
          const longitude = document.getElementById("report-longitude").value;
          const files = document.getElementById("report-files").files;
          return { reportText, latitude, longitude, files };
        }
      }).then(async (result) => {
        if (result.isConfirmed) {
          const { reportText, latitude, longitude, files } = result.value;

          const newReportKey = db.ref().child('deployment_reports').push().key;
          const images = [];

          // Cloudinary upload settings
          const cloudName = "dfmgyugqp"; // your cloud name
          const uploadPreset = "Jahs_report"; // your upload preset

          // Function to upload a single file to Cloudinary
          async function uploadToCloudinary(file) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", uploadPreset);

            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
              method: "POST",
              body: formData,
            });

            if (!response.ok) throw new Error("Image upload failed");

            const data = await response.json();
            return data.secure_url; // uploaded image URL
          }

          try {
            // Upload multiple images sequentially
            for (let i = 0; i < files.length; i++) {
              const url = await uploadToCloudinary(files[i]);
              images.push(url);
            }

            const reportData = {
              deploymentId: depKey,
              report: reportText,
              latitude: latitude ? parseFloat(latitude) : null,
              longitude: longitude ? parseFloat(longitude) : null,
              images: images,
              teamLeader: dep.teamLeader || 'yourTeamLeaderName',
              deploymentLocation: deploymentLocation,
              deploymentStart: dep.startDate || null,
              deploymentEnd: dep.endDate || null,
              reportCreatedAt: new Date().toISOString()
            };

            await db.ref('deployment_reports/' + newReportKey).set(reportData);
            Swal.fire("Report Submitted", "Your report and location (if provided) have been added.", "success");

            await db.ref("deployments").child(depKey).update({ reported: true, reportedAt: new Date().toISOString() });
            dep.reported = true;
            renderActionButtons(row, depKey, dep);

          } catch (err) {
            Swal.fire("Error", "Failed to save the report or upload images: " + err.message, "error");
          }
        }
      });

      setTimeout(() => {
        const getLocationBtn = document.getElementById("get-location-btn");
        const coordsSpan = document.getElementById("location-coords");
        getLocationBtn.addEventListener("click", () => {
          if (!navigator.geolocation) {
            coordsSpan.textContent = "Geolocation is not supported by your browser.";
            return;
          }
          getLocationBtn.disabled = true;
          coordsSpan.textContent = "Getting your location via IP address...";
          fetch('https://ipapi.co/json/')
            .then(response => response.json())
            .then(data => {
              const latitude = data.latitude;
              const longitude = data.longitude;
              document.getElementById("report-latitude").value = latitude;
              document.getElementById("report-longitude").value = longitude;
              coordsSpan.textContent = `Latitude: ${latitude}, Longitude: ${longitude}`;
              getLocationBtn.disabled = false;
            })
            .catch(() => {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const { latitude, longitude } = pos.coords;
                  document.getElementById("report-latitude").value = latitude;
                  document.getElementById("report-longitude").value = longitude;
                  coordsSpan.textContent = `Latitude: ${latitude}, Longitude: ${longitude}`;
                  getLocationBtn.disabled = false;
                },
                (err) => {
                  coordsSpan.textContent = `Error: ${err.message}`;
                  getLocationBtn.disabled = false;
                },
                { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
              );
            });
        });
      }, 0);
    });

  } else if (dep.accepted && dep.reported && !dep.completed) {
    const completeBtn = document.createElement("button");
    completeBtn.textContent = "Project Complete";
    completeBtn.className = "btn btn-primary btn-sm me-2";
    tdActions.appendChild(completeBtn);

    setupCompleteButton(completeBtn, depKey, dep, row, () => {
      renderActionButtons(row, depKey, dep);
    });
  }

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.className = "btn btn-danger btn-sm";
  tdActions.appendChild(deleteBtn);

  deleteBtn.addEventListener("click", () => {
    Swal.fire({
      title: "Delete Deployment?",
      text: "Are you sure you want to remove this deployment from your view?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel"
    }).then(result => {
      if (!result.isConfirmed) return;
      db.ref("deployments").child(depKey).update({ deletedBy: { ...(dep.deletedBy || {}), [teamLeaderName]: true } });
      row.remove();
      Swal.fire("Deleted", "Deployment removed from view.", "success");
    });
  });
}





// ---- Load Deployments ----
function loadDeployments(filters={}) {
  db.ref("deployments").once("value").then(snapshot => {
    deploymentTable.innerHTML = "";
    snapshot.forEach(child => {
      const dep = child.val();
      const depKey = child.key;
      if (dep.deletedBy && dep.deletedBy[teamLeaderName]) return;
      if (dep.teamLeader !== teamLeaderName) return;

      const locationMatch = !filters.location || (dep.location && dep.location.toLowerCase().includes(filters.location.toLowerCase()));
      const startDateMatch = !filters.startDate || (dep.startDate && dep.startDate >= filters.startDate);
      const endDateMatch = !filters.endDate || (dep.endDate && dep.endDate <= filters.endDate);
      if (!locationMatch || !startDateMatch || !endDateMatch) return;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${dep.employees ? dep.employees.join("<br>") : ""}</td>
        <td>${dep.location || ""}</td>
        <td>
          <button class="btn btn-info btn-sm w-100">Info</button>
        </td>
        <td class="actions text-center"></td>
      `;
      deploymentTable.appendChild(row);

      // Info Button (left-aligned text)
      row.querySelector("button").addEventListener("click", () => {
        Swal.fire({
          title: "Deployment Info",
          html: `
            <div style="text-align:left;">
              <b>Start Date:</b> ${formatDate(dep.startDate)}<br>
              <b>End Date:</b> ${formatDate(dep.endDate)}<br>
              <b>Deployment Days:</b> ${dep.deploymentDays || "-"}<br>
              <b>Inventory:</b><br> ${dep.inventory ? dep.inventory.map(i => `${i.qty} × ${i.name}`).join("<br>") : "-"}<br>
              <b>Status:</b> ${dep.completed ? "Completed" : dep.accepted ? "Accepted" : "Pending"}<br>
              <b>Accepted At:</b> ${dep.acceptedAt ? formatDate(dep.acceptedAt) : "-"}<br>
              <b>Completed At:</b> ${dep.completedAt ? formatDate(dep.completedAt) : "-"}
            </div>
          `,
          width: 600,
          customClass: { popup: 'swal-left-align' }
        });
      });

      // Render buttons
      db.ref("deployment_reports").orderByChild("deploymentId").equalTo(depKey).once("value", snap => {
        if (snap.exists()) dep.reported = true;
        renderActionButtons(row, depKey, dep);
      });
    });
  });
}

// ---- Search Filters ----
const searchLocation = document.getElementById("searchLocation");
const searchStartDate = document.getElementById("searchStartDate");
const searchEndDate = document.getElementById("searchEndDate");
const searchBtn = document.getElementById("searchBtn");

if (searchBtn) {
  searchBtn.addEventListener("click", () => {
    loadDeployments({
      location: searchLocation.value,
      startDate: searchStartDate.value,
      endDate: searchEndDate.value
    });
  });
}

// ---- Load Salary Table ----
function loadSalaryTable() {
  if (!salaryTable) return;
  db.ref("salary").on("value", snapshot => {
    salaryTable.innerHTML = "";
    snapshot.forEach(child => {
      const salary = child.val();
      let deploymentMonth = "-";
      if (salary.startDate && salary.endDate) {
        const start = new Date(salary.startDate);
        const end = new Date(salary.endDate);
        const options = { year:"numeric", month:"long", day:"numeric" };
        deploymentMonth = `${start.toLocaleDateString("en-US", options)} - ${end.toLocaleDateString("en-US", options)}`;
      }
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${salary.employees ? salary.employees.join("<br>") : ""}</td>
        <td>${deploymentMonth}</td>
        <td>${salary.deploymentDays || "-"}</td>
        <td><span class="badge bg-warning text-dark">${salary.status || ""}</span></td>
      `;
      salaryTable.appendChild(row);
    });
  });
}

// ---- Initial Load ----
loadDeployments();
loadSalaryTable();
