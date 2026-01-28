/****************************************************
 * AXO NETWORKS – ADMIN DASHBOARD JS (AUTH AWARE)
 ****************************************************/

let allRequests = [];

/* ===============================
   AUTH CHECK (ON LOAD)
================================ */
document.addEventListener("DOMContentLoaded", () => {
    if (!isAdminLoggedIn()) {
        window.location.replace("/portal-login");
        return;
    }

    loadDashboard();
});

/* ===============================
   AUTH HELPERS
================================ */
function isAdminLoggedIn() {
    try {
        // Option 1: stored user object
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && user.role === "admin") return true;

        // Option 2: simple role flag
        const role = localStorage.getItem("role");
        if (role === "admin") return true;

        return false;
    } catch {
        return false;
    }
}

/* ===============================
   LOAD DATA
================================ */
async function loadDashboard() {
    try {
        const res = await fetch("/api/network-request");
        if (!res.ok) throw new Error("API error");

        const json = await res.json();
        if (!json.success) throw new Error("Invalid response");

        allRequests = json.data;

        renderStats(allRequests);
        renderTable(allRequests);

    } catch (err) {
        console.error("Dashboard load error:", err);
        alert("Failed to load admin dashboard data");
    }
}

/* ===============================
   STATS
================================ */
function renderStats(data) {
    document.getElementById("totalSubmissions").innerText = data.length;
    document.getElementById("pendingCount").innerText =
        data.filter(r => r.status === "pending").length;
    document.getElementById("approvedCount").innerText =
        data.filter(r => r.status === "verified").length;
    document.getElementById("rejectedCount").innerText =
        data.filter(r => r.status === "rejected").length;
}

/* ===============================
   TABLE
================================ */
function renderTable(data) {
    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = "";

    if (!data.length) {
        tbody.innerHTML = `<tr><td colspan="9">No records found</td></tr>`;
        return;
    }

    data.forEach(item => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${item.company_name || "-"}</td>
            <td>${item.contact_name || "-"}</td>
            <td>${item.email}</td>
            <td>${item.phone}</td>
            <td>${item.primary_product || "-"}</td>
            <td>${renderStatus(item.status)}</td>
            <td>${formatDate(item.submission_timestamp)}</td>
            <td>${renderActions(item)}</td>
        `;

        tbody.appendChild(tr);
    });
}

/* ===============================
   STATUS
================================ */
function renderStatus(status) {
    if (status === "pending") return `<span class="badge pending">Pending</span>`;
    if (status === "verified") return `<span class="badge approved">Approved</span>`;
    if (status === "rejected") return `<span class="badge rejected">Rejected</span>`;
    return status;
}

/* ===============================
   ACTIONS
================================ */
function renderActions(item) {
    let html = `
        <button class="btn btn-sm" onclick="viewRequest(${item.id})">View</button>
    `;

    if (item.status === "pending") {
        html += `
            <button class="btn btn-sm btn-success"
                onclick="updateStatus(${item.id}, 'verified')">Approve</button>
            <button class="btn btn-sm btn-danger"
                onclick="updateStatus(${item.id}, 'rejected')">Reject</button>
        `;
    }

    return html;
}

/* ===============================
   VIEW MODAL
================================ */
function viewRequest(id) {
    const item = allRequests.find(r => r.id === id);
    if (!item) return;

    document.getElementById("modalBody").innerHTML = `
        <h3>${item.company_name}</h3>
        <p><b>Contact:</b> ${item.contact_name} (${item.role})</p>
        <p><b>Email:</b> ${item.email}</p>
        <p><b>Phone:</b> ${item.phone}</p>
        <p><b>City:</b> ${item.city_state}</p>
        <p><b>What they do:</b> ${(item.what_you_do || []).join(", ")}</p>
        <p><b>Primary Product:</b> ${item.primary_product}</p>
        <p><b>Capacity:</b> ${item.monthly_capacity}</p>
        <p><b>Why AXO:</b><br>${item.why_join_axo}</p>
    `;

    document.getElementById("viewModal").style.display = "block";
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

        const json = await res.json();
        if (!json.success) throw new Error();

        loadDashboard();

    } catch (err) {
        alert("Failed to update status");
    }
}

/* ===============================
   FILTER
================================ */
function filterByStatus() {
    const val = document.getElementById("statusFilter").value;

    if (val === "ALL") {
        renderTable(allRequests);
        return;
    }

    const map = {
        PENDING: "pending",
        APPROVED: "verified",
        REJECTED: "rejected"
    };

    renderTable(allRequests.filter(r => r.status === map[val]));
}

/* ===============================
   UTIL
================================ */
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString();
}

function refreshData() {
    loadDashboard();
}

function exportData() {
    if (!allRequests.length) return alert("No data to export");

    const headers = Object.keys(allRequests[0]);
    const csv = [
        headers.join(","),
        ...allRequests.map(r =>
            headers.map(h => `"${(r[h] ?? "").toString().replace(/"/g, '""')}"`).join(",")
        )
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "axo-network-requests.csv";
    a.click();
}

/* ===============================
   LOGOUT (FIXED)
================================ */
function logout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("/portal-login");
}

