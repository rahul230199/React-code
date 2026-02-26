/* =========================================================
   AXO NETWORKS — USERS EVENTS
   ENTERPRISE • RACE SAFE • DETERMINISTIC • SPA SAFE
========================================================= */

import { UsersAPI } from "./users.api.js";
import { UsersState } from "./users.state.js";
import { UsersRender } from "./users.render.js";
import Toast from "../../../core/toast.js";

export const UsersEvents = {

  container: null,
  debounceTimer: null,
  isBound: false,

  /* =====================================================
     BIND
  ===================================================== */
  bind(container) {

    if (!container || this.isBound) return;

    this.container = container;
    this.isBound = true;

    this._handleClick = this.handleClick.bind(this);
    this._handleInput = this.handleInput.bind(this);

    container.addEventListener("click", this._handleClick);
    container.addEventListener("input", this._handleInput);
  },

  /* =====================================================
     INPUT (SEARCH)
  ===================================================== */
  handleInput(e) {
    if (e.target.dataset.action === "search") {
      this.handleSearch(e.target.value);
    }
  },

  /* =====================================================
     CLICK HANDLER
  ===================================================== */
  async handleClick(e) {

    const target = e.target.closest("[data-action]");
    if (!target) return;

    const action = target.dataset.action;
    const id = target.dataset.id || target.closest("[data-id]")?.dataset.id;

    /* ================= FILTER CHIPS ================= */

    if (action === "role-filter" || action === "status-filter") {

      const value = target.dataset.value;

      if (action === "role-filter") {
        UsersState.setFilters({ roleFilter: value });
      }

      if (action === "status-filter") {
        UsersState.setFilters({ statusFilter: value });
      }

      UsersState.set({ page: 1 });
      await this.reload();
      return;
    }

    /* ================= SWITCH ================= */

    switch (action) {

      case "view":
        await this.handleView(id);
        break;

      case "edit":
        await this.handleEdit(id);
        break;

      case "toggle-status":
        await this.handleToggle(id, target.dataset.status);
        break;

      case "delete":
        await this.handleDelete(id);
        break;

      case "reset":
        UsersState.openModal("reset", { id });
        this.render();
        break;

      case "confirm-reset":
        await this.handleConfirmReset();
        break;

      case "page":
        UsersState.set({ page: Number(target.dataset.page) });
        await this.reload();
        break;

      case "close-modal":
        UsersState.closeModal();
        this.render();
        break;

        case "save-edit":
  await this.handleSaveRole();
  break;

  case "copy-password":
  await this.handleCopyPassword();
  break;
    }
  },


  async handleCopyPassword() {

  const password = UsersState.get().temporaryPassword;
  if (!password) return;

  await navigator.clipboard.writeText(password);
  Toast.success("Password copied to clipboard");
},

  async handleSaveRole() {

  const modal = this.container.querySelector(".modal-card");
  if (!modal) return;

  const select = modal.querySelector("[data-field='role']");
  const newRole = select?.value;

  const userId = UsersState.get().selectedUser?.id;
  if (!userId || !newRole) return;

  const response = await UsersAPI.updateRole(userId, newRole);

  if (!response?.success) {
    Toast.error(response?.error || "Update failed");
    return;
  }

  Toast.success("Role updated");
  UsersState.closeModal();
  await this.reload();
},
  /* =====================================================
     SEARCH (DEBOUNCED)
  ===================================================== */
  handleSearch(value) {

    clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout(() => {
      UsersState.setFilters({ search: value });
      UsersState.set({ page: 1 });
      this.reload();
    }, 400);
  },

  /* =====================================================
     RELOAD
  ===================================================== */
  async reload() {

    UsersState.setLoading(true);
    this.render();

    try {

      const state = UsersState.get();

      const response = await UsersAPI.getUsers({
        page: state.page,
        limit: state.limit,
        search: state.search,
        role: state.roleFilter,
        status: state.statusFilter
      });

      if (!response?.success) {
        throw new Error(response?.error || "Load failed");
      }

      UsersState.setUsers(response.data.users);
      UsersState.setPagination({
        page: response.data.current_page,
        totalRecords: response.data.total_records,
        totalPages: response.data.total_pages
      });

    } catch (err) {
      Toast.error(err.message || "Failed to load users");
    } finally {
      UsersState.setLoading(false);
      this.render();
    }
  },

  /* =====================================================
     VIEW
  ===================================================== */
  async handleView(id) {

    const response = await UsersAPI.getUserById(id);

    if (!response?.success) {
      Toast.error(response?.error || "Failed to load user");
      return;
    }

    UsersState.openModal("view", response.data);
    this.render();
  },

  /* =====================================================
     EDIT
  ===================================================== */
  async handleEdit(id) {

    const response = await UsersAPI.getUserById(id);

    if (!response?.success) {
      Toast.error(response?.error || "Failed to load user");
      return;
    }

    UsersState.openModal("edit", response.data);
    this.render();
  },

  /* =====================================================
     TOGGLE STATUS
  ===================================================== */
  async handleToggle(id, currentStatus) {

    const newStatus =
      currentStatus === "active" ? "inactive" : "active";

    const response = await UsersAPI.updateStatus(id, newStatus);

    if (!response?.success) {
      Toast.error(response?.error || "Status update failed");
      return;
    }

    Toast.success("User status updated");
    await this.reload();
  },

  /* =====================================================
     DELETE
  ===================================================== */
  async handleDelete(id) {

    if (!confirm("Are you sure you want to delete this user?")) return;

    const response = await UsersAPI.deleteUser(id);

    if (!response?.success) {
      Toast.error(response?.error || "Delete failed");
      return;
    }

    Toast.success("User deleted");
    await this.reload();
  },

  /* =====================================================
     RESET PASSWORD
  ===================================================== */
async handleConfirmReset() {

  const id = UsersState.get().selectedUser?.id;
  if (!id) return;

  const response = await UsersAPI.resetPassword(id);

  if (!response?.success) {
    Toast.error(response?.error || "Reset failed");
    return;
  }

  // ✅ THIS IS THE CORRECT PATH (confirmed by your console)
  const tempPassword = response?.data?.temporary_password;

  if (!tempPassword) {
    console.log("FULL RESPONSE:", response);
    Toast.error("Temporary password not returned");
    return;
  }

  UsersState.setTemporaryPassword(tempPassword);
  this.render();
},

  /* =====================================================
     RENDER
  ===================================================== */
  render() {
    if (!this.container) return;
    UsersRender.render(this.container, UsersState.get());
  },

  /* =====================================================
     DESTROY
  ===================================================== */
  destroy() {

    clearTimeout(this.debounceTimer);

    if (this.container && this.isBound) {
      this.container.removeEventListener("click", this._handleClick);
      this.container.removeEventListener("input", this._handleInput);
    }

    this.container = null;
    this.isBound = false;
  }

};

export default UsersEvents;