const express = require("express");
const router = express.Router();

const purchaseOrderController = require("../src/controllers/purchaseOrder.controller");

// Buyer accepts quote → Create PO
router.post("/", purchaseOrderController.createPurchaseOrder);

// Buyer PO list
router.get("/buyer/:buyer_id", purchaseOrderController.getPOsByBuyer);

// Supplier PO list
router.get("/supplier/:supplier_id", purchaseOrderController.getPOsBySupplier);

// PO details
router.get("/:id", purchaseOrderController.getPOById);

module.exports = router;
