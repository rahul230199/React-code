const express = require("express");
const router = express.Router();

const supplierController = require("./supplier.controller");
const { authenticate } = require("../../middlewares/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

/* =========================================================
   ALL SUPPLIER ROUTES REQUIRE:
   1️⃣ Valid JWT
   2️⃣ Supplier Role
========================================================= */

router.use(authenticate);
router.use(authorizeRoles("supplier"));

/* =========================================================
   RFQ MARKETPLACE
========================================================= */

// GET /api/supplier/rfqs
router.get("/rfqs", supplierController.getOpenRFQs);

// POST /api/supplier/rfqs/:rfqId/quote
router.post("/rfqs/:rfqId/quote", supplierController.submitQuote);
/* =========================================================
   SUPPLIER PURCHASE ORDERS
========================================================= */

// GET /api/supplier/purchase-orders
router.get("/purchase-orders", supplierController.getSupplierPurchaseOrders);

// POST /api/supplier/purchase-orders/:id/accept
router.post("/purchase-orders/:id/accept", supplierController.acceptPurchaseOrder);

// POST /api/supplier/purchase-orders/:poId/milestones/:milestoneId/update
router.post(
  "/purchase-orders/:poId/milestones/:milestoneId/update",
  supplierController.updateMilestone
);

module.exports = router;