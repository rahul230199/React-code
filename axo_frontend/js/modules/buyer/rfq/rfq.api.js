/* =========================================================
   AXO NETWORKS — RFQ API LAYER (PRODUCTION HARDENED)
========================================================= */

import { ApiClient } from "../../../core/apiClient.js";

const BASE = "/buyer/rfqs";

/* =========================================================
   RFQ API METHODS
========================================================= */

export const RFQApi = {

  async list(params = {}) {
    return ApiClient.get(BASE, { params });
  },

  async create(payload) {
    return ApiClient.post(BASE, payload);
  },

  async getQuotes(rfqId) {
    return ApiClient.get(`${BASE}/${rfqId}/quotes`);
  },

  async acceptQuote(rfqId, quoteId) {
    return ApiClient.post(
      `${BASE}/${rfqId}/quotes/${quoteId}/accept`,
      {}
    );
  },

  async closeRFQ(rfqId) {
    return ApiClient.post(`${BASE}/${rfqId}/close`, {});
  },

  async getAIReplay(rfqId) {
    return ApiClient.get(`${BASE}/${rfqId}/audit-replay`);
  },

  async getSupplierRankingDashboard() {
    return ApiClient.get(`${BASE}/supplier-ranking/dashboard`);
  },

  /* =========================================================
     ✅ DESIGN FILE UPLOAD
  ========================================================= */

  async uploadDesignFile(file) {

    if (!file) {
      throw new Error("No file provided");
    }

    const formData = new FormData();
    formData.append("file", file);

    return ApiClient.post(
      "/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }
    );
  }

};

export default RFQApi;
