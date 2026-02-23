/* =========================================================
   AXO NETWORKS — ADMIN RENDER LAYER
   Pure UI Rendering (No API, No Auth)
   ES Module Version
========================================================= */

export const AdminRender = {

  /* ===============================
     DASHBOARD STATS
  =============================== */
  renderStats(data) {
    if (!data) return;

    setText("totalSubmissions", data.total_users || 0);
    setText("pendingCount", data.rfqs?.open_rfqs || 0);
    setText("approvedCount", data.purchase_orders?.completed_pos || 0);
    setText("rejectedCount", data.disputes?.rejected_disputes || 0);
  },

  /* ===============================
     NETWORK REQUESTS TABLE
  =============================== */
  renderRequestsTable(data) {

    const tbody = document.getElementById("tableBody");
    const emptyState = document.getElementById("emptyState");
    const table = document.getElementById("dataTable");

    if (!tbody) return;

    tbody.innerHTML = "";

    if (!data || !data.length) {
      if (table) table.style.display = "none";
      if (emptyState) emptyState.style.display = "flex";
      return;
    }

    if (table) table.style.display = "table";
    if (emptyState) emptyState.style.display = "none";

    data.forEach(item => {

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${item.id}</td>
        <td>${item.company_name || "-"}</td>
        <td>${item.contact_name || "-"}</td>
        <td>${item.email || "-"}</td>
        <td>${item.phone || "-"}</td>
        <td>${item.primary_product || "-"}</td>
        <td>
          <span class="status-badge ${item.status?.toLowerCase()}">
            ${item.status}
          </span>
        </td>
        <td>${formatDate(item.created_at)}</td>
        <td>
          <button class="btn btn-primary btn-sm view-btn"
            data-id="${item.id}">
            View
          </button>
        </td>
      `;

      tbody.appendChild(row);
    });
  },

  /* ===============================
     USERS TABLE
  =============================== */
  renderUsersTable(data) {

    const tbody = document.getElementById("usersTableBody");
    const emptyState = document.getElementById("usersEmptyState");
    const table = document.getElementById("usersTable");

    if (!tbody) return;

    tbody.innerHTML = "";

    if (!data || !data.length) {
      if (table) table.style.display = "none";
      if (emptyState) emptyState.style.display = "flex";
      return;
    }

    if (table) table.style.display = "table";
    if (emptyState) emptyState.style.display = "none";

    data.forEach(user => {

      const isActive = user.status === "active";

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${user.id}</td>
        <td>${user.username || "-"}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td>${isActive ? "ACTIVE" : "INACTIVE"}</td>
        <td>${formatDate(user.created_at)}</td>
        <td>
          <button class="btn btn-secondary btn-sm reset-btn"
            data-id="${user.id}">
            Reset
          </button>

          <button class="btn btn-sm ${isActive ? "btn-warning" : "btn-success"} toggle-btn"
            data-id="${user.id}"
            data-status="${user.status}">
            ${isActive ? "Deactivate" : "Activate"}
          </button>
        </td>
      `;

      tbody.appendChild(row);
    });
  },

  /* ===============================
     MODAL RENDER
  =============================== */
  renderViewModal(item) {

    const modal = document.getElementById("viewModal");
    const body = document.getElementById("modalBody");

    if (!modal || !body) return;

    body.innerHTML = `
      <div>
        <h3>Request Details</h3>
        <p><strong>Company:</strong> ${item.company_name}</p>
        <p><strong>Email:</strong> ${item.email}</p>
        <p><strong>Status:</strong> ${item.status}</p>
        <p><strong>Submitted:</strong> ${formatDate(item.created_at)}</p>
      </div>
    `;

    modal.style.display = "flex";
  }

};

/* ===============================
   UTILITIES
=============================== */

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString();
}

export default AdminRender;