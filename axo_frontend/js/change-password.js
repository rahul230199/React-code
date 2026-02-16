/* =========================================================
   AXO NETWORKS — FORCE CHANGE PASSWORD (ENTERPRISE SAFE)
========================================================= */

const API_BASE_URL = "/api";

document.addEventListener("DOMContentLoaded", () => {
  protectPage();
  bindForm();
});

/* =========================================================
   PAGE PROTECTION
========================================================= */
function protectPage() {
  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");

  if (!token || !userRaw) {
    return redirectToLogin();
  }

  let user;
  try {
    user = JSON.parse(userRaw);
  } catch {
    return redirectToLogin();
  }

  // If password change is NOT required → redirect properly
  if (user.must_change_password !== true) {
    redirectToDashboard(user.role);
  }
}

/* =========================================================
   REDIRECT TO DASHBOARD BASED ON ROLE
========================================================= */
function redirectToDashboard(role) {
  const roleLower = role?.toLowerCase();

  if (roleLower === "admin") {
    window.location.href = "/admin-dashboard";
  } else if (roleLower === "supplier") {
    window.location.href = "/supplier/dashboard";
  } else if (roleLower === "buyer") {
    window.location.href = "/buyer/dashboard";
  } else if (roleLower === "oem") {
    window.location.href = "/oem/dashboard";
  } else {
    redirectToLogin();
  }
}

/* =========================================================
   BIND FORM
========================================================= */
function bindForm() {
  const form = document.getElementById("changePasswordForm");
  if (!form) return;

  form.addEventListener("submit", handleSubmit);
}

/* =========================================================
   HANDLE SUBMIT
========================================================= */
async function handleSubmit(e) {
  e.preventDefault();
  clearMessage();

  const token = localStorage.getItem("token");
  const newPassword = getValue("newPassword");
  const confirmPassword = getValue("confirmPassword");

  if (!token) return redirectToLogin();

  if (!newPassword || newPassword.length < 8) {
    return showMessage("Password must be at least 8 characters");
  }

  if (newPassword !== confirmPassword) {
    return showMessage("Passwords do not match");
  }

  setLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ newPassword })
    });

    if (response.status === 401) {
      return redirectToLogin();
    }

    const result = await safeJson(response);

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Password change failed");
    }

    showMessage(
      "Password updated successfully. Please login again.",
      "success"
    );

    // Clear session after success
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setTimeout(() => {
      window.location.href = "/login";
    }, 1200);

  } catch (error) {
    showMessage(error.message || "Server error");
  } finally {
    setLoading(false);
  }
}

/* =========================================================
   HELPERS
========================================================= */
function redirectToLogin() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

function showMessage(message, type = "error") {
  const status = document.getElementById("status");
  if (!status) return;

  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = "block";
}

function clearMessage() {
  const status = document.getElementById("status");
  if (!status) return;

  status.textContent = "";
  status.style.display = "none";
}

function setLoading(isLoading) {
  const btn = document.getElementById("changeBtn");
  const btnText = document.getElementById("changeBtnText");

  if (!btn || !btnText) return;

  btn.disabled = isLoading;

  btnText.innerHTML = isLoading
    ? `<span class="spinner"></span> Updating...`
    : "Update Password";
}

function getValue(id) {
  return document.getElementById(id)?.value.trim() || "";
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}