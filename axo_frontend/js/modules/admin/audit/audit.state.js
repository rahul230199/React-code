/* =========================================================
   AXO NETWORKS — AUDIT STATE (PRODUCTION HARDENED)
   Optimized | Defensive | Immutable | Performant
========================================================= */

export const AuditState = (() => {

  /* ================= PRIVATE STATE ================= */

  let _logs = [];
  let _loading = false;
  let _error = null;

  let _pagination = {
    page: 1,
    limit: 20,
    total_records: 0,
    total_pages: 0
  };

  let _filters = {
    search: null,
    action_type: null,
    admin_user_id: null,
    start_date: null,
    end_date: null
  };

  /* ================= HELPERS ================= */

  function normalizeNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  function freezeLogs(logs) {
    if (!Array.isArray(logs)) return Object.freeze([]);

    return Object.freeze(
      logs.map(item => Object.freeze({ ...item }))
    );
  }

  function safeClone(obj) {
    return { ...obj };
  }

  /* ================= LOGS ================= */

  function setLogs(payload = {}) {

    const logs = Array.isArray(payload.logs)
      ? payload.logs.filter(item => item && typeof item === "object")
      : [];

    _logs = logs;

    _pagination.total_records =
      normalizeNumber(payload.total_records);

    _pagination.total_pages =
      normalizeNumber(payload.total_pages);

    _pagination.page =
      normalizeNumber(payload.current_page, 1);
  }

  function getLogs() {
    return freezeLogs(_logs);
  }

  /* ================= PAGINATION ================= */

  function setPage(page = 1) {
    const p = normalizeNumber(page, 1);
    _pagination.page = p > 0 ? p : 1;
  }

  function setLimit(limit = 20) {
    const l = normalizeNumber(limit, 20);
    _pagination.limit = l > 0 ? l : 20;
  }

  function getPagination() {
    return Object.freeze(safeClone(_pagination));
  }

  /* ================= FILTERS ================= */

  function setFilter(key, value) {
    if (!Object.prototype.hasOwnProperty.call(_filters, key)) return;

    _filters[key] =
      value !== undefined && value !== "" ? value : null;

    _pagination.page = 1;
  }

  function getFilters() {
    return Object.freeze(safeClone(_filters));
  }

  /* ================= LOADING ================= */

  function setLoading(status) {
    _loading = Boolean(status);
  }

  function isLoading() {
    return _loading;
  }

  /* ================= ERROR ================= */

  function setError(error) {
    if (!error) {
      _error = null;
      return;
    }

    _error = {
      message: error.message || "Unknown error",
      code: error.code || null
    };
  }

  function getError() {
    return _error ? { ..._error } : null;
  }

  /* ================= RESET ================= */

  function reset() {
    _logs = [];
    _loading = false;
    _error = null;

    _pagination = {
      page: 1,
      limit: 20,
      total_records: 0,
      total_pages: 0
    };

    _filters = {
      search: null,
      action_type: null,
      admin_user_id: null,
      start_date: null,
      end_date: null
    };
  }

  /* ================= PUBLIC API ================= */

  return Object.freeze({

    setLogs,
    getLogs,

    setPage,
    setLimit,
    getPagination,

    setFilter,
    getFilters,

    setLoading,
    isLoading,

    setError,
    getError,

    reset

  });

})();

export default AuditState;