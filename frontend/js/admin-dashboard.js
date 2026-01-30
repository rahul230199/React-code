
let allRequests = [];
const DUMMY_REQUESTS = [
  {
    id: 1,
    company_name: "AXO Networks",
    contact_name: "Rahul",
    email: "rahul@axo.network",
    phone: "9876543210",
    primary_product: "Battery",
    status: "verified",
    submission_timestamp: "2026-01-29",
    website: "https://axonetworks.com",
    registered_address: "Bangalore",
    city_state: "Karnataka",
    role: "Manager",
    what_you_do: ["Manufacturing"],
    key_components: "Battery Cells",
    manufacturing_locations: "Bangalore",
    monthly_capacity: "10000",
    certifications: "ISO",
    role_in_ev: "Issue POs",
    why_join_axo: "Looking to scale EV supply"
  },
  {
    id: 2,
    company_name: "Tata Motors",
    contact_name: "Prasanna",
    email: "prasanna@tata.com",
    phone: "9123456789",
    primary_product: "Motor",
    status: "pending",
    submission_timestamp: "2026-01-28"
  },
  {
    id: 3,
    company_name: "Royal Enfield",
    contact_name: "Jillu",
    email: "jillu@gmail.com",
    phone: "8965546546",
    primary_product: "Lights",
    status: "rejected",
    submission_timestamp: "2026-01-27"
  }
];


/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", () => {
    injectNotificationContainer();
    loadDashboard();
});

/* ===============================
   NOTIFICATION SYSTEM
   (Top Center, Red / Green)
================================ */
function injectNotificationContainer() {
    if (document.getElementById("notification")) return;

    const div = document.createElement("div");
    div.id = "notification";
    div.style.position = "fixed";
    div.style.top = "20px";
    div.style.left = "50%";
    div.style.transform = "translateX(-50%)";
    div.style.padding = "12px 20px";
    div.style.borderRadius = "12px";
    div.style.fontWeight = "600";
    div.style.fontSize = "14px";
    div.style.zIndex = "9999";
    div.style.display = "none";
    div.style.boxShadow = "0 10px 25px rgba(0,0,0,0.15)";
    document.body.appendChild(div);
}

function showNotification(message, type = "error") {
    const note = document.getElementById("notification");
    if (!note) return;

    note.innerText = message;
    note.style.display = "block";
    note.style.background =
        type === "success" ? "#DCFCE7" : "#FEE2E2";
    note.style.color =
        type === "success" ? "#166534" : "#991B1B";

    setTimeout(() => {
        note.style.display = "none";
    }, 4000);
}

/* ===============================
   LOAD DASHBOARD
================================ */
async function loadDashboard() {
    try {
        const res = await fetch("/api/network-request");

        if (!res.ok) {
            throw new Error("API not reachable");
        }

        const json = await res.json();

        if (!json.success || !Array.isArray(json.data)) {
            throw new Error("Invalid API response");
        }

        allRequests = json.data;

        renderStats(allRequests);
        renderTable(allRequests);

    } catch (err) {
       console.warn("API not available — loading dummy data");

    allRequests = DUMMY_REQUESTS;

    renderStats(allRequests);
    renderTable(allRequests);

    showNotification(
        "Running in local mode (dummy data)",
        "success"
        );
    }
}

/* ===============================
   STATS
================================ */
function renderStats(data) {
    document.getElementById("totalSubmissions").innerText = data.length;
    document.getElementById("pendingCount").innerText =
        data.filter(req => req.status === "pending").length;
    document.getElementById("approvedCount").innerText =
        data.filter(req => req.status === "verified").length;
    document.getElementById("rejectedCount").innerText =
        data.filter(req => req.status === "rejected").length;
}

