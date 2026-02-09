/* =========================================================
   ENV CONFIG
========================================================= */
const ENV = "local"; // switch to "prod" later
const IS_LOCAL = ENV === "local";

/* =========================================================
   AUTH
========================================================= */
function getUser() {
  return JSON.parse(localStorage.getItem("user"));
}

if (IS_LOCAL && !getUser()) {
  localStorage.setItem("user", JSON.stringify({
    id: 22,
    email: "supplier.local@axonetworks.com",
    role: "SUPPLIER"
  }));
}

/* =========================================================
   MOCK DATA (LOCAL MODE)
========================================================= */
const RFQS = [
  {
    id: 601,
    part_name: "Aluminium Housing",
    quantity: 5000,
    status: "supplier_action",
    last_activity: "RFQ issued • 2 hours ago"
  },
  {
    id: 602,
    part_name: "Plastic Enclosure",
    quantity: 8000,
    status: "buyer_review",
    last_activity: "Quote submitted • yesterday"
  }
];

const POS = [
  {
    po_id: "PO-9301",
    rfq_id: 600,
    part_name: "Metal Bracket",
    quantity: 3000,
    accepted_date: "2026-02-08"
  }
];

/* =========================================================
   INIT
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("userEmail").innerText = getUser().email;
  loadDashboard();
  setInterval(loadDashboard, 30000);
});

/* =========================================================
   LOAD DASHBOARD
========================================================= */
function loadDashboard() {
  renderActionStrip(RFQS);
  renderSummary(RFQS, POS);
  renderCharts(RFQS, POS);
  renderRFQTable(RFQS);
  renderPOTable(POS);
}

/* =========================================================
   SUMMARY
========================================================= */
function renderSummary(rfqs, pos) {
  const supplierAction = rfqs.filter(r => r.status === "supplier_action").length;
  const buyerReview = rfqs.filter(r => r.status === "buyer_review").length;

  document.getElementById("summarySection").innerHTML = `
    <div class="card">
      <h3>RFQs Requiring Supplier Action</h3>
      <p>${supplierAction}</p>
      <span>Immediate review required</span>
    </div>

    <div class="card">
      <h3>RFQs Pending Buyer Review</h3>
      <p>${buyerReview}</p>
      <span>Awaiting buyer decision</span>
    </div>

    <div class="card">
      <h3>Purchase Orders Accepted</h3>
      <p>${pos.length}</p>
      <span>Confirmed and active</span>
    </div>

    <div class="card">
      <h3>Total RFQs</h3>
      <p>${rfqs.length + pos.length}</p>
      <span>All requests</span>
    </div>
  `;
}

/* =========================================================
   ACTION STRIP
========================================================= */
function renderActionStrip(rfqs) {
  const urgent = rfqs.filter(r => r.status === "supplier_action").length;
  const strip = document.getElementById("actionStrip");

  if (!urgent) {
    strip.classList.add("hidden");
    return;
  }

  strip.textContent = `${urgent} RFQ(s) require supplier action`;
  strip.classList.remove("hidden");
}

/* =========================================================
   RFQ TABLE (ACTION-FIRST SORT)
========================================================= */
function renderRFQTable(rfqs) {
  const tbody = document.getElementById("rfqTableBody");
  tbody.innerHTML = "";

  rfqs
    .sort((a, b) => a.status === "supplier_action" ? -1 : 1)
    .forEach(r => {
      tbody.innerHTML += `
        <tr data-status="${r.status}">
          <td>${r.id}</td>
          <td>${r.part_name}</td>
          <td>${r.quantity}</td>
          <td><span class="status ${r.status}">${labelStatus(r.status)}</span></td>
          <td class="muted">${r.last_activity}</td>
          <td><button onclick="openRFQ(${r.id})">Open</button></td>
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
    tbody.innerHTML = `<tr><td colspan="6">No accepted purchase orders</td></tr>`;
    return;
  }

  pos.forEach(po => {
    tbody.innerHTML += `
      <tr>
        <td>${po.po_id}</td>
        <td>${po.rfq_id}</td>
        <td>${po.part_name}</td>
        <td>${po.quantity}</td>
        <td>${po.accepted_date}</td>
        <td><button>View</button></td>
      </tr>
    `;
  });
}

/* =========================================================
   STATUS LABELS
========================================================= */
function labelStatus(status) {
  if (status === "supplier_action") return "Supplier Action Required";
  if (status === "buyer_review") return "Buyer Review Pending";
  return "RFQ Open";
}

/* =========================================================
   CHARTS – ENTERPRISE DECISION-ORIENTED
========================================================= */
let rfqChart, flowChart, conversionChart;

function renderCharts(rfqs, pos) {
  rfqChart?.destroy();
  flowChart?.destroy();
  conversionChart?.destroy();

  const supplierAction = rfqs.filter(r => r.status === "supplier_action").length;
  const buyerReview = rfqs.filter(r => r.status === "buyer_review").length;
  const converted = pos.length;
  const total = rfqs.length + pos.length;

  /* Supplier Workload */
  rfqChart = new Chart(rfqFunnelChart, {
    type: "bar",
    data: {
      labels: ["Supplier Action Required", "Other RFQs"],
      datasets: [{
        data: [supplierAction, total - supplierAction],
        backgroundColor: ["#dc2626", "#e5e7eb"],
        borderRadius: 6,
        barThickness: 26
      }]
    },
    options: {
      indexAxis: "y",
      animation: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true } }
    }
  });

  /* RFQ Flow */
  flowChart = new Chart(winRateChart, {
    type: "doughnut",
    data: {
      labels: ["Supplier Action", "Buyer Review", "Converted"],
      datasets: [{
        data: [supplierAction, buyerReview, converted],
        backgroundColor: ["#f59e0b", "#6366f1", "#10b981"]
      }]
    },
    options: {
      cutout: "70%",
      animation: false,
      plugins: { legend: { position: "bottom" } }
    }
  });

  /* Conversion */
  const rate = total ? Math.round((converted / total) * 100) : 0;

  conversionChart = new Chart(actionLoadChart, {
    type: "doughnut",
    data: {
      labels: ["Accepted", "Not Converted"],
      datasets: [{
        data: [rate, 100 - rate],
        backgroundColor: ["#1e3a8a", "#e5e7eb"]
      }]
    },
    options: {
      cutout: "80%",
      animation: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } }
    }
  });

  const ctx = actionLoadChart.getContext("2d");
  ctx.font = "600 22px Inter";
  ctx.fillStyle = "#111827";
  ctx.textAlign = "center";
  ctx.fillText(`${rate}%`, actionLoadChart.width / 2, actionLoadChart.height / 2 + 6);
}

/* =========================================================
   NAV
========================================================= */
function openRFQ(id) {
  window.location.href = `/supplier-rfq-detail.html?id=${id}`;
}

function logout() {
  localStorage.clear();
  window.location.reload();
}

