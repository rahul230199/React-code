const API_BASE = "http://localhost:3000/api";

/* =====================
   HELPERS
===================== */
function getToken() {
  return localStorage.getItem("token");
}

function getUser() {
  return JSON.parse(localStorage.getItem("user"));
}

function getRFQId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

/* =====================
   AUTH CHECK
===================== */
(function checkAuth() {
  if (!getToken() || !getUser()) {
    window.location.href = "login.html";
  }
})();

/* =====================
   LOAD RFQ DATA
===================== */
async function loadRFQ() {
  const rfqId = getRFQId();

  try {
    const res = await fetch(`${API_BASE}/rfqs/${rfqId}`, {
      headers: {
        "Authorization": "Bearer " + getToken()
      }
    });

    const result = await res.json();

    if (!result.success) throw new Error(result.message);

    const rfq = result.data;

    document.getElementById("partName").innerText = rfq.part_name;
    document.getElementById("totalQty").innerText = rfq.total_quantity;
    document.getElementById("rfqStatus").innerText = rfq.status;

    document.getElementById("partId").innerText = rfq.part_id;
    document.getElementById("batchQty").innerText = rfq.batch_quantity;
    document.getElementById("deliveryTimeline").innerText = rfq.delivery_timeline;
    document.getElementById("materialSpec").innerText = rfq.material_specification;
    document.getElementById("ppapLevel").innerText = rfq.ppap_level;

  } catch (err) {
    console.error("RFQ load error:", err);
    alert("Failed to load RFQ");
  }
}

/* =====================
   LOAD QUOTES
===================== */
async function loadQuotes() {
  const rfqId = getRFQId();

  try {
    const res = await fetch(`${API_BASE}/quotes/${rfqId}`, {
      headers: {
        "Authorization": "Bearer " + getToken()
      }
    });

    const result = await res.json();
    const tbody = document.getElementById("quotesTable");
    tbody.innerHTML = "";

    if (!result.data || !result.data.length) {
      tbody.innerHTML = `<tr><td colspan="6">No quotes yet</td></tr>`;
      return;
    }

    result.data.forEach(q => {
      tbody.innerHTML += `
        <tr>
          <td>${q.supplier_id}</td>
          <td>${q.price}</td>
          <td>${q.batch_quantity}</td>
          <td>${q.delivery_timeline}</td>
          <td>${q.status}</td>
          <td>
            ${q.status === "submitted"
              ? `<button onclick="acceptQuote(${q.id})">Accept</button>`
              : "-"}
          </td>
        </tr>
      `;
    });

  } catch (err) {
    console.error("Quotes load error:", err);
  }
}

/* =====================
   ACCEPT QUOTE
===================== */
async function acceptQuote(quoteId) {
  const rfqId = getRFQId();

  if (!confirm("Accept this quote and create PO?")) return;

  try {
    const res = await fetch(`${API_BASE}/quotes/accept`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + getToken()
      },
      body: JSON.stringify({ rfq_id: rfqId, quote_id: quoteId })
    });

    const result = await res.json();

    if (!result.success) throw new Error(result.message);

    alert("Quote accepted. Purchase Order created.");
    loadRFQ();
    loadQuotes();

  } catch (err) {
    alert(err.message);
  }
}

/* =====================
   LOAD MESSAGES
===================== */
async function loadMessages() {
  const rfqId = getRFQId();

  try {
    const res = await fetch(`${API_BASE}/rfq-messages/${rfqId}`, {
      headers: {
        "Authorization": "Bearer " + getToken()
      }
    });

    const result = await res.json();
    const box = document.getElementById("messagesBox");
    box.innerHTML = "";

    if (!result.data.length) {
      box.innerHTML = "<p>No messages yet</p>";
      return;
    }

    result.data.forEach(m => {
      box.innerHTML += `<p><b>${m.sender_id}:</b> ${m.message}</p>`;
    });

  } catch (err) {
    console.error("Messages load error:", err);
  }
}

/* =====================
   SEND MESSAGE
===================== */
async function sendMessage() {
  const rfqId = getRFQId();
  const msg = document.getElementById("messageInput").value.trim();
  const user = getUser();

  if (!msg) return;

  try {
    await fetch(`${API_BASE}/rfq-messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + getToken()
      },
      body: JSON.stringify({
        rfq_id: rfqId,
        sender_id: user.id,
        message: msg
      })
    });

    document.getElementById("messageInput").value = "";
    loadMessages();

  } catch (err) {
    alert("Failed to send message");
  }
}

/* =====================
   INIT
===================== */
loadRFQ();
loadQuotes();
loadMessages();
