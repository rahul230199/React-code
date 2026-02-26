/* =========================================================
   AXO NETWORKS — RELIABILITY CRON ENGINE
   Purpose:
   - Nightly recalculation of supplier reliability scores
   - Stores computed score in reliability_scores table
   - Prevents heavy live queries
   - Prepares platform for analytics + risk engine
   - Fully transaction safe
   - Enterprise production ready
========================================================= */

const pool = require("../../config/db");
const { calculateSupplierScore } = require("../../utils/reliability.service");

/* =========================================================
   RECALCULATE ALL SUPPLIERS
   Purpose:
   - Fetch all supplier organizations
   - Compute reliability score
   - Upsert into reliability_scores
========================================================= */
async function recalculateAllSupplierReliability() {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    /* -------------------------
       Fetch Supplier Organizations
    -------------------------- */
    const suppliers = await client.query(
      `
      SELECT id
      FROM organizations
      WHERE role_type = 'supplier'
      `
    );

    for (const supplier of suppliers.rows) {

      const reliability = await calculateSupplierScore(
        supplier.id,
        client
      );

      /* -------------------------
         Upsert Reliability Score
      -------------------------- */
      await client.query(
        `
        INSERT INTO reliability_scores
        (organization_id, score, calculated_at)
        VALUES ($1,$2,NOW())
        ON CONFLICT (organization_id)
        DO UPDATE SET
          score = EXCLUDED.score,
          calculated_at = NOW()
        `,
        [
          supplier.id,
          reliability.score
        ]
      );
    }

    await client.query("COMMIT");

  } catch (err) {

    await client.query("ROLLBACK");
    throw err;

  } finally {
    client.release();
  }
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  recalculateAllSupplierReliability
};