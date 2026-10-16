// speedrun.js — Linux Speed Run: shuffled tasks, 2-min timer, more questions
(function () {
  'use strict';
  if (typeof C === 'undefined') return;
  if (typeof window.startMission !== 'function') {
    console.error('[speedrun] startMission missing');
    return;
  }
  const startMission = window.startMission;
  const shuf = (a) => a.slice().sort(() => Math.random() - 0.5);
  const rn = (n) => Math.floor(Math.random() * n);

  C.speedrun = function () {
    if ((typeof G !== 'undefined' && G) || (typeof MS !== 'undefined' && MS))
      return bad('another game is already running (q to quit)');

    const home = ROOT.c.home.c.kali.c;
    const secret = 'flag{speed_' + (100 + rn(900)) + '}';
    const who = 'kali';
    const linesInRoster = 3;
    const nestPath = 'track/alpha/beta/prize.txt';

    const tree = {
      'START.txt':
        'SPEED RUN\n\nComplete each objective, then:\n  submit <answer>\n\nType hint if stuck. You have 2 minutes.\n',
      track: {
        alpha: {
          beta: {
            'prize.txt': 'You reached the prize.\n' + secret + '\n'
          }
        }
      },
      'roster.txt': 'root\n' + who + '\nguest\n',
      logs: {
        'run.log': 'task=boot ok\ntask=net ok\ntask=flag ' + secret + '\n'
      },
      'counts.txt': 'apples 4\noranges 7\nbananas 2\n',
      hidden: {
        '.token': 'tok_' + (1000 + rn(8000)) + '\n'
      }
    };

    function build(t) {
      const c = {};
      Object.keys(t).forEach((n) => {
        c[n] = typeof t[n] === 'string' ? F(t[n]) : build(t[n]);
      });
      const d = D(c);
      d.o = 'kali'; d.g = 'kali'; d.ts = Date.now();
      return d;
    }
    function own(node) {
      Object.values(node.c).forEach((n) => {
        n.o = 'kali'; n.g = 'kali'; n.ts = Date.now();
        if (n.c && typeof n.c === 'object') own(n);
      });
    }

    const pool = [
      {
        p: 'What does whoami print for this session?',
        fmt: 'username',
        h: 'A short command tells you your login name.',
        ok: (v) => String(v).toLowerCase() === who
      },
      {
        p: 'How many lines are in roster.txt?',
        fmt: 'number',
        h: 'Count the lines in the file under ~/speedrun.',
        ok: (v) => String(v).trim() === String(linesInRoster)
      },
      {
        p: 'Find prize.txt under track/. Submit its relative path from ~/speedrun.',
        fmt: 'track/.../prize.txt',
        h: 'Use find starting at the speedrun folder. Look for prize.txt.',
        ok: (v) => {
          const s = String(v).replace(/^\/home\/kali\/speedrun\//, '').replace(/^\.\//, '');
          return s === nestPath || s.endsWith('prize.txt');
        }
      },
      {
        p: 'Open prize.txt and submit the flag inside it.',
        fmt: 'flag{...}',
        h: 'Once you know where prize.txt is, open it with cat.',
        ok: (v) => String(v).toLowerCase() === secret.toLowerCase()
      },
      {
        p: 'Find the flag line inside logs/run.log and submit that flag.',
        fmt: 'flag{...}',
        h: 'Search the log file for the word flag.',
        ok: (v) => String(v).toLowerCase() === secret.toLowerCase()
      },
      {
        p: 'In counts.txt, how many oranges?',
        fmt: 'number',
        h: 'Read counts.txt and look at the oranges line.',
        ok: (v) => String(v).trim() === '7'
      },
      {
        p: 'There is a hidden file under hidden/. Submit the token string inside it.',
        fmt: 'tok_....',
        h: 'Hidden names start with a dot. List with ls -la, then cat the file.',
        ok: (v) => /^tok_\d+$/i.test(String(v).trim())
      }
    ];

    const must = pool.filter((q) => q.fmt.indexOf('flag') >= 0);
    const rest = shuf(pool.filter((q) => q.fmt.indexOf('flag') < 0));
    const qs = shuf(must.slice(0, 1).concat(rest)).slice(0, 5);

    startMission({
      id: 'speedrun',
      name: 'LINUX SPEED RUN',
      intro: '2 minutes. Objectives in ~/speedrun. submit <answer> · hint · q quits',
      timerMs: 2 * 60 * 1000,
      setup() {
        const root = build(tree);
        own(root);
        home.speedrun = root;
        cwd = '/home/kali/speedrun';
        setP();
        P('<span class=dim>Speed run ready — cat START.txt · timer is running</span>');
      },
      clean() {
        try { delete home.speedrun; } catch (e) {}
      },
      qs: qs
    });
  };
})();
