/* =========================================================
   AXO NETWORKS — ORDERS STATE MANAGER
   Enterprise Hardened | SLA Aware | Thread Driven
   Immutable Safe | Route Safe | Mobile Ready
========================================================= */

const clone = (v) =>
  Array.isArray(v) ? [...v] :
  typeof v === "object" && v !== null
    ? { ...v }
    : v;

const toNumber = (v) =>
  v === null || v === undefined || v === ""
    ? null
    : Number(v);

/* =========================================================
   STATE OBJECT
========================================================= */

export const OrdersState = {

  /* =====================================================
     CORE DATA
  ===================================================== */
  orders: [],
  selectedOrderId: null,

  orderThread: {
    po: null,
    timeline: [],
    milestones: [],
    messages: [],
    events: []
  },

  slaDashboard: null,
  slaRisk: null,

  /* =====================================================
     UI STATE
  ===================================================== */
  activeTab: "timeline", // timeline | messages | events | payments
  isMobileThreadOpen: false,

  /* =====================================================
     LOADING STATE
  ===================================================== */
  loading: {
    list: false,
    thread: false,
    slaDashboard: false,
    slaRisk: false,
    action: false
  },

  /* =====================================================
     FILTERS
  ===================================================== */
  filters: {
    status: null,
    riskLevel: null,
    search: null
  },

  /* =====================================================
     SORTING
  ===================================================== */
  sorting: {
    key: "created_at",
    direction: "desc"
  },

  /* =====================================================
     OPTIMISTIC STATE
  ===================================================== */
  optimistic: {
    updatingStatus: false,
    completingMilestone: null,
    sendingMessage: false
  },

  /* =====================================================
     SETTERS
  ===================================================== */

  setOrders(data = []) {
    this.orders = Array.isArray(data)
      ? data.map(o => clone(o))
      : [];
  },

  setSelectedOrder(id) {
    const numeric = toNumber(id);

    if (this.selectedOrderId !== numeric) {
      this.selectedOrderId = numeric;

      this.orderThread = {
        po: null,
        timeline: [],
        milestones: [],
        messages: [],
        events: []
      };

      this.slaRisk = null;
      this.activeTab = "timeline";
    }
  },

  setOrderThread(data = {}) {
    this.orderThread = {
      po: clone(data.po || {}),
      timeline: clone(data.timeline || []),
      milestones: clone(data.milestones || []),
      messages: clone(data.messages || []),
      events: clone(data.events || [])
    };
  },

  setSLADashboard(data) {
    this.slaDashboard = clone(data);
  },

  setSLARisk(data) {
    this.slaRisk = clone(data);
  },

  setActiveTab(tab) {
    this.activeTab = tab;
  },

  toggleMobileThread(open) {
    this.isMobileThreadOpen =
      typeof open === "boolean"
        ? open
        : !this.isMobileThreadOpen;
  },

  /* =====================================================
     LOADING
  ===================================================== */

  setLoading(key, value) {
    if (!this.loading.hasOwnProperty(key)) return;

    this.loading = {
      ...this.loading,
      [key]: Boolean(value)
    };
  },

  /* =====================================================
     FILTERS
  ===================================================== */

  setFilter(key, value) {
    if (!this.filters.hasOwnProperty(key)) return;

    this.filters = {
      ...this.filters,
      [key]: value
    };
  },

  clearFilters() {
    this.filters = {
      status: null,
      riskLevel: null,
      search: null
    };
  },

  /* =====================================================
     SORTING
  ===================================================== */

  setSorting(key, direction = "desc") {
    this.sorting = {
      key,
      direction
    };
  },

  /* =====================================================
     OPTIMISTIC
  ===================================================== */

  setOptimisticStatus(value) {
    this.optimistic.updatingStatus = Boolean(value);
  },

  setOptimisticMilestone(name) {
    this.optimistic.completingMilestone = name;
  },

  clearOptimistic() {
    this.optimistic = {
      updatingStatus: false,
      completingMilestone: null,
      sendingMessage: false
    };
  },

  /* =====================================================
     DERIVED SELECTORS
  ===================================================== */

  getFilteredOrders() {

    let result = [...this.orders];

    /* Status Filter */
    if (this.filters.status) {
      result = result.filter(
        o => o.status === this.filters.status
      );
    }

    /* Risk Filter */
    if (this.filters.riskLevel) {
      result = result.filter(
        o => o.risk_level === this.filters.riskLevel
      );
    }

    /* Search */
    if (this.filters.search) {
      const q = this.filters.search.toLowerCase();

      result = result.filter(o =>
        o.po_number?.toLowerCase().includes(q) ||
        o.supplier_name?.toLowerCase().includes(q) ||
        o.buyer_name?.toLowerCase().includes(q)
      );
    }

    /* Sorting */
    const { key, direction } = this.sorting;

    if (key) {
      result = result.sort((a, b) => {

        const aVal = a[key] ?? 0;
        const bVal = b[key] ?? 0;

        if (direction === "asc")
          return aVal > bVal ? 1 : -1;

        return aVal < bVal ? 1 : -1;
      });
    }

    return result;
  },

  getCurrentOrder() {
    return this.orderThread.po;
  },

  hasThread() {
    return !!this.orderThread?.po;
  },

  /* =====================================================
     RESET
  ===================================================== */

  reset() {

    this.orders = [];
    this.selectedOrderId = null;

    this.orderThread = {
      po: null,
      timeline: [],
      milestones: [],
      messages: [],
      events: []
    };

    this.slaDashboard = null;
    this.slaRisk = null;

    this.loading = {
      list: false,
      thread: false,
      slaDashboard: false,
      slaRisk: false,
      action: false
    };

    this.clearFilters();

    this.sorting = {
      key: "created_at",
      direction: "desc"
    };

    this.optimistic = {
      updatingStatus: false,
      completingMilestone: null,
      sendingMessage: false
    };

    this.isMobileThreadOpen = false;
  }

};