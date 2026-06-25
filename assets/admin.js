// =====================================================================
// Fleet Hub — Admin dashboard logic
// =====================================================================

let currentUser = null;
let allVehicles = [];
let allSubmissions = [];
let submissionFilter = "all";

// ---------------------------------------------------------------------
// AUTH
// ---------------------------------------------------------------------
async function checkSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    currentUser = session.user;
    enterDashboard();
  }
}
checkSession();

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const btn = document.getElementById("loginBtn");
  document.getElementById("loginAlert").innerHTML = "";
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Signing in...`;

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  btn.disabled = false;
  btn.textContent = "Sign in";

  if (error) {
    document.getElementById("loginAlert").innerHTML =
      `<div class="alert alert-error">Couldn't sign in — check your email and password and try again.</div>`;
    return;
  }
  currentUser = data.user;
  enterDashboard();
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  window.location.reload();
});

function enterDashboard() {
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");
  const name = (currentUser.email || "").split("@")[0];
  document.getElementById("adminName").textContent = name.charAt(0).toUpperCase() + name.slice(1);
  loadVehicles();
  loadSubmissions();
}

// ---------------------------------------------------------------------
// TABS
// ---------------------------------------------------------------------
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    document.getElementById("tab-vehicles").classList.toggle("hidden", tab !== "vehicles");
    document.getElementById("tab-submissions").classList.toggle("hidden", tab !== "submissions");
  });
});

// ---------------------------------------------------------------------
// VEHICLES
// ---------------------------------------------------------------------
async function loadVehicles() {
  const { data, error } = await supabaseClient.from("vehicles").select("*").order("vehicle_reg");
  if (error) {
    document.getElementById("vehiclesAlert").innerHTML = `<div class="alert alert-error">Couldn't load vehicles.</div>`;
    return;
  }
  allVehicles = data || [];
  renderVehicles(allVehicles);
}

function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function dueSoonClass(d) {
  if (!d) return "";
  const days = (new Date(d) - new Date()) / 86400000;
  if (days < 0) return "color:var(--signal-red);font-weight:700;";
  if (days < 30) return "color:var(--amber-dark);font-weight:700;";
  return "";
}

function yn(b) {
  return b
    ? '<span class="badge badge-yes">Yes</span>'
    : '<span class="badge badge-pending">No</span>';
}

function renderVehicles(list) {
  const body = document.getElementById("vehiclesBody");
  if (list.length === 0) {
    body.innerHTML = `<tr><td colspan="14"><div class="empty-state">No vehicles found.</div></td></tr>`;
    return;
  }
  body.innerHTML = list.map(v => `
    <tr>
      <td><strong>${v.vehicle_reg}</strong></td>
      <td>${v.vehicle_type || "—"}</td>
      <td style="${dueSoonClass(v.service_due)}">${fmtDate(v.service_due)}</td>
      <td style="${dueSoonClass(v.mot_due)}">${fmtDate(v.mot_due)}</td>
      <td>${v.current_driver || "<span class=\"muted\">Unassigned</span>"}</td>
      <td>${yn(v.spare_keys)}</td>
      <td>${v.lock_type || "—"}</td>
      <td>${yn(v.seat_covers)}</td>
      <td>${yn(v.first_aid_fire_ext)}</td>
      <td>${yn(v.tracking_system)}</td>
      <td>${fmtDate(v.last_vehicle_check)}</td>
      <td>${yn(v.fuel_card)}</td>
      <td style="max-width:160px;white-space:normal;">${v.notes || ""}</td>
      <td><button class="btn btn-ghost btn-small edit-vehicle" data-id="${v.id}">Edit</button></td>
    </tr>
  `).join("");
}

document.getElementById("vehicleSearch").addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = allVehicles.filter(v =>
    (v.vehicle_reg || "").toLowerCase().includes(term) ||
    (v.vehicle_type || "").toLowerCase().includes(term) ||
    (v.current_driver || "").toLowerCase().includes(term)
  );
  renderVehicles(filtered);
});

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("edit-vehicle")) {
    const v = allVehicles.find(x => x.id === e.target.dataset.id);
    openVehicleModal(v);
  }
});

document.getElementById("addVehicleBtn").addEventListener("click", () => openVehicleModal(null));

function openVehicleModal(v) {
  document.getElementById("modalTitle").textContent = v ? `Edit ${v.vehicle_reg}` : "Add vehicle";
  document.getElementById("v_id").value = v ? v.id : "";
  document.getElementById("v_reg").value = v ? v.vehicle_reg : "";
  document.getElementById("v_type").value = v ? (v.vehicle_type || "") : "";
  document.getElementById("v_service").value = v ? (v.service_due || "") : "";
  document.getElementById("v_mot").value = v ? (v.mot_due || "") : "";
  document.getElementById("v_driver").value = v ? (v.current_driver || "") : "";
  document.getElementById("v_lock").value = v ? (v.lock_type || "") : "";
  document.getElementById("v_keys").checked = v ? !!v.spare_keys : false;
  document.getElementById("v_seats").checked = v ? !!v.seat_covers : false;
  document.getElementById("v_aid").checked = v ? !!v.first_aid_fire_ext : false;
  document.getElementById("v_tracking").checked = v ? !!v.tracking_system : false;
  document.getElementById("v_fuel").checked = v ? !!v.fuel_card : false;
  document.getElementById("v_lastcheck").value = v ? (v.last_vehicle_check || "") : "";
  document.getElementById("v_notes").value = v ? (v.notes || "") : "";
  document.getElementById("vehicleModalOverlay").classList.remove("hidden");
}

document.getElementById("cancelModalBtn").addEventListener("click", () => {
  document.getElementById("vehicleModalOverlay").classList.add("hidden");
});

