const express = require("express");
const router = express.Router();

const purchaseOrderController = require("../src/controllers/purchaseOrder.controller");

const {
  authenticate,
  authorizeBuyer,
  authorizeSupplier
} = require("../middleware/auth.middleware");

/* ======================================================
   BUYER ROUTES
====================================================== */

/**
 * Buyer accepts quote → Create PO
 * POST /api/purchase-orders
 */
router.post(
  "/",
  authenticate,
  authorizeBuyer,
  purchaseOrderController.createPurchaseOrder
);

/**
 * Buyer PO list
 * GET /api/purchase-orders/buyer
 */
router.get(
  "/buyer",
  authenticate,
  authorizeBuyer,
  purchaseOrderController.getPOsByBuyer
);


/* ======================================================
   SUPPLIER ROUTES
====================================================== */

/**
 * Supplier PO list
 * GET /api/purchase-orders/supplier
 */
router.get(
  "/supplier",
  authenticate,
  authorizeSupplier,
  purchaseOrderController.getPOsBySupplier
);


/* ======================================================
   LIFECYCLE ROUTE (CRITICAL)
====================================================== */

/**
 * Update PO Status
 * PUT /api/purchase-orders/:id/status
 */
router.put(
  "/:id/status",
  authenticate,
  purchaseOrderController.updatePOStatus
);


/* ======================================================
   SHARED ROUTES
====================================================== */

/**
 * PO details
 * GET /api/purchase-orders/:id
 */
router.get(
  "/:id",
  authenticate,
  purchaseOrderController.getPOById
);

module.exports = router;