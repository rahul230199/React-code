/* =========================================================
   AXO NETWORKS — RFQ SERVICE (PRODUCTION ORCHESTRATOR)
   - State-driven
   - Cancel-safe
   - Loading-aware
   - Optimistic-ready
   - Backend aligned
========================================================= */

import { RFQApi } from "./rfq.api.js";
import { RFQState } from "./rfq.state.js";
import { RFQRender } from "./rfq.render.js";
import Toast from "../../../core/toast.js";

/* =========================================================
   INTERNAL ERROR NORMALIZER
========================================================= */

function normalizeError(err, fallback) {
  if (!err) return fallback;
  if (err.message) return err.message;
  if (err?.data?.message) return err.data.message;
  return fallback;
}

/* =========================================================
   SERVICE
========================================================= */

export const RFQService = {

  /* =========================================================
     DASHBOARD BOOTSTRAP
  ========================================================= */

  async bootstrapDashboard() {

    try {

      RFQState.setLoading("dashboard", true);

      const res = await RFQApi.list();

      if (!res.success) {
        throw new Error(res.message || "Load failed");
      }

      RFQState.setRFQs(res.data || []);
      RFQState.setSelectedRFQ(null);
      RFQState.setQuotes([]);
      RFQState.setComparisonMatrix([]);

      RFQRender.renderKPI(RFQState.rfqs);
      RFQRender.renderRFQList(RFQState.rfqs);

      const intelligenceZone =
        document.getElementById("rfqIntelligenceZone");
      if (intelligenceZone) intelligenceZone.innerHTML = "";

    } catch (err) {

      Toast.error(normalizeError(err, "Failed to load RFQs"));

    } finally {

      RFQState.setLoading("dashboard", false);

    }
  },

  /* =========================================================
     CREATE RFQ
  ========================================================= */

  async createRFQ(payload) {

    try {

      const res = await RFQApi.create(payload);

      if (!res.success || !res.data) {
        throw new Error(res.message || "Invalid response");
      }

      return res.data;

    } catch (err) {

      throw new Error(
        normalizeError(err, "RFQ creation failed")
      );

    }
  },

  /* =========================================================
     LOAD QUOTES + AI INTELLIGENCE
  ========================================================= */

  async loadQuotes(rfqId) {

    try {

      RFQState.setLoading("intelligence", true);

      const res = await RFQApi.getQuotes(rfqId);

      if (!res.success) {
        throw new Error(res.message || "Load failed");
      }

      RFQState.setSelectedRFQ(rfqId);

      const quotes = (res.data?.quotes || []).map(q => ({

  ...q,

  reliability_score: Number(q.reliability_score ?? 0),

  reliability_tier:
    (q.reliability_tier || "STABLE").toUpperCase(),

  confidence_index:
    Number(q.confidence_index ?? 0),

  value_index:
    Number(q.value_index ?? 0),

  is_recommended:
    Boolean(q.is_recommended),

  recommendation_reason:
    q.recommendation_reason || "",

  risk_flags:
    q.risk_flags || {},

  supplier:
    q.supplier && q.supplier.name
      ? q.supplier
      : { name: "Unknown" }

}));

      const matrix = res.data?.comparison_matrix || [];

      RFQState.setQuotes(quotes);
      RFQState.setComparisonMatrix(matrix);

      RFQRender.renderIntelligence();

    } catch (err) {

      Toast.error(
        normalizeError(err, "Failed to load AI intelligence")
      );

    } finally {

      RFQState.setLoading("intelligence", false);

    }
  },

  /* =========================================================
     ACCEPT QUOTE (AUTO PO PIPELINE)
  ========================================================= */

  async acceptQuote(rfqId, quoteId) {

    if (!rfqId || !quoteId) {
      Toast.error("Invalid selection");
      return;
    }

    try {

      RFQState.setOptimisticQuote(quoteId);

      const res = await RFQApi.acceptQuote(rfqId, quoteId);

      if (!res.success) {
        throw new Error(res.message || "Acceptance failed");
      }

      const po = res.data?.po || res.data;

      Toast.success("Quote accepted. PO created.");

      RFQRender.renderPOConfirmation(po);

      RFQState.clearOptimistic();

      await this.bootstrapDashboard();

    } catch (err) {

      RFQState.clearOptimistic();

      Toast.error(
        normalizeError(err, "Acceptance failed")
      );

      throw err;

    }
  },

  /* =========================================================
     CLOSE RFQ
  ========================================================= */

  async closeRFQ(rfqId) {

    try {

      const res = await RFQApi.closeRFQ(rfqId);

      if (!res.success) {
        throw new Error(res.message || "Close failed");
      }

      Toast.success("RFQ closed successfully");

      await this.bootstrapDashboard();

    } catch (err) {

      Toast.error(
        normalizeError(err, "Close failed")
      );

    }
  },

  /* =========================================================
     AI REPLAY
  ========================================================= */

  async loadAIReplay(rfqId) {

    try {

      RFQState.setLoading("replay", true);

      const res = await RFQApi.getAIReplay(rfqId);

      if (!res.success || !res.data) {
        throw new Error(res.message || "No replay data");
      }

      RFQState.setReplaySnapshot(res.data);

      RFQRender.renderAIReplay(res.data);

    } catch (err) {

      Toast.error(
        normalizeError(err, "No AI replay found")
      );

    } finally {

      RFQState.setLoading("replay", false);

    }
  },

  /* =========================================================
     SUPPLIER RANKING DASHBOARD
  ========================================================= */

  async loadSupplierRanking() {

    try {

      const res =
        await RFQApi.getSupplierRankingDashboard();

      if (!res.success) {
        throw new Error(res.message || "Ranking failed");
      }

      RFQState.setSupplierRanking(res.data || []);

      RFQRender.renderSupplierRanking(
        RFQState.supplierRanking
      );

    } catch (err) {

      Toast.error(
        normalizeError(err, "Failed to load ranking dashboard")
      );

    }
  },

  /* =========================================================
     GLOBAL CLEANUP (Route Switch Safety)
  ========================================================= */

  cleanup() {

    RFQApi.cancelAll();
    RFQState.reset();
  }

};