const purchaseOrderModel = require("../../models/purchaseOrder.model");

/**
 * Buyer accepts quote → Create Purchase Order
 * POST /purchase-orders
 */
const createPurchaseOrder = async (req, res) => {
  try {
    const {
      rfq_id,
      quote_id,
      buyer_id,
      supplier_id,
      quantity,
      price,
    } = req.body;

    if (
      !rfq_id ||
      !quote_id ||
      !buyer_id ||
      !supplier_id ||
      !quantity ||
      !price
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const po = await purchaseOrderModel.createPurchaseOrder({
      rfq_id,
      quote_id,
      buyer_id,
      supplier_id,
      quantity,
      price,
    });

    return res.status(201).json({
      success: true,
      message: "Purchase Order issued",
      data: po,
    });
  } catch (error) {
    console.error("Create PO error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create purchase order",
    });
  }
};

/**
 * Buyer PO list
 * GET /purchase-orders/buyer/:buyer_id
 */
const getPOsByBuyer = async (req, res) => {
  try {
    const { buyer_id } = req.params;

    const pos = await purchaseOrderModel.getPOsByBuyer(buyer_id);

    return res.status(200).json({
      success: true,
      data: pos,
    });
  } catch (error) {
    console.error("Get buyer POs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch POs",
    });
  }
};

/**
 * Supplier PO list
 * GET /purchase-orders/supplier/:supplier_id
 */
const getPOsBySupplier = async (req, res) => {
  try {
    const { supplier_id } = req.params;

    const pos = await purchaseOrderModel.getPOsBySupplier(supplier_id);

    return res.status(200).json({
      success: true,
      data: pos,
    });
  } catch (error) {
    console.error("Get supplier POs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch POs",
    });
  }
};

/**
 * Get PO details
 * GET /purchase-orders/:id
 */
const getPOById = async (req, res) => {
  try {
    const { id } = req.params;

    const po = await purchaseOrderModel.getPOById(id);

    if (!po) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: po,
    });
  } catch (error) {
    console.error("Get PO error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch purchase order",
    });
  }
};

module.exports = {
  createPurchaseOrder,
  getPOsByBuyer,
  getPOsBySupplier,
  getPOById,
};
