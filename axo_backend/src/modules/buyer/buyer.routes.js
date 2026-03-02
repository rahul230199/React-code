/* =========================================================
   AXO NETWORKS — BUYER ROUTES (ENTERPRISE FINAL)
   Fully Modular
   Strict Tenant Isolation
   Centralized Authentication
   Global Rate Limited
   Mounted at: /api/buyer
========================================================= */

const express = require("express");
const router = express.Router();

/* =========================================================
   MIDDLEWARES
========================================================= */

const { authenticate } = require("../../middlewares/auth.middleware");
const authorize = require("../../middlewares/authorize.middleware");
const { globalLimiter } = require("../../middlewares/rateLimit.middleware");

/* =========================================================
   MODULE ROUTES (ISOLATED DOMAINS)
========================================================= */

const buyerController = require("./buyer.controller");

const dashboardRoutes = require("./dashboard/buyer.dashboard.routes");
const ordersRoutes = require("./orders/buyer.orders.routes");
const rfqRoutes = require("./rfqs/rfq.routes");
const paymentRoutes = require("./payments/buyer.payment.routes");

/* =========================================================
   GLOBAL PROTECTION (Applied Once)
========================================================= */

router.use(authenticate);
router.use(globalLimiter);

/* =========================================================
   DOMAIN MODULES
========================================================= */

router.use("/dashboard", dashboardRoutes);
router.use("/orders", ordersRoutes);
router.use("/rfqs", rfqRoutes);
router.use("/payments", paymentRoutes);

/* =========================================================
   DASHBOARD SUPPORT (LEGACY)
========================================================= */

router.get(
  "/dashboard-stats",
  authorize("VIEW_BUYER_DASHBOARD"),
  buyerController.getDashboardStats
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
   PAYMENT REQUEST APPROVAL
========================================================= */

router.post(
  "/payment-requests/:id/approve",
  authorize("APPROVE_PAYMENT"),
  buyerController.approvePaymentRequest
);

/* =========================================================
   NOTIFICATIONS
========================================================= */

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
   ANALYTICS OVERVIEW
========================================================= */

router.get(
  "/analytics/overview",
  authorize("VIEW_ANALYTICS"),
  buyerController.getAnalyticsOverview
);

module.exports = router;