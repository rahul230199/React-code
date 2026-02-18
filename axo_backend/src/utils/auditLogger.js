/* =========================================================
   AXO NETWORKS — CENTRALIZED AUDIT LOGGER
   Enterprise Audit Utility Layer
========================================================= */

const EVENT_TYPES = require("../constants/eventTypes.constants");

/**
 * Logs PO Event
 * Must be called inside an existing DB transaction
 * 
 * @param {Object} client - PG client (transaction active)
 * @param {Object} options
 */
async function logPoEvent(client, options) {
  const {
    poId,
    eventType,
    description,
    actorUserId,
    organizationId,
    actorRole,
    metadata = null
  } = options;

  if (!poId || !eventType || !actorUserId) {
    throw new Error("Invalid audit log parameters");
  }

  await client.query(
    `
    INSERT INTO po_events
    (
      po_id,
      event_type,
      description,
      actor_user_id,
      organization_id,
      actor_role,
      metadata
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    `,
    [
      poId,
      eventType,
      description || null,
      actorUserId,
      organizationId || null,
      actorRole || null,
      metadata ? JSON.stringify(metadata) : null
    ]
  );
}

module.exports = {
  logPoEvent
};
