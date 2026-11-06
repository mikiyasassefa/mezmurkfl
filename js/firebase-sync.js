/**
 * firebase-sync.js — Cloud sync layer for ፈለገሕይወት መዝሙር ክፍል
 *
 * When FIREBASE_CONFIG is provided in firebase-config.js, all data
 * is synced to Firestore in real-time — enabling cross-device access.
 * Falls back silently to localStorage-only if Firebase is not configured.
 */

const CLOUD = (() => {
  let _db  = null;
  let _ok  = false;

  const COL = {
    fmk_students:   'students',
    fmk_attendance: 'attendance',
    fmk_equipment:  'equipment',
    fmk_checkouts:  'checkouts',
    fmk_services:   'services'
  };

  /* ── Init ─────────────────────────────────── */
  function init() {
    if (!window.FIREBASE_CONFIG) return;
    if (!window.firebase)        return;

    const cfg = window.FIREBASE_CONFIG;
    if (!cfg.projectId || cfg.projectId === 'REPLACE_WITH_PROJECT_ID') {
      console.info('[Cloud] Firebase not configured yet — using localStorage only.');
      return;
    }

    try {
      if (!firebase.apps.length) firebase.initializeApp(cfg);
      _db = firebase.firestore();
      _ok = true;
      console.info('[Cloud] ✓ Firebase connected — data will sync across all devices.');
    } catch (e) {
      console.warn('[Cloud] Firebase init error:', e.message);
    }
  }

  function isConnected() { return _ok; }

  /* ── Pull all collections → localStorage ──── */
  async function pull() {
    if (!_ok || !_db) return;
    const banner = _showSyncBanner();
    try {
      await Promise.all(
        Object.entries(COL).map(async ([localKey, colName]) => {
          const snap = await _db.collection(colName).get();
          if (!snap.empty) {
            const data = snap.docs.map(d => d.data());
            localStorage.setItem(localKey, JSON.stringify(data));
          }
        })
      );
    } catch (e) {
      console.warn('[Cloud] pull failed:', e.message);
    } finally {
      _hideSyncBanner(banner);
    }
  }

  /* ── Push full collection (called by _set in data.js) ── */
  async function push(localKey, dataArray) {
    if (!_ok || !_db || !Array.isArray(dataArray)) return;
    const colName = COL[localKey];
    if (!colName) return;
    try {
      // Upsert each item by id
      const batch = _db.batch();
      dataArray.forEach(item => {
        if (item && item.id) {
          batch.set(_db.collection(colName).doc(item.id), item);
        }
      });
      await batch.commit();
    } catch (e) {
      console.warn(`[Cloud] push '${colName}' failed:`, e.message);
    }
  }

  /* ── Upsert a single document ─────────────── */
  async function upsert(localKey, item) {
    if (!_ok || !_db || !item || !item.id) return;
    const colName = COL[localKey];
    if (!colName) return;
    try {
      await _db.collection(colName).doc(item.id).set(item);
    } catch (e) {
      console.warn(`[Cloud] upsert '${colName}/${item.id}' failed:`, e.message);
    }
  }

  /* ── Delete a single document ─────────────── */
  async function remove(localKey, id) {
    if (!_ok || !_db || !id) return;
    const colName = COL[localKey];
    if (!colName) return;
    try {
      await _db.collection(colName).doc(id).delete();
    } catch (e) {
      console.warn(`[Cloud] delete '${colName}/${id}' failed:`, e.message);
    }
  }

  /* ── Sync indicator ───────────────────────── */
  function _showSyncBanner() {
    const el = document.createElement('div');
    el.id = 'cloudSyncBanner';
    Object.assign(el.style, {
      position: 'fixed', top: '0', left: '0', right: '0',
      background: 'var(--clr-primary)', color: 'var(--clr-accent)',
      textAlign: 'center', fontSize: '12px', fontWeight: '700',
      padding: '6px', zIndex: '9999', letterSpacing: '0.05em'
    });
    el.textContent = '⟳  Syncing data from cloud…';
    document.body.appendChild(el);
    return el;
  }

  function _hideSyncBanner(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  return { init, isConnected, pull, push, upsert, remove };
})();
