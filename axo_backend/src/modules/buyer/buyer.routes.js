/* =========================================================
   AXO NETWORKS — BUYER ROUTES (ENTERPRISE STRUCTURED)
========================================================= */

const express = require("express");
const router = express.Router();

const { authenticate } = require("../../middlewares/auth.middleware");
const authorize = require("../../middlewares/authorize.middleware");
const {
  validateRequiredFields,
} = require("../../middlewares/validation.middleware");

const buyerController = require("./buyer.controller");

/* =========================================================
   GLOBAL BUYER AUTH
========================================================= */
router.use(authenticate);

/* =========================================================
   DASHBOARD
========================================================= */
router.get(
  "/dashboard-stats",
  authorize("VIEW_BUYER_DASHBOARD"),
  buyerController.getDashboardStats
);

/* =========================================================
   RFQ MANAGEMENT
========================================================= */
router.post(
  "/rfqs",
  authorize("CREATE_RFQ"),
  validateRequiredFields(["part_name", "quantity"]),
  buyerController.createRFQ
);

router.get(
  "/rfqs",
  authorize("VIEW_RFQ"),
  buyerController.getBuyerRFQs
);

router.get(
  "/rfqs/:rfqId/quotes",
  authorize("VIEW_RFQ"),
  buyerController.getQuotesForRFQ
);

/* =========================================================
   QUOTE ACTIONS
========================================================= */
router.post(
  "/quotes/:id/accept",
  authorize("ACCEPT_QUOTE"),
  buyerController.acceptQuote
);

router.post(
  "/quotes/:id/reject",
  authorize("REJECT_QUOTE"),
  buyerController.rejectQuote
);

/* =========================================================
   PO ACTIONS
========================================================= */
router.post(
  "/purchase-orders/:poId/milestones/:milestoneId/pay",
  authorize("PAY_MILESTONE"),
  validateRequiredFields(["amount"]),
  buyerController.payMilestone
);

router.post(
  "/purchase-orders/:poId/dispute",
  authorize("RAISE_DISPUTE"),
  validateRequiredFields(["reason"]),
  buyerController.raiseDispute
);

module.exports = router;
