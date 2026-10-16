// cyberattack.js — Cyber Attack: Save the Network (timed investigation)
(function () {
  'use strict';
  if (typeof C === 'undefined') return;
  if (typeof window.startMission !== 'function') {
    console.error('[' + 'cyberattack' + '] startMission missing. In games.js add: window.startMission=startMission; before window.GH=');
    return;
  }
  const startMission = window.startMission;

  C.cyberattack = function () {
    if ((typeof G !== 'undefined' && G) || (typeof MS !== 'undefined' && MS))
      return bad('another game is already running (Ctrl+C to quit)');

    const home = ROOT.c.home.c.kali.c;
    const attackerIp = '203.0.113.' + (40 + Math.floor(Math.random() * 20));
    const badProc = ['cryptominer', 'backdoor.sh', 'nc_listen'][Math.floor(Math.random() * 3)];
    const userHit = ['admin', 'ubuntu', 'deploy'][Math.floor(Math.random() * 3)];

    const authLines = [];
    for (let i = 0; i < 35; i++) {
      const min = String(i).padStart(2, '0');
      if (i >= 10 && i <= 22) {
        authLines.push('Oct 12 02:' + min + ' sshd[1' + i + ']: Failed password for ' + userHit + ' from ' + attackerIp + ' port ' + (40000 + i));
      } else if (i === 24) {
        authLines.push('Oct 12 02:' + min + ' sshd[199]: Accepted password for ' + userHit + ' from ' + attackerIp + ' port 40110');
      } else {
        authLines.push('Oct 12 02:' + min + ' sshd[10' + i + ']: Accepted password for kali from 192.168.1.' + (10 + (i % 5)) + ' port 22');
      }
    }

    const psOut =
      'USER       PID %CPU %MEM COMMAND\n' +
      'root         1  0.0  0.1 /sbin/init\n' +
      'kali       420  0.1  0.2 bash\n' +
      'root       881 88.0 12.4 /tmp/' + badProc + '\n' +
      'kali       902  0.0  0.1 ps aux\n';

    const tree = {
      'README.txt':
        'INCIDENT RESPONSE\n\n' +
        'A host looks compromised. Investigate:\n' +
        '  1) Suspicious process name in processes.txt\n' +
        '  2) Attacker IP in auth.log (most Failed password)\n' +
        '  3) Username targeted by that IP\n\n' +
        'Tools: cat, grep, head, tail\n' +
        'Submit each answer: submit <answer>\n',
      'processes.txt': psOut,
      'auth.log': authLines.join('\n') + '\n',
      notes: {
        'todo.txt': 'Check CPU spikes and SSH failures.\n'
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
      id: 'cyberattack',
      name: 'CYBER ATTACK',
      intro: 'Server under attack. Explore ~/incident with cat and grep. Submit three findings.',
      setup() {
        const root = build(tree);
        own(root);
        home.incident = root;
        cwd = '/home/kali/incident';
        setP();
        P('<span class=dim>You are in ~/incident — start with cat README.txt</span>');
      },
      clean() {
        try { delete home.incident; } catch (e) {}
      },
      qs: [
        {
          p: 'What is the suspicious process name in processes.txt?',
          fmt: '<name>',
          h: 'Read processes.txt — look for high CPU or odd paths.',
          ok: (v) => String(v).toLowerCase() === badProc.toLowerCase()
        },
        {
          p: 'Which IP has the most failed SSH passwords in auth.log?',
          fmt: '<ip>',
          h: 'Search the auth log for failed login lines.',
          ok: (v) => String(v).trim() === attackerIp
        },
        {
          p: 'Which username did that attacker target?',
          fmt: '<username>',
          h: 'Try: grep "' + attackerIp + '" auth.log',
          ok: (v) => String(v).toLowerCase() === userHit.toLowerCase()
        }
      ]
    });
  };
})();
