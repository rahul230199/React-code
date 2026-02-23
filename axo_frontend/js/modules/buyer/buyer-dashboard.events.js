/* =========================================================
   BUYER DASHBOARD — NAVIGATION CONTROLLER
========================================================= */

import { initializeDashboard } from "./buyer-dashboard.page.js";
import { loadRFQPage } from "./buyer-rfq.page.js";
import { loadOrdersPage } from "./buyer-orders.page.js";

/* =========================================================
   INITIALIZE SIDEBAR NAVIGATION
========================================================= */

export function initNavigation() {

  const navItems = document.querySelectorAll(".nav-menu li");

  if (!navItems || !navItems.length) return;

  navItems.forEach(item => {

    item.addEventListener("click", async (event) => {

      event.preventDefault();

      const page = item.getAttribute("data-page");
      if (!page) return;

      navItems.forEach(nav => nav.classList.remove("active"));
      item.classList.add("active");

      try {

        switch (page) {

          case "dashboard":
            await initializeDashboard();
            break;

          case "buy":
            await loadRFQPage();
            break;

          case "orders":
            await loadOrdersPage();
            break;

          case "profile":
            // Temporarily disable until profile page export fixed
            console.warn("Profile page not implemented yet.");
            break;

          default:
            await initializeDashboard();
            break;
        }

      } catch (error) {
        console.error("Navigation Error:", error);
      }

    });

  });

}