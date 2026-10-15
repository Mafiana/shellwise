// detective.js — Terminal Detective: who broke the server?
(function () {
  'use strict';
  if (typeof C === 'undefined') return;
  if (typeof window.startMission !== 'function') {
    console.error('[' + 'detective' + '] startMission missing. In games.js add: window.startMission=startMission; before window.GH=');
    return;
  }
  const startMission = window.startMission;

  C.detective = function () {
    if ((typeof G !== 'undefined' && G) || (typeof MS !== 'undefined' && MS))
      return bad('another game is already running (Ctrl+C to quit)');

    const home = ROOT.c.home.c.kali.c;
    const suspects = [
      { name: 'alex', ip: '198.51.100.22', when: '03:14' },
      { name: 'blake', ip: '198.51.100.44', when: '03:31' },
      { name: 'casey', ip: '203.0.113.9', when: '03:47' }
    ];
    const culprit = suspects[Math.floor(Math.random() * suspects.length)];

    const auth = [];
    suspects.forEach((s, idx) => {
      auth.push('Oct 12 ' + s.when + ' sshd[' + (200 + idx) + ']: Failed password for root from ' + s.ip);
      auth.push('Oct 12 ' + s.when + ' sshd[' + (210 + idx) + ']: Failed password for root from ' + s.ip);
    });
    auth.push('Oct 12 ' + culprit.when + ' sshd[299]: Accepted password for root from ' + culprit.ip);
    auth.push('Oct 12 04:01 sshd[300]: session opened for user root by ' + culprit.name);

    const bashHistory =
      'whoami\n' +
      'ls /var/log\n' +
      'cat /var/log/auth.log\n' +
      'rm -rf /var/www/backup\n' +
      'echo cleared by ' + culprit.name + '\n';

    const tree = {
      'CASE.txt':
        'CASE FILE: broken-server-01\n\n' +
        'At 04:00 the web backup was deleted.\n' +
        'Evidence is under evidence/\n' +
        'Identify the culprit username.\n' +
        'Submit: submit <username>\n',
      evidence: {
        'auth.log': auth.join('\n') + '\n',
        'bash_history.txt': bashHistory,
        'notes.txt': 'Three people had VPN access: alex, blake, casey.\nOnly one successful root login appears before the wipe.\n'
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
      id: 'detective',
      name: 'TERMINAL DETECTIVE',
      intro: 'Someone wiped the backup. Investigate ~/casefile and name the culprit.',
      setup() {
        const root = build(tree);
        own(root);
        home.casefile = root;
        cwd = '/home/kali/casefile';
        setP();
        P('<span class=dim>Case file open — cat CASE.txt</span>');
      },
      clean() {
        try { delete home.casefile; } catch (e) {}
      },
      qs: [
        {
          p: 'Which IP had the Accepted password for root?',
          fmt: '<ip>',
          h: 'Try: grep Accepted evidence/auth.log',
          ok: (v) => String(v).trim() === culprit.ip
        },
        {
          p: 'What time was that successful login? (HH:MM as in the log)',
          fmt: 'HH:MM',
          h: 'Same line as Accepted password — read the timestamp.',
          ok: (v) => String(v).trim() === culprit.when
        },
        {
          p: 'Who is the culprit? (username)',
          fmt: 'alex|blake|casey',
          h: 'Check evidence/bash_history.txt and the session opened line.',
          ok: (v) => String(v).toLowerCase() === culprit.name
        }
      ]
    });
  };
})();
