const pool = require("../../config/db");

/* =========================================================
   GET OPEN RFQs (Buyer Identity Hidden)
========================================================= */
exports.getOpenRFQs = async (req, res) => {
  try {
    const supplierOrgId = req.user.organization_id;

    if (!supplierOrgId) {
      return res.status(400).json({
        success: false,
        message: "Supplier organization not found"
      });
    }

    const result = await pool.query(
      `
      SELECT
        r.id,
        r.part_name,
        r.part_description,
        r.quantity,
        r.ppap_level,
        r.design_file_url,
        r.created_at,

        -- Check if this supplier already quoted
        EXISTS (
          SELECT 1
          FROM quotes q
          WHERE q.rfq_id = r.id
          AND q.supplier_org_id = $1
        ) AS already_quoted,

        -- Count total quotes (market competition insight)
        (
          SELECT COUNT(*)
          FROM quotes q2
          WHERE q2.rfq_id = r.id
        ) AS total_quotes

      FROM rfqs r
      WHERE r.status = 'open'
      ORDER BY r.created_at DESC
      `,
      [supplierOrgId]
    );

    return res.status(200).json({
      success: true,
      message: "Open RFQs fetched successfully",
      data: result.rows
    });

  } catch (error) {
    console.error("Supplier RFQ Fetch Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/* =========================================================
   SUBMIT QUOTE
========================================================= */
exports.submitQuote = async (req, res) => {
  try {
    const supplierOrgId = req.user.organization_id;
    const { rfqId } = req.params;

    const {
      price,
      timeline_days,
      certifications,
      reliability_snapshot
    } = req.body;

    if (!price) {
      return res.status(400).json({
        success: false,
        message: "Price is required"
      });
    }

    /* 1️⃣ Check RFQ exists and is open */
    const rfqCheck = await pool.query(
      `SELECT * FROM rfqs WHERE id = $1 AND status = 'open'`,
      [rfqId]
    );

    if (rfqCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "RFQ not found or not open"
      });
    }

    /* 2️⃣ Prevent duplicate quote */
    const existingQuote = await pool.query(
      `
      SELECT id FROM quotes
      WHERE rfq_id = $1
      AND supplier_org_id = $2
      `,
      [rfqId, supplierOrgId]
    );

    if (existingQuote.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a quote for this RFQ"
      });
    }

    /* 3️⃣ Insert Quote */
    const result = await pool.query(
      `
      INSERT INTO quotes
      (rfq_id, supplier_org_id, price, timeline_days, certifications, reliability_snapshot)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        rfqId,
        supplierOrgId,
        price,
        timeline_days || null,
        certifications || null,
        reliability_snapshot || null
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Quote submitted successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Submit Quote Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};