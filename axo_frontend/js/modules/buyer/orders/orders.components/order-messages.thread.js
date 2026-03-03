/* =========================================================
   AXO NETWORKS — ORDER MESSAGES THREAD
   Premium SaaS Chat | Role Aware | Clean UI
========================================================= */

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
   ROLE CLASS
========================================================= */

function getRoleClass(role) {
  if (role === "buyer") return "message-buyer";
  if (role === "supplier") return "message-supplier";
  return "message-admin";
}

/* =========================================================
   SINGLE MESSAGE
========================================================= */

function renderMessage(m) {

  return `
    <div class="message-item ${getRoleClass(m.role)}">

      <div class="message-bubble">

        <div class="message-content">
          ${m.message}
        </div>

        <div class="message-meta">
          <span class="message-role">
            ${m.role?.toUpperCase()}
          </span>
          <span class="message-time">
            ${formatDateTime(m.created_at)}
          </span>
        </div>

      </div>

    </div>
  `;
}

/* =========================================================
   EXPORT COMPONENT
========================================================= */

export const OrderMessagesThread = {

  render(data) {

    const { messages } = data;

    return `
      <div class="messages-thread-container">

        <!-- MESSAGE LIST -->
        <div class="messages-list"
             id="orderMessagesList">

          ${
            messages && messages.length
              ? messages.map(renderMessage).join("")
              : `
                <div class="messages-empty glass-card">
                  <i data-lucide="message-circle"></i>
                  <h3>No Messages Yet</h3>
                  <p>Start a conversation regarding this PO.</p>
                </div>
              `
          }

        </div>

        <!-- MESSAGE INPUT -->
        <div class="message-input-bar">

          <input type="text"
                 id="orderMessageInput"
                 placeholder="Type your message..."
                 autocomplete="off" />

          <button class="btn-primary"
                  data-send-message>
            <i data-lucide="send"></i>
            Send
          </button>

        </div>

      </div>
    `;
  }

};