/* =========================================================
   AXO NETWORKS — ORDER MILESTONES TIMELINE
   SLA Aware | Stage Driven | Premium Timeline UI
========================================================= */

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

/* =========================================================
   STATUS BADGE
========================================================= */

function renderMilestoneStatus(m) {

  if (m.status === "completed") {
    return `<span class="milestone-status completed">
              <i data-lucide="check-circle"></i>
              Completed
            </span>`;
  }

  if (m.is_overdue) {
    return `<span class="milestone-status overdue">
              <i data-lucide="alert-triangle"></i>
              Overdue
            </span>`;
  }

  return `<span class="milestone-status pending">
            <i data-lucide="clock"></i>
            Pending
          </span>`;
}

/* =========================================================
   COMPLETE BUTTON
========================================================= */

function renderCompleteButton(m, poStatus) {

  if (
    m.status === "completed" ||
    poStatus === "completed" ||
    poStatus === "cancelled"
  ) {
    return "";
  }

  return `
    <button class="milestone-complete-btn btn-outline"
            data-complete-milestone="${m.milestone_name}">
      Mark Complete
    </button>
  `;
}

/* =========================================================
   SINGLE MILESTONE
========================================================= */

function renderMilestoneItem(m, poStatus) {

  return `
    <div class="milestone-item ${m.status} ${m.is_overdue ? "overdue" : ""}">

      <div class="milestone-marker">
        ${m.status === "completed"
          ? `<i data-lucide="check"></i>`
          : `<span></span>`
        }
      </div>

      <div class="milestone-content">

        <div class="milestone-header">
          <h4>${m.milestone_name}</h4>
          ${renderMilestoneStatus(m)}
        </div>

        <div class="milestone-meta">

          <div class="meta-row">
            <span>Due Date</span>
            <strong>${formatDate(m.due_date)}</strong>
          </div>

          ${m.completed_at ? `
            <div class="meta-row">
              <span>Completed</span>
              <strong>${formatDate(m.completed_at)}</strong>
            </div>
          ` : ""}

          ${m.evidence_url ? `
            <div class="meta-row">
              <span>Evidence</span>
              <a href="${m.evidence_url}"
                 target="_blank"
                 class="evidence-link">
                 View File
              </a>
            </div>
          ` : ""}

          ${m.remarks ? `
            <div class="meta-row remarks">
              <span>Remarks</span>
              <p>${m.remarks}</p>
            </div>
          ` : ""}

        </div>

        <div class="milestone-actions">
          ${renderCompleteButton(m, poStatus)}
        </div>

      </div>

    </div>
  `;
}

/* =========================================================
   EXPORT COMPONENT
========================================================= */

export const OrderMilestonesTimeline = {

  render(data) {

    const { milestones, po } = data;

    if (!milestones || !milestones.length) {
      return `
        <div class="milestones-empty glass-card">
          <i data-lucide="list"></i>
          <h3>No Milestones Defined</h3>
        </div>
      `;
    }

    return `
      <div class="milestones-timeline">

        ${milestones.map(m =>
          renderMilestoneItem(m, po.status)
        ).join("")}

      </div>
    `;
  }

};