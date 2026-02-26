/* =========================================================
   BUYER DASHBOARD — API LAYER (ENTERPRISE INTELLIGENCE)
   - Aggregated executive overview
   - Risk integration
   - Capacity integration
   - No UI logic
   - Clean error propagation
========================================================= */

import { ApiClient } from "../../core/apiClient.js";

export const BuyerDashboardAPI = {

  /* =====================================================
     FETCH EXECUTIVE OVERVIEW
     - KPIs
     - Payments pending
     - On-time %
     - Reliability average
     - Risk summary
  ====================================================== */
  async getExecutiveOverview() {

    const response = await ApiClient.get("/analytics/overview");

    if (!response?.success) {
      throw new Error(
        response?.message || "Failed to fetch executive overview"
      );
    }

    return response.data || {};
  },

  /* =====================================================
     FETCH RISK OVERVIEW
  ====================================================== */
  async getRiskOverview() {

    const response = await ApiClient.get("/risk/overview");

    if (!response?.success) {
      throw new Error(
        response?.message || "Failed to fetch risk overview"
      );
    }

    return response.data || {};
  },

  /* =====================================================
     FETCH CAPACITY OVERVIEW
  ====================================================== */
  async getCapacityOverview() {

    const response = await ApiClient.get("/capacity/overview");

    if (!response?.success) {
      throw new Error(
        response?.message || "Failed to fetch capacity overview"
      );
    }

    return response.data || {};
  }

};

export default BuyerDashboardAPI;