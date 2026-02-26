/* =========================================================
   AXO EVENT LOGGER
   Central Behavioral Ledger Engine
   Phase 2 – Moat Architecture
========================================================= */

const pool = require("../config/db");

/* =========================================================
   CORE EVENT WRITER
========================================================= */

async function logEvent({
  entityType,     // 'PO', 'RFQ', 'USER'
  entityId,
  eventType,      // standardized event constant
  actorId,
  metadata = {},
  client = pool
}) {

  if (!entityType || !entityId || !eventType || !actorId) {
    throw new Error("Missing required event logging fields");
  }

  await client.query(
    `
    INSERT INTO po_events (
      entity_type,
      entity_id,
      event_type,
      actor_id,
      metadata,
      created_at
    )
    VALUES ($1, $2, $3, $4, $5, NOW())
    `,
    [
      entityType,
      entityId,
      eventType,
      actorId,
      JSON.stringify(metadata)
    ]
  );
}

/* =========================================================
   HELPER WRAPPERS (STANDARDIZED EVENTS)
========================================================= */

async function logPOAccepted(poId, actorId, client = pool) {
  return logEvent({
    entityType: "PO",
    entityId: poId,
    eventType: "PO_ACCEPTED",
    actorId,
    metadata: {},
    client
  });
}

async function logPOCancelled(poId, actorId, reason, client = pool) {
  return logEvent({
    entityType: "PO",
    entityId: poId,
    eventType: "PO_CANCELLED",
    actorId,
    metadata: { reason },
    client
  });
}

async function logMilestoneUpdate(poId, actorId, milestoneName, client = pool) {
  return logEvent({
    entityType: "PO",
    entityId: poId,
    eventType: "MILESTONE_UPDATED",
    actorId,
    metadata: { milestoneName },
    client
  });
}

async function logDeliveryConfirmed(poId, actorId, client = pool) {
  return logEvent({
    entityType: "PO",
    entityId: poId,
    eventType: "DELIVERY_CONFIRMED",
    actorId,
    metadata: {},
    client
  });
}

async function logPaymentConfirmed(poId, actorId, amount, client = pool) {
  return logEvent({
    entityType: "PO",
    entityId: poId,
    eventType: "PAYMENT_CONFIRMED",
    actorId,
    metadata: { amount },
    client
  });
}

async function logDisputeRaised(poId, actorId, disputeId, client = pool) {
  return logEvent({
    entityType: "PO",
    entityId: poId,
    eventType: "DISPUTE_RAISED",
    actorId,
    metadata: { disputeId },
    client
  });
}

async function logMessageSent(poId, actorId, client = pool) {
  return logEvent({
    entityType: "PO",
    entityId: poId,
    eventType: "MESSAGE_SENT",
    actorId,
    metadata: {},
    client
  });
}

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  logEvent,
  logPOAccepted,
  logPOCancelled,
  logMilestoneUpdate,
  logDeliveryConfirmed,
  logPaymentConfirmed,
  logDisputeRaised,
  logMessageSent
};