/* =========================================================
AXO NETWORKS — ORDER TIMELINE
Render Only Component
========================================================= */

/* =========================================================
FORMAT DATE
========================================================= */

function formatDate(date) {

  if (!date) return "—";

  try {

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

  } catch {

    return "—";

  }

}

/* =========================================================
STATUS BADGE
========================================================= */

function renderStatus(status) {

  if (!status) return "";

  const normalized = String(status).toLowerCase();

  return `
    <span class="timeline-status status-${normalized}">
      ${normalized.replace("_"," ").toUpperCase()}
    </span>
  `;

}

/* =========================================================
SINGLE MILESTONE
========================================================= */

function renderMilestone(item = {}) {

  const title =
    item.milestone_name ||
    item.title ||
    item.name ||
    "Milestone";

  const completedDate = item.completed_at;

  return `

    <div
      class="timeline-item"
      data-milestone-id="${item.id || ""}"
    >

      <div class="timeline-indicator"></div>

      <div class="timeline-content">

        <div class="timeline-header">

          <h4 class="timeline-title">
            ${title.replace(/_/g," ")}
          </h4>

          ${renderStatus(item.status)}

        </div>

        <div class="timeline-meta">

          <span>
            Due Date:
            ${formatDate(item.due_date)}
          </span>

          <span>
            Completed:
            ${formatDate(completedDate)}
          </span>

        </div>

        ${
          item.remarks
            ? `
              <p class="timeline-desc">
                ${item.remarks}
              </p>
            `
            : ""
        }

        ${
          item.evidence_url
            ? `
              <a
                href="${item.evidence_url}"
                target="_blank"
                class="timeline-file"
              >
                View Evidence
              </a>
            `
            : ""
        }

      </div>

    </div>

  `;

}

/* =========================================================
EMPTY STATE
========================================================= */

function renderEmpty() {

  return `

    <div class="timeline-empty">

      <i data-lucide="clock"></i>

      <h3>No Milestones Defined</h3>

      <p>This purchase order does not have milestones yet.</p>

    </div>

  `;

}

/* =========================================================
MAIN COMPONENT
========================================================= */

export const OrderTimeline = {

  render(data = {}) {

    const milestones = data.milestones || [];

    if (!milestones.length) {
      return renderEmpty();
    }

    return `

      <div
        class="order-timeline"
        data-order-timeline
      >

        ${milestones.map(renderMilestone).join("")}

      </div>

    `;

  }

};