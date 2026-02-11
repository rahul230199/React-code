let allRequests = [];
let currentStatusId = null;
let currentStatusValue = null;

/* =====================================================
   INIT
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  injectNotificationContainer();
  loadDashboard();
});

/* =====================================================
   NOTIFICATIONS
===================================================== */
function injectNotificationContainer() {
  if (document.getElementById("notification")) return;

  const div = document.createElement("div");
  div.id = "notification";
  Object.assign(div.style, {
    position: "fixed",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "12px 20px",
    borderRadius: "12px",
    fontWeight: "600",
    fontSize: "14px",
    zIndex: "9999",
    display: "none",
    boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
  });
  document.body.appendChild(div);
}

function showNotification(message, type = "error") {
  const note = document.getElementById("notification");
  if (!note) return;

  note.textContent = message;
  note.style.display = "block";
  note.style.background = type === "success" ? "#DCFCE7" : "#FEE2E2";
  note.style.color = type === "success" ? "#166534" : "#991B1B";

  setTimeout(() => (note.style.display = "none"), 4000);
}

/* =====================================================
   SKELETON CONTROL
===================================================== */
function showSkeletons() {
  const statsSkeleton = document.getElementById("statsSkeleton");
  const statsGrid = document.getElementById("statsGrid");
  const tableSkeleton = document.getElementById("tableSkeleton");
  const table = document.getElementById("dataTable");
  const emptyState = document.getElementById("emptyState");

  if (statsSkeleton) statsSkeleton.style.display = "grid";
  if (statsGrid) statsGrid.style.display = "none";
  if (tableSkeleton) tableSkeleton.style.display = "block";
  if (table) table.style.display = "none";
  if (emptyState) emptyState.style.display = "none";
}

function hideSkeletons() {
  const statsSkeleton = document.getElementById("statsSkeleton");
  const statsGrid = document.getElementById("statsGrid");
  const tableSkeleton = document.getElementById("tableSkeleton");

  if (statsSkeleton) statsSkeleton.style.display = "none";
  if (statsGrid) statsGrid.style.display = "grid";
  if (tableSkeleton) tableSkeleton.style.display = "none";
}

/* =====================================================
   LOAD DASHBOARD
===================================================== */
async function loadDashboard() {
  showSkeletons();

  try {
    const res = await fetch("/api/network-request");
    if (!res.ok) throw new Error();

    const json = await res.json();
    if (!json.success) throw new Error();

    allRequests = json.data || [];
  } catch {
    allRequests = [];
    showNotification("API not reachable", "error");
  }

  hideSkeletons();
  renderStats(allRequests);
  renderTable(allRequests);
}

/* =====================================================
   STATS
===================================================== */
function renderStats(data) {
  document.getElementById("totalSubmissions").textContent = data.length;
  document.getElementById("pendingCount").textContent =
    data.filter(r => r.status === "pending").length;
  document.getElementById("approvedCount").textContent =
    data.filter(r => r.status === "verified").length;
  document.getElementById("rejectedCount").textContent =
    data.filter(r => r.status === "rejected").length;
}

/* =====================================================
   TABLE
===================================================== */
function renderTable(data) {
  const tbody = document.getElementById("tableBody");
  const emptyState = document.getElementById("emptyState");
  const table = document.getElementById("dataTable");

  tbody.innerHTML = "";

  if (!data.length) {
    emptyState.style.display = "block";
    table.style.display = "none";
    return;
  }

  emptyState.style.display = "none";
  table.style.display = "table";

  data.forEach(req => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td data-label="ID">${req.id}</td>
      <td data-label="Company">${req.company_name || "-"}</td>
      <td data-label="Contact">${req.contact_name || "-"}</td>
      <td data-label="Email">${req.email || "-"}</td>
      <td data-label="Phone">${req.phone || "-"}</td>
      <td data-label="Type">${req.primary_product || "-"}</td>
      <td data-label="Status">${renderStatus(req.status)}</td>
      <td data-label="Submitted">${formatDate(req.submission_timestamp)}</td>
      <td data-label="Actions">${renderActions(req)}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* =====================================================
   STATUS BADGE
===================================================== */
function renderStatus(status) {
  if (status === "pending") return `<span class="badge pending">Pending</span>`;
  if (status === "verified") return `<span class="badge approved">Approved</span>`;
  if (status === "rejected") return `<span class="badge rejected">Rejected</span>`;
  return "-";
}

/* =====================================================
   ACTIONS
===================================================== */
function renderActions(item) {
  let html = `<button class="btn btn-secondary" onclick="viewRequest(${item.id})">View</button>`;
  if (item.status === "pending") {
    html += `
      <button class="btn btn-primary" onclick="openStatusModal(${item.id}, 'verified')">Approve</button>
      <button class="btn btn-danger" onclick="openStatusModal(${item.id}, 'rejected')">Reject</button>
    `;
  }
  return html;
}

/* =====================================================
   VIEW MODAL
===================================================== */
function viewRequest(id) {
  const item = allRequests.find(r => r.id === id);
  if (!item) return;

  document.getElementById("modalBody").innerHTML = `
    <h3>${item.company_name}</h3>
    <p><b>Email:</b> ${item.email}</p>
    <p><b>Phone:</b> ${item.phone}</p>
  `;
  document.getElementById("viewModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("viewModal").style.display = "none";
}

/* =====================================================
   STATUS MODAL
===================================================== */
function openStatusModal(id, status) {
  currentStatusId = id;
  currentStatusValue = status;

  document.getElementById("statusComment").value = "";
  document.getElementById("statusTitle").textContent =
    status === "verified" ? "Approve Request" : "Reject Request";

  document.getElementById("statusModal").style.display = "flex";
  document.getElementById("confirmStatusBtn").onclick = submitStatusChange;
}

function closeStatusModal() {
  document.getElementById("statusModal").style.display = "none";
}

/* =====================================================
   SUBMIT STATUS
===================================================== */
async function submitStatusChange() {
  const comment = document.getElementById("statusComment").value.trim();
  if (!comment) return showNotification("Comment is required", "error");

  try {
    const res = await fetch(`/api/network-request/${currentStatusId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: currentStatusValue,
        verificationNotes: comment
      })
    });

    if (!res.ok) throw new Error();

    showNotification("Status updated successfully", "success");
    closeStatusModal();
    loadDashboard();
  } catch {
    showNotification("Failed to update status", "error");
  }
}

/* =====================================================
   FILTER
===================================================== */
function filterByStatus() {
  const value = document.getElementById("statusFilter").value;
  const map = {
    ALL: null,
    PENDING: "pending",
    APPROVED: "verified",
    REJECTED: "rejected"
  };

  renderTable(map[value]
    ? allRequests.filter(r => r.status === map[value])
    : allRequests
  );
}

/* =====================================================
   UTILS
===================================================== */
function formatDate(d) {
  return d ? new Date(d).toLocaleDateString() : "-";
}

/* =====================================================
   HEADER ACTIONS
===================================================== */
function refreshData() {
  loadDashboard();
}

function exportData() {
  if (!allRequests.length) return showNotification("No data to export", "error");

  const headers = Object.keys(allRequests[0]);
  const csv = [
    headers.join(","),
    ...allRequests.map(r =>
      headers.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")
    )
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "axo-network-requests.csv";
  a.click();
}

function logout() {
  localStorage.clear();
  window.location.href = "/portal-login";
}
