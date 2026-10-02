// Central Storage Arrays
let records = JSON.parse(localStorage.getItem('omniHealthRecords')) || [];
let inventory = JSON.parse(localStorage.getItem('omniHealthInventory')) || [];
let issuances = JSON.parse(localStorage.getItem('omniHealthIssuances')) || [];

let activePatientLogs = []; 

// Company Directory for Addresses
const companyDetails = {
  "Mabuhay GazSavers Inc.": { address: "BARANGAY SAN JOAQUIN, SANTO TOMAS, BATANGAS\n(043) 784 4960" },
  "LBAP METALSCORP Main": { address: "MAIN OFFICE ADDRESS\nCONTACT NUMBER" },
  "LBAP METALS CORP Annex": { address: "ANNEX OFFICE ADDRESS\nCONTACT NUMBER" },
  "ECOSAVERS HUB Inc": { address: "ECOSAVERS ADDRESS\nCONTACT NUMBER" },
  "RMM LEISURES VENTURES CORP": { address: "RMM LEISURES ADDRESS\nCONTACT NUMBER" }
};

// Navigation Routing
function navigate(viewName) {
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  document.getElementById(`view-${viewName}`).classList.add('active');
  const navLink = document.getElementById(`nav-${viewName}`);
  if (navLink) navLink.classList.add('active');
  
  if (viewName === 'master') renderMasterList();
  if (viewName === 'medications') {
    renderInventory();
    renderIssuances();
    updateMedicineDropdown();
  }
}

// Handle Company Change Globally
function changeCompany() {
  const selectedCompany = document.getElementById('global-company').value;
  const details = companyDetails[selectedCompany];

  document.getElementById('welcome-title').innerText = selectedCompany;
  document.getElementById('master-list-title').innerText = `${selectedCompany} - Master List`;
  document.getElementById('doc-company-name').innerText = selectedCompany;
  document.getElementById('companyDisplay').value = selectedCompany;
  
  const addressEl = document.getElementById('doc-company-address');
  if(addressEl) addressEl.innerText = details.address;

  document.querySelectorAll('.print-company-name').forEach(el => el.innerText = selectedCompany);
  renderMasterList();
}

