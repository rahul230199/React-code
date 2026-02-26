/* =========================================================
   AXO NETWORKS — SYSTEM RENDER (PREMIUM DASHBOARD)
   Linear / Stripe Inspired
========================================================= */

export const SystemRender = {

  render(container, state = {}) {
    if (!container) return;

    container.innerHTML = `
      <div class="system-wrapper">
        ${this.header(state)}
        ${this.content(state)}
      </div>
    `;
  },

  /* ------------------------------------------------------ */
  header(state = {}) {

    const updatedTime = state.lastUpdatedAt
      ? new Date(state.lastUpdatedAt).toLocaleTimeString()
      : null;

    return `
      <div class="system-header">
        <div class="system-title">
          <h2>System Health</h2>
          ${
            updatedTime
              ? `<span class="system-updated">
                   Updated ${escapeHtml(updatedTime)}
                 </span>`
              : ""
          }
        </div>

        <div class="system-actions">
          <button class="btn-refresh" data-action="refresh">
            Refresh
          </button>

         
        </div>
      </div>
    `;
  },

  /* ------------------------------------------------------ */
  content(state = {}) {

    if (state.loading) return this.skeleton();

    if (state.error)
      return `<div class="system-error">Unable to load metrics.</div>`;

    if (!state.metrics)
      return `<div class="system-empty">No data available.</div>`;

    const m = state.metrics;

    const healthScore = calculateHealthScore(m);

    return `
      <div class="system-top-row">

        ${this.healthCard(healthScore)}

        <div class="system-grid">
          ${this.metricCard("New Users (7d)", m.user_growth_7_days, "up")}
          ${this.metricCard("New Orgs (7d)", m.new_organizations_7_days, "up")}
          ${this.metricCard("Revenue (30d)", formatCurrency(m.revenue_last_30_days), "up")}
          ${this.metricCard("Active Disputes", m.active_disputes, "down")}
          ${this.metricCard("Pending Network", m.pending_network_requests, "down")}
          ${this.metricCard("Open RFQs", m.open_rfqs, "down")}
          ${this.metricCard("PO In Progress", m.in_progress_pos, "neutral")}
        </div>

      </div>

      <div class="system-chart-card">
        <div class="chart-header">
          <h3>Revenue Overview</h3>
        </div>
        <div class="chart-container">
          <canvas id="systemRevenueChart"></canvas>
        </div>
      </div>
    `;
  },

  /* ------------------------------------------------------ */
  metricCard(label, value, trend = "neutral") {

    const trendIcon = {
      up: `<span class="trend up">▲</span>`,
      down: `<span class="trend down">▼</span>`,
      neutral: `<span class="trend neutral">●</span>`
    };

    return `
      <div class="system-card">
        <div class="system-card-top">
          <span class="system-card-title">${escapeHtml(label)}</span>
          ${trendIcon[trend]}
        </div>

        <div class="system-card-value counter" data-value="${Number(value) || 0}">
          ${escapeHtml(value ?? 0)}
        </div>

        <div class="sparkline">
          <canvas></canvas>
        </div>
      </div>
    `;
  },

  /* ------------------------------------------------------ */
  healthCard(score) {

    const status =
      score >= 85 ? "excellent" :
      score >= 70 ? "good" :
      score >= 50 ? "warning" : "critical";

    return `
      <div class="health-card ${status}">
        <div class="health-ring">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" class="ring-bg"/>
            <circle cx="60" cy="60" r="50"
              class="ring-progress"
              stroke-dasharray="314"
              stroke-dashoffset="${314 - (314 * score) / 100}"
            />
          </svg>
          <div class="health-score">${score}</div>
        </div>
        <div class="health-label">Health Score</div>
      </div>
    `;
  },

  /* ------------------------------------------------------ */
  skeleton() {
    return `
      <div class="system-grid">
        ${Array(7).fill(`
          <div class="system-card skeleton-card"></div>
        `).join("")}
      </div>
    `;
  }

};

/* ========================================================= */

function calculateHealthScore(m) {

  let score = 100;

  score -= m.active_disputes * 2;
  score -= m.pending_network_requests * 2;
  score -= m.open_rfqs * 1;

  return Math.max(0, Math.min(100, score));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default SystemRender;