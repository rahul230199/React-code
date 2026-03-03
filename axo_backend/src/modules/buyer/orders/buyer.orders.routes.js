/* =========================================================
   AXO NETWORKS — ORDERS ROUTES (FINAL ENTERPRISE)
   SLA Integrated | Milestone Driven | Message Enabled
   Fully Aligned With Controller + Service
========================================================= */

const express = require("express");
const router = express.Router();

const authorize = require("../../../middlewares/authorize.middleware");
const { validateRequiredFields } = require("../../../middlewares/validation.middleware");

const controller = require("./buyer.orders.controller");

/* =========================================================
   LIST ORDERS (ROLE AWARE)
   GET /api/orders
========================================================= */
router.get(
  "/",
  authorize("VIEW_ORDERS"),
  controller.getOrders
);

/* =========================================================
   SLA DASHBOARD (ROLE AWARE)
   GET /api/orders/sla/dashboard
========================================================= */
router.get(
  "/sla/dashboard",
  authorize("VIEW_ANALYTICS"),
  controller.getSLADashboard
);

/* =========================================================
   SLA RISK — SINGLE PO
   GET /api/orders/:poId/sla-risk
========================================================= */
router.get(
  "/:poId/sla-risk",
  authorize("VIEW_ANALYTICS"),
  controller.getSLARisk
);

/* =========================================================
   UPDATE PO STATUS
   POST /api/orders/:poId/status
========================================================= */
router.post(
  "/:poId/status",
  authorize("UPDATE_ORDER_STATUS"),
  validateRequiredFields(["newStatus"]),
  controller.updatePOStatus
);

/* =========================================================
   COMPLETE MILESTONE
   POST /api/orders/:poId/milestones/complete
========================================================= */
router.post(
  "/:poId/milestones/complete",
  authorize("UPDATE_MILESTONE"),
  validateRequiredFields(["milestoneName"]),
  controller.completeMilestone
);

/* =========================================================
   SEND MESSAGE (PO THREAD)
   POST /api/orders/:poId/messages
========================================================= */
router.post(
  "/:poId/messages",
  authorize("SEND_MESSAGE"),
  validateRequiredFields(["message"]),
  controller.sendMessage
);

/* =========================================================
   CONFIRM PAYMENT
   POST /api/orders/:poId/pay
========================================================= */
router.post(
  "/:poId/pay",
  authorize("CONFIRM_PAYMENT"),
  validateRequiredFields(["amount"]),
  controller.confirmPayment
);

/* =========================================================
   RAISE DISPUTE
   POST /api/orders/:poId/dispute
========================================================= */
router.post(
  "/:poId/dispute",
  authorize("RAISE_DISPUTE"),
  validateRequiredFields(["reason"]),
  controller.raiseDispute
);

/* =========================================================
   GENERATE PO PDF DATA
   GET /api/orders/:poId/pdf
========================================================= */
router.get(
  "/:poId/pdf",
  authorize("VIEW_ORDERS"),
  controller.generatePOPdf
);

/* =========================================================
   FULL PO THREAD (MUST BE LAST PARAM ROUTE)
   GET /api/orders/:poId
========================================================= */
router.get(
  "/:poId",
  authorize("VIEW_ORDERS"),
  controller.getOrderThread
);

module.exports = router;