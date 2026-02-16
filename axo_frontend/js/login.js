/* =========================================================
   AXO NETWORKS — LOGIN MODULE (ENTERPRISE STABLE)
========================================================= */

const API_BASE_URL = "/api";

document.addEventListener("DOMContentLoaded", () => {
  initLogin();
});

/* =========================================================
   INIT — VALIDATE EXISTING SESSION
========================================================= */
async function initLogin() {
  const token = getToken();

  if (!token) {
    bindLoginForm();
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      clearSession();
      bindLoginForm();
      return;
    }

    const result = await safeJson(response);

    if (!response.ok || !result.success || !result.user) {
      clearSession();
      bindLoginForm();
      return;
    }

    handlePostLoginRedirect(result.user);

  } catch (err) {
    clearSession();
    bindLoginForm();
  }
}

/* =========================================================
   BIND LOGIN FORM
========================================================= */
function bindLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  // Prevent multiple bindings
  form.removeEventListener("submit", handleLoginSubmit);
  form.addEventListener("submit", handleLoginSubmit);
}

/* =========================================================
   LOGIN HANDLER
========================================================= */
async function handleLoginSubmit(event) {
  event.preventDefault();
  clearMessage();

  const email = getValue("email");
  const password = getValue("password");

  if (!validateEmail(email)) {
    return showMessage("Enter a valid email address");
  }

  if (!password) {
    return showMessage("Password is required");
  }

  setLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const result = await safeJson(response);

    if (response.status === 401) {
      throw new Error("Invalid email or password");
    }

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Login failed");
    }

    const token = result.token || result.data?.token;
    const user = result.user || result.data?.user;

    if (!token || !user) {
      throw new Error("Invalid login response from server");
    }

    storeSession(token, user);

    showMessage("Login successful. Redirecting...", "success");

    setTimeout(() => {
      handlePostLoginRedirect(user);
    }, 400);

  } catch (error) {
    showMessage(error.message || "Server error");
  } finally {
    setLoading(false);
  }
}

/* =========================================================
   POST LOGIN ROUTING
========================================================= */
function handlePostLoginRedirect(user) {
  if (!user) return redirectToLogin();

  // 🔐 Force password change first
  if (user.must_change_password === true) {
    window.location.href = "/change-password";
    return;
  }

  redirectByRole(user.role);
}

/* =========================================================
   ROLE BASED REDIRECT
========================================================= */
function redirectByRole(role) {
  if (!role) return redirectToLogin();

  const routes = {
    admin: "/admin-dashboard",
    supplier: "/supplier/dashboard",
    buyer: "/buyer/dashboard",
    both: "/buyer/dashboard"
  };

  const normalizedRole = role.toLowerCase();
  window.location.href = routes[normalizedRole] || "/login";
}

/* =========================================================
   STORAGE
========================================================= */
function storeSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function getToken() {
  return localStorage.getItem("token");
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function redirectToLogin() {
  clearSession();
  window.location.href = "/login";
}

/* =========================================================
   UI HELPERS
========================================================= */
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
  const btn = document.getElementById("loginBtn");
  const btnText = document.getElementById("loginBtnText");

  if (!btn || !btnText) return;

  btn.disabled = isLoading;

  btnText.innerHTML = isLoading
    ? `<span class="spinner"></span> Signing in...`
    : "Sign In";
}

function getValue(id) {
  return document.getElementById(id)?.value.trim() || "";
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* =========================================================
   SAFE JSON
========================================================= */
async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}