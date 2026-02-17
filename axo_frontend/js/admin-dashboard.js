/* =========================================================
   AXO NETWORKS — ADMIN DASHBOARD
   Production Ready • Enterprise Grade • Secure
   Fully Fixed Version with Responsive Improvements
========================================================= */

const API_BASE_URL = "/api";
const AUTO_REFRESH_INTERVAL = 60000;

let allRequests = [];
let allUsers = [];
let currentViewingItem = null;
let currentView = "requests";
let autoRefreshTimer = null;

/* =========================================================
   INIT
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  protectRoute();
  injectAdminInfo();
  bindEvents();
  loadDashboard();
  startAutoRefresh();
});

/* =========================================================
   ROUTE PROTECTION
========================================================= */
function protectRoute() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token || user.role?.toLowerCase() !== "admin") {
    logout();
  }
}

/* =========================================================
   API WRAPPER
========================================================= */
async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });

    if (response.status === 401) {
      logout();
      return null;
    }

    return await response.json();
  } catch (err) {
    showMessage("Server connection failed", "error");
    return null;
  }
}

/* =========================================================
   DASHBOARD LOAD
========================================================= */
async function loadDashboard() {
  if (currentView !== "requests") return;

  toggleRefreshLoading(true);

  await Promise.all([
    loadStats(),
    loadNetworkRequests()
  ]);

  updateLastUpdatedTime();
  toggleRefreshLoading(false);
}

/* =========================================================
   LOAD STATS
========================================================= */
async function loadStats() {
  const result = await apiFetch(`${API_BASE_URL}/admin/stats`);
  if (!result?.success) return;

  const d = result.data || {};

  setText("totalSubmissions", d.total_requests || 0);
  setText("pendingCount", d.total_pending || 0);
  setText("approvedCount", d.total_approved || 0);
  setText("rejectedCount", d.total_rejected || 0);
}

/* =========================================================
   LOAD REQUESTS
========================================================= */
async function loadNetworkRequests() {
  const result = await apiFetch(
    `${API_BASE_URL}/admin/network-access-requests`
  );

  if (!result?.success) return;

  allRequests = result.data || [];
  handleSearch();
}

/* =========================================================
   LOAD USERS
========================================================= */
async function loadUsers() {
  const result = await apiFetch(`${API_BASE_URL}/admin/users`);
  if (!result?.success) return;

  allUsers = result.data || [];
  renderUsers(allUsers);
}

/* =========================================================
   TOGGLE VIEW
========================================================= */
async function toggleUsersView() {

  const usersSection = document.getElementById("usersSection");
  const requestsSection = document.getElementById("requestsSection");
  const statsSection = document.getElementById("statsSection");

  const toggleBtn = document.getElementById("usersViewBtn");
  const toggleText = document.getElementById("toggleText");
  const toggleIcon = document.getElementById("toggleIcon");

  if (currentView === "requests") {

    // Switch to Users
    requestsSection.style.display = "none";
    statsSection.style.display = "none";
    usersSection.style.display = "block";

    toggleText.textContent = "Network Access";
    toggleIcon.className = "fas fa-layer-group";

    // Change button color
    toggleBtn.classList.remove("btn-secondary");
    toggleBtn.classList.add("btn-primary");

    currentView = "users";
    await loadUsers();

  } else {

    // Switch back to Network Access
    usersSection.style.display = "none";
    requestsSection.style.display = "block";
    statsSection.style.display = "grid";

    toggleText.textContent = "Users";
    toggleIcon.className = "fas fa-users";

    // Revert button color
    toggleBtn.classList.remove("btn-primary");
    toggleBtn.classList.add("btn-secondary");

    currentView = "requests";
    loadDashboard();
  }
}

