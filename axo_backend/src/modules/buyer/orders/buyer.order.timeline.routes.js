const express = require("express");
const { authenticate } = require("../../../middlewares/auth.middleware");
const authorize = require("../../../middlewares/authorize.middleware");
const controller = require("./buyer.order.timeline.controller");

const router = express.Router();

router.get(
  "/:poId/timeline",
  authenticate,
  authorize("VIEW_ORDERS"),
  controller.getTimeline
);

module.exports = router;