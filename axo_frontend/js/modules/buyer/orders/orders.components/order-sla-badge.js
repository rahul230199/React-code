/* =========================================================
   AXO NETWORKS — ORDER SLA BADGE
   Risk Indicator | Reusable | Premium UI
========================================================= */

/* =========================================================
   CONFIG MAP
========================================================= */

const SLA_CONFIG = {
  SAFE: {
    label: "Safe",
    icon: "shield-check",
    className: "sla-safe"
  },
  WATCH: {
    label: "Watch",
    icon: "eye",
    className: "sla-watch"
  },
  HIGH: {
    label: "High Risk",
    icon: "alert-circle",
    className: "sla-high"
  },
  CRITICAL: {
    label: "Critical",
    icon: "alert-octagon",
    className: "sla-critical"
  }
};

/* =========================================================
   EXPORT COMPONENT
========================================================= */

export const OrderSLABadge = {

  render(riskLevel, options = {}) {

    if (!riskLevel) return "";

    const config =
      SLA_CONFIG[riskLevel] ||
      SLA_CONFIG["SAFE"];

    const size = options.size || "default"; // default | compact

    return `
      <div class="sla-badge ${config.className} ${size}">

        <i data-lucide="${config.icon}"></i>

        ${
          size !== "compact"
            ? `<span>${config.label}</span>`
            : ""
        }

      </div>
    `;
  }

};