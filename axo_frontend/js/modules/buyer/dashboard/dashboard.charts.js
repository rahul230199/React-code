/* =========================================================
   AXO NETWORKS — BUYER DASHBOARD CHARTS
   Production Safe
   - Memory safe
   - Instance controlled
   - No static data
========================================================= */

let spendChartInstance = null;
let supplierChartInstance = null;

/* =========================================================
   COLOR SYSTEM (SaaS Palette)
========================================================= */

const colors = {
  primary: "#4F46E5",
  success: "#10B981",
  danger: "#EF4444",
  neutral: "#64748B",
  background: "rgba(79,70,229,0.08)"
};

/* =========================================================
   DESTROY SAFE
========================================================= */

function destroyIfExists(instance) {
  if (instance && typeof instance.destroy === "function") {
    instance.destroy();
  }
}

/* =========================================================
   SPEND TREND CHART
========================================================= */

function renderSpendTrend(spendTrend) {

  const canvas = document.getElementById("spendTrendChart");
  if (!canvas) return;

  destroyIfExists(spendChartInstance);

  if (!spendTrend || !Array.isArray(spendTrend.committed)) {
    console.warn("Invalid spendTrend format:", spendTrend);
    return;
  }

  const committed = spendTrend.committed || [];
  const actual = spendTrend.actual || [];

  const labels = committed.map(item =>
    new Date(item.month).toLocaleDateString("en-IN", {
      month: "short",
      year: "2-digit"
    })
  );

  const committedValues = committed.map(i => i.committed_spend || 0);

  const actualValues = actual.map(i => i.actual_spend || 0);

  spendChartInstance = new window.Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Committed",
          data: committedValues,
          borderColor: colors.primary,
          backgroundColor: colors.background,
          tension: 0.4,
          fill: true,
          pointRadius: 3
        },
        {
          label: "Actual",
          data: actualValues,
          borderColor: colors.success,
          backgroundColor: "rgba(16,185,129,0.08)",
          tension: 0.4,
          fill: true,
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

/* =========================================================
   SUPPLIER BREAKDOWN CHART
========================================================= */

function renderSupplierBreakdown(data) {
if (!Array.isArray(data)) return;
  const canvas = document.getElementById("supplierChart");
  if (!canvas || !data) return;

  destroyIfExists(supplierChartInstance);

  const labels = data.map(i => i.name);
  const values = data.map(i => i.total_value);

  supplierChartInstance = new window.Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Total Value",
          data: values,
          backgroundColor: colors.primary,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

/* =========================================================
   INITIALIZE CHARTS
========================================================= */

export function initializeCharts(data) {

  if (!data) return;

 renderSpendTrend({
  committed: data.spendTrend || [],
  actual: data.paymentTrend || []
});
  renderSupplierBreakdown(data.supplierBreakdown);
}