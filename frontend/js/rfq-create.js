const API_BASE = "http://localhost:3000/api";

/* =====================
   HELPERS
===================== */
function getToken() {
  return localStorage.getItem("token");
}

function getUser() {
  return JSON.parse(localStorage.getItem("user"));
}

/* =====================
   AUTH CHECK
===================== */
(function checkAuth() {
  if (!getToken() || !getUser()) {
    window.location.href = "login.html";
  }
})();

/* =====================
   FORM SUBMIT
===================== */
document.getElementById("rfqForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const user = getUser();

  const payload = {
    buyer_id: user.id,
    part_name: document.getElementById("part_name").value.trim(),
    part_id: document.getElementById("part_id").value.trim(),
    total_quantity: Number(document.getElementById("total_quantity").value),
    batch_quantity: Number(document.getElementById("batch_quantity").value),
    target_price: document.getElementById("target_price").value
      ? Number(document.getElementById("target_price").value)
      : null,
    delivery_timeline: document.getElementById("delivery_timeline").value.trim(),
    material_specification: document.getElementById("material_specification").value.trim(),
    ppap_level: document.getElementById("ppap_level").value
  };

  try {
    const res = await fetch(`${API_BASE}/rfqs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + getToken()
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.message || "Failed to create RFQ");
    }

    alert("RFQ created successfully");
    window.location.href = "buyer-dashboard.html";

  } catch (err) {
    console.error("Create RFQ error:", err);
    alert(err.message);
  }
});
