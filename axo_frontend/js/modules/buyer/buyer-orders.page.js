/* =========================================================
   BUYER ORDERS — PAGE CONTROLLER (PRODUCTION SAFE)
========================================================= */

import { RouteGuard } from "../../guards/routeGuard.js";
import BuyerOrdersAPI from "./buyer-orders.api.js";
import {
  renderOrdersTable,
  renderOrdersEmpty,
  renderPODetailView,
  renderDisputeModal,
  renderPaymentModal,
} from "./buyer-orders.render.js";
import {
  showLoadingOverlay,
  hideLoadingOverlay
} from "../buyer/buyer-rfq.render.js";
import Toast from "../../core/toast.js";

/* =========================================================
   INTERNAL STATE
========================================================= */

let currentPage = 1;
let currentStatus = "";
const pageLimit = 10;

/* =========================================================
   SAFE ERROR HANDLER
========================================================= */

function showError(error, fallbackMessage) {
  const message =
    error?.message && error.message.length < 150
      ? error.message
      : fallbackMessage;

  Toast.error(message || "Something went wrong");
}

/* =========================================================
   LOAD ORDERS LIST
========================================================= */

async function loadOrders() {

  try {
    showLoadingOverlay();

    const response = await BuyerOrdersAPI.getOrders({
      page: currentPage,
      limit: pageLimit,
      status: currentStatus
    });

    if (!response?.orders?.length) {
      renderOrdersEmpty();
      return;
    }

    renderOrdersTable({
      orders: response.orders,
      total: response.total,
      page: currentPage,
      limit: pageLimit
    });

    attachOrderListEvents();

  } catch (error) {
    showError(error, "Unable to load purchase orders");
  } finally {
    hideLoadingOverlay();
  }
}

/* =========================================================
   LOAD PO DETAIL
========================================================= */

async function loadPODetail(poId) {

  try {
    showLoadingOverlay();

    const [
      po,
      milestones,
      events,
      paymentData
    ] = await Promise.all([
      BuyerOrdersAPI.getOrderById(poId),
      BuyerOrdersAPI.getMilestones(poId),
      BuyerOrdersAPI.getPOAuditTrail(poId),
      BuyerOrdersAPI.getPOPayments(poId)
    ]);

    renderPODetailView({
      po,
      milestones,
      events,
      financial: paymentData
    });

    attachPODetailEvents(poId, milestones, paymentData);

  } catch (error) {
    showError(error, "Unable to load order details");
  } finally {
    hideLoadingOverlay();
  }
}

/* =========================================================
   LIST PAGE EVENTS
========================================================= */

function attachOrderListEvents() {

  document.getElementById("prevPageBtn")
    ?.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        loadOrders();
      }
    });

  document.getElementById("nextPageBtn")
    ?.addEventListener("click", () => {
      currentPage++;
      loadOrders();
    });

  document.querySelectorAll(".view-po-btn")
    .forEach(btn => {
      btn.onclick = () => {
        const poId = btn.getAttribute("data-id");
        if (poId) loadPODetail(poId);
      };
    });
}

/* =========================================================
   DETAIL PAGE EVENTS
========================================================= */

function attachPODetailEvents(poId, milestones, paymentData) {

  document.getElementById("backToOrdersBtn")
    ?.addEventListener("click", () => loadOrders());

  document.getElementById("openDisputeModalBtn")
    ?.addEventListener("click", () => {
      renderDisputeModal();
      attachDisputeForm(poId);
    });

  document.getElementById("downloadPOBtn")
  ?.addEventListener("click", async () => {

    try {
      showLoadingOverlay();

      const blob = await BuyerOrdersAPI.downloadPOPackage(poId);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `PO-${poId}-package.json`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

    } catch (error) {
      showError(error, "Unable to download enterprise package");
    } finally {
      hideLoadingOverlay();
    }

  });

  const invoiceMilestone = milestones.find(
    m => m.milestone_name === "INVOICE_RAISED" &&
         m.status === "completed"
  );

  if (invoiceMilestone && paymentData?.balance > 0) {
    document.getElementById("openPaymentModalBtn")
      ?.addEventListener("click", () => {
        renderPaymentModal(poId, paymentData.balance);
        attachPaymentForm(poId, invoiceMilestone.id);
      });
  }
}

/* =========================================================
   DISPUTE
========================================================= */

function attachDisputeForm(poId) {

  const form = document.getElementById("disputeForm");
  if (!form) return;

  form.onsubmit = async (event) => {

    event.preventDefault();

    const reason = new FormData(form).get("reason")?.trim();

    if (!reason || reason.length < 5) {
      Toast.error("Dispute reason must be at least 5 characters");
      return;
    }

    try {
      showLoadingOverlay();

      await BuyerOrdersAPI.raiseDispute(poId, reason);

      Toast.success("Dispute raised successfully");

      document.getElementById("disputeModal")?.remove();
      loadPODetail(poId);

    } catch (error) {
      showError(error, "Unable to raise dispute");
    } finally {
      hideLoadingOverlay();
    }
  };
}

/* =========================================================
   PAYMENT REQUEST
========================================================= */

function attachPaymentForm(poId, milestoneId) {

  const form = document.getElementById("paymentForm");
  if (!form) return;

  form.onsubmit = async (event) => {

    event.preventDefault();

    const amount = Number(new FormData(form).get("amount"));

    if (!amount || isNaN(amount) || amount <= 0) {
      Toast.error("Invalid payment amount");
      return;
    }

    try {
      showLoadingOverlay();

      await BuyerOrdersAPI.requestPayment(poId, milestoneId, amount);

      Toast.success("Payment request submitted");

      document.getElementById("paymentModal")?.remove();
      loadPODetail(poId);

    } catch (error) {
      showError(error, "Payment request failed");
    } finally {
      hideLoadingOverlay();
    }
  };
}

/* =========================================================
   INIT
========================================================= */

export async function loadOrdersPage() {

  const allowed = RouteGuard.protect({
    requireAuth: true,
    role: ["buyer"],
    permission: "VIEW_ORDERS"
  });

  if (allowed === false) return;

  currentPage = 1;
  await loadOrders();
}