/* =========================================================
   AXO NETWORKS — ORDER EVENTS TIMELINE
   Audit Trail | System Events | Premium Vertical Timeline
========================================================= */

/* =========================================================
   FORMAT DATE
========================================================= */

const formatDateTime = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

/* =========================================================
   EVENT TYPE MAP
========================================================= */

const EVENT_MAP = {
  PO_STATUS_UPDATED: {
    icon: "refresh-cw",
    label: "Status Updated"
  },
  PO_AUTO_COMPLETED: {
    icon: "check-circle",
    label: "PO Auto Completed"
  },
  MILESTONE_COMPLETED: {
    icon: "flag",
    label: "Milestone Completed"
  },
  MESSAGE_SENT: {
    icon: "message-circle",
    label: "Message Sent"
  },
  PAYMENT_CONFIRMED: {
    icon: "credit-card",
    label: "Payment Confirmed"
  },
  DISPUTE_RAISED: {
    icon: "alert-triangle",
    label: "Dispute Raised"
  }
};

/* =========================================================
   RENDER METADATA
========================================================= */

function renderMetadata(event) {

  if (!event.metadata) return "";

  const meta = event.metadata;

  if (event.event_type === "PO_STATUS_UPDATED") {
    return `
      <div class="event-meta-detail">
        From <strong>${meta.from}</strong> 
        to <strong>${meta.to}</strong>
      </div>
    `;
  }

  if (event.event_type === "MILESTONE_COMPLETED") {
    return `
      <div class="event-meta-detail">
        Milestone: <strong>${meta.milestoneName}</strong>
      </div>
    `;
  }

  return "";
}

/* =========================================================
   SINGLE EVENT
========================================================= */

function renderEventItem(event) {

  const config =
    EVENT_MAP[event.event_type] || {
      icon: "activity",
      label: event.event_type
    };

  return `
    <div class="event-item">

      <div class="event-icon">
        <i data-lucide="${config.icon}"></i>
      </div>

      <div class="event-content">

        <div class="event-header">
          <strong>${config.label}</strong>
          <span class="event-time">
            ${formatDateTime(event.created_at)}
          </span>
        </div>

        ${renderMetadata(event)}

      </div>

    </div>
  `;
}

/* =========================================================
   EXPORT COMPONENT
========================================================= */

export const OrderEventsTimeline = {

  render(data) {

    const { events } = data;

    if (!events || !events.length) {
      return `
        <div class="events-empty glass-card">
          <i data-lucide="activity"></i>
          <h3>No Events Recorded</h3>
          <p>System activity will appear here.</p>
        </div>
      `;
    }

    return `
      <div class="events-timeline">

        ${events.map(renderEventItem).join("")}

      </div>
    `;
  }

};