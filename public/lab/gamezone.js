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


  function inviteCode() {
    const u = loadUser();
    try {
      if (u && (u.ref || u.referral || u.invite)) return String(u.ref || u.referral || u.invite);
      if (u && u.user) return String(u.user).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    } catch (e) {}
    return '';
  }

  function inviteLinkFor(gameId) {
    const code = inviteCode();
    const origin = location.origin || '';
    // Friend signs up with ref, then can open lab / Pro Game Zone for the same challenge
    let url = origin + '/auth?mode=signup';
    if (code) url += '&ref=' + encodeURIComponent(code);
    if (gameId) url += '&game=' + encodeURIComponent(gameId);
    return url;
  }

  function inviteLine(gameId, title) {
    const name = title || 'this ShellWise challenge';
    const code = inviteCode();
    return 'Challenge me on ShellWise — ' + name + '!' +
      (code ? ' Use my invite code ' + code + '.' : '') +
      ' ' + inviteLinkFor(gameId);
  }

  function closeInviteModal() {
    const ov = document.getElementById('gz-invite-ov');
    if (ov) ov.remove();
  }

  function openInviteModal(gameId) {
    closeInviteModal();
    const g = GAMES.find(function (x) { return x.id === gameId; }) || { title: 'Game Zone', tag: 'Linux challenge', id: gameId || 'game' };
    const code = inviteCode();
    const link = inviteLinkFor(g.id);
    const line = inviteLine(g.id, g.title);
    const tone = g.tone || 'green';

    if (!code) {
      if (typeof toast === 'function') toast('Sign in to get your invite link');
      else alert('Sign in to get your invite link');
      return;
    }

    const ov = document.createElement('div');
    ov.id = 'gz-invite-ov';
    ov.className = 'gz-invite-ov';
    ov.innerHTML =
      '<div class="gz-invite-card gz-inv-' + tone + '" role="dialog" aria-labelledby="gz-inv-title">' +
        '<button type="button" class="gz-invite-x" id="gz-inv-x" aria-label="Close">×</button>' +
        '<div class="gz-invite-kicker">Invite a Friend</div>' +
        '<h3 id="gz-inv-title">' + String(g.title).replace(/[<>]/g, '') + ' · Challenge</h3>' +
        '<p class="gz-invite-blurb">Challenge a friend to the same Linux mission. They sign up with your link, play, and you both earn progress — they get <b>15% off</b> their first paid plan.</p>' +
        '<div class="gz-invite-players"><span class="gz-inv-dot"></span> 1 Player · Social challenge</div>' +
        '<label class="gz-invite-label">Invitation link</label>' +
        '<div class="gz-invite-box">' +
          '<code id="gz-inv-link-text">' + link.replace(/[<>]/g, '') + '</code>' +
        '</div>' +
        '<p class="gz-invite-code-row">Your code: <b id="gz-inv-code-show">' + String(code).replace(/[<>]/g, '') + '</b></p>' +
        '<div class="gz-invite-actions">' +
          '<button type="button" class="gz-inv-btn primary" data-gz-copy-inv="' + link.replace(/"/g, '&quot;') + '"><svg class="gz-inv-ic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg> Copy invite link</button>' +
          '<a class="gz-inv-btn wa" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(line) + '"><svg class="gz-inv-ic" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.82c0 1.96.52 3.8 1.44 5.4L2 22l4.96-1.55a9.9 9.9 0 0 0 5.08 1.37h.01c5.46 0 9.89-4.4 9.89-9.82C21.94 6.4 17.5 2 12.04 2zm5.75 13.95c-.24.68-1.4 1.24-1.93 1.32-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.26-4.79-4.2-4.93-4.4-.14-.2-1.16-1.54-1.16-2.94 0-1.4.73-2.08.99-2.36.26-.28.57-.35.76-.35h.55c.18 0 .41-.06.64.49.24.56.8 1.95.87 2.09.07.14.12.3.02.49-.1.2-.14.32-.28.49-.14.17-.3.38-.42.51-.14.14-.28.29-.12.56.16.28.71 1.17 1.53 1.9 1.05.93 1.94 1.22 2.21 1.36.28.14.44.12.6-.07.17-.2.7-.81.89-1.09.18-.28.37-.23.62-.14.26.1 1.63.77 1.91.91.28.14.47.21.54.32.07.12.07.68-.17 1.36z"/></svg> WhatsApp</a>' +
          '<button type="button" class="gz-inv-btn ghost" id="gz-inv-share" data-share-text="' + line.replace(/"/g, '&quot;') + '"><svg class="gz-inv-ic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/></svg> Share…</button>' +
          '<a class="gz-inv-btn ghost" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=' + encodeURIComponent(line) + '"><svg class="gz-inv-ic" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.725-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> Post on X</a>' +
        '</div>' +
        '<p class="gz-invite-note">Friends open the link, create an account, then play the same challenge in Pro Game Zone.</p>' +
      '</div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      if (e.target === ov) closeInviteModal();
    });
    document.getElementById('gz-inv-x').onclick = closeInviteModal;

    const shareBtn = document.getElementById('gz-inv-share');
    if (shareBtn) {
      shareBtn.onclick = function () {
        const text = shareBtn.getAttribute('data-share-text') || line;
        if (navigator.share) {
          navigator.share({ title: 'ShellWise · ' + g.title, text: text, url: link }).catch(function () {});
        } else {
          // fallback: copy
          const btn = ov.querySelector('[data-gz-copy-inv]');
          if (btn) btn.click();
        }
      };
    }
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
          '<button type="button" class="gz-invite-play" data-gz-invite="' + g.id + '">👥 Invite to Play</button>' +
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
    let rows = (boardCache || []).slice(0, 10);
    if (!boardCache) {
      // fallback: local high scores until parent replies
      try {
        const hs = (window.S && S.hs) || {};
        const u = loadUser();
        const name = u ? (u.user || u.username || 'you') : 'you';
        rows = Object.keys(hs).filter(function (k) {
          return ['secrethunter','cyberattack','speedrun','vault','detective'].indexOf(k) >= 0;
        }).map(function (k) {
          return { username: name, game_id: k, best_score: hs[k], clears: 1 };
        }).sort(function (a, b) { return (b.best_score || 0) - (a.best_score || 0); }).slice(0, 10);
        if (!rows.length) return '<p class="dim">Loading leaderboard…</p>';
      } catch (e) {
        return '<p class="dim">Loading leaderboard…</p>';
      }
    }
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
    if (prev.__gzWrapped) return;
    window.go = function (v) {
      if (v === 'gamezone') {
        if (typeof openGameZone === 'function') {
          openGameZone();
          return;
        }
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
            : '<p style="padding:24px;color:#ff7d97">Game Zone loading…</p>';
          pv.scrollTop = 0;
        }
        return;
      }
      if (v === 'rescue') {
        try {
          document.querySelectorAll('#side button[data-v]').forEach(function (b) {
            b.classList.toggle('on', false);
          });
        } catch (e) {}
        if (typeof window.startRescue === 'function') {
          window.startRescue();
          return;
        }
      }
      return prev.apply(this, arguments);
    };
    window.go.__gzWrapped = true;
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

    const invPlay = e.target.closest && e.target.closest('[data-gz-invite]');
    if (invPlay) {
      e.preventDefault();
      e.stopPropagation();
      openInviteModal(invPlay.getAttribute('data-gz-invite'));
      return;
    }
    // Copy from invite modal
    const invModalCopy = e.target.closest && e.target.closest('[data-gz-copy-inv]');
    if (invModalCopy) {
      e.preventDefault();
      e.stopPropagation();
      const text = invModalCopy.getAttribute('data-gz-copy-inv') || '';
      const done = function () {
        if (!invModalCopy.getAttribute('data-label-html')) {
          invModalCopy.setAttribute('data-label-html', invModalCopy.innerHTML);
        }
        invModalCopy.innerHTML = '<span class="gz-inv-ic" aria-hidden="true">✓</span> Copied!';
        invModalCopy.classList.add('gz-inv-copied');
        setTimeout(function () {
          invModalCopy.innerHTML = invModalCopy.getAttribute('data-label-html') || 'Copy invite link';
          invModalCopy.classList.remove('gz-inv-copied');
        }, 2000);
        if (typeof toast === 'function') toast('Invite link copied');
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () {
          try {
            const ta = document.createElement('textarea');
            ta.value = text; document.body.appendChild(ta); ta.select();
            document.execCommand('copy'); document.body.removeChild(ta); done();
          } catch (err) {}
        });
      } else {
        try {
          const ta = document.createElement('textarea');
          ta.value = text; document.body.appendChild(ta); ta.select();
          document.execCommand('copy'); document.body.removeChild(ta); done();
        } catch (err) {}
      }
      return;
    }

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
        // Refresh progress + achievements live from current S.hs
        try {
          const prog = zoneProgress();
          const pct = Math.round((prog.done / prog.total) * 100);
          const bar = drop.querySelector('.gz-prog-bar i');
          if (bar) bar.style.width = pct + '%';
          const progP = drop.querySelector('.gz-drop-sec p.dim');
          if (progP && progP.textContent.indexOf('missions') >= 0) {
            progP.textContent = prog.done + ' / ' + prog.total + ' missions cleared · ' + pct + '%';
          }
          const ach = drop.querySelector('.gz-ach-compact') || drop.querySelector('.gz-drop-sec:nth-child(3)');
          // rebuild achievements block if present
          const secs = drop.querySelectorAll('.gz-drop-sec');
          if (secs.length >= 3) {
            // achievements is usually last or second-to-last before invite
          }
        } catch (err) {}
        const lb = document.getElementById('gz-lb-body');
        if (lb) lb.innerHTML = boardListHtml();
        const w = document.getElementById('gz-week-body');
        if (w) w.innerHTML = weekBoardHtml();
      } else {
        drop.setAttribute('hidden', '');
        pbtn.setAttribute('aria-expanded', 'false');
        boardOpen = false;
      }
      return;
    }
    // Copy invite link
    const inv = e.target.closest && e.target.closest('[data-gz-copy]');
    if (inv) {
      e.preventDefault();
      e.stopPropagation();
      const text = inv.getAttribute('data-gz-copy') || '';
      const done = function () {
        const prev = inv.getAttribute('data-label') || inv.textContent;
        if (!inv.getAttribute('data-label')) inv.setAttribute('data-label', prev);
        inv.textContent = 'Copied!';
        inv.classList.add('gz-inv-copied');
        inv.disabled = true;
        setTimeout(function () {
          inv.textContent = inv.getAttribute('data-label') || 'Copy invite link';
          inv.classList.remove('gz-inv-copied');
          inv.disabled = false;
        }, 2000);
        if (typeof toast === 'function') toast('Invite link copied');
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () {
          try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            done();
          } catch (err) {
            if (typeof toast === 'function') toast('Could not copy — select the link manually');
          }
        });
      } else {
        try {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          done();
        } catch (err) {
          if (typeof toast === 'function') toast('Could not copy — select the link manually');
        }
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
  
  // Reliable open for Pro Game Zone (mobile + desktop first tap)
  function openGameZone(e) {
    if (e) {
      try { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); } catch (err) {}
    }
    ensure();
    var A = api();
    try {
      document.querySelectorAll('#side button[data-v]').forEach(function (b) {
        b.classList.toggle('on', b.dataset.v === 'gamezone');
      });
    } catch (err) {}
    var term = document.getElementById('term');
    var pv = document.getElementById('pv');
    if (term) term.style.display = 'none';
    if (pv) {
      pv.style.display = 'block';
      pv.innerHTML = A && typeof A.gamezone === 'function'
        ? A.gamezone()
        : '<p style="padding:24px;color:#ff7d97">Game Zone loading… try again.</p>';
      pv.scrollTop = 0;
    }
    // if register was late, retry once
    if (!A || typeof A.gamezone !== 'function') {
      setTimeout(function () {
        ensure();
        A = api();
        if (pv && A && typeof A.gamezone === 'function') {
          pv.innerHTML = A.gamezone();
        }
      }, 50);
    }
  }

  function bindGzNav() {
    document.querySelectorAll('#side button[data-v="gamezone"]').forEach(function (btn) {
      if (btn.dataset.gzBound === '2') return;
      btn.dataset.gzBound = '2';
      btn.onclick = function (e) { openGameZone(e); };
      btn.addEventListener('touchend', function (e) { openGameZone(e); }, { passive: false });
      btn.addEventListener('pointerup', function (e) {
        if (e.pointerType === 'touch' || e.pointerType === 'pen') openGameZone(e);
      }, { passive: false });
    });
  }

  // Capture phase on sidebar so first tap always wins
  function bindSideCapture() {
    var side = document.getElementById('side');
    if (!side || side.dataset.gzCap) return;
    side.dataset.gzCap = '1';
    side.addEventListener('click', function (e) {
      var b = e.target && e.target.closest && e.target.closest('button[data-v="gamezone"]');
      if (!b) return;
      openGameZone(e);
    }, true);
  }

  // Patch go early and keep re-patching
  function wrapGo() {
    var prev = window.go;
    if (typeof prev !== 'function') return;
    if (prev.__gzWrapped) return;
    window.go = function (v) {
      if (v === 'gamezone') {
        openGameZone();
        return;
      }
      return prev.apply(this, arguments);
    };
    window.go.__gzWrapped = true;
  }

  ensure();
  wrapGo();
  bindGzNav();
  bindSideCapture();
  setTimeout(function () { ensure(); wrapGo(); bindGzNav(); bindSideCapture(); }, 0);
  setTimeout(function () { ensure(); wrapGo(); bindGzNav(); }, 200);
  setTimeout(function () { ensure(); wrapGo(); bindGzNav(); }, 800);

  console.log('[gamezone] full hub ready');
})();
