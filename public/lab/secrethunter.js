// secrethunter.js — Secret Hunter: 5 progressive levels in the simulated terminal
// Commands used: ls, ls -la, cd, cat, find, grep. Submit flags with: submit flag{...}
(function () {
  'use strict';
  if (typeof C === 'undefined') return;
  if (typeof window.startMission !== 'function') {
    console.error('[' + 'secrethunter' + '] startMission missing. In games.js add: window.startMission=startMission; before window.GH=');
    return;
  }
  const startMission = window.startMission;

  const rn = (n) => Math.floor(Math.random() * n);
  const r = (a) => a[rn(a.length)];
  const W1 = ['quiet', 'amber', 'rusty', 'silver', 'lucky', 'gentle', 'cosmic', 'swift', 'misty', 'bold'];
  const W2 = ['fox', 'river', 'falcon', 'comet', 'lantern', 'harbor', 'maple', 'pebble', 'tiger', 'anchor'];
  const flag = () => 'flag{' + r(W1) + '_' + r(W2) + '_' + (100 + rn(900)) + '}';

  function build(t) {
    const c = {};
    Object.keys(t).forEach((n) => {
      c[n] = typeof t[n] === 'string' ? F(t[n]) : build(t[n]);
    });
    const d = D(c);
    d.o = 'kali';
    d.g = 'kali';
    d.ts = Date.now();
    return d;
  }
  function own(t) {
    Object.values(t.c).forEach((n) => {
      n.o = 'kali';
      n.g = 'kali';
      n.ts = Date.now();
      if (n.c && typeof n.c === 'object') own(n);
    });
  }

  C.secrethunter = function () {
    if (typeof G !== 'undefined' && G) return bad('another game is already running (Ctrl+C to quit)');
    if (typeof MS !== 'undefined' && MS) return bad('another game is already running (Ctrl+C to quit)');

    const home = ROOT.c.home.c.kali.c;
    const f1 = flag(), f2 = flag(), f3 = flag(), f4 = flag(), f5 = flag();

    // Level tree under ~/secret_hunter
    const tree = {
      'README.txt':
        'Welcome, agent.\n\n' +
        'Five secrets are hidden in this folder tree.\n' +
        'Use ls, ls -la, cd, cat, find and grep.\n' +
        'When you find a flag, type: submit flag{...}\n' +
        'Type hint if you get stuck.\n\n' +
        'Start with level1/\n',
      level1: {
        'note.txt': 'Level 1 — open eyes.\nThe first flag is in plain sight.\nOpen clue.txt with cat.\n',
        'clue.txt': 'Here is your first secret:\n' + f1 + '\n'
      },
      level2: {
        'welcome.txt': 'Level 2 — some files hide.\nNames that start with a dot are hidden from plain ls.\nTry: ls -la\n',
        '.shadow': 'You found the shadow file.\n' + f2 + '\n',
        decoy: { 'empty.txt': 'Nothing here.\n' }
      },
      level3: {
        'README.txt': 'Level 3 — dig deeper.\nA key is buried in nested folders.\nTry: find ~/secret_hunter/level3 -name vault.key\n',
        archive: {
          old: {
            2024: {
              'vault.key': 'vault unlocked:\n' + f3 + '\n'
            }
          }
        },
        noise: {
          'list.txt': 'alpha\nbeta\ngamma\n'
        }
      },
      level4: {
        'README.txt': 'Level 4 — search the log.\nSomething was written into server.log.\nTry: grep flag{ ~/secret_hunter/level4/server.log\n',
        'server.log': (function () {
          const lines = [];
          for (let i = 0; i < 40; i++) {
            lines.push(
              '2026-10-12 01:' +
                String(i).padStart(2, '0') +
                ' INFO worker-' +
                (i % 4) +
                ' heartbeat ok'
            );
          }
          lines[23] = '2026-10-12 01:23 NOTICE access_token=' + f4;
          return lines.join('\n') + '\n';
        })(),
        'notes.txt': 'Keep the logs clean.\n'
      },
      level5: {
        'README.txt':
          'Level 5 — final hunt.\nCombine everything:\n' +
          '  • a hidden folder\n' +
          '  • a nested path\n' +
          '  • a line inside a file\n' +
          'Try: ls -la  then  find  then  grep / cat\n',
        '.classified': {
          ops: {
            'mission.log': (function () {
              const lines = [];
              for (let i = 0; i < 20; i++) lines.push('op-' + i + ' status=idle');
              lines[11] = 'op-11 status=flag ' + f5;
              return lines.join('\n') + '\n';
            })()
          }
        },
        public: {
          'index.txt': 'Public zone. No secrets here.\n'
        }
      }
    };

    const flags = [f1, f2, f3, f4, f5];
    const hints = [
      'Level 1: Enter level1 and open the file that sounds like a clue.',
      'Level 2: Some names start with a dot — list all files, then open the shadow one.',
      'Level 3: Search the level3 tree for a file named like a vault key, then read it.',
      'Level 4: Scan the server log for an unusual token or flag line.',
      'Level 5: List everything in level5, including hidden folders, then dig into ops logs.'
    ];

    startMission({
      id: 'secrethunter',
      name: 'SECRET HUNTER',
      intro:
        'Five levels. Explore ~/secret_hunter with ls, cd, cat, find and grep. Submit each flag with: submit flag{...}',
      setup() {
        const root = build(tree);
        own(root);
        home.secret_hunter = root;
        cwd = '/home/kali/secret_hunter';
        setP();
        P('<span class=dim>You are in ~/secret_hunter — read README.txt to begin.</span>');
      },
      clean() {
        try {
          delete home.secret_hunter;
        } catch (e) {}
      },
      qs: flags.map((f, i) => ({
        p: 'Level ' + (i + 1) + ' of 5: find the flag for this level',
        fmt: 'flag{...}',
        h: hints[i],
        ok: (v) => String(v).toLowerCase() === f.toLowerCase()
      }))
    });
  };

  // Alias so playGame('secrethunter') / terminal command both work
  C.secrethunter.desc = 'Secret Hunter — 5-level hidden-file mission';
})();
