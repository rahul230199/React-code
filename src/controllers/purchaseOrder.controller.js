const purchaseOrderModel = require("../../models/purchaseOrder.model");
const pool = require("../config/db");

/* =========================================================
   CREATE PURCHASE ORDER (ACCEPT QUOTE)
   Buyer Only
========================================================= */
const createPurchaseOrder = async (req, res) => {

  const client = await pool.connect();

  try {

    const buyerId = req.user.id;
    const { rfq_id, quote_id, quantity, price } = req.body;

    if (!rfq_id || !quote_id || !quantity || !price) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    await client.query("BEGIN");

    /* ---------------- Lock RFQ ---------------- */
    const rfqResult = await client.query(
      `SELECT id, buyer_id, status
       FROM rfqs
       WHERE id = $1
       FOR UPDATE`,
      [rfq_id]
    );

    if (!rfqResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "RFQ not found"
      });
    }

    const rfq = rfqResult.rows[0];

    if (rfq.buyer_id !== buyerId) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        success: false,
        message: "You do not own this RFQ"
      });
    }

    if (rfq.status !== "active") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "RFQ is not active"
      });
    }

    /* ---------------- Lock Quote ---------------- */
    const quoteResult = await client.query(
      `SELECT id, supplier_id
       FROM quotes
       WHERE id = $1
       AND rfq_id = $2
       FOR UPDATE`,
      [quote_id, rfq_id]
    );

    if (!quoteResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Quote not found for this RFQ"
      });
    }

    const quote = quoteResult.rows[0];

    /* ---------------- Prevent duplicate PO ---------------- */
    const existingPO = await client.query(
      `SELECT id FROM purchase_orders WHERE quote_id = $1`,
      [quote_id]
    );

    if (existingPO.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Purchase Order already exists"
      });
    }

    /* ---------------- Create PO ---------------- */
    const poResult = await client.query(
      `INSERT INTO purchase_orders (
        rfq_id,
        quote_id,
        buyer_id,
        supplier_id,
        quantity,
        price,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6,'issued')
      RETURNING *`,
      [
        rfq_id,
        quote_id,
        buyerId,
        quote.supplier_id,
        quantity,
        price
      ]
    );

    const purchaseOrder = poResult.rows[0];

    /* ---------------- Update quote statuses ---------------- */
    await client.query(
      `UPDATE quotes SET status = 'accepted' WHERE id = $1`,
      [quote_id]
    );

    await client.query(
      `UPDATE quotes
       SET status = 'rejected'
       WHERE rfq_id = $1
       AND id != $2`,
      [rfq_id, quote_id]
    );

    /* ---------------- Update RFQ ---------------- */
    await client.query(
      `UPDATE rfqs
       SET status = 'awarded'
       WHERE id = $1`,
      [rfq_id]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Purchase Order issued successfully",
      data: purchaseOrder
    });

  } catch (error) {

    await client.query("ROLLBACK");

    console.error("Create PO error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create purchase order"
    });

  } finally {
    client.release();
  }
};


/* =========================================================
   UPDATE PO STATUS (ENTERPRISE LIFECYCLE ENGINE)
   PUT /api/purchase-orders/:id/status
========================================================= */
const updatePOStatus = async (req, res) => {

  const client = await pool.connect();

  try {

    const poId = parseInt(req.params.id);
    const { status } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    if (isNaN(poId) || !status) {
      return res.status(400).json({
        success: false,
        message: "Invalid request"
      });
    }

    const lifecycle = {
      issued: ["confirmed"],
      confirmed: ["in_production"],
      in_production: ["shipped"],
      shipped: ["delivered"],
      delivered: ["completed"],
      completed: [],
      cancelled: []
    };

    await client.query("BEGIN");

    const poResult = await client.query(
      `SELECT id, buyer_id, supplier_id, status
       FROM purchase_orders
       WHERE id = $1
       FOR UPDATE`,
      [poId]
    );

    if (!poResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Purchase order not found"
      });
    }

    const po = poResult.rows[0];
    const currentStatus = po.status;

    /* ---------- Role Validation ---------- */

    // Supplier controls production flow
    if (["confirmed","in_production","shipped","delivered"].includes(status)) {
      if (po.supplier_id !== userId) {
        await client.query("ROLLBACK");
        return res.status(403).json({
          success: false,
          message: "Only supplier can update this stage"
        });
      }
    }

    // Buyer controls completion
    if (status === "completed") {
      if (po.buyer_id !== userId) {
        await client.query("ROLLBACK");
        return res.status(403).json({
          success: false,
          message: "Only buyer can complete PO"
        });
      }
    }

    /* ---------- Transition Validation ---------- */

    if (!lifecycle[currentStatus]?.includes(status)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: `Invalid transition from ${currentStatus} to ${status}`
      });
    }

    const updateResult = await client.query(
      `UPDATE purchase_orders
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, poId]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "PO status updated successfully",
      data: updateResult.rows[0]
    });

  } catch (error) {

    await client.query("ROLLBACK");

    console.error("Update PO status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update PO status"
    });

  } finally {
    client.release();
  }
};


/* =========================================================
   GETTERS
========================================================= */
const getPOsByBuyer = async (req, res) => {
  try {
    const pos = await purchaseOrderModel.getPOsByBuyer(req.user.id);
    return res.json({ success: true, data: pos });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch POs"
    });
  }
};

const getPOsBySupplier = async (req, res) => {
  try {
    const pos = await purchaseOrderModel.getPOsBySupplier(req.user.id);
    return res.json({ success: true, data: pos });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch POs"
    });
  }
};

const getPOById = async (req, res) => {
  try {

    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid PO ID"
      });
    }

    const po = await purchaseOrderModel.getPOById(id);

    if (!po) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found"
      });
    }

    const userId = req.user.id;
    const role = req.user.role;

    if (role !== "admin" &&
        po.buyer_id !== userId &&
        po.supplier_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    return res.json({ success: true, data: po });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch purchase order"
    });
  }
};


/* =========================================================
   EXPORTS
========================================================= */
module.exports = {
  createPurchaseOrder,
  updatePOStatus,
  getPOsByBuyer,
  getPOsBySupplier,
  getPOById
};