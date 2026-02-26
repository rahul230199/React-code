/* =========================================================
   AXO NETWORKS — ADMIN RFQ EVENTS
   Enterprise • Race Safe • Edit Mode • Winner Safe
========================================================= */

import { RFQAPI } from "./rfq.api.js";
import { RFQState } from "./rfq.state.js";
import { RFQRender } from "./rfq.render.js";
import Toast from "../../../core/toast.js";

export const RFQEvents = (() => {

  let _container = null;
  let _mounted = false;
  let _requestId = 0;
  let _renderCallback = null;
  let _actionLock = false;
  let _searchTimer = null;

  /* ======================================================
     BIND / UNBIND
  ====================================================== */

  function bind(container, { onRender } = {}) {

    if (!container) return;

    _container = container;
    _mounted = true;
    _renderCallback =
      typeof onRender === "function"
        ? onRender
        : null;

    _container.addEventListener("click", handleClick);
    _container.addEventListener("change", handleChange);
    _container.addEventListener("input", handleInput);
  }

  function unbind() {

    if (!_container) return;

    _container.removeEventListener("click", handleClick);
    _container.removeEventListener("change", handleChange);
    _container.removeEventListener("input", handleInput);

    if (_searchTimer) clearTimeout(_searchTimer);

    _container = null;
    _mounted = false;
    _requestId++;
    _actionLock = false;
  }

  /* ======================================================
     LOAD RFQS (RACE SAFE)
  ====================================================== */

  async function load() {

    if (!_mounted) return;

    const currentRequest = ++_requestId;

    try {

      RFQState.setLoading(true);
      RFQState.setError(null);
      triggerRender();

      const payload = await RFQAPI.getRFQs({
        ...RFQState.getPagination(),
        ...RFQState.getFilters()
      });

      if (!_mounted || currentRequest !== _requestId) return;

      RFQState.setRFQs(payload);

    } catch (error) {

      if (!_mounted || currentRequest !== _requestId) return;

      RFQState.setError(error);
      Toast.error(error?.message || "Failed to load RFQs");

    } finally {

      if (!_mounted || currentRequest !== _requestId) return;

      RFQState.setLoading(false);
      triggerRender();
    }
  }

  /* ======================================================
     CLICK HANDLER
  ====================================================== */

  function handleClick(event) {

    if (!_mounted) return;

    const target = event.target.closest("[data-action]");
    if (!target) return;

    switch (target.dataset.action) {

      case "change-page":
        handlePageChange(target.dataset.page);
        break;

      case "view-rfq":
        handleViewRFQ(target.dataset.id);
        break;

      case "assign-quotes":
        handleAssignQuotes(target.dataset.id);
        break;

      case "submit-quotes":
        handleSubmitQuotes(target.dataset.id);
        break;

      case "view-quotes":
        handleViewQuotes(target.dataset.id);
        break;

      case "award-quote":
        handleAwardQuote(target.dataset.id, target.dataset.quote);
        break;

      case "close-modal":
        closeModal();
        break;

      case "reload-rfq":
        load();
        break;
    }
  }

  /* ======================================================
     FILTERS
  ====================================================== */

  function handleChange(event) {

    if (!_mounted) return;

    const key = event.target.dataset.filter;
    if (!key) return;

    RFQState.setFilters({ [key]: event.target.value || null });
    RFQState.setPage(1);
    load();
  }

  function handleInput(event) {

    if (!_mounted) return;
    if (event.target.dataset.filter !== "search") return;

    if (_searchTimer) clearTimeout(_searchTimer);

    _searchTimer = setTimeout(() => {

      RFQState.setFilters({
        search: event.target.value || null
      });

      RFQState.setPage(1);
      load();

    }, 400);
  }

  /* ======================================================
     PAGINATION
  ====================================================== */

  function handlePageChange(page) {

    const newPage = Number(page);
    if (!Number.isFinite(newPage) || newPage <= 0) return;

    RFQState.setPage(newPage);
    load();
  }

  /* ======================================================
     VIEW RFQ DETAIL
  ====================================================== */

  async function handleViewRFQ(rfqId) {

    if (_actionLock) return;

    try {
      const rfq = await RFQAPI.getRFQById(rfqId);
      injectModal(RFQRender.rfqDetailModal(rfq));
    } catch (error) {
      Toast.error(error?.message || "Failed to load RFQ");
    }
  }

  /* ======================================================
     VIEW QUOTES (WINNER SAFE)
  ====================================================== */

  async function handleViewQuotes(rfqId) {

    if (_actionLock) return;

    try {

      const quotes = await RFQAPI.getQuotes(rfqId);

      injectModal(
        RFQRender.quotesModal(quotes, rfqId)
      );

    } catch (error) {
      Toast.error(error?.message || "Failed to load quotes");
    }
  }

  /* ======================================================
     ASSIGN / EDIT QUOTES (WITH PREFILL)
  ====================================================== */

  async function handleAssignQuotes(rfqId) {

    if (_actionLock) return;

    try {

      const [suppliers, existingQuotes] =
        await Promise.all([
          RFQAPI.getSuppliers(),
          RFQAPI.getQuotes(rfqId)
        ]);

      const quoteMap = new Map(
        existingQuotes.map(q => [
          String(q.supplier_org_id),
          q
        ])
      );

      injectModal(buildQuoteAssignModal(
        suppliers,
        rfqId,
        quoteMap
      ));

    } catch (error) {
      Toast.error(error?.message || "Failed to load suppliers");
    }
  }

  function buildQuoteAssignModal(suppliers, rfqId, quoteMap) {

    return `
      <div class="rfq-modal-overlay">
        <div class="rfq-modal large">

          <div class="modal-header">
            <h3>Edit / Assign Quotes</h3>
            <button data-action="close-modal">✕</button>
          </div>

          <div class="quotes-table">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Price</th>
                  <th>Timeline (days)</th>
                  <th>Reliability</th>
                </tr>
              </thead>
              <tbody>
                ${suppliers.map(s => {

                  const existing = quoteMap.get(String(s.id));

                  return `
                    <tr>
                      <td>${s.company_name}</td>
                      <td>
                        <input type="number"
                          min="0"
                          step="0.01"
                          data-price="${s.id}"
                          value="${existing?.price || ""}"
                          placeholder="Enter price" />
                      </td>
                      <td>
                        <input type="number"
                          min="0"
                          data-timeline="${s.id}"
                          value="${existing?.timeline_days || ""}"
                          placeholder="Days" />
                      </td>
                      <td>
                        ${s.reliability_score ?? "-"}%
                      </td>
                    </tr>
                  `;

                }).join("")}
              </tbody>
            </table>
          </div>

          <div style="margin-top:16px;text-align:right;">
            <button
              class="btn btn-primary"
              data-action="submit-quotes"
              data-id="${rfqId}">
              Save Quotes
            </button>
          </div>

        </div>
      </div>
    `;
  }

  /* ======================================================
     SUBMIT QUOTES (SMART VALIDATION)
  ====================================================== */

  async function handleSubmitQuotes(rfqId) {

    if (_actionLock) return;

    const priceInputs =
      _container.querySelectorAll("[data-price]");

    const quotes = [];

    priceInputs.forEach(input => {

      const supplierId = input.dataset.price;
      const price = Number(input.value);

      const timelineInput =
        _container.querySelector(
          `[data-timeline="${supplierId}"]`
        );

      const timeline = Number(timelineInput?.value);

      if (price > 0) {
        quotes.push({
          supplier_org_id: supplierId,
          price,
          timeline_days:
            timeline > 0 ? timeline : null
        });
      }

    });

    if (!quotes.length) {
      Toast.error("Enter at least one valid quote");
      return;
    }

    _actionLock = true;

    try {

      await RFQAPI.assignSuppliersWithQuotes(
        rfqId,
        quotes
      );

      closeModal();
      await load();

      Toast.success("Quotes saved successfully");

    } catch (error) {
      Toast.error(error?.message || "Assignment failed");
    } finally {
      _actionLock = false;
    }
  }

  /* ======================================================
     AWARD QUOTE (WINNER SAFE)
  ====================================================== */

  async function handleAwardQuote(rfqId, quoteId) {

    if (_actionLock) return;

    _actionLock = true;

    try {

      await RFQAPI.awardQuote(rfqId, quoteId);

      closeModal();
      await load();

      Toast.success("Quote awarded successfully");

    } catch (error) {
      Toast.error(error?.message || "Award failed");
    } finally {
      _actionLock = false;
    }
  }

  /* ======================================================
     MODAL CONTROL
  ====================================================== */

  function injectModal(html) {
    closeModal();
    _container.insertAdjacentHTML("beforeend", html);
  }

  function closeModal() {
    const modal =
      _container?.querySelector(".rfq-modal-overlay");
    if (modal) modal.remove();
  }

  /* ======================================================
     RENDER TRIGGER
  ====================================================== */

  function triggerRender() {
    if (!_renderCallback) return;
    _renderCallback({ type: "update" });
  }

  /* ====================================================== */

  return {
    bind,
    unbind,
    load
  };

})();

export default RFQEvents;