/* =========================================================
   AXO NETWORKS — ORDER MESSAGES THREAD
   Premium SaaS Chat | Real-Time Enabled | Slack Style
========================================================= */

let socket = null;
let activePoId = null;
let typingTimer = null;
let inputBound = false;

/* =========================================================
   FORMAT DATE
========================================================= */

const formatDateTime = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

/* =========================================================
   SAFE HTML
========================================================= */

function escapeHTML(text) {
  if (!text) return "";

  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* =========================================================
   ROLE NORMALIZER
========================================================= */

function resolveRole(m) {
  return (
    m.role ||
    m.actor_role ||
    m.sender_role ||
    "admin"
  );
}

/* =========================================================
   ROLE CLASS
========================================================= */

function getRoleClass(role) {
  if (role === "buyer") return "message-buyer";
  if (role === "supplier") return "message-supplier";
  return "message-admin";
}

/* =========================================================
   DELIVERY TICK
========================================================= */

function deliveryTick() {
  return `<span class="message-tick">✓</span>`;
}

/* =========================================================
   SINGLE MESSAGE
========================================================= */

function renderMessage(m, previousRole = null) {

  const role = resolveRole(m);
  const grouped = previousRole === role;

  return `
    <div class="message-item ${getRoleClass(role)} ${grouped ? "message-grouped" : ""} message-animate">

      <div class="message-bubble">

        <div class="message-content">
          ${escapeHTML(m.message)}
        </div>

        <div class="message-meta">

          <span class="message-role">
            ${grouped ? "" : role.toUpperCase()}
          </span>

          <span class="message-time">
            ${formatDateTime(m.created_at)}
          </span>

          ${deliveryTick()}

        </div>

      </div>

    </div>
  `;
}

/* =========================================================
   APPEND MESSAGE (LIVE)
========================================================= */

function appendMessage(message) {

  const list = document.getElementById("orderMessagesList");
  if (!list) return;

  /* Prevent duplicates */

  if (document.querySelector(`[data-msg-id="${message.id}"]`)) return;

  const last = list.lastElementChild;

  const lastRole =
    last?.classList.contains("message-buyer") ? "buyer" :
    last?.classList.contains("message-supplier") ? "supplier" :
    last?.classList.contains("message-admin") ? "admin" :
    null;

  const html = renderMessage(message, lastRole);

  list.insertAdjacentHTML("beforeend", html);

  list.scrollTop = list.scrollHeight;
}

/* =========================================================
   SCROLL TO BOTTOM
========================================================= */

function scrollToBottom() {

  const list = document.getElementById("orderMessagesList");
  if (!list) return;

  setTimeout(() => {
    list.scrollTop = list.scrollHeight;
  }, 0);
}

/* =========================================================
   TYPING INDICATOR
========================================================= */

function showTyping(role) {

  const list = document.getElementById("orderMessagesList");
  if (!list) return;

  removeTyping();

  const html = `
    <div class="typing-indicator" id="typingIndicator">
      ${role} is typing...
    </div>
  `;

  list.insertAdjacentHTML("beforeend", html);

  scrollToBottom();
}

function removeTyping() {

  const el = document.getElementById("typingIndicator");

  if (el) el.remove();
}

/* =========================================================
   SOCKET INITIALIZATION
========================================================= */

function initSocket(poId) {

  if (!window.io) return;

  if (!socket) {
    socket = io(window.location.origin);
  }

  activePoId = poId;

  socket.emit("join_po_room", poId);

  socket.off("po_message");
  socket.off("typing");

  socket.on("po_message", (msg) => {

    if (msg.po_id !== activePoId) return;

    removeTyping();
    appendMessage(msg);

  });

  socket.on("typing", (data) => {

    if (data.po_id !== activePoId) return;

    showTyping(data.role || "User");

  });

}

/* =========================================================
   INPUT EVENTS
========================================================= */

function bindInputEvents(poId) {

  if (inputBound) return;

  const input = document.getElementById("orderMessageInput");

  if (!input || !socket) return;

  inputBound = true;

  input.focus();

  input.addEventListener("input", () => {

    socket.emit("typing", {
      po_id: poId
    });

    clearTimeout(typingTimer);

    typingTimer = setTimeout(() => {
      removeTyping();
    }, 2000);

  });

}

/* =========================================================
   EXPORT COMPONENT
========================================================= */

export const OrderMessagesThread = {

  render(data) {

    const { messages = [], po } = data;

    const poId = po?.id;

    if (poId) {

      setTimeout(() => {
        initSocket(poId);
        bindInputEvents(poId);
      }, 0);

    }

    setTimeout(scrollToBottom, 0);

    let previousRole = null;

    const messagesHtml = messages.map(m => {

      const html = renderMessage(m, previousRole);

      previousRole = resolveRole(m);

      return html;

    }).join("");

    return `
      <div class="messages-thread-container">

        <div class="messages-list" id="orderMessagesList">

          ${
            messages.length
              ? messagesHtml
              : `
                <div class="messages-empty glass-card">
                  <i data-lucide="message-circle"></i>
                  <h3>No Messages Yet</h3>
                  <p>Start a conversation regarding this PO.</p>
                </div>
              `
          }

        </div>

        <div class="message-input-bar">

          <input
            type="text"
            id="orderMessageInput"
            placeholder="Type your message..."
            autocomplete="off"
          />

          <button
            class="btn-primary"
            data-send-message
          >
            <i data-lucide="send"></i>
            Send
          </button>

        </div>

      </div>
    `;
  }

};