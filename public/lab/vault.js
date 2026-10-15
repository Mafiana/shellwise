// vault.js — Terminal Vault: 1 min, draggable timer, compact panel, scramble, sound, q quit
(function () {
  'use strict';
  if (typeof C === 'undefined') return;
  if (typeof window.startMission !== 'function') {
    console.error('[vault] startMission missing. In games.js add: window.startMission=startMission; before window.GH=');
    return;
  }
  const startMission = window.startMission;

  function installQuit() {
    if (C.q && C.q.__gz) return;
    const quitFn = function () {
      if (typeof SH !== 'undefined' && SH && typeof SH.stopMission === 'function') {
        try { SH.stopMission(); } catch (e) {}
        if (typeof P === 'function') P('<span class=dim>Mission quit. Type a game command or open Game Zone.</span>');
        clearVaultChrome();
        clearVaultTimer();
        return;
      }
      if (typeof bad === 'function') bad('nothing to quit');
    };
    quitFn.__gz = true;
    C.q = quitFn;
    C.quit = quitFn;
  }
  installQuit();

  let vaultTimer = null;
  let vaultEnds = 0;

  function clearVaultTimer() {
    if (vaultTimer) {
      clearInterval(vaultTimer);
      vaultTimer = null;
    }
  }

  function clearVaultChrome() {
    const strip = document.getElementById('vt-strip');
    if (strip) {
      strip.hidden = true;
      strip.innerHTML = '';
    }
    const chip = document.getElementById('vt-float-timer');
    if (chip) chip.remove();
  }

  function vaultSfxOpen() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const t0 = ctx.currentTime;
      const o1 = ctx.createOscillator();
      const g1 = ctx.createGain();
      o1.type = 'square';
      o1.frequency.setValueAtTime(80, t0);
      o1.frequency.exponentialRampToValueAtTime(40, t0 + 0.25);
      g1.gain.setValueAtTime(0.12, t0);
      g1.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4);
      o1.connect(g1);
      g1.connect(ctx.destination);
      o1.start(t0);
      o1.stop(t0 + 0.45);
      [262, 330, 392, 523].forEach(function (f, i) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        const t = t0 + 0.15 + i * 0.12;
        o.type = 'triangle';
        o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.08, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(t);
        o.stop(t + 0.4);
      });
    } catch (e) {}
  }

  function fmt(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }


  function makeMissionHudMobile() {
    // games.js writes mission text into #hud
    const el = document.getElementById('hud');
    if (!el) return;
    el.classList.add('vt-mission-hud');
    if (el.dataset.vtDrag === '1') return;
    el.dataset.vtDrag = '1';
    el.title = 'Drag mission card';
    let dragging = false, ox = 0, oy = 0;
    const onDown = function (ev) {
      if (window.innerWidth > 700) return; // desktop: leave layout alone
      dragging = true;
      const pt = ev.touches ? ev.touches[0] : ev;
      const r = el.getBoundingClientRect();
      ox = pt.clientX - r.left;
      oy = pt.clientY - r.top;
      el.classList.add('vt-hud-dragging');
      el.style.position = 'fixed';
      el.style.zIndex = '99998';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      ev.preventDefault();
    };
    const onMove = function (ev) {
      if (!dragging) return;
      const pt = ev.touches ? ev.touches[0] : ev;
      let x = pt.clientX - ox;
      let y = pt.clientY - oy;
      x = Math.max(4, Math.min(window.innerWidth - el.offsetWidth - 4, x));
      y = Math.max(4, Math.min(window.innerHeight - el.offsetHeight - 4, y));
      el.style.left = x + 'px';
      el.style.top = y + 'px';
    };
    const onUp = function () {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('vt-hud-dragging');
    };
    el.addEventListener('mousedown', onDown);
    el.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
  }

  function ensureFloatTimer() {
    // Primary timer is inside .vt-panel (#vt-timer). Float is a secondary chip for mobile.
    let chip = document.getElementById('vt-float-timer');
    if (chip) return chip;
    chip = document.createElement('div');
    chip.id = 'vt-float-timer';
    chip.className = 'vt-float-timer';
    chip.innerHTML = '<span id="vt-timer-float">1:20</span>';
    chip.title = 'Drag timer';
    const host = document.getElementById('win') || document.getElementById('term') || document.body;
    host.appendChild(chip);
    // Ignore saved positions that are off-screen
    try {
      const saved = sessionStorage.getItem('vt_timer_pos');
      if (saved) {
        const p = JSON.parse(saved);
        if (
          typeof p.left === 'number' &&
          typeof p.top === 'number' &&
          p.left >= 0 &&
          p.top >= 0 &&
          p.left < window.innerWidth - 40 &&
          p.top < window.innerHeight - 40
        ) {
          chip.style.left = p.left + 'px';
          chip.style.top = p.top + 'px';
          chip.style.right = 'auto';
          chip.style.bottom = 'auto';
        }
      }
    } catch (e) {}
    let dragging = false, ox = 0, oy = 0;
    const onDown = function (ev) {
      dragging = true;
      const pt = ev.touches ? ev.touches[0] : ev;
      const r = chip.getBoundingClientRect();
      ox = pt.clientX - r.left;
      oy = pt.clientY - r.top;
      chip.classList.add('dragging');
      ev.preventDefault();
    };
    const onMove = function (ev) {
      if (!dragging) return;
      const pt = ev.touches ? ev.touches[0] : ev;
      let x = pt.clientX - ox;
      let y = pt.clientY - oy;
      x = Math.max(4, Math.min(window.innerWidth - chip.offsetWidth - 4, x));
      y = Math.max(4, Math.min(window.innerHeight - chip.offsetHeight - 4, y));
      chip.style.left = x + 'px';
      chip.style.top = y + 'px';
      chip.style.right = 'auto';
      chip.style.bottom = 'auto';
    };
    const onUp = function () {
      if (!dragging) return;
      dragging = false;
      chip.classList.remove('dragging');
      try {
        sessionStorage.setItem(
          'vt_timer_pos',
          JSON.stringify({
            left: parseInt(chip.style.left, 10) || 0,
            top: parseInt(chip.style.top, 10) || 0
          })
        );
      } catch (e) {}
    };
    chip.addEventListener('mousedown', onDown);
    chip.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    return chip;
  }

  C.vault = function () {
    const goVault = function () {
    clearVaultTimer();
    clearVaultChrome();

    const home = ROOT.c.home.c.kali.c;
    const rn = function (n) { return Math.floor(Math.random() * n); };
    const r = function (a) { return a[rn(a.length)]; };
    const shuf = function (a) {
      const x = a.slice();
      for (let i = x.length - 1; i > 0; i--) {
        const j = rn(i + 1);
        const t = x[i];
        x[i] = x[j];
        x[j] = t;
      }
      return x;
    };

    const W = ['amber', 'cobalt', 'ember', 'jade', 'onyx', 'quartz', 'sable', 'violet'];
    const code = function () {
      return 'VAULT-' + r(W).toUpperCase() + '-' + (10 + rn(89));
    };

    const c1 = code(), c2 = code(), c3 = code(), c4 = code();
    function digitFrom(codeStr) {
      const m = String(codeStr).match(/(\d+)\s*$/);
      if (!m) return String(rn(10));
      return String(parseInt(m[1], 10) % 10);
    }
    const digits = [digitFrom(c1), digitFrom(c2), digitFrom(c3), digitFrom(c4)];
    const unlocked = [false, false, false, false];
    let opened = false;

    const ch1 = shuf(['chamber1', 'alpha', 'sector-a', 'wing-1'])[0];
    const ch2 = shuf(['chamber2', 'beta', 'sector-b', 'wing-2'])[0];
    const ch3 = shuf(['chamber3', 'gamma', 'sector-c', 'logs'])[0];
    const ch4 = shuf(['chamber4', 'delta', 'sector-d', 'deep'])[0];
    const hiddenName = r(['.door', '.lock', '.hidden_key', '.panel']);
    const deepA = r(['old', 'archive', 'misc', 'stash']);
    const deepB = r(['2019', '2020', 'temp', 'keep', 'bin']);

    const noiseFiles = shuf([
      ['todo.txt', 'buy milk\n'],
      ['readme.md', 'public only\n'],
      ['notes.txt', 'meeting Friday\n'],
      ['draft.txt', 'all clear\n'],
      ['.DS_Store', 'junk\n'],
      ['old.bak', 'deprecated\n'],
      ['passwords.txt', 'admin:changeme\n'],
      ['config.ini', 'debug=false\n'],
      ['access.log', 'GET / 200\n']
    ]);
    function sprinkleNoise(obj, n) {
      shuf(noiseFiles).slice(0, n).forEach(function (pair) {
        obj[pair[0]] = pair[1];
      });
      return obj;
    }

    const tree = {
      'README.txt':
        'TERMINAL VAULT — 1:20\n\n' +
        'Four codes hidden in this tree.\n' +
        'ls, ls -la, cat, grep, find\n' +
        'submit VAULT-...\n' +
        'Quit: q\n',
      junk: sprinkleNoise({}, 3),
      docs: sprinkleNoise({ 'index.txt': 'docs\n' }, 2)
    };
    tree[ch1] = sprinkleNoise({
      'plaque.txt': 'Code: ' + c1 + '\n',
      decoy: { 'empty.txt': 'nothing\n' }
    }, 2);
    tree[ch2] = sprinkleNoise({
      'hint.txt': 'Dotfiles: ls -la\n',
      visible: { 'open.txt': 'not this\n' }
    }, 2);
    tree[ch2][hiddenName] = 'Code: ' + c2 + '\n';
    const logLines = [];
    for (let i = 0; i < 40; i++) logLines.push('entry ' + i + ' ok');
    logLines[rn(40)] = 'entry X CODE ' + c3;
    tree[ch3] = sprinkleNoise({
      'README.txt': 'grep CODE in ledger.log\n',
      'ledger.log': logLines.join('\n') + '\n'
    }, 2);
    tree[ch4] = sprinkleNoise({
      'README.txt': 'find key.final\n',
      [deepA]: {
        [deepB]: {
          'key.final': 'Code: ' + c4 + '\n',
          'trap.txt': 'no\n'
        }
      }
    }, 2);
    tree['.cache'] = { 'tmp.dat': '0x\n' };
    tree['backup'] = sprinkleNoise({ 'mirror.txt': 'old\n' }, 2);

    function build(t) {
      const c = {};
      Object.keys(t).forEach(function (n) {
        c[n] = typeof t[n] === 'string' ? F(t[n]) : build(t[n]);
      });
      const d = D(c);
      d.o = 'kali';
      d.g = 'kali';
      d.ts = Date.now();
      return d;
    }
    function own(node) {
      Object.values(node.c).forEach(function (n) {
        n.o = 'kali';
        n.g = 'kali';
        n.ts = Date.now();
        if (n.c && typeof n.c === 'object') own(n);
      });
    }

    const codes = [c1, c2, c3, c4];
    const hints = [
      'ls then cat a chamber plaque.txt',
      'ls -la in a chamber, cat the dotfile',
      'grep CODE ~/vault/' + ch3 + '/ledger.log',
      'find ~/vault -name key.final'
    ];

    function vaultPanel() {
const left = vaultEnds ? vaultEnds - Date.now() : 120 * 1000;
      const warn = left < 30000 ? ' vt-timer-warn' : '';
      const stars = [0, 1, 2, 3]
        .map(function (i) {
          return unlocked[i]
            ? '<span class="vt-star on" title="Digit">' + digits[i] + '</span>'
            : '<span class="vt-star" title="Locked">⁕</span>';
        })
        .join('');
      const pin = unlocked.every(Boolean)
        ? '<div class="vt-pin">VAULT OPEN · CODE <b>' + digits.join('') + '</b></div>'
        : '<div class="vt-pin dim">Unlock all 4 stars · Quit: <code>q</code></div>';
      return (
        '<div class="vt-panel">' +
          '<div class="vt-timer-row">' +
            '<span class="vt-timer-inline' + warn + '" id="vt-timer">' + fmt(left) + '</span>' +
          '</div>' +
          '<div class="vt-door">' +
            '<div class="vt-wheel' + (opened ? ' open' : '') + '" aria-hidden="true"></div>' +
            '<div class="vt-stars">' + stars + '</div>' +
            pin +
          '</div>' +
          '<p class="vt-help dim">Explore <code>~/vault</code> · <code>submit VAULT-…</code> · quit <code>q</code></p>' +
        '</div>'
      );
    }

    function paintVaultChrome() {
      let strip = document.getElementById('vt-strip');
      if (!strip) {
        strip = document.createElement('div');
        strip.id = 'vt-strip';
        strip.className = 'vt-strip';
        const term = document.getElementById('term');
        if (term && term.parentNode) term.parentNode.insertBefore(strip, term);
        else {
          const pv = document.getElementById('pv');
          if (pv) pv.insertAdjacentElement('afterbegin', strip);
          else document.body.appendChild(strip);
        }
      }
      strip.innerHTML = vaultPanel();
      strip.hidden = false;
      ensureFloatTimer();
      const left = vaultEnds ? vaultEnds - Date.now() : 80 * 1000;
      const t = fmt(left);
      const el = document.getElementById('vt-timer');
      const el2 = document.getElementById('vt-timer-float');
      if (el) el.textContent = t;
      if (el2) el2.textContent = t;
    }

    function startVaultClock() {
vaultEnds = Date.now() + 120 * 1000;
      clearVaultTimer();
      ensureFloatTimer();
      function paintTime(left) {
        const t = fmt(left);
        const el = document.getElementById('vt-timer');
        const el2 = document.getElementById('vt-timer-float');
        const chip = document.getElementById('vt-float-timer');
        if (el) {
          el.textContent = t;
          el.classList.toggle('vt-timer-warn', left < 30000 && left > 0);
        }
        if (el2) el2.textContent = t;
        if (chip) chip.classList.toggle('vt-timer-warn', left < 30000 && left > 0);
      }
paintTime(120 * 1000);
      vaultTimer = setInterval(function () {
        const left = vaultEnds - Date.now();
        paintTime(left);
        if (left <= 0) {
          clearVaultTimer();
          if (typeof P === 'function') P('<span class=bad>⏱ Time is up — vault sealed.</span>');
          if (typeof SH !== 'undefined' && SH && SH.stopMission) SH.stopMission();
          clearVaultChrome();
        }
      }, 250);
    }

    startMission({
      id: 'vault',
      name: 'TERMINAL VAULT',
      intro: '1:20. Four codes in ~/vault. submit VAULT-… · quit with q',
      setup: function () {
        const root = build(tree);
        own(root);
        home.vault = root;
        cwd = '/home/kali/vault';
        setP();
        P('<span class=dim>Vault scrambled. Quit: q · Drag the timer anywhere.</span>');
        paintVaultChrome();
        startVaultClock();
        setTimeout(makeMissionHudMobile, 50);
        setTimeout(makeMissionHudMobile, 300);
      },
      clean: function () {
        try {
          delete home.vault;
        } catch (e) {}
        clearVaultTimer();
        clearVaultChrome();
        var h = document.getElementById('hud');
        if (h) { h.classList.remove('vt-mission-hud'); h.style.position = ''; h.style.left = ''; h.style.top = ''; h.dataset.vtDrag = ''; }
      },
      qs: codes.map(function (c, i) {
        return {
          p: 'Key ' + (i + 1) + '/4 — submit VAULT- code',
          fmt: 'VAULT-...',
          h: hints[i],
          ok: function (v) {
            const good = String(v).toUpperCase() === c.toUpperCase();
            if (good) {
              unlocked[i] = true;
              paintVaultChrome();
              if (typeof P === 'function') {
                P('<span class=ok>★ Star ' + (i + 1) + ' → <b>' + digits[i] + '</b></span>');
              }
              if (unlocked.every(Boolean) && !opened) {
                opened = true;
                vaultSfxOpen();
                paintVaultChrome();
                if (typeof P === 'function') {
                  P('<span class=hl>🔓 Vault open: ' + digits.join('') + '</span>');
                }
              }
            }
            return good;
          }
        };
      })
    });
    };
    if (typeof window.swEnsureGameFree === 'function') {
      window.swEnsureGameFree('Terminal Vault', goVault);
    } else {
      goVault();
    }
  };
})();
