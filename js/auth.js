/**
 * auth.js — Authentication module for ፈለገሕይወት መዝሙር ክፍል
 * MVP: Single admin user, localStorage session.
 */

const AUTH = (() => {
  const ADMIN_EMAIL    = 'admin@felege.com';
  const ADMIN_PASSWORD = 'Admin@2024';
  const SESSION_KEY    = 'fmk_auth_session';
  const USER_KEY       = 'fmk_auth_user';

  /* ── Core ──────────────────────────────── */
  function login(email, password) {
    if (
      email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
      password === ADMIN_PASSWORD
    ) {
      const session = {
        token:     btoa(email + ':' + Date.now() + ':' + Math.random()),
        createdAt: Date.now(),
        expiresAt: Date.now() + 8 * 60 * 60 * 1000
      };
      const user = { name: 'Administrator', email: ADMIN_EMAIL, role: 'admin', initials: 'AD' };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      localStorage.setItem(USER_KEY,    JSON.stringify(user));
      return { ok: true };
    }
    return { ok: false, error: 'Invalid email or password. Please try again.' };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = 'index.html';
  }

  function isAuthenticated() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const session = JSON.parse(raw);
      if (Date.now() > session.expiresAt) {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(USER_KEY);
        return false;
      }
      return true;
    } catch { return false; }
  }

  function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) || null; }
    catch { return null; }
  }

  /* requireAuth — call at top of every protected page.
     Returns true if OK, false if redirecting. */
  function requireAuth() {
    if (!isAuthenticated()) {
      // Store where we came from so login can redirect back
      sessionStorage.setItem('fmk_redirect', window.location.href);
      window.location.replace('login.html');
      return false;
    }
    return true;
  }

  /* ── UI helpers ─────────────────────────── */
  function populateUserUI() {
    const user = getUser();
    if (!user) return;
    document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user.name);
    document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = user.email);
    document.querySelectorAll('[data-user-initials]').forEach(el => el.textContent = user.initials || 'AD');
  }

  function attachLogoutButtons() {
    document.querySelectorAll('[data-logout]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.confirm('Are you sure you want to sign out?')) logout();
      });
    });
  }

  /* initProtectedPage — safe to call before or after DOMContentLoaded */
  function initProtectedPage() {
    if (!requireAuth()) return false;
    // Delay UI population until DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        populateUserUI();
        attachLogoutButtons();
      });
    } else {
      populateUserUI();
      attachLogoutButtons();
    }
    return true;
  }

  return { login, logout, isAuthenticated, getUser, requireAuth,
           initProtectedPage, populateUserUI, attachLogoutButtons };
})();
