/* =========================================================
AXO NETWORKS — ADMIN ORDERS EVENTS
Clean Production Event Controller
========================================================= */

import {
  fetchOrderDetails,
  sendOrderMessage
} from "./orders.api.js";

import {
  setPage,
  setStatusFilter,
  setSelectedOrder,
  getOrderThread,
  addMessage
} from "./orders.state.js";

import {
  openOrderModal,
  closeOrderModal,
  setOrderModalContent,
  showOrderModalLoading
} from "./components/order.modal.js";

import { OrderThreadPanel } from "./components/order.thread.panel.js";

import Toast from "../../../core/toast.js";

/* =========================================================
INTERNAL STATE
========================================================= */

let reloadOrdersFn = null;
let eventsBound = false;

/* =========================================================
STATUS FILTER
========================================================= */

function handleStatusFilter(e) {

  setStatusFilter(e.target.value);
  setPage(1);

  reloadOrdersFn?.();

}

/* =========================================================
REFRESH
========================================================= */

function handleRefresh() {
  reloadOrdersFn?.();
}

/* =========================================================
PAGINATION
========================================================= */

function handlePagination(event) {

  const btn = event.target.closest("[data-page]");
  if (!btn) return;

  const page = Number(btn.dataset.page);
  if (!page || page < 1) return;

  setPage(page);

  reloadOrdersFn?.();

}

/* =========================================================
RENDER THREAD
========================================================= */

function renderThread(tab = "timeline") {

  const thread = getOrderThread();

  const data = {
    po: thread.purchase_order,
    milestones: thread.milestones,
    events: thread.events,
    messages: thread.messages,
    activeTab: tab
  };

  setOrderModalContent(
    OrderThreadPanel.render(data)
  );

}

/* =========================================================
VIEW ORDER
========================================================= */

async function handleViewOrder(event) {

  const btn = event.target.closest(".btn-view-order");
  if (!btn) return;

  const poId = btn.dataset.poId;
  if (!poId) return;

  try {

    btn.disabled = true;

    openOrderModal();
    showOrderModalLoading();

    const orderData = await fetchOrderDetails(poId);

    setSelectedOrder(orderData);

    renderThread();

  } catch (error) {

    console.error(error);

    Toast.error(
      error?.message ||
      "Failed to load order"
    );

  } finally {

    btn.disabled = false;

  }

}

/* =========================================================
SEND MESSAGE
========================================================= */

async function handleSendMessage() {

  const input = document.querySelector("[data-order-message-input]");
  if (!input) return;

  const message = input.value.trim();
  if (!message) return;

  const thread = getOrderThread();
  const poId = thread.purchase_order?.id;

  if (!poId) return;

  try {

    const newMessage = await sendOrderMessage(poId, message);

    addMessage(newMessage);

    input.value = "";

    renderThread("messages");

  } catch (err) {

    console.error(err);
    Toast.error("Failed to send message");

  }

}

/* =========================================================
MODAL ACTIONS
========================================================= */

function handleModalActions(event) {

  const target = event.target.closest(
    "[data-thread-tab], [data-send-message]"
  );

  if (!target) return;

  /* TAB SWITCH */

  if (target.dataset.threadTab) {

    renderThread(target.dataset.threadTab);
    return;

  }

  /* SEND MESSAGE */

  if (target.dataset.sendMessage !== undefined) {

    handleSendMessage();
    return;

  }

}

/* =========================================================
GLOBAL CLICK HANDLER
========================================================= */

function handleGlobalClick(event) {

  handlePagination(event);
  handleViewOrder(event);
  handleModalActions(event);

}

/* =========================================================
BIND EVENTS
========================================================= */

export function bindOrdersEvents({ reloadOrders }) {

  reloadOrdersFn = reloadOrders;

  if (eventsBound) return;

  eventsBound = true;

  const filter = document.getElementById("ordersStatusFilter");
  filter?.addEventListener("change", handleStatusFilter);

  const refreshBtn = document.getElementById("ordersRefreshBtn");
  refreshBtn?.addEventListener("click", handleRefresh);

  document.addEventListener("click", handleGlobalClick);

}

