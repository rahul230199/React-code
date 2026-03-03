/* =========================================================
   AXO NETWORKS — ORDERS PAGE
   Premium SaaS Layout | SLA Dashboard | Split View
   Mobile Ready | Lottie Enabled | Route Safe
========================================================= */

import { OrdersService } from "./orders.service.js";
import { OrdersState } from "./orders.state.js";
import { OrdersRender } from "./orders.render.js";
import { OrdersEvents, cleanupOrders } from "./orders.events.js";
import { setPageTitle } from "../core/buyer-topbar.js";
import { initializeLucide } from "../core/buyer-icons.js";

let isMounted = false;

/* =========================================================
   GLOBAL OVERLAY
========================================================= */

function ensureGlobalOverlay() {
  let overlay = document.getElementById("ordersOverlayZone");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "ordersOverlayZone";
    document.body.appendChild(overlay);
  }
}

/* =========================================================
   LAYOUT TEMPLATE
========================================================= */

function layout() {
  return `
    <div class="orders-root glass-layer route-transition">

      <!-- SLA DASHBOARD STRIP -->
      <div id="ordersSLAStrip"
           class="orders-sla-strip"></div>

      <!-- MAIN BODY -->
      <div class="orders-body">

        <!-- LEFT: ORDERS LIST -->
        <div class="orders-list-panel">
          <div class="orders-toolbar">
            <div class="toolbar-left">
              <i data-lucide="shopping-cart"></i>
              <h2>Purchase Orders</h2>
            </div>

            <div class="toolbar-right">
              <input 
                type="text"
                id="ordersSearchInput"
                placeholder="Search PO number or company..."
              />

              <select id="ordersStatusFilter">
                <option value="">All Status</option>
                <option value="issued">Issued</option>
                <option value="accepted">Accepted</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="disputed">Disputed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div id="ordersListZone"
               class="orders-list-zone"></div>
        </div>

     

      </div>

      <!-- MOBILE THREAD SLIDE PANEL -->
      <div id="ordersMobileThread"
           class="orders-mobile-thread hidden"></div>

      <!-- LOADER -->
      <div id="ordersLoader"
           class="orders-loader">
        <div id="ordersLottie"></div>
      </div>

    </div>
  `;
}

/* =========================================================
   LOAD ORDERS PAGE
========================================================= */

export async function loadOrdersPage() {

  const container = document.getElementById("pageContainer");
  if (!container) return;

  /* -----------------------------------------------------
     CLEAN PREVIOUS INSTANCE
  ----------------------------------------------------- */
  if (isMounted) {
    cleanupOrders();
    OrdersService.cleanup();
    container.innerHTML = "";
  }

  ensureGlobalOverlay();

  setPageTitle("Orders & SLA Control");

  container.innerHTML = layout();

  initializeLucide();

  /* -----------------------------------------------------
     LOTTIE LOADER
  ----------------------------------------------------- */
  let loaderAnimation = null;

  const loaderContainer =
    document.getElementById("ordersLottie");

  if (loaderContainer && window.lottie) {
    loaderAnimation = window.lottie.loadAnimation({
      container: loaderContainer,
      renderer: "svg",
      loop: true,
      autoplay: true,
      path: "/assets/lottie/dashboard-loader.json"
    });
  }

  try {

    await OrdersService.bootstrap();

    OrdersRender.renderSLADashboard();
    OrdersRender.renderOrdersList();
    

    OrdersEvents.init();

  } catch {
    // silent fail (toasts handled in service)
  } finally {

    if (loaderAnimation) {
      loaderAnimation.destroy();
    }

    const loader =
      document.getElementById("ordersLoader");

    if (loader) loader.remove();
  }

  isMounted = true;
}