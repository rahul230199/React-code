/* =========================================================
   AXO NETWORKS — ORDER SLA DASHBOARD WIDGET
   Aggregate Risk Strip | Premium SaaS | Responsive
========================================================= */

/* =========================================================
   CARD BUILDER
========================================================= */

function renderCard(icon, label, value, className = "") {

  return `
    <div class="sla-widget-card ${className}">

      <div class="sla-widget-icon">
        <i data-lucide="${icon}"></i>
      </div>

      <div class="sla-widget-content">
        <span class="sla-widget-label">${label}</span>
        <strong class="sla-widget-value">
          ${value ?? 0}
        </strong>
      </div>

    </div>
  `;
}

/* =========================================================
   EXPORT COMPONENT
========================================================= */

export const OrderSLADashboardWidget = {

  render(data) {

    if (!data) {
      return `
        <div class="sla-widget-empty glass-card">
          <i data-lucide="shield"></i>
          <span>No SLA data available</span>
        </div>
      `;
    }

    return `
      <div class="sla-widget-strip glass-card">

        ${renderCard(
          "layers",
          "Total POs",
          data.total_pos,
          "neutral"
        )}

        ${renderCard(
          "alert-octagon",
          "Critical",
          data.critical,
          "critical"
        )}

        ${renderCard(
          "alert-circle",
          "High Risk",
          data.high,
          "high"
        )}

        ${renderCard(
          "eye",
          "Watch",
          data.watch,
          "watch"
        )}

      </div>
    `;
  }

};