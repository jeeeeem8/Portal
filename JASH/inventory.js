// ================= Firebase Config =================
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

// ================= Global Variables =================
const addItemForm = document.getElementById("addItemForm");
const inventoryList = document.getElementById("inventoryList");
const searchBar = document.getElementById("searchBar");
let allItems = [];
let currentSort = { key: "name", asc: true };

// ================= Low Inventory Warning =================
function checkLowInventory(items) {
  const lowItems = items.filter(item => item.qty < 50);
  if (lowItems.length > 0) {
    const itemNames = lowItems.map(i => `"${i.name}"`).join(", ");
    Swal.fire({
      icon: "warning",
      title: "Low Inventory Alert",
      html: `The following item(s) is low in stock: <br><b>${itemNames}</b>`,
      confirmButtonText: "OK"
    });
  }
}

// ================= Add Item =================
addItemForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("itemName").value.trim();
  const qty = parseInt(document.getElementById("itemQty").value);
  const unit = document.getElementById("itemUnit").value;
  const user = localStorage.getItem("userName") || "Unknown";

  if (name && qty >= 0) {
    db.ref("inventory").orderByChild("name").equalTo(name).once("value").then(snapshot => {
      let existingItem = null;
      snapshot.forEach(child => {
        const val = child.val();
        if (val.unit === unit) existingItem = { key: child.key, ...val };
      });

      if (existingItem) {
        // Update existing item
        const newQty = existingItem.qty + qty;
        db.ref("inventory/" + existingItem.key).update({ qty: newQty }).then(() => {
          db.ref("inventory_logs").push({
            action: "add",
            itemId: existingItem.itemId,
            itemName: name,
            qtyChange: qty,
            previousQty: existingItem.qty,
            newQty,
            user,
            timestamp: new Date().toISOString()
          });

          Swal.fire("Updated!", `Quantity updated for "${name}".`, "success").then(() => {
            // Check low inventory after update
            db.ref("inventory").once("value").then(snapshot => {
              const updatedItems = [];
              snapshot.forEach(child => updatedItems.push({ id: child.key, ...child.val() }));
              checkLowInventory(updatedItems);
            });
          });
        });
      } else {
        // Add new item
        db.ref("inventory").once("value").then(invSnap => {
          const count = invSnap.numChildren() + 1;
          const itemId = "IT" + count;

          db.ref("inventory/" + itemId).set({ name, qty, unit, itemId }).then(() => {
            db.ref("inventory_logs").push({
              action: "add",
              itemId,
              itemName: name,
              qtyChange: qty,
              previousQty: 0,
              newQty: qty,
              user,
              timestamp: new Date().toISOString()
            });

            Swal.fire("Added!", `"${name}" has been added to inventory.`, "success").then(() => {
              // Check low inventory after adding new item
              db.ref("inventory").once("value").then(snapshot => {
                const updatedItems = [];
                snapshot.forEach(child => updatedItems.push({ id: child.key, ...child.val() }));
                checkLowInventory(updatedItems);
              });
            });
          });
        });
      }

      addItemForm.reset();
    });
  } else {
    Swal.fire("Error", "Please enter valid item details.", "error");
  }
});

// ================= Fetch + Display Items =================
db.ref("inventory").on("value", snapshot => {
  allItems = [];
  snapshot.forEach(child => {
    allItems.push({ id: child.key, ...child.val() });
  });
  checkLowInventory(allItems); // Check low inventory on load
  renderTable(allItems);
});

// ================= Search =================
searchBar.addEventListener("input", () => {
  const query = searchBar.value.toLowerCase();
  const filtered = allItems.filter(i => i.name.toLowerCase().includes(query));
  renderTable(filtered);
});

// ================= Sorting =================
document.querySelectorAll("th[data-sort]").forEach(th => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;
    if (currentSort.key === key) currentSort.asc = !currentSort.asc;
    else { currentSort.key = key; currentSort.asc = true; }
    renderTable([...allItems]);
  });
});

