// gztrack.js — send Game Zone start/complete to the parent app (Supabase)
(function () {
  'use strict';
  const ZONE = ['secrethunter', 'cyberattack', 'speedrun', 'vault', 'detective', 'hunt'];

  function report(gameId, event, score) {
    if (!ZONE.includes(gameId)) return;
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          shellwise: 'gamezone',
          data: { game_id: gameId, event: event, score: score | 0 }
        }, location.origin);
      }
    } catch (e) {}
  }

  window.gzReport = report;

  // Hook mission starts when C.* zone games run
  function wrap(name) {
    if (typeof C === 'undefined' || typeof C[name] !== 'function' || C[name].__gz) return;
    const prev = C[name];
    C[name] = function () {
      report(name, 'start', 0);
      return prev.apply(this, arguments);
    };
    C[name].__gz = true;
  }
  ['secrethunter', 'cyberattack', 'speedrun', 'vault', 'detective'].forEach(wrap);

  // Hook finish() for completes
  function hookFinish() {
    if (!window.GH || typeof GH.finish !== 'function' || GH.finish.__gz) return false;
    const prev = GH.finish;
    GH.finish = function (id, won, score, extra) {
      const out = prev.apply(this, arguments);
      if (won && ZONE.includes(id)) report(id, 'complete', typeof score === 'number' ? score : 0);
      return out;
    };
    GH.finish.__gz = true;
    return true;
  }
  if (!hookFinish()) {
    const t = setInterval(function () {
      if (hookFinish()) clearInterval(t);
    }, 200);
    setTimeout(function () { clearInterval(t); }, 10000);
  }
})();
