/* =========================================================
   AXO NETWORKS — BUYER SHELL
   Production SaaS Architecture
   - Layout bootstrap
   - Router init
   - Safe re-mount
========================================================= */

import { initBuyerRouter } from "./buyer-router.js";
import { renderBuyerSidebar } from "./buyer-sidebar.js";
import { renderBuyerTopbar } from "./buyer-topbar.js";
import { initializeLucide } from "./buyer-icons.js";
import { initTopbarEvents } from "./buyer-topbar.js";
import { startNotificationPolling } from "../notifications/notifications.panel.js";
import { initSidebarToggle } from "./buyer-sidebar.js";
let isMounted = false;

/* =========================================================
   INITIALIZE BUYER SHELL
========================================================= */

export function initBuyerShell() {

  if (isMounted) return;
  isMounted = true;

  const sidebar = document.getElementById("buyerSidebar");
  const topbar = document.getElementById("buyerTopbar");

  if (!sidebar || !topbar) return;

  // Render layout components
  sidebar.innerHTML = renderBuyerSidebar();
  topbar.innerHTML = renderBuyerTopbar();

  // Initialize Lucide icons
  initializeLucide();
  initTopbarEvents();
  initSidebarToggle();

  // Initialize router
  initBuyerRouter();

  startNotificationPolling();
}