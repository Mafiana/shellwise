// share.js — Shareable win card after Game Zone / RESCUE clears
(function () {
  'use strict';

  const NAMES = {
    secrethunter: 'Secret Hunter',
    cyberattack: 'Cyber Attack',
    speedrun: 'Linux Speed Run',
    vault: 'Terminal Vault',
    detective: 'Terminal Detective',
    rescue1: 'RESCUE 01',
    rescue2: 'RESCUE 02',
    rescue3: 'RESCUE 03',
    rescue4: 'RESCUE 04',
    hunt: 'Secret Hunter'
  };

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function timeLabel(sec) {
    if (sec == null || isNaN(sec)) return null;
    const s = Math.max(0, Math.floor(Number(sec)));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m + ':' + String(r).padStart(2, '0');
  }

  function ensureCss() {
    if (document.getElementById('sw-share-css')) return;
    const s = document.createElement('style');
    s.id = 'sw-share-css';
    s.textContent = `
.sw-share-ov{position:fixed;inset:0;z-index:100000;background:#000a;display:grid;place-items:center;padding:16px;box-sizing:border-box}
.sw-share-card{width:min(360px,94vw);border-radius:18px;border:1px solid #00f0a855;background:linear-gradient(160deg,#0b1520,#061018 60%);
  box-shadow:0 24px 60px #000c,0 0 40px #00f0a822;padding:20px;color:#e8eefc;font:14px system-ui,sans-serif}
.sw-share-kicker{font:700 11px ui-monospace,monospace;letter-spacing:.14em;color:#00f0a8;text-transform:uppercase}
.sw-share-title{margin:8px 0 4px;font-size:20px;font-weight:800}
.sw-share-sub{color:#9fb0d0;margin:0 0 14px;line-height:1.45}
.sw-share-stats{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}
.sw-share-stats span{background:#ffffff10;border:1px solid #ffffff18;border-radius:10px;padding:8px 12px;font:700 13px ui-monospace,monospace}
.sw-share-preview{border-radius:12px;border:1px solid #00f0a833;background:#041018;padding:14px;margin-bottom:14px;
  font:600 13px ui-monospace,monospace;line-height:1.5;color:#7dffa8}
.sw-share-act{display:flex;flex-wrap:wrap;gap:8px}
.sw-share-act button,.sw-share-act a{
  flex:1;min-width:120px;text-align:center;border:0;border-radius:10px;padding:11px 12px;
  font:700 13px system-ui,sans-serif;cursor:pointer;text-decoration:none;color:#041018;background:#00f0a8
}
.sw-share-act .ghost{background:transparent;color:#e8eefc;border:1px solid #ffffff33}
.sw-share-act .sw-share-close-btn,.sw-share-act button#sw-share-close{background:#e53935;color:#fff;border:1px solid #c62828;font-weight:700}
.sw-share-act .sw-share-close-btn:hover,button#sw-share-close:hover{background:#c62828;filter:brightness(1.05)}
.sw-share-x{position:absolute;top:10px;right:12px;border:0;background:transparent;color:#9fb0d0;font-size:22px;cursor:pointer}
.sw-share-wrap{position:relative}
`;
    document.head.appendChild(s);
  }

  function close() {
    const el = document.getElementById('sw-share-ov');
    if (el) el.remove();
  }

  /**
   * @param {{ gameId: string, score?: number, timeSec?: number, title?: string }} opts
   */
  window.swShareWin = function (opts) {
    opts = opts || {};
    ensureCss();
    close();
    const name = opts.title || NAMES[opts.gameId] || opts.gameId || 'a mission';
    const t = timeLabel(opts.timeSec);
    const score = opts.score != null ? opts.score : null;
    let line = 'I cracked ' + name;
    if (t) line += ' in ' + t;
    line += ' on ShellWise';
    if (score != null) line += ' · score ' + score;

    const origin = location.origin || 'https://shellwise.app';
    const link = origin + '/lab/?share=' + encodeURIComponent(opts.gameId || 'game');
    const tweet = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(line + '\n' + link);
    const wa = 'https://wa.me/?text=' + encodeURIComponent(line + '\n' + link);

    const ov = document.createElement('div');
    ov.id = 'sw-share-ov';
    ov.className = 'sw-share-ov';
    ov.innerHTML =
      '<div class="sw-share-wrap sw-share-card" role="dialog" aria-label="Share your win">' +
        '<button type="button" class="sw-share-x" id="sw-share-x" aria-label="Close">×</button>' +
        '<div class="sw-share-kicker">Victory</div>' +
        '<div class="sw-share-title">You cleared it</div>' +
        '<p class="sw-share-sub">' + esc(name) + (t ? ' · ' + esc(t) : '') + '</p>' +
        '<div class="sw-share-stats">' +
          (t ? '<span>⏱ ' + esc(t) + '</span>' : '') +
          (score != null ? '<span>★ ' + esc(score) + '</span>' : '') +
          '<span>ShellWise</span>' +
        '</div>' +
        '<div class="sw-share-preview" id="sw-share-text">' + esc(line) + '</div>' +
        '<div class="sw-share-act">' +
          '<button type="button" id="sw-share-copy">Copy text</button>' +
          '<a href="' + esc(tweet) + '" target="_blank" rel="noopener">Post on X</a>' +
          '<a class="ghost" href="' + esc(wa) + '" target="_blank" rel="noopener">WhatsApp</a>' +
          '<button type="button" class="sw-share-close-btn" id="sw-share-close">Close</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      if (e.target === ov) close();
    });
    document.getElementById('sw-share-x').onclick = close;
    document.getElementById('sw-share-close').onclick = close;
    document.getElementById('sw-share-copy').onclick = function () {
      const txt = line + '\n' + link;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(function () {
          if (typeof toast === 'function') toast('Copied — paste anywhere');
          else document.getElementById('sw-share-copy').textContent = 'Copied!';
        });
      }
    };
  };

  // Hook GH.finish when available
  function hookFinish() {
    if (!window.GH || typeof GH.finish !== 'function' || GH.finish.__swShare) return;
    const prev = GH.finish;
    GH.finish = function (id, ok, score, xp) {
      const r = prev.apply(this, arguments);
      if (ok) {
        try {
          window.swShareWin({ gameId: id, score: score });
          // cosmetics on clear
          if (typeof window.swUnlockCosmetic === 'function') window.swUnlockCosmetic(id);
        } catch (e) {}
      }
      return r;
    };
    GH.finish.__swShare = true;
  }

  // Also expose for RESCUE / custom
  window.swShareHook = hookFinish;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(hookFinish, 400);
      setTimeout(hookFinish, 1500);
    });
  } else {
    setTimeout(hookFinish, 400);
    setTimeout(hookFinish, 1500);
  }
})();
