/* =========================================================
   BUYER DASHBOARD — PAGE CONTROLLER (ENTERPRISE STABLE)
   Clean SPA Navigation · Safe Module Loading
========================================================= */

import { RouteGuard } from "../../guards/routeGuard.js";
import { AuthManager } from "../../core/authManager.js";

import { loadRFQPage } from "./buyer-rfq.page.js";
import { loadOrdersPage } from "./buyer-orders.page.js";

import BuyerDashboardAPI from "./buyer-dashboard.api.js";
import {
  renderDashboardLoading,
  renderDashboardStats,
  renderDashboardEmpty
} from "./buyer-dashboard.render.js";

import BuyerNotificationAPI from "./buyer-notifications.api.js";
import Toast from "../../core/toast.js";

/* =========================================================
   GLOBAL STATE
========================================================= */

let currentPage = "dashboard";

/* =========================================================
   DASHBOARD LOADER (ENTERPRISE INTELLIGENCE VERSION)
========================================================= */
async function loadDashboard() {

  try {

    renderDashboardLoading();

    const [
      executive,
      risk,
      capacity
    ] = await Promise.all([
      BuyerDashboardAPI.getExecutiveOverview(),
      BuyerDashboardAPI.getRiskOverview(),
      BuyerDashboardAPI.getCapacityOverview()
    ]);

    if (!executive) {
      renderDashboardEmpty();
      return;
    }

    /* -----------------------------------------------------
       NORMALIZED DASHBOARD DATA STRUCTURE
       (Single object for render layer)
    ------------------------------------------------------ */
    const dashboardData = {
      kpis: executive.kpis || {},
      payments_pending: executive.payments_pending || 0,
      on_time_delivery_percent:
        executive.on_time_delivery_percent || 0,
      average_supplier_reliability:
        executive.average_supplier_reliability || 0,
      risk_summary: risk || {},
      capacity_summary: capacity || {}
    };

    renderDashboardStats(dashboardData);

  } catch (error) {

    Toast.error(
      error?.message || "Unable to load dashboard intelligence"
    );

    renderDashboardEmpty();
  }
}

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
      await loadDashboard();
      break;

    case "buy":
      await loadRFQPage();
      break;

    case "orders":
      await loadOrdersPage();
      break;

    case "profile":
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

    try {

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

    } catch {
      badge.classList.add("hidden");
      list.innerHTML =
        `<div class="notification-empty">Unable to load notifications</div>`;
    }
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
     initSidebarToggle(); 
  populateCompanyHeader();
  setupLogout();
  await initNotifications();


  loadPage("dashboard");
});

function initSidebarToggle() {

   const sidebar = document.querySelector(".sidebar");
  const desktopToggle = document.querySelector(".menu-toggle");
  const mobileToggle = document.querySelector(".mobile-menu-btn");

  if (!sidebar) return;

  // Desktop collapse
  if (desktopToggle) {
    desktopToggle.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      document.body.classList.toggle("sidebar-collapsed");
    });
  }
  if (!sidebar || !mobileToggle) return;

  // Toggle button
  mobileToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    sidebar.classList.toggle("mobile-open");
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (
      sidebar.classList.contains("mobile-open") &&
      !sidebar.contains(e.target) &&
      !mobileToggle.contains(e.target)
    ) {
      sidebar.classList.remove("mobile-open");
    }
  });

  // Close when clicking menu item
  document.querySelectorAll(".nav-menu li").forEach(item => {
    item.addEventListener("click", () => {
      sidebar.classList.remove("mobile-open");
    });
  });

}