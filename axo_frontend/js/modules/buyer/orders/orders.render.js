/* =========================================================
   AXO NETWORKS — ORDERS RENDER ENGINE
   Pure Render Layer | SLA Driven | Premium UI
   Split View | Mobile Ready | Lucide Safe
========================================================= */

import { OrdersState } from "./orders.state.js";
import { refreshLucideIcons } from "../core/buyer-icons.js";

import { OrdersListTable } from "./orders.components/orders-list.table.js";
import { OrderThreadPanel } from "./orders.components/order-thread.panel.js";
import { OrderSLADashboardWidget } from "./orders.components/order-sla-dashboard.widget.js";
import { OrderSLABadge } from "./orders.components/order-sla-badge.js";

/* =========================================================
   SAFE GETTER
========================================================= */

const safe = (v, f = "-") =>
  v === undefined || v === null ? f : v;

/* =========================================================
   MAIN RENDER OBJECT
========================================================= */

export const OrdersRender = {

  /* =====================================================
     SLA DASHBOARD STRIP
  ===================================================== */
  renderSLADashboard() {

    const container =
      document.getElementById("ordersSLAStrip");

    if (!container) return;

    const data = OrdersState.slaDashboard;

    container.innerHTML =
      OrderSLADashboardWidget.render(data);

    refreshLucideIcons();
    document
  .querySelectorAll(".sla-widget-value")
  .forEach(el => {
    const value = parseInt(el.textContent, 10);
    el.textContent = "0";
    animateCount(el, value);
  });
  },

  /* =====================================================
     ORDERS LIST
  ===================================================== */
  renderOrdersList() {

    const container =
      document.getElementById("ordersListZone");

    if (!container) return;

    const orders =
      OrdersState.getFilteredOrders();

    if (!orders.length) {

      container.innerHTML = `
        <div class="orders-empty glass-card">
          <i data-lucide="inbox"></i>
          <h3>No Purchase Orders Found</h3>
          <p>Orders will appear here once created.</p>
        </div>
      `;

      refreshLucideIcons();
      return;
    }

    container.innerHTML =
      OrdersListTable.render(orders);

    refreshLucideIcons();
  },

  /* =====================================================
     THREAD PLACEHOLDER
  ===================================================== */
  renderThreadPlaceholder() {

    const container =
      document.getElementById("orderThreadPanel");

    if (!container) return;

    container.innerHTML = `
      <div class="thread-placeholder glass-card">
        <i data-lucide="layers"></i>
        <h3>Select an Order</h3>
        <p>Choose a purchase order to view details.</p>
      </div>
    `;

    refreshLucideIcons();
  },

  /* =====================================================
     FULL THREAD RENDER
  ===================================================== */
  renderThread() {

    const container =
      document.getElementById("orderThreadPanel");

    if (!container) return;

    if (!OrdersState.hasThread()) {
      this.renderThreadPlaceholder();
      return;
    }

    const threadData = {
      po: OrdersState.orderThread.po,
      timeline: OrdersState.orderThread.timeline,
      milestones: OrdersState.orderThread.milestones,
      messages: OrdersState.orderThread.messages,
      events: OrdersState.orderThread.events,
      slaRisk: OrdersState.slaRisk,
      activeTab: OrdersState.activeTab
    };

    container.innerHTML =
      OrderThreadPanel.render(threadData);

    refreshLucideIcons();
  },

  /* =====================================================
     MOBILE THREAD RENDER
  ===================================================== */
  renderMobileThread() {

    const container =
      document.getElementById("ordersMobileThread");

    if (!container) return;

    if (!OrdersState.hasThread()) {
      container.innerHTML = "";
      return;
    }

    const threadData = {
      po: OrdersState.orderThread.po,
      timeline: OrdersState.orderThread.timeline,
      milestones: OrdersState.orderThread.milestones,
      messages: OrdersState.orderThread.messages,
      events: OrdersState.orderThread.events,
      slaRisk: OrdersState.slaRisk,
      activeTab: OrdersState.activeTab
    };

    container.innerHTML =
      OrderThreadPanel.render(threadData, { mobile: true });

    container.classList.remove("hidden");

    refreshLucideIcons();
  },

  /* =====================================================
     CLOSE MOBILE THREAD
  ===================================================== */
  closeMobileThread() {

    const container =
      document.getElementById("ordersMobileThread");

    if (!container) return;

    container.classList.add("hidden");
    container.innerHTML = "";
  },

  

  /* =====================================================
     REFRESH ALL
  ===================================================== */
  refreshAll() {
    this.renderSLADashboard();
    this.renderOrdersList();
    this.renderThread();
  }

};

/* =========================================================
   SLA COUNT UP ANIMATION
========================================================= */

function animateCount(el, target) {
  const duration = 800;
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const value = Math.floor(progress * target);
    el.textContent = value;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target;
    }
  }

  requestAnimationFrame(update);
}