/* =========================================================
   AXO NETWORKS — RFQ TIMELINE (SAAS PREMIUM)
   - Horizontal progression
   - Connected stages
   - Active + completed styling
   - Enterprise spacing
========================================================= */

import { refreshLucideIcons } from "../../core/buyer-icons.js";

/* =========================================================
   HELPERS
========================================================= */

const getStageIcon = (stage) => {
  const map = {
    created: "file-plus",
    quoted: "file-text",
    ranked: "sparkles",
    awarded: "badge-check",
    closed: "check-circle",
    dispute: "alert-triangle"
  };
  return map[stage] || "circle";
};

const stageOrder = [
  "created",
  "quoted",
  "ranked",
  "awarded",
  "closed"
];

/* =========================================================
   COMPONENT
========================================================= */

export const RFQTimeline = {

  render(data = {}) {

    const {
      status,
      quotesCount = 0,
      hasRanking = false,
      hasPO = false,
      hasDispute = false
    } = data;

    const activeStage = (() => {

      if (status === "closed") return "closed";
      if (hasPO) return "awarded";
      if (hasRanking) return "ranked";
      if (quotesCount > 0) return "quoted";
      return "created";

    })();

    return `
      <div class="rfq-timeline-premium glass-card">

        <div class="timeline-header">
          <h4>
            <i data-lucide="git-branch"></i>
            RFQ Lifecycle
          </h4>
        </div>

        <div class="timeline-wrapper">

          ${stageOrder.map((stage, index) => {

            const isActive =
              stage === activeStage;

            const isCompleted =
              stageOrder.indexOf(stage)
              <= stageOrder.indexOf(activeStage);

            return `
              <div class="timeline-stage
                   ${isActive ? "active" : ""}
                   ${isCompleted ? "completed" : ""}">

                <div class="timeline-circle">
                  <i data-lucide="${getStageIcon(stage)}"></i>
                </div>

                <div class="timeline-text">
                  ${stage.toUpperCase()}
                  ${
                    stage === "quoted"
                      ? `<span class="timeline-meta">
                           ${quotesCount} Quotes
                         </span>`
                      : ""
                  }
                </div>

                ${
                  index !== stageOrder.length - 1
                    ? `<div class="timeline-line"></div>`
                    : ""
                }

              </div>
            `;
          }).join("")}

          ${
            hasDispute
              ? `
                <div class="timeline-stage dispute active">
                  <div class="timeline-circle">
                    <i data-lucide="alert-triangle"></i>
                  </div>
                  <div class="timeline-text">
                    DISPUTE
                  </div>
                </div>
              `
              : ""
          }

        </div>

      </div>
    `;
  }
};