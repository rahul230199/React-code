/* =========================================================
AXO NETWORKS — ADMIN ORDERS RENDERER
Clean Production Renderer
========================================================= */

import { getFilters } from "./orders.state.js";

import {
  renderOrdersTable,
  renderOrdersPagination
} from "./components/orders.table.js";

import Toast from "../../../core/toast.js";

/* =========================================================
TOOLBAR
========================================================= */

function renderToolbar() {

  const filters = getFilters() || { status: "ALL" };

  return `
    <div class="orders-toolbar">

      <div class="orders-toolbar-left">

        <label class="visually-hidden" for="ordersStatusFilter">
          Filter Orders
        </label>

        <select
          class="orders-filter"
          id="ordersStatusFilter"
          data-orders-filter
          aria-label="Filter orders by status"
        >

          <option value="ALL" ${filters.status === "ALL" ? "selected" : ""}>
            All Status
          </option>

          <option value="issued" ${filters.status === "issued" ? "selected" : ""}>
            Issued
          </option>

          <option value="accepted" ${filters.status === "accepted" ? "selected" : ""}>
            Accepted
          </option>

          <option value="in_progress" ${filters.status === "in_progress" ? "selected" : ""}>
            In Progress
          </option>

          <option value="completed" ${filters.status === "completed" ? "selected" : ""}>
            Completed
          </option>

          <option value="cancelled" ${filters.status === "cancelled" ? "selected" : ""}>
            Cancelled
          </option>

          <option value="disputed" ${filters.status === "disputed" ? "selected" : ""}>
            Disputed
          </option>

        </select>

      </div>

      <div class="orders-toolbar-right">

       <button
  class="btn-refresh"
  id="ordersRefreshBtn"
  data-orders-refresh
  title="Refresh Orders"
  aria-label="Refresh Orders"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="lucide lucide-refresh-cw"
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
  <span>Refresh</span>
</button>

      </div>

    </div>
  `;
}

/* =========================================================
EMPTY STATE
========================================================= */

function renderEmptyState() {

  return `
    <div class="orders-empty glass-card">

      <i data-lucide="package"></i>

      <h3>No Orders Found</h3>

      <p>
        There are currently no purchase orders matching the selected filters.
      </p>

    </div>
  `;
}

/* =========================================================
PAGE RENDER
========================================================= */

export function renderOrdersPage(container) {

  if (!container) return;

  try {

    const tableHTML = renderOrdersTable();
    const paginationHTML = renderOrdersPagination();

    const html = `
      <section
        class="orders-page"
        data-orders-page
      >

        ${renderToolbar()}

        <div class="orders-list-zone">

          <div
            class="orders-table-container"
            data-orders-table
          >

            ${tableHTML || renderEmptyState()}

          </div>

          ${
            paginationHTML
              ? `
                <div
                  class="orders-pagination-container"
                  data-orders-pagination
                >
                  ${paginationHTML}
                </div>
              `
              : ""
          }

        </div>

      </section>
    `;

    container.innerHTML = html;

    /* Refresh icons */

    if (window.lucide?.createIcons) {
      window.lucide.createIcons();
    }

  } catch (err) {

    console.error("Orders render error:", err);

    Toast.error("Failed to render orders");

  }

}