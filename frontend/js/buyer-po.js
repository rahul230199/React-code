/* =========================================================
   AUTH HELPERS
========================================================= */
function getUser() {
  return JSON.parse(localStorage.getItem("user"));
}

function getToken() {
  return localStorage.getItem("token");
}

/* =========================================================
   INIT
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  if (!getUser() || !getToken()) {
    window.location.href = "/login";
    return;
  }

  loadPOs();
});

/* =========================================================
   LOAD PURCHASE ORDERS (DB ONLY)
========================================================= */
async function loadPOs() {
  try {
    const pos = await fetchPOs();
    renderPOs(pos);
  } catch (err) {
    console.error("Load POs error:", err);
  }
}

/* =========================================================
   API
========================================================= */
async function fetchPOs() {
  const buyerId = getUser().id;

  const res = await fetch(`/api/purchase-orders/buyer/${buyerId}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch purchase orders");
  }

  const result = await res.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to fetch purchase orders");
  }

  return result.data;
}

/* =========================================================
   RENDER
========================================================= */
function renderPOs(pos) {
  const tbody = document.getElementById("poTableBody");
  tbody.innerHTML = "";

  if (!pos || pos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty">No purchase orders found</td>
      </tr>
    `;
    return;
  }

  pos.forEach(po => {
    tbody.innerHTML += `
      <tr>
        <td>${po.id}</td>
        <td>${po.rfq_id}</td>
        <td>${po.supplier_id}</td>
        <td>${po.quantity}</td>
        <td>₹${po.price}</td>
        <td>
          <span class="status issued">ISSUED</span>
        </td>
        <td>
          <button class="view-btn" onclick="viewPO(${po.id})">
            View
          </button>
        </td>
      </tr>
    `;
  });
}

/* =========================================================
   NAVIGATION
========================================================= */
function viewPO(id) {
  window.location.href = `/po-detail.html?id=${id}`;
}

function goBack() {
  window.history.back();
}
