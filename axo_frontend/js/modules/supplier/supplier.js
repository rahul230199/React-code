/* =========================================================
   AXO SUPPLIER CONTROL CENTER – ENTERPRISE JS
========================================================= */

let authToken = localStorage.getItem("token");

/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  if (!authToken) {
    window.location.href = "/login";
    return;
  }

  showSection("dashboard");
  loadDashboard();
  loadNotifications();
});


/* =========================================================
   NAVIGATION
========================================================= */

function showSection(section) {

  const map = {
    dashboard: "dashboardSection",
    rfqs: "rfqSection",
    orders: "ordersSection",
    profile: "profileSection"
  };

  document.querySelectorAll(".section").forEach(s =>
    s.classList.remove("active")
  );

  const target = document.getElementById(map[section]);

  if (target) {
    target.classList.add("active");
  }

}


/* =========================================================
   DASHBOARD LOADER
========================================================= */

async function loadDashboard() {
  await Promise.all([
    loadRFQs(),
    loadOrders()
  ]);
}


/* =========================================================
   LOAD RFQs
========================================================= */

async function loadRFQs() {
  try {

    const res = await fetch("/api/supplier/rfqs", {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (!res.ok) return;

    const result = await res.json();
    const rfqs = result.data || [];

    const kpi = document.getElementById("kpiRFQs");
    if (kpi) kpi.innerText = rfqs.length;

    const container = document.getElementById("rfqList");
    if (!container) return;

    container.innerHTML = "";

    if (rfqs.length === 0) {
      container.innerHTML =
        `<div class="empty-state">No open RFQs available</div>`;
      return;
    }

    rfqs.forEach(r => {
      container.innerHTML += `
        <div class="rfq-card">
          <div class="rfq-header">
            <h3>${r.part_name}</h3>
            <span class="badge">${r.quantity} units</span>
          </div>
          <p>${r.part_description || ""}</p>
          <div class="rfq-footer">
            <button class="btn-primary"
              onclick="submitQuote(${r.id})">
              Submit Quote
            </button>
          </div>
        </div>
      `;
    });

  } catch (err) {
    console.error("RFQ Load Error:", err);
  }
}


/* =========================================================
   LOAD ORDERS
========================================================= */

async function loadOrders() {

  try {

    const res = await fetch("/api/supplier/purchase-orders", {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (!res.ok) return;

    const result = await res.json();
    const orders = result.data || [];

    const kpi = document.getElementById("kpiOrders");
    if (kpi) kpi.innerText = orders.length;

    const tableBody = document.getElementById("ordersTableBody");
    if (tableBody) {

      tableBody.innerHTML = "";

      if (orders.length === 0) {
        tableBody.innerHTML =
          `<tr><td colspan="5">No orders yet</td></tr>`;
      }

      orders.forEach(o => {
        tableBody.innerHTML += `
          <tr>
            <td>${o.po_number}</td>
            <td>${o.part_name}</td>
            <td>${o.quantity}</td>
            <td>${o.status}</td>
            <td>${formatDate(o.agreed_delivery_date)}</td>
          </tr>
        `;
      });
    }

    renderCharts(orders);

  } catch (err) {
    console.error("Order Load Error:", err);
  }
}


/* =========================================================
   SUBMIT QUOTE (SIMPLE VERSION)
========================================================= */

async function submitQuote(rfqId) {

  const price = prompt("Enter price:");

  if (!price) return;

  try {

    const res = await fetch(`/api/supplier/rfqs/${rfqId}/quote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ price })
    });

    const result = await res.json();

    if (res.ok) {
      alert("Quote submitted successfully");
      loadRFQs();
    } else {
      alert(result.message || "Error submitting quote");
    }

  } catch (err) {
    console.error("Quote Error:", err);
  }
}


/* =========================================================
   ENTERPRISE CHARTS
========================================================= */

function renderCharts(orders) {

  const canvas = document.getElementById("statusChart");
  if (!canvas) return;

  const completed = orders.filter(o =>
    o.status === "completed"
  ).length;

  const active = orders.filter(o =>
    o.status === "in_progress"
  ).length;

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Completed", "Active"],
      datasets: [{
        data: [completed || 0, active || 0],
        backgroundColor: ["#22c55e", "#3b82f6"]
      }]
    }
  });
}


/* =========================================================
   NOTIFICATIONS (TEMP SAFE VERSION)
========================================================= */

async function loadNotifications() {

  // Until backend route exists
  const notifications = [];

  const countEl = document.getElementById("notifCount");
  if (countEl) countEl.innerText = notifications.length;

  const panel = document.getElementById("notificationPanel");
  if (!panel) return;

  if (notifications.length === 0) {
    panel.innerHTML =
      `<div class="empty-state">No notifications</div>`;
  }
}


/* =========================================================
   UTIL
========================================================= */

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}

