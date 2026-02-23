/* =========================================================
   AXO NETWORKS — BUYER ROUTES (PRODUCTION HARDENED)
   Enterprise Structured | RBAC Enforced | Clean Architecture
========================================================= */

const express = require("express");
const router = express.Router();

/* =========================================================
   MIDDLEWARES
========================================================= */
const { authenticate } = require("../../middlewares/auth.middleware");
const authorize = require("../../middlewares/authorize.middleware");
const {
  validateRequiredFields,
} = require("../../middlewares/validation.middleware");

const buyerController = require("./buyer.controller");

/* =========================================================
   GLOBAL AUTHENTICATION
   - All buyer routes require valid JWT
========================================================= */
router.use(authenticate);

/* =========================================================
   DASHBOARD
========================================================= */

/**
 * GET /buyer/dashboard-stats
 * Permission: VIEW_BUYER_DASHBOARD
 */
router.get(
  "/dashboard-stats",
  authorize("VIEW_BUYER_DASHBOARD"),
  buyerController.getDashboardStats
);

/* =========================================================
   RFQ MANAGEMENT
========================================================= */

/**
 * POST /buyer/rfqs
 * Permission: CREATE_RFQ
 */
router.post(
  "/rfqs",
  authorize("CREATE_RFQ"),
  validateRequiredFields(["part_name", "quantity"]),
  buyerController.createRFQ
);

/**
 * GET /buyer/rfqs
 * Permission: VIEW_RFQ
 */
router.get(
  "/rfqs",
  authorize("VIEW_RFQ"),
  buyerController.getBuyerRFQs
);

/**
 * GET /buyer/rfqs/:rfqId/quotes
 * Permission: VIEW_RFQ
 */
router.get(
  "/rfqs/:rfqId/quotes",
  authorize("VIEW_RFQ"),
  buyerController.getQuotesForRFQ
);

/* =========================================================
   QUOTE ACTIONS
========================================================= */

/**
 * POST /buyer/quotes/:id/accept
 * Permission: ACCEPT_QUOTE
 */
router.post(
  "/quotes/:id/accept",
  authorize("ACCEPT_QUOTE"),
  buyerController.acceptQuote
);

/**
 * POST /buyer/quotes/:id/reject
 * Permission: REJECT_QUOTE
 */
router.post(
  "/quotes/:id/reject",
  authorize("REJECT_QUOTE"),
  buyerController.rejectQuote
);

/* =========================================================
   PURCHASE ORDER ACTIONS
========================================================= */
/* =========================================================
   PURCHASE ORDER VIEW ROUTES
========================================================= */

/**
 * GET /buyer/purchase-orders
 * Permission: VIEW_ORDERS
 */
router.get(
  "/purchase-orders",
  authorize("VIEW_ORDERS"),
  buyerController.getBuyerOrders
);

/**
 * GET /buyer/purchase-orders/:poId
 * Permission: VIEW_ORDERS
 */
router.get(
  "/purchase-orders/:poId",
  authorize("VIEW_ORDERS"),
  buyerController.getBuyerOrderById
);

/**
 * GET /buyer/purchase-orders/:poId/milestones
 * Permission: VIEW_ORDERS
 */
router.get(
  "/purchase-orders/:poId/milestones",
  authorize("VIEW_ORDERS"),
  buyerController.getPOMilestones
);

/**
 * GET /buyer/purchase-orders/:poId/payments
 * Permission: VIEW_ORDERS
 */
router.get(
  "/purchase-orders/:poId/payments",
  authorize("VIEW_ORDERS"),
  buyerController.getPOPayments
);

/**
 * GET /buyer/purchase-orders/:poId/events
 * Permission: VIEW_ORDERS
 */
router.get(
  "/purchase-orders/:poId/events",
  authorize("VIEW_ORDERS"),
  buyerController.getPOEvents
);

/**
 * GET /buyer/purchase-orders/:poId/pdf
 * Permission: VIEW_ORDERS
 */
router.get(
  "/purchase-orders/:poId/pdf",
  authorize("VIEW_ORDERS"),
  buyerController.generatePOPdf
);

router.post(
  "/purchase-orders/:poId/milestones/:milestoneId/request-payment",
  authorize("REQUEST_PAYMENT"),
  validateRequiredFields(["amount"]),
  buyerController.requestPayment
);
router.post(
  "/payment-requests/:id/approve",
  authorize("APPROVE_PAYMENT"),
  buyerController.approvePaymentRequest
);

router.get(
  "/notifications",
  authorize("VIEW_NOTIFICATIONS"),
  buyerController.getNotifications
);

router.post(
  "/notifications/:id/read",
  authorize("VIEW_NOTIFICATIONS"),
  buyerController.markNotificationRead
);

/* =========================================================
   ANALYTICS
========================================================= */

/**
 * GET /buyer/analytics/overview
 * Permission: VIEW_ANALYTICS
 */
router.get(
  "/analytics/overview",
  authorize("VIEW_BUYER_DASHBOARD"),
  buyerController.getAnalyticsOverview
);

/**
 * POST /buyer/purchase-orders/:poId/dispute
 * Permission: RAISE_DISPUTE
 */
router.post(
  "/purchase-orders/:poId/dispute",
  authorize("RAISE_DISPUTE"),
  validateRequiredFields(["reason"]),
  buyerController.raiseDispute
);
/* =========================================================
   EXPORT ROUTER
========================================================= */
module.exports = router;