/* =========================================================
   AUTH HELPERS
========================================================= */
function getUser() {
  try { return JSON.parse(localStorage.getItem("user")); }
  catch { return null; }
}

function getToken() {
  return localStorage.getItem("token");
}

function logout() {
  localStorage.clear();
  window.location.href = "/portal-login";
}

/* =========================================================
   AUTH GUARD
========================================================= */
document.addEventListener("DOMContentLoaded", () => {

  const user = getUser();
  const token = getToken();

  if (!user || !token || user.role !== "supplier") {
    logout();
    return;
  }

  const emailEl = document.getElementById("userEmail");
  if (emailEl) emailEl.textContent = user.email;

  loadDashboard();
});

/* =========================================================
   API HELPER
========================================================= */
async function api(url) {
  const token = getToken();

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    logout();
    return [];
  }

  const result = await res.json();
  return result.data || [];
}

/* =========================================================
   LOAD DASHBOARD
========================================================= */
async function loadDashboard() {
  try {
    const user = getUser();

    const [rfqs, pos] = await Promise.all([
      api("/api/rfqs/supplier"),
      api(`/api/purchase-orders/supplier/${user.id}`)
    ]);

    renderSummary(rfqs, pos);
    renderRFQTable(rfqs);
    renderPOTable(pos);
    renderCharts(rfqs, pos);

  } catch (err) {
    console.error("Dashboard error:", err);
  }
}

/* =========================================================
   SUMMARY
========================================================= */
function renderSummary(rfqs, pos) {

  const section = document.getElementById("summarySection");
  if (!section) return;

  const active = rfqs.filter(r => !r.quote_id).length;
  const quoted = rfqs.filter(r => r.quote_id).length;

  section.innerHTML = `
    <div class="card">
      <h3>Active RFQs</h3>
      <p>${active}</p>
    </div>
    <div class="card">
      <h3>Quotes Submitted</h3>
      <p>${quoted}</p>
    </div>
    <div class="card">
      <h3>Purchase Orders</h3>
      <p>${pos.length}</p>
    </div>
    <div class="card">
      <h3>Total RFQs</h3>
      <p>${rfqs.length}</p>
    </div>
  `;
}

/* =========================================================
   RFQ TABLE
========================================================= */
function renderRFQTable(rfqs) {
  const tbody = document.getElementById("rfqTableBody");
  tbody.innerHTML = "";

  if (!rfqs.length) {
    tbody.innerHTML = `<tr><td colspan="6">No RFQs available</td></tr>`;
    return;
  }

  rfqs.forEach(r => {
    tbody.innerHTML += `
      <tr>
        <td>${r.id}</td>
        <td>${r.part_name}</td>
        <td>${r.total_quantity}</td>
        <td>${r.quote_id ? "QUOTED" : "ACTIVE"}</td>
        <td>${new Date(r.created_at).toLocaleDateString()}</td>
        <td>
          <button onclick="openRFQ(${r.id})">
            ${r.quote_id ? "View" : "Quote"}
          </button>
        </td>
      </tr>
    `;
  });
}

/* =========================================================
   PO TABLE
========================================================= */
function renderPOTable(pos) {
  const tbody = document.getElementById("poTableBody");
  tbody.innerHTML = "";

  if (!pos.length) {
    tbody.innerHTML = `<tr><td colspan="6">No purchase orders</td></tr>`;
    return;
  }

  pos.forEach(po => {
    tbody.innerHTML += `
      <tr>
        <td>${po.id}</td>
        <td>${po.rfq_id}</td>
        <td>${po.quantity}</td>
        <td>₹${po.price}</td>
        <td>${new Date(po.created_at).toLocaleDateString()}</td>
        <td>
          <button onclick="openPO(${po.id})">View</button>
        </td>
      </tr>
    `;
  });
}

/* =========================================================
   CHARTS
========================================================= */
let rfqChart, flowChart;

function renderCharts(rfqs, pos) {

  rfqChart?.destroy();
  flowChart?.destroy();

  const active = rfqs.filter(r => !r.quote_id).length;
  const quoted = rfqs.filter(r => r.quote_id).length;

  rfqChart = new Chart(document.getElementById("rfqFunnelChart"), {
    type: "bar",
    data: {
      labels: ["Active", "Quoted"],
      datasets: [{
        data: [active, quoted],
        backgroundColor: ["#f59e0b", "#10b981"]
      }]
    },
    options: { plugins: { legend: { display: false } } }
  });

  flowChart = new Chart(document.getElementById("winRateChart"), {
    type: "doughnut",
    data: {
      labels: ["RFQs", "POs"],
      datasets: [{
        data: [rfqs.length, pos.length],
        backgroundColor: ["#e5e7eb", "#1e3a8a"]
      }]
    },
    options: { cutout: "70%" }
  });
}

/* =========================================================
   NAVIGATION
========================================================= */
function openRFQ(id) {
  window.location.href = `/supplier-rfq-detail?id=${id}`;
}

function openPO(id) {
  window.location.href = `/po-detail?id=${id}`;
}

