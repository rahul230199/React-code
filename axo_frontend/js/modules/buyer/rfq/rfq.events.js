/* =========================================================
   AXO NETWORKS — RFQ EVENTS
========================================================= */

import { RFQService } from "./rfq.service.js";
import { RFQRender } from "./rfq.render.js";
import { RFQState } from "./rfq.state.js";
import { RFQCreateForm } from "./rfq.components/rfq-create.form.js";
import Toast from "../../../core/toast.js";

let isBound = false;
let boundHandler = null;

/* =========================================================
   MODAL CONTROL
========================================================= */

function openModal() {
  document.body.classList.add("modal-open");
}

function closeModal() {
  const zone = document.getElementById("rfqOverlayZone");
  if (zone) zone.innerHTML = "";
  document.body.classList.remove("modal-open");
}

/* =========================================================
   SAFE ASYNC
========================================================= */

async function safeAsync(fn) {
  try {
    await fn();
  } catch (err) {
    console.error(err);
    Toast.error(err.message || "Something went wrong");
  }
}

/* =========================================================
   MAIN EVENT CONTROLLER
========================================================= */

export const RFQEvents = {

  init() {

    if (isBound) return;

    boundHandler = async (e) => {

      const target = e.target.closest(
        "[data-view],[data-accept],[data-close],[data-submit-rfq],#rfqNewBtn,.overlay"
      );

      if (!target) return;

      /* CLOSE OVERLAY */

      if (target.classList.contains("overlay") && e.target === target) {
        closeModal();
        return;
      }

      /* NEW RFQ */

      if (target.id === "rfqNewBtn") {
        RFQRender.openCreateModal();
        openModal();
        return;
      }

      /* SUBMIT RFQ */

      if (target.dataset.submitRfq !== undefined) {

        const data = RFQCreateForm.getFormData();
        const error = RFQCreateForm.validate(data);

        if (error) {
          Toast.error(error);
          return;
        }

        await safeAsync(async () => {

          RFQRender.showLoader();

          await RFQService.createRFQ(data);

          closeModal();
          await RFQService.bootstrapDashboard();

        });

        return;
      }

      /* VIEW QUOTES */

      if (target.dataset.view) {

        await safeAsync(async () => {

          const rfqId = Number(target.dataset.view);

          RFQState.selectedRFQ = rfqId;

          RFQRender.showLoader();

          await RFQService.loadQuotes(rfqId);

          RFQRender.renderIntelligence();

          openModal();

        });

        return;
      }

      /* ACCEPT SUPPLIER */

      if (target.dataset.accept) {

        const rfqId = RFQState.selectedRFQ;
        const quoteId = target.dataset.accept;

        if (!rfqId) {
          Toast.error("RFQ not selected");
          return;
        }

        await safeAsync(async () => {

          const res =
            await RFQService.acceptQuote(rfqId, quoteId);

          RFQRender.renderPOConfirmation(res?.po);

          closeModal();

          await RFQService.bootstrapDashboard();

        });

        return;
      }

      /* CLOSE MODAL */

      if (target.dataset.close !== undefined) {
        closeModal();
        return;
      }

    };

    document.addEventListener("click", boundHandler);

    isBound = true;
  }

};

/* =========================================================
   CLEANUP EXPORT (THIS FIXES YOUR ERROR)
========================================================= */

export function cleanupRFQ() {

  if (boundHandler) {
    document.removeEventListener("click", boundHandler);
  }

  const overlay = document.getElementById("rfqOverlayZone");
  if (overlay) overlay.innerHTML = "";

  document.body.classList.remove("modal-open");

  boundHandler = null;
  isBound = false;

}
