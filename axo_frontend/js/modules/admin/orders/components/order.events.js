/* =========================================================
AXO NETWORKS — ORDER EVENTS
Render Only Component
========================================================= */

function renderEvent(event) {

  const date = event.created_at
    ? new Date(event.created_at).toLocaleString("en-IN")
    : "";

  return `
    <div class="order-event">

      <div class="order-event-type">
        ${event.event_type || "EVENT"}
      </div>

      <div class="order-event-desc">
        ${event.description || ""}
      </div>

      <div class="order-event-meta">
        ${event.actor_role || "system"} • ${date}
      </div>

    </div>
  `;

}
const list = document.querySelector("[data-order-messages]");
if(list){
  list.scrollTop = list.scrollHeight;
}
export const OrderEvents = {

  render(data = {}) {

    const events = data.events || [];

    if (!events.length) {
      return `
        <div class="timeline-empty">
          <i data-lucide="activity"></i>
          <h3>No Events Yet</h3>
          <p>System events will appear here.</p>
        </div>
      `;
    }

    return `
      <div class="order-events">
        ${events.map(renderEvent).join("")}
      </div>
    `;

  }

};