/* ===============================
   TABLE
================================ */
function renderTable(data) {
    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = "";

    if (!data.length) return;

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

/* ===============================
   STATUS BADGE
================================ */
function renderStatus(status) {
    if (status === "pending") return `<span class="badge pending">Pending</span>`;
    if (status === "verified") return `<span class="badge approved">Approved</span>`;
    if (status === "rejected") return `<span class="badge rejected">Rejected</span>`;
    return "-";
}

/* ===============================
   ACTION BUTTONS
================================ */
function renderActions(item) {
    let html = `
        <button class="btn btn-secondary" onclick="viewRequest(${item.id})">View</button>
    `;

    if (item.status === "pending") {
        html += `
            <button class="btn btn-primary"
                onclick="updateStatus(${item.id}, 'verified')">Approve</button>
            <button class="btn btn-danger"
                onclick="updateStatus(${item.id}, 'rejected')">Reject</button>
        `;
    }

    return html;
}

/* ===============================
   VIEW MODAL
================================ */
function viewRequest(id) {
    const item = allRequests.find(req => req.id === id);
    if (!item) return;

    const modal = document.getElementById("viewModal");
    const body = document.getElementById("modalBody");

    body.innerHTML = `
        <h3>${item.company_name}</h3>

        <div class="modal-grid">
            <p><b>Website:</b> ${item.website || "-"}</p>
            <p><b>Registered Address:</b> ${item.registered_address || "-"}</p>

            <p><b>City / State:</b> ${item.city_state || "-"}</p>
            <p><b>Contact Name:</b> ${item.contact_name || "-"}</p>

            <p><b>Role:</b> ${item.role || "-"}</p>
            <p><b>Email:</b> ${item.email || "-"}</p>

            <p><b>Phone:</b> ${item.phone || "-"}</p>
            <p><b>What they do:</b> ${(item.what_you_do || []).join(", ")}</p>

            <p><b>Primary Product:</b> ${item.primary_product || "-"}</p>
            <p><b>Key Components:</b> ${item.key_components || "-"}</p>

            <p><b>Manufacturing Locations:</b> ${item.manufacturing_locations || "-"}</p>
            <p><b>Monthly Capacity:</b> ${item.monthly_capacity || "-"}</p>

            <p><b>Certifications:</b> ${item.certifications || "-"}</p>
            <p><b>Role in EV:</b> ${item.role_in_ev || "-"}</p>

            <p style="grid-column: span 2;">
                <b>Why AXO:</b><br>${item.why_join_axo || "-"}
            </p>
        </div>
    `;

    modal.style.display = "block";
}

function closeModal() {
    document.getElementById("viewModal").style.display = "none";
}

/* ===============================
   UPDATE STATUS
================================ */
async function updateStatus(id, status) {
    if (!confirm(`Are you sure you want to ${status}?`)) return;

    try {
        const res = await fetch(`/api/network-request/${id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status })
        });

        if (!res.ok) throw new Error();

        const json = await res.json();
        if (!json.success) throw new Error();

        showNotification("Status updated successfully", "success");
        loadDashboard();

    } catch (err) {
        console.error("Status update failed:", err);
        showNotification("Failed to update status. Try again.", "error");
    }
}

/* ===============================
   FILTER
================================ */
function filterByStatus() {
    const value = document.getElementById("statusFilter").value;

    const map = {
        ALL: null,
        PENDING: "pending",
        APPROVED: "verified",
        REJECTED: "rejected"
    };

    if (!map[value]) {
        renderTable(allRequests);
    } else {
        renderTable(allRequests.filter(req => req.status === map[value]));
    }
}

/* ===============================
   UTIL
================================ */
function formatDate(dateStr) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString();
}

/* ===============================
   HEADER ACTIONS
================================ */
function refreshData() {
    window.location.reload();
}

function exportData() {
    if (!allRequests.length) {
        showNotification("No data available to export", "error");
        return;
    }

    const headers = Object.keys(allRequests[0]);
    const csv = [
        headers.join(","),
        ...allRequests.map(row =>
            headers.map(h => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")
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
