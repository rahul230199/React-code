/* ======================================================
   AXO NETWORKS — EV STARTUP ADMIN DASHBOARD
   Clean • Production Safe • Fully Synced with Backend
====================================================== */

const App = (() => {

  let allRequests = [];
  let filteredRequests = [];
  let activeRequest = null;

  /* ================= INIT ================= */

  function init() {
    bindTopbar();
    bindFilters();
    bindGlobalEvents();
    injectNotification();
    loadDashboard();
  }

  /* ================= API ================= */

  async function loadDashboard() {
    try {
      const token = getToken();
      if (!token) return redirectLogin();

      const res = await fetch("/api/network-request", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 401) return redirectLogin();
      if (!res.ok) throw new Error("API failed");

      const json = await res.json();

      allRequests = json.data || [];
      filteredRequests = [...allRequests];

      renderAll();

    } catch (err) {
      showNotification("Unable to connect to server");
    }
  }

  async function updateStatus(newStatus) {
    if (!activeRequest) return;

    try {
      const token = getToken();

      const res = await fetch(
        `/api/network-request/${activeRequest.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      );

      const json = await res.json();

      if (!res.ok) {
        showNotification(json.message || "Update failed");
        return;
      }

      showNotification("Status updated", "success");
      closeModal();
      loadDashboard();

    } catch {
      showNotification("Failed to update status");
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

    if (!tbody) return;

    tbody.innerHTML = "";

    if (!data.length) {
      empty.style.display = "block";
      table.style.display = "none";
      return;
    }

    empty.style.display = "none";
    table.style.display = "table";

    const fragment = document.createDocumentFragment();

    data.forEach(req => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td data-label="ID">${req.id}</td>
        <td data-label="Company">${req.company_name || "-"}</td>
        <td data-label="Contact">${req.contact_name || "-"}</td>
        <td data-label="Email">${req.email || "-"}</td>
        <td data-label="Phone">${req.phone || "-"}</td>
        <td data-label="Product">${req.primary_product || "-"}</td>
        <td data-label="Status">${renderStatus(req.status)}</td>
        <td data-label="Submitted">${formatDate(req.submission_timestamp)}</td>
        <td data-label="Actions">
          <button class="btn-action" data-id="${req.id}" data-action="view">
            View Details
          </button>
        </td>
      `;

      fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);
  }

  function renderStatus(status) {
    if (status === "pending")
      return `<span class="badge pending">Pending</span>`;
    if (status === "verified")
      return `<span class="badge approved">Approved</span>`;
    if (status === "rejected")
      return `<span class="badge rejected">Rejected</span>`;
    return "-";
  }

  /* ================= MODAL ================= */

  function openViewModal(id) {
    const item = allRequests.find(r => r.id == id);
    if (!item) return showNotification("No data found");

    activeRequest = item;

    const modalBody = document.getElementById("modalBody");
    const modal = document.getElementById("viewModal");

    modalBody.innerHTML = `
      <h3 style="margin-bottom:15px;">${item.company_name}</h3>
      <p><strong>Contact:</strong> ${item.contact_name || "-"}</p>
      <p><strong>Email:</strong> ${item.email || "-"}</p>
      <p><strong>Phone:</strong> ${item.phone || "-"}</p>
      <p><strong>Product:</strong> ${item.primary_product || "-"}</p>
      <p><strong>Status:</strong> ${item.status}</p>
      <p><strong>Submitted:</strong> ${formatDate(item.submission_timestamp)}</p>

      ${item.status === "pending" ? `
        <div class="modal-actions">
          <button class="btn btn-approve" data-action="approve">
            Approve
          </button>
          <button class="btn btn-reject" data-action="reject">
            Reject
          </button>
        </div>
      ` : ""}
    `;

    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    const modal = document.getElementById("viewModal");
    modal.style.display = "none";
    document.body.style.overflow = "auto";
    activeRequest = null;
  }

  /* ================= FILTER ================= */

  function applyFilters() {
    const status = getValue("statusFilter");
    const search = getValue("searchInput").toLowerCase();
    const start = getValue("startDate");
    const end = getValue("endDate");

    filteredRequests = allRequests.filter(r => {

      if (status !== "ALL") {
        const map = {
          PENDING: "pending",
          APPROVED: "verified",
          REJECTED: "rejected"
        };
        if (r.status !== map[status]) return false;
      }

      if (search) {
        if (
          !r.company_name?.toLowerCase().includes(search) &&
          !r.email?.toLowerCase().includes(search)
        ) return false;
      }

      if (start && new Date(r.submission_timestamp) < new Date(start + "T00:00:00"))
        return false;

      if (end && new Date(r.submission_timestamp) > new Date(end + "T23:59:59"))
        return false;

      return true;
    });

    renderAll();
  }

  /* ================= EVENTS ================= */

  function bindTopbar() {
    document.getElementById("refreshBtn")?.addEventListener("click", loadDashboard);
    document.getElementById("exportBtn")?.addEventListener("click", exportData);
    document.getElementById("logoutBtn")?.addEventListener("click", logout);
  }

  function bindFilters() {
    ["statusFilter", "searchInput", "startDate", "endDate"]
      .forEach(id => {
        document.getElementById(id)
          ?.addEventListener("input", applyFilters);
      });
  }

  function bindGlobalEvents() {

    document.addEventListener("click", e => {

      const action = e.target.dataset.action;
      const id = e.target.dataset.id;

      if (action === "view") openViewModal(id);
      if (action === "approve") updateStatus("verified");
      if (action === "reject") updateStatus("rejected");

      if (e.target.classList.contains("modal-close") ||
          e.target.closest(".modal-close"))
        closeModal();

      if (e.target.id === "viewModal")
        closeModal();
    });

    document.addEventListener("keydown", e => {
      if (e.key === "Escape") closeModal();
    });
  }

  /* ================= UTIL ================= */

  function injectNotification() {
    if (document.getElementById("notification")) return;

    const div = document.createElement("div");
    div.id = "notification";
    div.style.cssText = `
      position:fixed;top:20px;left:50%;transform:translateX(-50%);
      padding:12px 20px;border-radius:10px;font-weight:600;
      z-index:9999;display:none;box-shadow:0 10px 25px rgba(0,0,0,0.15)
    `;
    document.body.appendChild(div);
  }

  function showNotification(msg, type = "error") {
    const note = document.getElementById("notification");
    note.textContent = msg;
    note.style.display = "block";
    note.style.background = type === "success" ? "#DCFCE7" : "#FEE2E2";
    note.style.color = type === "success" ? "#166534" : "#991B1B";
    setTimeout(() => note.style.display = "none", 3000);
  }

  function getToken() {
    return localStorage.getItem("token");
  }

  function redirectLogin() {
    localStorage.clear();
    window.location.href = "/portal-login";
  }

  function logout() {
    redirectLogin();
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function getValue(id) {
    return document.getElementById(id)?.value || "";
  }

  function formatDate(d) {
    return d ? new Date(d).toLocaleDateString() : "-";
  }

  function exportData() {
    if (!filteredRequests.length)
      return showNotification("No data to export");

    const headers = Object.keys(filteredRequests[0]);

    const csv = [
      headers.join(","),
      ...filteredRequests.map(r =>
        headers.map(h =>
          `"${String(r[h] ?? "").replace(/"/g, '""')}"`
        ).join(",")
      )
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "axo-requests.csv";
    a.click();
  }

  return { init };

})();

document.addEventListener("DOMContentLoaded", App.init);
