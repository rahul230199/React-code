/* =========================================================
   AXO NETWORKS — BUYER RFQ REPOSITORY
   Enterprise AI Infrastructure Layer
   Pure SQL — No Business Logic
========================================================= */

/* =========================================================
   CREATE RFQ
========================================================= */
const insertRFQ = async (client, data) => {
  const result = await client.query(
    `
    INSERT INTO rfqs
    (
      buyer_org_id,
      part_name,
      part_description,
      quantity,
      ppap_level,
      design_file_url,
      visibility_type,
      priority,
      assigned_supplier_org_id,
      status,
      created_at,
      updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'open',NOW(),NOW())
    RETURNING *
    `,
    [
      data.organizationId,
      data.part_name,
      data.part_description,
      data.quantity,
      data.ppap_level,
      data.design_file_url,
      data.visibility_type,
      data.priority,
      data.assigned_supplier_org_id
    ]
  );

  return result.rows[0];
};

/* =========================================================
   LOCK RFQ
========================================================= */
const getRFQForUpdate = async (client, rfqId, organizationId) => {
  const result = await client.query(
    `
    SELECT *
    FROM rfqs
    WHERE id = $1
      AND buyer_org_id = $2
    FOR UPDATE
    `,
    [rfqId, organizationId]
  );

  return result.rows[0] || null;
};

/* =========================================================
   LOCK QUOTE FOR ACCEPTANCE
========================================================= */
const getQuoteForUpdate = async (client, quoteId) => {
  const result = await client.query(
    `
    SELECT *
    FROM quotes
    WHERE id = $1
    FOR UPDATE
    `,
    [quoteId]
  );

  return result.rows[0] || null;
};

/* =========================================================
   CLOSE RFQ WITH WINNER
========================================================= */
const closeRFQWithWinner = async (client, rfqId, quoteId) => {
  await client.query(
    `
    UPDATE rfqs
    SET status = 'closed',
        selected_quote_id = $2,
        updated_at = NOW()
    WHERE id = $1
    `,
    [rfqId, quoteId]
  );
};

/* =========================================================
   REJECT OTHER QUOTES
========================================================= */
const rejectOtherQuotes = async (client, rfqId, winnerQuoteId) => {
  await client.query(
    `
    UPDATE quotes
    SET status = 'rejected',
        updated_at = NOW()
    WHERE rfq_id = $1
      AND id != $2
    `,
    [rfqId, winnerQuoteId]
  );
};

/* =========================================================
   MARK WINNER ACCEPTED
========================================================= */
const markQuoteAccepted = async (client, quoteId) => {
  await client.query(
    `
    UPDATE quotes
    SET status = 'accepted',
        updated_at = NOW()
    WHERE id = $1
    `,
    [quoteId]
  );
};

/* =========================================================
   DECISION LOGGING
========================================================= */
const insertDecisionLog = async (
  client,
  {
    rfqId,
    selectedQuoteId,
    scoringVersion,
    scoringSnapshot,
    buyerPreferenceSnapshot,
    decidedBy
  }
) => {

  await client.query(
    `
    INSERT INTO rfq_decision_logs
    (
      rfq_id,
      selected_quote_id,
      scoring_version,
      scoring_snapshot,
      buyer_preference_snapshot,
      decided_by_user_id,
      decided_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,NOW())
    `,
    [
      rfqId,
      selectedQuoteId,
      scoringVersion,
      JSON.stringify(scoringSnapshot),
      JSON.stringify(buyerPreferenceSnapshot),
      decidedBy
    ]
  );
};

/* =========================================================
   STORE AI AUDIT SNAPSHOT
========================================================= */
const insertAuditSnapshot = async (
  client,
  { rfqId, fullRankingSnapshot }
) => {

  await client.query(
    `
    INSERT INTO rfq_ai_audit_trail
    (
      rfq_id,
      ranking_snapshot,
      created_at
    )
    VALUES ($1,$2,NOW())
    `,
    [
      rfqId,
      JSON.stringify(fullRankingSnapshot)
    ]
  );
};

