/* =========================================================
   AXO NETWORKS — PO THREAD CONTROLLER
   Purpose:
   - Handles PO-based communication between buyer & supplier
   - Enforces strict organization isolation
   - Tracks response time for reliability engine
   - Logs behavioral events (MESSAGE_SENT)
   - Fully transaction safe
   - Enterprise production ready
========================================================= */

const pool = require("../../config/db");
const AppError = require("../../utils/AppError");
const asyncHandler = require("../../utils/asyncHandler");
const eventLogger = require("../../utils/eventLogger");

/* =========================================================
   SEND MESSAGE
   Purpose:
   - Insert new message into PO thread
   - Validate user belongs to PO
   - Calculate response time delta
   - Log MESSAGE_SENT event for reliability scoring
========================================================= */
exports.sendMessage = asyncHandler(async (req, res) => {

  const poId = Number(req.params.poId);
  const message = req.body.message?.trim();
  const userId = req.user.id;
  const orgId = req.user.organization_id;

  if (!poId || isNaN(poId))
    throw new AppError("Invalid PO id", 400);

  if (!message || message.length < 1)
    throw new AppError("Message cannot be empty", 400);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /* -------------------------
       Validate PO Access
    -------------------------- */
    const poRes = await client.query(
      `SELECT id, buyer_org_id, supplier_org_id
       FROM purchase_orders
       WHERE id = $1
       FOR UPDATE`,
      [poId]
    );

    if (!poRes.rowCount)
      throw new AppError("PO not found", 404);

    const po = poRes.rows[0];

    if (![po.buyer_org_id, po.supplier_org_id].includes(orgId))
      throw new AppError("Unauthorized access to this PO", 403);

    /* -------------------------
       Fetch Last Message
       Used for response time tracking
    -------------------------- */
    const lastMessageRes = await client.query(
      `SELECT organization_id, created_at
       FROM po_messages
       WHERE po_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [poId]
    );

    let responseTimeHours = null;

    if (lastMessageRes.rowCount) {

      const lastMessage = lastMessageRes.rows[0];

      if (lastMessage.organization_id !== orgId) {
        const now = new Date();
        const previous = new Date(lastMessage.created_at);
        const diffMs = now - previous;
        responseTimeHours = diffMs / (1000 * 60 * 60);
      }
    }

    /* -------------------------
       Insert Message
    -------------------------- */
    const insertRes = await client.query(
      `INSERT INTO po_messages
       (po_id, user_id, organization_id, message, created_at)
       VALUES ($1,$2,$3,$4,NOW())
       RETURNING *`,
      [poId, userId, orgId, message]
    );

    /* -------------------------
       Log Behavioral Event
    -------------------------- */
    await eventLogger.logMessageSent(
      poId,
      userId,
      client
    );

    /* Optional: Store response time in metadata */
    if (responseTimeHours !== null) {
      await eventLogger.logEvent({
        entityType: "PO",
        entityId: poId,
        eventType: "RESPONSE_TIME_RECORDED",
        actorId: userId,
        metadata: {
          response_time_hours: responseTimeHours
        },
        client
      });
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      data: insertRes.rows[0]
    });

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});


/* =========================================================
   GET MESSAGES
   Purpose:
   - Retrieve full PO thread
   - Enforce organization isolation
   - Chronological ordering
========================================================= */
exports.getMessages = asyncHandler(async (req, res) => {

  const poId = Number(req.params.poId);
  const orgId = req.user.organization_id;

  if (!poId || isNaN(poId))
    throw new AppError("Invalid PO id", 400);

  /* -------------------------
     Validate PO Access
  -------------------------- */
  const poRes = await pool.query(
    `SELECT buyer_org_id, supplier_org_id
     FROM purchase_orders
     WHERE id = $1`,
    [poId]
  );

  if (!poRes.rowCount)
    throw new AppError("PO not found", 404);

  const po = poRes.rows[0];

  if (![po.buyer_org_id, po.supplier_org_id].includes(orgId))
    throw new AppError("Unauthorized access to this PO", 403);

  const messages = await pool.query(
    `SELECT id, user_id, organization_id, message, created_at
     FROM po_messages
     WHERE po_id = $1
     ORDER BY created_at ASC`,
    [poId]
  );

  res.status(200).json({
    success: true,
    data: messages.rows
  });

});