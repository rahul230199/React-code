const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth.middleware");
const buyerDashboardController =
  require("../src/controllers/buyerDashboard.controller");

router.get(
  "/dashboard",
  authenticate,
  buyerDashboardController.getBuyerDashboard
);

module.exports = router;