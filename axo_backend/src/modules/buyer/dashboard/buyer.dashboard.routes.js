const express = require("express");
const { authenticate } = require("../../../middlewares/auth.middleware");
const authorize = require("../../../middlewares/authorize.middleware");
const controller = require("./buyer.dashboard.controller");

const router = express.Router();

router.get(
  "/summary",
  authenticate,
  authorize("VIEW_BUYER_DASHBOARD"),
  controller.getDashboard
);

router.get(
  "/spend-trend",
  authenticate,
  authorize("VIEW_ANALYTICS"),
  controller.getSpendTrend
);

router.get(
  "/supplier-breakdown",
  authenticate,
  authorize("VIEW_ANALYTICS"),
  controller.getSupplierBreakdown
);

router.get(
  "/order-distribution",
  authenticate,
  authorize("VIEW_ANALYTICS"),
  controller.getOrderDistribution
);

module.exports = router;