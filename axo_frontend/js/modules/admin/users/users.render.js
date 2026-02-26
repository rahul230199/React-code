/* =========================================================
   AXO NETWORKS — USERS RENDER
   Clean SaaS • Linear Inspired • Responsive • Production
========================================================= */

export const UsersRender = {

  render(container, state = {}) {

    if (!container) return;

    container.innerHTML = `
      <div class="users-page">

        ${this.renderHeader(state)}

        <div class="users-card">
          ${this.renderTableSection(state)}
        </div>

        ${this.renderPagination(state)}
        ${this.renderModals(state)}

      </div>
    `;
  },

  /* ================= HEADER ================= */

renderHeader(state) {
  return `
    <div class="users-header">

      <div class="users-title">
        <h2>Users</h2>
        <span>${state.totalRecords || 0} total</span>
      </div>

      <div class="users-controls">

        <input 
          type="text"
          placeholder="Search users..."
          value="${escapeHTML(state.search || "")}"
          data-action="search"
          class="input-search"
        />

        <div class="filter-system">

          <div class="filter-group">
            ${renderFilterChips(
              ["all","admin","buyer","supplier"],
              state.roleFilter,
              "role-filter"
            )}
          </div>

          <div class="filter-group">
            ${renderFilterChips(
              ["all","active","inactive"],
              state.statusFilter,
              "status-filter"
            )}
          </div>

        </div>

      </div>

    </div>
  `;
},




  /* ================= TABLE ================= */

  renderTableSection(state) {

    if (state.loading) {
      return `<div class="users-loading">Loading users...</div>`;
    }

    if (!state.users?.length) {
      return `<div class="users-empty">No users found</div>`;
    }

    return `
      <div class="table-responsive">
        <table class="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Organization</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${state.users.map(u => this.renderRow(u)).join("")}
          </tbody>
        </table>
      </div>
    `;
  },

  renderRow(user) {

    const isActive = user.status === "active";

    return `
      <tr>
        <td>
          <div class="user-cell">
            <div class="avatar">
              ${user.username?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <div class="username">${escapeHTML(user.username)}</div>
              <div class="email">${escapeHTML(user.email)}</div>
            </div>
          </div>
        </td>

        <td>
          <span class="role-chip ${user.role}">
            ${user.role.toUpperCase()}
          </span>
        </td>

        <td>
          <span class="status-badge ${isActive ? "active" : "inactive"}">
            ${isActive ? "Active" : "Inactive"}
          </span>
        </td>

        <td>${escapeHTML(user.company_name || "-")}</td>

        <td>${formatDate(user.created_at)}</td>

        <td class="row-actions">

          ${iconButton("view", user.id, "View")}
          ${iconButton("edit", user.id, "Edit")}
          ${iconButton("reset", user.id, "Reset")}
          ${iconButton("toggle-status", user.id, isActive ? "Deactivate" : "Activate", user.status)}
          ${iconButton("delete", user.id, "Delete")}

        </td>
      </tr>
    `;
  },

  /* ================= PAGINATION ================= */

  renderPagination(state) {

    if (!state.totalPages || state.totalPages <= 1) return "";

    return `
      <div class="users-pagination">
        ${Array.from({ length: state.totalPages }, (_, i) => i + 1)
          .map(page => `
            <button 
              data-action="page"
              data-page="${page}"
              class="${page === state.page ? "active" : ""}">
              ${page}
            </button>
          `).join("")}
      </div>
    `;
  },

  /* ================= MODALS ================= */

  renderModals(state) {

    if (!state.activeModal) return "";

    if (state.activeModal === "view") {
      return this.renderViewModal(state);
    }

    if (state.activeModal === "edit") {
      return this.renderEditModal(state);
    }

    if (state.activeModal === "reset") {
      return this.renderResetModal(state);
    }

    return "";
  },

 renderViewModal(state) {

  const u = state.selectedUser;
  if (!u) return "";

  return modalWrapper(`
    <div class="modal-header">
      <h3>User Details</h3>
      <button data-action="close-modal" class="modal-close">×</button>
    </div>

    <div class="details-grid">
      <div><label>ID</label><span>${u.id}</span></div>
      <div><label>Email</label><span>${escapeHTML(u.email)}</span></div>
      <div><label>Role</label><span>${u.role}</span></div>
      <div><label>Status</label><span>${u.status}</span></div>
    </div>

    <div class="modal-actions">
      <button data-action="close-modal" class="btn-secondary">Close</button>
    </div>
  `);
},

renderEditModal(state) {

  const u = state.selectedUser;
  if (!u) return "";

  return modalWrapper(`
    <div class="modal-header">
      <h3>Edit Role</h3>
      <button data-action="close-modal" class="modal-close">×</button>
    </div>

    <div class="form-group">
      <label>Role</label>
      <select data-field="role" class="form-select">
  <option value="admin" ${u.role==="admin"?"selected":""}>Admin</option>
  <option value="buyer" ${u.role==="buyer"?"selected":""}>Buyer</option>
  <option value="supplier" ${u.role==="supplier"?"selected":""}>Supplier</option>
</select>
    </div>

    <div class="modal-actions">
      <button data-action="save-edit" class="btn-primary">Save</button>
      <button data-action="close-modal" class="btn-secondary">Cancel</button>
    </div>
  `);
},

renderResetModal(state) {

  const temp = state.temporaryPassword;

  return modalWrapper(`
    <div class="modal-header">
      <h3>Reset Password</h3>
      <button data-action="close-modal" class="modal-close">×</button>
    </div>

    ${
      temp
        ? `
        <div class="temp-password-box">
          <code id="tempPassword">${temp}</code>
          <button data-action="copy-password" class="btn-secondary small-btn">
            Copy
          </button>
        </div>
        <p class="note-text">User must change password on next login.</p>
        `
        : `<p>Confirm password reset?</p>`
    }

    <div class="modal-actions">
      ${
        !temp
          ? `<button data-action="confirm-reset" class="btn-danger">Confirm</button>`
          : ""
      }
      <button data-action="close-modal" class="btn-secondary">
        Close
      </button>
    </div>
  `);
}

};

