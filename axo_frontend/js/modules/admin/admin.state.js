/* =========================================================
   AXO NETWORKS — ADMIN STATE (ENTERPRISE STABLE)
   ES Module Version
   - Pagination safe
   - Filter safe
   - Immutable-safe getters
   - Backend contract resilient
========================================================= */

export const AdminState = {

  /* =====================================================
     CORE DATA
  ===================================================== */
  requests: [],
  users: [],

  /* =====================================================
     PAGINATION STATE (NETWORK REQUESTS)
  ===================================================== */
  requestPagination: {
    page: 1,
    limit: 10,
    total_records: 0,
    total_pages: 0,
  },

  /* =====================================================
     FILTER STATE (SERVER-DRIVEN)
  ===================================================== */
  requestFilters: {
    status: null,
    search: null,
    start_date: null,
    end_date: null,
  },

  /* =====================================================
     VIEW STATE
  ===================================================== */
  currentView: "requests",
  currentViewingItem: null,

  /* =====================================================
     LOADING STATE
  ===================================================== */
  isLoading: false,

  /* =====================================================
     AUTO REFRESH
  ===================================================== */
  autoRefreshTimer: null,

  /* =====================================================
     REQUESTS (SAFE CONTRACT HANDLING)
  ===================================================== */
  setRequests(payload) {

    if (!payload || typeof payload !== "object") {
      this.requests = [];
      return;
    }

    // Handle both:
    // { requests, total_records, total_pages }
    // OR direct array response

    if (Array.isArray(payload)) {
      this.requests = payload;
      this.requestPagination.total_records = payload.length;
      this.requestPagination.total_pages = 1;
      return;
    }

    this.requests = payload.requests || [];

    this.requestPagination.total_records =
      Number(payload.total_records) || 0;

    this.requestPagination.total_pages =
      Number(payload.total_pages) || 0;
  },

  getRequests() {
    return [...this.requests]; // prevent direct mutation
  },

  /* =====================================================
     USERS
  ===================================================== */
  setUsers(data) {
    this.users = Array.isArray(data) ? data : [];
  },

  getUsers() {
    return [...this.users];
  },

  /* =====================================================
     PAGINATION CONTROL
  ===================================================== */
  setPage(page) {
    const p = Number(page);
    this.requestPagination.page =
      p > 0 ? p : 1;
  },

  setLimit(limit) {
    const l = Number(limit);
    this.requestPagination.limit =
      l > 0 ? l : 10;
  },

  getPagination() {
    return { ...this.requestPagination };
  },

  /* =====================================================
     FILTER CONTROL
  ===================================================== */
  setFilters(filters = {}) {

    const cleanFilters = {
      status: filters.status ?? null,
      search: filters.search ?? null,
      start_date: filters.start_date ?? null,
      end_date: filters.end_date ?? null,
    };

    this.requestFilters = {
      ...this.requestFilters,
      ...cleanFilters,
    };
  },

  resetFilters() {
    this.requestFilters = {
      status: null,
      search: null,
      start_date: null,
      end_date: null,
    };
  },

  getFilters() {
    return { ...this.requestFilters };
  },

  /* =====================================================
     VIEW CONTROL
  ===================================================== */
  setCurrentView(view) {
    if (view === "requests" || view === "users") {
      this.currentView = view;
    }
  },

  getCurrentView() {
    return this.currentView;
  },

  setCurrentViewingItem(item) {
    this.currentViewingItem = item || null;
  },

  getCurrentViewingItem() {
    return this.currentViewingItem;
  },

  /* =====================================================
     LOADING CONTROL
  ===================================================== */
  setLoading(value) {
    this.isLoading = Boolean(value);
  },

  getLoading() {
    return this.isLoading;
  },

  /* =====================================================
     AUTO REFRESH CONTROL
  ===================================================== */
  setAutoRefreshTimer(timer) {
    this.autoRefreshTimer = timer;
  },

  clearAutoRefresh() {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }
  }

};

export default AdminState;