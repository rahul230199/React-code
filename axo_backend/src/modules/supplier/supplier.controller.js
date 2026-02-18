/* =========================================================
   AXO NETWORKS — SUPPLIER CONTROLLER (ENTERPRISE)
========================================================= */

const pool = require("../../config/db");
const PO_STATUS = require("../../constants/poStatus.constants");
const EVENT_TYPES = require("../../constants/eventTypes.constants");
const { logPoEvent } = require("../../utils/auditLogger");
const AppError = require("../../utils/AppError");
const asyncHandler = require("../../utils/asyncHandler");

/* =========================================================
   GET OPEN RFQs
========================================================= */
exports.getOpenRFQs = asyncHandler(async (req, res) => {
  const supplierOrgId = req.user.organization_id;

  if (!supplierOrgId)
    throw new AppError("Supplier organization not found", 400);

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
      EXISTS (
        SELECT 1 FROM quotes q
        WHERE q.rfq_id = r.id
        AND q.supplier_org_id = $1
      ) AS already_quoted,
      (
        SELECT COUNT(*)
        FROM quotes q2
        WHERE q2.rfq_id = r.id
      )::INT AS total_quotes
    FROM rfqs r
    WHERE r.status = 'open'
    ORDER BY r.created_at DESC
    `,
    [supplierOrgId]
  );

  res.status(200).json({
    success: true,
    message: "Open RFQs fetched successfully",
    data: result.rows
  });
});

/* =========================================================
   SUBMIT QUOTE
========================================================= */
exports.submitQuote = asyncHandler(async (req, res) => {
  const supplierOrgId = req.user.organization_id;
  const { rfqId } = req.params;
  const { price, timeline_days, certifications, reliability_snapshot } = req.body;

  if (!supplierOrgId)
    throw new AppError("Supplier organization not found", 400);

  const rfqCheck = await pool.query(
    `SELECT id FROM rfqs WHERE id = $1 AND status = 'open'`,
    [rfqId]
  );

  if (rfqCheck.rowCount === 0)
    throw new AppError("RFQ not found or not open", 400);

  const existingQuote = await pool.query(
    `SELECT id FROM quotes WHERE rfq_id = $1 AND supplier_org_id = $2`,
    [rfqId, supplierOrgId]
  );

  if (existingQuote.rowCount > 0)
    throw new AppError(
      "You have already submitted a quote for this RFQ",
      400
    );

  const result = await pool.query(
    `
    INSERT INTO quotes
    (rfq_id, supplier_org_id, price,
     timeline_days, certifications, reliability_snapshot)
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

  res.status(201).json({
    success: true,
    message: "Quote submitted successfully",
    data: result.rows[0]
  });
});


/* =========================================================
   GET SUPPLIER PURCHASE ORDERS
========================================================= */
exports.getSupplierPurchaseOrders = asyncHandler(async (req, res) => {
  const supplierOrgId = req.user.organization_id;

  if (!supplierOrgId)
    throw new AppError("Supplier organization not found", 400);

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

  res.status(200).json({
    success: true,
    message: "Supplier purchase orders fetched successfully",
    data: result.rows
  });
});


/* =========================================================
   ACCEPT PURCHASE ORDER
========================================================= */
exports.acceptPurchaseOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const supplierOrgId = req.user.organization_id;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const poResult = await client.query(
      `SELECT * FROM purchase_orders WHERE id = $1 FOR UPDATE`,
      [id]
    );

    if (poResult.rowCount === 0)
      throw new AppError("Purchase order not found", 404);

    const po = poResult.rows[0];

    if (po.supplier_org_id !== supplierOrgId)
      throw new AppError("Unauthorized", 403);

    if (po.status === PO_STATUS.DISPUTED)
      throw new AppError("Cannot accept disputed PO", 400);

    if (po.status !== PO_STATUS.ISSUED)
      throw new AppError("Only issued POs can be accepted", 400);

    const existingMilestones = await client.query(
      `SELECT id FROM po_milestones WHERE po_id = $1 LIMIT 1`,
      [id]
    );

    if (existingMilestones.rowCount > 0)
      throw new AppError("Milestones already initialized", 400);

    await client.query(
      `UPDATE purchase_orders SET status = $1 WHERE id = $2`,
      [PO_STATUS.ACCEPTED, id]
    );

    await client.query(
      `UPDATE rfqs SET status = 'closed' WHERE id = $1`,
      [po.rfq_id]
    );

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
      await client.query(
        `
        INSERT INTO po_milestones
        (po_id, milestone_name, status,
         sequence_order, created_at, updated_at)
        VALUES ($1,$2,$3,$4,NOW(),NOW())
        `,
        [
          id,
          milestones[i],
          milestones[i] === "PO_ACCEPTED" ? "completed" : "pending",
          i + 1
        ]
      );
    }

    await logPoEvent(client, {
      poId: id,
      eventType: EVENT_TYPES.PO_ACCEPTED,
      description: "Supplier accepted the purchase order",
      actorUserId: req.user.id,
      organizationId: supplierOrgId,
      actorRole: req.user.role,
      metadata: {
        po_number: po.po_number,
        rfq_id: po.rfq_id
      }
    });

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Purchase order accepted & milestones initialized"
    });

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});


