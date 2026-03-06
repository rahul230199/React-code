/* =========================================================
AXO NETWORKS — ADMIN ORDERS TABLE
Production Table Renderer
========================================================= */

import {
  getOrders,
  getPagination
} from "../orders.state.js";

/* =========================================================
SVG ICONS
========================================================= */

const Icons = {

  eye: `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
  `

};

/* =========================================================
SAFE TEXT
========================================================= */

function safe(value) {
  return value ? String(value) : "—";
}

/* =========================================================
FORMAT HELPERS
========================================================= */

function formatCurrency(value) {

  if (!value) return "—";

  try {

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Number(value));

  } catch {

    return value;

  }

}

function formatDate(date) {

  if (!date) return "—";

  try {

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

  } catch {

    return "—";

  }

}

/* =========================================================
STATUS BADGE
========================================================= */

function statusBadge(status) {

  if (!status) return "";

  const normalized = String(status).toLowerCase();
  const label = normalized.replace("_", " ").toUpperCase();

  return `
    <span class="order-status status-${normalized}">
      ${label}
    </span>
  `;

}

/* =========================================================
TABLE ROW
========================================================= */

function renderRow(order = {}) {

  const poId = order.id || order.po_id;

  return `
    <tr
      class="orders-row"
      data-po-id="${poId}"
    >

      <td class="po-number">
        ${safe(order.po_number)}
      </td>

      <td class="po-buyer">
        ${safe(order.buyer_company)}
      </td>

      <td class="po-supplier">
        ${safe(order.supplier_company)}
      </td>

      <td class="po-value">
        ${formatCurrency(order.value)}
      </td>

      <td class="po-delivery">
        ${formatDate(order.promised_delivery_date)}
      </td>

      <td class="po-status">
        ${statusBadge(order.status)}
      </td>

      <td class="po-actions">

        <button
          class="btn-view-order"
          data-po-id="${poId}"
          aria-label="View Order ${safe(order.po_number)}"
        >

          ${Icons.eye}

          <span>View</span>

        </button>

      </td>

    </tr>
  `;

}

/* =========================================================
TABLE RENDER
========================================================= */

export function renderOrdersTable() {

  const orders = getOrders() || [];

  if (!orders.length) return "";

  return `
    <table
      class="orders-table"
      role="table"
      aria-label="Purchase Orders"
    >

      <thead>

        <tr>
          <th scope="col">PO Number</th>
          <th scope="col">Buyer</th>
          <th scope="col">Supplier</th>
          <th scope="col">Value</th>
          <th scope="col">Delivery</th>
          <th scope="col">Status</th>
          <th scope="col">Actions</th>
        </tr>

      </thead>

      <tbody>

        ${orders.map(renderRow).join("")}

      </tbody>

    </table>
  `;

}

/* =========================================================
PAGINATION
========================================================= */

export function renderOrdersPagination() {

  const pagination = getPagination();

  if (!pagination || pagination.total_pages <= 1) return "";

  const { current_page, total_pages } = pagination;

  const maxButtons = 7;

  let start = Math.max(1, current_page - 3);
  let end = Math.min(total_pages, start + maxButtons - 1);

  if (end - start < maxButtons) {
    start = Math.max(1, end - maxButtons + 1);
  }

  let buttons = "";

  for (let i = start; i <= end; i++) {

    buttons += `
      <button
        class="pagination-btn ${i === current_page ? "active" : ""}"
        data-page="${i}"
        aria-label="Go to page ${i}"
      >
        ${i}
      </button>
    `;

  }

  return `
    <nav
      class="orders-pagination"
      aria-label="Orders pagination"
    >
      ${buttons}
    </nav>
  `;

}