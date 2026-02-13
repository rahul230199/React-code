/* =========================================================
   AXO BUYER DASHBOARD – ENTERPRISE COMMAND CENTER
========================================================= */

/* ================= AUTH ================= */

function getUser() {
  try { return JSON.parse(localStorage.getItem("user")); }
  catch { return null; }
}

function getToken() {
  return localStorage.getItem("token");
}

(function authGuard() {
  const user = getUser();
  const token = getToken();
  if (!user || !token || user.role?.toLowerCase() !== "buyer") {
    logout();
  }
})();

/* ================= GLOBAL STATE ================= */

let dashboardData = null;
let pieChart = null;
let barChart = null;

/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  document.getElementById("userEmail").textContent = getUser().email;

  showSkeletons();
  await loadDashboard();
});

/* =========================================================
   LOAD DASHBOARD (ONE API ONLY)
========================================================= */

async function loadDashboard() {

  try {

    const data = await fetchAPI("/api/buyer/dashboard");

    dashboardData = data;

    hideSkeletons();

    renderStats(data.stats);
    renderTable(data.rfqs);
    renderCharts(data.rfqs);
    renderRecentQuotes(data.recent_quotes);

  } catch (err) {

    hideSkeletons();
    showError("Unable to load dashboard data.");

  }
}

/* =========================================================
   API WRAPPER
========================================================= */

async function fetchAPI(url) {

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  if (response.status === 401 || response.status === 403) {
    logout();
    return;
  }

  if (!response.ok) throw new Error("Network error");

  const result = await response.json();

  if (!result.success) throw new Error(result.message);

  return result.data;
}

/* =========================================================
   STATS
========================================================= */

function renderStats(stats) {

  setStat("totalRfqs", stats.total_rfqs);
  setStat("draftRfqs", stats.draft_rfqs);
  setStat("activeRfqs", stats.active_rfqs);
  setStat("closedRfqs", stats.closed_rfqs);
  setStat("totalQuotes", stats.total_quotes);
  setStat("totalPos", stats.total_pos);
}

function setStat(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value ?? 0;
}

/* =========================================================
   RFQ TABLE
========================================================= */

function renderTable(rfqs) {

  const tbody = document.getElementById("rfqTableBody");
  tbody.innerHTML = "";

  if (!rfqs.length) {
    tbody.innerHTML =
      `<tr><td colspan="7">No RFQs found</td></tr>`;
    return;
  }

  rfqs.forEach(rfq => {

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHTML(rfq.id)}</td>
      <td>${escapeHTML(rfq.part_name)}</td>
      <td>${escapeHTML(rfq.total_quantity)}</td>
      <td>${rfq.assigned_count || 0}</td>
      <td>${rfq.quote_count || 0}</td>
      <td>
        <span class="status ${rfq.status}">
          ${rfq.status.toUpperCase()}
        </span>
      </td>
      <td>
        <button class="primary-btn"
          onclick="viewRFQ(${rfq.id})">
          View
        </button>
      </td>
    `;

    tbody.appendChild(row);
  });
}

/* =========================================================
   RECENT QUOTES PANEL
========================================================= */

function renderRecentQuotes(quotes) {

  const container = document.getElementById("recentQuotesContainer");
  if (!container) return;

  container.innerHTML = "";

  if (!quotes || !quotes.length) {
    container.innerHTML = "<div>No recent quotes</div>";
    return;
  }

  quotes.forEach(q => {

    const div = document.createElement("div");
    div.className = "recent-quote-item";

    div.innerHTML = `
      <strong>RFQ #${q.rfq_id}</strong>
      <p>${escapeHTML(q.supplier_email)} quoted ₹${q.price}</p>
    `;

    container.appendChild(div);
  });
}

/* =========================================================
   CHARTS
========================================================= */

function renderCharts(rfqs) {

  renderPie(rfqs);
  renderBar(rfqs);
}

function renderPie(rfqs) {

  const counts = {};

  rfqs.forEach(r => {
    counts[r.status] = (counts[r.status] || 0) + 1;
  });

  if (pieChart) pieChart.destroy();

  pieChart = new Chart(
    document.getElementById("rfqPieChart"),
    {
      type: "doughnut",
      data: {
        labels: Object.keys(counts),
        datasets: [{
          data: Object.values(counts),
          backgroundColor: [
            "#2563eb",
            "#10b981",
            "#f59e0b",
            "#ef4444"
          ]
        }]
      }
    }
  );
}

function renderBar(rfqs) {

  const monthly = {};

  rfqs.forEach(r => {

    const key = new Date(r.created_at)
      .toLocaleString("default", { month: "short" });

    monthly[key] = (monthly[key] || 0) + 1;
  });

  if (barChart) barChart.destroy();

  barChart = new Chart(
    document.getElementById("rfqBarChart"),
    {
      type: "bar",
      data: {
        labels: Object.keys(monthly),
        datasets: [{
          data: Object.values(monthly),
          backgroundColor: "#2563eb"
        }]
      }
    }
  );
}

/* =========================================================
   HELPERS
========================================================= */

function escapeHTML(str) {
  return String(str).replace(/[<>&"']/g, "");
}

function showSkeletons() {
  document.querySelectorAll(".skeleton")
    .forEach(el => el.classList.remove("hidden"));
}

function hideSkeletons() {
  document.querySelectorAll(".skeleton")
    .forEach(el => el.classList.add("hidden"));
}

function showError(msg) {
  console.error(msg);
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

function goToPO() {
  window.location.href = `/buyer-po`;
}

function logout() {
  localStorage.clear();
  window.location.href = "/login";
}