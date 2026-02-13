const pool = require("../config/db");

/* =========================================================
   BUYER DASHBOARD – COMMAND CENTER API
   GET /api/buyer/dashboard
========================================================= */

const getBuyerDashboard = async (req, res) => {
  try {

    if (req.user.role !== "buyer") {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const buyerId = req.user.id;

    /* =====================================================
       1️⃣ STATS QUERY
    ===================================================== */

    const statsQuery = `
      SELECT
        COUNT(*) AS total_rfqs,
        COUNT(*) FILTER (WHERE status = 'draft') AS draft_rfqs,
        COUNT(*) FILTER (WHERE status = 'active') AS active_rfqs,
        COUNT(*) FILTER (WHERE status = 'closed') AS closed_rfqs
      FROM rfqs
      WHERE buyer_id = $1
    `;

    const statsResult = await pool.query(statsQuery, [buyerId]);
    const statsRow = statsResult.rows[0];

    /* =====================================================
       2️⃣ RFQ LIST WITH COUNTS
    ===================================================== */

    const rfqQuery = `
      SELECT
        r.*,

        COUNT(DISTINCT rs.supplier_id) AS assigned_count,
        COUNT(DISTINCT q.id) AS quote_count

      FROM rfqs r

      LEFT JOIN rfq_suppliers rs
        ON rs.rfq_id = r.id

      LEFT JOIN quotes q
        ON q.rfq_id = r.id

      WHERE r.buyer_id = $1

      GROUP BY r.id
      ORDER BY r.created_at DESC
    `;

    const rfqsResult = await pool.query(rfqQuery, [buyerId]);

    /* =====================================================
       3️⃣ RECENT QUOTES
    ===================================================== */

    const recentQuotesQuery = `
      SELECT
        q.id,
        q.rfq_id,
        q.price,
        q.created_at,
        u.email AS supplier_email

      FROM quotes q

      JOIN rfqs r
        ON r.id = q.rfq_id

      JOIN users u
        ON u.id = q.supplier_id

      WHERE r.buyer_id = $1

      ORDER BY q.created_at DESC
      LIMIT 5
    `;

    const recentQuotesResult = await pool.query(
      recentQuotesQuery,
      [buyerId]
    );

    /* =====================================================
       4️⃣ PURCHASE ORDER COUNT
    ===================================================== */

    const poQuery = `
      SELECT COUNT(*) AS total_pos
      FROM purchase_orders
      WHERE buyer_id = $1
    `;

    const poResult = await pool.query(poQuery, [buyerId]);

    /* =====================================================
       RESPONSE
    ===================================================== */

    res.json({
      success: true,
      data: {
        stats: {
          total_rfqs: Number(statsRow.total_rfqs),
          draft_rfqs: Number(statsRow.draft_rfqs),
          active_rfqs: Number(statsRow.active_rfqs),
          closed_rfqs: Number(statsRow.closed_rfqs),
          total_quotes: recentQuotesResult.rows.length,
          total_pos: Number(poResult.rows[0].total_pos)
        },
        rfqs: rfqsResult.rows,
        recent_quotes: recentQuotesResult.rows
      }
    });

  } catch (error) {

    console.error("Buyer dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard"
    });
  }
};

module.exports = {
  getBuyerDashboard
};