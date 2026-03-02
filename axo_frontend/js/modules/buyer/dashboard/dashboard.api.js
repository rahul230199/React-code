/* =========================================================
   AXO NETWORKS — BUYER DASHBOARD API (CORRECT FINAL)
========================================================= */

import apiClient from "../../../core/apiClient.js";

const BASE = "/buyer/dashboard";

export async function loadDashboardData() {

  try {

    const [
      summaryResponse,
      spendTrendResponse,
      supplierResponse
    ] = await Promise.all([
      apiClient.get(`${BASE}/summary`),
      apiClient.get(`${BASE}/spend-trend`),
      apiClient.get(`${BASE}/supplier-breakdown`)
    ]);

    return {
      ...(summaryResponse?.data || {}),
      spendTrend: spendTrendResponse?.data || [],
      supplierBreakdown: supplierResponse?.data || []
    };

  } catch (error) {

    console.error("Dashboard API error:", error);
    return {};
  }
}