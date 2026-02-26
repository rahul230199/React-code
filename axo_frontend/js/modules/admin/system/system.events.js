/* =========================================================
   AXO NETWORKS — SYSTEM EVENTS (PREMIUM UPGRADE)
   Animated | Sparkline | Health Ring | Race Safe
========================================================= */

import { SystemAPI } from "./system.api.js";
import { SystemState } from "./system.state.js";
import { SystemRender } from "./system.render.js";
import Toast from "../../../core/toast.js";

export const SystemEvents = {

  container: null,
  intervalId: null,
  chartInstance: null,
  sparklineInstances: [],
  isBound: false,
  isLoading: false,
  requestToken: 0,

  /* ------------------------------------------------------ */
  bind(container) {

    if (!container || this.isBound) return;

    this.container = container;
    this.isBound = true;

    this._handleClick = this.handleClick.bind(this);
    this._handleChange = this.handleChange.bind(this);

    container.addEventListener("click", this._handleClick);
    container.addEventListener("change", this._handleChange);
  },

  /* ------------------------------------------------------ */
  handleClick(e) {

    const action = e.target.closest("[data-action]")?.dataset.action;
    if (!action) return;

    if (action === "refresh") {
      this.load();
    }
  },

  handleChange(e) {

    if (e.target.dataset.action === "toggle-auto") {
      this.toggleAutoRefresh(e.target.checked);
    }
  },

  /* ------------------------------------------------------ */
  async load() {

    const currentToken = ++this.requestToken;

    if (this.isLoading) return;
    this.isLoading = true;

    try {

      SystemState.setLoading(true);
      SystemState.setError(null);
      this.render();

      const res = await SystemAPI.getSystemHealth();

      if (currentToken !== this.requestToken) return;

      if (!res?.success) {
        throw new Error(res?.error || "Invalid response");
      }

      SystemState.setMetrics(res.data);

    } catch (error) {

      if (currentToken !== this.requestToken) return;

      const message = error?.message || "Load failed";
      SystemState.setError(message);
      Toast.error(message);

    } finally {

      if (currentToken !== this.requestToken) return;

      SystemState.setLoading(false);
      this.render();

      if (!SystemState.get().error) {
        this.renderChart();
        this.animateCounters();
        this.renderSparklines();
      }

      this.isLoading = false;
    }
  },

  /* ------------------------------------------------------ */
  animateCounters() {

    const counters = this.container.querySelectorAll(".counter");

    counters.forEach(counter => {

      const target = Number(counter.dataset.value || 0);
      const duration = 800;
      const start = 0;
      const startTime = performance.now();

      const animate = (currentTime) => {

        const progress = Math.min((currentTime - startTime) / duration, 1);
        const value = Math.floor(progress * (target - start) + start);

        counter.textContent = value.toLocaleString("en-IN");

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    });
  },

  /* ------------------------------------------------------ */
  renderSparklines() {

    if (!window.Chart) return;

    this.sparklineInstances.forEach(c => c.destroy());
    this.sparklineInstances = [];

    const sparkContainers = this.container.querySelectorAll(".sparkline canvas");

    sparkContainers.forEach(canvas => {

      const data = Array.from({ length: 12 }, () =>
        Math.floor(Math.random() * 100) + 10
      );

      const chart = new window.Chart(canvas, {
        type: "line",
        data: {
          labels: data.map((_, i) => i),
          datasets: [{
            data,
            borderColor: "#2563eb",
            borderWidth: 2,
            tension: 0.4,
            fill: false,
            pointRadius: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { display: false },
            y: { display: false }
          }
        }
      });

      this.sparklineInstances.push(chart);
    });
  },

  /* ------------------------------------------------------ */
  renderChart() {

    if (!this.container) return;

    const canvas = this.container.querySelector("#systemRevenueChart");
    if (!canvas) return;

    const state = SystemState.get();
    if (!state.metrics) return;

    if (!window.Chart) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    const revenue = Number(state.metrics.revenue_last_30_days || 0);

    this.chartInstance = new window.Chart(canvas, {
      type: "bar",
      data: {
        labels: ["Revenue (30 Days)"],
        datasets: [{
          data: [revenue],
          backgroundColor: "#1e3a8a",
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  },

  /* ------------------------------------------------------ */
  toggleAutoRefresh(enabled) {

    SystemState.set({ autoRefreshEnabled: Boolean(enabled) });

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (enabled) {
      this.intervalId = setInterval(
        () => this.load(),
        SystemState.get().refreshIntervalMs
      );
    }

    this.render();
  },

  /* ------------------------------------------------------ */
  render() {
    if (!this.container) return;
    SystemRender.render(this.container, SystemState.get());
  },

  /* ------------------------------------------------------ */
  destroy() {

    if (this.intervalId) clearInterval(this.intervalId);

    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    this.sparklineInstances.forEach(c => c.destroy());
    this.sparklineInstances = [];

    if (this.container && this.isBound) {
      this.container.removeEventListener("click", this._handleClick);
      this.container.removeEventListener("change", this._handleChange);
    }

    this.isBound = false;
    this.isLoading = false;
    this.requestToken++;
  }

};

export default SystemEvents;