/* =========================================================
   UPDATE MILESTONE
========================================================= */
exports.updateMilestone = asyncHandler(async (req, res) => {
  const { poId, milestoneId } = req.params;
  const { evidence_url, remarks } = req.body;

  const supplierOrgId = req.user.organization_id;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const poResult = await client.query(
      `SELECT * FROM purchase_orders WHERE id = $1 FOR UPDATE`,
      [poId]
    );

    if (poResult.rowCount === 0)
      throw new AppError("Purchase order not found", 404);

    const po = poResult.rows[0];

    if (po.supplier_org_id !== supplierOrgId)
      throw new AppError("Unauthorized", 403);

    if (po.status === PO_STATUS.DISPUTED)
      throw new AppError("PO is under dispute", 400);

    const milestoneResult = await client.query(
      `SELECT * FROM po_milestones
       WHERE id = $1 AND po_id = $2 FOR UPDATE`,
      [milestoneId, poId]
    );

    if (milestoneResult.rowCount === 0)
      throw new AppError("Milestone not found", 404);

    const milestone = milestoneResult.rows[0];

    if (milestone.milestone_name === "PAID")
      throw new AppError("PAID milestone is system-controlled", 400);

    if (milestone.status === "completed")
      throw new AppError("Milestone already completed", 400);

    const previousMilestones = await client.query(
      `
      SELECT id FROM po_milestones
      WHERE po_id = $1
        AND sequence_order < $2
        AND status != 'completed'
      `,
      [poId, milestone.sequence_order]
    );

    if (previousMilestones.rowCount > 0)
      throw new AppError(
        "Previous milestone must be completed first",
        400
      );

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
      [evidence_url || null, remarks || null, milestoneId]
    );

    if (po.status === PO_STATUS.ACCEPTED) {
      await client.query(
        `UPDATE purchase_orders SET status = $1 WHERE id = $2`,
        [PO_STATUS.IN_PROGRESS, poId]
      );
    }

    const pendingCheck = await client.query(
      `SELECT id FROM po_milestones
       WHERE po_id = $1 AND status != 'completed'`,
      [poId]
    );

    if (pendingCheck.rowCount === 0) {
      await client.query(
        `UPDATE purchase_orders SET status = $1 WHERE id = $2`,
        [PO_STATUS.COMPLETED, poId]
      );

      await logPoEvent(client, {
        poId,
        eventType: EVENT_TYPES.PO_COMPLETED,
        description: "Purchase order automatically marked as completed",
        actorUserId: req.user.id,
        organizationId: supplierOrgId,
        actorRole: req.user.role,
        metadata: {
          completion_triggered_by_milestone:
            milestone.milestone_name
        }
      });
    }

    await logPoEvent(client, {
      poId,
      eventType: EVENT_TYPES.MILESTONE_UPDATED,
      description: `Milestone ${milestone.milestone_name} completed by supplier`,
      actorUserId: req.user.id,
      organizationId: supplierOrgId,
      actorRole: req.user.role,
      metadata: {
        milestone_id: milestoneId,
        milestone_name: milestone.milestone_name,
        evidence_url: evidence_url || null
      }
    });

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Milestone updated successfully"
    });

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});
