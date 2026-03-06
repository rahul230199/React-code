/* =========================================================
   AXO NETWORKS — ORDER THREAD PANEL
   Premium SaaS Detail View | SLA Integrated | Tab Driven
========================================================= */

import { OrderSLABadge } from "./order-sla-badge.js";
import { OrderStatusActions } from "./order-status.actions.js";
import { OrderMilestonesTimeline } from "./order-milestones.timeline.js";
import { OrderMessagesThread } from "./order-messages.thread.js";
import { OrderEventsTimeline } from "./order-events.timeline.js";

/* =========================================================
   FORMATTERS
========================================================= */

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const renderStatusBadge = (status) => `
  <span class="status-badge status-${status}">
    ${status?.replace("_", " ").toUpperCase()}
  </span>
`;

/* =========================================================
   REALTIME SOCKET HANDLER
========================================================= */

let socketInitialized = false;

function initRealtime(data) {

  if (socketInitialized) return;
  if (!window.socket) return;

  const { po } = data;

  socketInitialized = true;

  /* JOIN ROOM */

  window.socket.emit("join_po_room", po.id);

  /* RECEIVE MESSAGE */

  window.socket.on("po_message", (message) => {

    if (message.po_id !== po.id) return;

    data.messages = data.messages || [];

    /* PREVENT DUPLICATES */

    const exists = data.messages.some(m => m.id === message.id);
    if (exists) return;

    data.messages.push(message);

    const container = document.querySelector(".thread-content");
    if (!container) return;

    if (data.activeTab === "messages") {

      container.innerHTML = OrderMessagesThread.render(data);

      if (window.lucide) {
        window.lucide.createIcons();
      }

      /* AUTO SCROLL */

      const messagesBox = container.querySelector(".messages-thread");
      if (messagesBox) {
        messagesBox.scrollTop = messagesBox.scrollHeight;
      }

    }

  });

}

/* =========================================================
   HEADER
========================================================= */

function renderHeader(data, mobile = false) {

  const { po, slaRisk } = data;

  return `
    <div class="thread-header glass-card">

      ${mobile ? `
        <button class="mobile-close-btn"
                data-close-mobile>
          <i data-lucide="arrow-left"></i>
        </button>
      ` : ""}

      <div class="thread-header-main">

        <div class="header-left">
          <h3>${po.po_number}</h3>
          ${renderStatusBadge(po.status)}
          ${OrderSLABadge.render(slaRisk?.risk_level)}
        </div>

        <div class="header-right">

          <div class="header-meta">

            <div>
              <span>Value</span>
              <strong>${formatCurrency(po.value)}</strong>
            </div>

            <div>
              <span>Promised Delivery</span>
              <strong>${formatDate(po.promised_delivery_date)}</strong>
            </div>

            <div>
              <span>Created</span>
              <strong>${formatDate(po.created_at)}</strong>
            </div>

          </div>

        </div>

      </div>

      <div class="thread-actions">
        ${OrderStatusActions.render(po.status)}
      </div>

    </div>
  `;
}

/* =========================================================
   TAB NAVIGATION
========================================================= */

function renderTabs(activeTab) {

  const tabs = [
    { key: "timeline", label: "Timeline", icon: "list" },
    { key: "messages", label: "Messages", icon: "message-circle" },
    { key: "events", label: "Events", icon: "activity" }
  ];

  return `
    <div class="thread-tabs">

      ${tabs.map(tab => `
        <button class="thread-tab ${activeTab === tab.key ? "active" : ""}"
                data-thread-tab="${tab.key}">
          <i data-lucide="${tab.icon}"></i>
          ${tab.label}
        </button>
      `).join("")}

    </div>
  `;
}

/* =========================================================
   TAB CONTENT
========================================================= */

function renderTabContent(data) {

  const { activeTab } = data;

  if (activeTab === "timeline") {
    return OrderMilestonesTimeline.render(data);
  }

  if (activeTab === "messages") {
    return OrderMessagesThread.render(data);
  }

  if (activeTab === "events") {
    return OrderEventsTimeline.render(data);
  }

  return `<div class="thread-empty">No content</div>`;
}

/* =========================================================
   MAIN EXPORT
========================================================= */

export const OrderThreadPanel = {

  render(data, options = {}) {

    const mobile = options.mobile || false;

    /* INIT REALTIME ENGINE */

    initRealtime(data);

    return `
      <div class="order-thread-container ${mobile ? "mobile" : ""}">

        ${renderHeader(data, mobile)}

        ${renderTabs(data.activeTab)}

        <div class="thread-content">
          ${renderTabContent(data)}
        </div>

      </div>
    `;
  }

};