/* =========================================================
   AXO NETWORKS — ORDER STATUS ACTIONS
   Backend Aligned | Transition Safe | Premium UI
========================================================= */

/* =========================================================
   TRANSITION MAP (MIRROR BACKEND)
========================================================= */

const TRANSITIONS = {
  issued: ["accepted", "cancelled"],
  accepted: ["in_progress", "cancelled"],
  in_progress: ["completed", "disputed"],
  completed: [],
  disputed: ["completed"],
  cancelled: []
};

/* =========================================================
   LABEL MAP
========================================================= */

const LABELS = {
  accepted: "Accept PO",
  cancelled: "Cancel PO",
  in_progress: "Start Production",
  completed: "Mark Completed",
  disputed: "Mark Disputed"
};

/* =========================================================
   STYLE MAP
========================================================= */

const STYLE_MAP = {
  accepted: "btn-primary",
  in_progress: "btn-primary",
  completed: "btn-success",
  cancelled: "btn-danger",
  disputed: "btn-warning"
};

/* =========================================================
   EXPORT COMPONENT
========================================================= */

export const OrderStatusActions = {

  render(currentStatus) {

    const allowed = TRANSITIONS[currentStatus] || [];

    if (!allowed.length) {
      return `
        <div class="status-no-actions">
          <span class="muted-text">
            No actions available
          </span>
        </div>
      `;
    }

    return `
      <div class="status-actions-group">

        ${allowed.map(status => `
          <button class="action-btn ${STYLE_MAP[status] || ""}"
                  data-status-action="${status}">
            ${LABELS[status] || status}
          </button>
        `).join("")}

        ${currentStatus === "in_progress" ? `
          <button class="action-btn btn-outline"
                  data-confirm-payment>
            <i data-lucide="credit-card"></i>
            Confirm Payment
          </button>
        ` : ""}

        ${currentStatus !== "cancelled" &&
          currentStatus !== "completed" ? `
          <button class="action-btn btn-outline-danger"
                  data-raise-dispute>
            <i data-lucide="alert-triangle"></i>
            Raise Dispute
          </button>
        ` : ""}

      </div>
    `;
  }

};