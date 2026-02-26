const express = require("express");
const { authenticate } = require("../../../middlewares/auth.middleware");
const authorize = require("../../../middlewares/authorize.middleware");
const controller = require("./buyer.quote.compare.controller");

const router = express.Router();

router.get(
  "/:rfqId/compare",
  authenticate,
  authorize("VIEW_RFQ"),
  controller.compare
);

module.exports = router;