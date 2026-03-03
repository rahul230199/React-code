/* =========================================================
   AXO NETWORKS — ORDER PDF PREVIEW
   Document Style | Readable Layout | Glass Modal
========================================================= */

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN");
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);

export const OrderPDFPreview = {

  open(data) {

    if (!data) return;

    const overlay = document.getElementById("ordersOverlayZone");
    if (!overlay) return;

    overlay.innerHTML = `
      <div class="modal-backdrop" data-close-modal>

        <div class="modal-container large glass-card"
             onclick="event.stopPropagation()">

          <div class="modal-header">
            <h3>PO Document Preview</h3>
            <button class="modal-close"
                    data-close-modal>
              ✕
            </button>
          </div>

          <div class="modal-body pdf-preview">

            ${this.renderPO(data.po)}

            ${this.renderMilestones(data.milestones)}

            ${this.renderPayments(data.payments)}

            ${this.renderDisputes(data.disputes)}

          </div>

          <div class="modal-footer">
            <button class="btn-outline"
                    data-close-modal>
              Close
            </button>
          </div>

        </div>

      </div>
    `;

    this.bindClose();
  },

  renderPO(po) {
    return `
      <div class="pdf-section">

        <h4>Purchase Order</h4>

        <div class="pdf-grid">

          <div>
            <span>PO Number</span>
            <strong>${po.po_number}</strong>
          </div>

          <div>
            <span>Status</span>
            <strong>${po.status}</strong>
          </div>

          <div>
            <span>Value</span>
            <strong>${formatCurrency(po.value)}</strong>
          </div>

          <div>
            <span>Created</span>
            <strong>${formatDate(po.created_at)}</strong>
          </div>

          <div>
            <span>Promised Delivery</span>
            <strong>${formatDate(po.promised_delivery_date)}</strong>
          </div>

          <div>
            <span>Actual Delivery</span>
            <strong>${formatDate(po.actual_delivery_date)}</strong>
          </div>

        </div>

      </div>
    `;
  },

  renderMilestones(milestones = []) {

    if (!milestones.length) return "";

    return `
      <div class="pdf-section">

        <h4>Milestones</h4>

        <ul class="pdf-list">
          ${milestones.map(m => `
            <li>
              <strong>${m.milestone_name}</strong>
              — ${m.status}
              (Due: ${formatDate(m.due_date)})
            </li>
          `).join("")}
        </ul>

      </div>
    `;
  },

  renderPayments(payments = []) {

    if (!payments.length) return "";

    return `
      <div class="pdf-section">

        <h4>Payments</h4>

        <ul class="pdf-list">
          ${payments.map(p => `
            <li>
              ${formatCurrency(p.amount)}
              — ${formatDate(p.created_at)}
            </li>
          `).join("")}
        </ul>

      </div>
    `;
  },

  renderDisputes(disputes = []) {

    if (!disputes.length) return "";

    return `
      <div class="pdf-section">

        <h4>Disputes</h4>

        <ul class="pdf-list">
          ${disputes.map(d => `
            <li>
              ${d.reason}
              — ${formatDate(d.created_at)}
            </li>
          `).join("")}
        </ul>

      </div>
    `;
  },

  close() {
    const overlay = document.getElementById("ordersOverlayZone");
    if (overlay) overlay.innerHTML = "";
  },

  bindClose() {

    const overlay = document.getElementById("ordersOverlayZone");
    if (!overlay) return;

    overlay.addEventListener("click", (e) => {
      if (e.target.dataset.closeModal !== undefined) {
        this.close();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.close();
      }
    }, { once: true });
  }

};