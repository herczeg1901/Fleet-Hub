// =====================================================================
// Fleet Hub — Driver Safety Check form logic
// =====================================================================

document.getElementById("checkDate").valueAsDate = new Date();

function renderChecklist(containerId, items) {
  const container = document.getElementById(containerId);
  container.innerHTML = items.map((item, idx) => `
    <div class="check-row" data-id="${item.id}">
      <p class="check-q">${item.q}</p>
      <div class="pill-group" role="radiogroup">
        <label class="pill yes">
          <input type="radio" name="${item.id}" value="Yes">Yes
        </label>
        <label class="pill no">
          <input type="radio" name="${item.id}" value="No">No
        </label>
        <label class="pill na">
          <input type="radio" name="${item.id}" value="N/A">N/A
        </label>
      </div>
      <button type="button" class="comment-toggle" data-for="${item.id}">+ Add a comment</button>
      <div class="field hidden" id="comment-wrap-${item.id}" style="margin-top:8px;">
        <textarea placeholder="Comment (optional)" id="comment-${item.id}"></textarea>
      </div>
    </div>
  `).join("");
}

renderChecklist("externalChecks", CHECKLIST_EXTERNAL);
renderChecklist("internalChecks", CHECKLIST_INTERNAL);

// Pill selection styling
document.addEventListener("change", (e) => {
  if (e.target.type === "radio") {
    const row = e.target.closest(".check-row");
    row.querySelectorAll(".pill").forEach(p => p.classList.remove("checked"));
    e.target.closest(".pill").classList.add("checked");
  }
});

// Comment toggle
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("comment-toggle")) {
    const id = e.target.dataset.for;
    const wrap = document.getElementById(`comment-wrap-${id}`);
    wrap.classList.toggle("hidden");
    e.target.textContent = wrap.classList.contains("hidden") ? "+ Add a comment" : "− Hide comment";
  }
});

// Load known vehicle regs for the datalist (read-only, public policy)
async function loadRegs() {
  const { data, error } = await supabaseClient
    .from("vehicles")
    .select("vehicle_reg")
    .order("vehicle_reg");
  if (error || !data) return;
  const list = document.getElementById("regList");
  list.innerHTML = data.map(v => `<option value="${v.vehicle_reg}">`).join("");
}
loadRegs();

document.getElementById("vehicleReg").addEventListener("input", (e) => {
  e.target.value = e.target.value.toUpperCase();
});

// Photo preview
let selectedPhotos = [];
document.getElementById("photoInput").addEventListener("change", (e) => {
  const files = Array.from(e.target.files);
  const remaining = 5 - selectedPhotos.length;
  const toAdd = files.slice(0, remaining);
  selectedPhotos = [...selectedPhotos, ...toAdd];
  renderPhotoPreview();
  e.target.value = "";
});

function renderPhotoPreview() {
  const area = document.getElementById("photoPreviewArea");
  area.innerHTML = selectedPhotos.map((file, idx) => {
    const url = URL.createObjectURL(file);
    return `
      <div style="position:relative;width:80px;height:80px;">
        <img src="${url}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:1.5px solid var(--line);">
        <button type="button" onclick="removePhoto(${idx})" style="position:absolute;top:-6px;right:-6px;background:var(--signal-red);color:white;border:none;border-radius:50%;width:20px;height:20px;font-size:12px;cursor:pointer;line-height:1;">✕</button>
      </div>`;
  }).join("");
}

function removePhoto(idx) {
  selectedPhotos.splice(idx, 1);
  renderPhotoPreview();
}

async function uploadPhotos(vehicleReg, checkDate) {
  const urls = [];
  for (const file of selectedPhotos) {
    const ext = file.name.split(".").pop();
    const path = `${vehicleReg}/${checkDate}-${Date.now()}.${ext}`;
    const { error } = await supabaseClient.storage
      .from("check-photos")
      .upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabaseClient.storage.from("check-photos").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
  }
  return urls;
}
function showAlert(message, type = "error") {
  document.getElementById("formAlert").innerHTML =
    `<div class="alert alert-${type}">${message}</div>`;
}

function collectResponses(items) {
  const responses = {};
  let missing = [];
  let defect = false;
  items.forEach(item => {
    const selected = document.querySelector(`input[name="${item.id}"]:checked`);
    const comment = document.getElementById(`comment-${item.id}`).value.trim();
    if (!selected) {
      missing.push(item.q);
      return;
    }
    responses[item.id] = { answer: selected.value, comment };
    const isProblem = item.invert ? selected.value === "Yes" : selected.value === "No";
    if (isProblem) defect = true;
  });
  return { responses, missing, defect };
}

document.getElementById("checkForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  document.getElementById("formAlert").innerHTML = "";

  const driverName = document.getElementById("driverName").value.trim();
  const vehicleReg = document.getElementById("vehicleReg").value.trim().toUpperCase();
  const checkDate = document.getElementById("checkDate").value;
  const mileage = document.getElementById("mileage").value;

  if (!driverName || !vehicleReg || !checkDate || !mileage) {
    showAlert("Please fill in your name, van registration, mileage and the date.");
    return;
  }

  const ext = collectResponses(CHECKLIST_EXTERNAL);
  const intl = collectResponses(CHECKLIST_INTERNAL);
  const missing = [...ext.missing, ...intl.missing];

  if (missing.length > 0) {
    showAlert(`Please answer every question — ${missing.length} item(s) still need a Yes / No / N/A.`);
    return;
  }

  const responses = { ...ext.responses, ...intl.responses };
  const hasDefects = ext.defect || intl.defect;

  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="spinner"></span> Submitting...`;

  const photoUrls = await uploadPhotos(vehicleReg, checkDate);

  const { error } = await supabaseClient.from("safety_checks").insert({
    check_date: checkDate,
    driver_name: driverName,
    vehicle_reg: vehicleReg,
    responses: responses,
 has_defects: hasDefects,
    mileage: parseInt(mileage),
    photo_urls: photoUrls,
  });
  submitBtn.disabled = false;
  submitBtn.textContent = "Submit Check Sheet";

  if (error) {
    showAlert("Something went wrong submitting your check — please try again, or let the office know.");
    console.error(error);
    return;
  }

  document.getElementById("formScreen").classList.add("hidden");
  const successScreen = document.getElementById("successScreen");
  successScreen.classList.remove("hidden");

  if (hasDefects) {
    document.getElementById("successIcon").textContent = "⚠️";
    document.getElementById("successTitle").textContent = "Submitted — defect flagged";
    document.getElementById("successMsg").textContent =
      "This check has been logged and flagged for management. Please also report the defect to your supervisor directly before using the vehicle.";
  } else {
    document.getElementById("successIcon").textContent = "✅";
    document.getElementById("successTitle").textContent = "Check sheet submitted";
    document.getElementById("successMsg").textContent = `Thanks ${driverName} — your check for ${vehicleReg} has been logged.`;
  }
});

document.getElementById("newCheckBtn").addEventListener("click", () => {
  window.location.reload();
});
