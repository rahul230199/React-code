/* =========================================================
   AUTH HELPERS
========================================================= */
function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

function getToken() {
  return localStorage.getItem("token");
}

/* =========================================================
   AUTH GUARD
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const user = getUser();
  const token = getToken();

  if (!user || !token || user.role !== "SUPPLIER") {
    window.location.href = "/login";
    return;
  }

  document.getElementById("userEmail").innerText = user.email;
  loadDashboard();
});

/* =========================================================
   API HELPER
========================================================= */
async function api(url) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  const result = await res.json();
  if (!result.success) {
    throw new Error(result.message || "API error");
  }

  return result.data;
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

    renderActionStrip(rfqs);
    renderSummary(rfqs, pos);
    renderRFQTable(rfqs);
    renderPOTable(pos);
    renderCharts(rfqs, pos);

  } catch (err) {
    console.error(err);
    alert(err.message || "Failed to load supplier dashboard");
  }
}

/* =========================================================
   SUMMARY
========================================================= */
function renderSummary(rfqs, pos) {
  const supplierAction = rfqs.filter(r => r.status === "active").length;
  const buyerReview = rfqs.filter(r => r.status === "quoted").length;

  document.getElementById("summarySection").innerHTML = `
    <div class="card">
      <h3>RFQs Requiring Action</h3>
      <p>${supplierAction}</p>
    </div>

    <div class="card">
      <h3>Quotes Submitted</h3>
      <p>${buyerReview}</p>
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
   ACTION STRIP
========================================================= */
function renderActionStrip(rfqs) {
  const urgent = rfqs.filter(r => r.status === "active").length;
  const strip = document.getElementById("actionStrip");

  if (!urgent) {
    strip.classList.add("hidden");
    return;
  }

  strip.textContent = `${urgent} RFQ(s) require your quotation`;
  strip.classList.remove("hidden");
}

/* =========================================================
   RFQ TABLE
========================================================= */
function renderRFQTable(rfqs) {
  const tbody = document.getElementById("rfqTableBody");
  tbody.innerHTML = "";

  if (!rfqs.length) {
    tbody.innerHTML =
      `<tr><td colspan="6">No RFQs available</td></tr>`;
    return;
  }

  rfqs.forEach(r => {
    tbody.innerHTML += `
      <tr>
        <td>${r.id}</td>
        <td>${r.part_name}</td>
        <td>${r.total_quantity}</td>
        <td>
          <span class="status ${r.status}">
            ${formatStatus(r.status)}
          </span>
        </td>
        <td>${new Date(r.created_at).toLocaleDateString()}</td>
        <td>
          <button onclick="openRFQ(${r.id})">Open</button>
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
    tbody.innerHTML =
      `<tr><td colspan="6">No purchase orders</td></tr>`;
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
   CHARTS (REAL DATA)
========================================================= */
let rfqChart, flowChart;

function renderCharts(rfqs, pos) {
  rfqChart?.destroy();
  flowChart?.destroy();

  const active = rfqs.filter(r => r.status === "active").length;
  const quoted = rfqs.filter(r => r.status === "quoted").length;
  const closed = rfqs.filter(r => r.status === "closed").length;

  rfqChart = new Chart(rfqFunnelChart, {
    type: "bar",
    data: {
      labels: ["Active", "Quoted", "Closed"],
      datasets: [{
        data: [active, quoted, closed],
        backgroundColor: ["#f59e0b", "#6366f1", "#10b981"]
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });

  flowChart = new Chart(winRateChart, {
    type: "doughnut",
    data: {
      labels: ["RFQs", "POs"],
      datasets: [{
        data: [rfqs.length, pos.length],
        backgroundColor: ["#e5e7eb", "#1e3a8a"]
      }]
    },
    options: {
      cutout: "70%",
      plugins: { legend: { position: "bottom" } }
    }
  });
}

/* =========================================================
   HELPERS
========================================================= */
function formatStatus(status) {
  return status.replace("_", " ").toUpperCase();
}

/* =========================================================
   NAVIGATION
========================================================= */
function openRFQ(id) {
  window.location.href = `/supplier-rfq-detail.html?id=${id}`;
}

function openPO(id) {
  window.location.href = `/po-detail.html?id=${id}`;
}

function logout() {
  localStorage.clear();
  window.location.href = "/login";
}
