/* =========================================================
   AXO NETWORKS — NETWORK PAGE (PRODUCTION FINAL)
   Lifecycle Safe • Modal Safe • Memory Safe • Clean
========================================================= */

import { NetworkState } from "./network.state.js";
import { NetworkRender } from "./network.render.js";
import { NetworkEvents } from "./network.events.js";

export const NetworkPage = (() => {

  let _container = null;
  let _mounted = false;

  let _activeModal = null;
  let _lastFocusedElement = null;
  let _isClosing = false;

  const ANIMATION_DURATION = 200;

  /* ====================================================== */
  /* INIT */
  /* ====================================================== */

  async function init(container) {

    if (!container) return;

    destroy();

    _container = container;
    _mounted = true;

    NetworkState.reset();

    _container.innerHTML = NetworkRender.layout();

    NetworkEvents.bind(_container, {
      onRender: handleEvent
    });

    await NetworkEvents.load();
  }

  /* ====================================================== */
  /* EVENT BRIDGE */
  /* ====================================================== */

  function handleEvent(event) {

    if (!_mounted) return;

    if (!event || event.type === "update") {
      render();
      return;
    }

    if (event.type === "view") {
      openModal(event.id);
      return;
    }
  }

  /* ====================================================== */
  /* RENDER */
  /* ====================================================== */

  function render() {

    if (!_mounted || !_container) return;

    NetworkRender.renderAll(_container, {
      requests: NetworkState.getRequests(),
      loading: NetworkState.isLoading(),
      pagination: NetworkState.getPagination(),
      error: null
    });
  }

  /* ====================================================== */
  /* MODAL OPEN */
  /* ====================================================== */

  function openModal(id) {

    const requests = NetworkState.getRequests();
    const item = requests.find(r => String(r.id) === String(id));
    if (!item) return;

    closeModal(true);

    _lastFocusedElement = document.activeElement;

    NetworkRender.renderModal(item);

    _activeModal =
      document.querySelector(".network-modal-overlay");

    if (!_activeModal) return;

    attachModalEvents();
    trapFocus();
    animateIn();
  }

  /* ====================================================== */
  /* MODAL CLOSE */
  /* ====================================================== */

  function closeModal(force = false) {

    if (!_activeModal || _isClosing) return;

    if (force) {
      removeModalEvents();
      _activeModal.remove();
      _activeModal = null;
      restoreFocus();
      return;
    }

    _isClosing = true;

    const modal =
      _activeModal.querySelector(".network-modal");

    if (!modal) {
      finalizeClose();
      return;
    }

    modal.classList.add("network-modal-exit-active");

    setTimeout(finalizeClose, ANIMATION_DURATION);
  }

  function finalizeClose() {

    removeModalEvents();

    if (_activeModal) {
      _activeModal.remove();
    }

    _activeModal = null;
    _isClosing = false;

    restoreFocus();
  }

  function restoreFocus() {
    if (_lastFocusedElement?.focus) {
      _lastFocusedElement.focus();
    }
  }

  /* ====================================================== */
  /* MODAL EVENTS */
  /* ====================================================== */

  function attachModalEvents() {

    if (!_activeModal) return;

    _activeModal.addEventListener("click", handleOverlayClick);
    document.addEventListener("keydown", handleKeyDown);
  }

  function removeModalEvents() {

    document.removeEventListener("keydown", handleKeyDown);

    if (_activeModal) {
      _activeModal.removeEventListener("click", handleOverlayClick);
    }
  }

  function handleOverlayClick(e) {

    if (
      e.target.classList.contains("network-modal-overlay") ||
      e.target.dataset.close === "true"
    ) {
      closeModal();
    }
  }

  function handleKeyDown(e) {

    if (!_activeModal) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeModal();
      return;
    }

    if (e.key === "Tab") {
      maintainFocus(e);
    }
  }

  /* ====================================================== */
  /* FOCUS TRAP */
  /* ====================================================== */

  function trapFocus() {

    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }

  function maintainFocus(event) {

    const focusable = getFocusableElements();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  function getFocusableElements() {

    if (!_activeModal) return [];

    return Array.from(
      _activeModal.querySelectorAll(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      )
    ).filter(el => !el.hasAttribute("disabled"));
  }

  /* ====================================================== */
  /* MODAL ANIMATION */
  /* ====================================================== */

  function animateIn() {

    const modal =
      _activeModal?.querySelector(".network-modal");

    if (!modal) return;

    requestAnimationFrame(() => {
      modal.classList.add("network-modal-enter-active");
    });
  }

  /* ====================================================== */
  /* DESTROY */
  /* ====================================================== */

  function destroy() {

    if (!_mounted) return;

    NetworkEvents.unbind();
    closeModal(true);
    NetworkState.reset();

    _mounted = false;
    _container = null;
  }

  return {
    init,
    destroy
  };

})();

export default NetworkPage;