const API_BASE = "http://localhost:3000/api";

/* =====================
   AUTH HELPERS
===================== */
function getToken() {
  return localStorage.getItem("token");
}

function getUser() {
  return JSON.parse(localStorage.getItem("user"));
}

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

/* =====================
   NAVIGATION
===================== */
function goToCreateRFQ() {
  window.location.href = "rfq-create.html";
}

function viewRFQ(id) {
  window.location.href = `rfq-detail.html?id=${id}`;
}

/* =====================
   LOAD DASHBOARD DATA
===================== */
async function loadDashboard() {
  const user = getUser();

  if (!user || !getToken()) {
    logout();
    return;
  }

  document.getElementById("userEmail").innerText = user.email;

  try {
    const res = await fetch(
      `${API_BASE}/rfqs?buyer_id=${user.id}`,
      {
        headers: {
          "Authorization": "Bearer " + getToken()
        }
      }
    );

    const result = await res.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    renderRFQs(result.data);
  } catch (err) {
    console.error("Dashboard load error:", err);
    document.getElementById("rfqTableBody").innerHTML =
      `<tr><td colspan="5">Failed to load RFQs</td></tr>`;
  }
}

/* =====================
   RENDER RFQs
===================== */
function renderRFQs(rfqs) {
  const tbody = document.getElementById("rfqTableBody");
  tbody.innerHTML = "";

  document.getElementById("totalRfqs").innerText = rfqs.length;
  document.getElementById("activeRfqs").innerText =
    rfqs.filter(r => r.status !== "closed").length;

  if (!rfqs.length) {
    tbody.innerHTML = `<tr><td colspan="5">No RFQs found</td></tr>`;
    return;
  }

  rfqs.forEach(rfq => {
    tbody.innerHTML += `
      <tr>
        <td>${rfq.id}</td>
        <td>${rfq.part_name}</td>
        <td>${rfq.total_quantity}</td>
        <td>
          <span class="status ${rfq.status}">
            ${rfq.status}
          </span>
        </td>
        <td>
          <button onclick="viewRFQ(${rfq.id})">View</button>
        </td>
      </tr>
    `;
  });
}

/* =====================
   INIT
===================== */
loadDashboard();
