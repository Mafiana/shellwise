// gamebusy.js — modal when another mission/game is already running
(function () {
  'use strict';

  function ensureCss() {
    if (document.getElementById('sw-busy-css')) return;
    const s = document.createElement('style');
    s.id = 'sw-busy-css';
    s.textContent = `
.sw-busy-ov{position:fixed;inset:0;z-index:100001;background:#000b;display:grid;place-items:center;padding:16px}
.sw-busy-box{width:min(340px,94vw);border-radius:16px;border:1px solid #ffb45466;background:#0b1220;
  box-shadow:0 20px 50px #000c;padding:20px;color:#e8eefc;font:14px system-ui,sans-serif}
.sw-busy-box h3{margin:0 0 8px;font-size:17px}
.sw-busy-box p{margin:0 0 16px;color:#9fb0d0;line-height:1.45}
.sw-busy-act{display:flex;gap:10px}
.sw-busy-act button{flex:1;border:0;border-radius:10px;padding:11px;font:700 13px system-ui,sans-serif;cursor:pointer}
.sw-busy-yes{background:#ff4d6d;color:#fff}
.sw-busy-no{background:#ffffff14;color:#e8eefc;border:1px solid #ffffff22}
`;
    document.head.appendChild(s);
  }

  function runningName() {
    try {
      if (typeof MS !== 'undefined' && MS && MS.name) return String(MS.name);
    } catch (e) {}
    try {
      if (typeof G !== 'undefined' && G) {
        if (G.name) return String(G.name);
        if (G.id) return String(G.id);
        return 'Active game';
      }
    } catch (e) {}
    // RESCUE local
    try {
      if (window.__rescueBusy) return window.__rescueBusy;
    } catch (e) {}
    return 'current game';
  }

  function isBusy() {
    try {
      if (typeof MS !== 'undefined' && MS) return true;
    } catch (e) {}
    try {
      if (typeof G !== 'undefined' && G) return true;
    } catch (e) {}
    try {
      if (window.__rescueBusy) return true;
    } catch (e) {}
    return false;
  }

  function stopRunning() {
    try {
      if (typeof SH !== 'undefined' && SH && typeof SH.stopMission === 'function') SH.stopMission();
    } catch (e) {}
    try {
      // shell game stop patterns
      if (typeof stopAll === 'function') stopAll();
      else if (typeof SH !== 'undefined' && SH && typeof SH.stop === 'function') SH.stop();
      else if (typeof G !== 'undefined' && G && typeof G.quit === 'function') G.quit();
    } catch (e) {}
    try {
      if (typeof window.__rescueStop === 'function') window.__rescueStop();
    } catch (e) {}
    window.__rescueBusy = null;
  }

  /**
   * If a game is running, show modal. onFree runs when no game, or after user confirms close.
   * @param {string} nextName - name of game user wants to start
   * @param {function} onFree
   */
  window.swEnsureGameFree = function (nextName, onFree) {
    if (!isBusy()) {
      if (typeof onFree === 'function') onFree();
      return;
    }
    ensureCss();
    const old = document.getElementById('sw-busy-ov');
    if (old) old.remove();
    const name = runningName();
    const ov = document.createElement('div');
    ov.id = 'sw-busy-ov';
    ov.className = 'sw-busy-ov';
    ov.innerHTML =
      '<div class="sw-busy-box" role="alertdialog" aria-modal="true">' +
        '<h3>Close ' + String(name).replace(/[<>]/g, '') + '?</h3>' +
        '<p>Another game is already running. Close it to start' +
        (nextName ? ' <b>' + String(nextName).replace(/[<>]/g, '') + '</b>' : ' the new one') +
        '?</p>' +
        '<div class="sw-busy-act">' +
          '<button type="button" class="sw-busy-no" id="sw-busy-no">No</button>' +
          '<button type="button" class="sw-busy-yes" id="sw-busy-yes">Yes, close it</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    document.getElementById('sw-busy-no').onclick = function () {
      ov.remove();
    };
    document.getElementById('sw-busy-yes').onclick = function () {
      stopRunning();
      ov.remove();
      // small delay so stop cleans up
      setTimeout(function () {
        if (typeof onFree === 'function') onFree();
      }, 80);
    };
    ov.addEventListener('click', function (e) {
      if (e.target === ov) ov.remove();
    });
  };

  window.swIsGameBusy = isBusy;
  window.swStopRunningGame = stopRunning;
})();
