/* =========================================================
   BUYER RFQ — RENDER LAYER (ENTERPRISE READY)
========================================================= */

const containerId = "pageContainer";

/* =========================================================
   GLOBAL LOADING OVERLAY
========================================================= */

export function showLoadingOverlay() {
  if (document.getElementById("globalLoader")) return;

  const overlay = document.createElement("div");
  overlay.id = "globalLoader";
  overlay.className = "loader-overlay";
  overlay.innerHTML = `<div class="loader-spinner"></div>`;
  document.body.appendChild(overlay);
}

export function hideLoadingOverlay() {
  document.getElementById("globalLoader")?.remove();
}

/* =========================================================
   RFQ TABLE VIEW WITH FILTER + PAGINATION
========================================================= */

export function renderRFQTable({
  rfqs = [],
  page = 1,
  limit = 10,
  total = 0,
  status = ""
} = {}) {

  const container = document.getElementById(containerId);
  if (!container) return;

  const totalPages = Math.ceil(total / limit) || 1;

  const rows = rfqs.length
    ? rfqs.map(rfq => `
      <tr>
        <td>${rfq.id}</td>
        <td>${rfq.part_name}</td>
        <td>${rfq.quantity}</td>
        <td>
          <span class="status-badge ${rfq.status}">
            ${rfq.status}
          </span>
        </td>
        <td>${rfq.quote_count}</td>
        <td>
          <button class="btn-primary view-quotes-btn"
                  data-id="${rfq.id}">
            View Quotes
          </button>
        </td>
      </tr>
    `).join("")
    : `<tr><td colspan="6" class="text-center">No RFQs found</td></tr>`;

  container.innerHTML = `
    <div class="rfq-header">
      <h2>RFQs</h2>

      <div class="rfq-actions">
        <select id="rfqStatusFilter" class="input-select">
          <option value="">All Status</option>
          <option value="open" ${status === "open" ? "selected" : ""}>Open</option>
          <option value="closed" ${status === "closed" ? "selected" : ""}>Closed</option>
        </select>

        <button id="createRFQBtn" class="btn-primary">
          + Create RFQ
        </button>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Part Name</th>
            <th>Quantity</th>
            <th>Status</th>
            <th>Quotes</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
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
   QUOTES LOADING
========================================================= */

export function renderQuotesLoading() {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="dashboard-loading">
      <h2>Loading Quotes...</h2>
    </div>
  `;
}

/* =========================================================
   QUOTES EMPTY
========================================================= */

export function renderQuotesEmpty(rfqId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="rfq-header">
      <h2>Quotes for RFQ #${rfqId}</h2>
      <button id="backToRFQBtn" class="btn-secondary">
        ← Back to RFQs
      </button>
    </div>

    <div class="dashboard-empty">
      <p>No quotes available.</p>
    </div>
  `;
}

/* =========================================================
   QUOTES TABLE VIEW — ENTERPRISE FIXED
========================================================= */

export function renderQuotesTable(quotes = [], rfqId) {

  const container = document.getElementById(containerId);
  if (!container) return;

  const rows = quotes.map(q => {

    const normalizedStatus = (q.status || "").toLowerCase();

    const canAct =
      normalizedStatus === "submitted" ||
      normalizedStatus === "pending";

    return `
      <tr>
        <td>${q.id}</td>
        <td>${q.supplier_org_id}</td>
        <td>₹ ${Number(q.price).toLocaleString()}</td>
        <td>${q.timeline_days} days</td>
        <td>
          <span class="status-badge ${normalizedStatus}">
            ${q.status}
          </span>
        </td>
        <td>
          ${canAct ? `
            <button class="btn-primary accept-quote-btn"
                    data-id="${q.id}">
              Accept
            </button>
            <button class="btn-secondary reject-quote-btn"
                    data-id="${q.id}">
              Reject
            </button>
          ` : `
            <span class="text-muted">—</span>
          `}
        </td>
      </tr>
    `;

  }).join("");

  container.innerHTML = `
    <div class="rfq-header">
      <h2>Quotes for RFQ #${rfqId}</h2>
      <button id="backToRFQBtn" class="btn-secondary">
        ← Back to RFQs
      </button>
    </div>

    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Quote ID</th>
            <th>Supplier Org</th>
            <th>Price</th>
            <th>Timeline</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

/* =========================================================
   CREATE RFQ MODAL
========================================================= */

export function renderCreateRFQModal() {

  const existing = document.getElementById("rfqModal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "rfqModal";
  modal.className = "modal-overlay";

  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>Create RFQ</h3>
        <button id="closeRFQModalBtn">×</button>
      </div>

      <form id="createRFQForm" class="modal-body">
        <div class="form-group">
          <label>Part Name</label>
          <input type="text" name="part_name" required />
        </div>

        <div class="form-group">
          <label>Quantity</label>
          <input type="number" name="quantity" required min="1" />
        </div>

        <div class="form-group">
          <label>Material Specification</label>
          <textarea name="material_spec" rows="3"></textarea>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary"
                  id="cancelRFQBtn">
            Cancel
          </button>
          <button type="submit" class="btn-primary">
            Submit RFQ
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("closeRFQModalBtn")
    .addEventListener("click", () => modal.remove());

  document.getElementById("cancelRFQBtn")
    .addEventListener("click", () => modal.remove());
}

/* =========================================================
   ENTERPRISE CONFIRM MODAL
========================================================= */

export function renderConfirmModal({
  title = "Confirm Action",
  message = "",
  confirmText = "Confirm",
  cancelText = "Cancel"
} = {}) {

  return new Promise((resolve) => {

    const existing = document.getElementById("confirmModal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "confirmModal";
    modal.className = "modal-overlay";

    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>${title}</h3>
        </div>

        <div class="modal-body">
          <p style="font-size:0.9rem; color:var(--gray-700);">
            ${message}
          </p>
        </div>

        <div class="modal-footer">
          <button id="confirmCancelBtn" class="btn-secondary">
            ${cancelText}
          </button>
          <button id="confirmOkBtn" class="btn-primary">
            ${confirmText}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("confirmCancelBtn")
      .addEventListener("click", () => {
        modal.remove();
        resolve(false);
      });

    document.getElementById("confirmOkBtn")
      .addEventListener("click", () => {
        modal.remove();
        resolve(true);
      });

  });
}