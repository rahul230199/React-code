/* =========================================================
   AXO NETWORKS — RFQ LIST TABLE (SAAS PREMIUM)
   - Card-table hybrid
   - Clean hierarchy
   - Action prominence
   - Responsive safe
========================================================= */

import { RFQState } from "../rfq.state.js";
import { refreshLucideIcons } from "../../core/buyer-icons.js";

/* =========================================================
   HELPERS
========================================================= */

const safe = (val, fallback = "-") =>
  val === undefined || val === null ? fallback : val;

const statusBadge = (status) => {

  const map = {
    open: "badge-open",
    closed: "badge-closed",
    awarded: "badge-awarded",
    cancelled: "badge-cancelled"
  };

  return `
    <span class="status-badge ${map[status] || "badge-default"}">
      ${safe(status).toUpperCase()}
    </span>
  `;
};

const priorityIndicator = (priority) => {

  const map = {
    high: "priority-high",
    urgent: "priority-urgent",
    normal: "priority-normal"
  };

  return `
    <span class="priority-indicator ${map[priority] || "priority-normal"}">
      ${safe(priority).toUpperCase()}
    </span>
  `;
};

/* =========================================================
   COMPONENT
========================================================= */

export const RFQListTable = {

  render() {

    const rfqs = RFQState.rfqs || [];

    if (!rfqs.length) {
      return `
        <div class="glass-card empty-state premium-empty">
          <i data-lucide="inbox"></i>
          <h4>No RFQs Yet</h4>
          <p>Create your first RFQ to start supplier intelligence.</p>
        </div>
      `;
    }

    const html = `
      <div class="rfq-table-wrapper glass-card">

        <div class="table-header premium-header">
          <div>
            <h3>
              <i data-lucide="clipboard-list"></i>
              RFQs
            </h3>
            <span class="muted-text">
              ${rfqs.length} total
            </span>
          </div>
        </div>

        <div class="table-container">

          <table class="premium-table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Part</th>
                <th>Quantity</th>
                <th>Priority</th>
                <th>Status</th>
                <th class="text-right">AI Intelligence</th>
              </tr>
            </thead>

            <tbody>
              ${rfqs.map(r => `
                <tr class="rfq-row">

                  <td>#${safe(r.id)}</td>

                  <td>
                    <div class="rfq-part">
                      <strong>${safe(r.part_name)}</strong>
                      ${
                        r.part_description
                          ? `<span class="muted-text">
                               ${r.part_description}
                             </span>`
                          : ""
                      }
                    </div>
                  </td>

                  <td>${safe(r.quantity)}</td>

                  <td>
                    ${priorityIndicator(r.priority)}
                  </td>

                  <td>
                    ${statusBadge(r.status)}
                  </td>

                  <td class="text-right">
                    <button class="btn-ai-action"
                            data-view="${r.id}">
                      <i data-lucide="sparkles"></i>
                      View AI
                    </button>
                  </td>

                </tr>
              `).join("")}
            </tbody>

          </table>

        </div>

      </div>
    `;

    requestAnimationFrame(() => refreshLucideIcons());

    return html;
  }
};