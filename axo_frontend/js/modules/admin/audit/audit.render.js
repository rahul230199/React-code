/* =========================================================
   AXO NETWORKS — AUDIT RENDER (FULLY FIXED)
========================================================= */

export const AuditRender = {

  /* ================= LAYOUT ================= */

  layout() {
    return `
      <div class="audit-wrapper">

        <div class="audit-header">

          <div class="audit-title">
            <h2>Audit Logs</h2>
            
          </div>

          <button class="btn-refresh" data-action="reload-audit">
            Refresh
          </button>

        </div>

        <div class="audit-filters">
          <input
            type="text"
            class="input-search"
            id="auditSearch"
            placeholder="Search by email, action, module..."
            autocomplete="off"
          />

          <select id="auditActionFilter" class="form-select">
            <option value="">All Actions</option>
          </select>
        </div>

        <div class="audit-content"></div>

      </div>
    `;
  },

  /* ====================================================== */

  renderAll(container, state = {}) {

    if (!container) return;

    const content = container.querySelector(".audit-content");
    const countEl = container.querySelector("[data-role='audit-count']");

    if (countEl) {
      countEl.textContent = `${state.totalRecords || 0} total`;
    }

    if (!content) return;

    if (state.loading) {
      content.innerHTML = this.loadingTemplate();
      return;
    }

    if (state.error) {
      content.innerHTML = this.errorTemplate();
      return;
    }

    if (!state.logs || state.logs.length === 0) {
      content.innerHTML = this.emptyTemplate();
      return;
    }

    content.innerHTML = `
      ${this.tableTemplate(state.logs)}
      ${this.paginationTemplate({
        page: state.page,
        total_pages: state.totalPages
      })}
    `;
  },

  /* ====================================================== */

  tableTemplate(rows = []) {

    return `
      <div class="audit-table-wrapper">
        <table class="audit-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Admin</th>
              <th>Action</th>
              <th>Module</th>
              <th>Timestamp</th>
              <th>Metadata</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => this.rowTemplate(row)).join("")}
          </tbody>
        </table>
      </div>
    `;
  },

  rowTemplate(log) {

    const id = sanitize(log.id);
    const adminEmail = sanitize(log.admin_email || "-");
    const action = sanitize(log.action_type || "-");
    const module = sanitize(log.module || "-");
    const timestamp = formatDate(log.created_at);

    const metaString = log.metadata
      ? encodeURIComponent(JSON.stringify(log.metadata).slice(0, 2000))
      : null;

    return `
      <tr>
        <td>${id}</td>
        <td>${adminEmail}</td>
        <td>
          <span class="audit-action-chip">
            ${action}
          </span>
        </td>
        <td>${module}</td>
        <td>${timestamp}</td>
        <td>
          ${
            metaString
              ? `<button 
                    class="btn-meta"
                    data-action="view-meta" 
                    data-meta="${metaString}">
                    View
                 </button>`
              : "-"
          }
        </td>
      </tr>
    `;
  },

  metaModalTemplate(data = {}) {

  const pretty = JSON.stringify(data, null, 2);

  return `
    <div class="modal-overlay">
      <div class="modal-card large">

        <div class="modal-header">
          <h3>Metadata</h3>
          <button data-action="close-meta-modal">×</button>
        </div>

        <pre class="meta-json">
${sanitize(pretty)}
        </pre>

      </div>
    </div>
  `;
},

  /* ====================================================== */

  paginationTemplate({ page = 1, total_pages = 0 } = {}) {

    if (total_pages <= 1) return "";

    let buttons = "";

    for (let i = 1; i <= total_pages; i++) {
      buttons += `
        <button
          data-action="change-page"
          data-page="${i}"
          class="${i === page ? "active" : ""}">
          ${i}
        </button>
      `;
    }

    return `
      <div class="audit-pagination">
        ${buttons}
      </div>
    `;
  },

  /* ====================================================== */

  loadingTemplate() {
    return `
      <div class="audit-loading">
        <div class="loader"></div>
      </div>
    `;
  },

  errorTemplate() {
    return `
      <div class="audit-error">
        <p>Failed to load audit logs.</p>
        <button data-action="reload-audit" class="btn-retry">
          Retry
        </button>
      </div>
    `;
  },

  emptyTemplate() {
    return `
      <div class="audit-empty">
        <p>No audit logs found.</p>
      </div>
    `;
  }

};

/* =========================================================
   UTILITIES
========================================================= */

function sanitize(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(date) {
  if (!date) return "-";

  try {
    const d = new Date(date);
    return d.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "-";
  }
}

export default AuditRender;