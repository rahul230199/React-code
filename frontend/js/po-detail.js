/* =========================================================
   AXO PO DETAIL – ENTERPRISE LIFECYCLE ENGINE
========================================================= */

/* ================= AUTH HELPERS ================= */

function getUser() {
  try { return JSON.parse(localStorage.getItem("user")); }
  catch { return null; }
}

function getToken() {
  return localStorage.getItem("token");
}

function logout() {
  localStorage.clear();
  window.location.href = "/frontend/login.html";
}

/* ================= AUTH GUARD ================= */

document.addEventListener("DOMContentLoaded", () => {
  const user = getUser();
  const token = getToken();

  if (!user || !token) {
    logout();
    return;
  }

  document.getElementById("userEmail").textContent = user.email;

  const poId = getPOIdFromURL();
  if (!poId) {
    alert("Invalid PO ID");
    return;
  }

  loadPO(poId);
});

/* =========================================================
   LOAD PO DETAILS
========================================================= */

let currentPO = null;

async function loadPO(poId) {
  try {
    const po = await api(`/api/purchase-orders/${poId}`);
    currentPO = po;

    renderPO(po);
    renderLifecycleControls(po);

  } catch (err) {
    console.error(err);
    alert("Failed to load purchase order");
  }
  renderTimeline(po.status);
}

/* =========================================================
   RENDER CORE DETAILS
========================================================= */

function renderPO(po) {
  setText("poId", po.id);
  setText("rfqId", po.rfq_id);
  setText("partName", po.part_name);
  setText("quantity", po.quantity);
  setText("price", `₹ ${po.price}`);
  setText("material", po.material_specification || "-");
  setText("delivery", po.delivery_timeline || "-");

  setStatusBadge(po.status);
}

/* =========================================================
   LIFECYCLE ENGINE
========================================================= */

function renderLifecycleControls(po) {

  const section = document.getElementById("lifecycleSection");
  const container = document.getElementById("lifecycleButtons");
  const user = getUser();

  container.innerHTML = "";
  section.classList.remove("hidden");

  const nextActions = getAllowedNextActions(po.status, user, po);

  if (!nextActions.length) {
    container.innerHTML = "<p>No actions available</p>";
    return;
  }

  nextActions.forEach(status => {
    const btn = document.createElement("button");
    btn.className = "primary-btn";
    btn.textContent = formatStatus(status);
    btn.onclick = () => updateStatus(status);
    container.appendChild(btn);
  });
}

/* =========================================================
   STATUS TRANSITION LOGIC
========================================================= */

function getAllowedNextActions(currentStatus, user, po) {

  const transitions = {
    issued: ["confirmed"],
    confirmed: ["in_production"],
    in_production: ["shipped"],
    shipped: ["delivered"],
    delivered: ["completed"],
    completed: []
  };

  const next = transitions[currentStatus] || [];

  return next.filter(status => {

    // Supplier controls production flow
    if (["confirmed", "in_production", "shipped", "delivered"].includes(status)) {
      return po.supplier_id === user.id;
    }

    // Buyer controls completion
    if (status === "completed") {
      return po.buyer_id === user.id;
    }

    return false;
  });
}

/* =========================================================
   UPDATE STATUS
========================================================= */

async function updateStatus(newStatus) {

  if (!confirm(`Confirm change to ${newStatus}?`)) return;

  try {
    await api(`/api/purchase-orders/${currentPO.id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: newStatus })
    });

    await loadPO(currentPO.id);

  } catch (err) {
    console.error(err);
    alert("Failed to update status");
  }
}

/* =========================================================
   API WRAPPER
========================================================= */

async function api(url, options = {}) {

  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Authorization": `Bearer ${getToken()}`,
      "Content-Type": "application/json"
    },
    body: options.body
  });

  if (response.status === 401 || response.status === 403) {
    logout();
    return;
  }

  if (!response.ok) {
    throw new Error("Network error");
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message);
  }

  return data.data;
}

/* =========================================================
   HELPERS
========================================================= */

function getPOIdFromURL() {
  return new URLSearchParams(window.location.search).get("id");
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setStatusBadge(status) {
  const badge = document.getElementById("poStatus");
  badge.textContent = formatStatus(status);
  badge.className = `status-badge ${status}`;
}

function formatStatus(status) {
  return status.replace("_", " ").toUpperCase();
}

function goBack() {
  const user = getUser();
  if (user.role === "buyer") {
    window.location.href = "/frontend/buyer-po.html";
  } else {
    window.location.href = "/frontend/supplier-dashboard.html";
  }
}

function renderTimeline(status) {

  const steps = [
    "issued",
    "confirmed",
    "in_production",
    "shipped",
    "delivered",
    "completed"
  ];

  const container = document.getElementById("poTimeline");
  container.innerHTML = "";

  const currentIndex = steps.indexOf(status);

  steps.forEach((step, index) => {

    const div = document.createElement("div");
    div.className = "timeline-step";

    if (index < currentIndex) {
      div.classList.add("completed");
    }

    if (index === currentIndex) {
      div.classList.add("active");
    }

    div.innerHTML = `
      <div class="timeline-circle">${index + 1}</div>
      <div class="timeline-label">
        ${step.replace("_", " ").toUpperCase()}
      </div>
    `;

    container.appendChild(div);
  });
}
