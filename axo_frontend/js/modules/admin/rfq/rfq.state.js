/* =========================================================
   AXO NETWORKS — ADMIN RFQ STATE
   Enterprise • Container Scoped • Memory Safe • Race Safe
========================================================= */

export const RFQState = (() => {

  /* ======================================================
     CONSTANTS
  ====================================================== */

  const VALID_STATUSES = ["open", "closed", "awarded", "cancelled"];
  const VALID_PRIORITIES = ["low", "normal", "high", "urgent"];
  const VALID_VISIBILITY = ["public", "private"];
  const VALID_QUOTE_STATUS = ["submitted", "accepted", "rejected"];

  /* ======================================================
     INTERNAL STATE
  ====================================================== */

  let _rfqs = [];
  let _rfqDetail = null;
  let _quotes = [];
  let _suppliers = [];

  let _loading = false;
  let _error = null;

  let _activeModal = null; // 'view' | 'assign' | null

  let _pagination = {
    page: 1,
    limit: 10,
    total_records: 0,
    total_pages: 0
  };

  let _filters = {
    status: null,
    priority: null,
    visibility_type: null,
    search: null
  };

  let _snapshot = null;

  /* ======================================================
     HELPERS
  ====================================================== */

  function normalizeNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  function normalizeString(value) {
    if (value === null || value === undefined) return null;
    const trimmed = String(value).trim();
    return trimmed.length ? trimmed : null;
  }

  function clone(obj) {
    return obj ? { ...obj } : null;
  }

  function freezeArray(arr) {
    return Object.freeze(arr.map(item => Object.freeze({ ...item })));
  }

  /* ======================================================
     RFQ NORMALIZATION
  ====================================================== */

  function normalizeRFQ(item = {}) {
    if (!item || typeof item !== "object") return null;
    if (!item.id) return null;

    return {
      id: item.id,
      part_name: normalizeString(item.part_name),
      quantity: normalizeNumber(item.quantity),
      status: VALID_STATUSES.includes(item.status) ? item.status : "open",
      priority: VALID_PRIORITIES.includes(item.priority) ? item.priority : "normal",
      visibility_type: VALID_VISIBILITY.includes(item.visibility_type) ? item.visibility_type : "public",
      buyer_company: normalizeString(item.buyer_company),
      created_at: item.created_at || null,
      quote_count: normalizeNumber(item.quote_count, 0)
    };
  }

  function normalizeQuote(item = {}) {
    if (!item || typeof item !== "object") return null;

    return {
      id: item.id,
      supplier_org_id: item.supplier_org_id,
      company_name: normalizeString(item.company_name),
      price: normalizeNumber(item.price),
      timeline_days: normalizeNumber(item.timeline_days),
      certifications: normalizeString(item.certifications),
      reliability_snapshot: normalizeNumber(item.reliability_snapshot),
      status: VALID_QUOTE_STATUS.includes(item.status) ? item.status : "submitted"
    };
  }

  /* ======================================================
     LOADING / ERROR
  ====================================================== */

  function setLoading(value) {
    _loading = Boolean(value);
  }

  function isLoading() {
    return _loading;
  }

  function setError(err) {
    if (!err) {
      _error = null;
      return;
    }

    _error = {
      message: err.message || "Unknown error",
      code: err.code || null
    };
  }

  function getError() {
    return _error ? { ..._error } : null;
  }

  /* ======================================================
     RFQ LIST
  ====================================================== */

  function setRFQs(payload) {
    if (!payload || typeof payload !== "object") {
      _rfqs = [];
      return;
    }

    _rfqs = Array.isArray(payload.rfqs)
      ? payload.rfqs.map(normalizeRFQ).filter(Boolean)
      : [];

    _pagination.total_records = normalizeNumber(payload.total_records);
    _pagination.total_pages = normalizeNumber(payload.total_pages);
    _pagination.page = normalizeNumber(payload.current_page, 1);
  }

  function getRFQs() {
    return freezeArray(_rfqs);
  }

  /* ======================================================
     RFQ DETAIL
  ====================================================== */

  function setRFQDetail(data) {
    _rfqDetail = data ? Object.freeze({ ...data }) : null;
  }

  function getRFQDetail() {
    return _rfqDetail ? { ..._rfqDetail } : null;
  }

  function clearRFQDetail() {
    _rfqDetail = null;
  }

  /* ======================================================
     SUPPLIERS
  ====================================================== */

  function setSuppliers(list = []) {
    _suppliers = Array.isArray(list)
      ? list.map(s => Object.freeze({ ...s }))
      : [];
  }

  function getSuppliers() {
    return freezeArray(_suppliers);
  }

  /* ======================================================
     QUOTES
  ====================================================== */

  function setQuotes(list = []) {
    _quotes = Array.isArray(list)
      ? list.map(normalizeQuote).filter(Boolean)
      : [];
  }

  function getQuotes() {
    return freezeArray(_quotes);
  }

  function markQuoteAccepted(quoteId) {
    _quotes = _quotes.map(q =>
      q.id === quoteId
        ? { ...q, status: "accepted" }
        : { ...q, status: "rejected" }
    );
  }

  /* ======================================================
     MODAL CONTROL
  ====================================================== */

  function openModal(type) {
    _activeModal = type;
  }

  function closeModal() {
    _activeModal = null;
  }

  function getActiveModal() {
    return _activeModal;
  }

  /* ======================================================
     PAGINATION
  ====================================================== */

  function setPage(page) {
    const p = normalizeNumber(page, 1);
    _pagination.page = p > 0 ? p : 1;
  }

  function getPagination() {
    return Object.freeze(clone(_pagination));
  }

  /* ======================================================
     FILTERS
  ====================================================== */

  function setFilters(filters = {}) {
    if (typeof filters !== "object") return;

    if ("status" in filters)
      _filters.status = VALID_STATUSES.includes(filters.status)
        ? filters.status
        : null;

    if ("priority" in filters)
      _filters.priority = VALID_PRIORITIES.includes(filters.priority)
        ? filters.priority
        : null;

    if ("visibility_type" in filters)
      _filters.visibility_type = VALID_VISIBILITY.includes(filters.visibility_type)
        ? filters.visibility_type
        : null;

    if ("search" in filters)
      _filters.search = normalizeString(filters.search);

    _pagination.page = 1;
  }

  function getFilters() {
    return Object.freeze(clone(_filters));
  }

  /* ======================================================
     SNAPSHOT (FOR ROLLBACK)
  ====================================================== */

  function createSnapshot() {
    _snapshot = {
      rfqs: [..._rfqs],
      quotes: [..._quotes],
      pagination: clone(_pagination),
      filters: clone(_filters)
    };
  }

  function rollbackSnapshot() {
    if (!_snapshot) return;

    _rfqs = [..._snapshot.rfqs];
    _quotes = [..._snapshot.quotes];
    _pagination = clone(_snapshot.pagination);
    _filters = clone(_snapshot.filters);

    _snapshot = null;
  }

  function clearSnapshot() {
    _snapshot = null;
  }

  /* ======================================================
     RESET
  ====================================================== */

  function reset() {
    _rfqs = [];
    _rfqDetail = null;
    _quotes = [];
    _suppliers = [];
    _loading = false;
    _error = null;
    _activeModal = null;
    _snapshot = null;

    _pagination = {
      page: 1,
      limit: 10,
      total_records: 0,
      total_pages: 0
    };

    _filters = {
      status: null,
      priority: null,
      visibility_type: null,
      search: null
    };
  }

  /* ======================================================
     PUBLIC API
  ====================================================== */

  return Object.freeze({

    // loading
    setLoading,
    isLoading,

    // error
    setError,
    getError,

    // list
    setRFQs,
    getRFQs,

    // detail
    setRFQDetail,
    getRFQDetail,
    clearRFQDetail,

    // suppliers
    setSuppliers,
    getSuppliers,

    // quotes
    setQuotes,
    getQuotes,
    markQuoteAccepted,

    // modal
    openModal,
    closeModal,
    getActiveModal,

    // pagination
    setPage,
    getPagination,

    // filters
    setFilters,
    getFilters,

    // snapshot
    createSnapshot,
    rollbackSnapshot,
    clearSnapshot,

    // reset
    reset

  });

})();

export default RFQState;