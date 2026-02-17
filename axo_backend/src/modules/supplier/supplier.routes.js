const express = require("express");
const router = express.Router();

const supplierController = require("./supplier.controller");
const { authenticate } = require("../../middlewares/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

/* =========================================================
   SUPPLIER ROUTES
========================================================= */

router.get(
  "/rfqs",
  authenticate,
  authorizeRoles("supplier"),
  supplierController.getOpenRFQs
);

router.post(
  "/rfqs/:rfqId/quote",
  authenticate,
  authorizeRoles("supplier"),
  supplierController.submitQuote
);

module.exports = router;