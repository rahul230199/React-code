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
   SAFE TEXT (PREVENT HTML INJECTION)
========================================================= */

function escapeHTML(text) {
  if (!text) return "";

  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}


/* =========================================================
   EVENT TYPE MAP
========================================================= */

const EVENT_MAP = {

  PO_ACCEPTED: {
    icon: "check-circle",
    label: "Purchase Order Accepted"
  },

  PO_CANCELLED: {
    icon: "x-circle",
    label: "Purchase Order Cancelled"
  },

  PO_STATUS_UPDATED: {
    icon: "refresh-cw",
    label: "Status Updated"
  },

  PO_AUTO_COMPLETED: {
    icon: "check-circle",
    label: "PO Auto Completed"
  },

  MILESTONE_UPDATED: {
    icon: "flag",
    label: "Milestone Updated"
  },

  DELIVERY_CONFIRMED: {
    icon: "truck",
    label: "Delivery Confirmed"
  },

  PAYMENT_CONFIRMED: {
    icon: "credit-card",
    label: "Payment Confirmed"
  },

  DISPUTE_RAISED: {
    icon: "alert-triangle",
    label: "Dispute Raised"
  },

  PO_THREAD_MESSAGE_SENT: {
    icon: "message-circle",
    label: "Message Sent"
  },

  PO_THREAD_RESPONSE_TIME_RECORDED: {
    icon: "clock",
    label: "Response Time Recorded"
  }

};


/* =========================================================
   RENDER METADATA
========================================================= */

function renderMetadata(event) {

  if (!event.metadata) return "";

  let meta;

  try {
    meta =
      typeof event.metadata === "string"
        ? JSON.parse(event.metadata)
        : event.metadata;
  } catch {
    return "";
  }

  if (!meta) return "";


  /* ================= STATUS CHANGE ================= */

  if (event.event_type === "PO_STATUS_UPDATED") {

    return `
      <div class="event-meta-detail">
        From <strong>${escapeHTML(meta.from)}</strong>
        to <strong>${escapeHTML(meta.to)}</strong>
      </div>
    `;

  }


  /* ================= MILESTONE ================= */

  if (event.event_type === "MILESTONE_UPDATED") {

    return `
      <div class="event-meta-detail">
        Milestone: <strong>${escapeHTML(meta.milestoneName)}</strong>
      </div>
    `;

  }


  /* ================= PAYMENT ================= */

  if (event.event_type === "PAYMENT_CONFIRMED") {

    return `
      <div class="event-meta-detail">
        Amount: ₹${escapeHTML(meta.amount)}
      </div>
    `;

  }


  /* ================= DISPUTE ================= */

  if (event.event_type === "DISPUTE_RAISED") {

    return `
      <div class="event-meta-detail">
        Dispute ID: <strong>${escapeHTML(meta.disputeId)}</strong>
      </div>
    `;

  }


  /* ================= RESPONSE TIME ================= */

  if (event.event_type === "PO_THREAD_RESPONSE_TIME_RECORDED") {

    return `
      <div class="event-meta-detail">
        Response Time: <strong>${meta.response_time_hours.toFixed(2)} hrs</strong>
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