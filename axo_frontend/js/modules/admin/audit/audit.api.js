/* =========================================================
   AXO NETWORKS — AUDIT API MODULE (FULLY FIXED)
========================================================= */

import { ApiClient } from "../../../core/apiClient.js";

/* ======================================================
   INTERNAL: QUERY BUILDER
========================================================= */
function buildQuery(params = {}) {

  const query = Object.entries(params)
    .filter(([_, value]) =>
      value !== undefined &&
      value !== null &&
      value !== ""
    )
    .map(([key, value]) =>
      `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&");

  return query ? `?${query}` : "";
}

/* ======================================================
   INTERNAL: RESPONSE VALIDATION
========================================================= */
function assertResponse(response) {

  if (!response || typeof response !== "object") {
    throw new Error("Audit API: Invalid server response");
  }

  if (response.success === false) {
    throw new Error(
      response.message || "Audit API: Request failed"
    );
  }

  if (!response.data || !response.meta) {
    throw new Error("Audit API: Malformed data structure");
  }

  return response;
}

/* ======================================================
   INTERNAL: NORMALIZER (UPDATED FOR meta + data)
========================================================= */
function normalizeList(response) {

  const logs = Array.isArray(response.data)
    ? response.data.filter(item => item && typeof item === "object")
    : [];

  return Object.freeze({
    total_records: Number(response.meta?.total_records) || 0,
    current_page: Number(response.meta?.current_page) || 1,
    total_pages: Number(response.meta?.total_pages) || 0,
    logs
  });
}

/* ======================================================
   PUBLIC API
========================================================= */

export const AuditAPI = Object.freeze({

  async getLogs(options = {}) {

    const {
      page = 1,
      limit = 20,
      admin_user_id,
      action_type,
      search,
      start_date,
      end_date
    } = options;

    const query = buildQuery({
      page,
      limit,
      admin_user_id,
      action_type,
      search,
      start_date,
      end_date
    });

    try {

      const response = await ApiClient.get(
        `/admin/audit-logs${query}`
      );

      const validated = assertResponse(response);

      return normalizeList(validated);

    } catch (error) {

      throw {
        message: error?.message || "Failed to fetch audit logs",
        code: error?.code || null
      };
    }
  }

});

export default AuditAPI;