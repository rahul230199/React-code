/* =========================================================
   AXO NETWORKS — BUYER DASHBOARD CONFIG ROUTES
   Tenant Isolated
   RBAC Enforced
   Rate Limited
   Mounted at: /api/buyer/dashboard/config
========================================================= */

const express = require("express");
const router = express.Router();

const { authenticate } = require("../../../middlewares/auth.middleware");
const authorize = require("../../../middlewares/authorize.middleware");
const { globalLimiter } = require("../../../middlewares/rateLimit.middleware");

const controller = require("./buyer.dashboard.config.controller");

/* =========================================================
   GLOBAL AUTH (Tenant Required)
========================================================= */

router.use(authenticate);

/* =========================================================
   GET CONFIG
   GET /api/buyer/dashboard/config
========================================================= */

router.get(
  "/",
  globalLimiter,
  authorize("VIEW_BUYER_DASHBOARD"),
  controller.getDashboardConfig
);

/* =========================================================
   UPDATE CONFIG
   PUT /api/buyer/dashboard/config
========================================================= */

router.put(
  "/",
  globalLimiter,
  authorize("VIEW_BUYER_DASHBOARD"),
  controller.updateDashboardConfig
);

module.exports = router;