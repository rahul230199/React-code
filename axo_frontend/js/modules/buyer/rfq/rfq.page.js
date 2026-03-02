/* =========================================================
   AXO NETWORKS — RFQ PAGE (ENTERPRISE FIXED)
   - Global overlay system
   - Route-safe mount
   - Proper cleanup
   - Modal alignment fixed
========================================================= */

import { RFQService } from "./rfq.service.js";
import { RFQEvents, cleanupRFQ } from "./rfq.events.js";
import { RFQRender } from "./rfq.render.js";
import { setPageTitle } from "../core/buyer-topbar.js";
import { initializeLucide } from "../core/buyer-icons.js";

let isMounted = false;

/* =========================================================
   ENSURE GLOBAL OVERLAY EXISTS
========================================================= */

function ensureGlobalOverlay() {

  let overlay = document.getElementById("rfqOverlayZone");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "rfqOverlayZone";
    document.body.appendChild(overlay);
  }

}

/* =========================================================
   LOAD PAGE
========================================================= */

export async function loadRFQPage() {

  const container =
    document.getElementById("pageContainer");

  if (!container) return;

  /* ---------------------------------------------------------
     CLEAN PREVIOUS INSTANCE (Route Switch Safe)
  --------------------------------------------------------- */
  if (isMounted) {
    cleanupRFQ();
    RFQService.cleanup();
    container.innerHTML = "";
  }

  /* ---------------------------------------------------------
     ENSURE GLOBAL OVERLAY
  --------------------------------------------------------- */
  ensureGlobalOverlay();

  setPageTitle("RFQ Intelligence");

  /* ---------------------------------------------------------
     LAYOUT INJECTION (NO OVERLAY HERE)
  --------------------------------------------------------- */
container.innerHTML = `
  <div class="rfq-root glass-layer">

    <div class="rfq-toolbar">

      <div class="rfq-title">
        <i data-lucide="file-text"></i>
        <h2 class="page-title">RFQ Commerce Engine</h2>
      </div>

      <div class="rfq-toolbar-row">

        <div class="rfq-filters">
          <input 
            type="text" 
            id="rfqSearchInput"
            placeholder="Search RFQs..." 
          />

          <select id="rfqStatusFilter">
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="awarded">Awarded</option>
          </select>
        </div>

        <div class="rfq-actions">
          <button id="rfqNewBtn" class="btn-primary">
            <i data-lucide="plus"></i> New RFQ
          </button>
        </div>

      </div>

    </div>

    <div id="rfqKPIContainer"
         class="rfq-kpi-strip"></div>

    <div class="rfq-body">
      <div id="rfqListZone"
           class="rfq-list-zone"></div>

      <div id="rfqIntelligenceZone"
           class="rfq-intelligence-zone"></div>
    </div>

  </div>
`;

  /* ---------------------------------------------------------
     ICON INITIALIZATION
  --------------------------------------------------------- */
  initializeLucide();

  /* ---------------------------------------------------------
     BOOTSTRAP DATA
  --------------------------------------------------------- */
  await RFQService.bootstrapDashboard();

  /* ---------------------------------------------------------
     INITIAL RENDER
  --------------------------------------------------------- */
  RFQRender.renderKPI();
  RFQRender.renderRFQList();

  /* ---------------------------------------------------------
     BIND EVENTS
  --------------------------------------------------------- */
  RFQEvents.init();

  isMounted = true;
}