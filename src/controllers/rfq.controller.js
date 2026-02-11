const rfqModel = require("../../models/rfq.model");

/**
 * Create RFQ (Buyer)
 * POST /rfqs
 */
const createRFQ = async (req, res) => {
  try {
    // TEMP fallback
    req.body.buyer_id = req.body.buyer_id || req.user.id;

    const rfq = await rfqModel.createRFQ(req.body);

    return res.status(201).json({
      success: true,
      message: "RFQ created successfully",
      data: rfq
    });
  } catch (error) {
    console.error("Create RFQ error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get RFQs by Buyer
 * GET /rfqs?buyer_id=1
 */
const getRFQsByBuyer = async (req, res) => {
  try {
    const buyer_id = req.user.id;

    const rfqs = await rfqModel.getRFQsByBuyer(buyer_id);

    return res.status(200).json({
      success: true,
      data: rfqs
    });
  } catch (error) {
    console.error("Get RFQs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch RFQs"
    });
  }
};

/**
 * ✅ Get RFQs for Supplier Dashboard (REAL DATA)
 * GET /rfqs/supplier
 */
const getRFQsForSupplier = async (req, res) => {
  try {
    const supplierId = req.user.id;

    const rfqs = await rfqModel.getRFQsForSupplier(supplierId);

    return res.status(200).json({
      success: true,
      data: rfqs
    });
  } catch (error) {
    console.error("Get Supplier RFQs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch supplier RFQs"
    });
  }
};

/**
 * Get RFQ Details (Buyer / Supplier)
 * GET /rfqs/:id
 */
const getRFQById = async (req, res) => {
  try {
    const { id } = req.params;

    const rfq = await rfqModel.getRFQById(id);

    if (!rfq) {
      return res.status(404).json({
        success: false,
        message: "RFQ not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: rfq
    });
  } catch (error) {
    console.error("Get RFQ error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createRFQ,
  getRFQsByBuyer,
  getRFQsForSupplier, // 🔥 THIS IS THE KEY
  getRFQById
};

