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

/* =========================================================
   SUPPLIER PURCHASE ORDER DASHBOARD
========================================================= */
exports.getSupplierPurchaseOrders = async (req, res) => {
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
        po.id,
        po.po_number,
        po.part_name,
        po.quantity,
        po.value,
        po.status,
        po.accepted_at,
        po.created_at,
        po.agreed_delivery_date,
        o.company_name AS buyer_company
      FROM purchase_orders po
      JOIN organizations o
        ON po.buyer_org_id = o.id
      WHERE po.supplier_org_id = $1
      ORDER BY po.created_at DESC
      `,
      [supplierOrgId]
    );

    return res.status(200).json({
      success: true,
      message: "Supplier purchase orders fetched successfully",
      data: result.rows
    });

  } catch (error) {
    console.error("Supplier PO Fetch Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/* =========================================================
   SUPPLIER ACCEPT PURCHASE ORDER (Enterprise Version - Safe)
========================================================= */
exports.acceptPurchaseOrder = async (req, res) => {
  const { id } = req.params;
  const supplierOrgId = req.user.organization_id;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /* -----------------------------------------------------
       1️⃣ Lock PO Row
    ----------------------------------------------------- */
    const poResult = await client.query(
      `SELECT * FROM purchase_orders WHERE id = $1 FOR UPDATE`,
      [id]
    );

    if (poResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Purchase order not found"
      });
    }

    const po = poResult.rows[0];

    if (po.supplier_org_id !== supplierOrgId) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (po.status !== "issued") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Only issued POs can be accepted"
      });
    }

    /* -----------------------------------------------------
       2️⃣ Prevent Duplicate Milestone Initialization
    ----------------------------------------------------- */
    const existingMilestones = await client.query(
      `SELECT id FROM po_milestones WHERE po_id = $1 LIMIT 1`,
      [id]
    );

    if (existingMilestones.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Milestones already initialized for this PO"
      });
    }

    /* -----------------------------------------------------
       3️⃣ Update PO Status
    ----------------------------------------------------- */
    await client.query(
      `UPDATE purchase_orders
       SET status = 'accepted'
       WHERE id = $1`,
      [id]
    );

    /* -----------------------------------------------------
       4️⃣ Close RFQ
    ----------------------------------------------------- */
    await client.query(
      `UPDATE rfqs
       SET status = 'closed'
       WHERE id = $1`,
      [po.rfq_id]
    );

    /* -----------------------------------------------------
       5️⃣ Create Enterprise Milestones
    ----------------------------------------------------- */
    const milestones = [
      "PO_ACCEPTED",
      "RAW_MATERIAL_ORDERED",
      "PRODUCTION_STARTED",
      "QC",
      "DISPATCH",
      "DELIVERED",
      "INVOICE_RAISED",
      "PAID"
    ];

    for (let i = 0; i < milestones.length; i++) {
      const name = milestones[i];

      await client.query(
        `
        INSERT INTO po_milestones
        (po_id, milestone_name, status, sequence_order, due_date, completed_at, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
        `,
        [
          id,
          name,
          name === "PO_ACCEPTED" ? "completed" : "pending",
          i + 1,
          po.promised_delivery_date || null,
          name === "PO_ACCEPTED" ? new Date() : null
        ]
      );
    }

    /* -----------------------------------------------------
       6️⃣ Insert Event Log
    ----------------------------------------------------- */
    await client.query(
      `
      INSERT INTO po_events (po_id, event_type, description)
      VALUES ($1, 'PO_ACCEPTED', 'Supplier accepted the purchase order')
      `,
      [id]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Purchase order accepted & milestones created successfully"
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Accept PO Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  } finally {
    client.release();
  }
};

/* =========================================================
   SUPPLIER UPDATE MILESTONE
========================================================= */
exports.updateMilestone = async (req, res) => {
  const { poId, milestoneId } = req.params;
  const { evidence_url, remarks } = req.body;
  const supplierOrgId = req.user.organization_id;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /* -----------------------------------------------------
       1️⃣ Validate PO Ownership
    ----------------------------------------------------- */
    const poResult = await client.query(
      `SELECT * FROM purchase_orders WHERE id = $1`,
      [poId]
    );

    if (poResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Purchase order not found"
      });
    }

    const po = poResult.rows[0];

    if (po.supplier_org_id !== supplierOrgId) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    /* -----------------------------------------------------
       2️⃣ Validate Milestone
    ----------------------------------------------------- */
    const milestoneResult = await client.query(
      `SELECT * FROM po_milestones
       WHERE id = $1 AND po_id = $2
       FOR UPDATE`,
      [milestoneId, poId]
    );

    if (milestoneResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Milestone not found"
      });
    }

    const milestone = milestoneResult.rows[0];

    if (milestone.status === "completed") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Milestone already completed"
      });
    }

    /* -----------------------------------------------------
   SEQUENCE VALIDATION (No Skipping Allowed)
----------------------------------------------------- */

const previousMilestones = await client.query(
  `
  SELECT id
  FROM po_milestones
  WHERE po_id = $1
    AND sequence_order < $2
    AND status != 'completed'
  `,
  [poId, milestone.sequence_order]
);

if (previousMilestones.rows.length > 0) {
  await client.query("ROLLBACK");
  return res.status(400).json({
    success: false,
    message: "Previous milestone must be completed first"
  });
}

    /* -----------------------------------------------------
       3️⃣ Update Milestone
    ----------------------------------------------------- */
    await client.query(
      `
      UPDATE po_milestones
      SET status = 'completed',
          completed_at = NOW(),
          evidence_url = $1,
          remarks = $2,
          updated_at = NOW()
      WHERE id = $3
      `,
      [
        evidence_url || null,
        remarks || null,
        milestoneId
      ]
    );

    /* -----------------------------------------------------
       4️⃣ Auto Move PO Status to in_progress
    ----------------------------------------------------- */
    if (po.status === "accepted") {
      await client.query(
        `UPDATE purchase_orders
         SET status = 'in_progress'
         WHERE id = $1`,
        [poId]
      );
    }

    /* -----------------------------------------------------
       5️⃣ Log Event
    ----------------------------------------------------- */
    await client.query(
      `
      INSERT INTO po_events (po_id, event_type, description)
      VALUES ($1, 'MILESTONE_UPDATED', $2)
      `,
      [
        poId,
        `Milestone ${milestone.milestone_name} completed by supplier`
      ]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Milestone updated successfully"
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Milestone Update Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  } finally {
    client.release();
  }
};