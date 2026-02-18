/* =========================================================
   AXO NETWORKS — ADMIN ROUTES (ENTERPRISE STRUCTURED)
========================================================= */

const express = require("express");
const router = express.Router();

const { authenticate } = require("../../middlewares/auth.middleware");
const authorize = require("../../middlewares/authorize.middleware");
const {
  validateRequiredFields,
} = require("../../middlewares/validation.middleware");

const adminController = require("./admin.controller");
const poController = require("./admin.po.controller");
const dashboardController = require("./admin.dashboard.controller");
const analyticsController = require("./admin.analytics.controller");
/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 */

/* =========================================================
   GLOBAL ADMIN AUTHENTICATION
========================================================= */
router.use(authenticate);

/* =========================================================
   USER MANAGEMENT
========================================================= */

router.get(
  "/users",
  authorize("VIEW_USERS"),
  adminController.getAllUsers
);

router.patch(
  "/users/:id/status",
  authorize("MANAGE_USERS"),
  validateRequiredFields(["status"]),
  adminController.updateUserStatus
);

router.post(
  "/users/:id/reset-password",
  authorize("MANAGE_USERS"),
  adminController.resetUserPassword
);

/* =========================================================
   PLATFORM STATS
========================================================= */

router.get(
  "/stats",
  authorize("VIEW_STATS"),
  adminController.getPlatformStats
);

/* =========================================================
   NETWORK ACCESS REQUESTS
========================================================= */

router.get(
  "/network-access-requests",
  authorize("VIEW_NETWORK_REQUESTS"),
  adminController.getAllNetworkAccessRequests
);

router.post(
  "/network-access-requests/:id/approve",
  authorize("APPROVE_NETWORK_REQUEST"),
  validateRequiredFields(["comment"]),
  adminController.approveNetworkRequest
);

router.post(
  "/network-access-requests/:id/reject",
  authorize("REJECT_NETWORK_REQUEST"),
  validateRequiredFields(["comment"]),
  adminController.rejectNetworkRequest
);

/* =========================================================
   DISPUTES
========================================================= */

router.get(
  "/disputes",
  authorize("VIEW_DISPUTES"),
  adminController.getAllDisputes
);

router.post(
  "/purchase-orders/:poId/disputes/:disputeId/resolve",
  authorize("RESOLVE_DISPUTE"),
  validateRequiredFields(["action"]),
  adminController.resolveDispute
);

/* =========================================================
   PURCHASE ORDERS
========================================================= */

router.get(
  "/purchase-orders",
  authorize("VIEW_PO"),
  poController.getAllPurchaseOrders
);

router.get(
  "/purchase-orders/:poId",
  authorize("VIEW_PO"),
  poController.getPurchaseOrderDetails
);

router.post(
  "/purchase-orders/:poId/force-cancel",
  authorize("FORCE_PO_ACTION"),
  poController.forceCancelPurchaseOrder
);

router.post(
  "/purchase-orders/:poId/force-close",
  authorize("FORCE_PO_ACTION"),
  poController.forceClosePurchaseOrder
);

/* =========================================================
   DASHBOARD
========================================================= */

router.get(
  "/dashboard",
  authorize("VIEW_DASHBOARD"),
  dashboardController.getAdminDashboard
);

/* =========================================================
   ANALYTICS
========================================================= */

router.get(
  "/analytics/monthly-revenue",
  authorize("VIEW_ANALYTICS"),
  analyticsController.getMonthlyRevenue
);

router.get(
  "/analytics/top-suppliers",
  authorize("VIEW_ANALYTICS"),
  analyticsController.getTopSuppliers
);

router.get(
  "/analytics/conversion-rate",
  authorize("VIEW_ANALYTICS"),
  analyticsController.getConversionRate
);

router.get(
  "/analytics/dispute-ratio",
  authorize("VIEW_ANALYTICS"),
  analyticsController.getDisputeRatio
);

module.exports = router;
