/* =========================================================
   AUTH HELPERS
========================================================= */
function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

function getToken() {
  return localStorage.getItem("token");
}

/* =========================================================
   AUTH GUARD
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const user = getUser();
  const token = getToken();

  if (!user || !token || user.role !== "BUYER") {
    window.location.href = "/login";
    return;
  }

  document
    .getElementById("rfqForm")
    .addEventListener("submit", submitRFQ);

  document
    .getElementById("saveDraftBtn")
    .addEventListener("click", saveDraft);
});

/* =========================================================
   PAYLOAD BUILDER
========================================================= */
function buildRFQPayload(status) {
  return {
    part_name: value("partName"),
    part_id: value("partId"),
    total_quantity: Number(value("totalQuantity")),
    batch_quantity: Number(value("batchQuantity")) || null,
    target_price: Number(value("targetPrice")) || null,
    delivery_timeline: value("deliveryTimeline"),
    material_specification: value("materialSpec") || null,
    ppap_level: value("ppapLevel") || null,
    status,
    files: document.getElementById("rfqFiles").files
  };
}

const value = id =>
  document.getElementById(id)?.value.trim();

/* =========================================================
   VALIDATION
========================================================= */
function validateRFQ(p) {
  if (!p.part_name) return "Part name is required";
  if (!p.part_id) return "Part ID is required";
  if (!p.total_quantity || p.total_quantity <= 0)
    return "Total quantity must be greater than 0";
  if (!p.delivery_timeline)
    return "Delivery timeline is required";
  return null;
}

/* =========================================================
   ACTIONS
========================================================= */
async function saveDraft() {
  clearMessage();

  const payload = buildRFQPayload("draft");

  // Drafts can be partial
  payload.delivery_timeline =
    payload.delivery_timeline || "TBD";

  await sendRFQ(payload);
}

async function submitRFQ(e) {
  e.preventDefault();
  clearMessage();

  const payload = buildRFQPayload("active");
  const error = validateRFQ(payload);

  if (error) {
    showMessage(error, "error");
    return;
  }

  await sendRFQ(payload);
}

/* =========================================================
   API CALL
========================================================= */
async function sendRFQ(payload) {
  try {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      if (key === "files") {
        [...value].forEach(file =>
          formData.append("files", file)
        );
      } else {
        formData.append(key, value);
      }
    });

    const res = await fetch("/api/rfqs", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`
      },
      body: formData
    });

    const result = await res.json();

    if (!result.success) {
      throw new Error(result.message || "Request failed");
    }

    showMessage(
      payload.status === "draft"
        ? "Draft saved successfully"
        : "RFQ submitted successfully",
      "success"
    );

    redirectDashboard();

  } catch (err) {
    console.error(err);
    showMessage(
      err.message || "Failed to submit RFQ",
      "error"
    );
  }
}

/* =========================================================
   UI HELPERS
========================================================= */
function redirectDashboard() {
  setTimeout(() => {
    window.location.href = "/buyer-dashboard";
  }, 800);
}

function showMessage(text, type = "error") {
  const box = document.getElementById("statusMessage");
  if (!box) return;

  box.textContent = text;
  box.className = `status-message ${type}`;
  box.style.display = "block";

  setTimeout(() => {
    box.style.display = "none";
  }, 4000);
}

function clearMessage() {
  const box = document.getElementById("statusMessage");
  if (box) box.style.display = "none";
}
