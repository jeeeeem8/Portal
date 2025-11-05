// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyB1Gbmp2j2cTfnUmuWTjcL2ypauUpQn8Qc",
  authDomain: "jahsportal.firebaseapp.com",
  projectId: "jahsportal",
  storageBucket: "jahsportal.firebasestorage.app",
  messagingSenderId: "798312139932",
  appId: "1:798312139932:web:2f6654cdd82a23406ff159",
  databaseURL: "https://jahsportal-default-rtdb.firebaseio.com"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const teamLeaderSelect = document.getElementById("teamLeader");
const employeeContainer = document.getElementById("employeeContainer");
const inventoryContainer = document.getElementById("inventoryContainer");
const deploymentForm = document.getElementById("deploymentForm");
const deploymentTable = document.querySelector("#deploymentTable tbody");
const completedTable = document.querySelector("#completedDeploymentTable tbody");

// ----------------- Load Team Leaders -----------------
function loadTeamLeaders() {
  db.ref("accounts").orderByChild("role").equalTo("teamleader").once("value").then(snapshot => {
    teamLeaderSelect.innerHTML = "<option value=''>-- Select Team Leader --</option>";
    snapshot.forEach(child => {
      const acc = child.val();
      const option = document.createElement("option");
      option.value = acc.name || acc.email;
      option.textContent = acc.name || acc.email;
      teamLeaderSelect.appendChild(option);
    });
  });
}

// ----------------- Load Employees -----------------
function loadEmployees() {
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Search employee...";
  employeeContainer.innerHTML = "";
  employeeContainer.appendChild(searchInput);
  const suggestions = document.createElement("div");
  employeeContainer.appendChild(suggestions);
  const selectedList = document.createElement("ul");
  employeeContainer.appendChild(selectedList);

  let employees = [];
  let selectedEmployees = [];

  db.ref("accounts").orderByChild("role").equalTo("employee").once("value").then(snapshot => {
    employees = [];
    snapshot.forEach(child => {
      employees.push(child.val().name || child.val().email);
    });
  });

  searchInput.addEventListener("focus", () => showSuggestions(employees));
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    showSuggestions(query ? employees.filter(e => e.toLowerCase().includes(query)) : employees);
  });

  function showSuggestions(list) {
    suggestions.innerHTML = "";
    list.forEach(emp => {
      const div = document.createElement("div");
      div.textContent = emp;
      div.classList.add("suggestion-item");
      div.style.padding = "6px";
      div.style.cursor = "pointer";
      div.style.borderBottom = "1px solid #ddd";
      div.addEventListener("click", () => {
        if (selectedEmployees.length >= 5) {
  Swal.fire({
    icon: "warning",
    title: "Limit reached",
    text: "You can only select up to 5 employees.",
    confirmButtonColor: "#f59e0b"
  });
  return;
}
        if (!selectedEmployees.includes(emp)) {
          selectedEmployees.push(emp);
          updateSelectedList();
        }
        searchInput.value = "";
        suggestions.innerHTML = "";
      });
      suggestions.appendChild(div);
    });
  }

  function updateSelectedList() {
    selectedList.innerHTML = "";
    selectedEmployees.forEach(emp => {
      const li = document.createElement("li");
      li.textContent = emp;
      li.style.listStyle = "none";
      li.style.marginBottom = "4px";
      const removeBtn = document.createElement("span");
      removeBtn.textContent = "     Remove";
      removeBtn.classList.add("remove-btn");
      removeBtn.style.cursor = "pointer";
      removeBtn.style.color = "red";
      removeBtn.addEventListener("click", () => {
        selectedEmployees = selectedEmployees.filter(e => e !== emp);
        updateSelectedList();
      });
      li.appendChild(removeBtn);
      selectedList.appendChild(li);
    });
  }

  return { selectedEmployees, updateSelectedList };
}

