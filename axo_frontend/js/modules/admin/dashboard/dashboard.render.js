/* =========================================================
   AXO NETWORKS — DASHBOARD RENDER (ENTERPRISE LUCIDE)
   Structured • Safe • Animated • Production Ready
========================================================= */

export const DashboardRender = {

  /* ================= LAYOUT ================= */

  layout() {
    return `
      <section class="dashboard-wrapper">

        <header class="dashboard-header">
          <h2>Dashboard Overview</h2>
          <button class="btn-refresh" data-action="reload-dashboard">
            Refresh
          </button>
        </header>

        <div class="dashboard-content"></div>

      </section>
    `;
  },

  /* ================= MAIN RENDER ================= */

  renderAll(container, { data, loading, error }) {

    if (!container) return;

    const content = container.querySelector(".dashboard-content");
    if (!content) return;

    if (loading) {
      content.innerHTML = this.loadingTemplate();
      return;
    }

    if (error) {
      content.innerHTML = this.errorTemplate();
      return;
    }

    if (!data) {
      content.innerHTML = this.emptyTemplate();
      return;
    }

    content.innerHTML = this.statsTemplate(data);

    requestAnimationFrame(() => {
      animateCounters(content);
    });
  },

  /* ================= STATES ================= */

  loadingTemplate() {
    return `
      <div class="dashboard-loading">
        <div class="loader"></div>
      </div>
    `;
  },

  errorTemplate() {
    return `
      <div class="dashboard-error">
        <p>Unable to load dashboard data.</p>
        <button class="btn-retry" data-action="reload-dashboard">
          Retry
        </button>
      </div>
    `;
  },

  emptyTemplate() {
    return `
      <div class="dashboard-empty">
        <p>No dashboard data available.</p>
      </div>
    `;
  },

  /* ================= STATS ================= */

  statsTemplate(data) {

    const network = safeObject(data?.network_requests);

    const stats = [
      { key: "requests", label: "Total Requests", value: network.total_requests, trend: 8 },
      { key: "pending", label: "Pending", value: network.pending, trend: -2 },
      { key: "approved", label: "Approved", value: network.approved, trend: 12 },
      { key: "rejected", label: "Rejected", value: network.rejected, trend: -5 },
      { key: "users", label: "Total Users", value: data?.total_users, trend: 6 },
      { key: "orgs", label: "Organizations", value: data?.total_organizations, trend: 4 }
    ];

    return `
      <div class="dashboard-grid">
        ${stats.map(stat =>
          this.statCard(
            stat.key,
            sanitize(stat.label),
            normalizeNumber(stat.value),
            normalizeNumber(stat.trend)
          )
        ).join("")}
      </div>
    `;
  },

  /* ================= CARD ================= */

  statCard(key, label, value, trend = 0) {

    const isPositive = trend >= 0;
    const trendClass = isPositive ? "trend-up" : "trend-down";
    const trendSymbol = isPositive ? "+" : "";

    return `
      <article class="stat-card">

        <div class="stat-top">
          ${this.iconTemplate(key)}
          <span class="label">${label}</span>
        </div>

        <div class="stat-bottom">
          <span class="value"
                data-count="${value}"
                data-animated="false">0</span>

          <span class="trend ${trendClass}">
            ${trendSymbol}${Math.abs(trend)}%
          </span>
        </div>

      </article>
    `;
  },

  /* ================= LUCIDE ICONS ================= */

  iconTemplate(type) {

    const icons = {

      requests: `
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      `,

      pending: `
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      `,

      approved: `
        <polyline points="20 6 9 17 4 12"/>
      `,

      rejected: `
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      `,

      users: `
        <circle cx="9" cy="7" r="4"/>
        <path d="M17 11a4 4 0 1 0-4-4"/>
      `,

      orgs: `
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      `
    };

    return `
      <svg class="stat-icon"
           viewBox="0 0 24 24"
           fill="none"
           stroke="currentColor"
           stroke-width="2"
           stroke-linecap="round"
           stroke-linejoin="round">
        ${icons[type] || icons.requests}
      </svg>
    `;
  }

};

export default DashboardRender;

/* =========================================================
   COUNTER ANIMATION (RAF + SAFE)
========================================================= */

function animateCounters(scope) {

  scope.querySelectorAll(".value").forEach(el => {

    if (el.dataset.animated === "true") return;

    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;

    el.dataset.animated = "true";

    const duration = 700;
    const startTime = performance.now();

    function update(currentTime) {

      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = easeOutCubic(progress);
      const current = Math.floor(target * eased);

      el.textContent = formatNumber(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  });
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/* =========================================================
   UTILITIES
========================================================= */

function safeObject(obj) {
  return obj && typeof obj === "object" ? obj : {};
}

function normalizeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function formatNumber(value) {
  return normalizeNumber(value).toLocaleString("en-IN");
}

function sanitize(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}