/* =========================================================
AXO NETWORKS — ORDER MODAL
Reusable Enterprise Modal
========================================================= */

let modal = null;
let modalBody = null;
let escListener = null;

/* =========================================================
CREATE MODAL
========================================================= */

function createModal() {

  if (modal) return modal;

  modal = document.createElement("div");

  modal.className = "order-modal";

  modal.innerHTML = `

    <div class="order-modal-backdrop"></div>

    <div class="order-modal-container">

     <button class="order-modal-close" aria-label="Close modal">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="lucide lucide-x"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
</button>
      <div class="order-modal-body"></div>

    </div>

  `;

  document.body.appendChild(modal);

  modalBody = modal.querySelector(".order-modal-body");

  bindModalEvents();

  if (window.lucide?.createIcons) {
    window.lucide.createIcons();
  }

  return modal;

}

/* =========================================================
OPEN MODAL
========================================================= */

export function openOrderModal() {

  const el = createModal();

  el.classList.add("open");

  document.body.classList.add("modal-open");

}

/* =========================================================
SET CONTENT
========================================================= */

export function setOrderModalContent(html = "") {

  if (!modalBody) return;

  modalBody.innerHTML = html;

  if (window.lucide?.createIcons) {
    window.lucide.createIcons();
  }

}

/* =========================================================
LOADING STATE
========================================================= */

export function showOrderModalLoading() {

  if (!modalBody) return;

  modalBody.innerHTML = `

    <div class="thread-loading">

      <lottie-player
        src="/assets/lottie/dashboard-loader.json"
        background="transparent"
        speed="1"
        loop
        autoplay
        style="width:140px;height:140px;margin:auto;">
      </lottie-player>

      <p>Loading order details...</p>

    </div>

  `;

}

/* =========================================================
MODAL EVENTS
========================================================= */

function bindModalEvents() {

  if (!modal) return;

  const backdrop = modal.querySelector(".order-modal-backdrop");
  const closeBtn = modal.querySelector(".order-modal-close");

  backdrop?.addEventListener("click", closeOrderModal);
  closeBtn?.addEventListener("click", closeOrderModal);

  escListener = (e) => {

    if (e.key === "Escape") {
      closeOrderModal();
    }

  };

  document.addEventListener("keydown", escListener);

}

/* =========================================================
CLOSE MODAL
========================================================= */

export function closeOrderModal() {

  if (!modal) return;

  modal.remove();

  modal = null;
  modalBody = null;

  document.body.classList.remove("modal-open");

  if (escListener) {
    document.removeEventListener("keydown", escListener);
  }

}

/* =========================================================
DESTROY MODAL
========================================================= */

export function destroyOrderModal() {

  closeOrderModal();

}