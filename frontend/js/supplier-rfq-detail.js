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
   AUTH GUARD
========================================================= */
const user = getUser();
const token = getToken();

if (!user || !token || user.role !== "SUPPLIER") {
  window.location.href = "/login";
}

/* =========================================================
   RFQ ID
========================================================= */
const params = new URLSearchParams(window.location.search);
const RFQ_ID = params.get("id");

if (!RFQ_ID) {
  alert("Invalid RFQ reference");
  window.history.back();
}

/* =========================================================
   DOM READY
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("quoteForm")
    .addEventListener("submit", submitQuote);

  loadRFQDetail();
});

/* =========================================================
   API HELPER
========================================================= */
async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {})
    },
    ...options
  });

  const result = await res.json();
  if (!result.success) {
    throw new Error(result.message || "API error");
  }

  return result.data;
}

/* =========================================================
   LOAD RFQ DETAIL
========================================================= */
async function loadRFQDetail() {
  try {
    clearMessage();

    const [rfq, files, messages, quotes] = await Promise.all([
      api(`/api/rfqs/${RFQ_ID}`),
      api(`/api/rfq-files/${RFQ_ID}`),
      api(`/api/rfq-messages/${RFQ_ID}`),
      api(`/api/quotes/rfq/${RFQ_ID}`)
    ]);

    const myQuote =
      quotes.find(q => q.supplier_id === user.id) || null;

    renderRFQ(rfq);
    renderFiles(files);
    renderMessages(messages);
    renderQuoteState(myQuote);

    hideSkeletons();

  } catch (err) {
    console.error(err);
    showMessage(err.message || "Failed to load RFQ details", "error");
  }
}

/* =========================================================
   RENDER RFQ
========================================================= */
function renderRFQ(rfq) {
  setText("rfqId", rfq.id);
  setText("partName", rfq.part_name);
  setText("totalQty", rfq.total_quantity);
  setText("deliveryTimeline", rfq.delivery_timeline || "-");
  setText("ppapLevel", rfq.ppap_level || "-");
  setText("materialSpec", rfq.material_specification || "-");

  const status = document.getElementById("rfqStatus");
  status.textContent = formatStatus(rfq.status);
  status.className = `status-badge ${rfq.status}`;
}

/* =========================================================
   FILES
========================================================= */
function renderFiles(files) {
  const list = document.getElementById("fileList");
  list.innerHTML = "";

  if (!files.length) {
    list.innerHTML = "<li>No files uploaded</li>";
    return;
  }

  files.forEach(f => {
    list.innerHTML += `
      <li class="file">
        <a href="${f.file_url}" target="_blank">${f.file_name}</a>
      </li>
    `;
  });
}

/* =========================================================
   QUOTE STATE
========================================================= */
function renderQuoteState(quote) {
  const form = document.getElementById("quoteForm");

  if (!quote) return;

  form.querySelectorAll("input, textarea, button")
    .forEach(el => el.disabled = true);

  showMessage(
    quote.status === "accepted"
      ? "Your quote has been accepted. Purchase Order issued."
      : "You have already submitted a quote.",
    "success"
  );
}

/* =========================================================
   SUBMIT QUOTE
========================================================= */
async function submitQuote(e) {
  e.preventDefault();
  clearMessage();

  const payload = {
    rfq_id: Number(RFQ_ID),
    supplier_id: user.id,
    price: Number(getValue("price")),
    batch_quantity: Number(getValue("batchQty")),
    delivery_timeline: getValue("quoteTimeline"),
    certifications: getValue("certifications") || null
  };

  const error = validateQuote(payload);
  if (error) return showMessage(error, "error");

  try {
    await api("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    showMessage("Quote submitted successfully", "success");
    loadRFQDetail();

  } catch (err) {
    console.error(err);
    showMessage(err.message || "Failed to submit quote", "error");
  }
}

/* =========================================================
   MESSAGES
========================================================= */
function renderMessages(messages) {
  const box = document.getElementById("messageList");
  box.innerHTML = "";

  if (!messages.length) return;

  messages.forEach(m => {
    box.innerHTML += `
      <div class="message ${
        m.sender_id === user.id ? "supplier" : "buyer"
      }">
        ${m.message}
      </div>
    `;
  });
}

async function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (!text) return;

  try {
    await api(`/api/rfq-messages/${RFQ_ID}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    input.value = "";
    loadRFQDetail();

  } catch (err) {
    console.error(err);
    showMessage(err.message || "Failed to send message", "error");
  }
}

/* =========================================================
   HELPERS
========================================================= */
function getValue(id) {
  return document.getElementById(id)?.value.trim();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("skeleton");
  el.textContent = value;
}

function formatStatus(status) {
  return status.replace("_", " ").toUpperCase();
}

function validateQuote(q) {
  if (!q.price || q.price <= 0) return "Price must be greater than 0";
  if (!q.batch_quantity || q.batch_quantity <= 0)
    return "Batch quantity must be greater than 0";
  if (!q.delivery_timeline)
    return "Delivery timeline is required";
  return null;
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
   STATUS MESSAGE
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
