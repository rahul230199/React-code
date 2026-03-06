/* =========================================================
AXO NETWORKS — ORDER THREAD TABS
Render Only Component
========================================================= */

import { OrderTimeline } from "./order.timeline.js";
import { OrderMessages } from "./order.messages.js";
import { OrderEvents } from "./order.events.js";

/* =========================================================
TAB CONFIG
========================================================= */

const tabs = [
  { key: "timeline", label: "Timeline", icon: "list" },
  { key: "messages", label: "Messages", icon: "message-circle" },
  { key: "events", label: "Events", icon: "activity" }
];

/* =========================================================
RENDER TAB HEADER
========================================================= */

function renderTabs(activeTab) {

  return `
    <div class="order-tabs">

      ${tabs.map(tab => `

        <button
          class="order-tab ${activeTab === tab.key ? "active" : ""}"
          data-thread-tab="${tab.key}"
        >
          <i data-lucide="${tab.icon}"></i>
          ${tab.label}
        </button>

      `).join("")}

    </div>
  `;

}

/* =========================================================
RENDER TAB CONTENT
========================================================= */

function renderContent(data, activeTab) {

  if (activeTab === "timeline") {
    return OrderTimeline.render(data);
  }

  if (activeTab === "messages") {
    return OrderMessages.render(data);
  }

  if (activeTab === "events") {
    return OrderEvents.render(data);
  }

  return "";

}

/* =========================================================
MAIN COMPONENT
========================================================= */

export const OrderTabs = {

  render(data = {}) {

    const activeTab = data.activeTab || "timeline";

    return `

      ${renderTabs(activeTab)}

      <div class="order-tab-content">

        ${renderContent(data, activeTab)}

      </div>

    `;

  }

};