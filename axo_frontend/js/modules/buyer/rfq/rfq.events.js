/* =========================================================
   AXO NETWORKS — RFQ EVENTS (ENTERPRISE HARDENED)
   - Strict overlay close
   - Double-click safe
   - Status-aware accept
   - Clean lifecycle
   - Optimistic-safe
========================================================= */

import { RFQService } from "./rfq.service.js";
import { RFQRender } from "./rfq.render.js";
import { RFQState } from "./rfq.state.js";
import { RFQCreateForm } from "./rfq.components/rfq-create.form.js";
import Toast from "../../../core/toast.js";

let isBound = false;
let boundHandler = null;

/* =========================================================
   MODAL CONTROL
========================================================= */

function openModal() {
  document.body.classList.add("modal-open");
}

function closeModal() {
  const zone = document.getElementById("rfqOverlayZone");
  if (zone) zone.innerHTML = "";
  document.body.classList.remove("modal-open");
}

/* =========================================================
   SAFE ASYNC WRAPPER
========================================================= */

async function safeAsync(fn) {
  try {
    await fn();
  } catch (err) {
    console.error(err);
    Toast.error(err.message || "Something went wrong");
  }
}

/* =========================================================
   MAIN CONTROLLER
========================================================= */

export const RFQEvents = {

  init() {

    if (isBound) return;

    boundHandler = async (e) => {

      const target = e.target.closest(
        "[data-view],[data-accept],[data-replay],[data-close],[data-sort],[data-filter],[data-compare],[data-submit-rfq],#rfqNewBtn,#rfqRankingBtn,.overlay"
      );

      if (!target) return;

      /* =====================================================
         STRICT OVERLAY CLOSE (FIXED)
      ===================================================== */
      if (
        target.classList.contains("overlay") &&
        e.target === target
      ) {
        closeModal();
        return;
      }

      /* =====================================================
         NEW RFQ MODAL
      ===================================================== */
      if (target.id === "rfqNewBtn") {
        RFQRender.openCreateModal();
        openModal();
        return;
      }

      /* =====================================================
         SUPPLIER RANKING BUTTON
      ===================================================== */
      if (target.id === "rfqRankingBtn") {
        RFQRender.openCompareModal();
        openModal();
        return;
      }

      /* =====================================================
         SUBMIT RFQ
      ===================================================== */
      if (target.dataset.submitRfq !== undefined) {

        const data = RFQCreateForm.getFormData();
        const error = RFQCreateForm.validate(data);

        if (error) {
          Toast.error(error);
          return;
        }

        await safeAsync(async () => {

          RFQRender.showLoader();

          let design_file_url = null;

          if (data.file) {
            const upload =
              await RFQService.uploadDesignFile(data.file);
            design_file_url = upload?.url || null;
          }

          await RFQService.createRFQ({
            part_name: data.part_name,
            part_description: data.part_description,
            quantity: data.quantity,
            ppap_level: data.ppap_level,
            priority: data.priority,
            design_file_url,
            visibility_type: "open"
          });

          closeModal();
          await RFQService.bootstrapDashboard();
        });

        return;
      }

      /* =====================================================
         VIEW QUOTES
      ===================================================== */
      if (target.dataset.view) {

        await safeAsync(async () => {

          RFQRender.showLoader();

          await RFQService.loadQuotes(target.dataset.view);

          RFQRender.renderIntelligence();
          openModal();
          animateVisuals();
        });

        return;
      }

      /* =====================================================
         COMPARE ALL
      ===================================================== */
      if (target.dataset.compare !== undefined) {
        RFQRender.openCompareModal();
        openModal();
        return;
      }

      /* =====================================================
         ACCEPT QUOTE (HARDENED)
      ===================================================== */
      if (target.dataset.accept) {

        const rfqId = RFQState.selectedRFQ;
        const quoteId = target.dataset.accept;

        if (!rfqId) return;

        const selectedRFQ =
          RFQState.rfqs.find(r => r.id === rfqId);

        if (!selectedRFQ || selectedRFQ.status !== "open") {
          Toast.error("RFQ is not open for acceptance");
          return;
        }

        if (RFQState.optimistic.acceptedQuoteId) return;

        await safeAsync(async () => {

          RFQState.setOptimisticQuote(quoteId);

          await RFQService.acceptQuote(rfqId, quoteId);

          RFQState.clearOptimistic();

          closeModal();
          await RFQService.bootstrapDashboard();
        });

        return;
      }

      /* =====================================================
         AI REPLAY
      ===================================================== */
      if (target.dataset.replay !== undefined) {

        await safeAsync(async () => {

          RFQRender.showLoader();

          await RFQService.loadAIReplay(
            RFQState.selectedRFQ
          );
        });

        return;
      }

      /* =====================================================
         SORT MATRIX
      ===================================================== */
      if (target.dataset.sort) {

        const key = target.dataset.sort;

        const direction =
          RFQState.sorting.key === key &&
          RFQState.sorting.direction === "desc"
            ? "asc"
            : "desc";

        RFQState.setSorting(key, direction);

        RFQRender.renderIntelligence();
        animateVisuals();

        return;
      }
/* =====================================================
   FILTER QUOTES (ENTERPRISE SAFE)
===================================================== */
if (target.dataset.filter) {

  const filterValue = target.dataset.filter;

  /* Recommended Toggle */
  if (filterValue === "recommended") {

    RFQState.setFilter(
      "recommendedOnly",
      !RFQState.filters.recommendedOnly
    );
  }

  /* Tier Filter (Dynamic Support) */
  else if (filterValue.startsWith("tier:")) {

    const tier = filterValue.split(":")[1]?.toUpperCase();

    RFQState.setFilter(
      "tier",
      RFQState.filters.tier === tier
        ? null
        : tier
    );
  }

  /* Max Price Example (Optional future) */
  else if (filterValue.startsWith("price:")) {

    const max = Number(filterValue.split(":")[1]);

    RFQState.setFilter(
      "maxPrice",
      RFQState.filters.maxPrice === max
        ? null
        : max
    );
  }

  RFQRender.renderIntelligence();
  animateVisuals();

  return;
}
      /* =====================================================
         CLOSE MODAL
      ===================================================== */
      if (target.dataset.close !== undefined) {
        closeModal();
        return;
      }

    };

    document.addEventListener("click", boundHandler);
    isBound = true;
  }
};

