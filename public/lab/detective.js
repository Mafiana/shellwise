// detective.js — Terminal Detective: reshuffled case, 2-min timer, more questions
(function () {
  'use strict';
  if (typeof C === 'undefined') return;
  if (typeof window.startMission !== 'function') {
    console.error('[detective] startMission missing');
    return;
  }
  const startMission = window.startMission;
  const shuf = (a) => a.slice().sort(() => Math.random() - 0.5);
  const rn = (n) => Math.floor(Math.random() * n);

  C.detective = function () {
    if ((typeof G !== 'undefined' && G) || (typeof MS !== 'undefined' && MS))
      return bad('another game is already running (q to quit)');

    const home = ROOT.c.home.c.kali.c;
    const suspects = shuf([
      { name: 'alex', ip: '198.51.100.' + (20 + rn(30)), when: '0' + (1 + rn(5)) + ':' + String(10 + rn(40)).padStart(2, '0') },
      { name: 'blake', ip: '198.51.100.' + (40 + rn(20)), when: '0' + (2 + rn(4)) + ':' + String(10 + rn(40)).padStart(2, '0') },
      { name: 'casey', ip: '203.0.113.' + (5 + rn(40)), when: '0' + (3 + rn(3)) + ':' + String(10 + rn(40)).padStart(2, '0') }
    ]);
    const culprit = suspects[rn(suspects.length)];

    const auth = [];
    suspects.forEach((s, idx) => {
      auth.push('Oct 12 ' + s.when + ' sshd[' + (200 + idx) + ']: Failed password for root from ' + s.ip);
      auth.push('Oct 12 ' + s.when + ' sshd[' + (210 + idx) + ']: Failed password for invalid user admin from ' + s.ip);
    });
    auth.push('Oct 12 ' + culprit.when + ' sshd[299]: Accepted password for root from ' + culprit.ip);
    auth.push('Oct 12 04:01 sshd[300]: session opened for user root by ' + culprit.name);
    auth.push('Oct 12 02:11 sshd[180]: Accepted password for guest from 10.0.0.8');

    const bashHistory =
      'whoami\nls /var/log\ncat /var/log/auth.log\nrm -rf /var/www/backup\necho cleared by ' + culprit.name + '\n';

    const tree = {
      'CASE.txt':
        'CASE FILE: broken-server-01\n\nAt 04:00 the web backup was deleted.\nEvidence is under evidence/\nIdentify the culprit.\nSubmit: submit <value>\nYou have 2 minutes.\n',
      evidence: {
        'auth.log': shuf(auth).join('\n') + '\n',
        'bash_history.txt': bashHistory,
        'notes.txt': 'VPN access: alex, blake, casey.\nOnly one successful root login appears before the wipe.\nGuest logins are noise — ignore them.\n',
        'hosts.txt': suspects.map((s) => s.ip + '  ' + s.name).join('\n') + '\n'
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
        p: 'Which IP had the Accepted password for root?',
        fmt: '<ip>',
        h: 'Search the auth log for a successful root login (not guest).',
        ok: (v) => String(v).trim() === culprit.ip
      },
      {
        p: 'What time was that successful root login? (HH:MM as in the log)',
        fmt: 'HH:MM',
        h: 'Read the timestamp on the same Accepted line for root.',
        ok: (v) => String(v).trim() === culprit.when
      },
      {
        p: 'Who is the culprit? (username)',
        fmt: 'alex|blake|casey',
        h: 'Cross-check the session opened line and bash_history.',
        ok: (v) => String(v).toLowerCase() === culprit.name
      },
      {
        p: 'How many distinct VPN suspects are listed in notes.txt?',
        fmt: 'number',
        h: 'Read evidence/notes.txt carefully.',
        ok: (v) => String(v).trim() === '3'
      },
      {
        p: 'Which file under evidence/ contains the shell commands run after login?',
        fmt: 'filename',
        h: 'List evidence/ and open the history-related file.',
        ok: (v) => /bash_history/i.test(String(v))
      }
    ];

    startMission({
      id: 'detective',
      name: 'TERMINAL DETECTIVE',
      intro: '2 minutes. Investigate ~/casefile. submit <answer> · hint · q quits',
      timerMs: 2 * 60 * 1000,
      setup() {
        const root = build(tree);
        own(root);
        home.casefile = root;
        cwd = '/home/kali/casefile';
        setP();
        P('<span class=dim>Case open — cat CASE.txt · timer is running</span>');
      },
      clean() {
        try { delete home.casefile; } catch (e) {}
      },
      qs: shuf(pool).slice(0, 4)
    });
  };
})();
