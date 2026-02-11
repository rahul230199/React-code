// ============================================
// LOGIN SYSTEM (PRODUCTION SAFE, ROLE SAFE)
// ============================================

const API_BASE_URL = "/api";

/* ===================== PAGE LOAD ===================== */
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Login page loaded");

  try {
    const user = getStoredUser();
    const token = getToken();

    if (user && token) {
      redirectToDashboard(user);
    }
  } catch (e) {
    console.warn("Auth check skipped:", e.message);
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
    window.location.href = "/buyer-dashboard";
  }
}

/* ===================== UI HELPERS ===================== */
function showMessage(message, type = "error") {
  const status = document.getElementById("status");

  if (!status) {
    alert(message);
    return;
  }

  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = "block";
}

function clearMessage() {
  const status = document.getElementById("status");
  if (!status) return;

  status.style.display = "none";
  status.textContent = "";
}

function setLoading(isLoading) {
  const btn = document.getElementById("loginBtn");
  const btnText = document.getElementById("loginBtnText");

  if (!btn || !btnText) return;

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
  if (!token || !userData) return null;

  const user = {
    id: userData.id,
    email: userData.email,
    role: userData.role
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
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    const emailEl = document.getElementById("email");
    const passwordEl = document.getElementById("password");

    if (!emailEl || !passwordEl) {
      showMessage("Login form misconfigured");
      return;
    }

    const email = emailEl.value.trim();
    const password = passwordEl.value;

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
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (!result.success || !result.token || !result.user) {
        showMessage(result.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      const user = storeAuthData(result.token, result.user);

      if (!user) {
        showMessage("Failed to save session");
        setLoading(false);
        return;
      }

      showMessage("Login successful! Redirecting...", "success");

      setTimeout(() => redirectToDashboard(user), 300);

    } catch (err) {
      console.error("❌ Login error:", err);
      showMessage("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  });
});

/* ===================== HEALTH CHECK (SILENT) ===================== */
setTimeout(async () => {
  try {
    await fetch("/api/_health");
  } catch {
    console.warn("⚠️ API not reachable");
  }
}, 1000);

