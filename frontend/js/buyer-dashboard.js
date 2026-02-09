/* =========================================================
   AUTH HELPERS
========================================================= */
function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

function getToken() {
  return localStorage.getItem("token");
}

/* =========================================================
   AUTH GUARD (PRODUCTION)
========================================================= */
(function authGuard() {
  const user = getUser();
  const token = getToken();

  if (!user || !token || user.role !== "BUYER") {
    localStorage.clear();
    window.location.href = "/login";
  }
})();

/* =========================================================
   INIT
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const user = getUser();

  const emailEl = document.getElementById("userEmail");
  if (emailEl) emailEl.textContent = user.email;

  const createBtn = document.getElementById("createRfqBtn");
  if (createBtn) {
    createBtn.addEventListener("click", goToCreateRFQ);
  }

  loadDashboard();
});

/* =========================================================
   LOAD DASHBOARD (DB ONLY)
========================================================= */
async function loadDashboard() {
  try {
    clearMessage();

    const rfqs = await fetchRFQsFromDB();

    renderSummary(rfqs);
    renderPipeline(rfqs);
    renderTable(rfqs);
    hideSkeletons();

  } catch (err) {
    console.error("Dashboard load error:", err);
    showMessage("Failed to load RFQs", "error");
  }
}

/* =========================================================
   API CALL
========================================================= */
async function fetchRFQsFromDB() {
  const res = await fetch("/api/rfqs", {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      logout();
      return [];
    }
    throw new Error("Failed to fetch RFQs");
  }

  const result = await res.json();

  if (!result.success) {
    throw new Error(result.message || "API error");
  }

  return result.data || [];
}

/* =========================================================
   SUMMARY
========================================================= */
function renderSummary(rfqs) {
  document.getElementById("summarySection").innerHTML = `
    <div class="card"><h3>Total RFQs</h3><p>${rfqs.length}</p></div>
    <div class="card"><h3>Active RFQs</h3><p>${count(rfqs, "active")}</p></div>
    <div class="card"><h3>Quotes Received</h3><p>${count(rfqs, "quoted")}</p></div>
    <div class="card"><h3>Purchase Orders</h3><p>${count(rfqs, "closed")}</p></div>
  `;
}

function count(arr, status) {
  return arr.filter(r => r.status === status).length;
}

/* =========================================================
   PIPELINE
========================================================= */
function renderPipeline(rfqs) {
  setPipeline("draftCount", count(rfqs, "draft"));
  setPipeline("activeCount", count(rfqs, "active"));
  setPipeline("quotesCount", count(rfqs, "quoted"));
  setPipeline("poCount", count(rfqs, "closed"));
}

function setPipeline(id, value) {
  const el = document.getElementById(id);
  if (!el) return;

  el.classList.remove("skeleton");
  animateCount(el, value);
}

function animateCount(el, value) {
  let current = 0;
  const step = Math.max(1, Math.ceil(value / 15));

  const timer = setInterval(() => {
    current += step;
    if (current >= value) {
      el.textContent = value;
      clearInterval(timer);
    } else {
      el.textContent = current;
    }
  }, 20);
}

/* =========================================================
   TABLE
========================================================= */
function renderTable(rfqs) {
  const tbody = document.getElementById("rfqTableBody");
  tbody.innerHTML = "";

  if (!rfqs.length) {
    tbody.innerHTML =
      `<tr><td colspan="5" class="empty">No RFQs found</td></tr>`;
    return;
  }

  rfqs.forEach(rfq => {
    tbody.insertAdjacentHTML(
      "beforeend",
      `
      <tr>
        <td>${rfq.id}</td>
        <td>${rfq.part_name}</td>
        <td>${rfq.total_quantity}</td>
        <td>
          <span class="status ${mapStatusClass(rfq.status)}">
            ${formatStatus(rfq.status)}
          </span>
        </td>
        <td>
          <button class="view-btn" onclick="viewRFQ(${rfq.id})">
            View
          </button>
        </td>
      </tr>
      `
    );
  });
}

function mapStatusClass(status) {
  return {
    draft: "draft",
    active: "active",
    quoted: "submitted",
    closed: "closed"
  }[status] || "draft";
}

function formatStatus(status) {
  return String(status).replace("_", " ").toUpperCase();
}

/* =========================================================
   NAVIGATION (FIXED PATHS)
========================================================= */
function viewRFQ(id) {
  window.location.href = `/rfq-detail?id=${id}`;
}

function goToCreateRFQ() {
  window.location.href = `/rfq-create`;
}

function logout() {
  localStorage.clear();
  window.location.href = "/login";
}

/* =========================================================
   UI HELPERS
========================================================= */
function hideSkeletons() {
  document.querySelectorAll(".skeleton").forEach(el => {
    el.classList.add("fade-out");
    setTimeout(() => el.remove(), 300);
  });
}

/* =========================================================
   STATUS MESSAGE (TOP CENTER)
========================================================= */
function showMessage(text, type = "error") {
  const box = document.getElementById("statusMessage");
  if (!box) return;

  box.textContent = text;
  box.className = `status-message ${type}`;
  box.style.display = "block";

  setTimeout(() => {
    box.style.display = "none";
  }, 4000);
}

function clearMessage() {
  const box = document.getElementById("statusMessage");
  if (box) box.style.display = "none";
}
