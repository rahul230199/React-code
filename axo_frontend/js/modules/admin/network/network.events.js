/* =========================================================
   AXO NETWORKS — NETWORK EVENTS (ENTERPRISE FINAL)
   Race Safe • Memory Safe • Action Locked • Modal Safe
========================================================= */

import { NetworkState } from "./network.state.js";
import { NetworkAPI } from "./network.api.js";
import Toast from "../../../core/toast.js";

export const NetworkEvents = (() => {

  let _container = null;
  let _mounted = false;
  let _requestId = 0;
  let _renderCallback = null;
  let _processing = false;
  let _searchDebounce = null;
  let _actionLock = false;
  let _escBound = false;

  /* ================= BIND ================= */

  function bind(container, { onRender } = {}) {

    if (!container || _mounted) return;

    _container = container;
    _mounted = true;
    _renderCallback =
      typeof onRender === "function" ? onRender : null;

   document.addEventListener("click", handleClick);
    _container.addEventListener("input", handleInput);
    _container.addEventListener("change", handleChange);

    if (!_escBound) {
      document.addEventListener("keydown", handleEsc);
      _escBound = true;
    }
  }

  /* ================= UNBIND ================= */

  function unbind() {

    if (!_container) return;

    document.removeEventListener("click", handleClick);
    _container.removeEventListener("input", handleInput);
    _container.removeEventListener("change", handleChange);

    if (_escBound) {
      document.removeEventListener("keydown", handleEsc);
      _escBound = false;
    }

    closeModal();

    _container = null;
    _mounted = false;
    _requestId++;
    _processing = false;
    _actionLock = false;

    if (_searchDebounce) {
      clearTimeout(_searchDebounce);
      _searchDebounce = null;
    }
  }

  /* ================= LOAD ================= */

  async function load() {

    if (!_mounted) return;

    const currentRequest = ++_requestId;

    try {

      NetworkState.setLoading(true);
      triggerRender();

      const { page, limit } = NetworkState.getPagination();
      const filters = NetworkState.getFilters();

      const data = await NetworkAPI.getRequests({
        page,
        limit,
        ...filters
      });

      if (!_mounted || currentRequest !== _requestId) return;

      NetworkState.setRequests(data);

    } catch (error) {

      if (!_mounted || currentRequest !== _requestId) return;

      Toast.error(error.message || "Failed to load network requests");

    } finally {

      if (!_mounted || currentRequest !== _requestId) return;

      NetworkState.setLoading(false);
      triggerRender();
    }
  }

  /* ================= FILTERS ================= */

  function handleInput(event) {

    const filterKey = event.target.dataset.filter;
    if (!_mounted || !filterKey) return;

    if (filterKey === "search") {

      clearTimeout(_searchDebounce);

      _searchDebounce = setTimeout(() => {

        NetworkState.setFilters({ search: event.target.value });
        NetworkState.setPage(1);
        load();

      }, 400);
    }
  }

  function handleChange(event) {

    const filterKey = event.target.dataset.filter;
    if (!_mounted || !filterKey) return;

    NetworkState.setFilters({
      [filterKey]: event.target.value || null
    });

    NetworkState.setPage(1);
    load();
  }

  function clearFilters() {

    NetworkState.setFilters({
      search: null,
      status: null,
      start_date: null,
      end_date: null
    });

    NetworkState.setPage(1);

    _container.querySelectorAll("[data-filter]")
      .forEach(i => i.value = "");

    load();
  }

  /* ================= CLICK ================= */

  function handleClick(event) {

    if (!_mounted) return;

    const target = event.target.closest("[data-action]");
    if (!target) return;

    const action = target.dataset.action;

    switch (action) {

      case "view-request":
        handleView(target.dataset.id);
        break;

      case "change-page":
        handlePageChange(target.dataset.page);
        break;

      case "reload-network":
        load();
        break;

      case "clear-filters":
        clearFilters();
        break;

      case "approve-request":
        handleApprove(target.dataset.id);
        break;

      case "reject-request":
        handleReject(target.dataset.id);
        break;
    }

    if (target.dataset.close === "true") {
      closeModal();
    }
  }

  /* ================= MODAL ================= */

  function handleEsc(e) {
    if (e.key === "Escape") closeModal();
  }

  function closeModal() {
    document
      .querySelector(".network-modal-overlay")
      ?.remove();
  }

  function handleView(id) {
    if (!id || !_renderCallback) return;
    _renderCallback({ type: "view", id });
  }

  function handlePageChange(page) {

    const newPage = Number(page);
    if (!Number.isFinite(newPage) || newPage <= 0) return;

    NetworkState.setPage(newPage);
    load();
  }

  function getModalComment() {
    return document
      .querySelector("#networkComment")
      ?.value
      ?.trim() || "";
  }

  /* ================= APPROVE / REJECT ================= */

  async function handleApprove(id) {

    if (!id || _processing || _actionLock) return;

    const comment = getModalComment();

    if (!comment) {
      Toast.error("Verification comment is required");
      return;
    }

    await processAction(() => NetworkAPI.approve(id, comment), "approved");
  }

  async function handleReject(id) {

    if (!id || _processing || _actionLock) return;

    const comment = getModalComment();

    if (!comment) {
      Toast.error("Rejection comment is required");
      return;
    }

    await processAction(() => NetworkAPI.reject(id, comment), "rejected");
  }

  async function processAction(apiCall, label) {

    _processing = true;
    _actionLock = true;

    try {

      await apiCall();

      Toast.success(`Request ${label} successfully`);
      closeModal();
      await load();

    } catch (error) {

      Toast.error(error.message || "Action failed");

    } finally {

      _processing = false;
      _actionLock = false;
    }
  }

  /* ================= RENDER ================= */

  function triggerRender() {
    _renderCallback?.({ type: "update" });
  }

  return { bind, unbind, load };

})();

export default NetworkEvents;