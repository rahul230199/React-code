/* =========================================================
   AXO NETWORKS — AUDIT EVENTS (FULLY FIXED)
========================================================= */

import { AuditAPI } from "./audit.api.js";
import { AuditState } from "./audit.state.js";
import Toast from "../../../core/toast.js";

export const AuditEvents = (() => {

  let _container = null;
  let _mounted = false;
  let _requestId = 0;
  let _renderCallback = null;
  let _searchTimeout = null;

  /* ====================================================== */

  function bind(container, { onRender } = {}) {

    if (!container || _mounted) return;

    _container = container;
    _mounted = true;
    _renderCallback =
      typeof onRender === "function" ? onRender : null;

    _container.addEventListener("input", handleInput);
    _container.addEventListener("change", handleChange);
    _container.addEventListener("click", handleClick);
  }

  /* ====================================================== */

  function unbind() {

    if (!_container) return;

    _container.removeEventListener("input", handleInput);
    _container.removeEventListener("change", handleChange);
    _container.removeEventListener("click", handleClick);

    clearTimeout(_searchTimeout);

    closeModal();

    _container = null;
    _mounted = false;
    _requestId++;
  }

  /* ====================================================== */

  async function load() {

    if (!_mounted) return;

    const currentRequest = ++_requestId;

    try {

      AuditState.setLoading(true);
      triggerRender();

      const { page, limit } = AuditState.getPagination();
      const filters = AuditState.getFilters();

      const data = await AuditAPI.getLogs({
        page,
        limit,
        ...filters
      });

      if (!_mounted || currentRequest !== _requestId) return;

      AuditState.setLogs({
        logs: data.logs,
        total_records: data.total_records,
        current_page: data.current_page,
        total_pages: data.total_pages
      });

      AuditState.setError(null);

    } catch (error) {

      if (!_mounted || currentRequest !== _requestId) return;

      AuditState.setError(error);
      Toast.error("Failed to load audit logs");

    } finally {

      if (!_mounted || currentRequest !== _requestId) return;

      AuditState.setLoading(false);
      triggerRender();
    }
  }

  /* ====================================================== */

  function handleInput(event) {

    if (!_mounted) return;

    if (event.target.id === "auditSearch") {

      clearTimeout(_searchTimeout);

      _searchTimeout = setTimeout(() => {

        AuditState.setFilter("search", event.target.value);
        AuditState.setPage(1); // reset page on filter
        load();

      }, 300);
    }
  }

  /* ====================================================== */

  function handleChange(event) {

    if (!_mounted) return;

    if (event.target.id === "auditActionFilter") {

      AuditState.setFilter("action_type", event.target.value);
      AuditState.setPage(1);
      load();
    }
  }

  /* ====================================================== */

  function handleClick(event) {

    if (!_mounted) return;

    const target = event.target.closest("[data-action]");
    if (!target) return;

    const action = target.dataset.action;

    switch (action) {

      case "change-page":
        handlePageChange(target.dataset.page);
        break;

      case "view-meta":
        showMetadata(target.dataset.meta);
        break;

      case "reload-audit":
        load();
        break;
    }
  }

  /* ====================================================== */

  function handlePageChange(page) {

    const newPage = Number(page);
    if (!Number.isFinite(newPage) || newPage <= 0) return;

    AuditState.setPage(newPage);
    load();
  }

  /* ======================================================
     METADATA MODAL (PRODUCTION SAFE)
  ====================================================== */

  function showMetadata(encodedMeta) {

    if (!encodedMeta) return;

    closeModal(); // ensure single modal

    try {

      const decoded = decodeURIComponent(encodedMeta);
      const meta = JSON.parse(decoded);

      const modal = document.createElement("div");
      modal.className = "audit-meta-overlay";

      modal.innerHTML = `
        <div class="audit-meta-modal">
          <div class="audit-meta-header">
            <h3>Metadata Details</h3>
            <button class="audit-close">✕</button>
          </div>

          <pre class="audit-meta-content">
${sanitize(JSON.stringify(meta, null, 2))}
          </pre>

          <div class="audit-meta-footer">
            <button class="audit-close btn-secondary">Close</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      document.body.style.overflow = "hidden";

      modal.addEventListener("click", (e) => {
        if (
          e.target.classList.contains("audit-meta-overlay") ||
          e.target.classList.contains("audit-close")
        ) {
          closeModal();
        }
      });

      document.addEventListener("keydown", handleEsc);

    } catch {
      Toast.warning("Invalid metadata format");
    }
  }

  function handleEsc(e) {
    if (e.key === "Escape") closeModal();
  }

  function closeModal() {

    const existing = document.querySelector(".audit-meta-overlay");

    if (existing) {
      existing.remove();
      document.body.style.overflow = "";
    }

    document.removeEventListener("keydown", handleEsc);
  }

  /* ====================================================== */

  function triggerRender() {
    _renderCallback?.();
  }

  return {
    bind,
    unbind,
    load
  };

})();

/* ========================================================= */

function sanitize(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default AuditEvents;