/* =========================================================
   AXO NETWORKS — BUYER DASHBOARD ROUTES (ENTERPRISE FINAL)
   Fully Dynamic
   Strict Tenant Isolation
   RBAC Enforced
   Rate Limited
   Mounted at: /api/buyer/dashboard
========================================================= */

const express = require("express");
const { authenticate } = require("../../../middlewares/auth.middleware");
const authorize = require("../../../middlewares/authorize.middleware");
const { globalLimiter } = require("../../../middlewares/rateLimit.middleware");

const controller = require("./buyer.dashboard.controller");
const configRoutes = require("./buyer.dashboard.config.routes");

const router = express.Router();

/* =========================================================
   GLOBAL PROTECTION FOR ENTIRE DASHBOARD MODULE
========================================================= */

router.use(authenticate);
router.use(globalLimiter);

/* =========================================================
   DASHBOARD SUMMARY
   GET /api/buyer/dashboard/summary
========================================================= */

router.get(
  "/summary",
  authorize("VIEW_BUYER_DASHBOARD"),
  controller.getDashboard
);

/* =========================================================
   SPEND TREND (Analytics)
========================================================= */

router.get(
  "/spend-trend",
  authorize("VIEW_ANALYTICS"),
  controller.getSpendTrend
);

/* =========================================================
   SUPPLIER BREAKDOWN
========================================================= */

router.get(
  "/supplier-breakdown",
  authorize("VIEW_ANALYTICS"),
  controller.getSupplierBreakdown
);

/* =========================================================
   DASHBOARD CONFIG (Nested Module)
   /api/buyer/dashboard/config
========================================================= */

router.use(
  "/config",
  authorize("VIEW_BUYER_DASHBOARD"),
  configRoutes
);

module.exports = router;