/* =========================================================
   RENDER REQUEST TABLE - WITH DATA LABELS FOR MOBILE
========================================================= */
function renderTable(data) {
  const tbody = document.getElementById("tableBody");
  const emptyState = document.getElementById("emptyState");
  const table = document.getElementById("dataTable");

  tbody.innerHTML = "";

  if (!data.length) {
    table.style.display = "none";
    emptyState.style.display = "flex";
    return;
  }

  table.style.display = "table";
  emptyState.style.display = "none";

  data.forEach(item => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td data-label="ID">${item.id}</td>
      <td data-label="Company">${item.company_name || "-"}</td>
      <td data-label="Contact">${item.contact_name || "-"}</td>
      <td data-label="Email">${item.email || "-"}</td>
      <td data-label="Phone">${item.phone || "-"}</td>
      <td data-label="Product">${item.primary_product || "-"}</td>
      <td data-label="Status">
        <span class="status-badge ${item.status?.toLowerCase()}">
          <i class="fas ${getStatusIcon(item.status)}"></i>
          ${item.status}
        </span>
      </td>
      <td data-label="Submitted">${formatDate(item.created_at)}</td>
      <td data-label="Actions">
        <button class="btn btn-primary btn-sm view-btn" data-id="${item.id}" title="View Details">
          <i class="fas fa-eye"></i> View
        </button>
      </td>
    `;

    tbody.appendChild(row);
  });

  bindViewButtons();
}

/* =========================================================
   RENDER USERS TABLE - WITH DATA LABELS FOR MOBILE
========================================================= */
function renderUsers(data) {
  const tbody = document.getElementById("usersTableBody");
  const emptyState = document.getElementById("usersEmptyState");
  const table = document.getElementById("usersTable");

  tbody.innerHTML = "";

  if (!data.length) {
    table.style.display = "none";
    emptyState.style.display = "flex";
    return;
  }

  table.style.display = "table";
  emptyState.style.display = "none";

  data.forEach(user => {
    const isActive = user.status === "active";

    const row = document.createElement("tr");

    row.innerHTML = `
      <td data-label="ID">${user.id}</td>
      <td data-label="Name">${user.username || "-"}</td>
      <td data-label="Email">${user.email}</td>
      <td data-label="Role">
        <span class="role-badge role-${user.role}">
          <i class="fas ${getRoleIcon(user.role)}"></i>
          ${user.role}
        </span>
      </td>
      <td data-label="Status">
        <span class="status-badge ${isActive ? "approved" : "rejected"}">
          <i class="fas ${isActive ? "fa-check-circle" : "fa-times-circle"}"></i>
          ${isActive ? "ACTIVE" : "INACTIVE"}
        </span>
      </td>
      <td data-label="Created">${formatDate(user.created_at)}</td>
      <td data-label="Actions">
        <button class="btn btn-sm ${isActive ? "btn-warning" : "btn-success"} toggle-btn"
          data-id="${user.id}"
          data-status="${user.status}">
          <i class="fas ${isActive ? "fa-ban" : "fa-check-circle"}"></i>
          ${isActive ? "Deactivate" : "Activate"}
        </button>
      </td>
    `;

    tbody.appendChild(row);
  });

  bindUserActions();
}

/* =========================================================
   SEARCH + FILTER (REQUESTS)
========================================================= */
function handleSearch() {
  if (currentView !== "requests") return;

  const search = document.getElementById("searchInput")?.value.toLowerCase() || "";
  const status = document.getElementById("statusFilter")?.value || "ALL";
  const startDate = document.getElementById("startDate")?.value;
  const endDate = document.getElementById("endDate")?.value;

  let filtered = [...allRequests];

  if (search) {
    filtered = filtered.filter(r =>
      r.company_name?.toLowerCase().includes(search) ||
      r.email?.toLowerCase().includes(search) ||
      r.contact_name?.toLowerCase().includes(search)
    );
  }

  if (status !== "ALL") {
    filtered = filtered.filter(r =>
      r.status?.toUpperCase() === status
    );
  }

  if (startDate) {
    filtered = filtered.filter(r =>
      new Date(r.created_at) >= new Date(startDate)
    );
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filtered = filtered.filter(r =>
      new Date(r.created_at) <= end
    );
  }

  renderTable(filtered);
}

/* =========================================================
   SEARCH USERS
========================================================= */
function handleUserSearch() {
  if (currentView !== "users") return;

  const search = document.getElementById("userSearchInput")?.value.toLowerCase() || "";
  const roleFilter = document.getElementById("userRoleFilter")?.value || "ALL";

  let filtered = [...allUsers];

  if (search) {
    filtered = filtered.filter(u =>
      u.name?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search)
    );
  }

  if (roleFilter !== "ALL") {
    filtered = filtered.filter(u =>
      u.role?.toLowerCase() === roleFilter.toLowerCase()
    );
  }

  renderUsers(filtered);
}

/* =========================================================
   VIEW REQUEST DETAILS - IMPROVED MODAL LAYOUT
========================================================= */
function bindViewButtons() {
  document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      viewDetails(id);
    });
  });
}

function viewDetails(id) {
  const item = allRequests.find(r => r.id === id);
  if (!item) return;

  currentViewingItem = item;

  const modal = document.getElementById("viewModal");
  const body = document.getElementById("modalBody");

  const isPending = item.status?.toLowerCase() === "pending";

  // Build modal HTML with organized sections
  let html = '<div class="modal-grid">';

  // Basic Information Section
  html += `
    <div class="modal-grid-item full-width">
      <h4 class="modal-section-title">
        <i class="fas fa-info-circle"></i> Basic Information
      </h4>
    </div>
    <div class="modal-grid-item">
      <span class="label">ID</span>
      <span class="value">${item.id}</span>
    </div>
    <div class="modal-grid-item">
      <span class="label">Status</span>
      <span class="value"><span class="status-badge ${item.status?.toLowerCase()}"><i class="fas ${getStatusIcon(item.status)}"></i> ${item.status}</span></span>
    </div>
    <div class="modal-grid-item">
      <span class="label">Company Name</span>
      <span class="value">${item.company_name || "-"}</span>
    </div>
    <div class="modal-grid-item">
      <span class="label">Contact Name</span>
      <span class="value">${item.contact_name || "-"}</span>
    </div>
    <div class="modal-grid-item">
      <span class="label">Email</span>
      <span class="value">${item.email || "-"}</span>
    </div>
    <div class="modal-grid-item">
      <span class="label">Phone</span>
      <span class="value">${item.phone || "-"}</span>
    </div>
    <div class="modal-grid-item">
      <span class="label">Website</span>
      <span class="value">${item.website || "-"}</span>
    </div>

    <!-- Address Section -->
    <div class="modal-grid-item full-width">
      <h4 class="modal-section-title">
        <i class="fas fa-map-marker-alt"></i> Address & Location
      </h4>
    </div>
    <div class="modal-grid-item full-width">
      <span class="label">Registered Address</span>
      <span class="value">${item.registered_address || "-"}</span>
    </div>
    <div class="modal-grid-item">
      <span class="label">City / State</span>
      <span class="value">${item.city_state || "-"}</span>
    </div>

    <!-- Business Details -->
    <div class="modal-grid-item full-width">
      <h4 class="modal-section-title">
        <i class="fas fa-briefcase"></i> Business Details
      </h4>
    </div>
    <div class="modal-grid-item">
      <span class="label">Requested Role</span>
      <span class="value">${item.role_requested || "-"}</span>
    </div>
    <div class="modal-grid-item">
      <span class="label">Primary Product</span>
      <span class="value">${item.primary_product || "-"}</span>
    </div>
    <div class="modal-grid-item">
      <span class="label">Key Components</span>
      <span class="value">${item.key_components || "-"}</span>
    </div>
    <div class="modal-grid-item">
      <span class="label">Manufacturing Locations</span>
      <span class="value">${item.manufacturing_locations || "-"}</span>
    </div>
    <div class="modal-grid-item">
      <span class="label">Monthly Capacity</span>
      <span class="value">${item.monthly_capacity || "-"}</span>
    </div>
    <div class="modal-grid-item">
      <span class="label">Certifications</span>
      <span class="value">${item.certifications || "-"}</span>
    </div>

    <!-- Additional Information -->
    <div class="modal-grid-item full-width">
      <h4 class="modal-section-title">
        <i class="fas fa-clipboard-list"></i> Additional Information
      </h4>
    </div>
    <div class="modal-grid-item">
      <span class="label">Role in EV</span>
      <span class="value">${item.role_in_ev || "-"}</span>
    </div>
    <div class="modal-grid-item full-width">
      <span class="label">Why Join AXO</span>
      <span class="value">${item.why_join_axo || "-"}</span>
    </div>
    <div class="modal-grid-item">
      <span class="label">IP Address</span>
      <span class="value">${item.ip_address || "-"}</span>
    </div>
    <div class="modal-grid-item full-width">
      <span class="label">User Agent</span>
      <span class="value">${item.user_agent || "-"}</span>
    </div>
    <div class="modal-grid-item">
      <span class="label">Submitted At</span>
      <span class="value">${formatDate(item.created_at)}</span>
    </div>
    <div class="modal-grid-item full-width">
      <span class="label">Verification Notes</span>
      <span class="value">${item.verification_notes || "-"}</span>
    </div>
  `;

  // Add What You Do section if exists
  if (item.what_you_do) {
    const whatYouDoHtml = renderWhatYouDo(item.what_you_do);
    if (whatYouDoHtml) {
      html += `<div class="modal-grid-item full-width">${whatYouDoHtml}</div>`;
    }
  }

  html += '</div>';

  // Add action buttons for pending items
  if (isPending) {
    html += `
      <div class="modal-action-buttons">
        <button class="btn btn-success" id="approveBtn">
          <i class="fas fa-check-circle"></i> Approve Request
        </button>
        <button class="btn btn-danger" id="rejectBtn">
          <i class="fas fa-times-circle"></i> Reject Request
        </button>
      </div>
    `;
  }

  body.innerHTML = html;
  modal.style.display = "flex";

  if (isPending) {
    document.getElementById("approveBtn")?.addEventListener("click", () => {
      handleStatusChange("APPROVED");
    });

    document.getElementById("rejectBtn")?.addEventListener("click", () => {
      handleStatusChange("REJECTED");
    });
  }
}

/* =========================================================
   UPDATE STATUS
========================================================= */
async function handleStatusChange(status) {
  closeViewModal();

  // Use a custom modal instead of prompt for better UX
  const comment = await showCommentModal(status);
  if (!comment) return;

  const url = status === "APPROVED"
    ? `${API_BASE_URL}/admin/network-access-requests/${currentViewingItem.id}/approve`
    : `${API_BASE_URL}/admin/network-access-requests/${currentViewingItem.id}/reject`;

  const result = await apiFetch(url, {
    method: "POST",
    body: JSON.stringify({ comment })
  });

  if (result?.success) {
    showMessage(`Request ${status.toLowerCase()} successfully`, "success");
    loadDashboard();
  } else {
    showMessage(result?.message || "Failed to update status", "error");
  }
}

/* =========================================================
   COMMENT MODAL (replaces prompt)
========================================================= */
function showCommentModal(status) {
  return new Promise((resolve) => {
    const modal = document.getElementById("statusModal");
    const title = document.getElementById("statusTitle");
    const comment = document.getElementById("statusComment");
    const confirmBtn = document.getElementById("confirmStatusBtn");
    const cancelBtn = document.getElementById("cancelStatusBtn");

    title.textContent = `${status} Request - Enter Verification Comment`;
    comment.value = "";
    modal.style.display = "flex";

    const handleConfirm = () => {
      if (!comment.value.trim()) {
        alert("Comment is required");
        return;
      }
      cleanup();
      resolve(comment.value.trim());
    };

    const handleCancel = () => {
      cleanup();
      resolve(null);
    };

    const cleanup = () => {
      modal.style.display = "none";
      confirmBtn.removeEventListener("click", handleConfirm);
      cancelBtn.removeEventListener("click", handleCancel);
    };

    confirmBtn.addEventListener("click", handleConfirm);
    cancelBtn.addEventListener("click", handleCancel);
  });
}

/* =========================================================
   USER ACTIONS
========================================================= */
function bindUserActions() {
  document.querySelectorAll(".toggle-btn").forEach(btn => {
    btn.onclick = async () => {

      const id = btn.dataset.id;
      const currentStatus = btn.dataset.status;
      const newStatus = currentStatus === "active" ? "inactive" : "active";

      const confirmed = await showUserStatusConfirmModal(newStatus);
      if (!confirmed) return;

      const result = await apiFetch(
        `${API_BASE_URL}/admin/users/${id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: newStatus })
        }
      );

      if (result?.success) {
        showMessage(`User ${newStatus} successfully`, "success");
        loadUsers();
      } else {
        showMessage(result?.message || "Update failed", "error");
      }
    };
  });
}

