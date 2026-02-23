/* =========================================================
   BUYER RFQ — PAGE CONTROLLER
   Enterprise Structured Flow
========================================================= */

import { RouteGuard } from "../../guards/routeGuard.js";
import BuyerRFQAPI from "./buyer-rfq.api.js";
import {
  renderRFQTable,
  renderQuotesLoading,
  renderQuotesTable,
  renderQuotesEmpty,
  renderCreateRFQModal,
  showLoadingOverlay,
  hideLoadingOverlay,
  renderConfirmModal
} from "./buyer-rfq.render.js";
import Toast from "../../core/toast.js";


/* =========================================================
   INTERNAL STATE
========================================================= */

let currentPage = 1;
let currentStatus = "";
const pageLimit = 10;

/* =========================================================
   LOAD RFQS (WITH PAGINATION + FILTER)
========================================================= */

async function loadRFQs() {

  try {

    showLoadingOverlay();

    const response = await BuyerRFQAPI.getRFQs({
      page: currentPage,
      limit: pageLimit,
      status: currentStatus
    });

    renderRFQTable({
      rfqs: response.rfqs,
      total: response.total,
      page: currentPage,
      limit: pageLimit,
      status: currentStatus
    });

    attachRFQEvents();

  } catch (error) {

    Toast.error("Failed to load RFQs");

  } finally {
    hideLoadingOverlay();
  }
}

/* =========================================================
   LOAD QUOTES
========================================================= */

async function loadQuotes(rfqId) {

  try {

    showLoadingOverlay();

    const quotes = await BuyerRFQAPI.getQuotes(rfqId);

    if (!quotes || !quotes.length) {
      renderQuotesEmpty(rfqId);
      attachBackToRFQEvent();
      return;
    }

    renderQuotesTable(quotes, rfqId);
    attachQuoteActionEvents(rfqId);
    attachBackToRFQEvent();

  } catch {

    Toast.error("Failed to load quotes");
    renderQuotesEmpty(rfqId);
    attachBackToRFQEvent();

  } finally {
    hideLoadingOverlay();
  }
}

/* =========================================================
   EVENT ATTACHMENTS
========================================================= */

function attachRFQEvents() {

  /* Pagination */
  document.getElementById("prevPageBtn")?.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      loadRFQs();
    }
  });

  document.getElementById("nextPageBtn")?.addEventListener("click", () => {
    currentPage++;
    loadRFQs();
  });

  /* Status Filter */
  document.getElementById("rfqStatusFilter")?.addEventListener("change", (e) => {
    currentStatus = e.target.value;
    currentPage = 1;
    loadRFQs();
  });

  /* Create RFQ */
  document.getElementById("createRFQBtn")?.addEventListener("click", handleCreateRFQ);

  /* View Quotes */
  document.querySelectorAll(".view-quotes-btn").forEach(btn => {
    btn.addEventListener("click", handleViewQuotes);
  });
}

function attachBackToRFQEvent() {
  document.getElementById("backToRFQBtn")?.addEventListener("click", () => {
    loadRFQs();
  });
}

/* =========================================================
   CREATE RFQ FLOW
========================================================= */

function handleCreateRFQ() {

  renderCreateRFQModal();

  const form = document.getElementById("createRFQForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const formData = new FormData(form);

    const payload = {
      part_name: formData.get("part_name")?.trim(),
      quantity: Number(formData.get("quantity")),
      material_spec: formData.get("material_spec")?.trim()
    };

    if (!payload.part_name || !payload.quantity || payload.quantity <= 0) {
      Toast.error("Please enter valid RFQ details");
      return;
    }

    try {

      showLoadingOverlay();

      await BuyerRFQAPI.createRFQ(payload);

      Toast.success("RFQ created successfully");

      document.getElementById("rfqModal")?.remove();

      currentPage = 1;
      loadRFQs();

    } catch {
      Toast.error("Failed to create RFQ");
    } finally {
      hideLoadingOverlay();
    }

  });
}

/* =========================================================
   VIEW QUOTES
========================================================= */

function handleViewQuotes(event) {
  const rfqId = event.currentTarget.getAttribute("data-id");
  if (!rfqId) return;
  loadQuotes(rfqId);
}

/* =========================================================
   QUOTE ACTIONS — ENTERPRISE SAFE FLOW
========================================================= */

function attachQuoteActionEvents(rfqId) {

  /* -------------------------
     ACCEPT QUOTE
  -------------------------- */
  document.querySelectorAll(".accept-quote-btn").forEach(btn => {

  btn.addEventListener("click", async function () {

    const quoteId = this.getAttribute("data-id");
    if (!quoteId) return;

    const buttonRef = this; // SAFE REFERENCE

    const confirmed = await renderConfirmModal({
      title: "Accept Quote",
      message: "This will create a Purchase Order and reject all other quotes.",
      confirmText: "Accept Quote",
      cancelText: "Cancel"
    });

    if (!confirmed) return;

    try {

      showLoadingOverlay();

      // disable safely
      if (buttonRef) buttonRef.disabled = true;

      await BuyerRFQAPI.acceptQuote(quoteId);

      Toast.success("Quote accepted & Purchase Order created");

      // redirect to Orders
      const ordersNav = document.querySelector('[data-page="orders"]');
      if (ordersNav) {
        ordersNav.click();
      } else {
        loadRFQs();
      }

    } catch (error) {

      if (buttonRef) buttonRef.disabled = false;
      Toast.error(error?.message || "Failed to accept quote");

    } finally {
      hideLoadingOverlay();
    }

  });

});
  /* -------------------------
     REJECT QUOTE
  -------------------------- */
  document.querySelectorAll(".reject-quote-btn").forEach(btn => {

    btn.addEventListener("click", async (event) => {

      const quoteId = event.currentTarget.getAttribute("data-id");
      if (!quoteId) return;

      const confirmed = window.confirm(
        "Reject this quote?"
      );

      if (!confirmed) return;

      try {

        showLoadingOverlay();
        event.currentTarget.disabled = true;

        await BuyerRFQAPI.rejectQuote(quoteId);

        Toast.success("Quote rejected successfully");

        loadQuotes(rfqId);

      } catch (error) {

        event.currentTarget.disabled = false;
        Toast.error(error?.message || "Failed to reject quote");

      } finally {
        hideLoadingOverlay();
      }

    });

  });

}

/* =========================================================
   INIT
========================================================= */

export async function loadRFQPage() {

  const allowed = RouteGuard.protect({
    requireAuth: true,
    role: ["buyer"],
    permission: "VIEW_RFQ"
  });

  if (allowed === false) return;

  await loadRFQs();
}