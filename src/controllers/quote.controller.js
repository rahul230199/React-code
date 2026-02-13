const quoteModel = require("../../models/quote.model");
const pool = require("../config/db");
const {
  sendQuoteNotificationToBuyer
} = require("../../services/emailService");

/* =========================================================
   SUBMIT OR UPDATE QUOTE (Supplier Only)
   POST /api/quotes
========================================================= */
const submitQuote = async (req, res) => {

  const client = await pool.connect();

  try {

    if (!["supplier", "both"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only suppliers can submit quotes"
      });
    }

    const supplierId = req.user.id;
    const { rfq_id } = req.body;

    if (!rfq_id) {
      return res.status(400).json({
        success: false,
        message: "RFQ ID required"
      });
    }

    await client.query("BEGIN");

    /* -----------------------------------------------------
       CHECK RFQ EXISTS
    ----------------------------------------------------- */
    const rfqCheck = await client.query(
      `SELECT id, buyer_id, status
       FROM rfqs
       WHERE id = $1
       FOR UPDATE`,
      [rfq_id]
    );

    if (!rfqCheck.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "RFQ not found"
      });
    }

    const rfq = rfqCheck.rows[0];

    /* -----------------------------------------------------
       PREVENT QUOTING OWN RFQ
    ----------------------------------------------------- */
    if (rfq.buyer_id === supplierId) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        success: false,
        message: "You cannot quote your own RFQ"
      });
    }

    /* -----------------------------------------------------
       RFQ MUST BE ACTIVE
    ----------------------------------------------------- */
    if (rfq.status !== "active") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "RFQ is not open for quoting"
      });
    }

    /* -----------------------------------------------------
       CHECK SUPPLIER ASSIGNMENT
    ----------------------------------------------------- */
    const assigned = await quoteModel.checkSupplierAccess(
      rfq_id,
      supplierId
    );

    if (!assigned) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this RFQ"
      });
    }

    /* -----------------------------------------------------
       CREATE OR UPDATE QUOTE
    ----------------------------------------------------- */
    const quote = await quoteModel.createOrUpdateQuote({
      ...req.body,
      supplier_id: supplierId
    });

    await client.query("COMMIT");

    /* -----------------------------------------------------
       SEND EMAIL TO BUYER (NON-BLOCKING)
    ----------------------------------------------------- */
    try {
      const buyerResult = await pool.query(
        `SELECT email FROM users WHERE id = $1`,
        [rfq.buyer_id]
      );

      if (buyerResult.rows.length) {
        const buyerEmail = buyerResult.rows[0].email;

        await sendQuoteNotificationToBuyer(
          buyerEmail,
          rfq_id,
          req.user.email
        );
      }
    } catch (emailError) {
      console.error("Quote email notification failed:", emailError);
      // Do not fail main request
    }

    return res.status(200).json({
      success: true,
      message: "Quote submitted successfully",
      data: quote
    });

  } catch (error) {

    await client.query("ROLLBACK");

    console.error("Submit quote error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit quote"
    });

  } finally {
    client.release();
  }
};


/* =========================================================
   GET QUOTES FOR RFQ (Buyer Only)
   GET /api/quotes/rfq/:rfq_id
========================================================= */
const getQuotesByRFQ = async (req, res) => {

  try {

    if (req.user.role !== "buyer") {
      return res.status(403).json({
        success: false,
        message: "Only buyers can view RFQ quotes"
      });
    }

    const rfqId = parseInt(req.params.rfq_id);

    if (isNaN(rfqId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid RFQ ID"
      });
    }

    const rfqCheck = await pool.query(
      `SELECT buyer_id FROM rfqs WHERE id = $1`,
      [rfqId]
    );

    if (!rfqCheck.rows.length) {
      return res.status(404).json({
        success: false,
        message: "RFQ not found"
      });
    }

    if (rfqCheck.rows[0].buyer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const quotes = await quoteModel.getQuotesByRFQ(rfqId);

    return res.status(200).json({
      success: true,
      data: quotes
    });

  } catch (error) {

    console.error("Get quotes error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch quotes"
    });
  }
};


/* =========================================================
   GET SINGLE QUOTE (Role Based Access)
   GET /api/quotes/:id
========================================================= */
const getQuoteById = async (req, res) => {

  try {

    const quoteId = parseInt(req.params.id);

    if (isNaN(quoteId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Quote ID"
      });
    }

    const quote = await quoteModel.getQuoteById(quoteId);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: "Quote not found"
      });
    }

    const userId = req.user.id;
    const role = req.user.role;

    /* ---------------- ADMIN ---------------- */
    if (role === "admin") {
      return res.json({ success: true, data: quote });
    }

    /* ---------------- SUPPLIER ---------------- */
    if (["supplier", "both"].includes(role)) {
      if (quote.supplier_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied"
        });
      }
    }

    /* ---------------- BUYER ---------------- */
    if (role === "buyer") {
      const rfqCheck = await pool.query(
        `SELECT buyer_id FROM rfqs WHERE id = $1`,
        [quote.rfq_id]
      );

      if (
        !rfqCheck.rows.length ||
        rfqCheck.rows[0].buyer_id !== userId
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied"
        });
      }
    }

    return res.json({
      success: true,
      data: quote
    });

  } catch (error) {

    console.error("Get quote error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch quote"
    });
  }
};


module.exports = {
  submitQuote,
  getQuotesByRFQ,
  getQuoteById
};