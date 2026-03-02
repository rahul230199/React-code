/* =========================================================
   AXO NETWORKS — BUYER NOTIFICATIONS PANEL
   Production SaaS UI
   - Sliding panel
   - Badge integration
   - Polling support
   - Memory safe
========================================================= */

import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead
} from "./notifications.api.js";

import { updateNotificationBadge } from "../core/buyer-topbar.js";

let panelElement = null;
let pollingInterval = null;
const POLL_TIME = 30000; // 30 seconds

/* =========================================================
   CREATE PANEL
========================================================= */

function createPanel() {

  if (panelElement) return;

  panelElement = document.createElement("div");
  panelElement.id = "notificationPanel";
  panelElement.className = "notification-panel hidden";

  panelElement.innerHTML = `
    <div class="notification-header">
      <h3>Notifications</h3>
      <button id="closeNotificationPanel">
        <i data-lucide="x"></i>
      </button>
    </div>

    <div class="notification-list" id="notificationList">
      <div class="notification-empty">No notifications</div>
    </div>
  `;

  document.body.appendChild(panelElement);

  document
    .getElementById("closeNotificationPanel")
    .addEventListener("click", closePanel);

  document.addEventListener("click", (e) => {
    if (
      panelElement &&
      !panelElement.contains(e.target) &&
      !document.getElementById("notificationButton")?.contains(e.target)
    ) {
      closePanel();
    }
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/* =========================================================
   RENDER NOTIFICATIONS
========================================================= */

async function renderNotifications() {

  const list = document.getElementById("notificationList");
  if (!list) return;

  const notifications = await fetchNotifications();

  if (!notifications.length) {
    list.innerHTML = `
      <div class="notification-empty">
        You're all caught up 🎉
      </div>
    `;
    return;
  }

  list.innerHTML = notifications.map(n => `
    <div class="notification-item ${n.read ? "" : "unread"}"
         data-id="${n.id}">
      <div class="notification-title">${n.title || "Notification"}</div>
      <div class="notification-message">${n.message || ""}</div>
      <div class="notification-time">
        ${new Date(n.created_at).toLocaleString("en-IN")}
      </div>
    </div>
  `).join("");

  // Click to mark as read
  document.querySelectorAll(".notification-item").forEach(item => {
    item.addEventListener("click", async () => {
      const id = item.dataset.id;
      await markNotificationAsRead(id);
      item.classList.remove("unread");
      refreshBadge();
    });
  });
}

/* =========================================================
   BADGE REFRESH
========================================================= */

async function refreshBadge() {
  const count = await fetchUnreadCount();
  updateNotificationBadge(count);
}

/* =========================================================
   PANEL CONTROL
========================================================= */

export async function openNotificationPanel() {
  createPanel();
  panelElement.classList.remove("hidden");
  await renderNotifications();
}

export function closePanel() {
  if (!panelElement) return;
  panelElement.classList.add("hidden");
}

/* =========================================================
   START POLLING
========================================================= */

export function startNotificationPolling() {

  stopNotificationPolling();

  refreshBadge();

  pollingInterval = setInterval(() => {
    refreshBadge();
  }, POLL_TIME);
}

export function stopNotificationPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}