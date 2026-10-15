// speedrun.js — Linux Speed Run: sequential tasks, scored by completion
(function () {
  'use strict';
  if (typeof C === 'undefined') return;
  if (typeof window.startMission !== 'function') {
    console.error('[' + 'speedrun' + '] startMission missing. In games.js add: window.startMission=startMission; before window.GH=');
    return;
  }
  const startMission = window.startMission;

  C.speedrun = function () {
    if ((typeof G !== 'undefined' && G) || (typeof MS !== 'undefined' && MS))
      return bad('another game is already running (Ctrl+C to quit)');

    const home = ROOT.c.home.c.kali.c;
    const targetFile = 'prize.txt';
    const secret = 'flag{speed_' + (100 + Math.floor(Math.random() * 900)) + '}';
    const who = 'kali';

    const tree = {
      'START.txt':
        'SPEED RUN\n\n' +
        'Complete each objective, then submit the answer.\n' +
        'Be accurate — speed comes from knowing the commands.\n',
      track: {
        alpha: {
          beta: {
            [targetFile]: 'You reached the prize.\n' + secret + '\n'
          }
        }
      },
      'roster.txt': 'root\n' + who + '\nguest\n',
      logs: {
        'run.log': 'task=boot ok\ntask=net ok\ntask=flag ' + secret + '\n'
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

    startMission({
      id: 'speedrun',
      name: 'LINUX SPEED RUN',
      intro: 'Five quick objectives in ~/speedrun. Submit each answer.',
      setup() {
        const root = build(tree);
        own(root);
        home.speedrun = root;
        cwd = '/home/kali/speedrun';
        setP();
        P('<span class=dim>Speed run ready — cat START.txt</span>');
      },
      clean() {
        try { delete home.speedrun; } catch (e) {}
      },
      qs: [
        {
          p: 'What is your username? (hint: whoami)',
          fmt: 'kali',
          h: 'Type: whoami   then: submit kali',
          ok: (v) => String(v).toLowerCase() === 'kali'
        },
        {
          p: 'How many names are in roster.txt? (number)',
          fmt: '3',
          h: 'Try: cat roster.txt  or  wc -l roster.txt',
          ok: (v) => String(v).trim() === '3'
        },
        {
          p: 'Find prize.txt — which directory is it in? (alpha or beta)',
          fmt: 'beta',
          h: 'Try: find ~/speedrun -name prize.txt',
          ok: (v) => String(v).toLowerCase() === 'beta'
        },
        {
          p: 'Submit the flag inside prize.txt',
          fmt: 'flag{...}',
          h: 'cat the path find printed, or: cat ~/speedrun/track/alpha/beta/prize.txt',
          ok: (v) => String(v).toLowerCase() === secret.toLowerCase()
        },
        {
          p: 'Same flag appears in logs/run.log — submit it again to finish',
          fmt: 'flag{...}',
          h: 'Try: grep flag ~/speedrun/logs/run.log',
          ok: (v) => String(v).toLowerCase() === secret.toLowerCase()
        }
      ]
    });
  };
})();
