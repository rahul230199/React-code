/* =========================================================
   AXO NETWORKS — NETWORK STATE (ENTERPRISE REFINED)
   Immutable | Defensive | Predictable | Scalable
========================================================= */

export const NetworkState = (() => {

  let _requests = [];
  let _loading = false;

  let _pagination = {
    page: 1,
    limit: 10,
    total_records: 0,
    total_pages: 0
  };

  let _filters = {
    status: null,
    search: null,
    start_date: null,
    end_date: null
  };

  const VALID_STATUSES = ["pending", "approved", "rejected"];

  /* ================= Helpers ================= */

  function normalizeNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  function normalizeStatus(status) {
    const normalized = String(status || "").toLowerCase();
    return VALID_STATUSES.includes(normalized)
      ? normalized
      : null;
  }

  function freezeRequests(list) {
    return Object.freeze(
      list.map(item => Object.freeze({ ...item }))
    );
  }

  function sanitizeRequest(item) {
    if (!item || typeof item !== "object") return null;

    return {
      ...item,
      status: normalizeStatus(item.status)
    };
  }

  /* ================= Loading ================= */

  function setLoading(value) {
    _loading = Boolean(value);
  }

  function isLoading() {
    return _loading;
  }

  /* ================= Requests ================= */

  function setRequests(payload) {

    if (!payload || typeof payload !== "object") {
      _requests = [];
      _pagination = { ..._pagination, total_records: 0, total_pages: 0 };
      return;
    }

    const list = Array.isArray(payload.requests)
      ? payload.requests
          .map(sanitizeRequest)
          .filter(Boolean)
      : [];

    _requests = list;

    _pagination = {
      ..._pagination,
      total_records: normalizeNumber(payload.total_records),
      total_pages: normalizeNumber(payload.total_pages),
      page: normalizeNumber(payload.current_page, 1)
    };
  }

  function getRequests() {
    return freezeRequests(_requests);
  }

  /* ================= Pagination ================= */

  function setPage(page) {
    const p = normalizeNumber(page, 1);
    _pagination = { ..._pagination, page: p > 0 ? p : 1 };
  }

  function setLimit(limit) {
    const l = normalizeNumber(limit, 10);
    _pagination = { ..._pagination, limit: l > 0 ? l : 10 };
  }

  function getPagination() {
    return Object.freeze({ ..._pagination });
  }

  /* ================= Filters ================= */

  function setFilters(filters = {}) {

    const updated = { ..._filters };

    for (const key in updated) {
      if (key in filters) {
        updated[key] =
          filters[key] !== undefined && filters[key] !== ""
            ? filters[key]
            : null;
      }
    }

    _filters = updated;
    _pagination = { ..._pagination, page: 1 };
  }

  function getFilters() {
    return Object.freeze({ ..._filters });
  }

  /* ================= Reset ================= */

  function reset() {
    _requests = [];
    _loading = false;

    _pagination = {
      page: 1,
      limit: 10,
      total_records: 0,
      total_pages: 0
    };

    _filters = {
      status: null,
      search: null,
      start_date: null,
      end_date: null
    };
  }

  /* ================= Public API ================= */

  return Object.freeze({
    setLoading,
    isLoading,
    setRequests,
    getRequests,
    setPage,
    setLimit,
    getPagination,
    setFilters,
    getFilters,
    reset
  });

})();

export default NetworkState;