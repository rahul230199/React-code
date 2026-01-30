/****************************************************
 * AXO NETWORKS – ADMIN DASHBOARD JS (FINAL FIXED)
 ****************************************************/

let allRequests = [];

document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
});

/* ===============================
   LOAD DATA
================================ */
async function loadDashboard() {
    try {
        const res = await fetch("/api/network-request");
        const json = await res.json();

        if (!json.success) throw new Error("Failed to load");

        allRequests = json.data;
        renderStats(allRequests);
        renderTable(allRequests);

    } catch (err) {
        console.error("Dashboard load error:", err);
        alert("Failed to load admin data");
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

    data.forEach(req => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${req.id}</td>
            <td>${req.company_name || "-"}</td>
            <td>${req.contact_name || "-"}</td>
            <td>${req.email}</td>
            <td>${req.phone}</td>
            <td>${req.primary_product || "-"}</td>
            <td>${renderStatus(req.status)}</td>
            <td>${formatDate(req.submission_timestamp)}</td>
            <td>${renderActions(req)}</td>
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
    return status;
}

/* ===============================
   ACTION BUTTONS
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
   VIEW FULL FORM
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

            <p><b>City / State:</b> ${item.city_state}</p>
            <p><b>Contact Name:</b> ${item.contact_name}</p>

            <p><b>Role:</b> ${item.role}</p>
            <p><b>Email:</b> ${item.email}</p>

            <p><b>Phone:</b> ${item.phone}</p>
            <p><b>What they do:</b> ${(item.what_you_do || []).join(", ")}</p>

            <p><b>Primary Product:</b> ${item.primary_product}</p>
            <p><b>Key Components:</b> ${item.key_components}</p>

            <p><b>Manufacturing Locations:</b> ${item.manufacturing_locations}</p>
            <p><b>Monthly Capacity:</b> ${item.monthly_capacity}</p>

            <p><b>Certifications:</b> ${item.certifications || "-"}</p>
            <p><b>Role in EV:</b> ${item.role_in_ev}</p>

            <p style="grid-column: span 2;">
                <b>Why AXO:</b><br>${item.why_join_axo}
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

        const json = await res.json();
        if (!json.success) throw new Error();

        loadDashboard();

    } catch (err) {
        console.error("Status update failed:", err);
        alert("Failed to update status");
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

