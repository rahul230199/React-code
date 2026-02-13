const express = require("express");
const router = express.Router();

const rfqController = require("../src/controllers/rfq.controller");
const {
  authenticate,
  authorizeBuyer,
  authorizeSupplier
} = require("../middleware/auth.middleware");

/* ======================================================
   BUYER ROUTES
====================================================== */

/**
 * Create RFQ (Draft)
 * POST /api/rfqs
 */
router.post(
  "/",
  authenticate,
  authorizeBuyer,
  rfqController.createRFQ
);

/**
 * Get RFQs for Logged-in Buyer
 * GET /api/rfqs
 */
router.get(
  "/",
  authenticate,
  authorizeBuyer,
  rfqController.getRFQsByBuyer
);

/**
 * Assign Suppliers to RFQ
 * POST /api/rfqs/:id/assign-suppliers
 */
router.post(
  "/:id/assign-suppliers",
  authenticate,
  authorizeBuyer,
  rfqController.assignSuppliersToRFQ
);

/**
 * Publish RFQ (Make Active)
 * PUT /api/rfqs/:id/publish
 */
router.put(
  "/:id/publish",
  authenticate,
  authorizeBuyer,
  rfqController.publishRFQ
);

/**
 * Close RFQ
 * PUT /api/rfqs/:id/close
 */
router.put(
  "/:id/close",
  authenticate,
  authorizeBuyer,
  rfqController.closeRFQ
);

/**
 * Award RFQ (Select Supplier)
 * PUT /api/rfqs/:id/award
 */
router.put(
  "/:id/award",
  authenticate,
  authorizeBuyer,
  rfqController.awardRFQ
);

/* ======================================================
   SUPPLIER ROUTES
====================================================== */

/**
 * Get RFQs assigned to Supplier
 * GET /api/rfqs/supplier
 */
router.get(
  "/supplier",
  authenticate,
  authorizeSupplier,
  rfqController.getRFQsForSupplier
);

/* ======================================================
   SHARED ROUTES
====================================================== */

/**
 * Get RFQ by ID
 */
router.get(
  "/:id",
  authenticate,
  rfqController.getRFQById
);

module.exports = router;