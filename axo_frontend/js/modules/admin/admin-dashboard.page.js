/* =========================================================
   AXO NETWORKS — ADMIN DASHBOARD ENTRY (ENTERPRISE FINAL)
   Hardened • Lifecycle Safe • Mobile Safe • Clean
========================================================= */

import { RouteGuard } from "../../guards/routeGuard.js";
import { AuthManager } from "../../core/authManager.js";
import Toast from "../../core/toast.js";

import { DashboardPage } from "./dashboard/dashboard.page.js";
import { NetworkPage } from "./network/network.page.js";
import { UsersPage } from "./users/users.page.js";
import { AuditPage } from "./audit/audit.page.js";
import { SystemPage } from "./system/system.page.js";
import { RFQPage } from "./rfq/rfq.page.js";

/* =========================================================
   INTERNAL STATE
========================================================= */

let __ADMIN_INITIALIZED__ = false;
let __ACTIVE_PAGE__ = null;
let __IS_LOADING_VIEW__ = false;

/* =========================================================
   DOM READY
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  if (__ADMIN_INITIALIZED__) return;
  __ADMIN_INITIALIZED__ = true;

  try {

    await initializeAdminDashboard();
    initializeSidebarSystem();
    bindLogout();

  } catch (err) {

    console.error("Admin initialization failed:", err);
    Toast.error("Failed to initialize dashboard");

  }

});

/* =========================================================
   MAIN INIT
========================================================= */

async function initializeAdminDashboard() {

  RouteGuard.protect({
    requireAuth: true,
    role: ["admin", "super_admin"],
    permission: "VIEW_DASHBOARD"
  });

  await hydrateAuthenticatedUser();
  bindNavigation();

  const active = document.querySelector(".nav-item.active");
  const defaultView = active?.dataset?.view || "dashboard";

  await loadView(defaultView);
}

/* =========================================================
   AUTH USER HYDRATION (SECURE VERSION)
========================================================= */

async function hydrateAuthenticatedUser() {

  try {

    // Always verify token with backend
    const user = await AuthManager.getCurrentUser(true);

    if (!user) {
      forceLogout();
      return;
    }

    const nameEl = document.getElementById("adminName");
    const roleEl = document.getElementById("adminRole");
    const avatarEl = document.querySelector(".avatar");

    if (nameEl) {
      nameEl.textContent = user.name || user.email || "Admin";
    }

    if (roleEl) {
      roleEl.textContent = formatRole(user.role);
    }

    if (avatarEl) {
      avatarEl.textContent =
        (user.name?.charAt(0) || user.email?.charAt(0) || "A")
          .toUpperCase();
    }

  } catch (err) {

    console.warn("User hydration failed:", err);
    forceLogout();

  }

}

function formatRole(role) {
  if (!role) return "Administrator";
  return role.replace(/_/g, " ")
             .replace(/\b\w/g, c => c.toUpperCase());
}

/* =========================================================
   LOGOUT (CENTRALIZED)
========================================================= */

function bindLogout() {

  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", () => {
    forceLogout();
  });

}

function forceLogout() {

  try {
    AuthManager.logout();
  } catch (err) {
    console.warn("Logout error:", err);
  }

  window.location.href = "/login.html";

}

/* =========================================================
   VIEW MAP
========================================================= */

const VIEW_TO_PAGE = {
  dashboard: DashboardPage,
  network: NetworkPage,
  rfq: RFQPage,
  users: UsersPage,
  audit: AuditPage,
  system: SystemPage
};

const VIEW_TITLES = {
  dashboard: "Dashboard",
  network: "Network Access",
  rfq: "RFQs",
  users: "Users",
  audit: "Audit Logs",
  system: "System Health"
};

/* =========================================================
   NAVIGATION
========================================================= */

function bindNavigation() {

  const navItems = document.querySelectorAll(".nav-item");
  if (!navItems.length) return;

  navItems.forEach(btn => {

    btn.addEventListener("click", async () => {

      const view = btn.dataset?.view;
      if (!view || !VIEW_TO_PAGE[view]) return;
      if (__IS_LOADING_VIEW__) return;

      __IS_LOADING_VIEW__ = true;

      try {

        document.querySelector(".nav-item.active")
          ?.classList.remove("active");

        btn.classList.add("active");

        await loadView(view);
        closeMobileSidebar();

      } finally {

        __IS_LOADING_VIEW__ = false;

      }

    });

  });

}

/* =========================================================
   VIEW LOADER
========================================================= */

async function loadView(view) {

  const content = document.getElementById("contentArea");
  const title = document.getElementById("pageTitle");

  if (!content) return;

  const PageModule = VIEW_TO_PAGE[view] || DashboardPage;

  if (title) {
    title.textContent = VIEW_TITLES[view] || "Dashboard";
  }

  if (__ACTIVE_PAGE__) {
    try {
      __ACTIVE_PAGE__.destroy?.();
    } catch (err) {
      console.warn("Destroy error:", err);
    }
    __ACTIVE_PAGE__ = null;
  }

  content.innerHTML = "";
  content.scrollTop = 0;

  try {

    await PageModule.init(content);
    __ACTIVE_PAGE__ = PageModule;

  } catch (err) {

    console.error(`Failed to load ${view}:`, err);
    Toast.error(`Failed to load ${view}`);

    content.innerHTML = `
      <div class="error-state">
        <h3>Something went wrong</h3>
        <p>Unable to load this section.</p>
      </div>
    `;
  }

}

/* =========================================================
   SIDEBAR SYSTEM
========================================================= */

function initializeSidebarSystem() {

  const layout = document.querySelector(".layout");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const hamburger = document.getElementById("hamburgerBtn");
  const toggleBtn = document.getElementById("sidebarToggle");

  if (!layout || !sidebar) return;

  /* ===== DESKTOP COLLAPSE ===== */

  toggleBtn?.addEventListener("click", () => {

    if (window.innerWidth <= 992) return;

    layout.classList.toggle("collapsed");

    toggleBtn.querySelector("svg")
      ?.classList.toggle("rotated");

  });

  /* ===== MOBILE OPEN ===== */

  hamburger?.addEventListener("click", () => {

    sidebar.classList.add("open");
    overlay?.classList.add("active");
    document.body.style.overflow = "hidden";

  });

  /* ===== MOBILE CLOSE ===== */

  overlay?.addEventListener("click", closeMobileSidebar);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMobileSidebar();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 992) closeMobileSidebar();
  });

}

/* =========================================================
   MOBILE CLOSE
========================================================= */

function closeMobileSidebar() {

  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  sidebar?.classList.remove("open");
  overlay?.classList.remove("active");

  document.body.style.overflow = "";

}