/* =========================================================
   AXO NETWORKS — ENTERPRISE LOGIN MODULE (FIXED)
========================================================= */

const API_BASE_URL = "/api";

/* =========================================================
   INIT
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  initLogin();
});

function initLogin() {
  const existingUser = getStoredUser();
  const token = getToken();

  // If session already exists → redirect safely
  if (existingUser && token) {
    redirectByRole(existingUser.role);
    return;
  }

  bindLoginForm();
}

/* =========================================================
   LOGIN FORM BINDING
========================================================= */
function bindLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", handleLoginSubmit);
}

/* =========================================================
   LOGIN HANDLER (FIXED RESPONSE HANDLING)
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

    const result = await safeParseJSON(response);

    if (!response.ok || !result?.success) {
      throw new Error(result?.message || "Invalid credentials");
    }

    // 🔥 Support both backend formats
    const token = result.token || result.data?.token;
    const userData = result.user || result.data?.user;

    if (!token || !userData) {
      throw new Error("Invalid login response from server");
    }

    const user = storeSession(token, userData);

    showMessage("Login successful. Redirecting...", "success");

    // Small delay for stability
    setTimeout(() => {
      redirectByRole(user.role);
    }, 300);

  } catch (error) {
    console.error("Login failed:", error.message);
    showMessage(error.message || "Server error");
  } finally {
    setLoading(false);
  }
}

/* =========================================================
   ROLE REDIRECT (NGINX SAFE)
========================================================= */
function redirectByRole(role) {
  if (!role) return;

  const normalized = role.toLowerCase();

  const routes = {
    admin: "/admin-dashboard",
    supplier: "/supplier-dashboard",
    buyer: "/buyer-dashboard",
    both: "/buyer-dashboard"
  };

  window.location.href = routes[normalized] || "/portal-login";
}

/* =========================================================
   SESSION STORAGE
========================================================= */
function storeSession(token, userData) {
  const sessionUser = {
    id: userData.id,
    email: userData.email,
    role: userData.role?.toLowerCase()
  };

  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(sessionUser));

  return sessionUser;
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

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
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
   SAFE JSON PARSER
========================================================= */
async function safeParseJSON(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

