/* =========================================================
   BUYER DASHBOARD — API LAYER
   Enterprise Contract Aligned
========================================================= */

import { ApiClient } from "../../core/apiClient.js";
import Toast from "../../core/toast.js";

export const BuyerDashboardAPI = {

  /* =====================================================
     FETCH BASIC DASHBOARD STATS
  ====================================================== */
  async getDashboardStats() {
    try {

      const response = await ApiClient.get("/buyer/dashboard-stats");

      if (!response?.success) {
        throw new Error(response?.message || "Failed to fetch stats");
      }

      return response.data;

    } catch (error) {

      console.error("Dashboard Stats Error:", error);

      Toast.error(
        error?.message || "Unable to load dashboard data"
      );

      throw error;
    }
  },

  /* =====================================================
     FETCH ANALYTICS OVERVIEW (KPI + Charts)
  ====================================================== */
  async getAnalyticsOverview() {
    try {

      const response = await ApiClient.get(
        "/buyer/analytics/overview"
      );

      if (!response?.success) {
        throw new Error(
          response?.message || "Failed to load analytics"
        );
      }

      return response.data;

    } catch (error) {

      console.error("Analytics Overview Error:", error);

      Toast.error(
        error?.message || "Unable to load analytics overview"
      );

      throw error;
    }
  }

};

export default BuyerDashboardAPI;