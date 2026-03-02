/* =========================================================
   AXO NETWORKS — RFQ API LAYER (PRODUCTION HARDENED)
   - Response normalization
   - Cancelable requests
   - Safe param serialization
   - Timeout protection
   - Upload helper
   - Backend aligned
========================================================= */

import { ApiClient } from "../../../core/apiClient.js";

const BASE = "/buyer/rfqs";

/* =========================================================
   INTERNAL STATE
========================================================= */

const activeControllers = new Map();

/* =========================================================
   HELPERS
========================================================= */
function normalizeResponse(res) {

  if (!res) {
    return { success: false, data: null, message: "Empty response" };
  }

  // Backend already wrapped
  if (typeof res.success === "boolean") {
    return {
      success: res.success,
      data: res.data ?? null,
      message: res.message ?? null
    };
  }

  // Raw data fallback
  return {
    success: true,
    data: res ?? null,
    message: null
  };
}

function validateId(id) {
  const n = Number(id);
  if (!n || isNaN(n)) {
    throw new Error("Invalid identifier");
  }
  return n;
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      query.append(key, value);
    }
  });

  return query.toString();
}

function createController(key) {
  cancelRequest(key);
  const controller = new AbortController();
  activeControllers.set(key, controller);
  return controller;
}

function cancelRequest(key) {
  const existing = activeControllers.get(key);
  if (existing) {
    existing.abort();
    activeControllers.delete(key);
  }
}

function withTimeout(promise, ms = 20000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), ms)
    )
  ]);
}

/* =========================================================
   RFQ API METHODS
========================================================= */

export const RFQApi = {

  /* ---------------------------------
     LIST RFQS
  ---------------------------------- */
  async list(params = {}) {

    const key = "list";
    const controller = createController(key);

    const query = buildQuery(params);
    const url = query ? `${BASE}?${query}` : BASE;

    try {

      const res = await withTimeout(
        ApiClient.get(url, {}, { signal: controller.signal })
      );

      return normalizeResponse(res);

    } finally {
      activeControllers.delete(key);
    }
  },

  /* ---------------------------------
     CREATE RFQ
  ---------------------------------- */
  async create(payload) {

    const key = "create";
    const controller = createController(key);

    try {

      const res = await withTimeout(
        ApiClient.post(BASE, payload, { signal: controller.signal })
      );

      return normalizeResponse(res);

    } finally {
      activeControllers.delete(key);
    }
  },

  /* ---------------------------------
     GET QUOTES (AI INTELLIGENCE)
  ---------------------------------- */
 async getQuotes(rfqId, params = {}) {

  const id = validateId(rfqId);
  const key = `quotes-${id}`;
  const controller = createController(key);

  const query = buildQuery(params);
  const url = query
    ? `${BASE}/${id}/quotes?${query}`
    : `${BASE}/${id}/quotes`;

  try {
    const res = await withTimeout(
      ApiClient.get(url, {}, { signal: controller.signal })
    );

    return normalizeResponse(res);

  } finally {
    activeControllers.delete(key);
  }
},

  /* ---------------------------------
     ACCEPT QUOTE → AUTO PO
  ---------------------------------- */
  async acceptQuote(rfqId, quoteId) {

    const rId = validateId(rfqId);
    const qId = validateId(quoteId);

    const key = `accept-${rId}-${qId}`;
    const controller = createController(key);

    try {

      const res = await withTimeout(
        ApiClient.post(
          `${BASE}/${rId}/quotes/${qId}/accept`,
          {},
          { signal: controller.signal }
        )
      );

      return normalizeResponse(res);

    } finally {
      activeControllers.delete(key);
    }
  },

  /* ---------------------------------
     CLOSE RFQ
  ---------------------------------- */
  async closeRFQ(rfqId) {

    const id = validateId(rfqId);
    const key = `close-${id}`;
    const controller = createController(key);

    try {

      const res = await withTimeout(
        ApiClient.post(
          `${BASE}/${id}/close`,
          {},
          { signal: controller.signal }
        )
      );

      return normalizeResponse(res);

    } finally {
      activeControllers.delete(key);
    }
  },

  /* ---------------------------------
     AI REPLAY
  ---------------------------------- */
  async getAIReplay(rfqId) {

    const id = validateId(rfqId);
    const key = `replay-${id}`;
    const controller = createController(key);

    try {

      const res = await withTimeout(
        ApiClient.get(
          `${BASE}/${id}/audit-replay`,
          {},
          { signal: controller.signal }
        )
      );

      return normalizeResponse(res);

    } finally {
      activeControllers.delete(key);
    }
  },

  /* ---------------------------------
     SUPPLIER AI RANKING DASHBOARD
  ---------------------------------- */
  async getSupplierRankingDashboard() {

    const key = "ranking";
    const controller = createController(key);

    try {

      const res = await withTimeout(
        ApiClient.get(
          `${BASE}/supplier-ranking/dashboard`,
          {},
          { signal: controller.signal }
        )
      );

      return normalizeResponse(res);

    } finally {
      activeControllers.delete(key);
    }
  },

  /* ---------------------------------
     FILE UPLOAD (DESIGN FILE)
  ---------------------------------- */
  async uploadDesignFile(file) {

    if (!file) {
      throw new Error("No file provided");
    }

    const key = "upload";
    const controller = createController(key);

    const formData = new FormData();
    formData.append("file", file);

    try {

      const res = await withTimeout(
        fetch("/api/upload", {
          method: "POST",
          body: formData,
          signal: controller.signal
        })
      );

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();

      return normalizeResponse(data);

    } finally {
      activeControllers.delete(key);
    }
  },

  /* ---------------------------------
     GLOBAL CANCEL (Route change safety)
  ---------------------------------- */
  cancelAll() {
    activeControllers.forEach(controller => controller.abort());
    activeControllers.clear();
  }

};