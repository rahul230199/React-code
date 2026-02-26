/* =========================================================
   AXO NETWORKS — ADMIN RFQ API
   Enterprise • Hardened • Edit-Safe • Award-Safe
========================================================= */

import { ApiClient } from "../../../core/apiClient.js";

/* ======================================================
   CONSTANTS
========================================================= */

const VALID_STATUSES = ["open", "closed", "awarded", "cancelled"];
const VALID_VISIBILITY = ["public", "private"];

/* ======================================================
   HELPERS
========================================================= */

function toNumber(value, fallback = null) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toPositiveNumber(value, label) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error(`Invalid ${label}`);
  }
  return num;
}

function toStringSafe(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
}

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

function assertResponse(response, fallbackMessage) {
  if (!response || typeof response !== "object") {
    throw new Error(fallbackMessage || "Invalid server response");
  }

  if (response.success === false) {
    throw new Error(response.message || fallbackMessage);
  }

  return response.data ?? response;
}

function normalizeError(error, fallback) {
  return {
    message: error?.message || fallback,
    code: error?.code || null
  };
}

/* ======================================================
   NORMALIZERS
========================================================= */

function normalizeList(data) {
  if (!data || typeof data !== "object") {
    return Object.freeze({
      rfqs: [],
      total_records: 0,
      total_pages: 0,
      current_page: 1
    });
  }

  return Object.freeze({
    rfqs: Array.isArray(data.rfqs) ? data.rfqs : [],
    total_records: toNumber(data.total_records, 0),
    total_pages: toNumber(data.total_pages, 0),
    current_page: toNumber(data.current_page, 1)
  });
}

function normalizeQuotes(data) {
  if (!Array.isArray(data)) return [];

  return data.map(q => ({
    ...q,
    price: toNumber(q.price, 0),
    timeline_days: toNumber(q.timeline_days, null),
    reliability_snapshot: toNumber(q.reliability_snapshot, null),
    is_winner: q.status === "accepted"
  }));
}

/* ======================================================
   PUBLIC API
========================================================= */

export const RFQAPI = Object.freeze({

  /* ====================================================
     GET RFQS
  ==================================================== */

  async getRFQs(options = {}) {

    const query = buildQuery({
      page: toNumber(options.page, 1),
      limit: toNumber(options.limit, 10),
      status: toStringSafe(options.status),
      priority: toStringSafe(options.priority),
      visibility_type: toStringSafe(options.visibility_type),
      search: toStringSafe(options.search)
    });

    try {
      const response = await ApiClient.get(`/admin/rfqs${query}`);
      return normalizeList(assertResponse(response, "Failed to fetch RFQs"));
    } catch (error) {
      throw normalizeError(error, "Failed to fetch RFQs");
    }
  },

  /* ====================================================
     GET RFQ DETAIL
  ==================================================== */

  async getRFQById(rfqId) {

    const id = toPositiveNumber(rfqId, "RFQ ID");

    try {
      const response = await ApiClient.get(`/admin/rfqs/${id}`);
      return assertResponse(response, "Failed to fetch RFQ");
    } catch (error) {
      throw normalizeError(error, "Failed to fetch RFQ");
    }
  },

  /* ====================================================
     GET QUOTES
  ==================================================== */

  async getQuotes(rfqId) {

    const id = toPositiveNumber(rfqId, "RFQ ID");

    try {
      const response = await ApiClient.get(`/admin/rfqs/${id}/quotes`);
      return normalizeQuotes(
        assertResponse(response, "Failed to fetch quotes")
      );
    } catch (error) {
      throw normalizeError(error, "Failed to fetch quotes");
    }
  },

  /* ====================================================
     GET SUPPLIERS
  ==================================================== */

  async getSuppliers() {

    try {
      const response = await ApiClient.get(`/admin/rfqs/suppliers`);
      return assertResponse(response, "Failed to fetch suppliers");
    } catch (error) {
      throw normalizeError(error, "Failed to fetch suppliers");
    }
  },

  /* ====================================================
     GET SUPPLIERS BY RFQ (EDIT MODE SUPPORT)
  ==================================================== */

  async getSuppliersByRFQ(rfqId) {

    const id = toPositiveNumber(rfqId, "RFQ ID");

    try {
      const response = await ApiClient.get(
        `/admin/rfqs/${id}/suppliers`
      );
      return assertResponse(response, "Failed to fetch assigned suppliers");
    } catch (error) {
      throw normalizeError(error, "Failed to fetch assigned suppliers");
    }
  },

  /* ====================================================
     ASSIGN / EDIT SUPPLIERS WITH QUOTES
  ==================================================== */

  async assignSuppliersWithQuotes(rfqId, quotes = []) {

    const id = toPositiveNumber(rfqId, "RFQ ID");

    if (!Array.isArray(quotes) || !quotes.length) {
      throw new Error("At least one quote required");
    }

    const sanitizedQuotes = quotes.map(q => {
      const supplierId = toPositiveNumber(q.supplier_org_id, "Supplier ID");
      const price = toPositiveNumber(q.price, "Price");

      const timeline =
        q.timeline_days !== undefined &&
        q.timeline_days !== null &&
        q.timeline_days !== ""
          ? toPositiveNumber(q.timeline_days, "Timeline")
          : null;

      return {
        supplier_org_id: supplierId,
        price,
        timeline_days: timeline
      };
    });

    try {
      const response = await ApiClient.post(
        `/admin/rfqs/${id}/assign`,
        { quotes: sanitizedQuotes }
      );

      return assertResponse(
        response,
        "Failed to assign suppliers"
      );

    } catch (error) {
      throw normalizeError(error, "Failed to assign suppliers");
    }
  },

  /* ====================================================
     AWARD QUOTE
  ==================================================== */

  async awardQuote(rfqId, quoteId) {

    const id = toPositiveNumber(rfqId, "RFQ ID");
    const qid = toPositiveNumber(quoteId, "Quote ID");

    try {
      const response = await ApiClient.patch(
        `/admin/rfqs/${id}/award`,
        { quoteId: qid }
      );

      return assertResponse(response, "Failed to award quote");

    } catch (error) {
      throw normalizeError(error, "Failed to award quote");
    }
  },

  /* ====================================================
     UPDATE STATUS
  ==================================================== */

  async updateStatus(rfqId, status) {

    const id = toPositiveNumber(rfqId, "RFQ ID");
    const normalized = toStringSafe(status);

    if (!VALID_STATUSES.includes(normalized)) {
      throw new Error("Invalid status value");
    }

    try {
      const response = await ApiClient.patch(
        `/admin/rfqs/${id}/status`,
        { status: normalized }
      );

      return assertResponse(response, "Failed to update status");

    } catch (error) {
      throw normalizeError(error, "Failed to update status");
    }
  },

  /* ====================================================
     UPDATE VISIBILITY
  ==================================================== */

  async updateVisibility(rfqId, visibility) {

    const id = toPositiveNumber(rfqId, "RFQ ID");
    const normalized = toStringSafe(visibility);

    if (!VALID_VISIBILITY.includes(normalized)) {
      throw new Error("Invalid visibility value");
    }

    try {
      const response = await ApiClient.patch(
        `/admin/rfqs/${id}/visibility`,
        { visibility: normalized }
      );

      return assertResponse(response, "Failed to update visibility");

    } catch (error) {
      throw normalizeError(error, "Failed to update visibility");
    }
  }

});

export default RFQAPI;