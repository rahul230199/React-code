/* =========================================================
   AXO NETWORKS — BUYER RFQ SERVICE
   ENTERPRISE AI PROCUREMENT ORCHESTRATOR (FINAL)
========================================================= */

const pool = require("../../../config/db");
const AppError = require("../../../utils/AppError");
const rfqRepository = require("./rfq.repository");
const rfqPolicy = require("./rfq.policy");
const PO_STATUS = require("../../../constants/poStatus.constants");

/* =========================================================
   CREATE RFQ
========================================================= */
const createRFQ = async ({ body, user }) => {

  const organizationId = user.organization_id;
  if (!organizationId)
    throw new AppError("Organization not found", 400);

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const rfq = await rfqRepository.insertRFQ(client, {
      ...body,
      organizationId
    });

    await client.query("COMMIT");
    return rfq;

  } catch (err) {

    await client.query("ROLLBACK");
    throw err;

  } finally {

    client.release();

  }
};

/* =========================================================
   ACCEPT QUOTE (AWARD FLOW)
========================================================= */
const acceptQuoteFromRFQ = async ({ params, user }) => {

  const organizationId = user.organization_id;
  const userId = user.id;

  const rfqId = Number(params.rfqId);
  const quoteId = Number(params.quoteId);

  if (!rfqId || !quoteId)
    throw new AppError("Invalid parameters", 400);

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const rfq =
      await rfqRepository.getRFQForUpdate(
        client,
        rfqId,
        organizationId
      );

    if (!rfq)
      throw new AppError("RFQ not found", 404);

    if (rfq.status === "closed" || rfq.status === "awarded")
      throw new AppError("RFQ already finalized", 400);

    const quote =
      await rfqRepository.getQuoteForUpdate(
        client,
        quoteId
      );

    if (!quote)
      throw new AppError("Quote not found", 404);

    if (quote.rfq_id !== rfqId)
      throw new AppError("Quote does not belong to this RFQ", 400);

    const scoringConfig =
      await rfqRepository.getLatestScoringConfig(client);

    const buyerPreference =
      await rfqRepository.getBuyerPreferenceProfile(
        client,
        organizationId
      );

    const decisionSnapshot = {
      rfq_id: rfqId,
      selected_quote_id: quoteId,
      scoring_version: scoringConfig.version,
      timestamp: new Date()
    };

    await rfqRepository.insertDecisionLog(
      client,
      {
        rfqId,
        selectedQuoteId: quoteId,
        scoringVersion: scoringConfig.version,
        scoringSnapshot: decisionSnapshot,
        buyerPreferenceSnapshot: buyerPreference,
        decidedBy: userId
      }
    );

    await rfqRepository.insertAuditSnapshot(
      client,
      {
        rfqId,
        fullRankingSnapshot: decisionSnapshot
      }
    );

    await rfqRepository.markQuoteAccepted(client, quoteId);
    await rfqRepository.rejectOtherQuotes(client, rfqId, quoteId);

    await client.query(
      `
      UPDATE rfqs
      SET status = 'awarded',
          selected_quote_id = $2,
          updated_at = NOW()
      WHERE id = $1
      `,
      [rfqId, quoteId]
    );

    const poNumber =
      `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const promisedDeliveryDate =
      quote.timeline_days
        ? new Date(Date.now() + quote.timeline_days * 86400000)
        : null;

    const poRes = await client.query(
      `
      INSERT INTO purchase_orders
      (
        po_number,
        rfq_id,
        quote_id,
        buyer_org_id,
        supplier_org_id,
        part_name,
        quantity,
        value,
        status,
        accepted_at,
        promised_delivery_date
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'issued',NOW(),$9)
      RETURNING *
      `,
      [
        poNumber,
        rfq.id,
        quote.id,
        rfq.buyer_org_id,
        quote.supplier_org_id,
        rfq.part_name,
        rfq.quantity,
        quote.price,
        promisedDeliveryDate
      ]
    );

    await client.query("COMMIT");

    return {
      message: "Quote accepted. RFQ awarded. PO created.",
      po: poRes.rows[0]
    };

  } catch (err) {

    await client.query("ROLLBACK");
    throw err;

  } finally {

    client.release();

  }
};

/* =========================================================
   GET RFQ QUOTES + FULL AI PIPELINE
========================================================= */
const getRFQQuotes = async (req) => {

  const { params, user, query = {} } = req;

  const organizationId = user.organization_id;
  const rfqId = Number(params.rfqId);

  if (!organizationId)
    throw new AppError("Organization not found", 400);

  if (!rfqId)
    throw new AppError("Invalid RFQ id", 400);

  const client = await pool.connect();

  try {

    const rfq =
      await rfqRepository.validateRFQOwnership(
        client,
        rfqId,
        organizationId
      );

    if (!rfq)
      throw new AppError("RFQ not found", 404);

    const limit = Number(query.limit) || 50;
    const offset = Number(query.offset) || 0;
    const status = query.status || null;

    const rawQuotes =
      await rfqRepository.findQuotesWithSupplierData(
        client,
        { rfqId, status, limit, offset }
      );

    if (!rawQuotes.length) {
      return {
        rfq_status: rfq.status,
        quotes: [],
        comparison_matrix: []
      };
    }

    const scoringConfig =
      await rfqRepository.getLatestScoringConfig(client);

    const buyerPreference =
      await rfqRepository.getBuyerPreferenceProfile(
        client,
        organizationId
      );

    /* =====================================================
       APPLY SCORING PIPELINE
    ===================================================== */
    const enrichedQuotes = rawQuotes.map(q => {

      const reliability =
        rfqPolicy.calculateReliabilityScore(
          q,
          scoringConfig,
          buyerPreference
        );

      const confidence =
        rfqPolicy.calculateConfidenceIndex(q);

      const valueIndex =
        rfqPolicy.calculateValueIndex(
          reliability.score,
          q.price
        );

      return {
        ...q,
        reliability_score: reliability.score,
        reliability_tier: reliability.tier,
        confidence_index: confidence,
        value_index: valueIndex,
        scoring_breakdown: reliability.breakdown
      };
    });

    /* =====================================================
       RANK
    ===================================================== */
    const ranked =
      rfqPolicy.rankQuotes(
        enrichedQuotes,
        rfq.priority
      );

    /* =====================================================
       BUILD FINAL VIEW
    ===================================================== */
    const finalView =
      rfqPolicy.buildFinalQuoteView(
        ranked,
        scoringConfig
      );

    return {
      rfq_status: rfq.status,
      ...finalView
    };

  } finally {

    client.release();

  }
};

/* =========================================================
   LIST RFQS
========================================================= */
const getRFQs = async ({ query, user }) => {

  const organizationId = user.organization_id;

  if (!organizationId)
    throw new AppError("Organization not found", 400);

  const client = await pool.connect();

  try {

    return await rfqRepository.getRFQsByOrganization(
      client,
      organizationId,
      query
    );

  } finally {

    client.release();

  }
};

module.exports = {
  createRFQ,
  acceptQuoteFromRFQ,
  getRFQQuotes,
  getRFQs
};