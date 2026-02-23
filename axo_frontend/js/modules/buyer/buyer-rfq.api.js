/* =========================================================
   BUYER RFQ — API LAYER (ENTERPRISE STABLE)
   Clean Contract · Defensive · Normalized Responses
========================================================= */

import { ApiClient } from "../../core/apiClient.js";

const BuyerRFQAPI = {

  /* =====================================================
     CREATE RFQ
  ====================================================== */
  async createRFQ(payload = {}) {

    if (!payload.part_name || !payload.quantity) {
      throw new Error("Invalid RFQ payload");
    }

    const response = await ApiClient.post("/buyer/rfqs", payload);

    if (!response?.success) {
      throw new Error(response?.message || "RFQ creation failed");
    }

    return response.data;
  },

  /* =====================================================
     GET RFQ LIST (PAGINATED + FILTERED)
     Backend currently returns:
     {
       success: true,
       data: [ ... ]
     }
  ====================================================== */
  async getRFQs({ page = 1, limit = 10, status = "" } = {}) {

    const safePage = Number(page) > 0 ? Number(page) : 1;
    const safeLimit =
      Number(limit) > 0 && Number(limit) <= 50
        ? Number(limit)
        : 10;

    let query = `/buyer/rfqs?page=${safePage}&limit=${safeLimit}`;
    if (status) query += `&status=${encodeURIComponent(status)}`;

    const response = await ApiClient.get(query);

    if (!response?.success) {
      throw new Error(response?.message || "Failed to fetch RFQs");
    }

    const data = response.data;

    /* Normalize backend response */
    if (Array.isArray(data)) {
      return {
        rfqs: data,
        total: data.length
      };
    }

    if (data && typeof data === "object") {
      return {
        rfqs: Array.isArray(data.rows) ? data.rows : [],
        total: Number(data.total) || 0
      };
    }

    return {
      rfqs: [],
      total: 0
    };
  },

  /* =====================================================
     GET QUOTES FOR RFQ
     Backend returns:
     {
       success: true,
       data: [ ... ]
     }
  ====================================================== */
  async getQuotes(rfqId, { page = 1, limit = 10, status = "" } = {}) {

    if (!rfqId || isNaN(rfqId)) {
      throw new Error("Invalid RFQ id");
    }

    const safePage = Number(page) > 0 ? Number(page) : 1;
    const safeLimit =
      Number(limit) > 0 && Number(limit) <= 50
        ? Number(limit)
        : 10;

    let query = `/buyer/rfqs/${rfqId}/quotes?page=${safePage}&limit=${safeLimit}`;
    if (status) query += `&status=${encodeURIComponent(status)}`;

    const response = await ApiClient.get(query);

    if (!response?.success) {
      throw new Error(response?.message || "Failed to fetch quotes");
    }

    const data = response.data;

    if (Array.isArray(data)) {
      return data;
    }

    return [];
  },

  /* =====================================================
     ACCEPT QUOTE
     Backend returns:
     {
       success: true,
       data: purchaseOrderObject
     }
  ====================================================== */
  async acceptQuote(quoteId) {

    if (!quoteId || isNaN(quoteId)) {
      throw new Error("Invalid quote id");
    }

    const response = await ApiClient.post(
      `/buyer/quotes/${quoteId}/accept`
    );

    if (!response?.success) {
      throw new Error(response?.message || "Failed to accept quote");
    }

    return response.data; // Returns created PO
  },

  /* =====================================================
     REJECT QUOTE
  ====================================================== */
  async rejectQuote(quoteId) {

    if (!quoteId || isNaN(quoteId)) {
      throw new Error("Invalid quote id");
    }

    const response = await ApiClient.post(
      `/buyer/quotes/${quoteId}/reject`
    );

    if (!response?.success) {
      throw new Error(response?.message || "Failed to reject quote");
    }

    return true;
  }

};

export default BuyerRFQAPI;