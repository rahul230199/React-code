/* =========================================================
   AXO NETWORKS — ORDER DISPUTE MODAL
   Glass UI | Clean UX | Production Ready
========================================================= */

export const OrderDisputeModal = {

  open() {

    const overlay = document.getElementById("ordersOverlayZone");
    if (!overlay) return;

    overlay.innerHTML = `
      <div class="modal-backdrop" data-close-modal>

        <div class="modal-container glass-card"
             onclick="event.stopPropagation()">

          <div class="modal-header">
            <h3>Raise Dispute</h3>
            <button class="modal-close"
                    data-close-modal>
              ✕
            </button>
          </div>

          <div class="modal-body">

            <label>Reason</label>

            <textarea id="orderDisputeReason"
                      placeholder="Describe the issue..."
                      rows="5"></textarea>

          </div>

          <div class="modal-footer">

            <button class="btn-outline"
                    data-close-modal>
              Cancel
            </button>

            <button class="btn-danger"
                    data-raise-dispute>
              Raise Dispute
            </button>

          </div>

        </div>

      </div>
    `;

    this.bindClose();
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