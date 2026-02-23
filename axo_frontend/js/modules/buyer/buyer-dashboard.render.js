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
   MAIN EXECUTIVE DASHBOARD
========================================================= */

export function renderDashboardStats(data = {}) {

  const container = document.getElementById(containerId);
  if (!container) return;

  const {
    total_spend = 0,
    total_pos = 0,
    active_pos = 0,
    disputed_pos = 0,
    total_paid = 0,
    outstanding_balance = 0,
    monthly_spend = [],
    status_distribution = []
  } = data;

  const totalSpendNum = safeNumber(total_spend);
  const totalPaidNum = safeNumber(total_paid);
  const outstandingNum = safeNumber(outstanding_balance);

  const paidPercentage =
    totalSpendNum > 0
      ? Math.min((totalPaidNum / totalSpendNum) * 100, 100)
      : 0;

  const outstandingPercentage =
    totalSpendNum > 0
      ? Math.min((outstandingNum / totalSpendNum) * 100, 100)
      : 0;

  container.innerHTML = `
    <!-- ===================================================== -->
    <!-- EXECUTIVE HEADER -->
    <!-- ===================================================== -->
    <div class="dashboard-header d-flex justify-between align-center">
      <div>
        <h2>Executive Procurement Overview</h2>
        <p class="dashboard-subtitle">
          Organization-level financial & operational intelligence
        </p>
      </div>

      <div class="rfq-actions">
        <select class="input-select" id="dashboardTimeFilter">
          <option value="6m">Last 6 Months</option>
          <option value="ytd">Year to Date</option>
          <option value="all">All Time</option>
        </select>
      </div>
    </div>

    <!-- ===================================================== -->
    <!-- KPI GRID -->
    <!-- ===================================================== -->
    <div class="kpi-grid">

      <div class="kpi-card">
        <span>Total Procurement Spend</span>
        <h3>${formatCurrency(totalSpendNum)}</h3>
      </div>

      <div class="kpi-card">
        <span>Total Purchase Orders</span>
        <h3>${safeNumber(total_pos)}</h3>
      </div>

      <div class="kpi-card">
        <span>Active Orders</span>
        <h3>${safeNumber(active_pos)}</h3>
      </div>

      <div class="kpi-card risk">
        <span>Disputed Orders</span>
        <h3>${safeNumber(disputed_pos)}</h3>
      </div>

      <div class="kpi-card success">
        <span>Total Paid</span>
        <h3>${formatCurrency(totalPaidNum)}</h3>
      </div>

      <div class="kpi-card warning">
        <span>Outstanding Liability</span>
        <h3>${formatCurrency(outstandingNum)}</h3>
      </div>

    </div>

    <!-- ===================================================== -->
    <!-- FINANCIAL COMPARISON BLOCK -->
    <!-- ===================================================== -->
    <div class="chart-card" style="height:auto;margin-bottom: var(--space-6);">
      <h4>Financial Position — Paid vs Outstanding</h4>

      <div style="margin-top: var(--space-4);">
        <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--gray-600); margin-bottom:6px;">
          <span>Paid (${paidPercentage.toFixed(1)}%)</span>
          <span>${formatCurrency(totalPaidNum)}</span>
        </div>
        <div style="height:8px; background:var(--gray-100); border-radius:8px; overflow:hidden;">
          <div style="
            width:${paidPercentage}%;
            height:100%;
            background:var(--green-500);
            transition: width 0.4s ease;
          "></div>
        </div>
      </div>

      <div style="margin-top: var(--space-5);">
        <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--gray-600); margin-bottom:6px;">
          <span>Outstanding (${outstandingPercentage.toFixed(1)}%)</span>
          <span>${formatCurrency(outstandingNum)}</span>
        </div>
        <div style="height:8px; background:var(--gray-100); border-radius:8px; overflow:hidden;">
          <div style="
            width:${outstandingPercentage}%;
            height:100%;
            background:var(--yellow-500);
            transition: width 0.4s ease;
          "></div>
        </div>
      </div>
    </div>

    <!-- ===================================================== -->
    <!-- ANALYTICS CHARTS -->
    <!-- ===================================================== -->
    <div class="chart-grid">

      <div class="chart-card">
        <h4>Monthly Spend Trend</h4>
        <canvas id="monthlySpendChart"></canvas>
      </div>

      <div class="chart-card">
        <h4>PO Status Distribution</h4>
        <canvas id="statusChart"></canvas>
      </div>

    </div>

    <!-- ===================================================== -->
    <!-- TOP SUPPLIERS (FUTURE EXTENSION READY) -->
    <!-- ===================================================== -->
    <div class="chart-card" style="height:auto;">
      <h4>Top Supplier Contribution</h4>
      <div class="dashboard-empty" style="padding: var(--space-8);">
        <p>Supplier analytics will appear here once supplier aggregation is enabled.</p>
      </div>
    </div>
  `;

  renderMonthlyChart(monthly_spend);
  renderStatusChart(status_distribution);
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
  renderDashboardStats({});
}