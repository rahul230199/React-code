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
   AUTH GUARD + RFQ ID
========================================================= */
const params = new URLSearchParams(window.location.search);
const RFQ_ID = Number(params.get("id"));

document.addEventListener("DOMContentLoaded", () => {
  const user = getUser();
  const token = getToken();

  if (!user || !token || !RFQ_ID) {
    window.location.href = "/login";
    return;
  }

  loadRFQDetail();
});

/* =========================================================
   API HELPER
========================================================= */
async function api(url) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  const result = await res.json();
  if (!result.success) {
    throw new Error(result.message || "API request failed");
  }

  return result.data;
}

/* =========================================================
   LOAD RFQ DETAIL
========================================================= */
async function loadRFQDetail() {
  try {
    clearMessage();

    const [
      rfq,
      files,
      quotes,
      messages
    ] = await Promise.all([
      api(`/api/rfqs/${RFQ_ID}`),
      api(`/api/rfq-files/${RFQ_ID}`),
      api(`/api/quotes/rfq/${RFQ_ID}`),
      api(`/api/rfq-messages/${RFQ_ID}`)
    ]);

    renderRFQ(rfq);
    renderFiles(files);
    renderQuotes(quotes, rfq);
    renderMessages(messages);

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
  setText("deliveryTimeline", rfq.delivery_timeline);
  setText("ppapLevel", rfq.ppap_level || "-");
  setText("materialSpec", rfq.material_specification || "-");

  const status = document.getElementById("rfqStatus");
  status.textContent = rfq.status.replace("_", " ").toUpperCase();
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
        <a href="${f.file_url}" target="_blank" rel="noopener">
          ${f.file_name}
        </a>
      </li>
    `;
  });
}

/* =========================================================
   QUOTES
========================================================= */
function renderQuotes(quotes, rfq) {
  const container = document.getElementById("quotesContainer");
  container.innerHTML = "";

  if (!quotes.length) {
    container.innerHTML =
      `<p class="muted">No quotes received yet</p>`;
    return;
  }

  quotes.forEach(q => {
    container.innerHTML += `
      <div class="quote-card">
        <div class="quote-head">
          Supplier #${q.supplier_id}
        </div>

        <div class="quote-grid">
          <div><span>Price</span><strong>₹${q.price}</strong></div>
          <div><span>Qty</span><strong>${q.batch_quantity}</strong></div>
          <div><span>Delivery</span><strong>${q.delivery_timeline}</strong></div>
        </div>

        <div class="quote-action">
          ${
            q.status === "submitted" && rfq.status !== "closed"
              ? `<button class="accept-btn"
                    onclick='acceptQuote(${JSON.stringify({
                      quote_id: q.id,
                      supplier_id: q.supplier_id,
                      quantity: q.batch_quantity,
                      price: q.price
                    })})'>
                    Accept Quote
                 </button>`
              : `<span class="status-badge closed">Accepted</span>`
          }
        </div>
      </div>
    `;
  });
}

/* =========================================================
   ACCEPT QUOTE (REAL API)
========================================================= */
async function acceptQuote(data) {
  try {
    clearMessage();

    const user = getUser();

    const payload = {
      rfq_id: RFQ_ID,
      quote_id: data.quote_id,
      buyer_id: user.id,
      supplier_id: data.supplier_id,
      quantity: data.quantity,
      price: data.price
    };

    const res = await fetch("/api/quotes/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (!result.success) {
      throw new Error(result.message);
    }

    showMessage("Quote accepted. Purchase Order created.", "success");
    loadRFQDetail();

  } catch (err) {
    console.error(err);
    showMessage(err.message || "Failed to accept quote", "error");
  }
}

/* =========================================================
   MESSAGES
========================================================= */
function renderMessages(messages) {
  const box = document.getElementById("messageList");
  box.innerHTML = "";

  const userId = getUser().id;

  messages.forEach(m => {
    box.innerHTML += `
      <div class="message ${m.sender_id === userId ? "you" : "other"}">
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
    const res = await fetch(`/api/rfq-messages/${RFQ_ID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ message: text })
    });

    const result = await res.json();
    if (!result.success) throw new Error(result.message);

    input.value = "";
    loadRFQDetail();

  } catch (err) {
    showMessage(err.message || "Failed to send message", "error");
  }
}

/* =========================================================
   HELPERS
========================================================= */
function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("skeleton");
  el.textContent = value;
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
