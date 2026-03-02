/* =========================================================
   AXO NETWORKS — BUYER DASHBOARD PAGE
   Apple Ambient + Route Transition Ready
========================================================= */

import { renderDashboard } from "./dashboard.render.js";
import { loadDashboardData } from "./dashboard.api.js";
import { initializeCharts } from "./dashboard.charts.js";
import { DashboardState } from "./dashboard.state.js";

const containerId = "pageContainer";

/* =========================================================
   LAYOUT TEMPLATE
========================================================= */

function layout() {
  return `
    <div class="buyer-dashboard route-transition">

      <div class="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p class="subtitle">Operational Intelligence</p>
        </div>

        <div class="risk-badge" id="riskBadge">
          <i data-lucide="shield"></i>
          <span id="riskLevelText"></span>
        </div>
      </div>

      <div class="kpi-grid">

        <div class="kpi-card">
          <div class="kpi-icon">
            <i data-lucide="indian-rupee"></i>
          </div>
          <div>
            <p>Total Committed</p>
            <h3 data-field="financial.total_committed"></h3>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">
            <i data-lucide="credit-card"></i>
          </div>
          <div>
            <p>Total Paid</p>
            <h3 data-field="financial.total_paid"></h3>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">
            <i data-lucide="alert-triangle"></i>
          </div>
          <div>
            <p>Outstanding</p>
            <h3 data-field="financial.outstanding_balance"></h3>
          </div>
        </div>

      </div>

      <div class="risk-section">
        <div class="risk-score">
          <h2 data-field="system_health.risk_score"></h2>
          <p>AI Risk Score</p>
        </div>

        <div class="risk-metrics">
          <div>
            <span>Delay Ratio</span>
            <strong data-field="system_health.metrics.delay_ratio"></strong>
          </div>
          <div>
            <span>Dispute Ratio</span>
            <strong data-field="system_health.metrics.dispute_ratio"></strong>
          </div>
          <div>
            <span>Reliability</span>
            <strong data-field="system_health.metrics.reliability_score"></strong>
          </div>
          <div>
            <span>Event Density</span>
            <strong data-field="system_health.metrics.event_density"></strong>
          </div>
        </div>
      </div>

      <div class="chart-section">
        <div class="chart-card">
          <h3>Spend Trend</h3>
          <canvas id="spendTrendChart"></canvas>
        </div>

        <div class="chart-card">
          <h3>Supplier Breakdown</h3>
          <canvas id="supplierChart"></canvas>
        </div>
      </div>

      <div id="dashboardLoader" class="dashboard-loader">
        <div id="dashboardLottie"></div>
      </div>

    </div>
  `;
}

/* =========================================================
   LOAD DASHBOARD PAGE
========================================================= */

export async function loadDashboardPage() {

  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = layout();

  // Micro route transition trigger
  requestAnimationFrame(() => {
    const dashboard = container.querySelector(".buyer-dashboard");
    if (dashboard) {
      dashboard.classList.add("route-transition");
    }
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }

  let loaderAnimation = null;
  const loaderContainer = document.getElementById("dashboardLottie");

  if (loaderContainer && window.lottie) {
    loaderAnimation = window.lottie.loadAnimation({
      container: loaderContainer,
      renderer: "svg",
      loop: true,
      autoplay: true,
      path: "/assets/lottie/dashboard-loader.json"
    });
  }

  try {
    const data = await loadDashboardData();

    DashboardState.set(data);
    renderDashboard(data);
    initializeCharts(data);

  } catch (err) {
    console.error("Dashboard load failed:", err);
  } finally {

    if (loaderAnimation) {
      loaderAnimation.destroy();
    }

    const loader = document.getElementById("dashboardLoader");
    if (loader) loader.remove();
  }
}