// ----------------- Load Inventory -----------------
function loadInventory() {
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Search inventory...";
  inventoryContainer.innerHTML = "";
  inventoryContainer.appendChild(searchInput);
  const suggestions = document.createElement("div");
  inventoryContainer.appendChild(suggestions);
  const selectedList = document.createElement("ul");
  inventoryContainer.appendChild(selectedList);

  let inventoryItems = [];
  let selectedInventory = [];

  db.ref("inventory").once("value").then(snapshot => {
    inventoryItems = [];
    snapshot.forEach(child => {
      inventoryItems.push({ id: child.key, ...child.val() });
    });
  });

  searchInput.addEventListener("focus", () => showSuggestions(inventoryItems));
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    showSuggestions(query ? inventoryItems.filter(i => i.name.toLowerCase().includes(query)) : inventoryItems);
  });

  function showSuggestions(list) {
    suggestions.innerHTML = "";
    list.forEach(item => {
      const div = document.createElement("div");
      div.textContent = `${item.name} (${item.qty} ${item.unit})`;
      div.classList.add("suggestion-item");
      div.style.padding = "6px";
      div.style.cursor = "pointer";
      div.style.borderBottom = "1px solid #ddd";
      div.addEventListener("click", () => {
        if (!selectedInventory.find(i => i.id === item.id)) {
  Swal.fire({
    title: `Enter Quantity for "${item.name}"`,
    text: `Available: ${item.qty}`,
    input: "number",
    inputAttributes: {
      min: 1,
      max: item.qty,
      step: 1
    },
    inputValue: 1,
    confirmButtonText: "Add",
    confirmButtonColor: "#3a4bbf",
    showCancelButton: true,
    cancelButtonColor: "#d33",
    inputValidator: (value) => {
      if (!value || value <= 0 || value > parseInt(item.qty)) {
        return "Please enter a valid quantity within available range!";
      }
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const qty = parseInt(result.value);
      selectedInventory.push({ ...item, qtyUsed: qty });
      updateSelectedList();
      Swal.fire({
        icon: "success",
        title: "Item Added!",
        text: `${qty} x "${item.name}" added to deployment.`,
        confirmButtonColor: "#3a4bbf",
        timer: 1500,
        showConfirmButton: false
      });
    }
  });
} else {
  Swal.fire({
    icon: "info",
    title: "Already Added",
    text: `"${item.name}" is already in the deployment list.`,
    confirmButtonColor: "#3a4bbf"
  });
        }
        searchInput.value = "";
        suggestions.innerHTML = "";
      });
      suggestions.appendChild(div);
    });
  }

  function updateSelectedList() {
    selectedList.innerHTML = "";
    selectedInventory.forEach(inv => {
      const li = document.createElement("li");
      li.textContent = `${inv.qtyUsed} x ${inv.name}`;
      li.style.listStyle = "none";
      li.style.marginBottom = "4px";
      const removeBtn = document.createElement("span");
      removeBtn.textContent = "     Remove";
      removeBtn.classList.add("remove-btn");
      removeBtn.style.padding = "5px"
      removeBtn.style.cursor = "pointer";
      removeBtn.style.color = "red";
      removeBtn.addEventListener("click", () => {
        selectedInventory = selectedInventory.filter(i => i.id !== inv.id);
        updateSelectedList();
      });
      li.appendChild(removeBtn);
      selectedList.appendChild(li);
    });
  }

  return { selectedInventory, updateSelectedList };
  }

  // ----------------- Handle Form Submit -----------------
  function handleForm() {
  const { selectedEmployees, updateSelectedList: updateEmpList } = loadEmployees();
  const { selectedInventory, updateSelectedList: updateInvList } = loadInventory();

  deploymentForm.addEventListener("submit", e => {
    e.preventDefault();

    if (!selectedEmployees.length) {
      alert("Select employees.");
      return;
    }
    if (!selectedInventory.length) {
      alert("Select inventory.");
      return;
    }

    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const todayISO = new Date().toISOString().split("T")[0];

    if (startDate < todayISO) {
      Swal.fire({
        icon: "error",
        title: "Invalid Start Date",
        text: "Start date cannot be before today.",
        confirmButtonColor: "#dc2626"
      });
      return;
    }

    if (endDate < startDate) {
      Swal.fire({
        icon: "error",
        title: "Invalid End Date",
        text: "End date cannot be before the start date.",
        confirmButtonColor: "#dc2626"
      });
      return;
    }

    let deploymentDays = 0;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end - start;
      deploymentDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    const inventoryForDB = selectedInventory.map(i => ({
      id: i.id,
      name: i.name,
      unit: i.unit,
      qty: i.qtyUsed
    }));

    const deployment = {
      teamLeader: teamLeaderSelect.value,
      employees: selectedEmployees,
      location: document.getElementById("location").value,
      startDate,
      endDate,
      deploymentDays,
      inventory: inventoryForDB,
      accepted: false,
      acceptedAt: "",
      completed: false,
      completedAt: ""
    };

    // ✅ Updated inventory deduction with logging
    selectedInventory.forEach(i => {
      const newQty = parseInt(i.qty) - parseInt(i.qtyUsed);
      db.ref("inventory").child(i.id).update({ qty: newQty }).then(() => {
        db.ref("inventory_logs").push({
          action: "deduct",
          itemId: i.id,
          itemName: i.name,
          qtyChange: i.qtyUsed,
          previousQty: i.qty,
          newQty,
          user: localStorage.getItem("userName") || "Unknown",
          timestamp: new Date().toISOString()
        });
      });
    });

    // Push deployment
    const newDepRef = db.ref("deployments").push();
    newDepRef.set(deployment).then(() => {
      // Create Attendance records
      selectedEmployees.forEach(emp => {
        db.ref("attendance").push({
          deploymentId: newDepRef.key,
          employee: emp,
          days: deploymentDays,
          startDate,
          endDate
        });
      });

      // Create Salary record
      db.ref("salary").push({
        createdAt: new Date().toISOString(),
        deploymentId: newDepRef.key,
        employees: selectedEmployees,
        status: "pending",
        teamLeader: teamLeaderSelect.value
      });

      Swal.fire({
        title: "Deployment Saved!",
        html: `
          <lord-icon
          src="https://cdn.lordicon.com/byupthur.json"
          trigger="loop"
          colors="primary:#4030e8,secondary:#110a5c"
          style="width:250px;height:250px">
          </lord-icon>
          <p style="margin-top:15px; font-size:16px; color:#065f46;">
            Deployment successfully created for <b>${deploymentDays}</b> days.
          </p>
        `,
        background: "#ffffffff",
        showConfirmButton: true,
        confirmButtonColor: "#10b981"
      });
      deploymentForm.reset();
      selectedEmployees.length = 0;
      selectedInventory.length = 0;
      updateEmpList();
      updateInvList();
    });
  });
}

