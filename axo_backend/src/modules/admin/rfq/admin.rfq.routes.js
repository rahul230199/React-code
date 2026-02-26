/* =========================================================
   AXO NETWORKS — ADMIN RFQ ROUTES
   ENTERPRISE PROCUREMENT ROUTES
========================================================= */

const express = require("express");
const router = express.Router();

const { authenticate } = require("../../../middlewares/auth.middleware");
const authorize = require("../../../middlewares/authorize.middleware");

const rfqController = require("./admin.rfq.controller");

/* =========================================================
   GLOBAL AUTH
========================================================= */

router.use(authenticate);

/* =========================================================
   STATIC ROUTES
========================================================= */

router.get(
  "/",
  authorize("VIEW_RFQS"),
  rfqController.getAllRFQs
);

router.get(
  "/suppliers",
  authorize("VIEW_RFQS"),
  rfqController.getSuppliers
);

/* =========================================================
   DYNAMIC ROUTES
========================================================= */

router.get(
  "/:rfqId",
  authorize("VIEW_RFQS"),
  rfqController.getRFQById
);

router.post(
  "/:rfqId/assign",
  authorize("MANAGE_RFQS"),
  rfqController.assignSuppliersWithQuotes
);

router.get(
  "/:rfqId/quotes",
  authorize("VIEW_RFQS"),
  rfqController.getRFQQuotes
);

router.patch(
  "/:rfqId/award",
  authorize("MANAGE_RFQS"),
  rfqController.awardQuote
);

router.patch(
  "/:rfqId/status",
  authorize("MANAGE_RFQS"),
  rfqController.updateStatus
);

router.patch(
  "/:rfqId/visibility",
  authorize("MANAGE_RFQS"),
  rfqController.updateVisibility
);

router.get(
  "/:rfqId/suppliers",
  authorize("VIEW_RFQS"),
  rfqController.getSuppliersByRFQ
);

module.exports = router;