/* =========================================================
   FETCH AI REPLAY DATA
========================================================= */
const getAIReplayData = async (client, rfqId) => {

  const result = await client.query(
    `
    SELECT *
    FROM rfq_ai_audit_trail
    WHERE rfq_id = $1
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [rfqId]
  );

  return result.rows[0] || null;
};

/* =========================================================
   SUPPLIER AI RANKING DASHBOARD
========================================================= */
const getSupplierAIRankingDashboard = async (client) => {

  const result = await client.query(
    `
    SELECT
      o.id,
      o.name,

      COUNT(rdl.id) AS ai_wins,

      COUNT(po.id) FILTER (WHERE po.status='COMPLETED') AS completed_orders,
      COUNT(po.id) FILTER (WHERE po.dispute_flag=true) AS disputes,
      COUNT(po.id) AS total_orders

    FROM organizations o

    LEFT JOIN rfq_decision_logs rdl
      ON rdl.selected_quote_id IN (
        SELECT id FROM quotes WHERE supplier_org_id = o.id
      )

    LEFT JOIN purchase_orders po
      ON po.supplier_org_id = o.id

    WHERE o.role = 'supplier'

    GROUP BY o.id
    ORDER BY ai_wins DESC
    `
  );

  return result.rows;
};

/* =========================================================
   BUYER PREFERENCE PROFILE
========================================================= */
const getBuyerPreferenceProfile = async (client, organizationId) => {

  const result = await client.query(
    `
    SELECT *
    FROM buyer_preference_profiles
    WHERE organization_id = $1
    `,
    [organizationId]
  );

  return result.rows[0] || {
    reliability_priority: true,
    cost_priority: false,
    risk_tolerance: "normal"
  };
};

/* =========================================================
   SCORING CONFIG
========================================================= */
const getLatestScoringConfig = async (client) => {

  const result = await client.query(
    `
    SELECT *
    FROM rfq_scoring_configs
    ORDER BY created_at DESC
    LIMIT 1
    `
  );

  if (!result.rowCount) {
    return {
      version: "v1-default",
      completion_weight: 40,
      ontime_weight: 40,
      dispute_weight: 20,
      price_weight: 0
    };
  }

  return result.rows[0];
};

/* =========================================================
   VALIDATE RFQ OWNERSHIP
========================================================= */
const validateRFQOwnership = async (client, rfqId, organizationId) => {
  const result = await client.query(
    `
    SELECT id, priority, status
    FROM rfqs
    WHERE id = $1
      AND buyer_org_id = $2
    `,
    [rfqId, organizationId]
  );

  return result.rows[0] || null;
};

/* =========================================================
   INTELLIGENCE QUOTE FETCH
========================================================= */
const findQuotesWithSupplierData = async (
  client,
  { rfqId, status, limit, offset }
) => {

  const params = [rfqId];
  let statusFilter = "";

  if (status) {
    params.push(status);
    statusFilter = `AND q.status = $${params.length}`;
  }

  params.push(limit);
  params.push(offset);

  const result = await client.query(
    `
    SELECT 
      q.id,
      q.price,
      q.timeline_days,
      q.status,
      q.created_at,

     o.id AS supplier_org_id,
o.company_name AS supplier_name,
o.city_state,
o.primary_product,
o.monthly_capacity,
o.status,
o.type,

      COUNT(po.id) FILTER (WHERE po.status='COMPLETED') AS completed_orders,
      COUNT(po.id) FILTER (
        WHERE po.status='COMPLETED'
        AND po.actual_delivery_date <= po.promised_delivery_date
      ) AS on_time_orders,
      COUNT(po.id) FILTER (WHERE po.dispute_flag=true) AS disputed_orders,
      COUNT(po.id) AS total_orders,

      CASE
        WHEN COUNT(po.id) FILTER (WHERE po.dispute_flag=true) > 3
        THEN true ELSE false
      END AS high_dispute_risk,

      CASE
        WHEN COUNT(po.id) FILTER (
          WHERE po.status='COMPLETED'
          AND po.actual_delivery_date > po.promised_delivery_date
        ) > 5
        THEN true ELSE false
      END AS delivery_delay_risk

    FROM quotes q
    JOIN organizations o ON o.id = q.supplier_org_id
    LEFT JOIN purchase_orders po
      ON po.supplier_org_id = q.supplier_org_id

    WHERE q.rfq_id = $1
    ${statusFilter}

    GROUP BY q.id, o.id
    ORDER BY q.created_at ASC
    LIMIT $${params.length - 1}
    OFFSET $${params.length}
    `,
    params
  );

  return result.rows;
};

/* =========================================================
   LIST RFQS BY ORGANIZATION
========================================================= */
const getRFQsByOrganization = async (client, organizationId) => {

  const res = await client.query(
    `
    SELECT *
FROM rfqs
WHERE buyer_org_id = $1
ORDER BY created_at DESC
    `,
    [organizationId]
  );

  return res.rows;
};

module.exports = {
  insertRFQ,
  getRFQForUpdate,
  getQuoteForUpdate,
   getRFQsByOrganization, 
  closeRFQWithWinner,
  rejectOtherQuotes,
  markQuoteAccepted,
  insertDecisionLog,
  insertAuditSnapshot,
  getAIReplayData,
  getSupplierAIRankingDashboard,
  getBuyerPreferenceProfile,
  getLatestScoringConfig,
  validateRFQOwnership,
  findQuotesWithSupplierData
};