// ----------------- Edit Inventory -----------------
function editDeployment(deployment, key) {
  // Create modal
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed; top:0; left:0; width:100%; height:100%;
    background-color: rgba(0, 0, 0, 0.5);
    display:flex; align-items:center; justify-content:center; z-index:1000;
  `;
  const content = document.createElement("div");
  content.style.cssText = `
    background-color: #fff; padding:20px; border-radius:10px;
    max-height:80%; overflow-y:auto; width:500px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  `;
  modal.appendChild(content);

  // Title
  const title = document.createElement("h3");
  title.innerText = "Edit Deployment";
  title.style.color = "#2563eb"; // Blue color
  title.style.marginBottom = "20px";
  content.appendChild(title);

  // --- Team Leader Dropdown ---
  const tlLabel = document.createElement("label");
  tlLabel.innerText = "Assigned Team Leader:";
  tlLabel.style.fontWeight = "600";
  tlLabel.style.display = "block";
  tlLabel.style.marginTop = "10px";
  content.appendChild(tlLabel);

  const tlSelect = document.createElement("select");
  tlSelect.style.width = "100%";
  tlSelect.style.marginBottom = "15px";
  tlSelect.style.padding = "8px";
  tlSelect.style.borderRadius = "6px";
  tlSelect.style.border = "1px solid #ccc";
  content.appendChild(tlSelect);

  // Populate team leaders from database
  db.ref("accounts").orderByChild("role").equalTo("teamleader").once("value").then(snapshot => {
    tlSelect.innerHTML = "<option value=''>-- Select Team Leader --</option>";
    snapshot.forEach(child => {
      const tl = child.val();
      const opt = document.createElement("option");
      opt.value = tl.name || tl.email;
      opt.textContent = tl.name || tl.email;
      if (opt.value === deployment.teamLeader) opt.selected = true;
      tlSelect.appendChild(opt);
    });
  });

  // --- Employees Multi-Select ---
  const empLabel = document.createElement("label");
  empLabel.innerText = "Employees (max 5):";
  empLabel.style.fontWeight = "600";
  empLabel.style.display = "block";
  empLabel.style.marginTop = "10px";
  content.appendChild(empLabel);

  const empContainer = document.createElement("div");
  empContainer.style.border = "1px solid #ccc";
  empContainer.style.borderRadius = "6px";
  empContainer.style.padding = "10px";
  empContainer.style.maxHeight = "150px";
  empContainer.style.overflowY = "auto";
  empContainer.style.marginBottom = "15px";
  content.appendChild(empContainer);

  const empSearch = document.createElement("input");
  empSearch.type = "text";
  empSearch.placeholder = "Search employee...";
  empSearch.style.width = "100%";
  empSearch.style.marginBottom = "8px";
  empSearch.style.padding = "8px";
  empSearch.style.borderRadius = "6px";
  empSearch.style.border = "1px solid #ccc";
  empContainer.appendChild(empSearch);

  const empSuggestions = document.createElement("div");
  empSuggestions.style.maxHeight = "100px";
  empSuggestions.style.overflowY = "auto";
  empContainer.appendChild(empSuggestions);

  const empSelectedList = document.createElement("ul");
  empSelectedList.style.paddingLeft = "0";
  empSelectedList.style.marginTop = "6px";
  empContainer.appendChild(empSelectedList);

  let allEmployees = [];
  // Defensive copy of employees array (empty array fallbacks)
  let selectedEmployees = Array.isArray(deployment.employees) ? [...deployment.employees] : [];

 // Replace employee loading with explicit val access and clearing the array first
db.ref("accounts").orderByChild("role").equalTo("employee").once("value").then(snapshot => {
  allEmployees = [];  // clear array first
  snapshot.forEach(child => {
    const val = child.val();
    if(val && (val.name || val.email)) {
      allEmployees.push(val.name || val.email);
    }
  });
  allEmployees.sort();
  renderSelectedEmployees();
});

  function renderSelectedEmployees() {
    empSelectedList.innerHTML = "";
    selectedEmployees.forEach(emp => {
      const li = document.createElement("li");
      li.style.listStyle = "none";
      li.style.marginBottom = "6px";
      li.style.padding = "6px 10px";
      li.style.backgroundColor = "#e0f2fe"; // Light blue background
      li.style.borderRadius = "6px";
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.alignItems = "center";

      const spanText = document.createElement("span");
      spanText.textContent = emp;
      li.appendChild(spanText);

      const removeBtn = document.createElement("span");
      removeBtn.textContent = "❌";
      removeBtn.style.cursor = "pointer";
      removeBtn.style.color = "#ef4444"; // Red color
      removeBtn.style.marginLeft = "10px";
      removeBtn.addEventListener("click", () => {
  if (selectedEmployees.length <= 1) {
    Swal.fire({
      icon: "warning",
      title: "At least one employee required",
      text: "You cannot remove all employees. Please keep at least one employee assigned.",
      confirmButtonColor: "#fbbf24" // Amber color for example
    });
    return; // Skip removing
  }
  selectedEmployees = selectedEmployees.filter(e => e !== emp);
  renderSelectedEmployees();
});
      li.appendChild(removeBtn);

      empSelectedList.appendChild(li);
    });
  }

  empSearch.addEventListener("input", () => {
    const query = empSearch.value.toLowerCase();
    empSuggestions.innerHTML = "";
    allEmployees
      .filter(e => e.toLowerCase().includes(query) && !selectedEmployees.includes(e))
      .slice(0, 5)
      .forEach(emp => {
        const div = document.createElement("div");
        div.textContent = emp;
        div.style.padding = "8px";
        div.style.cursor = "pointer";
        div.style.borderBottom = "1px solid #ddd";
        div.style.backgroundColor = "#f9fafb"; // Light gray background
        div.addEventListener("click", () => {
          if (selectedEmployees.length < 5) {
            selectedEmployees.push(emp);
            renderSelectedEmployees();
            empSearch.value = "";
            empSuggestions.innerHTML = "";
          } else Swal.fire({
            icon: "error",
            title: "Maximum of 5 Employees",
            text: "You have entered more than 5 Employees.",
            confirmButtonColor: "#dc2626"
          });
        });
        empSuggestions.appendChild(div);
      });
  });


  // --- Location ---
  const locLabel = document.createElement("label");
  locLabel.innerText = "Deployment Location:";
  locLabel.style.fontWeight = "600";
  locLabel.style.display = "block";
  locLabel.style.marginTop = "10px";
  content.appendChild(locLabel);

  const locInput = document.createElement("input");
  locInput.type = "text";
  locInput.value = deployment.location;
  locInput.style.width = "100%";
  locInput.style.marginBottom = "15px";
  locInput.style.padding = "8px";
  locInput.style.borderRadius = "6px";
  locInput.style.border = "1px solid #ccc";
  content.appendChild(locInput);

  // --- Start / End Dates ---
  const startLabel = document.createElement("label");
  startLabel.innerText = "Start Date:";
  startLabel.style.fontWeight = "600";
  startLabel.style.display = "block";
  startLabel.style.marginTop = "10px";
  content.appendChild(startLabel);

  const startInput = document.createElement("input");
  startInput.type = "date";
  startInput.value = deployment.startDate;
  startInput.style.width = "100%";
  startInput.style.marginBottom = "15px";
  startInput.style.padding = "8px";
  startInput.style.borderRadius = "6px";
  startInput.style.border = "1px solid #ccc";
  content.appendChild(startInput);

  const endLabel = document.createElement("label");
  endLabel.innerText = "End Date:";
  endLabel.style.fontWeight = "600";
  endLabel.style.display = "block";
  endLabel.style.marginTop = "10px";
  content.appendChild(endLabel);

  const endInput = document.createElement("input");
  endInput.type = "date";
  endInput.value = deployment.endDate;
  endInput.style.width = "100%";
  endInput.style.marginBottom = "15px";
  endInput.style.padding = "8px";
  endInput.style.borderRadius = "6px";
  endInput.style.border = "1px solid #ccc";
  content.appendChild(endInput);


// rrr
const todayStr = new Date().toISOString().split("T")[0];
startInput.min = todayStr;
if (startInput.value < todayStr) {
  startInput.value = todayStr; // reset if it is earlier
}

  // DATE CONSTRAINTS: start date <= end date
  startInput.addEventListener("change", () => {
    if (startInput.value && endInput.value && endInput.value < startInput.value) {
      endInput.value = startInput.value;
    }
    endInput.min = startInput.value;
  });
  endInput.addEventListener("change", () => {
    if (startInput.value && endInput.value && startInput.value > endInput.value) {
      startInput.value = endInput.value;
    }
    startInput.max = endInput.value;
  });

  // --- Inventory ---
  const invLabel = document.createElement("label");
  invLabel.innerText = "Inventory:";
  invLabel.style.fontWeight = "600";
  invLabel.style.display = "block";
  invLabel.style.marginTop = "10px";
  content.appendChild(invLabel);

  // Inventory search input and suggestions container
  const invSearch = document.createElement("input");
  invSearch.type = "text";
  invSearch.placeholder = "Search inventory to add...";
  invSearch.style.width = "100%";
  invSearch.style.marginBottom = "8px";
  invSearch.style.padding = "8px";
  invSearch.style.borderRadius = "6px";
  invSearch.style.border = "1px solid #ccc";
  content.appendChild(invSearch);

  const invSuggestions = document.createElement("div");
  invSuggestions.style.maxHeight = "120px";
  invSuggestions.style.overflowY = "auto";
  invSuggestions.style.border = "1px solid #ddd";
  invSuggestions.style.borderRadius = "6px";
  invSuggestions.style.marginBottom = "15px";
  content.appendChild(invSuggestions);

  const invContainer = document.createElement("div");
  invContainer.style.marginBottom = "15px";
  invContainer.style.border = "1px solid #ccc";
  invContainer.style.borderRadius = "6px";
  invContainer.style.padding = "12px";
  content.appendChild(invContainer);

  let allInventory = [];
  // Defensive clone of inventory list:
  deployment.inventory = Array.isArray(deployment.inventory) ? deployment.inventory.slice() : [];

  // Replace inventory loading with clearing array and explicit fields
db.ref("inventory").once("value").then(snapshot => {
  allInventory = [];
  snapshot.forEach(child => {
    const val = child.val();
    if(val && val.name && val.unit) {
      allInventory.push({ id: child.key, name: val.name, unit: val.unit });
    }
  });
  allInventory.sort((a,b) => a.name.localeCompare(b.name));
  renderInventoryList();
});

  function renderInventoryList() {
    invContainer.innerHTML = "";
    deployment.inventory.forEach((item, idx) => {
      const invRow = document.createElement("div");
      invRow.style.marginBottom = "10px";
      invRow.style.display = "flex";
      invRow.style.alignItems = "center";
      invRow.style.justifyContent = "space-between";

      const label = document.createElement("span");
      label.textContent = `${item.name} (${item.unit}):`;
      label.style.fontWeight = "600";
      invRow.appendChild(label);

      const qtyInput = document.createElement("input");
      qtyInput.type = "number";
      qtyInput.value = item.qty;
      qtyInput.min = "0";
      qtyInput.style.width = "80px";
      qtyInput.style.padding = "6px";
      qtyInput.style.borderRadius = "6px";
      qtyInput.style.border = "1px solid #ccc";
      qtyInput.setAttribute("data-index", idx);
      invRow.appendChild(qtyInput);

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "Remove";
      removeBtn.className = "btn btn-danger btn-sm ms-2";
      removeBtn.style.flexShrink = "0";
      removeBtn.addEventListener("click", () => {
        deployment.inventory.splice(idx, 1);
        renderInventoryList();
      });
      invRow.appendChild(removeBtn);

      invContainer.appendChild(invRow);
    });
  }

  invSearch.addEventListener("input", () => {
    const q = invSearch.value.toLowerCase();
    invSuggestions.innerHTML = "";
    allInventory.filter(inv => inv.name.toLowerCase().includes(q) && !deployment.inventory.some(i => i.id === inv.id))
      .slice(0, 5)
      .forEach(item => {
        const div = document.createElement("div");
        div.textContent = `${item.name} (${item.unit})`;
        div.style.padding = "8px";
        div.style.cursor = "pointer";
        div.style.borderBottom = "1px solid #ddd";
        div.style.backgroundColor = "#f9fafb";
        div.addEventListener("click", () => {
          deployment.inventory.push({ id: item.id, name: item.name, unit: item.unit, qty: 0 });
          renderInventoryList();
          invSearch.value = "";
          invSuggestions.innerHTML = "";
        });
        invSuggestions.appendChild(div);
      });
  });

  // --- Save Button ---
  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save";
  saveBtn.style.cssText = `
    margin-top: 20px;
    padding: 12px 20px;
    background-color: #10b981;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 700;
    font-size: 16px;
    transition: background-color 0.3s ease;
  `;
  saveBtn.addEventListener("mouseenter", () => {
    saveBtn.style.backgroundColor = "#059669";
  });
  saveBtn.addEventListener("mouseleave", () => {
    saveBtn.style.backgroundColor = "#10b981";
  });
  content.appendChild(saveBtn);

  saveBtn.addEventListener("click", () => {
    // Update inventory quantities from inputs
    deployment.inventory = deployment.inventory.map((i, idx) => {
      const qtyInput = invContainer.querySelector(`input[data-index="${idx}"]`);
      const qtyNum = parseInt(qtyInput.value);
      return { ...i, qty: (!isNaN(qtyNum) && qtyNum >= 0) ? qtyNum : 0 };
    });

// Validate start date
const todayStr = new Date().toISOString().split("T")[0];
if (!startInput.value || startInput.value < todayStr) {
  Swal.fire({
    icon: "error",
    title: "Invalid Start Date",
    text: "Start date cannot be in the past or before today.",
    confirmButtonColor: "#dc2626"
  });
  return; // Stop save
}

    const updatedDeployment = {
      teamLeader: tlSelect.value,
      employees: selectedEmployees,
      location: locInput.value,
      startDate: startInput.value,
      endDate: endInput.value,
      deploymentDays: (() => {
        const start = new Date(startInput.value);
        const end = new Date(endInput.value);
        const diff = end - start;
        return diff >= 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1 : 0;
      })(),
      inventory: deployment.inventory
    };

    // Save to database
    db.ref("deployments").child(key).update(updatedDeployment).then(() => {
      Swal.fire({
        icon: "success",
        title: "Deployment updated!",
        background: "#d1fae5",
        color: "#065f46",
        confirmButtonColor: "#10b981"
      });
      modal.remove();
    });
  });

  document.body.appendChild(modal);
  modal.addEventListener("click", e => {
    if (e.target === modal) modal.remove();
  });

  // Initial inventory render
  renderInventoryList();
}


// ----------------- Show Deployments -----------------
function showDeploymentInfo(dep, key) {
  const employeesHtml = dep.employees && dep.employees.length
    ? `<ul style="text-align:left; margin:4px 0 8px 18px; color:#1e293b;">${dep.employees.map(e => `<li>${e}</li>`).join("")}</ul>`
    : "-";

  const inventoryHtml = dep.inventory && dep.inventory.length
    ? `<ul style="text-align:left; margin:4px 0 8px 18px; color:#1e293b;">${dep.inventory.map(i => `<li>${i.qty} x ${i.name}${i.unit ? ' (' + i.unit + ')' : ''}</li>`).join("")}</ul>`
    : "-";

  const acceptedText = dep.accepted
    ? `Yes ${dep.acceptedAt ? `(${new Date(dep.acceptedAt).toLocaleString()})` : ""}`
    : "(__/__/____, __:__:__ __)";

  const completedText = dep.completed
    ? `Yes ${dep.completedAt ? `(${new Date(dep.completedAt).toLocaleString()})` : ""}`
    : " (__/__/____, __:__:__ __)";

  const html = `
    <div style="
      text-align:left;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #334155;
      display: flex;
      flex-direction: column;
      gap: 12px;
    ">
      <div>
        <strong>Team Leader:</strong> ${dep.teamLeader || "-"}
      </div>
      <div>
        <strong>Employees:</strong> ${employeesHtml}
      </div>
      <div>
        <strong>Location:</strong> ${dep.location || "-"}
      </div>
      <div>
        <strong>Start Date:</strong> ${dep.startDate || "-"} &nbsp;&nbsp;
        <strong>End Date:</strong> ${dep.endDate || "-"}
      </div>
      <div>
        <strong>Number of Days:</strong> ${dep.deploymentDays || "-"}
      </div>
      <div>
        <strong>Inventory:</strong> ${inventoryHtml}
      </div>
      <div>
        <strong>Accepted:</strong> ${acceptedText}
      </div>
      <div>
        <strong>Completed:</strong> ${completedText}
      </div>
    </div>
  `;

  Swal.fire({
    title: 'Deployment Info',
    html,
    width: 600,
    showCloseButton: true,
    confirmButtonText: 'Close',
    background: '#f9fafb',
    confirmButtonColor: '#2563eb',
  });
}

function showDeployments() {
  // Clear existing rows
  deploymentTable.innerHTML = "";
  completedTable.innerHTML = "";

  function createRow(dep, key) {
    const row = document.createElement("tr");
    row.setAttribute("data-key", key);

    // Team Leader cell
    const tlCell = document.createElement("td");
    tlCell.textContent = dep.teamLeader || "-";

    // Location cell
    const locCell = document.createElement("td");
    locCell.textContent = dep.location || "-";

    // Info cell (Swal)
    const infoCell = document.createElement("td");
    const infoBtn = document.createElement("button");
    infoBtn.className = "btn btn-sm btn-info";
    infoBtn.textContent = "Info";
    infoBtn.style.backgroundColor = "#2563eb";
    infoBtn.style.color = "#fff";
    infoBtn.style.border = "none";
    infoBtn.style.borderRadius = "4px";
    infoBtn.style.padding = "4px 8px";
    infoBtn.style.cursor = "pointer";
    infoBtn.addEventListener("mouseenter", () => infoBtn.style.backgroundColor = "#1e40af");
    infoBtn.addEventListener("mouseleave", () => infoBtn.style.backgroundColor = "#2563eb");
    infoBtn.addEventListener("click", () => showDeploymentInfo(dep, key));
    infoCell.appendChild(infoBtn);

    // Action cell
    const actionCell = document.createElement("td");

    if (!dep.completed) {
      // Edit button
      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-sm btn-warning me-1";
      editBtn.textContent = "Edit";
      editBtn.style.backgroundColor = "#f59e0b";
      editBtn.style.color = "#fff";
      editBtn.style.border = "none";
      editBtn.style.borderRadius = "4px";
      editBtn.style.padding = "4px 8px";
      editBtn.style.cursor = "pointer";
      editBtn.addEventListener("mouseenter", () => editBtn.style.backgroundColor = "#b45309");
      editBtn.addEventListener("mouseleave", () => editBtn.style.backgroundColor = "#f59e0b");
      editBtn.addEventListener("click", () => editDeployment(dep, key));
      actionCell.appendChild(editBtn);

      // Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn btn-sm btn-danger";
      deleteBtn.textContent = "Delete";
      deleteBtn.style.backgroundColor = "#dc2626";
      deleteBtn.style.color = "#fff";
      deleteBtn.style.border = "none";
      deleteBtn.style.borderRadius = "4px";
      deleteBtn.style.padding = "4px 8px";
      deleteBtn.style.cursor = "pointer";
      deleteBtn.addEventListener("mouseenter", () => deleteBtn.style.backgroundColor = "#991b1b");
      deleteBtn.addEventListener("mouseleave", () => deleteBtn.style.backgroundColor = "#dc2626");
      deleteBtn.addEventListener("click", () => {
        Swal.fire({
          title: "Delete deployment?",
          text: "This will permanently remove the deployment record.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          confirmButtonText: "Yes, delete"
        }).then(result => {
          if (result.isConfirmed) {
            db.ref("deployments").child(key).remove().then(() => {
              Swal.fire({
                icon: "success",
                title: "Deleted!",
                background: "#fee2e2",
                color: "#991b1b",
                confirmButtonColor: "#dc2626"
              });
            });
          }
        });
      });
      actionCell.appendChild(deleteBtn);

      // Build row for active deployments
      row.appendChild(tlCell);
      row.appendChild(locCell);
      row.appendChild(infoCell);
      row.appendChild(actionCell);
      deploymentTable.appendChild(row);
    } else {
      // Completed deployment actions - View Report & Delete



// Fullscreen Image Function (keep this before using it)
function openFullscreenImage(url) {
  // create overlay
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = "rgba(0,0,0,0.95)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "20000"; // high so it overlays the Swal modal
  overlay.style.cursor = "zoom-out";

  const img = document.createElement("img");
  img.src = url;
  img.style.maxWidth = "95%";
  img.style.maxHeight = "95%";
  img.style.borderRadius = "8px";
  img.style.boxShadow = "0 0 30px rgba(0,0,0,0.6)";
  img.style.objectFit = "contain";

  overlay.appendChild(img);
  document.body.appendChild(overlay);

  // ESC handler (named so it can be removed)
  function escHandler(e) {
    if (e.key === "Escape") {
      removeOverlay();
    }
  }
  document.addEventListener("keydown", escHandler);

  // remove overlay helper
  function removeOverlay() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    document.removeEventListener("keydown", escHandler);
  }

  // close on overlay click (but not on image click)
  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay) removeOverlay();
  });
}

// Button Logic para sa View Report Button

const viewBtn = document.createElement("button");
viewBtn.className = "btn btn-sm btn-primary me-1";
viewBtn.textContent = "View Report";
viewBtn.style.backgroundColor = "#2563eb";
viewBtn.style.color = "#fff";
viewBtn.style.border = "none";
viewBtn.style.borderRadius = "4px";
viewBtn.style.padding = "4px 8px";
viewBtn.style.cursor = "pointer";

viewBtn.addEventListener("mouseenter", () => viewBtn.style.backgroundColor = "#1e40af");
viewBtn.addEventListener("mouseleave", () => viewBtn.style.backgroundColor = "#2563eb");

viewBtn.addEventListener("click", () => {
  db.ref("deployment_reports").orderByChild("deploymentId").equalTo(key).once("value").then(snapshot => {
    const reports = [];
    snapshot.forEach(child => reports.push(child.val()));

    if (reports.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No report found for this deployment.",
        background: "#fef3c7",
        color: "#92400e",
        confirmButtonColor: "#f59e0b"
      });
      return;
    }

    const r = reports[0];
    const mapId = `map-${Date.now()}`;

    // --- New: show deployment location as 'Loading...' initially
    let deploymentLocationText = "Loading...";

    // Images HTML (render with data-url and a class, no inline onclick)
    let imagesHtml = "";
    if (r.images && r.images.length > 0) {
      imagesHtml += `<div style="display:flex; overflow-x:auto; gap:10px; padding:5px 0;">`;
      r.images.forEach((url, idx) => {
        imagesHtml += `
          <img
            src="${url}"
            data-img="${url}"
            class="swal-report-image"
            style="width:150px; height:100px; object-fit:cover; border-radius:6px; cursor:pointer; flex-shrink:0;"
            alt="report-image-${idx}"
          />
        `;
      });
      imagesHtml += `</div>`;
    } else {
      imagesHtml = `<p style="color:#6b7280;">No images available.</p>`;
    }

    const html = `
      <div style="font-family:'Segoe UI',sans-serif; color:#334155; text-align:left;">
        <p><strong style="color:#2563eb;">Report:</strong><br>${r.report || "-"}</p>
        <p><strong style="color:#2563eb;">Deployment Location:</strong> <span id="deployment-location-text">${deploymentLocationText}</span></p>
        <p><strong style="color:#2563eb;">Location Coordinates:</strong> <span id="coords-text">Loading...</span></p>
        <p><strong style="color:#2563eb;">Images:</strong></p>
        ${imagesHtml}
        <p><strong style="color:#2563eb;">Map:</strong></p>
        <div id="${mapId}" style="width:100%; height:300px; border-radius:8px;"></div>
      </div>
    `;

    Swal.fire({
      title: "Deployment Report",
      html,
      width: 850,
      showCloseButton: true,
      confirmButtonText: "Close",
      background: "#f9fafb",
      confirmButtonColor: "#2563eb",
      didOpen: () => {
        // Attach click handlers to images inside the modal
        const modalImages = document.querySelectorAll(".swal2-html-container .swal-report-image");
        modalImages.forEach(imgEl => {
          imgEl.addEventListener("click", (ev) => {
            const url = ev.currentTarget.getAttribute("data-img");
            if (url) openFullscreenImage(url);
          });
        });

        // Delay map initialization until modal fully rendered
        setTimeout(() => {
          const mapDiv = document.getElementById(mapId);

          db.ref('deployments').child(r.deploymentId).once('value').then(depSnap => {
            let lat = parseFloat(r.latitude);
            let lng = parseFloat(r.longitude);
            let deploymentLocation = r.deploymentLocation || "-";

            if (depSnap.exists()) {
              const dep = depSnap.val();
              if (dep.latitude !== undefined && !isNaN(parseFloat(dep.latitude)))
                lat = parseFloat(dep.latitude);
              if (dep.longitude !== undefined && !isNaN(parseFloat(dep.longitude)))
                lng = parseFloat(dep.longitude);
              // deploymentLocation from deployment main table
              if (dep.location) deploymentLocation = dep.location;
              else if (dep.deploymentLocation) deploymentLocation = dep.deploymentLocation;
            }

            // Update coords and deployment location text
            const coordsText = document.getElementById("coords-text");
            if (coordsText) {
              coordsText.textContent = (!isNaN(lat) && !isNaN(lng)) ? `Lat ${lat}, Lng ${lng}` : "No location data available.";
            }
            const depLocText = document.getElementById("deployment-location-text");
            if (depLocText) {
              depLocText.textContent = deploymentLocation;
            }

            if (mapDiv && !isNaN(lat) && !isNaN(lng)) {
              const map = new maplibregl.Map({
                container: mapId,
                style: `https://maps.geoapify.com/v1/styles/klokantech-basic/style.json?apiKey=c31791c9aa7141aa9b3ce79b0a265c01`,
                center: [lng, lat],
                zoom: 17
              });

              new maplibregl.Marker({ color: "#3a4bbf" })
                .setLngLat([lng, lat])
                .addTo(map);

              map.resize();
            } else if (mapDiv) {
              mapDiv.textContent = "No location data available.";
            }
          });
        }, 250);
      }
    });
  });
});


