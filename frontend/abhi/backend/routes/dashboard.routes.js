const express = require('express');
const auth = require('../middleware/auth');
const pool = require('../db');

const router = express.Router();

/**
 * @swagger
 * /api/dashboard/overview:
 *   get:
 *     summary: Dashboard overview data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data loaded
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

router.get('/overview', auth, async (req, res) => {
  const userId = req.user.id;

  try {
    /* ========= MANUFACTURER ========= */
    const manufacturerRes = await pool.query(
      `
      SELECT
        COALESCE(execution_score, 0) AS execution_score,
        COALESCE(timeline_adherence, 0) AS timeline_adherence,
        COALESCE(supplier_reliability, 0) AS supplier_reliability,
        COALESCE(quality_consistency, 0) AS quality_consistency
      FROM manufacturer_metrics
      WHERE user_id = $1
      LIMIT 1
      `,
      [userId]
    );

    /* ========= BUYER ========= */
    const buyerRes = await pool.query(
      `
      SELECT
        (SELECT COUNT(*) FROM buyer_requirements WHERE user_id = $1) AS requirements,
        (SELECT COUNT(*) FROM buyer_design_status WHERE user_id = $1) AS design_completed,
        (SELECT COUNT(*) FROM buyer_matching_status WHERE user_id = $1) AS matched
      `,
      [userId]
    );

    /* ========= SELLER ========= */
    const sellerRes = await pool.query(
      `
      SELECT
        (SELECT COUNT(*) FROM seller_rfqs WHERE user_id = $1) AS active_rfqs,
        (SELECT COUNT(*) FROM seller_quotes WHERE user_id = $1) AS quotation_status,
        (SELECT COUNT(*) FROM seller_dashboard WHERE user_id = $1) AS programs_matched
      `,
      [userId]
    );

    /* ========= ACTIVITY LOGS ========= */
    const logsRes = await pool.query(
      `
      SELECT created_at, action, status
      FROM activity_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
      `,
      [userId]
    );

    res.json({
      manufacturer: manufacturerRes.rows[0] || {},
      buyer: buyerRes.rows[0] || {},
      seller: sellerRes.rows[0] || {},
      activity_logs: logsRes.rows
    });

  } catch (err) {
    console.error('❌ DASHBOARD SQL ERROR:', err.message);
    res.status(500).json({ error: 'DASHBOARD_ERROR' });
  }
});

module.exports = router;
