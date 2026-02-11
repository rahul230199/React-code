const express = require("express");
const router = express.Router();

const rfqController = require("../src/controllers/rfq.controller");
const {
  authenticate,
  authorizeBuyer,
  authorizeSupplier
} = require("../middleware/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: RFQs
 *   description: Request For Quotation management
 */

/* ======================================================
   BUYER ROUTES
====================================================== */

/**
 * Create RFQ (Buyer only)
 * POST /api/rfqs
 */
router.post(
  "/",
  authenticate,
  authorizeBuyer,
  rfqController.createRFQ
);

/**
 * Get RFQs by Buyer
 * GET /api/rfqs?buyer_id=1
 */
router.get(
  "/",
  authenticate,
  authorizeBuyer,
  rfqController.getRFQsByBuyer
);

/* ======================================================
   SUPPLIER ROUTES
====================================================== */

/**
 * Get RFQs for Supplier Dashboard (REAL DATA)
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
 * Get RFQ by ID (Buyer / Supplier)
 * GET /api/rfqs/:id
 */
router.get(
  "/:id",
  authenticate,
  rfqController.getRFQById
);

module.exports = router;

