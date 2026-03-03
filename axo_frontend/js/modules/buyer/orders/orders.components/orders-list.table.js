/* =========================================================
   AXO NETWORKS — ORDERS LIST TABLE
   Premium SaaS Table | Responsive | SLA Aware
========================================================= */

import { OrderSLABadge } from "./order-sla-badge.js";

/* =========================================================
   FORMAT HELPERS
========================================================= */

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

/* =========================================================
   STATUS BADGE
========================================================= */

function renderStatusBadge(status) {

  const classMap = {
    issued: "status-issued",
    accepted: "status-accepted",
    in_progress: "status-progress",
    completed: "status-completed",
    disputed: "status-disputed",
    cancelled: "status-cancelled"
  };

  return `
    <span class="status-badge ${classMap[status] || ""}">
      ${status?.replace("_", " ").toUpperCase()}
    </span>
  `;
}

/* =========================================================
   DELIVERY INDICATOR
========================================================= */

function renderDeliveryStatus(promised, actual) {

  if (!promised) return "-";

  const promisedDate = new Date(promised);
  const today = new Date();

  const isLate =
    !actual &&
    promisedDate < today;

  return `
    <div class="delivery-block ${isLate ? "late" : ""}">
      <span>${formatDate(promised)}</span>
      ${isLate ? `<i data-lucide="alert-triangle"></i>` : ""}
    </div>
  `;
}

/* =========================================================
   DESKTOP TABLE
========================================================= */

function renderDesktopTable(orders) {

  return `
    <table class="orders-table">
      <thead>
        <tr>
          <th>PO Number</th>
          <th>Company</th>
          <th>Value</th>
          <th>Status</th>
          <th>SLA</th>
          <th>Delivery</th>
        </tr>
      </thead>

      <tbody>
        ${orders.map(order => `
        <tr class="order-row"
    tabindex="0"
    role="button"
    aria-label="View order ${order.po_number}"
    data-order-row="${order.id}">

            <td class="po-number">
              ${order.po_number}
            </td>

            <td>
              ${order.supplier_name || order.buyer_name || "-"}
            </td>

            <td>
              ${formatCurrency(order.value)}
            </td>

            <td>
              ${renderStatusBadge(order.status)}
            </td>

            <td>
              ${OrderSLABadge.render(order.risk_level)}
            </td>

            <td>
              ${renderDeliveryStatus(
                order.promised_delivery_date,
                order.actual_delivery_date
              )}
            </td>

          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

/* =========================================================
   MOBILE CARD VIEW
========================================================= */

function renderMobileCards(orders) {

  return `
    <div class="orders-mobile-cards">
      ${orders.map(order => `
        <div class="order-card glass-card"
             data-order-row="${order.id}">

          <div class="card-header">
            <div>
              <strong>${order.po_number}</strong>
              ${renderStatusBadge(order.status)}
            </div>

            ${OrderSLABadge.render(order.risk_level)}
          </div>

          <div class="card-body">

            <div class="card-row">
              <span>Company</span>
              <strong>
                ${order.supplier_name || order.buyer_name || "-"}
              </strong>
            </div>

            <div class="card-row">
              <span>Value</span>
              <strong>
                ${formatCurrency(order.value)}
              </strong>
            </div>

            <div class="card-row">
              <span>Delivery</span>
              ${renderDeliveryStatus(
                order.promised_delivery_date,
                order.actual_delivery_date
              )}
            </div>

          </div>
        </div>
      `).join("")}
    </div>
  `;
}

/* =========================================================
   EXPORT COMPONENT
========================================================= */

export const OrdersListTable = {

  render(orders = []) {

    return `
      <div class="orders-table-wrapper">

        <!-- DESKTOP -->
        <div class="desktop-only">
          ${renderDesktopTable(orders)}
        </div>

        <!-- MOBILE -->
        <div class="mobile-only">
          ${renderMobileCards(orders)}
        </div>

      </div>
    `;
  }

};