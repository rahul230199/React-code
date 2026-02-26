const pool = require("../../config/db");

/* =========================================================
   AXO NETWORKS — GLOBAL AUDIT LOGGER
   Enterprise Safe
   - Non-blocking
   - Transaction aware
   - Defensive validation
   - Metadata sanitized
   - Size limited
   - Never throws to caller
========================================================= */

const MAX_METADATA_SIZE = 10000; // 10KB safety cap

function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") return {};

  try {
    const stringified = JSON.stringify(metadata);

    if (stringified.length > MAX_METADATA_SIZE) {
      return {
        warning: "metadata truncated",
        original_size: stringified.length
      };
    }

    return JSON.parse(stringified);
  } catch {
    return { error: "invalid metadata" };
  }
}

/**
 * Global Audit Logger
 *
 * @param {Object} options
 * @param {number} options.actorId
 * @param {string} options.actorRole
 * @param {string} options.actionType
 * @param {string} options.module
 * @param {number|null} options.entityId
 * @param {Object} options.metadata
 * @param {string|null} options.ipAddress
 * @param {Object|null} options.client (optional transaction client)
 */
async function logAudit(options = {}) {
  try {
    const {
      actorId,
      actorRole,
      actionType,
      module,
      entityId = null,
      metadata = {},
      ipAddress = null,
      client = null
    } = options;

    /* ================= REQUIRED FIELD CHECK ================= */

    if (
      !Number.isInteger(actorId) ||
      !actorRole ||
      !actionType ||
      !module
    ) {
      return; // silent fail (never break main flow)
    }

    const sanitizedMetadata = sanitizeMetadata(metadata);

    const query = `
      INSERT INTO admin_audit_logs (
        admin_user_id,
        actor_role,
        action_type,
        module,
        entity_id,
        metadata,
        ip_address,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `;

    const values = [
      actorId,
      actorRole,
      actionType,
      module,
      entityId,
      sanitizedMetadata,
      ipAddress
    ];

    if (client) {
      await client.query(query, values);
    } else {
      await pool.query(query, values);
    }

  } catch (err) {
    // NEVER throw — audit must not break business logic
    console.error("Audit logging failed:", err.message);
  }
}

module.exports = { logAudit };