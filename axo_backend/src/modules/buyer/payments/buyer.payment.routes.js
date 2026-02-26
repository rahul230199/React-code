const express = require("express");
const { authenticate } = require("../../../middlewares/auth.middleware");
const authorize = require("../../../middlewares/authorize.middleware");
const controller = require("./buyer.payment.controller");

const router = express.Router();

router.get(
  "/:poId/payments",
  authenticate,
  authorize("VIEW_ORDERS"),
  controller.getLedger
);

module.exports = router;