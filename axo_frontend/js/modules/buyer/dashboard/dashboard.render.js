/* =========================================================
   AXO NETWORKS — BUYER DASHBOARD RENDER (FULLY FIXED)
   Production Safe
   Schema Aligned
========================================================= */

/* =========================================================
   FORMAT HELPERS
========================================================= */

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat("en-IN").format(value || 0);
};

/* =========================================================
   SAFE NESTED VALUE GETTER
========================================================= */

function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

/* =========================================================
   ANIMATE NUMBER
========================================================= */

function animateNumber(element, target, formatter = (v) => v) {

  const duration = 600;
  const startTime = performance.now();

  function update(currentTime) {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const value = Math.floor(progress * target);

    element.textContent = formatter(value);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = formatter(target);
    }
  }

  requestAnimationFrame(update);
}

/* =========================================================
   APPLY RISK BADGE STYLE
========================================================= */

function applyRiskBadge(level = "NORMAL") {

  const badge = document.getElementById("riskBadge");
  const text = document.getElementById("riskLevelText");

  if (!badge || !text) return;

  badge.classList.remove(
    "risk-normal",
    "risk-elevated",
    "risk-high",
    "risk-critical"
  );

  const classMap = {
    NORMAL: "risk-normal",
    ELEVATED: "risk-elevated",
    HIGH: "risk-high",
    CRITICAL: "risk-critical"
  };

  badge.classList.add(classMap[level] || "risk-normal");
  text.textContent = level;
}

/* =========================================================
   MAIN RENDER FUNCTION
========================================================= */

export function renderDashboard(data) {

  if (!data) return;

  /* -----------------------------------------
     Inject Data Into Fields
  ----------------------------------------- */

  document.querySelectorAll("[data-field]").forEach((el) => {

    const fieldPath = el.dataset.field;
    const value = getNestedValue(data, fieldPath);

    if (value === undefined || value === null) {
      el.textContent = "-";
      return;
    }

    /* Financial Fields */
    if (fieldPath.startsWith("financial.")) {
      animateNumber(el, value, formatCurrency);
      return;
    }

    /* Risk Score */
    if (fieldPath.includes("risk_score")) {
      animateNumber(el, value, formatNumber);
      return;
    }

    /* Risk Metrics (raw counts from backend) */
    if (fieldPath.includes("system_health.metrics")) {
      el.textContent = formatNumber(value);
      return;
    }

    /* Default Number */
    if (typeof value === "number") {
      animateNumber(el, value, formatNumber);
      return;
    }

    el.textContent = value;
  });

  /* -----------------------------------------
     Risk Badge Styling
  ----------------------------------------- */

  applyRiskBadge(data.system_health?.risk_level);
}