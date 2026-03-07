/* =========================================================
   AXO NETWORKS — EVENT LOGGER
========================================================= */

const pool = require("../config/db");

/* =========================================================
   CORE EVENT WRITER
========================================================= */

async function logEvent({
  poId = null,
  eventType,
  actorId,
  client = pool
}) {

  try {

    if (!eventType || !actorId) {
      throw new Error("Missing required event logging fields");
    }

    await client.query(
      `
      INSERT INTO po_events (
        po_id,
        event_type,
        created_by
      )
      VALUES ($1,$2,$3)
      `,
      [
        poId,
        eventType,
        actorId
      ]
    );

  } catch (err) {

    console.error("AXO EVENT LOGGER FAILURE:", {
      poId,
      eventType,
      actorId,
      error: err.message
    });

  }

}

/* =========================================================
   HELPER WRAPPERS
========================================================= */

async function logPOAccepted(poId, actorId, client = pool) {
  return logEvent({
    poId,
    eventType: "PO_ACCEPTED",
    actorId,
    client
  });
}

async function logPOCancelled(poId, actorId, client = pool) {
  return logEvent({
    poId,
    eventType: "PO_CANCELLED",
    actorId,
    client
  });
}

async function logMilestoneUpdate(poId, actorId, client = pool) {
  return logEvent({
    poId,
    eventType: "MILESTONE_UPDATED",
    actorId,
    client
  });
}

async function logDeliveryConfirmed(poId, actorId, client = pool) {
  return logEvent({
    poId,
    eventType: "DELIVERY_CONFIRMED",
    actorId,
    client
  });
}

async function logPaymentConfirmed(poId, actorId, client = pool) {
  return logEvent({
    poId,
    eventType: "PAYMENT_CONFIRMED",
    actorId,
    client
  });
}

async function logDisputeRaised(poId, actorId, client = pool) {
  return logEvent({
    poId,
    eventType: "DISPUTE_RAISED",
    actorId,
    client
  });
}

async function logMessageSent(poId, actorId, client = pool) {
  return logEvent({
    poId,
    eventType: "PO_THREAD_MESSAGE_SENT",
    actorId,
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
