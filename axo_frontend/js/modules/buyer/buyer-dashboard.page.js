/* =========================================================
   BUYER DASHBOARD — PAGE CONTROLLER (ENTERPRISE STABLE)
   Clean SPA Navigation · Safe Module Loading
========================================================= */

import { RouteGuard } from "../../guards/routeGuard.js";
import { AuthManager } from "../../core/authManager.js";

import { loadRFQPage } from "./buyer-rfq.page.js";
import { loadOrdersPage } from "./buyer-orders.page.js";
// ❌ REMOVED loadProfilePage import (it was breaking module)

import BuyerNotificationAPI from "./buyer-notifications.api.js";
import Toast from "../../core/toast.js";

/* =========================================================
   GLOBAL STATE
========================================================= */

let currentPage = "dashboard";

/* =========================================================
   PAGE ROUTER
========================================================= */

async function loadPage(page) {

  currentPage = page;

  const container = document.getElementById("pageContainer");
  if (!container) return;

  container.innerHTML = "";

  switch (page) {

    case "dashboard":
      container.innerHTML = `
        <div style="padding:40px;">
          <h2>Dashboard</h2>
          <p>Executive overview will be available soon.</p>
        </div>
      `;
      break;

    case "buy":
      await loadRFQPage();
      break;

    case "orders":
      await loadOrdersPage();
      break;

    case "profile":
      // Temporary safe placeholder
      container.innerHTML = `
        <div style="padding:40px;">
          <h2>Profile</h2>
          <p>Profile page coming soon.</p>
        </div>
      `;
      break;

    default:
      container.innerHTML = `<p>Page not found</p>`;
  }

  updateActiveNav(page);
}

/* =========================================================
   NAVIGATION
========================================================= */

function initNavigation() {

  const navItems = document.querySelectorAll(".nav-menu li");

  navItems.forEach(item => {

    item.addEventListener("click", () => {

      const page = item.getAttribute("data-page");
      if (!page) return;

      history.pushState(
        { page },
        "",
        `/buyer-dashboard?tab=${page}`
      );

      loadPage(page);
    });
  });
}

/* =========================================================
   ACTIVE NAV STATE
========================================================= */

function updateActiveNav(page) {

  document.querySelectorAll(".nav-menu li")
    .forEach(li => li.classList.remove("active"));

  const activeItem =
    document.querySelector(`.nav-menu li[data-page="${page}"]`);

  if (activeItem) activeItem.classList.add("active");
}

/* =========================================================
   POPSTATE SUPPORT
========================================================= */

window.addEventListener("popstate", (event) => {

  const page = event.state?.page || "dashboard";
  loadPage(page);
});

/* =========================================================
   HEADER
========================================================= */

function populateCompanyHeader() {

  const user = AuthManager.getCurrentUser();
  if (!user) return;

  const companyNameEl = document.getElementById("companyName");
  const loggedUserEl = document.getElementById("loggedUser");

  if (companyNameEl) {
    companyNameEl.innerText =
      `Organization ID: ${user.organization_id}`;
  }

  if (loggedUserEl) {
    loggedUserEl.innerText = user.email;
  }
}

/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;

  logoutBtn.onclick = () => AuthManager.logout();
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

async function initNotifications() {

  const bell = document.getElementById("notificationBell");
  const dropdown = document.getElementById("notificationDropdown");
  const list = document.getElementById("notificationList");
  const badge = document.getElementById("notificationBadge");

  if (!bell) return;

  async function loadNotifications() {

    const notifications =
      await BuyerNotificationAPI.getNotifications();

    const unreadCount =
      notifications.filter(n => !n.is_read).length;

    if (unreadCount > 0) {
      badge.innerText = unreadCount;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }

    if (!notifications.length) {
      list.innerHTML =
        `<div class="notification-empty">No notifications</div>`;
      return;
    }

    list.innerHTML = notifications.map(n => `
      <div class="notification-item ${!n.is_read ? "unread" : ""}"
           data-id="${n.id}">
        <div style="font-weight:600">${n.title}</div>
        <div style="font-size:13px;color:#666">${n.message}</div>
      </div>
    `).join("");
  }

  bell.addEventListener("click", () => {
    dropdown.classList.toggle("hidden");
  });

  list.addEventListener("click", async (e) => {
    const item = e.target.closest(".notification-item");
    if (!item) return;

    await BuyerNotificationAPI.markRead(item.dataset.id);
    await loadNotifications();
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".notification-wrapper")) {
      dropdown.classList.add("hidden");
    }
  });

  await loadNotifications();
}

/* =========================================================
   BOOTSTRAP
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  const allowed = RouteGuard.protect({
    requireAuth: true,
    role: ["buyer"]
  });

  if (allowed === false) return;

  initNavigation();
  populateCompanyHeader();
  setupLogout();
  await initNotifications();

  loadPage("dashboard");
});