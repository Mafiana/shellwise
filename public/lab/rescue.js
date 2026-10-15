// rescue.js — RESCUE series: Operation Digital Trace (Missions 01–03)
// Simulated terminal + tactical map + timer. All cases fictional.
(function () {
  'use strict';
  function RR() {
    if (typeof R !== 'undefined') return R;
    if (window.R) return window.R;
    return null;
  }
  if (!RR()) return;

  const SERIES = {
    title: 'RESCUE',
    subtitle: 'Operation Digital Trace',
    tagline: 'Every command is a clue. Every second counts.'
  };

  // Progress: which missions cleared (local)
  function prog() {
    try {
      const o = JSON.parse(localStorage.getItem('krescue') || '{}');
      return o && typeof o === 'object' ? o : {};
    } catch (e) { return {}; }
  }
  function saveProg(id, score) {
    const o = prog();
    o[id] = { cleared: true, score: score | 0, at: Date.now() };
    try { localStorage.setItem('krescue', JSON.stringify(o)); } catch (e) {}
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  // Shared map stages (region flavour differs per mission via labels)
  function stagesFor(labels) {
    const base = [
      { x: 48, y: 38, zoom: 1 },
      { x: 52, y: 36, zoom: 1.4 },
      { x: 54, y: 37, zoom: 2.2 },
      { x: 55.2, y: 37.4, zoom: 3.2 },
      { x: 55.5, y: 37.6, zoom: 4 },
      { x: 56, y: 38, zoom: 4.2 }
    ];
    return base.map(function (s, i) {
      return Object.assign({}, s, labels[i] || labels[labels.length - 1]);
    });
  }

  const MISSIONS = [
    {
      id: 'rescue1',
      n: '01',
      title: 'The Vanishing Engineer',
      difficulty: 'Rookie',
      minutes: 10,
      blurb: 'A cloud engineer goes offline after a failed VPN login. Trace the signal to Lagos before it dies.',
      subject: {
        name: 'Ada Okonkwo',
        sex: 'Female',
        age: 29,
        occupation: 'Cloud engineer',
        city: 'Lagos, Nigeria',
        note: 'Last seen online after a failed VPN login from a coastal node.',
        ref: 'SW-CASE-2041'
      },
      stages: stagesFor([
        { region: 'World', label: 'Scanning global traffic…' },
        { region: 'West Africa', label: 'Signal cluster: West Africa' },
        { region: 'Nigeria', label: 'Narrowing to Nigeria' },
        { region: 'Lagos sector', label: 'Coastal node detected' },
        { region: 'Lagos, NG', label: 'Target lock' },
        { region: 'Lagos, NG', label: 'Locked' }
      ]),
      steps: [
        { expect: ['cat briefing.txt', 'cat /mission/briefing.txt'], ok: 'Briefing loaded.', hint: 'The case file is sitting in this folder. Open the briefing first so you know who is missing.', soft: 'Type exactly: cat briefing.txt',
          out: { 'cat briefing.txt': '[CASE SW-CASE-2041]\nMissing: Ada Okonkwo, cloud engineer.\nInvestigate evidence/ before the window closes.' } },
        { expect: ['ls', 'ls -la', 'ls evidence', 'ls evidence/'], ok: 'Evidence listed.', hint: 'List mission or evidence files.', soft: 'Try: ls evidence',
          out: { 'ls': 'briefing.txt  evidence/', 'ls -la': 'briefing.txt  evidence/', 'ls evidence': 'network.log  vpn.log  geo.txt', 'ls evidence/': 'network.log  vpn.log  geo.txt' } },
        { expect: ['cat network.log', 'cat evidence/network.log', 'grep signal evidence/network.log', 'grep -i signal evidence/network.log'], ok: 'Gateway-07 ACTIVE in West Africa.', hint: 'Read network.log or grep SIGNAL.', soft: 'Try: cat evidence/network.log',
          out: { 'cat evidence/network.log': '14:11 gateway-07 SIGNAL ACTIVE region=west_africa', 'cat network.log': '14:11 gateway-07 SIGNAL ACTIVE region=west_africa', 'grep signal evidence/network.log': 'SIGNAL: gateway-07 ACTIVE', 'grep -i signal evidence/network.log': 'SIGNAL: gateway-07 ACTIVE' } },
        { expect: ['cat vpn.log', 'cat evidence/vpn.log', 'grep failed evidence/vpn.log', 'grep -i lagos evidence/vpn.log'], ok: 'VPN failures near Lagos.', hint: 'Inspect the VPN log.', soft: 'Try: cat evidence/vpn.log',
          out: { 'cat evidence/vpn.log': 'failed login user=aokonkwo from=coastal-ng-07\nnearest: LAGOS', 'cat vpn.log': 'failed login … LAGOS', 'grep failed evidence/vpn.log': 'failed login … coastal-ng-07', 'grep -i lagos evidence/vpn.log': 'LAGOS' } },
        { expect: ['cat geo.txt', 'cat evidence/geo.txt'], ok: 'Coordinates: Lagos coastal sector.', hint: 'Open geo.txt in evidence/.', soft: 'Try: cat evidence/geo.txt',
          out: { 'cat evidence/geo.txt': 'approx: 6.45N 3.39E (Lagos)\nconfidence: rising', 'cat geo.txt': 'approx: 6.45N 3.39E (Lagos)' } },
        { expect: ['submit ada', 'submit ada okonkwo'], ok: 'Identity confirmed.', hint: 'Submit the missing person\'s name.', soft: 'Try: submit Ada Okonkwo' }
      ]
    },
    {
      id: 'rescue2',
      n: '02',
      title: 'Ghost Protocol',
      difficulty: 'Analyst',
      minutes: 12,
      blurb: 'A courier vanishes mid-route. Fake packets flood the logs — separate noise from the real trail.',
      subject: {
        name: 'Tunde Balogun',
        sex: 'Male',
        age: 34,
        occupation: 'Logistics courier',
        city: 'Abuja, Nigeria',
        note: 'Decoy IPs were injected into the route log. Only one path is genuine.',
        ref: 'SW-CASE-2042'
      },
      stages: stagesFor([
        { region: 'World', label: 'Multiple ghosts on the wire…' },
        { region: 'West Africa', label: 'Noise vs signal filter' },
        { region: 'Nigeria', label: 'Central route anomaly' },
        { region: 'Abuja sector', label: 'Hub checkpoint' },
        { region: 'Abuja, NG', label: 'Real path isolated' },
        { region: 'Abuja, NG', label: 'Locked' }
      ]),
      steps: [
        { expect: ['cat briefing.txt', 'cat /mission/briefing.txt'], ok: 'Ghost Protocol briefing loaded.', hint: 'Start with the briefing.', soft: 'Try: cat briefing.txt',
          out: { 'cat briefing.txt': '[CASE SW-CASE-2042]\nCourier: Tunde Balogun.\nRoute logs contain decoys. Find the REAL hop.' } },
        { expect: ['ls', 'ls -la', 'ls evidence', 'ls evidence/'], ok: 'Files: route.log, decoys.txt, manifest.txt', hint: 'List evidence files.', soft: 'Try: ls evidence',
          out: { 'ls': 'briefing.txt  evidence/', 'ls -la': 'briefing.txt  evidence/', 'ls evidence': 'route.log  decoys.txt  manifest.txt', 'ls evidence/': 'route.log  decoys.txt  manifest.txt' } },
        { expect: ['cat decoys.txt', 'cat evidence/decoys.txt'], ok: 'Decoy list loaded — ignore these IPs.', hint: 'Read which IPs are fake.', soft: 'Try: cat evidence/decoys.txt',
          out: { 'cat evidence/decoys.txt': 'DECOY 198.51.100.10\nDECOY 203.0.113.50\nDECOY 192.0.2.9', 'cat decoys.txt': 'DECOY 198.51.100.10\nDECOY 203.0.113.50' } },
        { expect: ['cat route.log', 'cat evidence/route.log', 'grep real evidence/route.log', 'grep REAL evidence/route.log'], ok: 'REAL hop points at Abuja hub.', hint: 'Find the REAL line in route.log.', soft: 'Try: grep REAL evidence/route.log',
          out: { 'cat evidence/route.log': 'hop 198.51.100.10 noise\nhop 203.0.113.50 noise\nhop REAL abuia-hub-01 city=ABUJA', 'cat route.log': '… REAL abuia-hub-01 city=ABUJA', 'grep real evidence/route.log': 'hop REAL abuia-hub-01 city=ABUJA', 'grep REAL evidence/route.log': 'hop REAL abuia-hub-01 city=ABUJA' } },
        { expect: ['cat manifest.txt', 'cat evidence/manifest.txt'], ok: 'Manifest names the courier.', hint: 'Read the manifest.', soft: 'Try: cat evidence/manifest.txt',
          out: { 'cat evidence/manifest.txt': 'courier=Tunde Balogun\nstatus=missing\nlast_hub=ABUJA', 'cat manifest.txt': 'courier=Tunde Balogun\nlast_hub=ABUJA' } },
        { expect: ['submit tunde', 'submit tunde balogun'], ok: 'Courier identified.', hint: 'Submit the courier\'s name.', soft: 'Try: submit Tunde Balogun' }
      ]
    },
    {
      id: 'rescue3',
      n: '03',
      title: 'Last Signal',
      difficulty: 'Elite',
      minutes: 12,
      blurb: 'A rescue team goes silent. Correlate radio, GPS, and auth logs to find their final checkpoint.',
      subject: {
        name: 'Team Falcon (lead: Mira Chen)',
        sex: 'Mixed team',
        age: '—',
        occupation: 'Field rescue unit',
        city: 'Port Harcourt sector',
        note: 'Last radio burst aligned with a GPS ping and a sudo session on relay-9.',
        ref: 'SW-CASE-2043'
      },
      stages: stagesFor([
        { region: 'World', label: 'Listening for last burst…' },
        { region: 'Gulf of Guinea', label: 'Radio arc detected' },
        { region: 'Niger Delta', label: 'GPS correlation' },
        { region: 'PH sector', label: 'Relay-9 online' },
        { region: 'Port Harcourt', label: 'Final checkpoint' },
        { region: 'Port Harcourt', label: 'Locked' }
      ]),
      steps: [
        { expect: ['cat briefing.txt', 'cat /mission/briefing.txt'], ok: 'Last Signal briefing loaded.', hint: 'Read the briefing first.', soft: 'Try: cat briefing.txt',
          out: { 'cat briefing.txt': '[CASE SW-CASE-2043]\nUnit: Team Falcon (lead Mira Chen).\nCorrelate radio.log, gps.log, auth.log.' } },
        { expect: ['ls', 'ls evidence', 'ls evidence/', 'ls -la'], ok: 'Logs ready under evidence/.', hint: 'List evidence.', soft: 'Try: ls evidence',
          out: { 'ls': 'briefing.txt  evidence/', 'ls -la': 'briefing.txt  evidence/', 'ls evidence': 'radio.log  gps.log  auth.log', 'ls evidence/': 'radio.log  gps.log  auth.log' } },
        { expect: ['cat radio.log', 'cat evidence/radio.log', 'grep burst evidence/radio.log', 'grep LAST evidence/radio.log'], ok: 'Last radio burst timestamp locked.', hint: 'Find LAST/burst in radio.log.', soft: 'Try: grep LAST evidence/radio.log',
          out: { 'cat evidence/radio.log': '03:10 chatter\n03:22 LAST BURST grid=PH-DELTA', 'cat radio.log': '03:22 LAST BURST grid=PH-DELTA', 'grep burst evidence/radio.log': '03:22 LAST BURST grid=PH-DELTA', 'grep LAST evidence/radio.log': '03:22 LAST BURST grid=PH-DELTA' } },
        { expect: ['cat gps.log', 'cat evidence/gps.log', 'grep ph-delta evidence/gps.log', 'grep PH evidence/gps.log'], ok: 'GPS ping matches PH-DELTA.', hint: 'Match the grid in gps.log.', soft: 'Try: cat evidence/gps.log',
          out: { 'cat evidence/gps.log': 'ping 03:22 grid=PH-DELTA conf=0.91', 'cat gps.log': 'ping 03:22 grid=PH-DELTA', 'grep ph-delta evidence/gps.log': 'grid=PH-DELTA', 'grep PH evidence/gps.log': 'grid=PH-DELTA' } },
        { expect: ['cat auth.log', 'cat evidence/auth.log', 'grep relay evidence/auth.log', 'grep mira evidence/auth.log'], ok: 'Mira Chen session on relay-9.', hint: 'Check auth.log for the team lead.', soft: 'Try: grep mira evidence/auth.log',
          out: { 'cat evidence/auth.log': 'sudo session user=mchen host=relay-9\nnote=Team Falcon lead Mira Chen', 'cat auth.log': 'user=mchen host=relay-9 Mira Chen', 'grep relay evidence/auth.log': 'host=relay-9', 'grep mira evidence/auth.log': 'Mira Chen' } },
        { expect: ['submit mira', 'submit mira chen', 'submit team falcon', 'submit falcon'], ok: 'Team lead confirmed.', hint: 'Submit the team lead\'s name.', soft: 'Try: submit Mira Chen' }
      ]
    }
  
  ,{
    id: 'rescue4',
    n: '04',
    title: 'Phantom Trace',
    blurb: 'A vanished identity broker left breadcrumbs across three relays. Reconstruct the last path and name the phantom.',
    difficulty: 'Hard',
    minutes: 14,
    free: false,
    subject: {
      name: 'Kofi Mensah',
      aka: 'The Phantom',
      role: 'Identity broker',
      status: 'MISSING',
      last: 'Relay mesh — Accra sector',
      ref: 'RC-04-PHANTOM'
    },
    map: { from: [0.42, 0.48], to: [0.28, 0.62], label: 'Accra sector' },
    steps: [
      { expect: ['cat briefing.txt', 'cat /mission/briefing.txt'], out: { 'cat briefing.txt': '[CASE RC-04-PHANTOM]\\nThree relays. Reconstruct the path.\\n→ ls evidence/' }, ok: 'Briefing locked.', hint: 'Open the case file.', soft: 'Type: cat briefing.txt' },
      { expect: ['ls evidence', 'ls evidence/', 'ls /mission/evidence', 'ls /mission/evidence/'], out: { 'ls evidence/': 'relay1.log  relay2.log  relay3.log  phantom.txt', 'ls evidence': 'relay1.log  relay2.log  relay3.log  phantom.txt' }, ok: 'Evidence listed.', hint: 'List evidence.', soft: 'Type: ls evidence/' },
      { expect: ['cat evidence/relay1.log', 'grep hop evidence/relay1.log'], out: { 'cat evidence/relay1.log': 'HOP A city=LAGOS' }, ok: 'Relay 1: Lagos.', hint: 'Read relay1.log', soft: 'Type: cat evidence/relay1.log' },
      { expect: ['cat evidence/relay2.log', 'grep hop evidence/relay2.log'], out: { 'cat evidence/relay2.log': 'HOP B city=LOME' }, ok: 'Relay 2: Lomé.', hint: 'Read relay2.log', soft: 'Type: cat evidence/relay2.log' },
      { expect: ['cat evidence/relay3.log', 'grep ACCRA evidence/relay3.log'], out: { 'cat evidence/relay3.log': 'HOP C FINAL city=ACCRA' }, ok: 'Relay 3: Accra.', hint: 'Read relay3.log', soft: 'Type: cat evidence/relay3.log' },
      { expect: ['cat evidence/phantom.txt', 'grep kofi evidence/phantom.txt', 'grep mensah evidence/phantom.txt'], out: { 'cat evidence/phantom.txt': 'alias=The Phantom\\ntrue_name=Kofi Mensah' }, ok: 'Identity recovered.', hint: 'Read phantom.txt', soft: 'Type: cat evidence/phantom.txt' },
      { expect: ['submit kofi mensah', 'submit kofi', 'submit the phantom', 'submit phantom'], out: {}, ok: 'Phantom named.', hint: 'Submit the true name.', soft: 'Type: submit Kofi Mensah' }
    ]
  }

];

  let st = null;
  let tick = null;
  let active = null; // current mission def

  function clearTick() {
    if (tick) { clearInterval(tick); tick = null; }
  }

  function fmt(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  function stageIndex() {
    if (!st || !active) return 0;
    return Math.min(active.stages.length - 1, st.step);
  }

  function mapSvg() {
    const sg = active.stages[stageIndex()];
    return (
      '<div class="rc-map">' +
        '<div class="rc-map-inner" style="transform:scale(' + sg.zoom + ') translate(' + (50 - sg.x) + '%, ' + (50 - sg.y) + '%)">' +
          '<svg class="rc-world" viewBox="0 0 100 60" aria-hidden="true">' +
            '<rect width="100" height="60" fill="#061018"/>' +
            '<path fill="#0c2a3a" stroke="#1a5a6e" stroke-width="0.3" d="M8,22 L18,18 L28,20 L32,28 L24,36 L12,34 Z"/>' +
            '<path fill="#0c2a3a" stroke="#1a5a6e" stroke-width="0.3" d="M35,16 L48,14 L58,18 L55,30 L42,32 L36,24 Z"/>' +
            '<path fill="#0d3344" stroke="#2a7a90" stroke-width="0.35" d="M48,30 L58,28 L62,36 L56,44 L50,42 Z"/>' +
            '<path fill="#0c2a3a" stroke="#1a5a6e" stroke-width="0.3" d="M65,20 L78,16 L88,22 L85,34 L72,36 L66,28 Z"/>' +
            '<path fill="#0c2a3a" stroke="#1a5a6e" stroke-width="0.3" d="M70,38 L82,36 L90,44 L84,52 L72,50 Z"/>' +
            '<circle class="rc-ping" cx="' + sg.x + '" cy="' + sg.y + '" r="2.2" fill="none" stroke="#00f0a8" stroke-width="0.4"/>' +
            '<circle cx="' + sg.x + '" cy="' + sg.y + '" r="0.9" fill="#00f0a8"/>' +
          '</svg>' +
        '</div>' +
        '<div class="rc-map-meta">' +
          '<span class="rc-scan">' + (st.won ? '● LOCKED' : '● SCANNING') + '</span>' +
          '<span>' + esc(sg.region) + '</span>' +
          '<span class="dim">' + esc(sg.label) + '</span>' +
        '</div>' +
      '</div>'
    );
  }

  function termLines() {
    return st.log.map(function (L) {
      if (L.t === 'in') return '<div class="rc-in"><span class="rc-ps">root@rescue:~#</span> ' + esc(L.s) + '</div>';
      if (L.t === 'ok') return '<div class="rc-ok">' + esc(L.s) + '</div>';
      if (L.t === 'bad') return '<div class="rc-bad">' + esc(L.s) + '</div>';
      if (L.t === 'sys') return '<div class="rc-sys">' + esc(L.s) + '</div>';
      return '<div class="rc-out">' + esc(L.s) + '</div>';
    }).join('');
  }

  function hud() {
    const left = st.ends - Date.now();
    const found = Math.min(active.steps.length, st.step);
    return (
      '<div class="rc-hud">' +
        '<div><b>MISSION</b><span>' + esc(active.n) + '</span></div>' +
        '<div class="' + (left < 60000 ? 'rc-warn' : '') + '"><b>TIME LEFT</b><span id="rc-timer">' + fmt(left) + '</span></div>' +
        '<div><b>CLUES</b><span>' + found + '/' + active.steps.length + '</span></div>' +
        '<div><b>STATUS</b><span>' + (st.won ? 'RESCUED' : st.lost ? 'FAILED' : 'ACTIVE') + '</span></div>' +
      '</div>'
    );
  }

  function reportCard() {
    const s = active.subject;
    return (
      '<div class="rc-report">' +
        '<div class="rc-photo" aria-hidden="true">' + esc((s.name || '?').slice(0, 2).toUpperCase()) + '</div>' +
        '<div>' +
          '<h3>Target located</h3>' +
          '<p><b>Name:</b> ' + esc(s.name) + '</p>' +
          '<p><b>Sex:</b> ' + esc(s.sex) + ' · <b>Age:</b> ' + esc(String(s.age)) + '</p>' +
          '<p><b>Occupation:</b> ' + esc(s.occupation) + '</p>' +
          '<p><b>Location:</b> ' + esc(s.city) + '</p>' +
          '<p><b>Case ref:</b> ' + esc(s.ref) + '</p>' +
          '<p class="dim">' + esc(s.note) + '</p>' +
          '<p class="rc-fiction dim">Fictional training case only.</p>' +
        '</div>' +
      '</div>'
    );
  }


  function stageHintsBar() {
    if (!st || !active) return '';
    const steps = active.steps;
    const cur = st.step;
    const buttons = steps.map(function (s, i) {
      const state = st.won || i < cur ? 'done' : i === cur ? 'on' : 'soon';
      const label = 'Stage ' + (i + 1);
      if (state === 'done') {
        return '<button type="button" class="rc-stage done" disabled title="Completed">✓ ' + label + '</button>';
      }
      if (state === 'on') {
        return (
          '<button type="button" class="rc-stage on" data-rc-stage-hint="' + i + '" title="Hint for this stage">' +
            label + ' · Hint' +
          '</button>'
        );
      }
      return '<button type="button" class="rc-stage soon" disabled title="Locked until previous stage">' + label + '</button>';
    }).join('');
    const soft = (!st.won && !st.lost && steps[cur])
      ? '<p class="rc-stage-tip dim">Current: <b>Stage ' + (cur + 1) + '</b> — click <b>Hint</b> on that stage, or type <code>hint</code>.</p>'
      : '';
    return '<div class="rc-stages" role="group" aria-label="Stage hints">' + buttons + '</div>' + soft;
  }

  function paintPlay() {
    const pv = document.getElementById('pv');
    if (!pv || !st || !active) return;
    const over = st.won || st.lost;
    pv.innerHTML =
      '<div class="rc">' +
        '<header class="rc-top">' +
          '<button type="button" class="btn ghost" id="rc-back">◀ Series</button>' +
          '<div class="rc-title"><b>RESCUE</b> <span>' + esc(active.title) + '</span></div>' +
          '<button type="button" class="btn ghost" id="rc-hint" ' + (over ? 'disabled' : '') + '>ECHO hint</button>' +
        '</header>' +
        hud() +
        stageHintsBar() +
        '<div class="rc-grid">' +
          '<section class="rc-side">' +
            mapSvg() +
            (st.won ? reportCard() : '<div class="rc-brief"><h3>' + esc(active.title) + '</h3><p class="dim">' + esc(active.blurb) + '</p><p class="dim">Type <code>help</code> or use ECHO hint.</p></div>') +
          '</section>' +
          '<section class="rc-term">' +
            '<div class="rc-term-hd">root@rescue — /mission — ' + esc(active.difficulty) + '</div>' +
            '<div class="rc-term-body" id="rc-log">' + termLines() + '</div>' +
            (over ? '' :
              '<form class="rc-form" id="rc-form" autocomplete="off">' +
                '<span class="rc-ps">root@rescue:~#</span>' +
                '<input id="rc-inp" spellcheck="false" autocapitalize="off" placeholder="ls · cat · grep · submit · hint" aria-label="Command">' +
              '</form>') +
          '</section>' +
        '</div>' +
        (st.lost ? '<p class="rc-fail">Time expired. <button type="button" class="btn" id="rc-retry">Retry</button></p>' : '') +
        (st.won ? '<p class="rc-win">Mission complete. <button type="button" class="btn" id="rc-again">Replay</button> <button type="button" class="btn ghost" id="rc-series">Series hub</button></p>' : '') +
      '</div>';

    bindPlay();
    const log = document.getElementById('rc-log');
    if (log) log.scrollTop = log.scrollHeight;
  }

  function bindPlay() {
    const back = document.getElementById('rc-back');
    if (back) back.onclick = function () { clearTick(); st = null; active = null; go('rescue'); };
    const series = document.getElementById('rc-series');
    if (series) series.onclick = function () { clearTick(); st = null; active = null; go('rescue'); };
    const hintBtn = document.getElementById('rc-hint');
    if (hintBtn) hintBtn.onclick = function () { pushHint(); paintPlay(); };
    const form = document.getElementById('rc-form');
    if (form) {
      form.onsubmit = function (e) {
        e.preventDefault();
        const inp = document.getElementById('rc-inp');
        const v = (inp && inp.value || '').trim();
        if (inp) inp.value = '';
        if (v) runCmd(v);
      };
      const inp = document.getElementById('rc-inp');
      if (inp) setTimeout(function () { inp.focus(); }, 40);
    }
    const retry = document.getElementById('rc-retry');
    if (retry) retry.onclick = function () { startMission(active.id); };
    const again = document.getElementById('rc-again');
    if (again) again.onclick = function () { startMission(active.id); };
  }

  function pushHint() {
    if (!st || st.won || st.lost) return;
    const step = active.steps[st.step];
    if (!step) return;
    st.hints = (st.hints || 0) + 1;
    const n = st.step + 1;
    const total = active.steps.length;
    if (st.hints === 1) {
      st.log.push({ t: 'sys', s: 'ECHO [Stage ' + n + '/' + total + ']: ' + step.hint });
    } else {
      st.log.push({ t: 'sys', s: 'ECHO [Stage ' + n + '/' + total + ' — exact]: ' + step.soft });
    }
  }

  function normalize(cmd) {
    return cmd.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function runCmd(raw) {
    if (!st || st.won || st.lost) return;
    const n = normalize(raw);
    st.log.push({ t: 'in', s: raw });

    if (n === 'help') {
      st.log.push({
        t: 'out',
        s:
          'Mission shell commands:\n' +
          '  ls / ls evidence     list files\n' +
          '  cat <file>          read a file\n' +
          '  grep <word> <file>  search in a file\n' +
          '  submit <name>       final answer\n' +
          '  hint                ECHO assistant\n' +
          '  pwd / whoami / help'
      });
      paintPlay();
      return;
    }
    if (n === 'hint') {
      pushHint();
      paintPlay();
      return;
    }
    if (n === 'pwd') {
      st.log.push({ t: 'out', s: '/mission' });
      paintPlay();
      return;
    }
    if (n === 'whoami') {
      st.log.push({ t: 'out', s: 'rescue-op' });
      paintPlay();
      return;
    }

    // Always-on simulated filesystem (any step) — so players can explore before the "correct" step
    const FS = {
      'ls': 'briefing.txt  evidence/',
      'ls -la': 'briefing.txt  evidence/',
      'ls evidence': 'Use: ls evidence/   or open files with cat evidence/<name>',
      'ls evidence/': null, // filled per mission below
      'ls /mission': 'briefing.txt  evidence/',
      'ls /mission/evidence': null,
      'ls /mission/evidence/': null
    };

    // Per-mission evidence listing + file contents
    const mid = active.id;
    let evidenceList = 'network.log  vpn.log  geo.txt';
    let files = {};
    if (mid === 'rescue1') {
      evidenceList = 'network.log  vpn.log  geo.txt';
      files = {
        'cat briefing.txt':
          '[CASE ' + active.subject.ref + ']\n' +
          'Missing: Ada Okonkwo, cloud engineer.\n' +
          'Last digital trace: VPN + network gateway.\n' +
          '→ Next: list evidence with: ls evidence/\n' +
          '→ Then read network.log, vpn.log, geo.txt',
        'cat /mission/briefing.txt': null, // alias
        'cat evidence/network.log':
          '14:02 gateway-03 idle\n' +
          '14:11 gateway-07 SIGNAL ACTIVE region=west_africa\n' +
          '14:18 gateway-12 idle',
        'cat network.log':
          '14:11 gateway-07 SIGNAL ACTIVE region=west_africa',
        'cat evidence/vpn.log':
          'failed login user=aokonkwo from=coastal-ng-07\n' +
          'failed login user=aokonkwo from=coastal-ng-07\n' +
          'note: nearest city cluster LAGOS',
        'cat vpn.log': 'failed login … coastal-ng-07 … LAGOS',
        'cat evidence/geo.txt': 'approx: 6.45N 3.39E (Lagos coastal sector)\nconfidence: rising',
        'cat geo.txt': 'approx: 6.45N 3.39E (Lagos)',
        'grep signal evidence/network.log': 'SIGNAL: gateway-07 | status: ACTIVE | region=west_africa',
        'grep -i signal evidence/network.log': 'SIGNAL: gateway-07 | status: ACTIVE | region=west_africa',
        'grep failed evidence/vpn.log': 'failed login … coastal-ng-07',
        'grep -i lagos evidence/vpn.log': 'LAGOS'
      };
      files['cat /mission/briefing.txt'] = files['cat briefing.txt'];
    } else if (mid === 'rescue2') {
      evidenceList = 'route.log  decoys.txt  manifest.txt';
      files = {
        'cat briefing.txt':
          '[CASE ' + active.subject.ref + ']\n' +
          'Courier: Tunde Balogun.\n' +
          'Route logs contain DECOY IPs. Find the REAL hop.\n' +
          '→ Next: ls evidence/   then cat decoys.txt and route.log',
        'cat evidence/decoys.txt': 'DECOY 198.51.100.10\nDECOY 203.0.113.50\nDECOY 192.0.2.9',
        'cat decoys.txt': 'DECOY 198.51.100.10\nDECOY 203.0.113.50',
        'cat evidence/route.log':
          'hop 198.51.100.10 noise\n' +
          'hop 203.0.113.50 noise\n' +
          'hop REAL abuia-hub-01 city=ABUJA',
        'cat route.log': '… REAL abuia-hub-01 city=ABUJA',
        'grep real evidence/route.log': 'hop REAL abuia-hub-01 city=ABUJA',
        'grep REAL evidence/route.log': 'hop REAL abuia-hub-01 city=ABUJA',
        'cat evidence/manifest.txt': 'courier=Tunde Balogun\nstatus=missing\nlast_hub=ABUJA',
        'cat manifest.txt': 'courier=Tunde Balogun\nlast_hub=ABUJA'
      };
      files['cat /mission/briefing.txt'] = files['cat briefing.txt'];
    } else if (mid === 'rescue3') {
      evidenceList = 'radio.log  gps.log  auth.log';
      files = {
        'cat briefing.txt':
          '[CASE ' + active.subject.ref + ']\n' +
          'Unit: Team Falcon (lead Mira Chen).\n' +
          'Correlate radio.log, gps.log, auth.log.\n' +
          '→ Next: ls evidence/   then grep LAST radio.log',
        'cat evidence/radio.log': '03:10 chatter\n03:22 LAST BURST grid=PH-DELTA',
        'cat radio.log': '03:22 LAST BURST grid=PH-DELTA',
        'grep burst evidence/radio.log': '03:22 LAST BURST grid=PH-DELTA',
        'grep LAST evidence/radio.log': '03:22 LAST BURST grid=PH-DELTA',
        'cat evidence/gps.log': 'ping 03:22 grid=PH-DELTA conf=0.91',
        'cat gps.log': 'ping 03:22 grid=PH-DELTA',
        'grep ph-delta evidence/gps.log': 'grid=PH-DELTA',
        'grep PH evidence/gps.log': 'grid=PH-DELTA',
        'cat evidence/auth.log': 'sudo session user=mchen host=relay-9\nnote=Team Falcon lead Mira Chen',
        'cat auth.log': 'user=mchen host=relay-9 Mira Chen',
        'grep relay evidence/auth.log': 'host=relay-9',
        'grep mira evidence/auth.log': 'Mira Chen'
      };
      files['cat /mission/briefing.txt'] = files['cat briefing.txt'];
    } else if (mid === 'rescue4') {
      evidenceList = 'relay1.log  relay2.log  relay3.log  phantom.txt';
      files = {
        'cat briefing.txt':
          '[CASE RC-04-PHANTOM]\n' +
          'Identity broker vanished across three relays.\n' +
          '→ ls evidence/  then read relay1.log → relay2.log → relay3.log → phantom.txt',
        'cat evidence/relay1.log': 'HOP A status=ok city=LAGOS',
        'cat relay1.log': 'HOP A city=LAGOS',
        'grep hop evidence/relay1.log': 'HOP A city=LAGOS',
        'cat evidence/relay2.log': 'HOP B status=ok city=LOME',
        'cat relay2.log': 'HOP B city=LOME',
        'cat evidence/relay3.log': 'HOP C FINAL city=ACCRA',
        'cat relay3.log': 'FINAL city=ACCRA',
        'grep ACCRA evidence/relay3.log': 'FINAL city=ACCRA',
        'cat evidence/phantom.txt': 'alias=The Phantom\ntrue_name=Kofi Mensah\nrole=identity broker',
        'cat phantom.txt': 'true_name=Kofi Mensah',
        'grep kofi evidence/phantom.txt': 'true_name=Kofi Mensah',
        'grep mensah evidence/phantom.txt': 'true_name=Kofi Mensah'
      };
      files['cat /mission/briefing.txt'] = files['cat briefing.txt'];

    }
    FS['ls evidence/'] = evidenceList;
    FS['ls /mission/evidence'] = evidenceList;
    FS['ls /mission/evidence/'] = evidenceList;
    FS['ls evidence'] = evidenceList;

    // Print FS / file output whenever the command matches (any step)
    let printed = false;
    if (FS[n] !== undefined && FS[n] !== null) {
      st.log.push({ t: 'out', s: FS[n] });
      printed = true;
    } else if (files[n]) {
      st.log.push({ t: 'out', s: files[n] });
      printed = true;
    } else if (n.indexOf('cat ') === 0 && !files[n]) {
      st.log.push({
        t: 'bad',
        s: 'No such file. Try: ls    then    ls evidence/    then    cat briefing.txt'
      });
      printed = true;
    } else if (n.indexOf('grep ') === 0 && !files[n]) {
      st.log.push({
        t: 'bad',
        s: 'Nothing matched. Check the path, e.g. grep SIGNAL evidence/network.log'
      });
      printed = true;
    }

    const step = active.steps[st.step];
    const ok = step && step.expect.some(function (x) { return n === x; });
    if (ok) {
      st.log.push({ t: 'ok', s: '✔ ' + step.ok });
      // Vivid next-step nudge
      if (st.step + 1 < active.steps.length) {
        st.log.push({ t: 'sys', s: 'ECHO: ' + active.steps[st.step + 1].soft });
      }
      st.step++;
      if (st.step >= active.steps.length) {
        st.won = true;
        clearTick();
        const score = Math.max(0, Math.floor((st.ends - Date.now()) / 1000));
        saveProg(active.id, score);
        try {
          if (typeof tone === 'function') {
            tone(523, 0.12, 'triangle', 0.06, 0);
            tone(659, 0.15, 'triangle', 0.05, 0.1);
            tone(784, 0.25, 'triangle', 0.05, 0.22);
          }
        } catch (e) {}
        st.log.push({ t: 'sys', s: 'RESCUE COMPLETE — profile unlocked.' });
        try {
          if (typeof window.swShareWin === 'function') {
            const used = Math.max(0, Math.floor((active.minutes * 60) - (st.ends - Date.now()) / 1000));
            window.swShareWin({ gameId: active.id, score: score, timeSec: used });
          }
          if (typeof window.swUnlockCosmetic === 'function') window.swUnlockCosmetic(active.id);
        } catch (e) {}

        if (typeof window.gzReport === 'function') window.gzReport(active.id, 'complete', score);
        if (window.GH && typeof GH.finish === 'function') {
          try { GH.finish(active.id, true, 400 + score, 15); } catch (e) {}
        }
      }
    } else if (n.indexOf('submit') === 0) {
      st.log.push({
        t: 'bad',
        s:
          st.step < active.steps.length - 1
            ? 'Not enough evidence yet. Keep exploring — try: ls evidence/'
            : 'Name not confirmed. Re-read the briefing and logs, then submit the full name.'
      });
    } else if (!printed && !/^(ls|cat|grep|submit|hint|help|pwd|whoami)/.test(n)) {
      st.log.push({ t: 'bad', s: 'Unknown command. Type help or hint.' });
    }

    paintPlay();
  }

  function startMission(id) {
    const goRes = function () {

    const m = MISSIONS.find(function (x) { return x.id === id; });
    if (!m) return;
    const idx = MISSIONS.findIndex(function (x) { return x.id === id; });
    const p = prog();
    if (idx > 0 && !(p[MISSIONS[idx - 1].id] && p[MISSIONS[idx - 1].id].cleared)) {
      if (typeof toast === 'function') toast('Clear Mission ' + MISSIONS[idx - 1].n + ' first.');
      else if (typeof go === 'function') go('rescue');
      return;
    }
    clearTick();
    active = m;
    st = {
      step: 0,
      hints: 0,
      won: false,
      lost: false,
      ends: Date.now() + m.minutes * 60 * 1000,
      log: [
        { t: 'sys', s: 'RESCUE // ' + SERIES.subtitle + ' — Mission ' + m.n + ' loaded.' },
        { t: 'sys', s: m.title + ' · ' + m.difficulty + ' · ' + m.minutes + ' min' },
        { t: 'out', s: 'cwd: /mission' },
        { t: 'sys', s: 'ECHO: Start with  cat briefing.txt  — then  ls evidence/  to see clue files.' },
        { t: 'out', s: 'Type help for commands. Type hint if you get stuck.' }
      ]
    };
    if (typeof window.gzReport === 'function') window.gzReport(m.id, 'start', 0);
    tick = setInterval(function () {
      if (!st || st.won || st.lost) return clearTick();
      const left = st.ends - Date.now();
      const el = document.getElementById('rc-timer');
      if (el) {
        el.textContent = fmt(left);
        if (el.parentElement) el.parentElement.classList.toggle('rc-warn', left < 60000);
      }
      if (left <= 0) {
        st.lost = true;
        st.log.push({ t: 'bad', s: 'Timer expired. Target went dark.' });
        clearTick();
        paintPlay();
      }
    }, 250);
    paintPlay();
  
      window.__rescueBusy = (active && active.title) || id;
    };
    if (typeof window.swEnsureGameFree === 'function' && (window.__rescueBusy || (typeof MS !== 'undefined' && MS) || (typeof G !== 'undefined' && G))) {
      const nm = (typeof MISSIONS !== 'undefined' && MISSIONS.find(function(x){return x.id===id;}));
      window.swEnsureGameFree(nm ? nm.title : id, goRes);
    } else {
      goRes();
    }
  }

  function seriesHub() {
    const p = prog();
    const cleared = MISSIONS.filter(function (m) { return p[m.id] && p[m.id].cleared; }).length;
    const cards = MISSIONS.map(function (m, i) {
      const done = p[m.id] && p[m.id].cleared;
      const prevDone = i === 0 || (p[MISSIONS[i - 1].id] && p[MISSIONS[i - 1].id].cleared);
      const locked = !prevDone;
      return (
        '<article class="rc-ep' + (done ? ' done' : '') + (locked ? ' locked' : '') + '">' +
          '<div class="rc-ep-n">MISSION ' + esc(m.n) + '</div>' +
          '<h3>' + esc(m.title) + '</h3>' +
          '<p class="dim">' + esc(m.blurb) + '</p>' +
          '<div class="rc-ep-meta">' +
            '<span class="rc-diff">' + esc(m.difficulty) + '</span>' +
            '<span>' + m.minutes + ' min</span>' +
            '<span>' + m.steps.length + ' clues</span>' +
            (done ? '<span class="rc-cleared">✔ Cleared</span>' : locked ? '<span class="rc-lock">🔒 Clear Mission ' + MISSIONS[i - 1].n + ' first</span>' : '') +
          '</div>' +
          (locked
            ? '<button type="button" class="btn ghost rc-ep-go" disabled>Locked</button>'
            : '<button type="button" class="btn rc-ep-go" data-rescue="' + m.id + '">' + (done ? 'Replay →' : 'Deploy →') + '</button>') +
        '</article>'
      );
    }).join('');

    return (
      '<div class="rc-series">' +
        '<header class="rc-series-hero">' +
          '<div>' +
            '<div class="rc-kicker">' + esc(SERIES.subtitle).toUpperCase() + '</div>' +
            '<h2>' + esc(SERIES.title) + ' <span>Series</span></h2>' +
            '<p class="dim">' + esc(SERIES.tagline) + '</p>' +
          '</div>' +
          '<div class="rc-series-stat">' +
            '<b>' + cleared + '/' + MISSIONS.length + '</b>' +
            '<span>missions cleared</span>' +
          '</div>' +
        '</header>' +
        '<div class="rc-timeline" aria-hidden="true"><i></i><i></i><i></i></div>' +
        '<div class="rc-ep-grid">' + cards + '</div>' +
        '<p class="rc-fiction dim" style="text-align:center;margin-top:16px">All subjects and locations are fictional — training simulation only.</p>' +
        '<p style="text-align:center;margin-top:10px;display:flex;flex-wrap:wrap;gap:10px;justify-content:center">' +'<button type="button" class="btn ghost" id="rc-gz">◀ Game Zone</button>' +'<button type="button" class="btn ghost" id="rc-replay-intro">Replay intro</button></p>' +
      '</div>'
    );
  }



  let introDone = false;
  try { introDone = sessionStorage.getItem('rc_intro') === '1'; } catch (e) {}
  let introTimers = [];
  let audioCtx = null;
  let introMuted = false;
  try { introMuted = localStorage.getItem('rc_intro_mute') === '1'; } catch (e) {}

  function clearIntroTimers() {
    introTimers.forEach(function (t) { clearTimeout(t); });
    introTimers = [];
  }

  function getAudio() {
    if (introMuted) return null;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    } catch (e) { return null; }
  }

  function tone(freq, dur, type, gain, when) {
    const ctx = getAudio();
    if (!ctx) return;
    const t0 = ctx.currentTime + (when || 0);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.08, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  function noiseBurst(dur, gain, when) {
    const ctx = getAudio();
    if (!ctx) return;
    const t0 = ctx.currentTime + (when || 0);
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1200;
    g.gain.setValueAtTime(gain || 0.04, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(ctx.destination);
    src.start(t0);
  }

  function playIntroSfx() {
    // boot blip
    tone(220, 0.12, 'square', 0.05, 0);
    tone(440, 0.1, 'square', 0.04, 0.12);
    // sweep up
    const ctx = getAudio();
    if (ctx) {
      const t0 = ctx.currentTime + 0.4;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(120, t0);
      o.frequency.exponentialRampToValueAtTime(880, t0 + 1.2);
      g.gain.setValueAtTime(0.03, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.3);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t0);
      o.stop(t0 + 1.4);
    }
    noiseBurst(0.15, 0.03, 0.5);
    // title hit
    tone(523, 0.2, 'triangle', 0.07, 1.6);
    tone(659, 0.25, 'triangle', 0.06, 1.75);
    tone(784, 0.35, 'triangle', 0.05, 1.95);
    // bar complete
    tone(988, 0.15, 'sine', 0.05, 3.4);
    noiseBurst(0.08, 0.025, 3.4);
  }

  function paintIntro() {
    const pv = document.getElementById('pv');
    if (!pv) return;
    clearIntroTimers();
    pv.innerHTML =
      '<div class="rc-intro" id="rc-intro" role="dialog" aria-label="RESCUE series introduction">' +
        '<div class="rc-intro-vignette" aria-hidden="true"></div>' +
        '<div class="rc-intro-grid" aria-hidden="true"></div>' +
        '<div class="rc-intro-scan" aria-hidden="true"></div>' +
        '<div class="rc-intro-scan rc-intro-scan2" aria-hidden="true"></div>' +
        '<div class="rc-intro-hex" aria-hidden="true"></div>' +
        '<div class="rc-intro-glitch" aria-hidden="true" id="rc-glitch"></div>' +
        '<div class="rc-intro-inner">' +
          '<div class="rc-intro-line rc-i1" id="rc-l1">◈ CHANNEL SECURE</div>' +
          '<div class="rc-intro-line rc-i2" id="rc-l2">INCOMING TRANSMISSION — PRIORITY ALPHA</div>' +
          '<div class="rc-intro-line rc-i2b" id="rc-l2b">DECRYPTING PAYLOAD…</div>' +
          '<div class="rc-intro-code rc-i2c" id="rc-code" aria-hidden="true"></div>' +
          '<div class="rc-intro-line rc-i3">RESCUE // COMMAND CENTER</div>' +
          '<h1 class="rc-intro-title rc-i4">Operation<br><span id="rc-title-span">Digital Trace</span></h1>' +
          '<p class="rc-intro-tag rc-i5">Every command is a clue. Every second counts.</p>' +
          '<div class="rc-intro-bar rc-i6"><i id="rc-bar"></i></div>' +
          '<p class="rc-intro-sub rc-i7">3 missions · simulated terminal · live tactical map</p>' +
          '<div class="rc-intro-acts rc-i8">' +
            '<button type="button" class="btn rc-intro-btn" id="rc-intro-skip">Enter series</button>' +
            '<button type="button" class="btn ghost rc-intro-mute" id="rc-intro-mute" title="Toggle sound">' +
              (introMuted ? 'Sound off' : 'Sound on') +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    const skip = document.getElementById('rc-intro-skip');
    if (skip) skip.onclick = function () { endIntro(true); };
    const muteBtn = document.getElementById('rc-intro-mute');
    if (muteBtn) {
      muteBtn.onclick = function () {
        introMuted = !introMuted;
        try { localStorage.setItem('rc_intro_mute', introMuted ? '1' : '0'); } catch (e) {}
        muteBtn.textContent = introMuted ? 'Sound off' : 'Sound on';
        if (!introMuted) playIntroSfx();
      };
    }

    // typewriter hex noise
    const codeEl = document.getElementById('rc-code');
    if (codeEl) {
      let n = 0;
      const hex = '0123456789ABCDEF';
      const id = setInterval(function () {
        if (!document.getElementById('rc-code')) { clearInterval(id); return; }
        let line = '';
        for (let i = 0; i < 32; i++) line += hex[Math.floor(Math.random() * 16)];
        codeEl.textContent = line;
        n++;
        if (n > 24) clearInterval(id);
      }, 80);
      introTimers.push(id);
    }

    // glitch flash on title
    introTimers.push(setTimeout(function () {
      const g = document.getElementById('rc-glitch');
      if (g) g.classList.add('on');
      noiseBurst(0.06, 0.04, 0);
      introTimers.push(setTimeout(function () {
        if (g) g.classList.remove('on');
      }, 180));
    }, 2100));

    // unlock sound path on first gesture if needed — try play immediately
    playIntroSfx();

    // auto-enter after full sequence (~6.5s) if still on intro
    introTimers.push(setTimeout(function () {
      const el = document.getElementById('rc-intro');
      if (el && !el.classList.contains('rc-intro-out')) endIntro(false);
    }, 6500));
  }

  function endIntro(fromClick) {
    clearIntroTimers();
    if (fromClick) {
      tone(660, 0.08, 'sine', 0.06, 0);
      tone(990, 0.12, 'sine', 0.05, 0.08);
    }
    try { sessionStorage.setItem('rc_intro', '1'); } catch (e) {}
    introDone = true;
    const el = document.getElementById('rc-intro');
    if (el) {
      el.classList.add('rc-intro-out');
      setTimeout(function () {
        if (typeof go === 'function') go('rescue');
        else {
          const pv = document.getElementById('pv');
          if (pv) pv.innerHTML = seriesHub();
        }
      }, 500);
    } else if (typeof go === 'function') go('rescue');
  }

  RR().rescue = function () {
    st = null;
    active = null;
    clearTick();
    if (!introDone) {
      setTimeout(paintIntro, 0);
      return '<div class="rc-intro-wait dim" style="padding:24px">Establishing secure channel…</div>';
    }
    return seriesHub();
  };

  // Allow replaying intro from hub
  document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'rc-replay-intro') {
      e.preventDefault();
      try { sessionStorage.removeItem('rc_intro'); } catch (err) {}
      introDone = false;
      if (typeof go === 'function') go('rescue');
    }
  });


  document.addEventListener('click', function (e) {
    const sh = e.target.closest && e.target.closest('[data-rc-stage-hint]');
    if (sh) {
      e.preventDefault();
      const idx = parseInt(sh.getAttribute('data-rc-stage-hint'), 10);
      if (!st || st.won || st.lost || !active) return;
      if (idx !== st.step) {
        st.log.push({ t: 'sys', s: 'ECHO: Stage ' + (idx + 1) + ' is locked. Finish Stage ' + (st.step + 1) + ' first.' });
        paintPlay();
        return;
      }
      pushHint();
      paintPlay();
      return;
    }
    const goBtn = e.target.closest && e.target.closest('[data-rescue]');
    if (goBtn) {
      e.preventDefault();
      startMission(goBtn.getAttribute('data-rescue'));
      return;
    }
    if (e.target && e.target.id === 'rc-gz') {
      e.preventDefault();
      if (typeof go === 'function') go('gamezone');
    }
  });

  window.__rescueStop = function () {
    try { if (st) { st.won = true; clearTick && clearTick(); } } catch (e) {}
    window.__rescueBusy = null;
    if (typeof go === 'function') go('rescue');
  };
  window.startRescue = function (id) {
    if (typeof go === 'function') go('rescue');
    if (id) setTimeout(function () { startMission(id); }, 60);
  };
})();