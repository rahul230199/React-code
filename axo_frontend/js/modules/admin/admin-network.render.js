/* =========================================================
   AXO NETWORKS — ADMIN NETWORK RENDER (ENTERPRISE SAFE)
   Pure UI Rendering Layer — Secure + Pagination Ready
   ES Module Version
========================================================= */

export const AdminNetworkRender = {

  /* =====================================================
     RENDER REQUEST TABLE
  ====================================================== */
  renderRequestsTable(data) {

    const tbody = document.getElementById("tableBody");
    const emptyState = document.getElementById("emptyState");
    const table = document.getElementById("dataTable");

    if (!tbody || !table || !emptyState) return;

    tbody.innerHTML = "";

    if (!data || data.length === 0) {
      table.style.display = "none";
      emptyState.style.display = "flex";
      return;
    }

    table.style.display = "table";
    emptyState.style.display = "none";

    data.forEach(item => {

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${escapeHTML(item.id)}</td>
        <td>${escapeHTML(item.company_name)}</td>
        <td>${escapeHTML(item.contact_name)}</td>
        <td>${escapeHTML(item.email)}</td>
        <td>${escapeHTML(item.phone)}</td>
        <td>${escapeHTML(item.primary_product)}</td>
        <td>${this.renderStatusBadge(item.status)}</td>
        <td>${formatDate(item.created_at)}</td>
        <td>
          <button class="btn btn-primary btn-sm view-btn"
            data-id="${escapeHTML(item.id)}">
            View
          </button>
        </td>
      `;

      tbody.appendChild(row);
    });

  },

  /* =====================================================
     RENDER STATUS BADGE
  ====================================================== */
  renderStatusBadge(status) {

    if (!status) return "-";

    const normalized = String(status).toLowerCase();

    return `
      <span class="status-badge ${normalized}">
        ${escapeHTML(status.toUpperCase())}
      </span>
    `;
  },

  /* =====================================================
     RENDER FULL DETAILS MODAL
  ====================================================== */
  renderRequestDetailsModal(item) {

    const modal = document.getElementById("viewModal");
    const body  = document.getElementById("modalBody");

    if (!modal || !body) return;

    const isPending =
      item.status?.toLowerCase() === "pending";

    body.innerHTML = `

      <div class="modal-section">
        <h3 class="modal-section-title">Basic Information</h3>
        <div class="modal-grid">
          ${gridItem("Company", item.company_name)}
          ${gridItem("Email", item.email)}
          ${gridItem("Contact", item.contact_name)}
          ${gridItem("Phone", item.phone)}
          ${gridItem("Website", item.website, true)}
        </div>
      </div>

      <div class="modal-section">
        <h3 class="modal-section-title">Address</h3>
        <div class="modal-grid">
          ${gridItem("Registered Address", item.registered_address, true)}
          ${gridItem("City / State", item.city_state)}
        </div>
      </div>

      <div class="modal-section">
        <h3 class="modal-section-title">Business Details</h3>
        <div class="modal-grid">
          ${gridItem("Primary Product", item.primary_product)}
          ${gridItem("Key Components", item.key_components)}
          ${gridItem("Manufacturing Locations", item.manufacturing_locations)}
          ${gridItem("Monthly Capacity", item.monthly_capacity)}
          ${gridItem("Certifications", item.certifications)}
        </div>
      </div>

      <div class="modal-section">
        <h3 class="modal-section-title">Application</h3>
        <div class="modal-grid">
          ${gridItem("Role in EV", item.role_in_ev)}
          ${gridItem("Why Join AXO", item.why_join_axo, true)}
          ${this.renderWhatYouDo(item.what_you_do)}
          ${gridItem("Submitted At", formatDate(item.created_at))}
          ${gridItem("IP Address", item.ip_address)}
          ${gridItem("User Agent", item.user_agent, true)}

          ${gridItem(
            "Status",
            `<span class="status-badge ${escapeHTML(item.status?.toLowerCase())}">
               ${escapeHTML(item.status?.toUpperCase())}
             </span>`,
            false,
            true
          )}
        </div>
      </div>

      ${isPending ? `
        <div class="modal-action-buttons">
          <button class="btn btn-success approve-btn"
            data-id="${escapeHTML(item.id)}">
            Approve
          </button>

          <button class="btn btn-danger reject-btn"
            data-id="${escapeHTML(item.id)}">
            Reject
          </button>
        </div>
      ` : ""}

    `;

    modal.style.display = "flex";
  },

  /* =====================================================
     RENDER WHAT YOU DO
  ====================================================== */
  renderWhatYouDo(data) {

    if (!data) return "";

    let content = "";

    if (typeof data === "string") {
      content = data;
    } else if (typeof data === "object") {
      const active = Object.entries(data)
        .filter(([_, value]) => value === true)
        .map(([key]) => key.replace(/_/g, " "))
        .join(", ");

      content = active || "-";
    }

    return `
      <div class="modal-grid-item full-width">
        <span class="label">What You Do</span>
        <span class="value">${escapeHTML(content)}</span>
      </div>
    `;
  }

};

/* =====================================================
   GRID HELPER
===================================================== */
function gridItem(label, value, fullWidth = false, allowHTML = false) {

  const safeValue = allowHTML
    ? value
    : escapeHTML(value);

  return `
    <div class="modal-grid-item ${fullWidth ? "full-width" : ""}">
      <span class="label">${escapeHTML(label)}</span>
      <span class="value">${safeValue ?? "-"}</span>
    </div>
  `;
}

/* =====================================================
   SAFE HTML ESCAPER (XSS PROTECTION)
===================================================== */
function escapeHTML(value) {
  if (value === null || value === undefined) return "-";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =====================================================
   FORMAT DATE
===================================================== */
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString();
}

export default AdminNetworkRender;