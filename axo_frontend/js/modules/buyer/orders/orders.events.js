/* =========================================================
   AXO NETWORKS — ORDERS EVENTS CONTROLLER
   Enterprise Safe | Memory Safe | Mobile Ready
========================================================= */

import { OrdersService } from "./orders.service.js";
import { OrdersState } from "./orders.state.js";
import { OrdersRender } from "./orders.render.js";

let isBound = false;
let boundHandler = null;

/* =========================================================
   MAIN EVENT INITIALIZER
========================================================= */

export const OrdersEvents = {

  init() {

    if (isBound) return;

    boundHandler = async (e) => {

      const target = e.target.closest(
        "[data-order-row]," +
        "[data-status-action]," +
        "[data-complete-milestone]," +
        "[data-send-message]," +
        "[data-confirm-payment]," +
        "[data-raise-dispute]," +
        "[data-thread-tab]," +
        "#ordersSearchInput," +
        "#ordersStatusFilter," +
        "[data-close-mobile]"
      );

      if (!target) return;

      /* =====================================================
         ORDER ROW CLICK
      ===================================================== */
 if (target.dataset.orderRow) {

  const poId = target.dataset.orderRow;

  window.history.pushState({}, "", `/buyer/orders/${poId}`);
  window.dispatchEvent(new PopStateEvent("popstate"));

  return;
}
      /* =====================================================
         STATUS TRANSITION
      ===================================================== */
      if (target.dataset.statusAction) {

        const newStatus = target.dataset.statusAction;

        await OrdersService.updateStatus(newStatus);

        OrdersRender.refreshAll();

        return;
      }

      /* =====================================================
         COMPLETE MILESTONE
      ===================================================== */
      if (target.dataset.completeMilestone) {

        const milestoneName =
          target.dataset.completeMilestone;

        await OrdersService.completeMilestone({
          milestoneName
        });

        OrdersRender.refreshAll();

        return;
      }

 /* =====================================================
   SEND MESSAGE
===================================================== */

if (target.dataset.sendMessage !== undefined) {

  const input = document.getElementById("orderMessageInput");

  if (!input) return;

  const message = input.value.trim();

  if (!message) return;

  const button = target;

  try {

    button.disabled = true;

    await OrdersService.sendMessage(message);

    input.value = "";

  } catch (err) {

    console.error("Message send failed", err);

  } finally {

    button.disabled = false;

  }

  return;

}

/* =========================================================
   MESSAGE ENTER SEND
========================================================= */

document.addEventListener("keydown", async (e) => {

  const input = document.getElementById("orderMessageInput");

  if (!input) return;

  if (document.activeElement !== input) return;

  if (e.key === "Enter") {

    e.preventDefault();

    const message = input.value.trim();

    if (!message) return;

    try {

      await OrdersService.sendMessage(message);

      input.value = "";

    } catch (err) {

      console.error("Message send failed", err);

    }

  }

});
      /* =====================================================
         CONFIRM PAYMENT
      ===================================================== */
      if (target.dataset.confirmPayment !== undefined) {

        const amountInput =
          document.getElementById("orderPaymentAmount");

        if (!amountInput || !amountInput.value) return;

        const amount = Number(amountInput.value);

        await OrdersService.confirmPayment(amount);

        OrdersRender.refreshAll();

        return;
      }

      /* =====================================================
         RAISE DISPUTE
      ===================================================== */
      if (target.dataset.raiseDispute !== undefined) {

        const reasonInput =
          document.getElementById("orderDisputeReason");

        if (!reasonInput || !reasonInput.value.trim()) return;

        const reason = reasonInput.value.trim();

        await OrdersService.raiseDispute(reason);

        OrdersRender.refreshAll();

        return;
      }

      /* =====================================================
         THREAD TAB SWITCH
      ===================================================== */
      if (target.dataset.threadTab) {

        const tab = target.dataset.threadTab;

        OrdersState.setActiveTab(tab);

        OrdersRender.renderThread();

        return;
      }

      /* =====================================================
         SEARCH INPUT
      ===================================================== */
      if (target.id === "ordersSearchInput") {

        const value = target.value;

        OrdersState.setFilter("search", value);

        OrdersRender.renderOrdersList();

        return;
      }

      /* =====================================================
         STATUS FILTER
      ===================================================== */
      if (target.id === "ordersStatusFilter") {

        const value = target.value || null;

        OrdersState.setFilter("status", value);

        OrdersRender.renderOrdersList();

        return;
      }

      /* =====================================================
         CLOSE MOBILE THREAD
      ===================================================== */
      if (target.dataset.closeMobile !== undefined) {

        OrdersState.toggleMobileThread(false);
        OrdersRender.closeMobileThread();

        return;
      }

    };

    document.addEventListener("click", boundHandler);

    /* =====================================================
       INPUT LISTENERS (REAL-TIME SEARCH)
    ===================================================== */

    const searchInput =
      document.getElementById("ordersSearchInput");

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        OrdersState.setFilter("search", e.target.value);
        OrdersRender.renderOrdersList();
      });
    }

    isBound = true;
  }

};

/* =========================================================
   CLEANUP
========================================================= */

export function cleanupOrders() {

  if (boundHandler) {
    document.removeEventListener("click", boundHandler);
  }

  OrdersService.cleanup();

  boundHandler = null;
  isBound = false;
}

/* =========================================================
   KEYBOARD NAVIGATION
========================================================= */

document.addEventListener("keydown", (e) => {

  const focused = document.activeElement;

  if (focused?.classList.contains("order-row")) {

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      focused.click();
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      focused.nextElementSibling?.focus();
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      focused.previousElementSibling?.focus();
    }

  }

});