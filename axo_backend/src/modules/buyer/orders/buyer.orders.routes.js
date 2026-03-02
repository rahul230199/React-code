/* =========================================================
   AXO NETWORKS — BUYER ORDERS ROUTES
   Enterprise PO Intelligence Engine
   - Guardrails
   - Risk Engine
   - Reliability Mirror
   - Anomaly Detection
========================================================= */

const express = require("express");
const router = express.Router();

const authorize = require("../../../middlewares/authorize.middleware");
const { validateRequiredFields } = require("../../../middlewares/validation.middleware");

const controller = require("./buyer.orders.controller");

/* =========================================================
   LIST BUYER ORDERS
   GET /api/buyer/orders
========================================================= */
router.get(
  "/",
  authorize("VIEW_ORDERS"),
  controller.getBuyerOrders
);

/* =========================================================
   OEM RELIABILITY MIRROR
   GET /api/buyer/orders/oem/reliability
========================================================= */
router.get(
  "/oem/reliability",
  authorize("VIEW_ANALYTICS"),
  controller.getOEMReliability
);

/* =========================================================
   RISK DASHBOARD AGGREGATION
   GET /api/buyer/orders/dashboard/risk
========================================================= */
router.get(
  "/dashboard/risk",
  authorize("VIEW_ANALYTICS"),
  controller.getRiskDashboard
);

/* =========================================================
   ANOMALY DETECTION
   GET /api/buyer/orders/anomalies
========================================================= */
router.get(
  "/anomalies",
  authorize("VIEW_ANALYTICS"),
  controller.getAnomalies
);

/* =========================================================
   UPDATE PO STATUS (GUARDRAIL PROTECTED)
   POST /api/buyer/orders/:poId/status
========================================================= */
router.post(
  "/:poId/status",
  authorize("UPDATE_ORDER_STATUS"),
  validateRequiredFields(["newStatus"]),
  controller.updatePOStatus
);

/* =========================================================
   UPDATE MILESTONE (AUTO DISCIPLINE LOGGED)
   POST /api/buyer/orders/:poId/milestones
========================================================= */
router.post(
  "/:poId/milestones",
  authorize("UPDATE_MILESTONE"),
  validateRequiredFields(["milestoneName"]),
  controller.updateMilestone
);

/* =========================================================
   CONFIRM PAYMENT (TRANSACTION SAFE)
   POST /api/buyer/orders/:poId/pay
========================================================= */
router.post(
  "/:poId/pay",
  authorize("CONFIRM_PAYMENT"),
  validateRequiredFields(["amount"]),
  controller.confirmPayment
);

/* =========================================================
   RAISE DISPUTE
   POST /api/buyer/orders/:poId/dispute
========================================================= */
router.post(
  "/:poId/dispute",
  authorize("RAISE_DISPUTE"),
  validateRequiredFields(["reason"]),
  controller.raiseDispute
);

/* =========================================================
   GENERATE PO PDF
   GET /api/buyer/orders/:poId/pdf
========================================================= */
router.get(
  "/:poId/pdf",
  authorize("VIEW_ORDERS"),
  controller.generatePOPdf
);

/* =========================================================
   FULL PO THREAD (MUST BE LAST PARAM ROUTE)
   GET /api/buyer/orders/:poId
========================================================= */
router.get(
  "/:poId",
  authorize("VIEW_ORDERS"),
  controller.getOrderThread
);

module.exports = router;