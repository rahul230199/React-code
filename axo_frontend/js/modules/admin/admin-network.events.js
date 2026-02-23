/* =========================================================
   AXO NETWORKS — ADMIN NETWORK EVENTS (ENTERPRISE STABLE)
   ES Module Version
========================================================= */

import { AdminState as State } from "./admin.state.js";
import { AdminAPI as API } from "./admin.api.js";
import { AdminNetworkRender as Render } from "./admin-network.render.js";
import { AdminEvents } from "./admin.events.js";
import { Toast } from "../../core/toast.js";

/* =========================================================
   LOCAL LOADER HELPERS
========================================================= */

function showLoader() {
  const loader = document.getElementById("globalLoader");
  if (loader) loader.style.display = "flex";
}

function hideLoader() {
  const loader = document.getElementById("globalLoader");
  if (loader) loader.style.display = "none";
}

let isBound = false;

export const AdminNetworkEvents = {

  /* =====================================================
     INIT NETWORK EVENTS (SAFE BIND ONCE)
  ===================================================== */
  bindNetworkEvents() {

    if (isBound) return;
    isBound = true;

    document.addEventListener("click", async (e) => {

      const viewBtn = e.target.closest(".view-btn");
      if (viewBtn) {
        this.handleView(viewBtn);
        return;
      }

      const approveBtn = e.target.closest(".approve-btn");
      if (approveBtn) {
        await this.handleApproveClick(approveBtn);
        return;
      }

      const rejectBtn = e.target.closest(".reject-btn");
      if (rejectBtn) {
        await this.handleRejectClick(rejectBtn);
        return;
      }

    });

    document.getElementById("modalCloseBtn")
      ?.addEventListener("click", () => this.closeModal());

    document.getElementById("viewModal")
      ?.addEventListener("click", (e) => {
        if (e.target.id === "viewModal") {
          this.closeModal();
        }
      });
  },

  /* =====================================================
     VIEW HANDLER
  ===================================================== */
  handleView(btn) {

    const id = Number(btn.dataset.id);
    const requests = State.getRequests?.() || [];

    const item = requests.find(r => r.id === id);
    if (!item) return;

    State.setCurrentViewingItem?.(item);
    Render.renderRequestDetailsModal(item);
  },

  /* =====================================================
     APPROVE CLICK
  ===================================================== */
  async handleApproveClick(btn) {

    if (btn.disabled) return;

    const id = Number(btn.dataset.id);

    const comment = await this.showCommentModal("Approve");
    if (!comment) return;

    await this.processAction({
      id,
      comment,
      btn,
      apiCall: API.approveNetworkRequest,
      successMsg: "Request approved successfully"
    });
  },

  /* =====================================================
     REJECT CLICK
  ===================================================== */
  async handleRejectClick(btn) {

    if (btn.disabled) return;

    const id = Number(btn.dataset.id);

    const comment = await this.showCommentModal("Reject");
    if (!comment) return;

    await this.processAction({
      id,
      comment,
      btn,
      apiCall: API.rejectNetworkRequest,
      successMsg: "Request rejected successfully"
    });
  },

  /* =====================================================
     PROCESS APPROVE / REJECT
  ===================================================== */
  async processAction({ id, comment, btn, apiCall, successMsg }) {

    try {

      btn.disabled = true;
      showLoader();

      const result = await apiCall(id, comment);
      if (!result?.success) {
        throw new Error(result?.message);
      }

      Toast.success(successMsg);

      await this.refreshCurrentPage();

    } catch (err) {

      console.error("Network action error:", err);
      Toast.error("Operation failed");

    } finally {

      btn.disabled = false;
      hideLoader();

    }
  },

  /* =====================================================
     REFRESH CURRENT VIEW
  ===================================================== */
  async refreshCurrentPage() {

    this.closeModal();

    if (AdminEvents?.loadRequests) {
      await AdminEvents.loadRequests();
    }
  },

  /* =====================================================
     COMMENT MODAL
  ===================================================== */
  showCommentModal(action) {

    return new Promise((resolve) => {

      const modal      = document.getElementById("commentModal");
      const title      = document.getElementById("commentModalTitle");
      const input      = document.getElementById("commentInput");
      const confirmBtn = document.getElementById("confirmCommentBtn");
      const cancelBtn  = document.getElementById("cancelCommentBtn");

      if (!modal) return resolve(null);

      title.textContent = `${action} Request`;
      input.value = "";
      modal.style.display = "flex";

      const handleConfirm = () => {

        const value = input.value.trim();

        if (!value) {
          Toast.error("Comment is required");
          return;
        }

        cleanup();
        resolve(value);
      };

      const handleCancel = () => {
        cleanup();
        resolve(null);
      };

      const cleanup = () => {
        modal.style.display = "none";
        confirmBtn.removeEventListener("click", handleConfirm);
        cancelBtn.removeEventListener("click", handleCancel);
      };

      confirmBtn.addEventListener("click", handleConfirm);
      cancelBtn.addEventListener("click", handleCancel);

    });
  },

  /* =====================================================
     CLOSE VIEW MODAL
  ===================================================== */
  closeModal() {

    const modal = document.getElementById("viewModal");
    if (modal) modal.style.display = "none";
  }

};

export default AdminNetworkEvents;