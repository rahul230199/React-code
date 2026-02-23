/* =========================================================
   BUYER ORDERS — RENDER LAYER (PRODUCTION SAFE)
   - XSS Safe
   - UX Improved
   - Clean DOM lifecycle
========================================================= */

const containerId = "pageContainer";

/* =========================================================
   ESCAPE HELPER (XSS PROTECTION)
========================================================= */

function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   ORDERS LIST VIEW
========================================================= */

export function renderOrdersTable({
  orders = [],
  page = 1,
  limit = 10,
  total = 0
} = {}) {

  const container = document.getElementById(containerId);
  if (!container) return;

  const totalPages = Math.ceil(total / limit) || 1;

  const rows = orders.length ? orders.map(order => `
    <tr>
      <td>${escapeHTML(order.po_number)}</td>
      <td>${escapeHTML(order.part_name)}</td>
      <td>${order.quantity}</td>
      <td>₹ ${Number(order.value).toLocaleString()}</td>
      <td>
        <span class="status-badge ${escapeHTML(order.status || "").toLowerCase()}">
          ${escapeHTML(order.status)}
        </span>
      </td>
      <td>
        <button class="btn-primary view-po-btn"
                data-id="${order.id}">
          View
        </button>
      </td>
    </tr>
  `).join("") : `
    <tr><td colspan="6">No orders found</td></tr>
  `;

  container.innerHTML = `
    <div class="orders-header">
      <h2>Purchase Orders</h2>
    </div>

    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>PO Number</th>
            <th>Part</th>
            <th>Qty</th>
            <th>Value</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="pagination">
      <button id="prevPageBtn" ${page <= 1 ? "disabled" : ""}>
        ← Previous
      </button>
      <span>Page ${page} of ${totalPages}</span>
      <button id="nextPageBtn" ${page >= totalPages ? "disabled" : ""}>
        Next →
      </button>
    </div>
  `;
}

/* =========================================================
   EMPTY STATE
========================================================= */

export function renderOrdersEmpty() {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="dashboard-empty">
      <h3>No Purchase Orders Found</h3>
      <p>Your accepted quotes will appear here.</p>
    </div>
  `;
}

/* =========================================================
   PO DETAIL VIEW
========================================================= */

export function renderPODetailView({
  po,
  milestones = [],
  events = [],
  financial = {}
} = {}) {

  const container = document.getElementById(containerId);
  if (!container) return;

  const milestoneRows = milestones.length
    ? milestones.map(m => `
      <tr>
        <td>${escapeHTML(m.milestone_name)}</td>
        <td>${escapeHTML(m.status)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="2">No milestones available</td></tr>`;

  const eventRows = events.length
    ? events.map(e => `
      <tr>
        <td>${escapeHTML(e.event_type)}</td>
        <td>${escapeHTML(e.actor_role)}</td>
        <td>${e.created_at ? new Date(e.created_at).toLocaleString() : "-"}</td>
        <td>${escapeHTML(e.description || "-")}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="4">No audit records</td></tr>`;

  container.innerHTML = `
    <div class="orders-header">
      <button id="backToOrdersBtn" class="btn-secondary">
        ← Back to Orders
      </button>
      <h2>PO ${escapeHTML(po.po_number)}</h2>
    </div>

    <div class="po-summary-card">
      <p><strong>Part:</strong> ${escapeHTML(po.part_name)}</p>
      <p><strong>Quantity:</strong> ${po.quantity}</p>
      <p><strong>Total Value:</strong> ₹ ${Number(po.value).toLocaleString()}</p>
      <p><strong>Status:</strong> ${escapeHTML(po.status)}</p>
    </div>

    <div class="po-financial-card">
      <h3>Financial Summary</h3>
      <p><strong>Total Value:</strong> ₹ ${Number(financial.total_value || 0).toLocaleString()}</p>
      <p><strong>Total Paid:</strong> ₹ ${Number(financial.total_paid || 0).toLocaleString()}</p>
      <p><strong>Balance:</strong> ₹ ${Number(financial.balance || 0).toLocaleString()}</p>

      ${financial.balance > 0 ? `
        <button id="openPaymentModalBtn" class="btn-primary">
          Pay Now
        </button>
      ` : ""}
    </div>

    <div class="po-section">
      <h3>Milestones</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Milestone</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${milestoneRows}</tbody>
      </table>
    </div>

    <div class="po-section">
      <h3>Audit Trail</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Actor</th>
            <th>Date</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>${eventRows}</tbody>
      </table>
    </div>

    ${po.status !== "DISPUTED" ? `
      <button id="openDisputeModalBtn" class="btn-danger">
        Raise Dispute
      </button>
    ` : ""}

    <button id="downloadPOBtn" class="btn-secondary">
      Download PDF
    </button>
  `;
}

/* =========================================================
   MODAL BASE HELPER
========================================================= */

function attachModalClose(modal) {

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") modal.remove();
  }, { once: true });
}

/* =========================================================
   DISPUTE MODAL
========================================================= */

export function renderDisputeModal() {

  const modal = document.createElement("div");
  modal.id = "disputeModal";
  modal.className = "modal-overlay";

  modal.innerHTML = `
    <div class="modal">
      <h3>Raise Dispute</h3>
      <form id="disputeForm">
        <textarea name="reason" required minlength="5"
          placeholder="Enter dispute reason..."></textarea>
        <div class="modal-footer">
          <button type="submit" class="btn-danger">
            Submit
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  attachModalClose(modal);
}

/* =========================================================
   PAYMENT MODAL
========================================================= */

export function renderPaymentModal(poId, amount) {

  const modal = document.createElement("div");
  modal.id = "paymentModal";
  modal.className = "modal-overlay";

  modal.innerHTML = `
    <div class="modal">
      <h3>Pay ₹ ${Number(amount).toLocaleString()}</h3>
      <form id="paymentForm">
        <input type="number" name="amount"
               value="${amount}" readonly />
        <div class="modal-footer">
          <button type="submit" class="btn-primary">
            Confirm Payment
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  attachModalClose(modal);
}