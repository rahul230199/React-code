/* =========================================================
   AXO NETWORKS — ORDER PAYMENT MODAL
   Financial Confirmation | Glass UI | Production Ready
========================================================= */

const formatCurrencyInput = (value) => {
  if (!value) return "";
  const number = Number(value.replace(/[^0-9]/g, ""));
  if (isNaN(number)) return "";
  return number.toLocaleString("en-IN");
};

export const OrderPaymentModal = {

  open(defaultAmount = "") {

    const overlay = document.getElementById("ordersOverlayZone");
    if (!overlay) return;

    overlay.innerHTML = `
      <div class="modal-backdrop" data-close-modal>

        <div class="modal-container glass-card"
             onclick="event.stopPropagation()">

          <div class="modal-header">
            <h3>Confirm Payment</h3>
            <button class="modal-close"
                    data-close-modal>
              ✕
            </button>
          </div>

          <div class="modal-body">

            <label>Amount (INR)</label>

            <div class="currency-input">
              <span class="currency-symbol">₹</span>
              <input type="text"
                     id="orderPaymentAmount"
                     placeholder="Enter amount"
                     value="${defaultAmount}"
                     autocomplete="off" />
            </div>

            <p class="modal-note">
              Please ensure the payment amount is correct before confirming.
            </p>

          </div>

          <div class="modal-footer">

            <button class="btn-outline"
                    data-close-modal>
              Cancel
            </button>

            <button class="btn-success"
                    data-confirm-payment>
              Confirm Payment
            </button>

          </div>

        </div>

      </div>
    `;

    this.bindClose();
    this.bindFormatting();
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
  },

  bindFormatting() {

    const input = document.getElementById("orderPaymentAmount");
    if (!input) return;

    input.addEventListener("input", (e) => {
      const formatted = formatCurrencyInput(e.target.value);
      e.target.value = formatted;
    });
  }

};