/* =========================================================
   VISUAL ENHANCEMENTS
========================================================= */

function animateVisuals() {
  animateScoreBars();
  animateHeatmap();
  initTooltips();
}

function animateScoreBars() {
  const bars = document.querySelectorAll(".score-bar-fill");

  bars.forEach(bar => {
    const width = bar.style.width;
    bar.style.width = "0%";

    requestAnimationFrame(() => {
      bar.style.transition = "width 0.8s ease";
      bar.style.width = width;
    });
  });
}

function animateHeatmap() {
  const cells = document.querySelectorAll(".heat-cell");

  cells.forEach(cell => {

    if (cell.classList.contains("high-risk")) {
      cell.style.background =
        "linear-gradient(135deg,#7f1d1d,#ef4444)";
    }

    if (cell.classList.contains("delay-risk")) {
      cell.style.background =
        "linear-gradient(135deg,#78350f,#f59e0b)";
    }

    cell.style.transition = "background 0.6s ease";
  });
}

function initTooltips() {
  const rings = document.querySelectorAll(".score-ring");

  rings.forEach(r => {
    r.title =
      "AI reliability score based on delivery, dispute ratio, and historical performance.";
  });
}

/* =========================================================
   CLEANUP
========================================================= */

export function cleanupRFQ() {

  if (boundHandler) {
    document.removeEventListener("click", boundHandler);
  }

  closeModal();
  RFQService.cleanup();

  boundHandler = null;
  isBound = false;
}