/* =========================================================
   AXO NETWORKS — RFQ SERVICE (PRODUCTION ORCHESTRATOR)
========================================================= */

import { RFQApi } from "./rfq.api.js";
import { RFQState } from "./rfq.state.js";
import { RFQRender } from "./rfq.render.js";
import Toast from "../../../core/toast.js";

function normalizeError(err, fallback) {
  if (!err) return fallback;
  if (err.message) return err.message;
  if (err?.data?.message) return err.data.message;
  return fallback;
}

export const RFQService = {

  /* =========================================================
     DASHBOARD BOOTSTRAP
  ========================================================= */

  async bootstrapDashboard() {
    try {

      RFQState.setLoading("dashboard", true);

      const res = await RFQApi.list();

      const rfqs = res?.data || [];

      RFQState.setRFQs(rfqs);

      RFQRender.renderKPI(RFQState.rfqs);
      RFQRender.renderRFQList(RFQState.rfqs);

    } catch (err) {

      Toast.error(
        normalizeError(err, "Failed to load RFQs")
      );

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

      return res.data;

    } catch (err) {

      throw new Error(
        normalizeError(err, "RFQ creation failed")
      );

    }
  },

  /* =========================================================
     LOAD QUOTES
  ========================================================= */

  async loadQuotes(rfqId) {

    if (!rfqId) {
      Toast.error("RFQ ID missing");
      return;
    }

    try {

      RFQState.setLoading("quotes", true);

      const res = await RFQApi.getQuotes(rfqId);

      const quotes = res?.data?.quotes || [];

      RFQState.setQuotes(quotes);

      RFQRender.renderIntelligence();

      return quotes;

    } catch (err) {

      Toast.error(
        normalizeError(err, "Failed to load quotes")
      );

      RFQState.setQuotes([]);

    } finally {

      RFQState.setLoading("quotes", false);

    }

  },

  /* =========================================================
     ACCEPT QUOTE (NEW FUNCTION)
  ========================================================= */

  async acceptQuote(rfqId, quoteId) {

    if (!rfqId || !quoteId) {
      throw new Error("Invalid RFQ or Quote");
    }

    try {

      const res = await RFQApi.acceptQuote(
        rfqId,
        quoteId
      );

      Toast.success("Supplier accepted successfully");

      return res?.data;

    } catch (err) {

      throw new Error(
        normalizeError(err, "Failed to accept supplier")
      );

    }

  },

  /* =========================================================
     UPLOAD DESIGN FILE
  ========================================================= */

  async uploadDesignFile(file) {

    if (!file) {
      Toast.error("No file selected");
      return;
    }

    try {

      const res = await RFQApi.uploadDesignFile(file);

      Toast.success("Design file uploaded successfully");

      return res.data;

    } catch (err) {

      Toast.error(
        normalizeError(err, "Design upload failed")
      );

      throw err;

    }

  }

};