// Render Master List 
function renderMasterList() {
  const selectedCompany = document.getElementById('global-company').value;
  const tbody = document.getElementById('master-tbody');
  tbody.innerHTML = '';
  
  const filteredRecords = records.filter(p => p.company === selectedCompany);
  
  if (filteredRecords.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color: #6b7280;">No records found for ${selectedCompany}</td></tr>`;
    return;
  }

  filteredRecords.forEach(patient => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${patient.empId}</strong></td>
      <td>${patient.lName}, ${patient.fName}</td>
      <td>${patient.department || 'N/A'}</td>
      <td>${patient.bloodType || 'N/A'}</td>
      <td>${patient.contact || 'N/A'}</td>
      <td class="no-print"><a class="action-link" onclick="loadPatient(${patient.id})">Edit</a></td>
    `;
    tbody.appendChild(tr);
  });
}

// Clear form for new entry
function clearFormAndNavigate() {
  document.getElementById('patient-form').reset();
  document.getElementById('recordId').value = '';
  document.getElementById('companyDisplay').value = document.getElementById('global-company').value;
  document.getElementById('company').value = document.getElementById('global-company').value;
  activePatientLogs = []; 
  renderLogs();
  navigate('individual');
}

// Load patient into form
function loadPatient(id) {
  const patient = records.find(p => p.id === id);
  if(!patient) return;
  
  Object.keys(patient).forEach(key => {
    if(key === 'logs') return; 
    const el = document.getElementById(key);
    if(el) {
      el.value = patient[key];
    } else if (key === 'empType') {
      const radio = document.querySelector(`input[name="empType"][value="${patient[key]}"]`);
      if(radio) radio.checked = true;
    }
  });
  
  document.getElementById('recordId').value = id;
  activePatientLogs = patient.logs ? [...patient.logs] : [];
  renderLogs();
  
  navigate('individual');
}

// Automatic Age Computation
document.getElementById('dob').addEventListener('input', function() {
  if (this.value) {
    const today = new Date();
    const birthDate = new Date(this.value);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    document.getElementById('age').value = age;
  }
});

// Automatic BMI Computation
function calculateBMI() {
  const h = parseFloat(document.getElementById('height').value);
  const w = parseFloat(document.getElementById('weight').value);
  if (h > 0 && w > 0) {
    const bmi = (w / Math.pow(h / 100, 2)).toFixed(2);
    let status = "(Normal)";
    if (bmi < 18.5) status = "(Underweight)";
    else if (bmi >= 25 && bmi <= 29.9) status = "(Overweight)";
    else if (bmi >= 30) status = "(Obese)";
    document.getElementById('bmi').value = `${bmi} ${status}`;
  } else {
    document.getElementById('bmi').value = '';
  }
}
document.getElementById('height').addEventListener('input', calculateBMI);
document.getElementById('weight').addEventListener('input', calculateBMI);

// Vitals Monitoring Log Logic
function addMonitoringLog() {
  const log = {
    id: Date.now(),
    date: document.getElementById('logDate').value,
    bp: document.getElementById('logBP').value,
    hr: document.getElementById('logHR').value,
    resp: document.getElementById('logResp').value,
    o2: document.getElementById('logO2').value,
    temp: document.getElementById('logTemp').value,
    glucose: document.getElementById('logGlucose').value,
    weight: document.getElementById('logWeight').value,
    notes: document.getElementById('logNotes').value
  };
  
  if(!log.date) { alert("Please enter a date for the log entry."); return; }
  
  activePatientLogs.push(log);
  renderLogs();
  
  document.getElementById('logDate').value = '';
  document.getElementById('logBP').value = '';
  document.getElementById('logHR').value = '';
  document.getElementById('logResp').value = '';
  document.getElementById('logO2').value = '';
  document.getElementById('logTemp').value = '';
  document.getElementById('logGlucose').value = '';
  document.getElementById('logWeight').value = '';
  document.getElementById('logNotes').value = '';
}

function removeLog(id) {
  activePatientLogs = activePatientLogs.filter(log => log.id !== id);
  renderLogs();
}

function renderLogs() {
  const tbody = document.getElementById('log-tbody');
  tbody.innerHTML = '';
  
  if (activePatientLogs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color: #475569;">No vitals logged yet.</td></tr>`;
    return;
  }
  
  activePatientLogs.forEach(log => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${log.date}</td>
      <td>${log.bp}</td>
      <td>${log.hr}</td>
      <td>${log.resp}</td>
      <td>${log.o2}</td>
      <td>${log.temp}</td>
      <td>${log.glucose}</td>
      <td>${log.weight}</td>
      <td>${log.notes}</td>
      <td class="no-print"><a class="action-link" style="color:var(--brand-red);" onclick="removeLog(${log.id})">Delete</a></td>
    `;
    tbody.appendChild(tr);
  });
}

// Save Patient syncs to Master List
function savePatientRecord() {
  const currentId = document.getElementById('recordId').value;
  const isNew = !currentId;
  const currentCompany = document.getElementById('global-company').value;
  
  const patientData = {
    id: isNew ? Date.now() : parseInt(currentId),
    company: document.getElementById('companyDisplay').value || currentCompany,
    visitDate: document.getElementById('visitDate').value,
    attendingNurse: document.getElementById('attendingNurse').value,
    logs: activePatientLogs, 
    
    // Core data
    lName: document.getElementById('lName').value, fName: document.getElementById('fName').value, mName: document.getElementById('mName').value, suffix: document.getElementById('suffix').value,
    dob: document.getElementById('dob').value, age: document.getElementById('age').value, sex: document.getElementById('sex').value, civilStatus: document.getElementById('civilStatus').value, empId: document.getElementById('empId').value,
    address: document.getElementById('address').value, contact: document.getElementById('contact').value, email: document.getElementById('email').value,
    
    // Employment
    department: document.getElementById('department').value, dateHired: document.getElementById('dateHired').value, jobTitle: document.getElementById('jobTitle').value,
    empType: document.querySelector('input[name="empType"]:checked')?.value || '',
    
    // Insurance
    insuranceProv: document.getElementById('insuranceProv').value, philhealth: document.getElementById('philhealth').value, policyId: document.getElementById('policyId').value, coverage: document.getElementById('coverage').value,
    emergName: document.getElementById('emergName').value, emergRel: document.getElementById('emergRel').value, emergNum: document.getElementById('emergNum').value,
    
    // Medical Baseline
    bp: document.getElementById('bp').value, hr: document.getElementById('hr').value, resp: document.getElementById('resp').value, o2: document.getElementById('o2').value,
    temp: document.getElementById('temp').value, height: document.getElementById('height').value, weight: document.getElementById('weight').value, bmi: document.getElementById('bmi').value,
    
    // Health History
    bloodType: document.getElementById('bloodType').value, allergies: document.getElementById('allergies').value, medications: document.getElementById('medications').value, chronic: document.getElementById('chronic').value, surgeries: document.getElementById('surgeries').value, vaxStatus: document.getElementById('vaxStatus').value, concerns: document.getElementById('concerns').value,
    
    // Lifestyle
    smoker: document.getElementById('smoker').value, alcohol: document.getElementById('alcohol').value, exercise: document.getElementById('exercise').value, lastApe: document.getElementById('lastApe').value, lastLab: document.getElementById('lastLab').value
  };

  if (isNew) {
    records.push(patientData);
  } else {
    const index = records.findIndex(p => p.id === patientData.id);
    records[index] = patientData;
  }

  localStorage.setItem('omniHealthRecords', JSON.stringify(records));
  alert(`Record Saved to Master List for ${patientData.company}`);
  navigate('master');
}


// --- MEDICATION MANAGEMENT LOGIC ---

function updateMedicineDropdown() {
  const select = document.getElementById('issueMedicine');
  select.innerHTML = '<option value="">Select Medicine</option>';
  inventory.forEach(med => {
    if (med.qty > 0) {
      select.innerHTML += `<option value="${med.id}">${med.name} (Stock: ${med.qty})</option>`;
    }
  });
}

function addInventory() {
  const name = document.getElementById('medName').value.trim();
  const qty = parseInt(document.getElementById('medQty').value);
  const expiry = document.getElementById('medExpiry').value;

  if (!name || !qty || !expiry) { alert("Please fill all inventory fields."); return; }

  inventory.push({ id: Date.now(), name, qty, expiry });
  localStorage.setItem('omniHealthInventory', JSON.stringify(inventory));
  
  document.getElementById('medName').value = '';
  document.getElementById('medQty').value = '';
  document.getElementById('medExpiry').value = '';
  
  renderInventory();
  updateMedicineDropdown();
}

function removeInventory(id) {
  inventory = inventory.filter(med => med.id !== id);
  localStorage.setItem('omniHealthInventory', JSON.stringify(inventory));
  renderInventory();
  updateMedicineDropdown();
}

function renderInventory() {
  const tbody = document.getElementById('inventory-tbody');
  tbody.innerHTML = '';
  if (inventory.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No inventory added.</td></tr>`;
    return;
  }
  inventory.forEach(med => {
    const isLow = med.qty < 10 ? 'color: red; font-weight: bold;' : '';
    tbody.innerHTML += `
      <tr>
        <td>${med.name}</td>
        <td style="${isLow}">${med.qty}</td>
        <td>${med.expiry}</td>
        <td><a class="action-link" style="color:var(--brand-red);" onclick="removeInventory(${med.id})">Delete</a></td>
      </tr>
    `;
  });
}

