// ============================================
// LOGIN SYSTEM (PRODUCTION SAFE, ROLE SAFE)
// ============================================

const API_BASE_URL = "/api";

/* ===================== PAGE LOAD ===================== */
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Login page loaded");

  // ✅ If already logged in, redirect safely
  const user = getStoredUser();
  const token = getToken();

  if (user && token) {
    redirectToDashboard(user);
  }
});

/* ===================== REDIRECT ===================== */
function redirectToDashboard(user) {
  if (!user || !user.role) return;

  const role = user.role.toUpperCase();

  if (role === "ADMIN") {
    window.location.href = "/admin-dashboard";
  } else if (role === "SUPPLIER") {
    window.location.href = "/supplier-dashboard";
  } else {
    // BUYER
    window.location.href = "/buyer-dashboard";
  }
}

/* ===================== UI HELPERS ===================== */
function showMessage(message, type = "error") {
  const status = document.getElementById("status");
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = "block";
}

function clearMessage() {
  const status = document.getElementById("status");
  status.style.display = "none";
  status.textContent = "";
}

function setLoading(isLoading) {
  const btn = document.getElementById("loginBtn");
  const btnText = document.getElementById("loginBtnText");

  btn.disabled = isLoading;
  btnText.innerHTML = isLoading
    ? '<span class="spinner"></span> Signing in...'
    : "Sign In";
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ===================== AUTH STORAGE ===================== */
function storeAuthData(token, userData) {
  const user = {
    id: userData.id,
    email: userData.email,
    role: userData.role,
  };

  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));

  return user;
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

function getToken() {
  return localStorage.getItem("token");
}

function clearAuthData() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

/* ===================== LOGIN SUBMIT ===================== */
document
  .getElementById("loginForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!validateEmail(email)) {
      showMessage("Please enter a valid email address");
      return;
    }

    if (!password) {
      showMessage("Please enter your password");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!result.success || !result.token || !result.user) {
        showMessage(result.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      const user = storeAuthData(result.token, result.user);

      showMessage("Login successful! Redirecting...", "success");

      setTimeout(() => redirectToDashboard(user), 400);

    } catch (err) {
      console.error("❌ Login error:", err);
      showMessage("Server error. Please try again.");
      setLoading(false);
    }
  });

/* ===================== HEALTH CHECK (SILENT) ===================== */
setTimeout(async () => {
  try {
    await fetch("/api/_health");
  } catch {
    console.warn("⚠️ API not reachable");
  }
}, 1000);
