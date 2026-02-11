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

function logout() {
  localStorage.clear();
  window.location.href = "/login.html";
}

/* =========================================================
   AUTH GUARD (FIXED – NO REDIRECT LOOP)
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const user = getUser();
  const token = getToken();

  // 🔥 CRITICAL: do NOT run auth guard before DOMContentLoaded
  if (!user || !token || user.role !== "SUPPLIER") {
    console.warn("Auth failed, redirecting to login");
    logout();
    return;
  }

  const emailEl = document.getElementById("userEmail");
  if (emailEl) {
    emailEl.textContent = user.email;
  }

  loadDashboard();
});

/* =========================================================
   API HELPER
========================================================= */
async function api(url) {
  const token = getToken();

  if (!token) {
    logout();
    return;
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (res.status === 401 || res.status === 403) {
    logout();
    return;
  }

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
    console.error("Dashboard load failed:", err.message);
    alert("Failed to load supplier dashboard");
  }
}

/* =========================================================
   STATUS DERIVATION (REAL DATA)
========================================================= */
function deriveSupplierStatus(r) {
  if (r.has_po) return "po_received";
  if (r.quote_id) return "quoted";
  return "active";
}

/* =========================================================
   SUMMARY
========================================================= */
function renderSummary(rfqs, pos) {
  const rfqAction = rfqs.filter(r => !r.quote_id).length;
  const quotesSubmitted = rfqs.filter(r => r.quote_id && !r.has_po).length;

  document.getElementById("summarySection").innerHTML = `
    <div class="card">
      <h3>RFQs Requiring Action</h3>
      <p>${rfqAction}</p>
    </div>

    <div class="card">
      <h3>Quotes Submitted</h3>
      <p>${quotesSubmitted}</p>
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
  const urgent = rfqs.filter(r => !r.quote_id).length;
  const strip = document.getElementById("actionStrip");

  if (!strip) return;

  if (!urgent) {
    strip.classList.add("hidden");
    return;
  }

  strip.textContent = `${urgent} RFQ(s) awaiting your quote`;
  strip.classList.remove("hidden");
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
    const status = deriveSupplierStatus(r);

    tbody.innerHTML += `
      <tr>
        <td>${r.id}</td>
        <td>${r.part_name}</td>
        <td>${r.total_quantity}</td>
        <td>
          <span class="status ${status}">
            ${formatStatus(status)}
          </span>
        </td>
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
  const quoted = rfqs.filter(r => r.quote_id && !r.has_po).length;
  const closed = rfqs.filter(r => r.has_po).length;

  rfqChart = new Chart(
    document.getElementById("rfqFunnelChart"),
    {
      type: "bar",
      data: {
        labels: ["Active", "Quoted", "PO Received"],
        datasets: [{
          data: [active, quoted, closed],
          backgroundColor: ["#f59e0b", "#6366f1", "#10b981"]
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    }
  );

  flowChart = new Chart(
    document.getElementById("winRateChart"),
    {
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
    }
  );
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

