/* =========================================================
AXO NETWORKS — ORDER MESSAGES THREAD
Buyer UI Style Chat
========================================================= */

/* =========================================================
SVG ICONS
========================================================= */

const Icons = {

  send: `
  <svg xmlns="http://www.w3.org/2000/svg"
       width="18"
       height="18"
       viewBox="0 0 24 24"
       fill="none"
       stroke="currentColor"
       stroke-width="2"
       stroke-linecap="round"
       stroke-linejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
  `

};

/* =========================================================
SAFE TEXT
========================================================= */

function escapeHTML(text = "") {

  return text
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;");

}

/* =========================================================
FORMAT DATE
========================================================= */

function formatDate(date) {

  if (!date) return "";

  return new Date(date).toLocaleString("en-IN", {
    day:"2-digit",
    month:"short",
    year:"numeric",
    hour:"2-digit",
    minute:"2-digit"
  });

}

/* =========================================================
ROLE CLASS
========================================================= */

function resolveRole(msg) {

  const role =
    msg.role ||
    msg.actor_role ||
    msg.sender_role ||
    "admin";

  return String(role).toLowerCase();

}

/* =========================================================
ROLE LABEL
========================================================= */

function roleLabel(role){

  if(role === "buyer") return "BUYER";
  if(role === "supplier") return "SUPPLIER";

  return "ADMIN";

}

/* =========================================================
SINGLE MESSAGE
========================================================= */
function renderMessages(messages){

  let html = "";
  let previousRole = null;

  messages.forEach(msg => {

    const role = resolveRole(msg);

    /* IMPORTANT FIX */
    const side =
      role === "buyer"
        ? "msg-left"
        : "msg-right";

    const showMeta = role !== previousRole;

    html += `

      <div class="msg-row ${side}"
           data-msg-id="${msg.id}">

          <div class="msg-card">

              ${
                showMeta
                ? `
                <div class="msg-header">
                  <span class="msg-role">${roleLabel(role)}</span>
                  <span class="msg-time">${formatDate(msg.created_at)}</span>
                </div>
                `
                : ""
              }

              <div class="msg-text">
                ${escapeHTML(msg.message)}
              </div>

          </div>

      </div>

    `;

    previousRole = role;
console.log(msg.role, msg.organization_id);
  });

  return html;

}
/* =========================================================
EMPTY STATE
========================================================= */

function renderEmpty(){

  return `
  <div class="messages-empty">
    <h3>No Messages Yet</h3>
    <p>Start the conversation for this order.</p>
  </div>
  `;

}

/* =========================================================
MAIN COMPONENT
========================================================= */

export const OrderMessages = {

  render(data={}){

    const messages = data.messages || [];

    return `

    <div class="messages-thread">

        <div class="messages-list"
             data-order-messages>

            ${
              messages.length
              ? renderMessages(messages)
              : renderEmpty()
            }

        </div>

        <div class="messages-input-bar">

            <input
              data-order-message-input
              placeholder="Type your message..."
              autocomplete="off"
            />

            <button
              class="btn-send-message"
              data-send-message>

              ${Icons.send}

              <span>Send</span>

            </button>

        </div>

    </div>

    `;

  }

};