// ================= Render Inventory Table =================
function renderTable(items) {
  items.sort((a, b) => {
    if (a[currentSort.key] < b[currentSort.key]) return currentSort.asc ? -1 : 1;
    if (a[currentSort.key] > b[currentSort.key]) return currentSort.asc ? 1 : -1;
    return 0;
  });

  inventoryList.innerHTML = items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.qty}</td>
      <td>${item.unit}</td>
      <td class="actions">
        <button class="btn-edit" onclick="updateItem('${item.id}','${item.name}',${item.qty},'${item.unit}')">Edit</button>
        <button class="btn-delete" onclick="deleteItem('${item.id}','${item.name}')">Delete</button>
      </td>
    </tr>
  `).join("");
}

// ================= Update Item =================
function updateItem(id, name, currentQty, unit) {
  const user = localStorage.getItem("userName") || "Unknown";

  Swal.fire({
    title: `Update quantity for "${name}" (${unit})`,
    input: "number",
    inputValue: currentQty,
    showCancelButton: true,
    confirmButtonText: "Update",
    inputValidator: (value) => {
      if (!value || isNaN(value) || value < 0) return "Please enter a valid quantity!";
    }
  }).then(result => {
    if (result.isConfirmed) {
      const qtyNum = parseInt(result.value);
      db.ref("inventory/" + id).update({ qty: qtyNum }).then(() => {
        db.ref("inventory_logs").push({
          action: qtyNum > currentQty ? "add" : "deduct",
          itemId: id,
          itemName: name,
          qtyChange: Math.abs(qtyNum - currentQty),
          previousQty: currentQty,
          newQty: qtyNum,
          user,
          timestamp: new Date().toISOString()
        });

        Swal.fire("Updated!", `"${name}" quantity changed to ${qtyNum}.`, "success").then(() => {
          // Check low inventory after quantity update
          db.ref("inventory").once("value").then(snapshot => {
            const updatedItems = [];
            snapshot.forEach(child => updatedItems.push({ id: child.key, ...child.val() }));
            checkLowInventory(updatedItems);
          });
        });
      });
    }
  });
}

// ================= Delete Item =================
function deleteItem(id, name) {
  Swal.fire({
    title: "Are you sure?",
    text: `Delete "${name}" from inventory?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!"
  }).then(result => {
    if (result.isConfirmed) {
      db.ref("inventory/" + id).remove().then(() => {
        Swal.fire("Deleted!", `"${name}" has been removed.`, "success");
      });
    }
  });
}

// ================= Inventory History =================
function showInventoryHistory() {
  const tableBody = document.querySelector("#inventoryHistoryTable tbody");
  tableBody.innerHTML = "";

  db.ref("inventory_logs").orderByChild("timestamp").on("child_added", snapshot => {
    const log = snapshot.val();
    const row = document.createElement("tr");
    const dateTime = new Date(log.timestamp).toLocaleString();

    row.innerHTML = `
      <td>${dateTime}</td>
      <td>${log.user || "Unknown"}</td>
      <td>${log.action}</td>
      <td>${log.itemId || "-"}</td>
      <td>${log.itemName}</td>
      <td>${log.qtyChange}</td>
      <td>${log.previousQty}</td>
      <td>${log.newQty}</td>
    `;
    tableBody.prepend(row);
  });
}

// ================= Toggle History =================
const toggleHistoryBtn = document.getElementById("toggleHistoryBtn");
const historyContainer = document.getElementById("inventoryHistoryContainer");
const historyTableBody = document.querySelector("#inventoryHistoryTable tbody");

toggleHistoryBtn.addEventListener("click", () => {
  if (historyContainer.style.display === "none") {
    historyContainer.style.display = "block";
    toggleHistoryBtn.textContent = "Hide Inventory History";

    historyTableBody.innerHTML = "";
    db.ref("inventory_logs").orderByChild("timestamp").once("value").then(snapshot => {
      snapshot.forEach(child => {
        const log = child.val();
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${new Date(log.timestamp).toLocaleString()}</td>
          <td>${log.user || "Unknown"}</td>
          <td>${log.action}</td>
          <td>${log.itemId || "-"}</td>
          <td>${log.itemName}</td>
          <td>${log.qtyChange}</td>
          <td>${log.previousQty}</td>
          <td>${log.newQty}</td>
        `;
        historyTableBody.appendChild(tr);
      });
    });
  } else {
    historyContainer.style.display = "none";
    toggleHistoryBtn.textContent = "Show Inventory History";
  }
});

// ================= On Page Load =================
window.onload = () => {
  if (typeof loadTeamLeaders === "function") loadTeamLeaders();
  if (typeof handleForm === "function") handleForm();
  if (typeof showDeployments === "function") showDeployments();
  if (typeof removeExpiredDeployments === "function") {
    removeExpiredDeployments();
    setInterval(removeExpiredDeployments, 10 * 60 * 1000);
  }
  showInventoryHistory();
};
