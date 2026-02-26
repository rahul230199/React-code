/* =========================================================
   AXO NETWORKS — DASHBOARD API (PRODUCTION HARDENED)
   Strict | Defensive | Immutable | Environment Safe
========================================================= */

import { ApiClient } from "../../../core/apiClient.js";

/* ======================================================
   INTERNAL: RESPONSE EXTRACTION
========================================================= */
function extractData(response) {

  if (!response || typeof response !== "object") {
    throw new Error("Dashboard API: Invalid or empty response");
  }

  if (response.success === false) {
    throw new Error(
      response.message || "Dashboard API: Request failed"
    );
  }

  const data = response.data ?? response;

  if (!data || typeof data !== "object") {
    throw new Error("Dashboard API: Malformed data payload");
  }

  return data;
}

/* ======================================================
   INTERNAL: ERROR NORMALIZER
========================================================= */
function normalizeError(error) {

  return {
    message:
      error?.message || "Failed to fetch dashboard data",
    code: error?.code || null
  };
}

/* ======================================================
   PUBLIC API
========================================================= */

export const DashboardAPI = Object.freeze({

  /**
   * Fetch Admin Dashboard Overview
   * GET /admin/dashboard
   */
  async getOverview() {

    try {

      const response = await ApiClient.get(
        "/admin/dashboard"
      );

      return extractData(response);

    } catch (error) {

      const normalized = normalizeError(error);

      // Throw consistent error object
      throw normalized;
    }
  }

});

export default DashboardAPI;