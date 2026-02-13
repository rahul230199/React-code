/* =========================================================
   AXO RFQ DETAIL – FULL LIFECYCLE + QUOTE ENGINE
========================================================= */

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
  if (!user || !token) {
    window.location.href = "/frontend/login.html";
  }
})();

let rfqId = null;
let currentUser = getUser();
let currentRFQ = null;
let existingSupplierQuote = null;

document.addEventListener("DOMContentLoaded", async () => {

  document.getElementById("userEmail").textContent = currentUser.email;

  rfqId = getRFQIdFromURL();
  if (!rfqId) return;

  await loadRFQDetails();
  await loadFiles();
  await loadQuotes();
  await loadMessages();

  setupLifecycleButtons();
  setupQuoteButton();

  document
    .getElementById("sendMessageBtn")
    ?.addEventListener("click", sendMessage);
});

/* =========================================================
   LOAD RFQ DETAILS
========================================================= */

async function loadRFQDetails() {

  const rfq = await fetchAPI(`/api/rfqs/${rfqId}`);
  currentRFQ = rfq;

  setText("rfqPartName", rfq.part_name);
  setText("rfqId", rfq.id);
  setText("rfqCreated", formatDate(rfq.created_at));

  setText("detailPartId", rfq.part_id);
  setText("detailTotalQty", rfq.total_quantity);
  setText("detailBatchQty", rfq.batch_quantity);
  setText("detailTargetPrice", rfq.target_price || "-");
  setText("detailDelivery", rfq.delivery_timeline);
  setText("detailPpap", rfq.ppap_level);
  setText("detailMaterial", rfq.material_specification);

  setStatusBadge(rfq.status);

  controlLifecycleUI(rfq.status);
  controlSupplierQuoteUI(rfq.status);
}

/* =========================================================
   SUPPLIER QUOTE UI CONTROL
========================================================= */

async function controlSupplierQuoteUI(status) {

  const section = document.getElementById("supplierQuoteSection");

  if (!section) return;

  if (
    (currentUser.role === "supplier" || currentUser.role === "both") &&
    status === "active"
  ) {

    // Check assignment
    try {
      await fetchAPI(`/api/rfqs/${rfqId}`); // access already validated
      section.classList.remove("hidden");

      await loadExistingSupplierQuote();

    } catch {
      section.classList.add("hidden");
    }

  } else {
    section.classList.add("hidden");
  }
}

async function loadExistingSupplierQuote() {

  const quotes = await fetchAPI(`/api/quotes/rfq/${rfqId}`);

  existingSupplierQuote = quotes.find(
    q => q.supplier_id === currentUser.id
  );

  if (existingSupplierQuote) {

    document.getElementById("quotePrice").value = existingSupplierQuote.price;
    document.getElementById("quoteBatchQty").value = existingSupplierQuote.batch_quantity;
    document.getElementById("quoteDelivery").value = existingSupplierQuote.delivery_timeline;
    document.getElementById("quoteMaterial").value = existingSupplierQuote.material_specification;
    document.getElementById("quoteCertifications").value = existingSupplierQuote.certifications;

    if (existingSupplierQuote.status === "accepted") {
      document.getElementById("submitQuoteBtn").disabled = true;
    }
  }
}

function setupQuoteButton() {
  document.getElementById("submitQuoteBtn")
    ?.addEventListener("click", submitQuote);
}

async function submitQuote() {

  const payload = {
    rfq_id: rfqId,
    price: Number(document.getElementById("quotePrice").value),
    batch_quantity: Number(document.getElementById("quoteBatchQty").value),
    delivery_timeline: document.getElementById("quoteDelivery").value,
    material_specification: document.getElementById("quoteMaterial").value,
    certifications: document.getElementById("quoteCertifications").value
  };

  if (!payload.price || !payload.batch_quantity) {
    alert("Price and Batch Quantity required");
    return;
  }

  await fetchAPI("/api/quotes", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  alert("Quote submitted successfully");
  await loadQuotes();
}

/* =========================================================
   REST OF ORIGINAL LOGIC (FILES, QUOTES, MESSAGES)
========================================================= */

async function loadFiles() {
  const files = await fetchAPI(`/api/rfq-files/${rfqId}`);
  const list = document.getElementById("rfqFilesList");
  list.innerHTML = files.length
    ? files.map(f =>
        `<li><a href="${escapeHTML(f.file_url)}" target="_blank">
          ${escapeHTML(f.file_name)}
        </a></li>`
      ).join("")
    : "<li>No documents uploaded</li>";
}

async function loadQuotes() {
  const quotes = await fetchAPI(`/api/quotes/rfq/${rfqId}`);
  const tbody = document.getElementById("quotesTableBody");
  const countLabel = document.getElementById("quoteCount");

  countLabel.textContent = `${quotes.length} Quotes`;

  tbody.innerHTML = quotes.length
    ? quotes.map(q => `
        <tr>
          <td>${escapeHTML(q.supplier_email || q.supplier_id)}</td>
          <td>${escapeHTML(q.price)}</td>
          <td>${escapeHTML(q.batch_quantity)}</td>
          <td>${escapeHTML(q.delivery_timeline)}</td>
          <td>${escapeHTML(q.status)}</td>
          <td>${renderQuoteAction(q)}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="6">No quotes submitted yet</td></tr>`;
}

function renderQuoteAction(q) {
  if (currentUser.role !== "buyer") return "-";
  if (q.status === "accepted") return "Accepted";

  return `<button class="primary-btn"
    onclick="acceptQuote(${q.id}, ${q.supplier_id}, ${q.price})">
    Accept
  </button>`;
}

async function loadMessages() {
  const messages = await fetchAPI(`/api/rfq-messages/${rfqId}`);
  const container = document.getElementById("messagesContainer");
  container.innerHTML = messages.length
    ? messages.map(m => `
        <div class="message-row">
          <strong>User ${escapeHTML(m.sender_id)}</strong>
          <p>${escapeHTML(m.message)}</p>
        </div>
      `).join("")
    : "<div>No messages yet</div>";
}

/* =========================================================
   UTIL
========================================================= */

async function fetchAPI(url, options = {}) {
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Authorization": `Bearer ${getToken()}`,
      "Content-Type": "application/json"
    },
    body: options.body
  });

  if (response.status === 401 || response.status === 403) {
    window.location.href = "/frontend/login.html";
    return;
  }

  if (!response.ok) throw new Error("Network error");

  const data = await response.json();
  if (!data.success) throw new Error(data.message);

  return data.data;
}

function getRFQIdFromURL() {
  return new URLSearchParams(window.location.search).get("id");
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setStatusBadge(status) {
  const badge = document.getElementById("rfqStatus");
  badge.textContent = status.toUpperCase();
  badge.className = `status-badge ${status}`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

function escapeHTML(str) {
  return String(str).replace(/[<>&"']/g, "");
}

function goBack() {
  window.location.href = "/frontend/buyer-dashboard.html";
}

function logout() {
  localStorage.clear();
  window.location.href = "/frontend/login.html";
}