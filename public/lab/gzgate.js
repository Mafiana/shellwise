// gzgate.js — Pro Game Zone: 4 min for Free/Learner; lock + popup until Pro
(function () {
  'use strict';

  const LIMIT_MS = 4 * 60 * 1000;
  const KEY = 'sw_gz_play_ms';
  const KEY_DAY = 'sw_gz_play_day';
  const KEY_LOCK = 'sw_gz_locked'; // '1' once limit hit — stays until Pro

  function today() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function plan() {
    try {
      if (window.SWP && typeof SWP.plan === 'function') return SWP.plan();
      const o = JSON.parse(localStorage.getItem('kuser') || 'null');
      if (!o || o.guest) return 'free';
      if (o.plan === 'team') return 'pro';
      return o.plan === 'learner' || o.plan === 'pro' ? o.plan : 'free';
    } catch (e) {
      return 'free';
    }
  }

  function isPro() {
    const p = plan();
    return p === 'pro' || p === 'team';
  }

  function loadMs() {
    try {
      const day = localStorage.getItem(KEY_DAY);
      if (day !== today()) {
        // New day: reset time pool, but keep lock only if you want daily unlock.
        // User asked: stay locked until Pro — do NOT clear KEY_LOCK on new day.
        localStorage.setItem(KEY_DAY, today());
        localStorage.setItem(KEY, '0');
        return 0;
      }
      return Math.max(0, parseInt(localStorage.getItem(KEY) || '0', 10) || 0);
    } catch (e) {
      return 0;
    }
  }

  function saveMs(ms) {
    try {
      localStorage.setItem(KEY_DAY, today());
      localStorage.setItem(KEY, String(Math.min(LIMIT_MS + 60000, Math.max(0, ms))));
    } catch (e) {}
  }

  function setLocked(on) {
    try {
      if (on) localStorage.setItem(KEY_LOCK, '1');
      else localStorage.removeItem(KEY_LOCK);
    } catch (e) {}
  }

  function isLocked() {
    if (isPro()) {
      // Pro: clear lock permanently
      setLocked(false);
      try {
        localStorage.setItem(KEY, '0');
      } catch (e) {}
      return false;
    }
    try {
      if (localStorage.getItem(KEY_LOCK) === '1') return true;
    } catch (e) {}
    return loadMs() >= LIMIT_MS;
  }

  function ensureCss() {
    if (document.getElementById('sw-gz-gate-css')) return;
    const s = document.createElement('style');
    s.id = 'sw-gz-gate-css';
    s.textContent = `
.sw-gz-gate{position:fixed;inset:0;z-index:100050;background:#000c;display:grid;place-items:center;padding:16px;box-sizing:border-box}
.sw-gz-gate-box{width:min(400px,94vw);border-radius:18px;border:1px solid #ffb45466;background:linear-gradient(160deg,#12100a,#0b1220);
  box-shadow:0 24px 60px #000c,0 0 40px #ffb45422;padding:22px;color:#e8eefc;font:14px system-ui,sans-serif;text-align:left}
.sw-gz-gate-box h3{margin:0 0 8px;font-size:18px;color:#ffb454;display:flex;align-items:center;gap:10px}
.sw-gz-gate-box h3 svg{flex:none;width:28px;height:28px;color:#ffb454;filter:drop-shadow(0 0 8px #ffb45466)}
.sw-gz-gate-box p{margin:0 0 12px;color:#9fb0d0;line-height:1.5}
.sw-gz-gate-box b{color:#e8eefc}
.sw-gz-gate-act{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
.sw-gz-gate-act button{flex:1;min-width:120px;border:0;border-radius:10px;padding:12px 14px;font:700 14px system-ui,sans-serif;cursor:pointer}
.sw-gz-gate-pro{background:linear-gradient(135deg,#ffb454,#e08a20);color:#041018}
.sw-gz-gate-later{background:#ffffff14;color:#e8eefc;border:1px solid #ffffff28}
`;
    document.head.appendChild(s);
  }

    function goPlans() {
    try {
      var el = document.getElementById('sw-gz-gate');
      if (el) el.remove();
    } catch (e) {}

    // Always go to the site pricing section — do not open other lab popups
    var target = '/#plans';
    try {
      if (window.parent && window.parent !== window) {
        try {
          window.parent.postMessage({ type: 'shellwise', action: 'plans', shellwise: 'plans' }, '*');
        } catch (e) {}
        try {
          if (window.top && window.top.location) {
            window.top.location.href = target;
            return;
          }
        } catch (e) {}
        try {
          window.parent.location.href = target;
          return;
        } catch (e) {}
      }
    } catch (e) {}
    try {
      window.location.href = target;
    } catch (e) {
      try { window.location.assign(target); } catch (e2) {}
    }
  }

  function showGate(force) {
    if (isPro()) {
      setLocked(false);
      const el = document.getElementById('sw-gz-gate');
      if (el) el.remove();
      return;
    }
    ensureCss();
    if (!force && document.getElementById('sw-gz-gate')) return;
    const old = document.getElementById('sw-gz-gate');
    if (old) old.remove();
    const ov = document.createElement('div');
    ov.id = 'sw-gz-gate';
    ov.className = 'sw-gz-gate';
    ov.innerHTML =
      '<div class="sw-gz-gate-box" role="alertdialog" aria-modal="true">' +
        '<h3><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="16" r="1.4" fill="currentColor"/></svg>Pro Game Zone locked</h3>' +
        '<p>Your free play session is over.</p>' +
        '<p>Upgrade to <b>Pro</b> for unlimited access to every Game Zone mission.</p>' +
        '<div class="sw-gz-gate-act">' +
          '<button type="button" class="sw-gz-gate-later" id="sw-gz-later">Close</button>' +
          '<button type="button" class="sw-gz-gate-pro" id="sw-gz-pro">Upgrade to Pro</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    document.getElementById('sw-gz-later').onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      ov.remove(); // Close only — lock stays until Pro
    };
    document.getElementById('sw-gz-pro').onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      goPlans(); // → home pricing (#plans)
    };
    // Backdrop click = close (same as Close)
    ov.addEventListener('click', function (e) {
      if (e.target === ov) ov.remove();
    });
  }

  function stopZonePlay() {
    try {
      if (typeof SH !== 'undefined' && SH && typeof SH.stopMission === 'function') SH.stopMission();
    } catch (e) {}
    try {
      if (typeof window.__rescueStop === 'function') window.__rescueStop();
    } catch (e) {}
    try {
      if (typeof window.swStopRunningGame === 'function') window.swStopRunningGame();
    } catch (e) {}
    window.__gzGateActive = false;
  }

  let tick = null;
  let last = 0;

  function stopTicker() {
    if (tick) {
      clearInterval(tick);
      tick = null;
    }
    window.__gzGateActive = false;
  }

  function startTicker() {
    if (isPro() || isLocked()) {
      stopTicker();
      return;
    }
    if (tick) return;
    window.__gzGateActive = true;
    last = Date.now();
    tick = setInterval(function () {
      if (isPro()) {
        setLocked(false);
        stopTicker();
        return;
      }
      const now = Date.now();
      const add = now - last;
      last = now;
      const total = loadMs() + add;
      saveMs(total);
      if (total >= LIMIT_MS) {
        setLocked(true);
        stopTicker();
        stopZonePlay();
        showGate(true);
        if (typeof toast === 'function') toast('Game Zone locked — upgrade to Pro');
      }
    }, 1000);
  }

  /** false = blocked (locked or Pro check failed) */
  window.swGzAllowPlay = function () {
    if (isPro()) {
      setLocked(false);
      return true;
    }
    if (isLocked()) {
      setLocked(true);
      showGate(true);
      return false;
    }
    return true;
  };

  window.swGzStartTimer = function () {
    if (isPro() || isLocked()) return;
    if (!window.swGzAllowPlay()) return;
    startTicker();
  };

  window.swGzStopTimer = function () {
    stopTicker();
  };

  window.swGzShowGate = showGate;
  window.swGzIsLocked = isLocked;

  function hook() {
    if (typeof window.gzPlay === 'function' && !window.gzPlay.__gzGate) {
      const prev = window.gzPlay;
      window.gzPlay = function (id) {
        if (!window.swGzAllowPlay()) return;
        const r = prev.apply(this, arguments);
        window.swGzStartTimer();
        return r;
      };
      window.gzPlay.__gzGate = true;
    }
    if (typeof C !== 'undefined') {
      ['vault', 'secrethunter', 'cyberattack', 'speedrun', 'detective'].forEach(function (fn) {
        if (typeof C[fn] === 'function' && !C[fn].__gzGate) {
          const p = C[fn];
          C[fn] = function () {
            if (!window.swGzAllowPlay()) return;
            window.swGzStartTimer();
            return p.apply(this, arguments);
          };
          C[fn].__gzGate = true;
        }
      });
    }
    if (typeof window.startRescue === 'function' && !window.startRescue.__gzGate) {
      const pr = window.startRescue;
      window.startRescue = function () {
        if (!window.swGzAllowPlay()) return;
        window.swGzStartTimer();
        return pr.apply(this, arguments);
      };
      window.startRescue.__gzGate = true;
    }
  }

  function onReady() {
    hook();
    // After reload: if locked and not Pro → show popup again, no access
    if (isLocked()) {
      setLocked(true);
      showGate(true);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(onReady, 200);
      setTimeout(hook, 800);
      setTimeout(hook, 1600);
    });
  } else {
    setTimeout(onReady, 200);
    setTimeout(hook, 800);
  }

  // If they open Game Zone section later
  document.addEventListener('click', function (e) {
    const t = e.target && e.target.closest && e.target.closest('[data-go="gamezone"],[data-nav="gamezone"],a[href*="gamezone"]');
    if (t && isLocked()) {
      setTimeout(function () {
        showGate(true);
      }, 100);
    }
  }, true);

  console.log('[gzgate] lock until Pro');
})();
