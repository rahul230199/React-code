/* =========================================================
   AXO NETWORKS — ENTERPRISE ADMIN DASHBOARD (FINAL)
========================================================= */

const AdminApp = (() => {

  let allRequests = [];
  let filteredRequests = [];
  let activeRequest = null;
  let pendingStatusAction = null;

  /* ================= INIT ================= */
  function init() {
    enforceAuth();
    bindTopbar();
    bindFilters();
    bindGlobalEvents();
    injectNotification();
    loadDashboard();
  }

  /* ================= AUTH ================= */
  function enforceAuth() {
    const user = getUser();
    const token = getToken();

    if (!user || !token || user.role?.toLowerCase() !== "admin") {
      clearSession();
      window.location.href = "/login";
      return;
    }

    setText("adminName", user.email);
    setText("adminRole", "Administrator");
  }

  /* ================= LOAD ================= */
  async function loadDashboard() {
    try {
      const res = await fetch("/api/network-request", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      if (res.status === 401 || res.status === 403) {
        return logout();
      }

      const result = await res.json();

      allRequests = result.data || [];
      filteredRequests = [...allRequests];

      renderAll();

    } catch {
      showNotification("Failed to load data");
    }
  }

  /* ================= RENDER ================= */
  function renderAll() {
    renderStats(filteredRequests);
    renderTable(filteredRequests);
  }

  function renderStats(data) {
    setText("totalSubmissions", data.length);
    setText("pendingCount", data.filter(r => r.status === "pending").length);
    setText("approvedCount", data.filter(r => r.status === "verified").length);
    setText("rejectedCount", data.filter(r => r.status === "rejected").length);
  }

  function renderTable(data) {
    const tbody = document.getElementById("tableBody");
    const empty = document.getElementById("emptyState");
    const table = document.getElementById("dataTable");

    tbody.innerHTML = "";

    if (!data.length) {
      empty.style.display = "block";
      table.style.display = "none";
      return;
    }

    empty.style.display = "none";
    table.style.display = "table";

    data.forEach(req => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${escapeHTML(req.id)}</td>
        <td>${escapeHTML(req.company_name)}</td>
        <td>${escapeHTML(req.contact_name)}</td>
        <td>${escapeHTML(req.email)}</td>
        <td>${escapeHTML(req.phone)}</td>
        <td>${escapeHTML(req.primary_product)}</td>
        <td>${renderStatus(req.status)}</td>
        <td>${formatDate(req.submission_timestamp)}</td>
        <td>
          <button class="btn-action"
            data-id="${req.id}"
            data-action="view">
            View
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });
  }

  function renderStatus(status) {
    const map = {
      pending: "badge pending",
      verified: "badge approved",
      rejected: "badge rejected"
    };

    return `<span class="${map[status]}">${status}</span>`;
  }

  /* ================= VIEW MODAL ================= */
  function openViewModal(id) {
   const item = allRequests.find(r => r.id == id);
  if (!item) return showNotification("No data found");

  activeRequest = item;

  const modalBody = document.getElementById("modalBody");
  const modal = document.getElementById("viewModal");

  // Support both camelCase and snake_case
  const companyName = item.company_name || item.companyName || "-";
  const website = item.website || "-";
  const registeredAddress = item.registered_address || item.registeredAddress || "-";
  const cityState = item.city_state || item.cityState || "-";
  const contactName = item.contact_name || item.contactName || "-";
  const email = item.email || "-";
  const phone = item.phone || "-";
  const primaryProduct = item.primary_product || item.primaryProduct || "-";
  const keyComponents = item.key_components || item.keyComponents || "-";
  const manufacturingLocations = item.manufacturing_locations || item.manufacturingLocations || "-";
  const monthlyCapacity = item.monthly_capacity || item.monthlyCapacity || "-";
  const certifications = item.certifications || "-";
  const roleInEV = item.role_in_ev || item.roleInEV || "-";
  const whyJoinAXO = item.why_join_axo || item.whyJoinAXO || "-";
  const submittedOn = item.submission_timestamp || item.created_at || "-";
  const status = item.status || "-";

  modalBody.innerHTML = `
    <div class="modal-header-section">
      <h2>${escapeHTML(companyName)}</h2>
      <span class="status-pill ${status}">
        ${escapeHTML(status)}
      </span>
    </div>

    <div class="modal-grid">

      <div class="modal-section">
        <h4>Company Information</h4>
        <p><strong>Website:</strong> ${escapeHTML(website)}</p>
        <p><strong>Registered Address:</strong> ${escapeHTML(registeredAddress)}</p>
        <p><strong>City / State:</strong> ${escapeHTML(cityState)}</p>
      </div>

      <div class="modal-section">
        <h4>Contact Details</h4>
        <p><strong>Contact Person:</strong> ${escapeHTML(contactName)}</p>
        <p><strong>Email:</strong> ${escapeHTML(email)}</p>
        <p><strong>Phone:</strong> ${escapeHTML(phone)}</p>
      </div>

      <div class="modal-section">
        <h4>Business Details</h4>
        <p><strong>Primary Product:</strong> ${escapeHTML(primaryProduct)}</p>
        <p><strong>Key Components:</strong> ${escapeHTML(keyComponents)}</p>
        <p><strong>Manufacturing Locations:</strong> ${escapeHTML(manufacturingLocations)}</p>
        <p><strong>Monthly Capacity:</strong> ${escapeHTML(monthlyCapacity)}</p>
        <p><strong>Certifications:</strong> ${escapeHTML(certifications)}</p>
      </div>

      <div class="modal-section">
        <h4>EV Role & Intent</h4>
        <p><strong>Role in EV:</strong> ${escapeHTML(roleInEV)}</p>
        <p><strong>Why Join AXO:</strong></p>
        <div class="modal-text-block">
          ${escapeHTML(whyJoinAXO)}
        </div>
      </div>

      <div class="modal-section full-width">
        <h4>Submission Metadata</h4>
        <p><strong>Submitted On:</strong> ${formatDate(submittedOn)}</p>
        <p><strong>Status:</strong> ${escapeHTML(status)}</p>
      </div>

    </div>

    ${
      status === "pending"
        ? `
        <div class="modal-actions">
          <button class="btn btn-approve" data-action="approve">
            Approve
          </button>
          <button class="btn btn-reject" data-action="reject">
            Reject
          </button>
        </div>
      `
        : ""
    }
  `;

  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
  }

  function closeModal() {
    document.getElementById("viewModal").style.display = "none";
    document.body.style.overflow = "auto";
  }

  /* ================= STATUS MODAL ================= */
  function openStatusModal(status) {
    pendingStatusAction = status;

    document.getElementById("statusTitle").textContent =
      status === "verified" ? "Approve Supplier" : "Reject Supplier";

    document.getElementById("statusComment").value = "";
    document.getElementById("statusModal").style.display = "flex";
  }

  function closeStatusModal() {
    document.getElementById("statusModal").style.display = "none";
    pendingStatusAction = null;
  }

  async function confirmStatusUpdate() {
    const comment = document.getElementById("statusComment").value.trim();

    if (comment.length < 5) {
      return showNotification("Comment required (min 5 characters)");
    }

    await updateStatus(pendingStatusAction, comment);
    closeStatusModal();
  }

  async function updateStatus(status, comment) {
    if (!activeRequest) return;

    try {
      await fetch(
        `/api/network-request/${activeRequest.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
          },
          body: JSON.stringify({ status, comment })
        }
      );

      closeModal();
      loadDashboard();
      showNotification("Status updated", "success");

    } catch {
      showNotification("Update failed");
    }
  }

  /* ================= EVENTS ================= */
  function bindGlobalEvents() {

    document.addEventListener("click", e => {

      const action = e.target.dataset.action;
      const id = e.target.dataset.id;

      if (action === "view") openViewModal(id);
      if (action === "approve") openStatusModal("verified");
      if (action === "reject") openStatusModal("rejected");

      if (e.target.id === "viewModal") closeModal();
      if (e.target.id === "statusModal") closeStatusModal();
    });

    document.getElementById("modalCloseBtn")
      ?.addEventListener("click", closeModal);

    document.getElementById("cancelStatusBtn")
      ?.addEventListener("click", closeStatusModal);

    document.getElementById("confirmStatusBtn")
      ?.addEventListener("click", confirmStatusUpdate);
  }

  function bindTopbar() {
    document.getElementById("logoutBtn")
      ?.addEventListener("click", logout);
  }

  function bindFilters() {
    document.getElementById("searchInput")
      ?.addEventListener("input", applyFilters);
  }

  function applyFilters() {
    const search = getValue("searchInput").toLowerCase();

    filteredRequests = allRequests.filter(r =>
      r.company_name.toLowerCase().includes(search) ||
      r.email.toLowerCase().includes(search)
    );

    renderAll();
  }

  /* ================= UTIL ================= */
  function getUser() {
    return JSON.parse(localStorage.getItem("user"));
  }

  function getToken() {
    return localStorage.getItem("token");
  }

  function clearSession() {
    localStorage.clear();
  }

  function logout() {
    clearSession();
    window.location.href = "/login";
  }

  function setText(id, val) {
    document.getElementById(id).textContent = val;
  }

  function getValue(id) {
    return document.getElementById(id)?.value || "";
  }

  function formatDate(d) {
    return d ? new Date(d).toLocaleString() : "-";
  }

  function escapeHTML(str) {
    return String(str || "").replace(/[<>&"']/g, "");
  }

  function injectNotification() {
    if (document.getElementById("notification")) return;

    const div = document.createElement("div");
    div.id = "notification";
    div.style.cssText =
      "position:fixed;top:20px;left:50%;transform:translateX(-50%);" +
      "padding:12px 20px;border-radius:8px;font-weight:600;" +
      "z-index:9999;display:none;";
    document.body.appendChild(div);
  }

  function showNotification(msg, type = "error") {
    const note = document.getElementById("notification");
    note.textContent = msg;
    note.style.display = "block";
    note.style.background =
      type === "success" ? "#DCFCE7" : "#FEE2E2";
    note.style.color =
      type === "success" ? "#166534" : "#991B1B";

    setTimeout(() => note.style.display = "none", 3000);
  }

  return { init };

})();

document.addEventListener("DOMContentLoaded", AdminApp.init);
