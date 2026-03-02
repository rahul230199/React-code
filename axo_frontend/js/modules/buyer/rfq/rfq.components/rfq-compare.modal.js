/* =========================================================
   AXO NETWORKS — RFQ COMPARE MODAL (SAAS PREMIUM VERSION)
   - Balanced grid layout
   - Equal-height cards
   - Clear visual hierarchy
   - Enterprise spacing system
   - Clean metric alignment
========================================================= */

import { refreshLucideIcons } from "../../core/buyer-icons.js";

/* =========================================================
   HELPERS
========================================================= */

const safe = (v, f = "-") =>
  v === undefined || v === null ? f : v;

const getTierColor = (tier) => {
  switch (tier) {
    case "ELITE": return "#16a34a";
    case "PREFERRED": return "#2563eb";
    case "STABLE": return "#f59e0b";
    default: return "#ef4444";
  }
};

const scoreBar = (value, color) => `
  <div class="score-bar">
    <div class="score-bar-fill"
         style="width:${Math.min(Number(value) || 0, 100)}%;
                background:${color};">
    </div>
  </div>
`;

const scoreRing = (score, color) => {
  const s = Number(score) || 0;
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (s / 100) * circumference;

  return `
    <div class="score-ring-wrapper">
      <svg width="78" height="78">
        <circle cx="39" cy="39" r="${radius}"
                stroke="#e5e7eb"
                stroke-width="6"
                fill="transparent"/>
        <circle cx="39" cy="39" r="${radius}"
                stroke="${color}"
                stroke-width="6"
                fill="transparent"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}"
                stroke-linecap="round"
                transform="rotate(-90 39 39)"/>
        <text x="50%" y="50%"
              text-anchor="middle"
              dy=".35em"
              font-size="14"
              font-weight="700"
              fill="#111827">${s}</text>
      </svg>
      <span class="score-label">Reliability</span>
    </div>
  `;
};

/* =========================================================
   COMPONENT
========================================================= */

export const RFQCompareModal = {

  render(quotes = []) {

    if (!Array.isArray(quotes) || !quotes.length) {
      return `
        <div class="modal-header">
          <h3>No quotes available</h3>
          <button class="modal-close" data-close>✕</button>
        </div>
      `;
    }

    const lowestPrice =
      Math.min(...quotes.map(q => Number(q.price) || 0));

    return `
      <div class="modal-header">
        <h3>
          <i data-lucide="git-compare"></i>
          AI Supplier Comparison
        </h3>
        <button class="modal-close" data-close>✕</button>
      </div>

      <div class="modal-body compare-body">

        <div class="compare-grid">

          ${quotes.map(q => {

            const tierColor =
              getTierColor(q.reliability_tier);

            const price =
              Number(q.price) || 0;

            const priceDelta =
              price - lowestPrice;

            const isLowest =
              price === lowestPrice;

            return `
              <div class="compare-card
                   ${q.is_recommended ? "recommended" : ""}">

                <!-- HEADER -->
                <div class="compare-header">

                  <div class="supplier-info">
                    <h4>${safe(q.supplier?.name)}</h4>
                    <span class="tier"
                          style="color:${tierColor}">
                      ${safe(q.reliability_tier)}
                    </span>
                  </div>

                  ${scoreRing(q.reliability_score, tierColor)}

                </div>

                <!-- DIVIDER -->
                <div class="divider"></div>

                <!-- METRICS -->
                <div class="compare-metrics">

                  <div class="metric-block">
                    <label>Price</label>
                    <strong>₹${price.toLocaleString()}</strong>
                    ${
                      isLowest
                        ? `<span class="delta positive">Best Price</span>`
                        : `<span class="delta negative">
                             +₹${priceDelta.toLocaleString()}
                           </span>`
                    }
                  </div>

                  <div class="metric-block">
                    <label>Timeline</label>
                    <strong>${safe(q.timeline_days)} days</strong>
                  </div>

                  <div class="metric-block">
                    <label>Confidence</label>
                    ${scoreBar(q.confidence_index, "#3b82f6")}
                  </div>

                  <div class="metric-block">
                    <label>Value Index</label>
                    ${scoreBar((q.value_index || 0) * 100, "#10b981")}
                  </div>

                </div>

                <!-- RISKS -->
                ${
                  q.risk_flags?.dispute_risk ||
                  q.risk_flags?.delay_risk
                    ? `
                      <div class="compare-risks">
                        ${
                          q.risk_flags?.dispute_risk
                            ? `<div class="risk-badge dispute">
                                 <i data-lucide="alert-triangle"></i>
                                 Dispute Risk
                               </div>`
                            : ""
                        }
                        ${
                          q.risk_flags?.delay_risk
                            ? `<div class="risk-badge delay">
                                 <i data-lucide="clock"></i>
                                 Delay Risk
                               </div>`
                            : ""
                        }
                      </div>
                    `
                    : ""
                }

                ${
                  q.is_recommended
                    ? `
                      <div class="recommend-box">
                        <i data-lucide="sparkles"></i>
                        ${safe(q.recommendation_reason)}
                      </div>
                    `
                    : ""
                }

                <!-- ACTION -->
                <div class="compare-actions">
                  <button class="btn-accept"
                          data-accept="${q.id}">
                    <i data-lucide="check"></i>
                    Accept Supplier
                  </button>
                </div>

              </div>
            `;
          }).join("")}

        </div>

      </div>
    `;
  }

};