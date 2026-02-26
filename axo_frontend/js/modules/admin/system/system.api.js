/* =========================================================
   AXO NETWORKS — SYSTEM API
   Deterministic | Contract Aligned | Production Safe
========================================================= */

import { ApiClient } from "../../../core/apiClient.js";

/* =========================================================
   ERROR NORMALIZER
========================================================= */

function normalizeError(error) {

  if (!error) return "Unknown error";

  if (typeof error === "string") return error;

  if (error.message) return error.message;

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  return "Failed to fetch system health";
}

/* =========================================================
   SYSTEM API
========================================================= */

export const SystemAPI = Object.freeze({

  /* ------------------------------------------------------
     GET SYSTEM HEALTH
  ------------------------------------------------------ */
 async getSystemHealth() {

  try {

    const response = await ApiClient.get("/admin/system-health");

    if (!response || response.success === false) {
      throw new Error(response?.message || "System request failed");
    }

    return {
      success: true,
      data: response.data ?? null
    };

  } catch (error) {

    return {
      success: false,
      data: null,
      error: normalizeError(error)
    };
  }
}

});

export default SystemAPI;