document.getElementById("vehicleForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("v_id").value;
  const payload = {
    vehicle_reg: document.getElementById("v_reg").value.trim().toUpperCase(),
    vehicle_type: document.getElementById("v_type").value.trim() || null,
    service_due: document.getElementById("v_service").value || null,
    mot_due: document.getElementById("v_mot").value || null,
    current_driver: document.getElementById("v_driver").value.trim() || null,
    lock_type: document.getElementById("v_lock").value || null,
    spare_keys: document.getElementById("v_keys").checked,
    seat_covers: document.getElementById("v_seats").checked,
    first_aid_fire_ext: document.getElementById("v_aid").checked,
    tracking_system: document.getElementById("v_tracking").checked,
    fuel_card: document.getElementById("v_fuel").checked,
    last_vehicle_check: document.getElementById("v_lastcheck").value || null,
    notes: document.getElementById("v_notes").value.trim() || null,
    updated_at: new Date().toISOString(),
  };

  let error;
  if (id) {
    ({ error } = await supabaseClient.from("vehicles").update(payload).eq("id", id));
  } else {
    ({ error } = await supabaseClient.from("vehicles").insert(payload));
  }

  if (error) {
    document.getElementById("vehiclesAlert").innerHTML =
      `<div class="alert alert-error">Couldn't save vehicle — ${error.message.includes("duplicate") ? "that registration already exists." : "please try again."}</div>`;
    return;
  }

  document.getElementById("vehicleModalOverlay").classList.add("hidden");
  document.getElementById("vehiclesAlert").innerHTML = "";
  loadVehicles();
});

// ---------------------------------------------------------------------
// SUBMISSIONS
// ---------------------------------------------------------------------
async function loadSubmissions() {
  const { data, error } = await supabaseClient
    .from("safety_checks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return;
  allSubmissions = data || [];
  renderSubmissions();
}

document.querySelectorAll("[data-filter]").forEach(btn => {
  btn.addEventListener("click", () => {
    submissionFilter = btn.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach(b => b.classList.remove("btn-primary"));
    btn.classList.add("btn-primary");
    renderSubmissions();
  });
});

function allChecklistItems() {
  return [...CHECKLIST_EXTERNAL, ...CHECKLIST_INTERNAL];
}

function renderSubmissions() {
  let list = allSubmissions;
  if (submissionFilter === "defects") list = list.filter(s => s.has_defects);
  if (submissionFilter === "unreviewed") list = list.filter(s => !s.reviewed);

  const container = document.getElementById("submissionsList");
  if (list.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="icon">📋</div>No submissions to show.</div>`;
    return;
  }

  const items = allChecklistItems();

  container.innerHTML = list.map(s => {
    const flaggedItems = items.filter(item => {
      const r = s.responses[item.id];
      if (!r) return false;
      return item.invert ? r.answer === "Yes" : r.answer === "No";
    });

    return `
    <div class="card">
      <div class="flex-between" style="align-items:flex-start;flex-wrap:wrap;gap:10px;">
        <div>
          <div class="flex gap-8" style="margin-bottom:4px;">
            <strong style="font-size:15px;">${s.vehicle_reg}</strong>
            ${s.has_defects ? '<span class="badge badge-defect">Defect reported</span>' : '<span class="badge badge-yes">All clear</span>'}
            ${s.reviewed ? '<span class="badge badge-reviewed">Reviewed</span>' : '<span class="badge badge-pending">Unreviewed</span>'}
          </div>
          <div class="small muted">${s.driver_name} · ${fmtDate(s.check_date)}</div>
        </div>
        <div class="flex gap-8">
          ${!s.reviewed ? `<button class="btn btn-ghost btn-small mark-reviewed" data-id="${s.id}">Mark reviewed</button>` : ""}
          <button class="btn btn-ghost btn-small toggle-detail" data-id="${s.id}">Details</button>
        </div>
      </div>
      ${flaggedItems.length > 0 ? `
        <div class="alert alert-warn" style="margin-top:12px;margin-bottom:0;">
          <strong>Flagged:</strong> ${flaggedItems.map(i => i.q).join(" · ")}
        </div>` : ""}
      <div class="hidden" id="detail-${s.id}" style="margin-top:14px;border-top:1px solid var(--line);padding-top:14px;">
        ${s.photo_urls && s.photo_urls.length > 0 ? `
          <div style="margin-bottom:16px;">
            <div class="small" style="font-weight:700;margin-bottom:8px;">📷 Photos (${s.photo_urls.length})</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
              ${s.photo_urls.map(url => `
                <a href="${url}" target="_blank">
                  <img src="${url}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:1.5px solid var(--line);">
                </a>`).join("")}
            </div>
          </div>` : ""}
        ${items.map(item => {
          const r = s.responses[item.id];
          if (!r) return "";
          const isProblem = item.invert ? r.answer === "Yes" : r.answer === "No";
          return `
            <div style="margin-bottom:10px;">
              <div class="small" style="font-weight:600;">${item.q}</div>
              <div class="small">
                <span class="badge ${isProblem ? 'badge-no' : 'badge-yes'}">${r.answer}</span>
                ${r.comment ? `<span class="muted"> — ${r.comment}</span>` : ""}
              </div>
            </div>`;
        }).join("")}
      </div>
    </div>`;
  }).join("");
}

document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("toggle-detail")) {
    document.getElementById(`detail-${e.target.dataset.id}`).classList.toggle("hidden");
  }
  if (e.target.classList.contains("mark-reviewed")) {
    const id = e.target.dataset.id;
    await supabaseClient.from("safety_checks").update({
      reviewed: true,
      reviewed_by: currentUser.email,
      reviewed_at: new Date().toISOString(),
    }).eq("id", id);
    loadSubmissions();
  }
});
