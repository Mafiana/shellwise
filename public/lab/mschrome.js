// mschrome.js — shared mission HUD: free 2D drag on mobile + desktop, smaller type, optional timer
(function () {
  'use strict';

  let msTimerId = null;
  let msEnds = 0;

  function ensureHudStyles() {
    if (document.getElementById('ms-chrome-css')) return;
    const s = document.createElement('style');
    s.id = 'ms-chrome-css';
    s.textContent = `
#hud.ms-drag{
  position:fixed !important;
  cursor:grab;
  touch-action:none;
  user-select:none;
  -webkit-user-select:none;
  max-width:min(280px,72vw);
  z-index:40;
  font-size:11px;
  line-height:1.35;
  padding:6px 10px 8px;
  right:auto;
  bottom:auto;
}
#hud.ms-drag.dragging{cursor:grabbing;opacity:.95}
#hud .ms-drag-handle{
  display:none;
  align-items:center;
  justify-content:center;
  gap:6px;
  margin:-2px 0 6px;
  padding:2px 0 4px;
  border-bottom:1px solid #ffffff18;
  color:#7d8fad;
  font:600 9px/1 ui-monospace,monospace;
  letter-spacing:.06em;
  text-transform:uppercase;
  pointer-events:none;
}
#hud .ms-drag-handle svg{opacity:.85;flex:none}
@media(max-width:720px){
  #hud.ms-drag{
    font-size:10px !important;
    line-height:1.3 !important;
    padding:5px 8px 6px !important;
    max-width:min(240px,68vw) !important;
  }
  #hud.ms-drag b.hl{font-size:10px !important}
  #hud.ms-drag .dim{font-size:9px !important}
  #hud.ms-drag .ms-drag-handle{display:flex !important}
}
.ms-float-timer{
  position:fixed;
  z-index:45;
  min-width:72px;
  padding:8px 12px;
  border-radius:12px;
  border:1px solid #2f8cff88;
  background:#0b1220ee;
  color:#e8eefc;
  font:700 16px/1 'JetBrains Mono',ui-monospace,monospace;
  box-shadow:0 8px 24px #000a;
  cursor:grab;
  touch-action:none;
  user-select:none;
  -webkit-user-select:none;
  right:12px;
  top:calc(env(safe-area-inset-top,0px) + 100px);
}
.ms-float-timer.warn{color:#ff6b6b;border-color:#ff6b6b88}
.ms-float-timer.dragging{cursor:grabbing}
@media(max-width:720px){
  .ms-float-timer{font-size:14px;padding:7px 10px;min-width:64px}
}
`;
    document.head.appendChild(s);
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function makeDraggable(el, storageKey) {
    if (!el || el.dataset.msDrag === '1') return;
    el.dataset.msDrag = '1';
    el.classList.add('ms-drag');

    // Use fixed positioning so left/top are viewport coords (full 2D move)
    const cs = window.getComputedStyle(el);
    if (cs.position !== 'fixed') {
      const r = el.getBoundingClientRect();
      el.style.position = 'fixed';
      el.style.left = r.left + 'px';
      el.style.top = r.top + 'px';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
    }

    try {
      const saved = sessionStorage.getItem(storageKey || 'ms_hud_pos');
      if (saved) {
        const p = JSON.parse(saved);
        if (typeof p.l === 'number' && typeof p.t === 'number') {
          el.style.left = p.l + 'px';
          el.style.top = p.t + 'px';
          el.style.right = 'auto';
          el.style.bottom = 'auto';
        }
      }
    } catch (e) {}

    let ox = 0;
    let oy = 0;
    let moving = false;
    let pid = null;

    function point(ev) {
      if (ev.touches && ev.touches[0]) return ev.touches[0];
      if (ev.changedTouches && ev.changedTouches[0]) return ev.changedTouches[0];
      return ev;
    }

    function down(ev) {
      // Allow text selection? No — whole HUD is the handle
      const t = point(ev);
      if (!t) return;
      moving = true;
      pid = t.pointerId != null ? t.pointerId : null;
      el.classList.add('dragging');
      const r = el.getBoundingClientRect();
      // Switch to fixed at current visual position
      el.style.position = 'fixed';
      el.style.left = r.left + 'px';
      el.style.top = r.top + 'px';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      el.style.margin = '0';
      ox = t.clientX - r.left;
      oy = t.clientY - r.top;
      if (el.setPointerCapture && ev.pointerId != null) {
        try { el.setPointerCapture(ev.pointerId); } catch (e) {}
      }
      if (ev.cancelable) ev.preventDefault();
      ev.stopPropagation();
    }

    function move(ev) {
      if (!moving) return;
      const t = point(ev);
      if (!t) return;
      if (pid != null && t.pointerId != null && t.pointerId !== pid) return;

      let l = t.clientX - ox;
      let top = t.clientY - oy;
      const pad = 4;
      const maxL = window.innerWidth - el.offsetWidth - pad;
      const maxT = window.innerHeight - el.offsetHeight - pad;
      l = clamp(l, pad, Math.max(pad, maxL));
      top = clamp(top, pad, Math.max(pad, maxT));

      el.style.left = l + 'px';
      el.style.top = top + 'px';
      el.style.right = 'auto';
      el.style.bottom = 'auto';

      if (ev.cancelable) ev.preventDefault();
    }

    function up(ev) {
      if (!moving) return;
      moving = false;
      pid = null;
      el.classList.remove('dragging');
      try {
        sessionStorage.setItem(
          storageKey || 'ms_hud_pos',
          JSON.stringify({
            l: parseInt(el.style.left, 10) || 0,
            t: parseInt(el.style.top, 10) || 0
          })
        );
      } catch (e) {}
      if (el.releasePointerCapture && ev && ev.pointerId != null) {
        try { el.releasePointerCapture(ev.pointerId); } catch (e) {}
      }
    }

    // Pointer events (Chrome, Safari, Firefox, modern mobile) — full 2D
    el.addEventListener('pointerdown', down, { passive: false });
    el.addEventListener('pointermove', move, { passive: false });
    el.addEventListener('pointerup', up, { passive: false });
    el.addEventListener('pointercancel', up, { passive: false });

    // Fallback touch (older WebViews)
    el.addEventListener('touchstart', down, { passive: false });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', up, { passive: false });
    el.addEventListener('touchcancel', up, { passive: false });

    // Fallback mouse
    el.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }

  function bindHud() {
    ensureHudStyles();
    const el = document.getElementById('hud');
    if (!el) return;
    if (el.style.display === 'none') return;
    if (!el.innerHTML) return;

    if (!el.querySelector('.ms-drag-handle')) {
      const h = document.createElement('div');
      h.className = 'ms-drag-handle';
      h.setAttribute('aria-hidden', 'true');
      h.innerHTML =
        '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
        '<path d="M5 9h14M5 15h14"/>' +
        '<circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none"/>' +
        '<circle cx="15" cy="9" r="1.2" fill="currentColor" stroke="none"/>' +
        '<circle cx="9" cy="15" r="1.2" fill="currentColor" stroke="none"/>' +
        '<circle cx="15" cy="15" r="1.2" fill="currentColor" stroke="none"/>' +
        '</svg><span>Drag anywhere</span>';
      el.insertBefore(h, el.firstChild);
    }
    makeDraggable(el, 'ms_hud_pos');
  }

  const obs = new MutationObserver(function () {
    const el = document.getElementById('hud');
    if (el && el.style.display !== 'none' && el.innerHTML) bindHud();
  });
  function startObs() {
    if (!document.body) return;
    obs.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }
  if (document.body) startObs();
  else document.addEventListener('DOMContentLoaded', startObs);

  function fmt(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m + ':' + String(r).padStart(2, '0');
  }

  function ensureFloatTimer() {
    ensureHudStyles();
    let chip = document.getElementById('ms-float-timer');
    if (!chip) {
      chip = document.createElement('div');
      chip.id = 'ms-float-timer';
      chip.className = 'ms-float-timer';
      chip.title = 'Drag to move';
      document.body.appendChild(chip);
      makeDraggable(chip, 'ms_timer_pos');
    }
    return chip;
  }

  function clearMsTimer() {
    if (msTimerId) {
      clearInterval(msTimerId);
      msTimerId = null;
    }
    msEnds = 0;
    const chip = document.getElementById('ms-float-timer');
    if (chip) chip.remove();
  }

  window.swStartMissionTimer = function (ms, onExpire) {
    clearMsTimer();
    msEnds = Date.now() + (ms || 120000);
    const chip = ensureFloatTimer();
    function tick() {
      const left = msEnds - Date.now();
      chip.textContent = fmt(left);
      chip.classList.toggle('warn', left < 30000 && left > 0);
      if (left <= 0) {
        clearMsTimer();
        if (typeof onExpire === 'function') onExpire();
      }
    }
    tick();
    msTimerId = setInterval(tick, 250);
  };

  window.swClearMissionTimer = clearMsTimer;
  window.swBindMissionHud = bindHud;

  setTimeout(bindHud, 400);
  setTimeout(bindHud, 1200);

  console.log('[mschrome] free 2D HUD drag ready');
})();