// Fullscreen image overlay
function openFullscreenImage(url) {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(0,0,0,0.9)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.cursor = 'pointer';
  overlay.style.zIndex = 99999;

  const img = document.createElement('img');
  img.src = url;
  img.style.maxWidth = '95%';
  img.style.maxHeight = '95%';
  img.style.borderRadius = '8px';
  img.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';

  overlay.appendChild(img);
  document.body.appendChild(overlay);

  // Close overlay on click or ESC
  overlay.addEventListener('click', () => overlay.remove());
  document.addEventListener('keydown', function escListener(e) {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', escListener);
    }
  });
}



      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn btn-sm btn-danger";
      deleteBtn.textContent = "Delete";
      deleteBtn.style.backgroundColor = "#dc2626";
      deleteBtn.style.color = "#fff";
      deleteBtn.style.border = "none";
      deleteBtn.style.borderRadius = "4px";
      deleteBtn.style.padding = "4px 8px";
      deleteBtn.style.cursor = "pointer";
      deleteBtn.addEventListener("mouseenter", () => deleteBtn.style.backgroundColor = "#991b1b");
      deleteBtn.addEventListener("mouseleave", () => deleteBtn.style.backgroundColor = "#dc2626");
      deleteBtn.addEventListener("click", () => {
        Swal.fire({
          title: "Delete deployment?",
          text: "This will permanently remove the completed deployment record.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          confirmButtonText: "Yes, delete"
        }).then(result => {
          if (result.isConfirmed) {
            db.ref("deployments").child(key).remove().then(() => {
              Swal.fire({
                icon: "success",
                title: "Deleted!",
                background: "#fee2e2",
                color: "#991b1b",
                confirmButtonColor: "#dc2626"
              });
            });
          }
        });
      });

      actionCell.appendChild(viewBtn);
      actionCell.appendChild(deleteBtn);

      row.appendChild(tlCell);
      row.appendChild(locCell);
      row.appendChild(infoCell);
      row.appendChild(actionCell);
      completedTable.appendChild(row);
    }
  }

  // Listen for child additions/changes/removals and update table rows
  db.ref("deployments").on("child_added", snapshot => createRow(snapshot.val(), snapshot.key));
  db.ref("deployments").on("child_changed", snapshot => {
    const key = snapshot.key;
    const existingRow = document.querySelector(`tr[data-key="${key}"]`);
    if (existingRow) existingRow.remove();
    createRow(snapshot.val(), key);
  });
  db.ref("deployments").on("child_removed", snapshot => {
    const row = document.querySelector(`tr[data-key="${snapshot.key}"]`);
    if (row) row.remove();
  });
}

// ----------------- Auto-delete expired deployments -----------------
function removeExpiredDeployments() {
  const today = new Date().toISOString().split("T")[0];
  db.ref("deployments").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const dep = child.val();
      if (dep.endDate && dep.endDate < today) {
        db.ref("deployments").child(child.key).remove();
      }
    });
  });
}

// ----------------- Initialize -----------------
window.onload = () => {
  loadTeamLeaders();
  handleForm();
  showDeployments();
  removeExpiredDeployments();
  setInterval(removeExpiredDeployments, 10 * 60 * 1000);
};

// ----------------- Back Button -----------------
const backButton = document.getElementById("backButton");
backButton.addEventListener("click", () => {
  window.history.back();
});


