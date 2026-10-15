// cosmetics.js — unlock terminal themes by clearing missions
(function () {
  'use strict';
  const KEY = 'sw_cosmetics';
  const ACTIVE = 'sw_cosmetic_active';

  const CATALOG = {
    neon: { id: 'neon', name: 'Neon Grid', need: 'secrethunter', css: { accent: '#00f0a8', bg: '#061018' } },
    ember: { id: 'ember', name: 'Ember Ops', need: 'cyberattack', css: { accent: '#ff4d6d', bg: '#12080c' } },
    ice: { id: 'ice', name: 'Ice Speed', need: 'speedrun', css: { accent: '#3dbbff', bg: '#061018' } },
    violet: { id: 'violet', name: 'Vault Violet', need: 'vault', css: { accent: '#b388ff', bg: '#0c0818' } },
    gold: { id: 'gold', name: 'Detective Gold', need: 'detective', css: { accent: '#ffb454', bg: '#12100a' } },
    rescue: { id: 'rescue', name: 'Rescue Green', need: 'rescue1', css: { accent: '#2fd37a', bg: '#06140c' } },
    ghost: { id: 'ghost', name: 'Ghost Protocol', need: 'rescue2', css: { accent: '#a0b4ff', bg: '#0a0e18' } },
    signal: { id: 'signal', name: 'Last Signal', need: 'rescue3', css: { accent: '#ff8fab', bg: '#140810' } },
    phantom: { id: 'phantom', name: 'Phantom Trace', need: 'rescue4', css: { accent: '#7dffa8', bg: '#04120c' } },
    master: { id: 'master', name: 'Zone Master', need: 'all', css: { accent: '#ffd700', bg: '#0c0c08' } }
  };

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch (e) {
      return {};
    }
  }
  function save(o) {
    localStorage.setItem(KEY, JSON.stringify(o));
  }

  function applyTheme(id) {
    const c = CATALOG[id];
    if (!c) return;
    document.documentElement.style.setProperty('--sw-accent', c.css.accent);
    const term = document.getElementById('term') || document.getElementById('win');
    if (term) {
      term.style.boxShadow = '0 0 0 1px ' + c.css.accent + '44, 0 0 40px ' + c.css.accent + '22';
    }
    localStorage.setItem(ACTIVE, id);
  }

  window.swUnlockCosmetic = function (gameId) {
    const owned = load();
    let changed = false;
    Object.keys(CATALOG).forEach(function (id) {
      const c = CATALOG[id];
      if (c.need === gameId && !owned[id]) {
        owned[id] = true;
        changed = true;
        if (typeof toast === 'function') toast('Cosmetic unlocked: ' + c.name);
        else if (typeof P === 'function') P('<span class=ok>Cosmetic unlocked: ' + c.name + '</span>');
      }
    });
    // Zone Master if many owned
    const need = ['neon', 'ember', 'ice', 'violet', 'gold', 'rescue', 'ghost', 'signal', 'phantom'];
    if (need.every(function (x) { return owned[x]; }) && !owned.master) {
      owned.master = true;
      changed = true;
      if (typeof toast === 'function') toast('Zone Master theme unlocked!');
    }
    if (changed) save(owned);
  };

  window.swCosmeticsOwned = function () {
    return load();
  };

  window.swSetCosmetic = function (id) {
    if (!load()[id] && id !== 'neon') return;
    applyTheme(id);
  };

  // restore on load
  try {
    const a = localStorage.getItem(ACTIVE);
    if (a && load()[a]) applyTheme(a);
  } catch (e) {}
})();
