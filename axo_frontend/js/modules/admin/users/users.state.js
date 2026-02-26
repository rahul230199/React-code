/* =========================================================
   AXO NETWORKS — USERS STATE
   ENTERPRISE • IMMUTABLE • RACE SAFE • DETERMINISTIC
========================================================= */

const createInitialState = () => ({

  /* ================= DATA ================= */
  users: [],
  selectedUser: null,

  /* ================= UI STATE ================= */
  loading: false,
  error: null,

  /* ================= REQUEST TRACKING ================= */
  requestId: null, // prevents stale overwrites

  /* ================= FILTERS ================= */
  search: "",
  roleFilter: "all",
  statusFilter: "all",
  organizationFilter: "all",

  /* ================= PAGINATION ================= */
  page: 1,
  limit: 10,
  totalRecords: 0,
  totalPages: 0,

  /* ================= MODALS ================= */
  activeModal: null, // 'view' | 'edit' | 'reset' | null

  /* ================= RESET PASSWORD ================= */
  temporaryPassword: null

});

/* =========================================================
   STATE MODULE
========================================================= */

export const UsersState = {

  _state: createInitialState(),

  /* =====================================================
     RESET
  ===================================================== */
  reset() {
    this._state = createInitialState();
  },

  /* =====================================================
     SAFE SNAPSHOT (IMMUTABLE COPY)
  ===================================================== */
  get() {
    return {
      ...this._state,
      users: [...this._state.users],
      selectedUser: this._state.selectedUser
        ? { ...this._state.selectedUser }
        : null
    };
  },

  /* =====================================================
     INTERNAL SAFE SET
  ===================================================== */
  _commit(nextState) {
    this._state = Object.freeze({
      ...nextState
    });
  },

  /* =====================================================
     GENERIC PATCH (SAFE MERGE)
  ===================================================== */
  set(patch = {}) {
    if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
      return;
    }

    this._commit({
      ...this._state,
      ...patch
    });
  },

  /* =====================================================
     REQUEST TRACKING (RACE SAFE)
  ===================================================== */
  startRequest(id) {
    this._commit({
      ...this._state,
      loading: true,
      error: null,
      requestId: id
    });
  },

  finishRequest(id) {
    if (this._state.requestId !== id) return;

    this._commit({
      ...this._state,
      loading: false,
      requestId: null
    });
  },

  failRequest(id, errorMessage) {
    if (this._state.requestId !== id) return;

    this._commit({
      ...this._state,
      loading: false,
      error: errorMessage || "Something went wrong",
      requestId: null
    });
  },

  /* =====================================================
     USERS
  ===================================================== */
  setUsers(data = []) {
    this._commit({
      ...this._state,
      users: Array.isArray(data) ? [...data] : []
    });
  },

  /* =====================================================
     PAGINATION
  ===================================================== */
  setPagination({
    page,
    limit,
    totalRecords,
    totalPages
  } = {}) {

    this._commit({
      ...this._state,
      page: Number.isFinite(page) ? page : this._state.page,
      limit: Number.isFinite(limit) ? limit : this._state.limit,
      totalRecords: Number.isFinite(totalRecords)
        ? totalRecords
        : this._state.totalRecords,
      totalPages: Number.isFinite(totalPages)
        ? totalPages
        : this._state.totalPages
    });
  },

  /* =====================================================
     FILTERS (AUTO RESET PAGE)
  ===================================================== */
  setFilters({
    search,
    roleFilter,
    statusFilter,
    organizationFilter
  } = {}) {

    this._commit({
      ...this._state,
      search: typeof search === "string"
        ? search
        : this._state.search,
      roleFilter: roleFilter || this._state.roleFilter,
      statusFilter: statusFilter || this._state.statusFilter,
      organizationFilter: organizationFilter || this._state.organizationFilter,
      page: 1 // reset page when filters change
    });
  },

  /* =====================================================
     LOADING / ERROR
  ===================================================== */
  setLoading(value) {
    this._commit({
      ...this._state,
      loading: Boolean(value)
    });
  },

  setError(message) {
    this._commit({
      ...this._state,
      error: message || null
    });
  },

  /* =====================================================
     MODAL CONTROL
  ===================================================== */
  openModal(type, user = null) {

    const allowed = ["view", "edit", "reset"];

    this._commit({
      ...this._state,
      activeModal: allowed.includes(type) ? type : null,
      selectedUser: user ? { ...user } : null,
      temporaryPassword: null
    });
  },

  closeModal() {
    this._commit({
      ...this._state,
      activeModal: null,
      selectedUser: null,
      temporaryPassword: null
    });
  },

  /* =====================================================
     TEMP PASSWORD
  ===================================================== */
  setTemporaryPassword(password) {
    this._commit({
      ...this._state,
      temporaryPassword: password || null
    });
  },

};

export default UsersState;