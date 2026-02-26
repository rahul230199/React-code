/* =========================================================
   AXO NETWORKS — DASHBOARD EVENTS (PRODUCTION HARDENED)
   Container Safe • Rebind Safe • Immutable
========================================================= */

export const DashboardEvents = (() => {

  let _container = null;
  let _reloadCallback = null;

  /* ====================================================== */

  function bind(container, { onReload } = {}) {

    if (!container || !(container instanceof HTMLElement)) return;

    // If already bound to same container, do nothing
    if (_container === container) return;

    // If bound to different container, clean first
    if (_container) {
      unbind();
    }

    _container = container;
    _reloadCallback =
      typeof onReload === "function" ? onReload : null;

    _container.addEventListener("click", handleClick);
  }

  /* ====================================================== */

  function handleClick(event) {

    if (!_container) return;

    // Ensure event belongs to current container
    if (!_container.contains(event.target)) return;

    const target = event.target.closest("[data-action]");
    if (!target) return;

    const action = target.dataset.action;

    if (action === "reload-dashboard" && _reloadCallback) {
      _reloadCallback();
    }
  }

  /* ====================================================== */

  function unbind() {

    if (!_container) return;

    _container.removeEventListener("click", handleClick);

    _container = null;
    _reloadCallback = null;
  }

  /* ====================================================== */

  return Object.freeze({
    bind,
    unbind
  });

})();

export default DashboardEvents;