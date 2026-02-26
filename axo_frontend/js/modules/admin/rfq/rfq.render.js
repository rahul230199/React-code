/* =========================================================
   AXO NETWORKS — ADMIN RFQ RENDER
   Enterprise SaaS • Clean • Responsive • Hardened
========================================================= */

export const RFQRender = {

  /* ======================================================
     LAYOUT
  ====================================================== */

  layout() {
    return `
      <div class="rfq-wrapper">

        <div class="rfq-header">
          <div class="rfq-title">
            <h2>RFQ Management</h2>
          </div>
        </div>

        <div class="rfq-filters-container"></div>

        <div class="rfq-content"></div>

      </div>
    `;
  },

  /* ======================================================
     MAIN RENDER
  ====================================================== */

  renderAll(container, state = {}) {

    if (!container) return;

    const filtersContainer =
      container.querySelector(".rfq-filters-container");

    const content =
      container.querySelector(".rfq-content");

    if (!filtersContainer || !content) return;

    const {
      rfqs = [],
      loading = false,
      pagination = {},
      error = null,
      filters = {}
    } = state;

    filtersContainer.innerHTML =
      this.filtersTemplate(filters);

    if (loading) {
      content.innerHTML = this.loadingTemplate();
      return;
    }

    if (error) {
      content.innerHTML = this.errorTemplate();
      return;
    }

    if (!rfqs.length) {
      content.innerHTML = this.emptyTemplate();
      return;
    }

    content.innerHTML = `
      <div class="rfq-table-wrapper">
        ${this.tableTemplate(rfqs)}
      </div>
      ${this.paginationTemplate(pagination)}
    `;
  },

  /* ======================================================
     FILTERS
  ====================================================== */

  filtersTemplate(filters = {}) {
    return `
      <div class="rfq-filters">

        <div class="filter-group">
          <input
            type="text"
            placeholder="Search RFQs..."
            value="${this.escape(filters.search || "")}"
            data-filter="search"
            class="filter-input"
          />
        </div>

        ${this.selectTemplate("status", filters.status, ["open","closed","awarded","cancelled"])}
        ${this.selectTemplate("priority", filters.priority, ["urgent","high","normal","low"])}
        ${this.selectTemplate("visibility_type", filters.visibility_type, ["public","private"])}

      </div>
    `;
  },

  selectTemplate(key, selected, options = []) {
    return `
      <select data-filter="${key}" class="filter-select">
        <option value="">All ${this.capitalize(key.replace("_type",""))}</option>
        ${options.map(opt => `
          <option value="${opt}" ${opt === selected ? "selected":""}>
            ${this.capitalize(opt)}
          </option>
        `).join("")}
      </select>
    `;
  },

  /* ======================================================
     TABLE
  ====================================================== */

  tableTemplate(rfqs = []) {
    return `
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Part</th>
            <th>Buyer</th>
            <th>Status</th>
            <th>Quotes</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${rfqs.map(r => this.rowTemplate(r)).join("")}
        </tbody>
      </table>
    `;
  },

rowTemplate(rfq = {}) {

  const status = String(rfq.status || "open").toLowerCase();
  const isAwarded = status === "awarded";

  return `
    <tr class="${isAwarded ? "rfq-awarded-row" : ""}">
      <td>${this.escape(rfq.id)}</td>
      <td>
        ${this.escape(rfq.part_name)}
        ${isAwarded ? `<span class="rfq-awarded-tag">Awarded</span>` : ""}
      </td>
      <td>${this.escape(rfq.buyer_company)}</td>
      <td>${this.statusBadge(status)}</td>
      <td>${rfq.quote_count || 0}</td>
      <td>${this.formatDate(rfq.created_at)}</td>
      <td>
        <div class="rfq-actions">

          <button
            class="action-btn"
            data-action="view-rfq"
            data-id="${rfq.id}">
            ${this.eyeIcon()}
          </button>

          ${!isAwarded ? `
            <button
              class="action-btn"
              data-action="assign-quotes"
              data-id="${rfq.id}">
              ${this.editIcon()}
            </button>
          ` : ""}

          <button
            class="action-btn"
            data-action="view-quotes"
            data-id="${rfq.id}">
            ${this.listIcon()}
          </button>

        </div>
      </td>
    </tr>
  `;
},

  /* ======================================================
     RFQ DETAIL MODAL
  ====================================================== */

  rfqDetailModal(rfq = {}) {
    return `
      <div class="rfq-modal-overlay">
        <div class="rfq-modal">

          <div class="modal-header">
            <h3>RFQ Details</h3>
            <button data-action="close-modal">
              ${this.closeIcon()}
            </button>
          </div>

          <div class="modal-grid">

            <div>
              <label>Part Name</label>
              <p>${this.escape(rfq.part_name)}</p>
            </div>

            <div>
              <label>Quantity</label>
              <p>${this.escape(rfq.quantity)}</p>
            </div>

            <div>
              <label>PPAP Level</label>
              <p>${this.escape(rfq.ppap_level)}</p>
            </div>

            <div>
              <label>Buyer</label>
              <p>${this.escape(rfq.buyer_company)}</p>
            </div>

          </div>

          <div class="modal-description">
            <label>Description</label>
            <p>${this.escape(rfq.part_description)}</p>
          </div>

        </div>
      </div>
    `;
  },

  /* ======================================================
     QUOTES MODAL
  ====================================================== */

  quotesModal(quotes = [], rfqId) {

    return `
      <div class="rfq-modal-overlay">
        <div class="rfq-modal large">

          <div class="modal-header">
            <h3>Supplier Quotes</h3>
            <button data-action="close-modal">
              ${this.closeIcon()}
            </button>
          </div>

          <div class="quotes-table">

            ${quotes.length === 0
              ? `<div class="rfq-empty">No quotes submitted.</div>`
              : `
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Supplier</th>
                      <th>Price</th>
                      <th>Timeline</th>
                      <th>Reliability</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
  ${quotes.map(q => {

    const isWinner = q.status === "accepted";

    return `
      <tr class="${isWinner ? "quote-winner-row" : ""}">
        <td>${this.escape(q.company_name)}</td>
        <td>₹ ${this.escape(q.price)}</td>
        <td>${this.escape(q.timeline_days || "-")} days</td>
        <td>
          <span class="reliability-badge">
            ${this.escape(q.reliability_snapshot ?? "-")}%
          </span>
        </td>
        <td>${this.quoteStatusBadge(q.status)}</td>
        <td>
          ${!isWinner ? `
            <button
              class="btn btn-primary btn-sm"
              data-action="award-quote"
              data-id="${rfqId}"
              data-quote="${q.id}">
              Award
            </button>
          ` : `<span class="winner-label">Winner</span>`}
        </td>
      </tr>
    `;
  }).join("")}
</tbody>
                </table>
              `
            }

          </div>

        </div>
      </div>
    `;
  },

  /* ======================================================
     BADGES
  ====================================================== */

  statusBadge(status) {
    return `
      <span class="status-badge ${status}">
        ${this.escape(status.toUpperCase())}
      </span>
    `;
  },

  quoteStatusBadge(status) {
    return `
      <span class="status-badge ${status}">
        ${this.escape(status.toUpperCase())}
      </span>
    `;
  },

  /* ======================================================
     PAGINATION
  ====================================================== */

  paginationTemplate(pagination = {}) {

    const page =
      Math.max(1, Number(pagination.page) || 1);

    const total =
      Number(pagination.total_pages) || 0;

    if (total <= 1) return "";

    return `
      <div class="pagination">
        <button
          data-action="change-page"
          data-page="${page - 1}"
          ${page <= 1 ? "disabled":""}>
          Prev
        </button>

        <span>Page ${page} of ${total}</span>

        <button
          data-action="change-page"
          data-page="${page + 1}"
          ${page >= total ? "disabled":""}>
          Next
        </button>
      </div>
    `;
  },

  /* ======================================================
     STATES
  ====================================================== */

  loadingTemplate() {
    return `
      <div class="rfq-loading">
        <div class="loader"></div>
      </div>
    `;
  },

  emptyTemplate() {
    return `
      <div class="rfq-empty">
        No RFQs found.
      </div>
    `;
  },

  errorTemplate() {
    return `
      <div class="rfq-error">
        Failed to load RFQs.
        <button data-action="reload-rfq">Retry</button>
      </div>
    `;
  },

  /* ======================================================
     ICONS (Lucide Style)
  ====================================================== */

  eyeIcon() {
    return `<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>`;
  },

  editIcon() {
    return `<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2">
      <path d="M12 20h9"/>
      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/>
    </svg>`;
  },

  listIcon() {
    return `<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <circle cx="3" cy="6" r="1"/>
      <circle cx="3" cy="12" r="1"/>
      <circle cx="3" cy="18" r="1"/>
    </svg>`;
  },

  closeIcon() {
    return `<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>`;
  },

  /* ======================================================
     HELPERS
  ====================================================== */

  escape(value) {
    if (value === null || value === undefined)
      return "-";

    return String(value)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  },

  formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString();
  },

  capitalize(str="") {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

};

export default RFQRender;