/* =========================================================
   AXO NETWORKS — ADMIN DASHBOARD CONTROLLER (ENTERPRISE)
========================================================= */

const pool = require("../../config/db");
const asyncHandler = require("../../utils/asyncHandler");

/* =========================================================
   GET ADMIN KPI DASHBOARD
========================================================= */
exports.getAdminDashboard = asyncHandler(async (req, res) => {
  /* =====================================================
     RUN ALL QUERIES IN PARALLEL (PERFORMANCE OPTIMIZED)
  ===================================================== */
  const [
    usersResult,
    orgResult,
    rfqResult,
    poResult,
    disputeResult,
    paymentResult,
  ] = await Promise.all([
    pool.query(`SELECT COUNT(*)::INT AS total FROM users`),

    pool.query(`SELECT COUNT(*)::INT AS total FROM organizations`),

    pool.query(`
      SELECT
        COUNT(*)::INT AS total_rfqs,
        COUNT(*) FILTER (WHERE status = 'open')::INT AS open_rfqs,
        COUNT(*) FILTER (WHERE status = 'closed')::INT AS closed_rfqs
      FROM rfqs
    `),

    pool.query(`
      SELECT
        COUNT(*)::INT AS total_pos,
        COUNT(*) FILTER (WHERE status = 'issued')::INT AS issued_pos,
        COUNT(*) FILTER (WHERE status = 'accepted')::INT AS accepted_pos,
        COUNT(*) FILTER (WHERE status = 'in_progress')::INT AS in_progress_pos,
        COUNT(*) FILTER (WHERE status = 'completed')::INT AS completed_pos,
        COUNT(*) FILTER (WHERE status = 'disputed')::INT AS disputed_pos
      FROM purchase_orders
    `),

    pool.query(`
      SELECT
        COUNT(*)::INT AS total_disputes,
        COUNT(*) FILTER (WHERE status = 'pending')::INT AS pending_disputes,
        COUNT(*) FILTER (WHERE status = 'resolved')::INT AS resolved_disputes,
        COUNT(*) FILTER (WHERE status = 'rejected')::INT AS rejected_disputes
      FROM po_disputes
    `),

    pool.query(`
      SELECT COALESCE(SUM(amount),0)::NUMERIC AS total_payment_value
      FROM payments
      WHERE status = 'paid'
    `),
  ]);

  /* =====================================================
     STRUCTURED RESPONSE
  ===================================================== */
  res.status(200).json({
    success: true,
    message: "Admin dashboard fetched successfully",
    data: {
      total_users: usersResult.rows[0].total,
      total_organizations: orgResult.rows[0].total,

      rfqs: rfqResult.rows[0],

      purchase_orders: poResult.rows[0],

      disputes: disputeResult.rows[0],

      total_payment_value:
        paymentResult.rows[0].total_payment_value,
    },
  });
});
