/* =========================================================
   AXO NETWORKS — BUYER NOTIFICATIONS API
   Production Safe
   - Silent failure
   - Badge ready
   - Polling ready
   - Mark as read support
========================================================= */

import apiClient from "../../../core/apiClient.js";

/* =========================================================
   ENDPOINTS
========================================================= */

const BASE = "/buyer";

/* =========================================================
   FETCH NOTIFICATIONS
========================================================= */

export async function fetchNotifications() {
  try {
    const response = await apiClient.get(`${BASE}/notifications`);
    return response?.data || [];
  } catch (err) {
    console.error("Notifications fetch failed:", err);
    return [];
  }
}

/* =========================================================
   FETCH UNREAD COUNT
========================================================= */

export async function fetchUnreadCount() {
  try {
    const notifications = await fetchNotifications();
    return notifications.filter(n => !n.read).length;
  } catch {
    return 0;
  }
}

/* =========================================================
   MARK NOTIFICATION AS READ
========================================================= */

export async function markNotificationAsRead(id) {
  if (!id) return;

  try {
    await apiClient.post(`${BASE}/notifications/${id}/read`);
  } catch (err) {
    console.error("Mark as read failed:", err);
  }
}

/* =========================================================
   MARK ALL AS READ
========================================================= */

export async function markAllAsRead(notifications) {
  if (!Array.isArray(notifications)) return;

  const unread = notifications.filter(n => !n.read);

  await Promise.all(
    unread.map(n =>
      markNotificationAsRead(n.id)
    )
  );
}