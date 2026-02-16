/* =========================================================
   AXO NETWORKS — ADMIN DASHBOARD (ENHANCED WITH ACTIONS)
========================================================= */

const API_BASE_URL = "/api";

let allRequests = [];
let currentViewingItem = null;

/* =========================================================
   INIT
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  protectRoute();
  injectAdminInfo();
  bindEvents();
  loadDashboard();
});

/* =========================================================
   ROUTE PROTECTION
========================================================= */
function protectRoute() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token || !user || user.role?.toLowerCase() !== "admin") {
    logout();
  }
}

/* =========================================================
   DASHBOARD LOAD
========================================================= */
async function loadDashboard() {
  await Promise.all([
    loadStats(),
    loadNetworkRequests()
  ]);
}

/* =========================================================
   SAFE API FETCH
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
    console.error("API Error:", err);
    return null;
  }
}

/* =========================================================
   LOAD STATS
========================================================= */
async function loadStats() {
  const result = await apiFetch(`${API_BASE_URL}/admin/stats`);
  if (!result?.success) return;

  const data = result.data || {};

  const total =
    Number(data.total_buyers || 0) +
    Number(data.total_suppliers || 0) +
    Number(data.total_oems || 0);

  setText("totalSubmissions", total);
  setText("pendingCount", data.total_buyers || 0);
  setText("approvedCount", data.total_suppliers || 0);
  setText("rejectedCount", data.total_oems || 0);
}

/* =========================================================
   LOAD NETWORK REQUESTS
========================================================= */
async function loadNetworkRequests() {
  const result = await apiFetch(
    `${API_BASE_URL}/admin/network-access-requests`
  );

  if (!result?.success) return;

  allRequests = result.data || [];
  renderTable(allRequests);
}

/* =========================================================
   RENDER TABLE WITH MOBILE DATA LABELS
========================================================= */
function renderTable(data) {
  const tbody = document.getElementById("tableBody");
  const emptyState = document.getElementById("emptyState");
  const table = document.getElementById("dataTable");

  if (!tbody) return;

  tbody.innerHTML = "";

  if (!data.length) {
    table.style.display = "none";
    emptyState.style.display = "flex";
    return;
  }

  table.style.display = "table";
  emptyState.style.display = "none";

  data.forEach((item) => {
    const row = document.createElement("tr");

    const statusClass = (item.status || "").toLowerCase();

    row.innerHTML = `
      <td data-label="ID">${item.id}</td>
      <td data-label="Company">${item.company_name || "-"}</td>
      <td data-label="Contact">${item.contact_name || "-"}</td>
      <td data-label="Email">${item.email || "-"}</td>
      <td data-label="Phone">${item.phone || "-"}</td>
      <td data-label="Product">${item.primary_product || "-"}</td>
      <td data-label="Status">
        <span class="status-badge ${statusClass}">
          ${item.status}
        </span>
      </td>
      <td data-label="Submitted">${formatDate(item.created_at)}</td>
      <td data-label="Actions">
        <button class="btn btn-primary btn-sm view-btn"
          data-id="${item.id}">
          <i class="fas fa-eye"></i>
          <span>View</span>
        </button>
      </td>
    `;

    tbody.appendChild(row);
  });

  bindViewButtons();
}

