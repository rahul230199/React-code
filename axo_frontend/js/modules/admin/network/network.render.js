/* =========================================================
   AXO ADMIN — NETWORK MODULE (FINAL FIXED)
   Clean • Responsive • Lucide SVG • No Syntax Errors
========================================================= */

export const NetworkRender = {

  /* ====================================================== */
  /* LAYOUT */
  /* ====================================================== */

  layout() {
    return `
      <div class="network-wrapper">

        <div class="network-header">
          <div class="network-title">
            ${this.icon("users")}
            <h2>Network Access Requests</h2>
          </div>
        </div>

        <div class="network-filters">

          <div class="filter-group">
            ${this.icon("search")}
            <input
              type="text"
              placeholder="Search company, email or contact..."
              data-filter="search"
              class="filter-input"
            />
          </div>

          <select data-filter="status" class="filter-select">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <input type="date" data-filter="start_date" class="filter-date" />
          <input type="date" data-filter="end_date" class="filter-date" />

          <button
            type="button"
            data-action="clear-filters"
            class="btn btn-secondary btn-sm">
            ${this.icon("rotate-ccw")}
            Clear
          </button>

        </div>

        <div class="network-content"></div>

      </div>
    `;
  },

  /* ====================================================== */
  /* MAIN RENDER */
  /* ====================================================== */

  renderAll(container, { requests = [], loading = false, pagination = {}, error = null }) {

    if (!container) return;

    const content = container.querySelector(".network-content");
    if (!content) return;

    if (loading) {
      content.innerHTML = this.loadingTemplate();
      return;
    }

    if (error) {
      content.innerHTML = this.errorTemplate();
      return;
    }

    if (!Array.isArray(requests) || !requests.length) {
      content.innerHTML = this.emptyTemplate();
      return;
    }

    content.innerHTML = `
      <div class="network-table-wrapper">
        ${this.tableTemplate(requests)}
      </div>
      ${this.paginationTemplate(pagination)}
    `;
  },

  /* ====================================================== */
  /* TABLE */
  /* ====================================================== */

  tableTemplate(requests) {
    return `
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Company</th>
            <th>Contact</th>
            <th>Email</th>
            <th>Status</th>
            <th>Created</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${requests.map(item => this.rowTemplate(item)).join("")}
        </tbody>
      </table>
    `;
  },

  rowTemplate(item = {}) {

    const status = this.normalizeStatus(item.status);

    return `
      <tr>
        <td>${this.escape(item.id)}</td>
        <td>${this.escape(item.company_name)}</td>
        <td>${this.escape(item.contact_name)}</td>
        <td>${this.escape(item.email)}</td>
        <td>${this.statusBadge(status)}</td>
        <td>${this.formatDate(item.created_at)}</td>
       <td>
  <button
    type="button"
    class="action-btn"
    data-action="view-request"
    data-id="${this.escape(item.id)}">
    ${this.icon("eye")}
  </button>
</td>
      </tr>
    `;
  },

  /* ====================================================== */
/* MODAL RENDER */
/* ====================================================== */

renderModal(item) {

  const whatYouDo = item.what_you_do
    ? Object.keys(item.what_you_do)
        .filter(key => item.what_you_do[key])
        .map(key => key.replace(/_/g, " "))
        .join(", ")
    : "-";

  const modalHTML = `
    <div class="network-modal-overlay">
      <div class="network-modal">

        <div class="network-modal-header">
          <h3>Network Request Details</h3>
          <button data-close="true" class="modal-close-btn" aria-label="Close">
  <svg viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
</button>
        </div>

        <div class="network-modal-body">

          <div class="modal-grid">

            ${this.modalRow("Company", item.company_name)}
            ${this.modalRow("Website", item.website)}
            ${this.modalRow("Registered Address", item.registered_address)}
            ${this.modalRow("City / State", item.city_state)}
            ${this.modalRow("Contact Name", item.contact_name)}
            ${this.modalRow("Role Requested", item.role_requested)}
            ${this.modalRow("Email", item.email)}
            ${this.modalRow("Phone", item.phone)}
            ${this.modalRow("Primary Product", item.primary_product)}
            ${this.modalRow("Key Components", item.key_components)}
            ${this.modalRow("Manufacturing Locations", item.manufacturing_locations)}
            ${this.modalRow("Monthly Capacity", item.monthly_capacity)}
            ${this.modalRow("Certifications", item.certifications)}
            ${this.modalRow("Role in EV", item.role_in_ev)}
            ${this.modalRow("Why Join AXO", item.why_join_axo)}
            ${this.modalRow("What You Do", whatYouDo)}
            ${this.modalRow("Status", this.statusBadge(item.status), true)}
            ${this.modalRow("Created", this.formatDate(item.created_at))}

          </div>

          ${item.status === "pending" ? `
            <div class="modal-comment-section">
  <label class="comment-label">Verification Comment</label>
  <textarea
    id="networkComment"
    class="comment-textarea"
    placeholder="Write your verification decision..."
  ></textarea>
</div>

            <div class="modal-actions">
              <button
                class="btn btn-success"
                data-action="approve-request"
                data-id="${item.id}">
                Approve
              </button>

              <button
                class="btn btn-danger"
                data-action="reject-request"
                data-id="${item.id}">
                Reject
              </button>
            </div>
          ` : ""}

        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);
},


modalRow(label, value, isHTML = false) {
  return `
    <div class="modal-row">
      <div class="modal-label">${label}</div>
      <div class="modal-value">
        ${isHTML ? value : (value ? this.escape(value) : "-")}
      </div>
    </div>
  `;
},
  /* ====================================================== */
  /* PAGINATION */
  /* ====================================================== */

  paginationTemplate(pagination = {}) {

    const page = Math.max(1, Number(pagination.page) || 1);
    const total = Math.max(0, Number(pagination.total_pages) || 0);

    if (total <= 1) return "";

    return `
      <div class="pagination">
        <button
          data-action="change-page"
          data-page="${page - 1}"
          ${page <= 1 ? "disabled" : ""}>
          ${this.icon("chevron-left")}
        </button>

        <span>Page ${page} of ${total}</span>

        <button
          data-action="change-page"
          data-page="${page + 1}"
          ${page >= total ? "disabled" : ""}>
          ${this.icon("chevron-right")}
        </button>
      </div>
    `;
  },

  /* ====================================================== */
  /* STATES */
  /* ====================================================== */

  loadingTemplate() {
    return `<div class="network-loading"><div class="loader"></div></div>`;
  },

  emptyTemplate() {
  return `
    <div class="network-empty-state">

      <div class="empty-icon">
        ${this.icon("inbox")}
      </div>

      <h3>No network requests found</h3>

      <p>
        There are currently no access requests matching your filters.
        Try adjusting filters or clear them to see all requests.
      </p>

      <button 
        class="btn btn-secondary"
        data-action="clear-filters">
        Clear Filters
      </button>

    </div>
  `;
},

  errorTemplate() {
    return `
      <div class="network-error">
        ${this.icon("alert-circle")}
        Failed to load requests.
        <button data-action="reload-network">Retry</button>
      </div>
    `;
  },

  /* ====================================================== */
  /* STATUS */
  /* ====================================================== */

  statusBadge(status) {
    return `<span class="status-badge ${status}">
      ${status.toUpperCase()}
    </span>`;
  },

  normalizeStatus(status) {
    const allowed = ["pending", "approved", "rejected"];
    const normalized = String(status || "").toLowerCase();
    return allowed.includes(normalized) ? normalized : "pending";
  },

  /* ====================================================== */
  /* ICON SYSTEM (FIXED SYNTAX)
  /* ====================================================== */

  icon(name) {

  const icons = {
    search: `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,

    users: `<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5"/><circle cx="9" cy="7" r="4"/></svg>`,

    eye: `<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>`,

    inbox: `<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M3 15l4-4h10l4 4"/></svg>`,

    "alert-circle": `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12" y2="16"/></svg>`,

    "rotate-ccw": `<svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-9"/></svg>`,

    "chevron-left": `<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>`,

    "chevron-right": `<svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>`
  };

  return `<span class="icon">${icons[name] || ""}</span>`;
},

  /* ====================================================== */

  escape(value) {
    if (value == null) return "-";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

};

export default NetworkRender;