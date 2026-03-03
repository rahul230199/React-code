/* =========================================================
   AXO NETWORKS — BUYER ROUTER (PRODUCTION READY)
   - History API routing
   - Deep link safe
   - Memory safe
   - Module lifecycle cleanup
   - Scalable registry
========================================================= */

import { loadDashboardPage } from "../dashboard/dashboard.page.js";
import { stopDashboardAutoRefresh } from "../dashboard/dashboard.events.js";
import { loadRFQPage } from "../rfq/rfq.page.js";
import { loadOrdersPage } from "../orders/orders.page.js";
import { loadOrderDetailPage } from "../orders/order-detail.page.js";
import { updateActiveSidebarLink } from "./buyer-sidebar.js";
import { refreshLucideIcons } from "./buyer-icons.js";

/* =========================================================
   ROUTE REGISTRY
========================================================= */

const ROUTES = {

  "/buyer/dashboard": {
    load: loadDashboardPage,
    cleanup: stopDashboardAutoRefresh
  },

  "/buyer/rfqs": {
    load: loadRFQPage
  },

  "/buyer/orders": {
    load: loadOrdersPage
  }

};


let currentPath = null;
let routerInitialized = false;

/* =========================================================
   INTERNAL NAVIGATE
========================================================= */

export function navigateTo(path) {
  if (path === currentPath) return;

  window.history.pushState({}, "", path);
  loadRoute();
}

/* =========================================================
   CLEANUP PREVIOUS MODULE
========================================================= */

function cleanupPreviousRoute() {
  if (!currentPath) return;

  const route = ROUTES[currentPath];
  if (route?.cleanup) {
    try {
      route.cleanup();
    } catch {
      // Never crash router
    }
  }
}

/* =========================================================
   LOAD ROUTE
========================================================= */

async function loadRoute() {
  const path = window.location.pathname;

  if (path === currentPath) return;

  cleanupPreviousRoute();

let route = ROUTES[path];

if (!route && path.startsWith("/buyer/orders/")) {
  const poId = path.split("/").pop();
  route = {
    load: () => loadOrderDetailPage(poId)
  };
}

  if (!route) {
    navigateTo("/buyer/dashboard");
    return;
  }

  try {
    currentPath = path;
    await route.load();
  } catch {
    navigateTo("/buyer/dashboard");
    return;
  }

  updateActiveSidebarLink();
  refreshLucideIcons();
}

/* =========================================================
   LINK INTERCEPTOR
========================================================= */

function interceptLinks() {
  document.addEventListener("click", (e) => {

    const anchor = e.target.closest("a[data-route]");
    if (!anchor) return;

    const path = anchor.getAttribute("data-route");

    if (!path.startsWith("/buyer")) return;

    e.preventDefault();
    navigateTo(path);
  });
}

/* =========================================================
   INITIALIZE ROUTER
========================================================= */

export function initBuyerRouter() {
  if (routerInitialized) return;
  routerInitialized = true;

  window.addEventListener("popstate", loadRoute);

  interceptLinks();

  // Default route
  if (!window.location.pathname.startsWith("/buyer")) {
    navigateTo("/buyer/dashboard");
  } else {
    loadRoute();
  }
}