/* =========================================================
   VIEW MODAL WITH APPROVE/REJECT BUTTONS
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

  body.innerHTML = `
    <h3 style="margin-bottom:10px;">${item.company_name}</h3>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <p><strong>ID:</strong> ${item.id}</p>
      <p><strong>Status:</strong> 
        <span class="status-badge ${item.status?.toLowerCase()}">
          ${item.status}
        </span>
      </p>

      <p><strong>Contact Name:</strong> ${item.contact_name || "-"}</p>
      <p><strong>Email:</strong> ${item.email || "-"}</p>
      <p><strong>Phone:</strong> ${item.phone || "-"}</p>
      <p><strong>Website:</strong> ${item.website || "-"}</p>
      <p><strong>Registered Address:</strong> ${item.registered_address || "-"}</p>
      <p><strong>City / State:</strong> ${item.city_state || "-"}</p>

      <p><strong>Requested Role:</strong> ${item.role_requested || "-"}</p>
      <p><strong>Primary Product:</strong> ${item.primary_product || "-"}</p>
      <p><strong>Key Components:</strong> ${item.key_components || "-"}</p>
      <p><strong>Manufacturing Locations:</strong> ${item.manufacturing_locations || "-"}</p>
      <p><strong>Monthly Capacity:</strong> ${item.monthly_capacity || "-"}</p>
      <p><strong>Certifications:</strong> ${item.certifications || "-"}</p>

      <p><strong>Role in EV:</strong> ${item.role_in_ev || "-"}</p>
      <p><strong>Why Join AXO:</strong> ${item.why_join_axo || "-"}</p>

      <p><strong>IP Address:</strong> ${item.ip_address || "-"}</p>
      <p><strong>User Agent:</strong> ${item.user_agent || "-"}</p>

      <p><strong>Submitted At:</strong> ${formatDate(item.created_at)}</p>
      <p><strong>Verification Notes:</strong> ${item.verification_notes || "-"}</p>
    </div>

    ${renderWhatYouDo(item.what_you_do)}

    ${isPending ? `
      <div class="modal-action-buttons" style="margin-top:20px;">
        <button class="btn btn-success" id="approveBtn">
          <i class="fas fa-check-circle"></i>
          Approve Request
        </button>
        <button class="btn btn-danger" id="rejectBtn">
          <i class="fas fa-times-circle"></i>
          Reject Request
        </button>
      </div>
    ` : ''}
  `;

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
   HANDLE STATUS CHANGE
========================================================= */
function handleStatusChange(newStatus) {
  // Close view modal
  document.getElementById("viewModal").style.display = "none";
  
  // Open status confirmation modal
  const statusModal = document.getElementById("statusModal");
  const statusTitle = document.getElementById("statusTitle");
  const statusComment = document.getElementById("statusComment");
  
  statusTitle.textContent = newStatus === "APPROVED" 
    ? "Approve Request" 
    : "Reject Request";
  
  statusComment.value = "";
  statusModal.style.display = "flex";
  
  // Bind confirmation button
  const confirmBtn = document.getElementById("confirmStatusBtn");
  const cancelBtn = document.getElementById("cancelStatusBtn");
  
  confirmBtn.onclick = async () => {
    const comment = statusComment.value.trim();
    if (!comment) {
      alert("Please enter a verification comment");
      return;
    }
    
    await updateRequestStatus(currentViewingItem.id, newStatus, comment);
    statusModal.style.display = "none";
  };
  
  cancelBtn.onclick = () => {
    statusModal.style.display = "none";
  };
}

/* =========================================================
   UPDATE REQUEST STATUS VIA API
========================================================= */
async function updateRequestStatus(id, status, comment) {
  const result = await apiFetch(
    `${API_BASE_URL}/admin/network-access-requests/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status, comment })
    }
  );

  if (result?.success) {
    alert(`Request ${status.toLowerCase()} successfully!`);
    loadDashboard(); // Reload data
  } else {
    alert("Failed to update request status");
  }
}

/* =========================================================
   CLOSE MODALS
========================================================= */
document.getElementById("modalCloseBtn")
  ?.addEventListener("click", () => {
    document.getElementById("viewModal").style.display = "none";
  });

// Close modal on background click
document.getElementById("viewModal")
  ?.addEventListener("click", (e) => {
    if (e.target.id === "viewModal") {
      document.getElementById("viewModal").style.display = "none";
    }
  });

document.getElementById("statusModal")
  ?.addEventListener("click", (e) => {
    if (e.target.id === "statusModal") {
      document.getElementById("statusModal").style.display = "none";
    }
  });

/* =========================================================
   EVENTS
========================================================= */
function bindEvents() {

  document.getElementById("logoutBtn")
    ?.addEventListener("click", logout);

  document.getElementById("refreshBtn")
    ?.addEventListener("click", loadDashboard);

  document.getElementById("searchInput")
    ?.addEventListener("input", handleSearch);

  document.getElementById("statusFilter")
    ?.addEventListener("change", handleSearch);
}

function handleSearch() {
  const searchValue =
    document.getElementById("searchInput")?.value.toLowerCase() || "";

  const statusValue =
    document.getElementById("statusFilter")?.value || "ALL";

  let filtered = allRequests;

  if (searchValue) {
    filtered = filtered.filter(r =>
      r.company_name?.toLowerCase().includes(searchValue) ||
      r.email?.toLowerCase().includes(searchValue)
    );
  }

  if (statusValue !== "ALL") {
    filtered = filtered.filter(r =>
      r.status?.toUpperCase() === statusValue
    );
  }

  renderTable(filtered);
}

/* =========================================================
   ADMIN INFO
========================================================= */
function injectAdminInfo() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  setText("adminName", user.name || user.full_name || "Admin");
  setText("adminRole", user.role || "Administrator");
}

/* =========================================================
   LOGOUT
========================================================= */
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

/* =========================================================
   HELPERS
========================================================= */
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString() + " " +
         date.toLocaleTimeString();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
function renderWhatYouDo(data) {
  if (!data || typeof data !== "object") return "";

  const activeItems = Object.entries(data)
    .filter(([_, value]) => value === true)
    .map(([key]) => key.replace(/_/g, " "))
    .join(", ");

  return `
    <div style="margin-top:15px;">
      <p><strong>What You Do:</strong> ${activeItems || "-"}</p>
    </div>
  `;
}