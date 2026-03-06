/* =========================================================
AXO NETWORKS — ADMIN ORDERS STATE
Centralized UI State Manager
========================================================= */

const state = {

  /* =========================================
     ORDERS LIST
  ========================================= */

  orders: [],

  pagination: {
    current_page: 1,
    total_pages: 1,
    limit: 10,
    total_records: 0
  },

  filters: {
    status: "ALL"
  },

  /* =========================================
     SELECTED ORDER THREAD
  ========================================= */

  selectedOrder: null,

  thread: {
    purchase_order: null,
    milestones: [],
    payments: [],
    disputes: [],
    events: [],
    messages: [],
    sla_breaches: []
  },

  /* =========================================
     UI STATE
  ========================================= */

  loading: false,
  error: null

};


/* =========================================================
RESET STATE
========================================================= */

export function resetOrdersState() {

  state.orders = [];

  state.pagination = {
    current_page: 1,
    total_pages: 1,
    limit: 10,
    total_records: 0
  };

  state.filters = {
    status: "ALL"
  };

  state.selectedOrder = null;

  state.thread = {
    purchase_order: null,
    milestones: [],
    payments: [],
    disputes: [],
    events: [],
    messages: [],
    sla_breaches: []
  };

  state.loading = false;
  state.error = null;

}


/* =========================================================
SET ORDERS
========================================================= */

export function setOrders(data) {

  state.orders = data.orders || [];

  state.pagination = {
    current_page: data.current_page || 1,
    total_pages: data.total_pages || 1,
    total_records: data.total_records || 0,
    limit: state.pagination.limit
  };

}


/* =========================================================
GET ORDERS
========================================================= */

export function getOrders() {
  return state.orders;
}


/* =========================================================
PAGINATION
========================================================= */

export function getPagination() {
  return state.pagination;
}

export function setPage(page) {
  state.pagination.current_page = page;
}


/* =========================================================
FILTERS
========================================================= */

export function getFilters() {
  return state.filters;
}

export function setStatusFilter(status) {
  state.filters.status = status || "ALL";
}


/* =========================================================
SELECT ORDER
========================================================= */

export function setSelectedOrder(data) {

  state.selectedOrder = data.purchase_order;

  state.thread = {
    purchase_order: data.purchase_order,
    milestones: data.milestones || [],
    payments: data.payments || [],
    disputes: data.disputes || [],
    events: data.events || [],
    messages: data.messages || [],
    sla_breaches: data.sla_breaches || []
  };

}

export function getSelectedOrder() {
  return state.selectedOrder;
}

export function getOrderThread() {
  return state.thread;
}


/* =========================================================
MESSAGES UPDATE
========================================================= */

export function addMessage(message) {

  if (!message) return;

  state.thread.messages.push(message);

}


/* =========================================================
LOADING
========================================================= */

export function setLoading(value) {
  state.loading = Boolean(value);
}

export function isLoading() {
  return state.loading;
}


/* =========================================================
ERROR
========================================================= */

export function setError(message) {
  state.error = message || null;
}

export function getError() {
  return state.error;
}