/* ================= HELPERS ================= */

function iconButton(action, id, label, status = "") {
  return `
    <button 
      class="icon-btn"
      data-action="${action}"
      data-id="${id}"
      data-status="${status}"
      title="${label}">
      <span class="icon-wrapper">
        ${lucideIcon(action)}
      </span>
    </button>
  `;
}

function lucideIcon(type) {

  const base = `
    width="18"
    height="18"
    stroke="#374151"
    fill="none"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  `;

  const icons = {

    view: `
      <svg ${base} viewBox="0 0 24 24">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    `,

    edit: `
      <svg ${base} viewBox="0 0 24 24">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/>
      </svg>
    `,

    delete: `
      <svg ${base} viewBox="0 0 24 24">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14H6L5 6"/>
        <path d="M10 11v6M14 11v6"/>
      </svg>
    `,

    reset: `
      <svg ${base} viewBox="0 0 24 24">
        <path d="M3 12a9 9 0 1 1 3 6"/>
        <polyline points="3 16 3 12 7 12"/>
      </svg>
    `,

    "toggle-status": `
      <svg ${base} viewBox="0 0 24 24">
        <rect x="2" y="7" width="20" height="10" rx="5"/>
        <circle cx="16" cy="12" r="3"/>
      </svg>
    `
  };

  return icons[type] || "";
}

function modalWrapper(content) {
  return `
    <div class="modal-overlay">
      <div class="modal-card">
        <div class="modal-body">
          ${content}
        </div>
      </div>
    </div>
  `;
}

function renderRoleOptions(selected) {
  const roles = ["admin", "buyer", "supplier"];
  return roles.map(r =>
    `<option value="${r}" ${r === selected ? "selected" : ""}>
      ${r.toUpperCase()}
    </option>`
  ).join("");
}

function renderStatusOptions(selected) {
  const statuses = ["all", "active", "inactive"];
  return statuses.map(s =>
    `<option value="${s}" ${s === selected ? "selected" : ""}>
      ${s.toUpperCase()}
    </option>`
  ).join("");
}

function escapeHTML(v) {
  return String(v ?? "-")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString("en-IN") : "-";
}

function renderFilterChips(options, selected, action) {
  return options.map(opt => `
    <button 
      class="filter-chip ${opt === selected ? "active" : ""}"
      data-action="${action}"
      data-value="${opt}">
      ${opt.toUpperCase()}
    </button>
  `).join("");
}

export default UsersRender;