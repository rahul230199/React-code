/* =========================================================
   AXO NETWORKS — NETWORK MODULE API (ENTERPRISE FINAL)
   Strict | Defensive | Typed Errors | Contract Safe
========================================================= */

import { ApiClient } from "../../../core/apiClient.js";

/* ================= QUERY BUILDER ================= */

function buildQuery(params = {}) {

  const parts = [];

  for (const [key, value] of Object.entries(params)) {

    if (value === undefined || value === null || value === "")
      continue;

    if (Array.isArray(value)) {
      value.forEach(v =>
        parts.push(
          `${encodeURIComponent(key)}=${encodeURIComponent(v)}`
        )
      );
    } else {
      parts.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      );
    }
  }

  return parts.length ? `?${parts.join("&")}` : "";
}

/* ================= RESPONSE ASSERTION ================= */

function assertResponse(response, fallbackMessage) {

  if (!response || typeof response !== "object") {
    throw new Error(fallbackMessage || "Invalid response");
  }

  if (response.success === false) {
    throw new Error(
      response.message ||
      fallbackMessage ||
      "Request failed"
    );
  }

  const data =
    response.data && typeof response.data === "object"
      ? response.data
      : response;

  if (!data || typeof data !== "object") {
    throw new Error(fallbackMessage || "Malformed payload");
  }

  return data;
}

/* ================= NORMALIZERS ================= */

function normalizeList(data) {

  const requests = Array.isArray(data.requests)
    ? data.requests.filter(r => r && typeof r === "object")
    : [];

  return Object.freeze({
    requests,
    total_records: Number(data.total_records) || 0,
    total_pages: Number(data.total_pages) || 0,
    current_page: Number(data.current_page) || 1
  });
}

function normalizeAction(data) {

  return Object.freeze({
    organization_id: data?.organization_id ?? null,
    user:
      data?.user && typeof data.user === "object"
        ? { ...data.user }
        : null,
    temporary_password:
      data?.temporary_password ?? null
  });
}

/* ================= VALIDATION ================= */

function validateId(id) {
  const normalized = String(id || "").trim();
  if (!normalized)
    throw new Error("Network API: Missing request ID");
  return normalized;
}

function validateComment(comment, actionType) {

  const trimmed = String(comment || "").trim();

  if (!trimmed)
    throw new Error(
      `Network API: ${actionType} requires verification comment`
    );

  if (trimmed.length > 1000)
    throw new Error(
      `Network API: ${actionType} comment too long`
    );

  return trimmed;
}

function normalizeError(error, fallback) {
  const err = new Error(error?.message || fallback);
  err.code = error?.code || null;
  return err;
}

/* ================= PUBLIC API ================= */

export const NetworkAPI = Object.freeze({

  async getRequests(options = {}) {

    const {
      page = 1,
      limit = 10,
      status,
      search,
      start_date,
      end_date
    } = options;

    const query = buildQuery({
      page,
      limit,
      status,
      search,
      start_date,
      end_date
    });

    try {

      const response = await ApiClient.get(
        `/admin/network-access-requests${query}`
      );

      const data = assertResponse(
        response,
        "Network API: Failed to fetch requests"
      );

      return normalizeList(data);

    } catch (error) {
      throw normalizeError(
        error,
        "Network API: Failed to fetch requests"
      );
    }
  },

  async approve(id, comment) {

    try {

      const safeId = validateId(id);
      const safeComment = validateComment(comment, "Approve");

      const response = await ApiClient.post(
        `/admin/network-access-requests/${safeId}/approve`,
        { comment: safeComment }
      );

      const data = assertResponse(
        response,
        "Network API: Approve action failed"
      );

      return normalizeAction(data);

    } catch (error) {
      throw normalizeError(
        error,
        "Network API: Approve action failed"
      );
    }
  },

  async reject(id, comment) {

    try {

      const safeId = validateId(id);
      const safeComment = validateComment(comment, "Reject");

      const response = await ApiClient.post(
        `/admin/network-access-requests/${safeId}/reject`,
        { comment: safeComment }
      );

      const data = assertResponse(
        response,
        "Network API: Reject action failed"
      );

      return normalizeAction(data);

    } catch (error) {
      throw normalizeError(
        error,
        "Network API: Reject action failed"
      );
    }
  }

});

export default NetworkAPI;