// gamezone.js — ShellWise Game Zone (load LAST in index.html)
// Secret Hunter = free. Other zone games = Learner/Pro.
(function () {
  'use strict';

  function api() {
    return typeof R !== 'undefined' ? R : null;
  }

  const GAMES = [
    {
      id: 'secrethunter', n: '1/5', title: 'Secret Hunter',
      tag: 'Find what others can\'t see.',
      body: 'Explore a virtual Linux machine, find hidden files, discover clues and unlock the secret flag. Use ls, cd, find, cat and more.',
      tags: ['Exploration', 'Files', 'Beginner'], xp: 120, tone: 'green', art: 'hunter', minPlan: 'free'
    },
    {
      id: 'cyberattack', n: '2/5', title: 'Cyber Attack',
      tag: 'Investigate. Stop the threat.',
      body: 'Your server is under attack. Find suspicious processes, check logs, and stop the intruder. Use ps, grep, tail and find.',
      tags: ['Security', 'Logs', 'Intermediate'], xp: 200, tone: 'red', art: 'attack', minPlan: 'learner'
    },
    {
      id: 'speedrun', n: '3/5', title: 'Linux Speed Run',
      tag: 'Think fast. Type faster.',
      body: 'Complete Linux tasks as fast as you can. Navigate, find files, read clues. Beat the clock.',
      tags: ['Speed', 'Commands', 'Competitive'], xp: 150, tone: 'blue', art: 'speed', minPlan: 'learner'
    },
    {
      id: 'vault', n: '4/5', title: 'Terminal Vault',
      tag: 'Unlock the hidden treasures.',
      body: 'Solve puzzles and unlock the digital vault with ls -la, cat, grep and more.',
      tags: ['Puzzles', 'Logic', 'Intermediate'], xp: 180, tone: 'purple', art: 'vault', minPlan: 'learner'
    },
    {
      id: 'detective', n: '5/5', title: 'Terminal Detective',
      tag: 'Find the truth. Solve the case.',
      body: 'Investigate a mysterious incident using logs, timestamps and grep.',
      tags: ['Mystery', 'Investigation', 'Advanced'], xp: 250, tone: 'gold', art: 'detective', minPlan: 'learner'
    },
    {
      id: 'rescue1', n: 'OP', title: 'RESCUE',
      tag: 'Every command is a clue.',
      body: 'Operation Digital Trace — 3-mission series. Terminal + live map + timer.',
      tags: ['Map', 'Timer', 'Series'], xp: 300, tone: 'green', art: 'detective', minPlan: 'free'
    }
  ];

  const RANK = { free: 0, learner: 1, pro: 2, team: 2 };

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

  function canPlay(g) {
    return (RANK[plan()] || 0) >= (RANK[g.minPlan] || 0);
  }

  const IMG_MAP = {
    secrethunter: 'img/gz/secrethunter.jpg',
    cyberattack: 'img/gz/cyberattack.png',
    speedrun: 'img/gz/speedrun.jpg',
    vault: 'img/gz/vault.jpg',
    detective: 'img/gz/detective.jpg',
    rescue1: 'img/gz/rescue.jpg'
  };

  function art(g) {

    const src = g.img || IMG_MAP[g.id] || ('img/gz/' + g.id + '.svg');
    return (
      '<div class="gz-art gz-art-img" aria-hidden="true">' +
        '<img src="' + src + '" alt="" loading="lazy" onerror="this.style.display=\'none\';this.parentNode.classList.add(\'gz-art-fallback\')">' +
      '</div>'
    );
  }

  function card(g) {
    const open = canPlay(g);
    const tags = g.tags.map(function (t) { return '<span class="gz-tag">' + t + '</span>'; }).join('');
    const btn = open
      ? '<button type="button" class="gz-play" data-gz="' + g.id + '">▶ Play Now</button>'
      : '<button type="button" class="gz-play gz-locked" data-gz-lock="' + g.id + '">🔒 Unlock with Learner</button>';
    const pill = open
      ? (g.minPlan === 'free' ? '<span class="gz-plan-pill free">Free</span>' : '')
      : '<span class="gz-plan-pill lock">Learner+</span>';
    return (
      '<article class="gz-card gz-' + g.tone + (open ? '' : ' is-locked') + '">' +
        '<div class="gz-badge">' + g.n + '</div>' + pill + art(g) +
        '<div class="gz-body">' +
          '<h3><span class="gz-ic" aria-hidden="true"></span>' + g.title + '</h3>' +
          '<p class="gz-tagline">' + g.tag + '</p>' +
          '<p class="gz-desc">' + g.body + '</p>' +
          '<div class="gz-tags">' + tags + '</div>' +
          '<div class="gz-ft"><span class="gz-xp">★ ' + g.xp + ' XP</span>' + btn + '</div>' +
        '</div></article>'
    );
  }


  const ZONE_IDS = ['secrethunter', 'cyberattack', 'speedrun', 'vault', 'detective', 'rescue1', 'rescue2', 'rescue3'];

  function loadUser() {
    try {
      const o = JSON.parse(localStorage.getItem('kuser') || 'null');
      return o && !o.guest ? o : null;
    } catch (e) { return null; }
  }

  function zoneProgress() {
    const hs = (window.S && S.hs) || {};
    let n = 0;
    ['secrethunter', 'cyberattack', 'speedrun', 'vault', 'detective'].forEach(function (id) {
      if (hs[id] !== undefined) n++;
    });
    try {
      const r = JSON.parse(localStorage.getItem('krescue') || '{}');
      ['rescue1', 'rescue2', 'rescue3'].forEach(function (id) {
        if (r[id] && r[id].cleared) n++;
      });
    } catch (e) {}
    return { done: n, total: 8 };
  }

  function achievementsHtml() {
    const hs = (window.S && S.hs) || {};
    let rescue = {};
    try { rescue = JSON.parse(localStorage.getItem('krescue') || '{}'); } catch (e) {}
    const items = [
      { ok: hs.secrethunter !== undefined, ic: '🔍', t: 'Shadow Seeker' },
      { ok: hs.cyberattack !== undefined, ic: '🛡️', t: 'Incident Responder' },
      { ok: hs.speedrun !== undefined, ic: '⚡', t: 'Speed Demon' },
      { ok: hs.vault !== undefined, ic: '🔐', t: 'Vault Breaker' },
      { ok: hs.detective !== undefined, ic: '🕵️', t: 'Log Sleuth' },
      { ok: rescue.rescue1 && rescue.rescue1.cleared, ic: '📡', t: 'First Trace' },
      { ok: rescue.rescue2 && rescue.rescue2.cleared, ic: '👻', t: 'Ghost Protocol' },
      { ok: rescue.rescue3 && rescue.rescue3.cleared, ic: '📻', t: 'Last Signal' }
    ];
    const all = items.every(function (x) { return x.ok; });
    return (
      '<div class="gz-ach gz-ach-compact">' +
        '<h4>Achievements</h4>' +
        '<div class="gz-ach-grid">' +
          items.map(function (a) {
            return '<div class="gz-ach-item' + (a.ok ? ' on' : '') + '"><span class="gz-ach-ic">' + a.ic + '</span><span class="gz-ach-t">' + a.t + '</span>' + (a.ok ? '<span class="gz-ach-ok">✓</span>' : '') + '</div>';
          }).join('') +
          '<div class="gz-ach-item' + (all ? ' on' : '') + '"><span class="gz-ach-ic">🏆</span><span class="gz-ach-t">Zone Master</span>' + (all ? '<span class="gz-ach-ok">✓</span>' : '<span class="gz-ach-lock">🔒</span>') + '</div>' +
        '</div>' +
      '</div>'
    );
  }


  let boardCache = null;
  let boardOpen = false;

  function requestBoard() {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ shellwise: 'gamezoneboard', data: { game_id: null } }, location.origin);
        window.parent.postMessage({ shellwise: 'gamezoneboardweek', data: { game_id: null } }, location.origin);
      }
    } catch (e) {}
  }

  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin) return;
    if (!e.data) return;
    if (e.data.shellwiseReply === 'gamezoneboardweek') {
      window.__gzWeekBoard = Array.isArray(e.data.data) ? e.data.data : [];
      const w = document.getElementById('gz-week-body');
      if (w) w.innerHTML = weekBoardHtml();
      return;
    }
    if (e.data.shellwiseReply !== 'gamezoneboard') return;
    boardCache = Array.isArray(e.data.data) ? e.data.data : [];
    const panel = document.getElementById('gz-drop');
    if (panel && boardOpen) {
      const lb = document.getElementById('gz-lb-body');
      if (lb) lb.innerHTML = boardListHtml();
    }
  });


  function weekBoardHtml() {
    const rows = (window.__gzWeekBoard || []).slice(0, 10);
    if (!window.__gzWeekBoard) return '<p class="dim">Loading this week…</p>';
    if (!rows.length) return '<p class="dim">No clears this week yet — be the first.</p>';
    return (
      '<ol class="gz-lb-list">' +
        rows.map(function (r, i) {
          const name = String(r.username || 'player').replace(/[<>]/g, '');
          const badge = i === 0 || r.is_first ? ' <span class="gz-week-badge" title="Weekly #1">👑</span>' : '';
          return (
            '<li><span class="gz-lb-rank">' + (i + 1) + '</span>' +
            '<span class="gz-lb-user">@' + name + badge + '</span>' +
            '<span class="gz-lb-score">' + (r.best_score || 0) + '</span></li>'
          );
        }).join('') +
      '</ol>'
    );
  }

  function boardListHtml() {
    const rows = (boardCache || []).slice(0, 10);
    if (!boardCache) return '<p class="dim">Loading leaderboard…</p>';
    if (!rows.length) return '<p class="dim">No scores yet — finish a mission while signed in.</p>';
    const labels = {
      secrethunter: 'Hunter', cyberattack: 'Attack', speedrun: 'Speed',
      vault: 'Vault', detective: 'Detective', rescue1: 'RESCUE 01',
      rescue2: 'RESCUE 02', rescue3: 'RESCUE 03'
    };
    return (
      '<ol class="gz-lb-list">' +
        rows.map(function (r, i) {
          const name = String(r.username || 'player').replace(/[<>]/g, '');
          return (
            '<li><span class="gz-lb-rank">' + (i + 1) + '</span>' +
            '<span class="gz-lb-user">@' + name + '</span>' +
            '<span class="gz-lb-game">' + (labels[r.game_id] || r.game_id || '') + '</span>' +
            '<span class="gz-lb-score">' + (r.best_score || 0) + '</span></li>'
          );
        }).join('') +
      '</ol>'
    );
  }


  function inviteHtml() {
    const u = loadUser();
    let code = '';
    try {
      if (u && (u.ref || u.referral || u.invite)) code = u.ref || u.referral || u.invite;
      else if (u && u.user) code = String(u.user).toUpperCase().slice(0, 12);
    } catch (e) {}
    if (!code) {
      return '<p class="dim">Sign in to get your invite link.</p>';
    }
    const link = (location.origin || '') + '/signup?ref=' + encodeURIComponent(code);
    return (
      '<p class="gz-invite-code"><code id="gz-inv-code">' + String(code).replace(/[<>]/g, '') + '</code></p>' +
      '<p class="dim" style="font-size:11px;word-break:break-all">' + link.replace(/[<>]/g, '') + '</p>' +
      '<button type="button" class="btn ghost gz-inv-copy" data-gz-copy="' + link.replace(/"/g, '') + '">Copy invite link</button>'
    );
  }

  function profileMenuHtml() {
    const u = loadUser();
    const prog = zoneProgress();
    const pct = Math.round((prog.done / prog.total) * 100);
    const name = u ? (u.user || u.username || 'player') : 'Guest';
    const av = u && u.avatar
      ? '<img class="gz-av-img" src="' + String(u.avatar).replace(/"/g, '') + '" alt="">'
      : '<span class="gz-av-fallback">' + String(name).slice(0, 1).toUpperCase() + '</span>';
    return (
      '<div class="gz-profile-wrap">' +
        '<button type="button" class="gz-profile-btn" id="gz-profile-btn" aria-expanded="false" aria-haspopup="true">' +
          '<span class="gz-av">' + av + '</span>' +
          '<span class="gz-profile-name">@' + String(name).replace(/[<>]/g, '') + '</span>' +
          '<span class="gz-caret" aria-hidden="true">▾</span>' +
        '</button>' +
        '<div class="gz-drop" id="gz-drop" hidden>' +
          '<div class="gz-drop-sec">' +
            '<h4>Game Zone progress</h4>' +
            '<div class="gz-prog-bar"><i style="width:' + pct + '%"></i></div>' +
            '<p class="dim">' + prog.done + ' / ' + prog.total + ' missions cleared · ' + pct + '%</p>' +
          '</div>' +
          '<div class="gz-drop-sec">' +
            '<h4>This week (Top 10)</h4>' +
            '<div id="gz-week-body">' + weekBoardHtml() + '</div>' +
          '</div>' +
          '<div class="gz-drop-sec">' +
            '<h4>All-time</h4>' +
            '<div id="gz-lb-body">' + boardListHtml() + '</div>' +
          '</div>' +
          '<div class="gz-drop-sec">' + achievementsHtml() + '</div>' +
          '<div class="gz-drop-sec">' +
            '<h4>Invite</h4>' +
            inviteHtml() +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function hubHtml() {
    const p = plan();
    const label = p === 'pro' || p === 'team' ? 'Pro' : p === 'learner' ? 'Learner' : 'Free';
    requestBoard();
    return (
      '<div class="gz">' +
        '<header class="gz-hero">' +
          '<div class="gz-hero-left">' +
            '<div class="gz-logo" aria-hidden="true">🎮</div>' +
            '<div>' +
              '<div class="gz-kicker">PRO GAME ZONE</div>' +
              '<h2>ShellWise <span>Game Zone</span></h2>' +
              '<p class="gz-sub">Play. Solve. Learn. Master Linux. · Plan: <b>' + label + '</b></p>' +
            '</div>' +
          '</div>' +
          profileMenuHtml() +
        '</header>' +
        '<div class="gz-stats">' +
          '<div><b>Games</b><span>Explore & play</span></div>' +
          '<div><b>Earn XP</b><span>Level up</span></div>' +
          '<div><b>RESCUE</b><span>Map missions</span></div>' +
          '<div><b>Compete</b><span>Leaderboard</span></div>' +
        '</div>' +
        '<div class="gz-grid">' + GAMES.map(card).join('') + '</div>' +
        '<p class="gz-foot">🏆 Clear missions to grow your skills</p>' +
        '<p class="gz-note dim">Secret Hunter &amp; RESCUE are free. Other cards need Learner or Pro.</p>' +
      '</div>'
    );
  }

  function ensure() {
    const A = api();
    if (!A) return false;
    A.gamezone = hubHtml;
    return true;
  }

  function wrapGo() {
    const prev = window.go;
    if (typeof prev !== 'function') return;
    window.go = function (v) {
      if (v === 'gamezone') {
        ensure();
        const A = api();
        try {
          document.querySelectorAll('#side button[data-v]').forEach(function (b) {
            b.classList.toggle('on', b.dataset.v === v);
          });
        } catch (e) {}
        const term = document.getElementById('term');
        const pv = document.getElementById('pv');
        if (term) term.style.display = 'none';
        if (pv) {
          pv.style.display = 'block';
          pv.innerHTML = A && typeof A.gamezone === 'function'
            ? A.gamezone()
            : '<p style="padding:24px;color:#ff7d97">Game Zone failed to register.</p>';
          pv.scrollTop = 0;
        }
        return;
      }
      if (v === 'rescue') {
        try {
          document.querySelectorAll('#side button[data-v]').forEach(function (b) {
            b.classList.toggle('on', b.dataset.v === v);
          });
        } catch (e) {}
        const term = document.getElementById('term');
        const pv = document.getElementById('pv');
        if (term) term.style.display = 'none';
        if (pv) {
          pv.style.display = 'block';
          const A = api();
          if (A && typeof A.rescue === 'function') {
            pv.innerHTML = A.rescue();
          } else {
            pv.innerHTML = '<p style="padding:24px;color:#ff7d97">RESCUE not loaded. Add rescue.js before gamezone.js or after it, still near the end of body.</p>';
          }
          pv.scrollTop = 0;
        }
        return;
      }
      return prev.apply(this, arguments);
    };
  }

  window.gzPlay = function (id) {
    const g = GAMES.find(function (x) { return x.id === id; });
    if (g && !canPlay(g)) {
      if (typeof upsell === 'function') upsell('games');
      else if (window.parent !== window) {
        try { window.parent.postMessage({ shellwise: 'plans' }, location.origin); } catch (e) {}
      } else location.href = '/#plans';
      return;
    }
    const startIt = function () {
      if (id === 'rescue1') {
        if (typeof go === 'function') go('rescue');
        return;
      }
      const map = {
        secrethunter: 'secrethunter',
        cyberattack: 'cyberattack',
        speedrun: 'speedrun',
        vault: 'vault',
        detective: 'detective'
      };
      const fn = (g && g.fn) || map[id] || id;
      if (typeof C === 'undefined' || typeof C[fn] !== 'function') {
        if (typeof toast === 'function') toast('Game script missing: ' + fn + '.js');
        return;
      }
      if (typeof go === 'function') go('term');
      setTimeout(function () {
        try { C[fn](); } catch (err) { console.error(err); }
      }, 50);
    };
    if (typeof window.swEnsureGameFree === 'function') {
      window.swEnsureGameFree((g && g.title) || id, startIt);
    } else {
      startIt();
    }
  };

  document.addEventListener('click', function (e) {
    const pbtn = e.target.closest && e.target.closest('#gz-profile-btn');
    if (pbtn) {
      e.preventDefault();
      e.stopPropagation();
      const drop = document.getElementById('gz-drop');
      if (!drop) return;
      boardOpen = drop.hasAttribute('hidden');
      if (boardOpen) {
        drop.removeAttribute('hidden');
        pbtn.setAttribute('aria-expanded', 'true');
        requestBoard();
      } else {
        drop.setAttribute('hidden', '');
        pbtn.setAttribute('aria-expanded', 'false');
        boardOpen = false;
      }
      return;
    }
    if (!e.target.closest || !e.target.closest('.gz-profile-wrap')) {
      const drop = document.getElementById('gz-drop');
      const pbtn = document.getElementById('gz-profile-btn');
      if (drop && !drop.hasAttribute('hidden')) {
        drop.setAttribute('hidden', '');
        boardOpen = false;
        if (pbtn) pbtn.setAttribute('aria-expanded', 'false');
      }
    }
    const lock = e.target.closest && e.target.closest('[data-gz-lock]');
    if (lock) {
      e.preventDefault();
      if (typeof upsell === 'function') upsell('games');
      else if (window.parent !== window) {
        try { window.parent.postMessage({ shellwise: 'plans' }, location.origin); } catch (err) {}
      } else location.href = '/#plans';
      return;
    }
    const b = e.target.closest && e.target.closest('[data-gz]');
    if (!b) return;
    e.preventDefault();
    window.gzPlay(b.getAttribute('data-gz'));
  });

  ensure();
  wrapGo();
  setTimeout(function () { ensure(); wrapGo(); }, 0);
  setTimeout(function () { ensure(); wrapGo(); }, 200);
  console.log('[gamezone] full hub ready');
})();
