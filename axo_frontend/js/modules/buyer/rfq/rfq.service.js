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

  async bootstrapDashboard() {
    try {
      RFQState.setLoading("dashboard", true);

      const res = await RFQApi.list();

      RFQState.setRFQs(res.data || []);
      RFQRender.renderKPI(RFQState.rfqs);
      RFQRender.renderRFQList(RFQState.rfqs);

    } catch (err) {
      Toast.error(normalizeError(err, "Failed to load RFQs"));
    } finally {
      RFQState.setLoading("dashboard", false);
    }
  },

  async createRFQ(payload) {
    try {
      const res = await RFQApi.create(payload);
      return res.data;
    } catch (err) {
      throw new Error(normalizeError(err, "RFQ creation failed"));
    }
  },

  /* =========================================================
     ✅ UPLOAD DESIGN FILE
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
