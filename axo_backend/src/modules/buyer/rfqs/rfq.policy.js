/* =========================================================
   AXO NETWORKS — RFQ POLICY ENGINE (ENTERPRISE FINAL)
   Explainable | Versioned | Snapshot Ready
========================================================= */

/* =========================================================
   CORE SCORING ENGINE (FULL BREAKDOWN)
========================================================= */
const calculateReliabilityScore = (
  quote,
  scoringConfig,
  buyerPreference
) => {

  const total = Number(quote.total_orders);
  const completed = Number(quote.completed_orders);
  const onTime = Number(quote.on_time_orders);
  const disputed = Number(quote.disputed_orders);

  if (!total || total <= 0) {
    return {
      score: 0,
      tier: "RISK",
      breakdown: null
    };
  }

  const completionRate = completed / total;
  const onTimeRate = completed > 0 ? onTime / completed : 0;
  const disputeRate = disputed / total;

  /* -------------------------------------------------------
     Weighted Components
  ------------------------------------------------------- */
  const completionContribution =
    completionRate * scoringConfig.completion_weight;

  const onTimeContribution =
    onTimeRate * scoringConfig.ontime_weight;

  const disputeContribution =
    (1 - disputeRate) * scoringConfig.dispute_weight;

  let rawScore =
    completionContribution +
    onTimeContribution +
    disputeContribution;

  /* -------------------------------------------------------
     Buyer Preference Adjustment
  ------------------------------------------------------- */
  let preferenceMultiplier = 1;

  if (buyerPreference.cost_priority)
    preferenceMultiplier *= 0.9;

  if (buyerPreference.reliability_priority)
    preferenceMultiplier *= 1.05;

  rawScore = rawScore * preferenceMultiplier;

  /* -------------------------------------------------------
     Risk Penalties
  ------------------------------------------------------- */
  let riskPenalty = 0;

  if (quote.high_dispute_risk)
    riskPenalty += 10;

  if (quote.delivery_delay_risk)
    riskPenalty += 8;

  rawScore = rawScore - riskPenalty;

  const finalScore = Math.max(0, Math.round(rawScore));

  let tier = "RISK";
  if (finalScore >= 85) tier = "ELITE";
  else if (finalScore >= 70) tier = "PREFERRED";
  else if (finalScore >= 50) tier = "STABLE";

  return {
    score: finalScore,
    tier,
    breakdown: {
      completion_rate: Number(completionRate.toFixed(2)),
      on_time_rate: Number(onTimeRate.toFixed(2)),
      dispute_rate: Number(disputeRate.toFixed(2)),

      weighted_components: {
        completion: Number(completionContribution.toFixed(2)),
        on_time: Number(onTimeContribution.toFixed(2)),
        dispute: Number(disputeContribution.toFixed(2))
      },

      preference_multiplier: preferenceMultiplier,
      risk_penalty: riskPenalty
    }
  };
};

/* =========================================================
   CONFIDENCE INDEX
========================================================= */
const calculateConfidenceIndex = (quote) => {

  const total = Number(quote.total_orders);

  if (!total) return 30;
  if (total >= 50) return 95;
  if (total >= 20) return 85;
  if (total >= 10) return 75;
  if (total >= 5) return 60;

  return 45;
};

/* =========================================================
   VALUE INDEX (PRICE VS RELIABILITY)
========================================================= */
const calculateValueIndex = (score, price) => {
  if (!price || price <= 0) return 0;
  return Number((score / price).toFixed(6));
};

/* =========================================================
   RANKING ENGINE
========================================================= */
const rankQuotes = (quotes, rfqPriority) => {

  return [...quotes].sort((a, b) => {

    let scoreA = a.reliability_score;
    let scoreB = b.reliability_score;

    if (rfqPriority === "urgent") {
      scoreA *= 1.1;
      scoreB *= 1.1;
    }

    if (scoreB !== scoreA)
      return scoreB - scoreA;

    return Number(a.price) - Number(b.price);
  });
};

/* =========================================================
   RECOMMENDATION REASON
========================================================= */
const generateRecommendationReason = (quote) => {

  if (quote.high_dispute_risk)
    return "High dispute frequency detected";

  if (quote.reliability_score >= 85)
    return "Elite supplier with consistent on-time delivery";

  if (quote.reliability_score >= 70)
    return "Preferred supplier with strong operational record";

  if (quote.reliability_score < 50)
    return "Operational risk indicators present";

  return "Balanced cost-to-performance profile";
};

/* =========================================================
   BUILD COMPARISON MATRIX
========================================================= */
const buildComparisonMatrix = (quotes) => {

  return quotes.map(q => ({
    supplier: q.supplier_name,
    price: q.price,
    reliability_score: q.reliability_score,
    value_index: q.value_index,
    confidence_index: q.confidence_index,
    tier: q.reliability_tier,
    risk_flags: {
      dispute_risk: q.high_dispute_risk,
      delay_risk: q.delivery_delay_risk
    }
  }));
};

/* =========================================================
   FINAL RESPONSE BUILDER
========================================================= */
const buildFinalQuoteView = (
  rankedQuotes,
  scoringConfig
) => {

  return {
    scoring_model_version: scoringConfig.version,

    quotes: rankedQuotes.map((q, index) => {

      const isTop = index === 0;

      return {
        id: q.id,
        price: q.price,
        timeline_days: q.timeline_days,
        status: q.status,
        created_at: q.created_at,

        supplier: {
          id: q.supplier_org_id,
          name: q.supplier_name,
          logo_url: q.logo_url,
          location: `${q.city || ""} ${q.country || ""}`.trim(),
          industry: q.industry,
          tier: q.organization_tier
        },

        reliability_score: q.reliability_score,
        reliability_tier: q.reliability_tier,
        confidence_index: q.confidence_index,
        value_index: q.value_index,

        scoring_breakdown: q.scoring_breakdown,

        risk_flags: {
          dispute_risk: q.high_dispute_risk,
          delay_risk: q.delivery_delay_risk
        },

        is_recommended: isTop,
        recommendation_reason: isTop
          ? generateRecommendationReason(q)
          : null
      };
    }),

    comparison_matrix: buildComparisonMatrix(rankedQuotes)
  };
};

module.exports = {
  calculateReliabilityScore,
  calculateConfidenceIndex,
  calculateValueIndex,
  rankQuotes,
  buildFinalQuoteView
};