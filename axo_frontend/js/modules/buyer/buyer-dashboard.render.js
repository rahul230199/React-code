/* =========================================================
   BUYER DASHBOARD — EXECUTIVE ANALYTICS RENDER LAYER
   AXO Enterprise Procurement Intelligence
   Structured · Clean · Scalable
========================================================= */

const containerId = "pageContainer";

/* =========================================================
   INTERNAL HELPERS
========================================================= */

function formatCurrency(value = 0) {
  return `₹ ${Number(value).toLocaleString()}`;
}

function safeNumber(value) {
  return Number(value) || 0;
}

/* =========================================================
   LOADING STATE
========================================================= */

export function renderDashboardLoading() {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="dashboard-loading">
      <h2>Loading Executive Analytics...</h2>
    </div>
  `;
}

/* =========================================================
   MAIN EXECUTIVE DASHBOARD (INTELLIGENCE VERSION)
========================================================= */

export function renderDashboardStats(data = {}) {

  const container = document.getElementById(containerId);
  if (!container) return;

  const {
    kpis = {},
    payments_pending = 0,
    on_time_delivery_percent = 0,
    average_supplier_reliability = 0,
    risk_summary = {},
    capacity_summary = {}
  } = data;

  const reliabilityBadge = getReliabilityBadge(
    average_supplier_reliability
  );

  container.innerHTML = `
    <!-- ===================================================== -->
    <!-- EXECUTIVE HEADER -->
    <!-- ===================================================== -->
    <div class="dashboard-header d-flex justify-between align-center">
      <div>
        <h2>Executive Procurement Intelligence</h2>
        <p class="dashboard-subtitle">
          Operational, reliability & risk visibility
        </p>
      </div>
    </div>

    <!-- ===================================================== -->
    <!-- KPI GRID -->
    <!-- ===================================================== -->
    <div class="kpi-grid">

      <div class="kpi-card">
        <span>Active RFQs</span>
        <h3>${safeNumber(kpis.active_rfqs)}</h3>
      </div>

      <div class="kpi-card">
        <span>Active Orders</span>
        <h3>${safeNumber(kpis.active_orders)}</h3>
      </div>

      <div class="kpi-card risk">
        <span>Disputed Orders</span>
        <h3>${safeNumber(kpis.disputed_orders)}</h3>
      </div>

      <div class="kpi-card success">
        <span>On-Time Delivery</span>
        <h3>${safeNumber(on_time_delivery_percent)}%</h3>
      </div>

      <div class="kpi-card">
        <span>Avg Supplier Reliability</span>
        <h3>
          ${safeNumber(average_supplier_reliability)}
          <small style="font-size:14px;">${reliabilityBadge}</small>
        </h3>
      </div>

      <div class="kpi-card warning">
        <span>Payments Pending</span>
        <h3>${formatCurrency(payments_pending)}</h3>
      </div>

    </div>

    <!-- ===================================================== -->
    <!-- RISK & CAPACITY SUMMARY -->
    <!-- ===================================================== -->
    <div class="chart-grid">

      <div class="chart-card">
        <h4>Risk Overview</h4>
        <div class="risk-summary">
          <p>Overdue Milestones: <strong>${safeNumber(risk_summary.overdue_milestones)}</strong></p>
          <p>Delayed Deliveries: <strong>${safeNumber(risk_summary.delayed_deliveries)}</strong></p>
          <p>Active Disputes: <strong>${safeNumber(risk_summary.active_disputes)}</strong></p>
          <p>Low Reliability Suppliers: <strong>${safeNumber(risk_summary.low_reliability_suppliers)}</strong></p>
        </div>
      </div>

      <div class="chart-card">
        <h4>Capacity Overview</h4>
        <div class="risk-summary">
          <p>Total Suppliers: <strong>${safeNumber(capacity_summary.total_suppliers)}</strong></p>
          <p>Overloaded: <strong>${safeNumber(capacity_summary.overloaded_suppliers)}</strong></p>
          <p>High Risk Capacity: <strong>${safeNumber(capacity_summary.high_risk_suppliers)}</strong></p>
        </div>
      </div>

    </div>
  `;
}

function getReliabilityBadge(score = 0) {

  if (score >= 85) return "🟢 Highly Reliable";
  if (score >= 70) return "🟡 Reliable";
  if (score >= 55) return "🟠 Moderate";
  return "🔴 High Risk";
}

/* =========================================================
   CHART MANAGEMENT (SAFE INSTANCE CONTROL)
========================================================= */

let monthlyChartInstance = null;
let statusChartInstance = null;

/* =========================================================
   MONTHLY SPEND CHART
========================================================= */

function renderMonthlyChart(monthlyData = []) {

  const ctx = document.getElementById("monthlySpendChart");
  if (!ctx || typeof Chart === "undefined") return;

  const labels = monthlyData.map(m => m.month).reverse();
  const values = monthlyData.map(m => safeNumber(m.amount)).reverse();

  if (monthlyChartInstance) {
    monthlyChartInstance.destroy();
  }

  monthlyChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Spend",
        data: values,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

/* =========================================================
   STATUS DISTRIBUTION CHART
========================================================= */

function renderStatusChart(statusData = []) {

  const ctx = document.getElementById("statusChart");
  if (!ctx || typeof Chart === "undefined") return;

  const labels = statusData.map(s => s.status);
  const values = statusData.map(s => safeNumber(s.count));

  if (statusChartInstance) {
    statusChartInstance.destroy();
  }

  statusChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

/* =========================================================
   EMPTY FALLBACK
========================================================= */
export function renderDashboardEmpty() {

  if (monthlyChartInstance) {
    monthlyChartInstance.destroy();
    monthlyChartInstance = null;
  }

  if (statusChartInstance) {
    statusChartInstance.destroy();
    statusChartInstance = null;
  }

  renderDashboardStats({});
}