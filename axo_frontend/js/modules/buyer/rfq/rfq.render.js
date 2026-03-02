/* =========================================================
   AXO NETWORKS — RFQ RENDER (ENTERPRISE HARDENED)
   - RFQ status-aware rendering
   - Award-safe
   - Optimistic-safe
   - No duplicate actions
   - SaaS clean
========================================================= */

import { RFQState } from "./rfq.state.js";
import { RFQListTable } from "./rfq.components/rfq-list.table.js";
import { RFQCreateForm } from "./rfq.components/rfq-create.form.js";
import { RFQCompareModal } from "./rfq.components/rfq-compare.modal.js";
import { RFQTimeline } from "./rfq.components/rfq-timeline.js";
import { refreshLucideIcons } from "../core/buyer-icons.js";

const safe = (v, f = "-") =>
  v === undefined || v === null ? f : v;

function renderOverlay(content, modalClass = "") {
  return `
    <div class="overlay">
      <div class="modal ${modalClass}">
        ${content}
      </div>
    </div>
  `;
}

export const RFQRender = {

  /* =========================================================
     LOADER
  ========================================================= */
  showLoader() {
    const zone = document.getElementById("rfqOverlayZone");
    if (!zone) return;

    zone.innerHTML = `
      <div class="overlay">
        <div class="modal center">
          <div style="height:120px;"></div>
          <p>Loading...</p>
        </div>
      </div>
    `;
  },

  /* =========================================================
     KPI STRIP
  ========================================================= */
  renderKPI() {

    const rfqs = RFQState.rfqs || [];

    const total = rfqs.length;
    const open = rfqs.filter(r => r.status === "open").length;
    const closed = rfqs.filter(r => r.status === "closed").length;
    const awarded = rfqs.filter(r => r.status === "awarded").length;

    const container =
      document.getElementById("rfqKPIContainer");

    if (!container) return;

    container.innerHTML = `
      <div class="kpi-card glass-card">
        <i data-lucide="layers"></i>
        <div><h3>${total}</h3><span>Total RFQs</span></div>
      </div>
      <div class="kpi-card glass-card">
        <i data-lucide="clock"></i>
        <div><h3>${open}</h3><span>Open</span></div>
      </div>
      <div class="kpi-card glass-card">
        <i data-lucide="award"></i>
        <div><h3>${awarded}</h3><span>Awarded</span></div>
      </div>
      <div class="kpi-card glass-card">
        <i data-lucide="check-circle"></i>
        <div><h3>${closed}</h3><span>Closed</span></div>
      </div>
    `;

    refreshLucideIcons();
  },

  /* =========================================================
     RFQ LIST
  ========================================================= */
  renderRFQList() {

    const container =
      document.getElementById("rfqListZone");

    if (!container) return;

    container.innerHTML =
      RFQListTable.render();

    refreshLucideIcons();
  },

  /* =========================================================
     INTELLIGENCE MODAL
  ========================================================= */
/* =========================================================
   INTELLIGENCE MODAL — SAAS PREMIUM VERSION
========================================================= */
renderIntelligence() {

  const zone =
    document.getElementById("rfqOverlayZone");

  if (!zone) return;

const allQuotes = RFQState.quotes;
const quotes = RFQState.getFilteredQuotes();
const matrix = RFQState.getSortedMatrix();

  const selectedRFQ =
    RFQState.rfqs.find(
      r => r.id === RFQState.selectedRFQ
    );

  const rfqStatus = selectedRFQ?.status;

  const content = `
    <div class="modal-header intelligence-header">
      <div class="header-left">
        <h3>
          <i data-lucide="sparkles"></i>
          AI Quote Intelligence
        </h3>
        <span class="rfq-status-badge ${rfqStatus}">
          ${rfqStatus?.toUpperCase()}
        </span>
      </div>

      <div class="header-actions">
        ${
          allQuotes.length > 1
            ? `
              <button class="btn-secondary"
                      data-compare>
                <i data-lucide="bar-chart-3"></i>
                Compare
              </button>
            `
            : ""
        }
        <button class="modal-close"
                data-close>
          ✕
        </button>
      </div>
    </div>

    <div class="modal-body intelligence-body">

      ${RFQTimeline.render({
        status: rfqStatus,
        quotesCount: allQuotes.length,
        hasRanking: matrix.length > 0,
        hasPO: rfqStatus === "awarded",
        hasDispute: false
      })}

      ${
        quotes.length === 0
          ? `
            <div class="empty-state glass-card">
              <i data-lucide="inbox"></i>
              <p>No quotes received yet</p>
            </div>
          `
          : `
            <div class="intelligence-grid">

              ${quotes.map(q => {

                const isAccepted =
                  q.status === "accepted";

                const canAccept =
                  rfqStatus === "open" &&
                  !isAccepted;

                return `
                  <div class="intelligence-card
                       ${q.is_recommended ? "recommended" : ""}
                       ${isAccepted ? "accepted" : ""}">

                    <div class="card-header">

                      <div class="supplier-block">
                        <h4>${q.supplier?.name || "Supplier"}</h4>
                        <span class="tier-badge ${q.reliability_tier}">
                          ${q.reliability_tier}
                        </span>
                      </div>

                      <div class="score-pill">
                        ${q.reliability_score}
                        <span>Score</span>
                      </div>

                    </div>

                    <div class="divider"></div>

                    <div class="card-metrics">

                      <div class="metric">
                        <label>Price</label>
                        <strong>₹${Number(q.price).toLocaleString()}</strong>
                      </div>

                      <div class="metric">
                        <label>Timeline</label>
                        <strong>${q.timeline_days} days</strong>
                      </div>

                      <div class="metric">
                        <label>Confidence</label>
                        <strong>${q.confidence_index}%</strong>
                      </div>

                      <div class="metric">
                        <label>Value Index</label>
                        <strong>${q.value_index}</strong>
                      </div>

                    </div>

                    ${
                      q.is_recommended
                        ? `
                          <div class="recommend-box">
                            <i data-lucide="sparkles"></i>
                            ${q.recommendation_reason}
                          </div>
                        `
                        : ""
                    }

                    <div class="card-actions">
                      ${
                        canAccept
                          ? `
                            <button class="btn-primary"
                                    data-accept="${q.id}">
                              Accept Supplier
                            </button>
                          `
                          : `
                            <span class="status-indicator">
                              ${
                                isAccepted
                                  ? "Accepted"
                                  : rfqStatus === "awarded"
                                    ? "Awarded"
                                    : "Closed"
                              }
                            </span>
                          `
                      }
                    </div>

                  </div>
                `;
              }).join("")}

            </div>
          `
      }

    </div>
  `;

  zone.innerHTML =
    renderOverlay(content, "rfq-intelligence-modal");

  refreshLucideIcons();
},

  /* =========================================================
     CREATE MODAL
  ========================================================= */
  openCreateModal() {

    const zone =
      document.getElementById("rfqOverlayZone");

    if (!zone) return;

    zone.innerHTML =
      renderOverlay(
        RFQCreateForm.render(),
        "rfq-create-modal"
      );

    RFQCreateForm.bindFilePreview();

    refreshLucideIcons();
  },

  /* =========================================================
     COMPARE MODAL
  ========================================================= */
  openCompareModal() {

    const zone =
      document.getElementById("rfqOverlayZone");

    if (!zone) return;

    const content =
      RFQCompareModal.render(
        RFQState.getFilteredQuotes()
      );

    zone.innerHTML =
      renderOverlay(content, "rfq-compare-modal");

    refreshLucideIcons();
  },

  /* =========================================================
     PO CONFIRMATION
  ========================================================= */
  renderPOConfirmation(po) {

    const zone =
      document.getElementById("rfqOverlayZone");

    if (!zone) return;

    const content = `
      <div class="center">
        <i data-lucide="badge-check"
           style="color:#16a34a;font-size:42px;"></i>
        <h3>PO Created</h3>
        <p>PO Number: ${safe(po?.po_number)}</p>
      </div>
    `;

    zone.innerHTML =
      renderOverlay(content);

    refreshLucideIcons();
  }

};