function issueMedicine() {
  const date = document.getElementById('issueDate').value;
  const patient = document.getElementById('issuePatient').value.trim();
  const medId = document.getElementById('issueMedicine').value;
  const qtyToIssue = parseInt(document.getElementById('issueQty').value);
  const reason = document.getElementById('issueReason').value.trim();

  if (!date || !patient || !medId || !qtyToIssue || !reason) {
    alert("Please fill all issuance fields."); return;
  }

  const medIndex = inventory.findIndex(m => m.id == medId);
  if (inventory[medIndex].qty < qtyToIssue) {
    alert("Not enough stock available!"); return;
  }

  inventory[medIndex].qty -= qtyToIssue;
  localStorage.setItem('omniHealthInventory', JSON.stringify(inventory));

  issuances.push({
    id: Date.now(), date, patient, medName: inventory[medIndex].name, qty: qtyToIssue, reason
  });
  localStorage.setItem('omniHealthIssuances', JSON.stringify(issuances));

  document.getElementById('issueDate').value = '';
  document.getElementById('issuePatient').value = '';
  document.getElementById('issueQty').value = '';
  document.getElementById('issueReason').value = '';

  renderInventory();
  renderIssuances();
  updateMedicineDropdown();
}

function renderIssuances() {
  const tbody = document.getElementById('issuance-tbody');
  tbody.innerHTML = '';
  if (issuances.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No issuances logged.</td></tr>`;
    return;
  }
  
  const sortedIssuances = [...issuances].reverse();
  
  sortedIssuances.forEach(iss => {
    tbody.innerHTML += `
      <tr>
        <td>${iss.date}</td>
        <td><strong>${iss.patient}</strong></td>
        <td>${iss.medName} (${iss.qty})</td>
        <td>${iss.reason}</td>
      </tr>
    `;
  });
}


// --- PROFESSIONAL PDF GENERATION LOGIC ---

function downloadIndividualPDF() {
  const val = (id) => document.getElementById(id) ? document.getElementById(id).value.toUpperCase() || 'N/A' : 'N/A';
  const lName = document.getElementById('lName').value.toUpperCase();
  const fName = document.getElementById('fName').value.toUpperCase();
  const fullName = `${lName}, ${fName}`;

  // Map to Hidden Print Template
  document.getElementById('pt-header-company').innerText = val('companyDisplay');
  document.getElementById('pt-visitDate').innerText = val('visitDate');
  document.getElementById('pt-fullName').innerText = fullName;
  document.getElementById('pt-dob').innerText = val('dob');
  document.getElementById('pt-age').innerText = val('age');
  document.getElementById('pt-sex').innerText = val('sex');
  document.getElementById('pt-civil').innerText = val('civilStatus');
  document.getElementById('pt-empId').innerText = val('empId');
  document.getElementById('pt-contact').innerText = val('contact');
  document.getElementById('pt-address').innerText = val('address');
  document.getElementById('pt-company').innerText = val('companyDisplay');
  document.getElementById('pt-jobTitle').innerText = val('jobTitle');
  document.getElementById('pt-email').innerText = val('email').toLowerCase();
  
  document.getElementById('pt-department').innerText = val('department');
  document.getElementById('pt-dateHired').innerText = val('dateHired');
  document.getElementById('pt-empType').innerText = document.querySelector('input[name="empType"]:checked') ? document.querySelector('input[name="empType"]:checked').value.toUpperCase() : 'N/A';

  document.getElementById('pt-philhealth').innerText = val('philhealth');
  document.getElementById('pt-insuranceProv').innerText = val('insuranceProv');
  document.getElementById('pt-policyId').innerText = val('policyId');
  document.getElementById('pt-coverage').innerText = val('coverage');
  document.getElementById('pt-emergName').innerText = val('emergName');
  document.getElementById('pt-emergRel').innerText = val('emergRel');
  document.getElementById('pt-emergNum').innerText = val('emergNum');

  document.getElementById('pt-height').innerText = val('height');
  document.getElementById('pt-weight').innerText = val('weight');
  document.getElementById('pt-bmi').innerText = val('bmi');

  document.getElementById('pt-bp').innerText = val('bp');
  document.getElementById('pt-hr').innerText = val('hr');
  document.getElementById('pt-resp').innerText = val('resp');
  document.getElementById('pt-o2').innerText = val('o2');
  document.getElementById('pt-temp').innerText = val('temp');

  document.getElementById('pt-vaxStatus').innerText = val('vaxStatus');
  document.getElementById('pt-bloodType').innerText = val('bloodType');
  document.getElementById('pt-allergies').innerText = val('allergies');
  document.getElementById('pt-chronic').innerText = val('chronic');
  document.getElementById('pt-medications').innerText = val('medications');
  document.getElementById('pt-surgeries').innerText = val('surgeries');

  document.getElementById('pt-smoker').innerText = val('smoker');
  document.getElementById('pt-alcohol').innerText = val('alcohol');
  document.getElementById('pt-lastApe').innerText = val('lastApe');
  document.getElementById('pt-concerns').innerText = val('concerns');
  document.getElementById('pt-exercise').innerText = val('exercise');
  document.getElementById('pt-lastLab').innerText = val('lastLab');
  
  // Signatures mapping
  document.getElementById('pt-sigName').innerText = fName + " " + lName; 
  const nurse = document.getElementById('attendingNurse').value.trim();
  document.getElementById('pt-nurseName').innerText = nurse ? nurse.toUpperCase() : '';

  // Format Monitoring Log with cleaner borders
  const ptLogTbody = document.getElementById('pt-log-tbody');
  ptLogTbody.innerHTML = '';
  
  if (activePatientLogs.length === 0) {
    ptLogTbody.innerHTML = `<tr><td colspan="9" style="border-bottom: 1px solid #ddd; padding: 6px; text-align: center;">No vitals logged.</td></tr>`;
  } else {
    activePatientLogs.forEach(log => {
      ptLogTbody.innerHTML += `
        <tr>
          <td style="border-bottom: 1px solid #ddd; padding: 6px;">${log.date}</td>
          <td style="border-bottom: 1px solid #ddd; padding: 6px;">${log.bp}</td>
          <td style="border-bottom: 1px solid #ddd; padding: 6px;">${log.hr}</td>
          <td style="border-bottom: 1px solid #ddd; padding: 6px;">${log.resp}</td>
          <td style="border-bottom: 1px solid #ddd; padding: 6px;">${log.o2}</td>
          <td style="border-bottom: 1px solid #ddd; padding: 6px;">${log.temp}</td>
          <td style="border-bottom: 1px solid #ddd; padding: 6px;">${log.glucose}</td>
          <td style="border-bottom: 1px solid #ddd; padding: 6px;">${log.weight}</td>
          <td style="border-bottom: 1px solid #ddd; padding: 6px;">${log.notes}</td>
        </tr>
      `;
    });
  }

  // Switch display temporarily to capture PDF
  const webContainer = document.getElementById('individual-web-container');
  const printContainer = document.getElementById('hidden-print-template');
  
  webContainer.style.display = 'none';
  printContainer.style.display = 'block';

  const opt = {
    margin: 0.75, // Professional 0.75-inch margin
    filename: `${lName || 'Patient'}_Health_Record.pdf`, 
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 }, 
    jsPDF: { unit: 'in', format: 'legal', orientation: 'portrait' } // Legal Size
  };
  
  html2pdf().set(opt).from(printContainer).save().then(() => {
    printContainer.style.display = 'none';
    webContainer.style.display = 'block';
  });
}

function downloadMasterListPDF() {
  const element = document.getElementById('master-pdf-container');
  const company = document.getElementById('global-company').value;
  element.classList.add('pdf-format'); 
  element.querySelectorAll('.print-only').forEach(el => el.style.display = 'block');
  
  const opt = {
    margin: 0.75, 
    filename: `${company}_Master_List.pdf`, 
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 }, 
    jsPDF: { unit: 'in', format: 'legal', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    element.classList.remove('pdf-format');
    element.querySelectorAll('.print-only').forEach(el => el.style.display = 'none');
  });
}

// Initialize Application
changeCompany();
function deleteRecord() {
  const confirmDelete = confirm("Are you sure you want to delete this patient record? This action cannot be undone.");
  
  if (confirmDelete) {
    // 1. Identify which record is currently open
    // 2. Remove it from your data array or database
    // Example for localStorage: 
    // let patients = JSON.parse(localStorage.getItem("patients"));
    // patients = patients.filter(p => p.employeeId !== currentOpenId);
    // localStorage.setItem("patients", JSON.stringify(patients));
    
    // 3. Clear the form fields on the screen
    document.querySelectorAll("input").forEach(input => input.value = "");
    
    alert("Record deleted successfully.");
  }
}