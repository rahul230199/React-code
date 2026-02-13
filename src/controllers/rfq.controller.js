const rfqModel = require("../../models/rfq.model");
const pool = require("../config/db");

/* ======================================================
   CREATE RFQ (DRAFT)
====================================================== */
const createRFQ = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      buyer_id: req.user.id,
      status: "draft"
    };

    const rfq = await rfqModel.createRFQ(payload);

    return res.status(201).json({
      success: true,
      message: "RFQ draft created",
      data: rfq
    });

  } catch (error) {
    console.error("Create RFQ error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create RFQ"
    });
  }
};
/* ======================================================
   GET RFQS BY BUYER
====================================================== */
const getRFQsByBuyer = async (req, res) => {
  try {

    const buyerId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        r.*,

        -- Assigned suppliers count
        COUNT(DISTINCT rs.supplier_id) AS assigned_supplier_count,

        -- Quote count
        COUNT(DISTINCT q.id) AS quote_count,

        -- PO count
        COUNT(DISTINCT po.id) AS po_count,

        -- Lifecycle stage
        CASE
          WHEN r.status = 'draft' THEN 'draft'
          WHEN r.status = 'active' AND COUNT(DISTINCT po.id) = 0 THEN 'active'
          WHEN COUNT(DISTINCT po.id) > 0 THEN 'awarded'
          WHEN r.status = 'closed' THEN 'closed'
          ELSE r.status
        END AS lifecycle_stage

      FROM rfqs r

      LEFT JOIN rfq_suppliers rs
        ON rs.rfq_id = r.id

      LEFT JOIN quotes q
        ON q.rfq_id = r.id

      LEFT JOIN purchase_orders po
        ON po.rfq_id = r.id

      WHERE r.buyer_id = $1

      GROUP BY r.id

      ORDER BY r.created_at DESC;
      `,
      [buyerId]
    );

    return res.status(200).json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error("Get RFQs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch RFQs"
    });
  }
};

/* ======================================================
   ASSIGN SUPPLIERS (DRAFT ONLY)
====================================================== */
const assignSuppliersToRFQ = async (req, res) => {
  try {
    const rfqId = parseInt(req.params.id);
    const { supplierIds } = req.body;

    if (!rfqId || isNaN(rfqId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid RFQ ID"
      });
    }

    if (!Array.isArray(supplierIds) || supplierIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Supplier list required"
      });
    }

    const rfq = await rfqModel.getRFQById(rfqId);

    if (!rfq || rfq.buyer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (rfq.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Suppliers can only be assigned in draft state"
      });
    }

    await rfqModel.assignSuppliers(rfqId, supplierIds);

    return res.status(200).json({
      success: true,
      message: "Suppliers assigned successfully"
    });

  } catch (error) {
    console.error("Assign suppliers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to assign suppliers"
    });
  }
};

/* ======================================================
   PUBLISH RFQ (ONLY FROM DRAFT)
====================================================== */
const publishRFQ = async (req, res) => {
  try {
    const rfqId = parseInt(req.params.id);

    if (!rfqId || isNaN(rfqId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid RFQ ID"
      });
    }

    const rfq = await rfqModel.getRFQById(rfqId);

    if (!rfq || rfq.buyer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (rfq.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft RFQs can be published"
      });
    }

    const assignedCount = await rfqModel.countAssignedSuppliers(rfqId);

    if (assignedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "Assign at least one supplier before publishing"
      });
    }

    await rfqModel.updateStatus(rfqId, "active");

    return res.status(200).json({
      success: true,
      message: "RFQ published successfully"
    });

  } catch (error) {
    console.error("Publish RFQ error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to publish RFQ"
    });
  }
};

/* ======================================================
   CLOSE RFQ (ACTIVE OR AWARDED ONLY)
====================================================== */
const closeRFQ = async (req, res) => {
  try {
    const rfqId = parseInt(req.params.id);

    if (!rfqId || isNaN(rfqId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid RFQ ID"
      });
    }

    const rfq = await rfqModel.getRFQById(rfqId);

    if (!rfq || rfq.buyer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (!["active", "awarded"].includes(rfq.status)) {
      return res.status(400).json({
        success: false,
        message: "Only active or awarded RFQs can be closed"
      });
    }

    await rfqModel.updateStatus(rfqId, "closed");

    return res.status(200).json({
      success: true,
      message: "RFQ closed"
    });

  } catch (error) {
    console.error("Close RFQ error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to close RFQ"
    });
  }
};

/* ======================================================
   AWARD RFQ (ONLY ACTIVE)
====================================================== */
const awardRFQ = async (req, res) => {
  try {
    const rfqId = parseInt(req.params.id);
    const { supplierId } = req.body;

    if (!rfqId || isNaN(rfqId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid RFQ ID"
      });
    }

    if (!supplierId) {
      return res.status(400).json({
        success: false,
        message: "Supplier ID required"
      });
    }

    const rfq = await rfqModel.getRFQById(rfqId);

    if (!rfq || rfq.buyer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (rfq.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Only active RFQs can be awarded"
      });
    }

    await rfqModel.awardRFQ(rfqId, supplierId);

    return res.status(200).json({
      success: true,
      message: "RFQ awarded successfully"
    });

  } catch (error) {
    console.error("Award RFQ error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to award RFQ"
    });
  }
};

/* ======================================================
   GET RFQS FOR SUPPLIER
====================================================== */
const getRFQsForSupplier = async (req, res) => {
  try {
    const rfqs = await rfqModel.getRFQsForSupplier(req.user.id);

    return res.status(200).json({
      success: true,
      data: rfqs
    });

  } catch (error) {
    console.error("Get supplier RFQs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch RFQs"
    });
  }
};

/* ======================================================
   GET RFQ BY ID (STRICT ACCESS CONTROL)
====================================================== */
const getRFQById = async (req, res) => {
  try {
    const rfqId = parseInt(req.params.id);

    if (!rfqId || isNaN(rfqId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid RFQ ID"
      });
    }

    const rfq = await rfqModel.getRFQById(rfqId);

    if (!rfq) {
      return res.status(404).json({
        success: false,
        message: "RFQ not found"
      });
    }

    // Buyer access check
    if (req.user.role === "buyer") {
      if (rfq.buyer_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied"
        });
      }
    }

    // Supplier access check
    if (req.user.role === "supplier") {
      const allowed = await rfqModel.checkSupplierAccess(rfqId, req.user.id);

      if (!allowed || rfq.status === "draft") {
        return res.status(403).json({
          success: false,
          message: "Access denied"
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: rfq
    });

  } catch (error) {
    console.error("Get RFQ error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch RFQ"
    });
  }
};

module.exports = {
  createRFQ,
  getRFQsByBuyer,
  assignSuppliersToRFQ,
  publishRFQ,
  closeRFQ,
  awardRFQ,
  getRFQsForSupplier,
  getRFQById
};