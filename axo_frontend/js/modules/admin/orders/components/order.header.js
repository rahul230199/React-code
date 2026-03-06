/* =========================================================
   AXO NETWORKS — ORDER HEADER
   Production Ready
========================================================= */

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(value) {

  if (!value) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);

}

function formatDate(date) {

  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

}

function renderStatusBadge(status) {

  if (!status) return "";

  return `
    <span class="order-status-badge status-${status}">
      ${status.replace("_"," ").toUpperCase()}
    </span>
  `;

}


/* =========================================================
   HEADER COMPONENT
========================================================= */

export const OrderHeader = {

  render(data) {

    const po = data?.po || {};

    return `
      <div class="order-header">

        <div class="order-header-left">

          <div class="order-po-number">

            <h2>${po.po_number || "PO —"}</h2>

            ${renderStatusBadge(po.status)}

          </div>

          <div class="order-meta">

            <div class="order-meta-item">
              <span class="meta-label">Value</span>
              <span class="meta-value">
                ${formatCurrency(po.value)}
              </span>
            </div>

            <div class="order-meta-item">
              <span class="meta-label">Promised Delivery</span>
              <span class="meta-value">
                ${formatDate(po.promised_delivery_date)}
              </span>
            </div>

            <div class="order-meta-item">
              <span class="meta-label">Created</span>
              <span class="meta-value">
                ${formatDate(po.created_at)}
              </span>
            </div>

          </div>

        </div>


        <div class="order-header-actions">

          <button
            class="order-action-btn"
            data-order-action="dispute"
          >
            <i data-lucide="alert-circle"></i>
            Raise Dispute
          </button>

        </div>

      </div>
    `;

  }

};