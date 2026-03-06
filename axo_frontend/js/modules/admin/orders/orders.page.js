/* =========================================================
   AXO NETWORKS — ADMIN ORDERS PAGE
   Production Ready | Memory Safe | Route Safe
========================================================= */

import { fetchOrders } from "./orders.api.js";

import {
  getPagination,
  getFilters,
  setOrders,
  setLoading,
  setError,
  resetOrdersState
} from "./orders.state.js";

import { renderOrdersPage } from "./orders.render.js";
import { bindOrdersEvents } from "./orders.events.js";

import Toast from "../../../core/toast.js";

/* =========================================================
   INTERNAL STATE
========================================================= */

let containerRef = null;
let initialized = false;
let eventsBound = false;

/* =========================================================
   LOADING UI
========================================================= */

function renderLoading() {

  if (!containerRef) return;

  containerRef.innerHTML = `
    <div class="orders-loading">

      <lottie-player
        src="/assets/lottie/dashboard-loader.json"
        background="transparent"
        speed="1"
        loop
        autoplay
        style="width:160px;height:160px;margin:auto;">
      </lottie-player>

    </div>
  `;

}

/* =========================================================
   ERROR UI
========================================================= */

function renderError(message) {

  if (!containerRef) return;

  containerRef.innerHTML = `
    <div class="orders-error glass-card">

      <i data-lucide="alert-circle"></i>

      <h3>Failed to load orders</h3>

      <p>${message || "Unexpected error occurred"}</p>

      <button class="btn-primary" id="retryOrdersBtn">
        Retry
      </button>

    </div>
  `;

  if (window.lucide?.createIcons) {
    window.lucide.createIcons();
  }

}

/* =========================================================
   LOAD ORDERS
========================================================= */

async function loadOrders() {

  const pagination = getPagination();
  const filters = getFilters();

  try {

    setLoading(true);

    const data = await fetchOrders({
      page: pagination.current_page,
      limit: pagination.limit,
      status: filters.status
    });

    setOrders(data);

    return true;

  } catch (error) {

    console.error("Orders load error:", error);

    setError(error?.message);

    Toast.error(
      error?.message || "Failed to load orders"
    );

    renderError(error?.message);

    return false;

  } finally {

    setLoading(false);

  }

}

/* =========================================================
   RENDER PAGE
========================================================= */

function render() {

  if (!containerRef) return;

  renderOrdersPage(containerRef);

  /* Refresh Lucide icons */

  if (window.lucide?.createIcons) {
    window.lucide.createIcons();
  }

  /* Bind UI events once */

  if (!eventsBound) {

    bindOrdersEvents({
      reloadOrders
    });

    eventsBound = true;

  }

}

/* =========================================================
   RELOAD ORDERS
========================================================= */

export async function reloadOrders() {

  if (!containerRef) return;

  renderLoading();

  const success = await loadOrders();

  if (success) {
    render();
  }

}

/* =========================================================
   INIT PAGE
========================================================= */

export async function init(container) {

  if (!container) return;

  containerRef = container;

  if (!initialized) {

    resetOrdersState();
    initialized = true;

  }

  renderLoading();

  const success = await loadOrders();

  if (success) {
    render();
  }

}

/* =========================================================
   DESTROY PAGE
========================================================= */

export function destroy() {

  containerRef = null;
  initialized = false;
  eventsBound = false;

}