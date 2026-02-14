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

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/portal-login";
}

/* =========================================================
   INIT
========================================================= */
document.addEventListener("DOMContentLoaded", () => {

  const user = getUser();
  const token = getToken();

  if (!user || !token || user.role !== "buyer") {
    logout();
    return;
  }

  const emailEl = document.getElementById("userEmail");
  if (emailEl) emailEl.textContent = user.email;

  initTabs();            // 🔥 TAB SYSTEM INIT
  initCreateButton();    // 🔥 BUTTON INIT
  loadDashboard();       // 🔥 LOAD DATA
});

/* =========================================================
   TAB SYSTEM
========================================================= */
function initTabs() {

  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");

  if (!tabButtons.length) return;

  tabButtons.forEach(button => {
    button.addEventListener("click", () => {

      const targetId = button.getAttribute("data-tab");

      // Remove active
      tabButtons.forEach(btn => btn.classList.remove("active"));
      tabPanels.forEach(panel => panel.classList.remove("active"));

      // Activate selected
      button.classList.add("active");

      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add("active");
      }
    });
  });
}

/* =========================================================
   CREATE RFQ BUTTON
========================================================= */
function initCreateButton() {
  const createBtn = document.getElementById("createRfqBtn");
  if (createBtn) {
    createBtn.addEventListener("click", goToCreateRFQ);
  }
}

/* =========================================================
   LOAD DASHBOARD
========================================================= */
async function loadDashboard() {
  try {

    const res = await fetch("/api/buyer/dashboard", {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
      throw new Error("Failed to fetch dashboard");
    }

    const result = await res.json();

    if (!result.success) {
      throw new Error(result.message || "API error");
    }

    const data = result.data || {};
    const rfqs = data.rfqs || [];

    renderSummary(rfqs);
    renderPipeline(rfqs);
    renderTable(rfqs);

  } catch (err) {
    console.error("Dashboard error:", err);
  }
}

/* =========================================================
   SUMMARY
========================================================= */
function renderSummary(rfqs) {
  const section = document.getElementById("summarySection");
  if (!section) return;

  section.innerHTML = `
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
  el.textContent = value;
}

/* =========================================================
   TABLE
========================================================= */
function renderTable(rfqs) {
  const tbody = document.getElementById("rfqTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!rfqs.length) {
    tbody.innerHTML =
      `<tr><td colspan="5">No RFQs found</td></tr>`;
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
        <td>${rfq.status.toUpperCase()}</td>
        <td>
          <button onclick="viewRFQ(${rfq.id})">
            View
          </button>
        </td>
      </tr>
      `
    );
  });
}

/* =========================================================
   NAVIGATION
========================================================= */
function viewRFQ(id) {
  window.location.href = `/rfq-detail?id=${id}`;
}

function goToCreateRFQ() {
  window.location.href = `/rfq-create`;
}