function showUserStatusConfirmModal(status) {
  return new Promise((resolve) => {

    const message = `
      <div style="padding:20px;">
        <h3 style="margin-bottom:15px;">
          ${status === "active" ? "Activate User" : "Deactivate User"}
        </h3>
        <p>Are you sure you want to ${status} this user?</p>
        <div style="margin-top:20px; display:flex; gap:10px; justify-content:flex-end;">
          <button id="cancelUserAction" class="btn btn-secondary">Cancel</button>
          <button id="confirmUserAction" class="btn btn-primary">Confirm</button>
        </div>
      </div>
    `;

    const container = document.createElement("div");
    container.className = "modal";
    container.style.display = "flex";
    container.innerHTML = `<div class="modal-content">${message}</div>`;

    document.body.appendChild(container);

    document.getElementById("confirmUserAction").onclick = () => {
      document.body.removeChild(container);
      resolve(true);
    };

    document.getElementById("cancelUserAction").onclick = () => {
      document.body.removeChild(container);
      resolve(false);
    };
  });
}

/* =========================================================
   EXPORT
========================================================= */
function exportCSV() {
  if (currentView !== "requests" || !allRequests.length) {
    showMessage("No data to export", "error");
    return;
  }

  const headers = [
    "ID","Company","Contact","Email",
    "Phone","Product","Status","Submitted"
  ];

  const rows = allRequests.map(r => [
    r.id,
    r.company_name,
    r.contact_name,
    r.email,
    r.phone,
    r.primary_product,
    r.status,
    formatDate(r.created_at)
  ]);

  const csv = [headers, ...rows]
    .map(r => r.map(cell => `"${cell}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.href = url;
  link.setAttribute("download", `network_requests_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  showMessage("Export completed successfully", "success");
}

/* =========================================================
   REFRESH + AUTO REFRESH
========================================================= */
function toggleRefreshLoading(isLoading) {
  const btn = document.getElementById("refreshBtn");
  if (!btn) return;
  
  if (isLoading) {
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;
  } else {
    btn.innerHTML = '<i class="fas fa-rotate"></i>';
    btn.disabled = false;
  }
}

function updateLastUpdatedTime() {
  showMessage(
    `<i class="fas fa-clock"></i> Last updated at ${new Date().toLocaleTimeString()}`,
    "success"
  );
}

function startAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(() => {
    if (currentView === "requests") {
      loadDashboard();
    }
  }, AUTO_REFRESH_INTERVAL);
}

/* =========================================================
   EVENTS
========================================================= */
function bindEvents() {
  // Logout
  document.getElementById("logoutBtn")?.addEventListener("click", logout);

  // Refresh
  document.getElementById("refreshBtn")?.addEventListener("click", () => {
    if (currentView === "requests") {
      loadDashboard();
    } else {
      loadUsers();
    }
  });

  // Export
  document.getElementById("exportBtn")?.addEventListener("click", exportCSV);

  // Toggle Users View
  document.getElementById("usersViewBtn")?.addEventListener("click", toggleUsersView);

  // Request Filters
  document.getElementById("searchInput")?.addEventListener("input", handleSearch);
  document.getElementById("statusFilter")?.addEventListener("change", handleSearch);
  document.getElementById("startDate")?.addEventListener("change", handleSearch);
  document.getElementById("endDate")?.addEventListener("change", handleSearch);

  // User Filters
  document.getElementById("userSearchInput")?.addEventListener("input", handleUserSearch);
  document.getElementById("userRoleFilter")?.addEventListener("change", handleUserSearch);

  // Modal Close
  document.getElementById("modalCloseBtn")?.addEventListener("click", closeViewModal);
  document.getElementById("viewModal")?.addEventListener("click", (e) => {
    if (e.target.id === "viewModal") closeViewModal();
  });

  // Status Modal Close
  document.getElementById("cancelStatusBtn")?.addEventListener("click", () => {
    document.getElementById("statusModal").style.display = "none";
  });
}

/* =========================================================
   MODAL HELPERS
========================================================= */
function closeViewModal() {
  const modal = document.getElementById("viewModal");
  if (modal) modal.style.display = "none";
}

/* =========================================================
   HELPER FUNCTIONS
========================================================= */
function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString();
  } catch {
    return dateStr;
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function showMessage(message, type = "success") {
  const box = document.getElementById("topMessage");
  if (!box) return;

  box.innerHTML = message;
  box.className = `top-message ${type}`;
  box.style.display = "block";

  setTimeout(() => {
    box.style.display = "none";
  }, 4000);
}

function injectAdminInfo() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  setText("adminName", user.name || "Admin");
  setText("adminRole", user.role || "Administrator");
}

function logout() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  localStorage.clear();
  window.location.href = "/login";
}

/* =========================================================
   ICON HELPERS
========================================================= */
function getStatusIcon(status) {
  switch (status?.toLowerCase()) {
    case 'approved': return 'fa-check-circle';
    case 'pending': return 'fa-clock';
    case 'rejected': return 'fa-times-circle';
    default: return 'fa-circle';
  }
}

function getRoleIcon(role) {
  switch (role?.toLowerCase()) {
    case 'admin': return 'fa-shield-alt';
    case 'buyer': return 'fa-shopping-cart';
    case 'supplier': return 'fa-truck';
    case 'oem': return 'fa-industry';
    default: return 'fa-user';
  }
}

/* =========================================================
   RENDER WHAT YOU DO
========================================================= */
function renderWhatYouDo(data) {
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
      <span class="value">${content}</span>
    </div>
  `;
}

/* =========================================================
   CLEANUP ON PAGE UNLOAD
========================================================= */
window.addEventListener("beforeunload", () => {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
});