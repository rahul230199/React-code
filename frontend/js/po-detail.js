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
   PO ID FROM URL
========================================================= */
const params = new URLSearchParams(window.location.search);
const PO_ID = params.get("id");

if (!PO_ID) {
  showMessage("Invalid purchase order reference", "error");
}

/* =========================================================
   INIT
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  if (!getUser() || !getToken()) {
    window.location.href = "/login";
    return;
  }

  loadPODetail();
});

/* =========================================================
   LOAD PO DETAILS (DB ONLY)
========================================================= */
async function loadPODetail() {
  try {
    clearMessage();

    const po = await fetchPO();
    renderPO(po);
    hideSkeletons();

  } catch (err) {
    console.error(err);
    showMessage("Failed to load purchase order details", "error");
  }
}

/* =========================================================
   API CALL
========================================================= */
async function fetchPO() {
  const res = await fetch(`/api/purchase-orders/${PO_ID}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  const result = await res.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to fetch PO");
  }

  return result.data;
}

/* =========================================================
   RENDER
========================================================= */
function renderPO(po) {
  setText("poId", po.id);
  setText("rfqId", po.rfq_id);
  setText("supplier", po.supplier_id);
  setText("quantity", po.quantity);
  setText("price", `₹${po.price}`);
  setText("createdAt", formatDate(po.created_at));

  const statusEl = document.getElementById("poStatus");
  statusEl.textContent = po.status.toUpperCase();
  statusEl.classList.remove("skeleton");
}

/* =========================================================
   HELPERS
========================================================= */
function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;

  el.textContent = value;
  el.classList.remove("skeleton");
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString();
}

function hideSkeletons() {
  document.querySelectorAll(".skeleton").forEach(el => {
    el.classList.add("fade-out");
    setTimeout(() => el.remove(), 300);
  });
}

function goBack() {
  window.history.back();
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
