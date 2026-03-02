/* =========================================================
   AXO NETWORKS — RFQ STATE MANAGER (ENTERPRISE HARDENED)
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

const normalizeTier = (v) =>
  typeof v === "string"
    ? v.toUpperCase()
    : null;

/* =========================================================
   STATE
========================================================= */

export const RFQState = {

  rfqs: [],
  selectedRFQ: null,

  quotes: [],
  comparisonMatrix: [],

  aiReplaySnapshot: null,
  supplierRanking: [],

  loading: {
    dashboard: false,
    intelligence: false,
    replay: false
  },

  filters: {
    tier: null,
    recommendedOnly: false,
    maxPrice: null
  },

  sorting: {
    key: null,
    direction: "desc"
  },

  optimistic: {
    acceptedQuoteId: null
  },

  socket: null,

  abortControllers: {
    dashboard: null,
    intelligence: null,
    replay: null
  },

  /* =======================================================
     SETTERS
  ======================================================= */

  setRFQs(data = []) {
    this.rfqs = Array.isArray(data)
      ? data.map(r => clone(r))
      : [];
  },

  setSelectedRFQ(id) {

    const numeric = toNumber(id);

    if (this.selectedRFQ !== numeric) {

      this.selectedRFQ = numeric;

      this.quotes = [];
      this.comparisonMatrix = [];
      this.aiReplaySnapshot = null;
      this.optimistic.acceptedQuoteId = null;
    }
  },

  setQuotes(data = []) {
    this.quotes = Array.isArray(data)
      ? data.map(q => clone(q))
      : [];
  },

  setComparisonMatrix(data = []) {
    this.comparisonMatrix = Array.isArray(data)
      ? data.map(m => clone(m))
      : [];
  },

  /* =======================================================
     FILTERS
  ======================================================= */

  setFilter(key, value) {

    if (!this.filters.hasOwnProperty(key)) return;

    if (key === "tier") {
      value = normalizeTier(value);
    }

    if (key === "maxPrice") {
      value = toNumber(value);
    }

    this.filters = {
      ...this.filters,
      [key]: value
    };
  },

  clearFilters() {
    this.filters = {
      tier: null,
      recommendedOnly: false,
      maxPrice: null
    };
  },

  /* =======================================================
     SORTING
  ======================================================= */

  setSorting(key, direction = "desc") {
    this.sorting = {
      key,
      direction
    };
  },

  /* =======================================================
     OPTIMISTIC
  ======================================================= */

  setOptimisticQuote(id) {
    this.optimistic.acceptedQuoteId = toNumber(id);
  },

  clearOptimistic() {
    this.optimistic.acceptedQuoteId = null;
  },

  /* =======================================================
     DERIVED SELECTORS
  ======================================================= */

  getFilteredQuotes() {

    let result = [...this.quotes];

    /* Tier Filter */
    if (this.filters.tier) {

      const tier = normalizeTier(this.filters.tier);

      result = result.filter(
        q => normalizeTier(q.reliability_tier) === tier
      );
    }

    /* Recommended Filter */
    if (this.filters.recommendedOnly === true) {
      result = result.filter(
        q => Boolean(q.is_recommended)
      );
    }

    /* Max Price Filter */
    if (this.filters.maxPrice !== null) {
      result = result.filter(
        q => Number(q.price) <= this.filters.maxPrice
      );
    }

    /* Apply Sorting To Quotes If Defined */
    if (this.sorting.key) {

      const key = this.sorting.key;
      const dir = this.sorting.direction;

      result = [...result].sort((a, b) => {

        const aVal = Number(a[key] ?? 0);
        const bVal = Number(b[key] ?? 0);

        return dir === "asc"
          ? aVal - bVal
          : bVal - aVal;
      });
    }

    return result;
  },

  getSortedMatrix() {

    if (!this.sorting.key)
      return [...this.comparisonMatrix];

    const key = this.sorting.key;
    const dir = this.sorting.direction;

    return [...this.comparisonMatrix].sort((a, b) => {

      const aVal = Number(a[key] ?? 0);
      const bVal = Number(b[key] ?? 0);

      return dir === "asc"
        ? aVal - bVal
        : bVal - aVal;
    });
  },
/* =======================================================
   LOADING STATE
======================================================= */

setLoading(key, value) {

  if (!this.loading.hasOwnProperty(key)) return;

  this.loading = {
    ...this.loading,
    [key]: Boolean(value)
  };
},
  /* =======================================================
     RESET
  ======================================================= */

  reset() {

    this.rfqs = [];
    this.selectedRFQ = null;

    this.quotes = [];
    this.comparisonMatrix = [];

    this.aiReplaySnapshot = null;
    this.supplierRanking = [];

    this.loading = {
      dashboard: false,
      intelligence: false,
      replay: false
    };

    this.clearFilters();

    this.sorting = {
      key: null,
      direction: "desc"
    };

    this.optimistic.acceptedQuoteId = null;

    this.cancelAllRequests?.();
    this.closeSocket?.();
  }

};

