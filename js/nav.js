/**
 * nav.js — Shared navigation component injected into all protected pages.
 * Call NAV.init({ activePage }) after DOM is ready.
 */

const NAV = (() => {
  const PAGES = [
    { id: 'dashboard',    label: 'Dashboard',    icon: 'home',       href: 'dashboard.html',     mobileShow: true },
    { id: 'directory',    label: 'Directory',    icon: 'users',      href: 'directory.html',     mobileShow: true },
    { id: 'attendance',   label: 'Attendance',   icon: 'check-sq',   href: 'attendance.html',    mobileShow: true },
    { id: 'services',     label: 'Services',     icon: 'calendar',   href: 'services.html',      mobileShow: true },
    { id: 'registration', label: 'Register',     icon: 'user-plus',  href: 'registration.html',  mobileShow: false },
    { id: 'equipment',    label: 'Equipment',    icon: 'package',    href: 'equipment.html',     mobileShow: false },
  ];

  const ICONS = {
    'home':     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    'users':    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    'check-sq': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
    'calendar': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    'music':    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    'user-plus':`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>`,
    'package':  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    'logout':   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    'menu':     `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
    'x':        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  };

  function icon(name, size = 18) {
    return ICONS[name] || `<svg width="${size}" height="${size}" viewBox="0 0 24 24"/>`;
  }

  function buildSidebar(activePage) {
    const user = AUTH.getUser() || { name: 'Admin', email: 'admin@felege.com', initials: 'AD' };
    const navItems = PAGES.map(p => `
      <a href="${p.href}" class="nav-link ${activePage === p.id ? 'active' : ''}" aria-label="${p.label}">
        ${icon(p.icon)} <span>${p.label}</span>
      </a>`).join('');

    return `
      <aside class="sidebar" id="sidebar" role="navigation" aria-label="Main navigation">
        <div class="sidebar-header">
          <img src="assets/logo.png" alt="ፈለገሕይወት logo" class="sidebar-logo"/>
          <div>
            <div class="sidebar-title ethiopic">ፈለገሕይወት</div>
            <div class="sidebar-subtitle">መዝሙር ክፍል</div>
          </div>
        </div>
        <nav class="sidebar-nav">
          <div class="nav-section-label">Menu</div>
          ${navItems}
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="sidebar-avatar" data-user-initials>${user.initials}</div>
            <div class="sidebar-user-info">
              <div class="sidebar-user-name" data-user-name>${user.name}</div>
              <div class="sidebar-user-role" data-user-email>${user.email}</div>
            </div>
          </div>
          <button class="btn-logout" data-logout aria-label="Sign out">
            ${icon('logout')} Sign Out
          </button>
        </div>
      </aside>`;
  }

  function buildBottomNav(activePage) {
    const mobilePages = PAGES.filter(p => p.mobileShow);
    const items = mobilePages.map(p => `
      <a href="${p.href}" class="bottom-nav-item ${activePage === p.id ? 'active' : ''}" aria-label="${p.label}">
        ${icon(p.icon, 20)} <span>${p.label}</span>
      </a>`).join('');
    // Add "More" for non-mobile pages
    items;
    return `<nav class="bottom-nav" id="bottomNav" role="navigation" aria-label="Mobile navigation">${items}</nav>`;
  }

  function buildTopHeader(pageTitle) {
    return `
      <header class="top-header" id="topHeader">
        <button class="btn-menu-toggle" id="menuToggle" aria-label="Open menu" aria-expanded="false">
          ${icon('menu')}
        </button>
        <h1 class="top-header-title">${pageTitle}</h1>
        <div class="top-header-actions">
          <a href="index.html" class="btn btn-ghost btn-sm" style="gap:6px; color: var(--clr-primary)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span class="desktop-only">Home</span>
          </a>
        </div>
      </header>`;
  }

  function buildSidebarOverlay() {
    return `<div class="sidebar-overlay" id="sidebarOverlay"></div>`;
  }

  function buildToastContainer() {
    return `<div class="toast-container" id="toastContainer" aria-live="polite" aria-atomic="true"></div>`;
  }

  function attachToggle() {
    const toggle  = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!toggle || !sidebar) return;

    function open() {
      sidebar.classList.add('open');
      overlay.classList.add('show');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
    toggle.addEventListener('click', () => sidebar.classList.contains('open') ? close() : open());
    overlay.addEventListener('click', close);

    // Close on nav link click (mobile)
    sidebar.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 768) close();
      });
    });
  }

  function init({ activePage = '', pageTitle = 'Dashboard' } = {}) {
    // Inject shell components
    const appShell = document.getElementById('appShell');
    if (!appShell) return;

    appShell.innerHTML = `
      ${buildSidebarOverlay()}
      ${buildSidebar(activePage)}
      <div class="main-content" id="mainContent">
        ${buildTopHeader(pageTitle)}
        <main class="page-body" id="pageBody"></main>
      </div>
      ${buildBottomNav(activePage)}
      ${buildToastContainer()}
    `;

    // Move existing page content into pageBody
    const pageContent = document.getElementById('pageContent');
    const pageBody    = document.getElementById('pageBody');
    if (pageContent && pageBody) {
      pageBody.appendChild(pageContent);
      pageContent.style.display = 'block';
    }

    attachToggle();
    AUTH.attachLogoutButtons();
    AUTH.populateUserUI();
  }

  /* ── Toast ─────────────────────────────────────── */
  function toast(type, title, message = '', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = {
      success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
      error:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      info:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
    };

    const id = 'toast_' + Date.now();
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.id = id;
    el.setAttribute('role', 'alert');
    el.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-msg">${message}</div>` : ''}
      </div>
      <button class="toast-close" onclick="document.getElementById('${id}').remove()" aria-label="Close">&times;</button>
    `;
    container.appendChild(el);
    requestAnimationFrame(() => { requestAnimationFrame(() => el.classList.add('show')); });
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 350); }, duration);
  }

  /* ── Modal helper ───────────────────────────────── */
  function openModal(id) {
    const overlay = document.getElementById(id);
    if (overlay) { overlay.classList.add('show'); document.body.style.overflow = 'hidden'; }
  }
  function closeModal(id) {
    const overlay = document.getElementById(id);
    if (overlay) { overlay.classList.remove('show'); document.body.style.overflow = ''; }
  }

  /* ── Confirm dialog ─────────────────────────────── */
  function confirm(msg, onYes) {
    const id = 'confirmModal_' + Date.now();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = id;
    overlay.innerHTML = `
      <div class="modal" style="max-width:400px" role="dialog" aria-modal="true" aria-labelledby="${id}_title">
        <div class="modal-header">
          <h2 class="modal-title" id="${id}_title">Confirm Action</h2>
        </div>
        <div class="modal-body">
          <p style="color:var(--clr-text-muted);font-size:var(--fs-sm)">${msg}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline btn-sm" id="${id}_cancel">Cancel</button>
          <button class="btn btn-danger btn-sm" id="${id}_confirm">Confirm</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { requestAnimationFrame(() => overlay.classList.add('show')); });
    const close = () => { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 300); document.body.style.overflow = ''; };
    document.getElementById(`${id}_cancel`).onclick  = close;
    document.getElementById(`${id}_confirm`).onclick = () => { close(); onYes(); };
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  }

  /* ── Helpers ─────────────────────────────────────── */
  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  function formatDateShort(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
  }
  function getInitials(name) {
    return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
  function avatarColor(name) {
    const colors = ['#7B1E1E','#9B2E2E','#5A1515','#8B2500','#4A148C','#1A237E','#006064','#1B5E20'];
    let h = 0;
    for (let i = 0; i < (name||'').length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xFFFFFF;
    return colors[Math.abs(h) % colors.length];
  }

  return { init, toast, openModal, closeModal, confirm, openConfirm: confirm, icon, formatDate, formatDateShort, getInitials, avatarColor };
})();
