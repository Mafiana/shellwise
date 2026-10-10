// games.js - game catalogue (paginated), 6 new browser games, 2 new terminal missions
(()=>{
'use strict';
const {ST,DEF}=window.UI;
const pvEl=()=>document.getElementById('pv');
const shuf=a=>a.slice().sort(()=>Math.random()-.5),pick=a=>a[Math.floor(Math.random()*a.length)];
const hs=()=>S.hs||(S.hs={});
const GL=[
{id:'rush',t:'Command Rush',ic:'⚡',cat:'Terminal',lvl:2,d:'60 seconds. Run the right command for each task. Streaks score more.',kind:'term'},
{id:'navigate',t:'Maze Hunt',ic:'🧩',cat:'Terminal',lvl:2,d:'Find flag.txt in a maze of folders before the clock runs out.',kind:'term'},
{id:'defuse',t:'Defuse the Bomb',ic:'💣',cat:'Terminal',lvl:3,d:'Five tasks in 45 seconds. Wrong commands cost time.',kind:'term'},
{id:'logdetective',t:'Log Detective',ic:'🕵️',cat:'Terminal',lvl:3,d:'A server was brute-forced. Dig through auth.log with grep, sort and uniq to answer three questions.',kind:'term'},
{id:'ctf',t:'CTF Warm-up',ic:'🚩',cat:'Terminal',lvl:2,d:'Find three hidden flags using ls, cat, grep and base64.',kind:'term'},
{id:'memory',t:'Command Match',ic:'🃏',cat:'Puzzle',lvl:1,d:'Flip cards to pair each command with what it does.',kind:'panel'},
{id:'cipher',t:'Cipher Breaker',ic:'🔐',cat:'Puzzle',lvl:2,d:'Decode Caesar, ROT13, Base64, hex and binary messages.',kind:'panel'},
{id:'hackle',t:'Hack-le',ic:'🟩',cat:'Puzzle',lvl:2,d:'Guess the 5-letter security word in 6 tries.',kind:'panel'},
{id:'phish',t:'Phishing Spotter',ic:'🎣',cat:'Knowledge',lvl:1,d:'Real or phishing? Judge 8 messages and learn the red flags.',kind:'panel'},
{id:'binary',t:'Binary Sprint',ic:'💾',cat:'Knowledge',lvl:2,d:'60 seconds of binary, hex and decimal conversions.',kind:'panel'},
{id:'ports',t:'Port Patrol',ic:'🔌',cat:'Knowledge',lvl:1,d:'Match services and port numbers as fast as you can.',kind:'panel'},
{id:'guess',t:'Guess the number',ic:'🔢',cat:'Arcade',lvl:1,d:'Find a number from 1 to 100.',kind:'term'},
{id:'hangman',t:'Hangman',ic:'🔤',cat:'Arcade',lvl:1,d:'Guess the security word letter by letter.',kind:'term'},
{id:'snake',t:'Snake',ic:'🐍',cat:'Arcade',lvl:2,d:'Type the right command in time and the snake eats the ball and grows. ',kind:'term'},
{id:'typing',t:'Typing test',ic:'⌨️',cat:'Arcade',lvl:1,d:'Type a phrase exactly and get your WPM.',kind:'term'},
{id:'rps',t:'Rock Paper Scissors',ic:'✊',cat:'Arcade',lvl:1,d:'First to 3 wins.',kind:'term'}];
const stars=n=>'★'.repeat(n)+'☆'.repeat(3-n);
DEF.games={
 items:()=>GL,
 match:(g,f,q)=>(f=='all'||g.cat==f)&&(!q||(g.t+' '+g.d+' '+g.cat).toLowerCase().includes(q)),
 card:(g,k)=>{const b=hs()[g.id];return `<article class="mc gc c-${g.cat}" style="--i:${k}"><div class=gban><span>${g.ic}</span></div><div class=mc-top><span class=mc-n>${g.cat}</span><span class=lvl title="Difficulty">${stars(g.lvl)}</span></div><h3>${g.t}</h3><p class=mc-d>${g.d}</p><div class=mc-ft><span class=dim>${b!==undefined?'Best: '+b:'Not played yet'}</span><button class=btn onclick="playGame('${g.id}')">Play</button></div></article>`}};
R.games=()=>{const w=S.gw;return `<h2>Games</h2><p class=dim>Win a game to earn 10 XP plus bonuses. Terminal games run in the Terminal tab; puzzle and knowledge games open right here.</p><div class=sumbar><div><b>${w}</b> games won <span class=dim>· ${GL.length} games</span></div></div><div class=tb><div class=fl role=group aria-label="Filter">${[['all','All'],['Terminal','Terminal'],['Puzzle','Puzzle'],['Commands','Commands'],['Knowledge','Knowledge'],['Arcade','Arcade']].map(([v,t])=>`<button data-f="${v}" class="${ST.games.f==v?'on':''}" onclick="LF('games','${v}')">${t}</button>`).join('')}</div><input class=sr type=search placeholder="Search games…" value="${esc(ST.games.q)}" oninput="LQ('games',this.value)" aria-label="Search games"></div><div id=lst class=pgrid></div><div id=pgr></div>`};
window.playGame=id=>{const g=GL.find(x=>x.id==id);if(g.kind=='term'){go('term');X(id)}else GAMES[id]()};

// ---------- shared helpers ----------
function shell(id,title,body){const g=GL.find(x=>x.id==id);pvEl().innerHTML=`<div id=gm class=gm><div class=gm-top><button class="btn ghost" onclick="go('games')">◀ Games</button><h2>${g.ic} ${title}</h2><div id=gst class=gst></div></div>${body}</div>`;pvEl().scrollTop=0}
const stat=h=>{const e=document.getElementById('gst');if(e)e.innerHTML=h};
function finish(id,won,score,extra){
 const b=hs()[id];if(typeof score=='number'&&(b===undefined||score>b))hs()[id]=score;
 if(won){win(id);if(extra)gain(extra);beep(1568,.2)}else beep(150,.4);sv();badges()}
const alive=id=>document.getElementById('gm')&&document.getElementById('gm').dataset.g==id;
const again=id=>`<div class=md-act><button class=btn onclick="GAMES.${id}()">↻ Play again</button><button class="btn ghost" onclick="go('games')">All games</button></div>`;
const mark=id=>{const e=document.getElementById('gm');if(e)e.dataset.g=id};
const GAMES=window.GAMES={};

// ---------- Command Match (memory) ----------
const PAIRS=[['ls','List files'],['cd','Change folder'],['pwd','Show location'],['cat','Print a file'],['grep','Search text'],['chmod','Change permissions'],['ping','Test a host'],['nmap','Scan ports'],['sudo','Run as admin'],['mkdir','Make a folder'],['rm','Delete files'],['tar','Archive files'],['ssh','Remote login'],['top','Live processes'],['find','Locate files'],['curl','Fetch a URL'],['df','Disk space'],['kill','Stop a process']];
GAMES.memory=()=>{
 const ps=shuf(PAIRS).slice(0,8),cards=shuf(ps.flatMap((p,i)=>[{k:i,t:p[0],c:1},{k:i,t:p[1],c:0}]));
 let first=null,lock=false,moves=0,found=0,t0=Date.now();
 shell('memory','Command Match',`<p class=dim>Match each command with its meaning.</p><div class=mem>${cards.map((c,i)=>`<button class="mcard" data-i="${i}" aria-label="Card ${i+1}"><span class=mf>?</span><span class=mb>${esc(c.t)}</span></button>`).join('')}</div>`);mark('memory');
 stat('Moves: 0');
 let over=false;const tick=setInterval(()=>{if(!alive('memory'))return clearInterval(tick);const l=Math.max(0,60-Math.floor((Date.now()-t0)/1000));stat(`Moves: ${moves} · ⏱ ${l}s left`);if(l<=0&&!over){over=true;lock=true;clearInterval(tick);finish('memory',false,found*50,0);document.getElementById('gm').insertAdjacentHTML('beforeend',`<div class="fb bad">⏱ Time is up! You matched ${found} of 8 pairs.</div>`+again('memory'))}},500); document.querySelectorAll('.mcard').forEach(b=>b.onclick=()=>{
  if(over||lock||b.classList.contains('up')||b.classList.contains('ok'))return;  b.classList.add('up');beep(660,.04);
  if(!first){first=b;return}
  moves++;const a=cards[+first.dataset.i],c=cards[+b.dataset.i];
  if(a.k==c.k&&a.c!=c.c){first.classList.add('ok');b.classList.add('ok');beep(1100,.08);first=null;if(++found==8){clearInterval(tick);const s=Math.floor((Date.now()-t0)/1000),st=moves<=12?3:moves<=18?2:1;finish('memory',true,Math.max(0,1000-moves*20-s*5),st*3);
   document.getElementById('gm').insertAdjacentHTML('beforeend',`<div class="fb ok">🎉 Done in ${moves} moves and ${s}s · ${stars(st)}</div>`+again('memory'))}}
  else{lock=true;const f=first;first=null;setTimeout(()=>{f.classList.remove('up');b.classList.remove('up');lock=false},750)}})};

// ---------- Cipher Breaker ----------
const WORDS=['kali','exploit','firewall','payload','network','terminal','shadow','packet','secure','hacker','gateway','sandbox','cipher','token'];
const PHR=['hack the planet','stay curious','always get permission','trust but verify','never share passwords','patch your systems','read the logs'];
const caesar=(s,k)=>s.replace(/[a-z]/g,c=>String.fromCharCode((c.charCodeAt(0)-97+k+26)%26+97));
const ENC=[
 ()=>{const k=1+Math.floor(Math.random()*9);return[`Caesar cipher, shifted +${k}`,t=>caesar(t,k)]},
 ()=>['ROT13',t=>caesar(t,13)],
 ()=>['Base64',t=>btoa(t)],
 ()=>['Hexadecimal (ASCII)',t=>[...t].map(c=>c.charCodeAt(0).toString(16)).join(' ')],
 ()=>['Reversed text',t=>[...t].reverse().join('')],
 ()=>['Binary (ASCII)',t=>[...t].map(c=>c.charCodeAt(0).toString(2).padStart(8,'0')).join(' ')]];
GAMES.cipher=()=>{
 let r=0,hints=0,wrong=0;const R5=[];
 for(let i=0;i<5;i++){const pl=i<2?pick(WORDS):pick(PHR),e=(i<2?pick(ENC.slice(0,5)):pick(ENC))();R5.push({pl,label:e[0],ct:e[1](pl)})}
 const show=()=>{
  if(r>=5){const sc=Math.max(0,500-hints*40-wrong*25);finish('cipher',true,sc,5);return shell('cipher','Cipher Breaker',`<div class="fb ok">🎉 All 5 messages decoded! Score ${sc} (${hints} hints, ${wrong} wrong guesses)</div>`+again('cipher')),mark('cipher')}
  const x=R5[r];shell('cipher','Cipher Breaker',`<p class=dim>Message ${r+1} of 5 · Method: <b>${x.label}</b></p><div class=cipher>${esc(x.ct)}</div><div class=row2><input id=cin class=sr placeholder="Type the decoded message" autocomplete=off autocapitalize=off spellcheck=false><button class=btn id=cgo>Check</button><button class="btn ghost" id=chint>Hint</button></div><div id=cfb></div>`);mark('cipher');stat(`Hints ${hints} · Wrong ${wrong}`);
  const inp2=document.getElementById('cin'),chk=()=>{const v=inp2.value.trim().toLowerCase();if(v==x.pl){beep(1100,.1);r++;show()}else{wrong++;beep(200,.2);inp2.classList.add('shake');setTimeout(()=>inp2.classList.remove('shake'),400);document.getElementById('cfb').innerHTML='<div class="fb bad">Not quite, try again.</div>';stat(`Hints ${hints} · Wrong ${wrong}`)}};
  document.getElementById('cgo').onclick=chk;inp2.onkeydown=e=>{if(e.key=='Enter')chk()};
  document.getElementById('chint').onclick=()=>{hints++;document.getElementById('cfb').innerHTML=`<div class=fb>Hint: it starts with "<b>${esc(x.pl[0])}</b>" and has ${x.pl.length} characters.</div>`;stat(`Hints ${hints} · Wrong ${wrong}`)};inp2.focus()};
 show()};

// ---------- Hack-le ----------
const HW=['admin','shell','proxy','token','virus','patch','crack','audit','cloud','cache','brute','spoof','login','query','vault','debug','linux','nodes','roots','trace','ports','salts','block','scans','forge'];
GAMES.hackle=()=>{
 // 6 lines = 6 different words. Each line shows its own hint letters; you get one guess per line, then the hint changes for the next line.
 const ws=[...HW].sort(()=>Math.random()-.5).slice(0,6);
 const hints=ws.map(()=>[0,1,2,3,4].sort(()=>Math.random()-.5).slice(0,3));
 let row=0,cur='',over=false,solved=0;const grid=[...Array(6)].map(()=>Array(5).fill(''));let ks={};
 const KB=['qwertyuiop','asdfghjkl','⏎zxcvbnm⌫'];
 const draw=()=>{const r0=Math.min(row,5),w=ws[r0],hn=hints[r0];
  document.getElementById('hkh').innerHTML=over?'':`<div class=dim style="margin-bottom:4px">Line ${r0+1} hint:</div><div class=hr>`+[...w].map((c,i)=>`<span class="hc ${hn.includes(i)?'hit':''}">${hn.includes(i)?c.toUpperCase():''}</span>`).join('')+`</div>`;
  document.getElementById('hk').innerHTML=grid.map((g,r)=>`<div class=hr>${g.map((c,i)=>`<span class="hc ${c.s||''}">${c.l||''}</span>`).join('')}</div>`).join('');
  document.getElementById('hkb').innerHTML=KB.map(l=>`<div class=kr>${[...l].map(k=>`<button class="key ${ks[k]||''}" onclick="HK('${k}')">${k}</button>`).join('')}</div>`).join('')};
 shell('hackle','Hack-le',`<p class=dim>Six lines, six different security words. Each line shows its own hint letters (green boxes). You get one guess per line, then the hint changes for the next word. Green = right spot, yellow = wrong spot, grey = not in word.</p><div id=hkt class=dim style="font-weight:700;margin-bottom:8px"></div><div id=hkf></div><div id=hkh style="margin-bottom:12px"></div><div id=hk class=hk></div><div id=hkb class=hkb></div>`);mark('hackle');
 for(let r=0;r<6;r++)for(let c=0;c<5;c++)grid[r][c]={l:'',s:''};
 const endGame=(late)=>{if(over)return;over=true;const win=solved>=3;finish('hackle',win,solved,win?3:0);
  document.getElementById('hkf').innerHTML=`<div class="fb ${win?'ok':'bad'}">${late?'⏱ Time is up! ':''}You solved ${solved} of 6.<br>The words are: ${ws.map(x=>`<b>${x.toUpperCase()}</b>`).join(', ')}.</div>`+again('hackle');
  draw();const f=document.getElementById('hkf');if(f&&f.scrollIntoView)f.scrollIntoView({block:'nearest'})};
 const submit=()=>{
  if(cur.length<5)return;const w=ws[row],res=Array(5).fill('absent'),rem=[...w];
  for(let i=0;i<5;i++)if(cur[i]==w[i]){res[i]='hit';rem[i]=null}
  for(let i=0;i<5;i++)if(res[i]!='hit'){const j=rem.indexOf(cur[i]);if(j>=0){res[i]='near';rem[j]=null}}
  for(let i=0;i<5;i++)grid[row][i]={l:cur[i].toUpperCase(),s:res[i]};
  if(cur==w)solved++;
  row++;cur='';ks={};
  if(row>=6){endGame(false);return}
  draw();stat(`Line ${row+1} of 6`)};
 window.HK=k=>{if(over)return;if(k=='⏎')submit();else if(k=='⌫'){cur=cur.slice(0,-1)}else if(cur.length<5&&/^[a-z]$/.test(k))cur+=k;if(row<6)grid[row].forEach((c,i)=>{grid[row][i]={l:(cur[i]||'').toUpperCase(),s:''}});draw()};
 const onkey=e=>{if(!alive('hackle'))return document.removeEventListener('keydown',onkey);if(e.ctrlKey||e.metaKey||e.altKey)return;if(e.key=='Enter'||e.key=='Backspace'||/^[a-zA-Z]$/.test(e.key)){e.preventDefault();if(document.activeElement&&document.activeElement.blur)document.activeElement.blur()}if(e.key=='Enter')HK('⏎');else if(e.key=='Backspace')HK('⌫');else if(/^[a-zA-Z]$/.test(e.key))HK(e.key.toLowerCase())};
 document.addEventListener('keydown',onkey);draw();stat('Line 1 of 6');
 let left=60;const tt=document.getElementById('hkt');const paint=()=>{tt.textContent='⏱ '+Math.floor(left/60)+':'+String(left%60).padStart(2,'0')+' left'};paint();
 const tm=setInterval(()=>{if(over||!alive('hackle')){clearInterval(tm);return}left--;paint();if(left<=0){clearInterval(tm);endGame(true)}},1000)};

// ---------- Phishing Spotter ----------
const MAILS=[
{f:'MegaBank Security <alerts@megabank-verify.co>',s:'Your account will be closed in 24 hours',b:'Dear customer, we noticed unusual activity. Verify your details now or your account will be closed.',l:'http://megabank-login.verify-now.co/secure',p:1,w:'Urgent threat, generic greeting and a look-alike domain (megabank-verify.co is not the bank).'},
{f:'CloudDrive <no-reply@clouddrive.com>',s:'Your monthly storage summary',b:'Hi Ada, you used 4.2 GB of your 15 GB this month. No action needed.',l:'clouddrive.com/account',p:0,w:'Expected message, correct domain, uses your name and asks for nothing urgent.'},
{f:'Payroll Dept <payroll@yourcompany-hr.net>',s:'Updated salary statement - open attachment',b:'Please review your new salary details in the attached file.',l:'Attachment: Salary_Q3.pdf.exe',p:1,w:'A double extension (.pdf.exe) hides an executable. The sender domain is not your company.'},
{f:'ShopHub Orders <orders@shophub.com>',s:'Your order #48213 has shipped',b:'Thanks for your purchase! Your parcel is on the way. Track it in your ShopHub account.',l:'shophub.com/track',p:0,w:'Matches an order you placed, correct domain, and you can check by logging in directly instead of clicking.'},
{f:'IT Helpdesk <it-help@company-support.xyz>',s:'Password expires TODAY - click to keep it',b:'Your password expires in 2 hours. Click below to keep your current password.',l:'http://pass-reset.company-support.xyz',p:1,w:'Artificial deadline plus an outside .xyz domain. Real IT teams do not ask this by email link.'},
{f:'Global Lucky Draw <winner@lucky-draw-intl.com>',s:'You won 500,000! Claim now',b:'Congratulations! Send a small processing fee to receive your prize.',l:'Reply with your bank details',p:1,w:'You cannot win a draw you never entered, and real prizes never need a fee up front.'},
{f:'Team Calendar <calendar@yourcompany.com>',s:'Reminder: Team meeting tomorrow 10:00',b:'Agenda: sprint review. Room 3 or video link in the invite.',l:'yourcompany.com/calendar',p:0,w:'Internal address, ordinary content, no pressure and no request for secrets.'},
{f:'SMS from +234 80 5555 0100',s:'Courier notice',b:'Your parcel is held. Pay a 200 fee: http://parcel-fee.top/pay',l:'http://parcel-fee.top/pay',p:1,w:'Smishing: unknown number, tiny fee, odd .top link. Couriers do not collect fees by random link.'},
{f:'StreamBox Security <security@streambox.com>',s:'New sign-in from Lagos',b:'We noticed a new sign-in. If this was you, no action is needed. If not, go to streambox.com and change your password.',l:'streambox.com/security',p:0,w:'Tells you to type the site address yourself, no urgency, correct domain.'},
{f:'CEO Office <ceo.office@gmail-mail.com>',s:'Urgent task, keep confidential',b:'I am in a meeting. Buy 5 gift cards and email me the codes now. I will reimburse you.',l:'Reply to this email',p:1,w:'Business email compromise: a boss using a free mail address and asking for gift card codes.'},
{f:'DevWeekly <hello@devweekly.io>',s:'This week\'s top articles',b:'Five reads for developers. Unsubscribe any time at the bottom.',l:'devweekly.io/unsubscribe',p:0,w:'A newsletter you subscribed to, with a normal unsubscribe link and no sensitive requests.'},
{f:'Support <help@paypal-support-team.info>',s:'Unusual login - confirm password',b:'Sign in with your password to confirm it was you.',l:'http://secure-signin.paypal-support-team.info',p:1,w:'A link asking for your password on a domain that only imitates a brand.'}];
GAMES.phish=()=>{
 const set=shuf(MAILS).slice(0,8);let i=0,sc=0;
 const show=()=>{
  if(i>=8){finish('phish',sc>=6,sc,sc>=8?10:5);return shell('phish','Phishing Spotter',`<div class="fb ${sc>=6?'ok':'bad'}">You judged ${sc} of 8 correctly. ${sc>=6?'Sharp eyes!':'Review the red flags and try again.'}</div>`+again('phish')),mark('phish')}
  const m=set[i];shell('phish','Phishing Spotter',`<div class=mail><div class=mh><b>From:</b> ${esc(m.f)}</div><div class=mh><b>Subject:</b> ${esc(m.s)}</div><div class=mbody>${esc(m.b)}</div><div class=mlink>🔗 ${esc(m.l)}</div></div><div class=md-act><button class=btn onclick="PH(0)">✅ Legit</button><button class="btn danger" onclick="PH(1)">🎣 Phishing</button></div><div id=pf></div>`);mark('phish');stat(`Message ${i+1}/8 · ${sc} correct`)};
 window.PH=v=>{const m=set[i],ok=v==m.p;if(ok){sc++;beep(1100,.08)}else beep(200,.2);
  document.getElementById('pf').innerHTML=`<div class="fb ${ok?'ok':'bad'}">${ok?'✔ Correct':'✘ Not quite'}: this one is <b>${m.p?'phishing':'legit'}</b>. ${esc(m.w)}</div><button class=btn onclick="i_next()">${i>=7?'Results':'Next ›'}</button>`;document.querySelectorAll('.md-act .btn').forEach(b=>b.disabled=true)};
 window.i_next=()=>{i++;show()};show()};

// ---------- sprint engine: Binary Sprint, Port Patrol ----------
function sprint(id,title,secs,goal,gen,mcq){
 let sc=0,tot=0,end=Date.now()+secs*1000,q=null,over=false;
 shell(id,title,`<div class=sprint><div id=sq class=sq></div><div id=sa></div><div id=sf></div></div>`);mark(id);
 const next=()=>{q=gen();document.getElementById('sq').textContent=q.q;
  document.getElementById('sa').innerHTML=mcq?`<div class=opts2>${shuf(q.opts).map(o=>`<button class=opt onclick="SP('${o}')">${o}</button>`).join('')}</div>`:`<div class=row2><input id=sin class=sr autocomplete=off autocapitalize=off spellcheck=false placeholder="Your answer"><button class=btn id=sgo>OK</button></div>`;
  if(!mcq){const i2=document.getElementById('sin');i2.onkeydown=e=>{if(e.key=='Enter')SP(i2.value)};document.getElementById('sgo').onclick=()=>SP(i2.value);i2.focus()}};
 window.SP=v=>{if(over)return;tot++;const ok=String(v).trim().toLowerCase()==String(q.a).toLowerCase();if(ok){sc++;beep(1100,.05)}else beep(200,.12);document.getElementById('sf').innerHTML=ok?'<span class=ok>✔</span>':`<span class=bad>✘ ${q.a}</span>`;next()};
 const t=setInterval(()=>{if(!alive(id)){over=true;return clearInterval(t)}const l=Math.max(0,Math.ceil((end-Date.now())/1000));stat(`⏱ ${l}s · ${sc} correct`);if(l<=10&&l>0)beep(800,.03);
  if(l<=0){clearInterval(t);over=true;finish(id,sc>=goal,sc,sc>=goal*1.5?8:3);document.getElementById('gm').insertAdjacentHTML('beforeend',`<div class="fb ${sc>=goal?'ok':'bad'}">Time! ${sc} correct out of ${tot}. ${sc>=goal?'Goal reached!':'Goal was '+goal+'.'}</div>`+again(id));document.getElementById('sa').innerHTML=''}},250);
 next()}
GAMES.binary=()=>sprint('binary','Binary Sprint',60,8,()=>{const t=Math.floor(Math.random()*4),n=1+Math.floor(Math.random()*(t>1?255:31));
 return t==0?{q:`Decimal ${n} in binary?`,a:n.toString(2)}:t==1?{q:`Binary ${n.toString(2)} in decimal?`,a:String(n)}:t==2?{q:`Decimal ${n} in hex?`,a:n.toString(16)}:{q:`Hex 0x${n.toString(16)} in decimal?`,a:String(n)}});
const PORTS=[[22,'SSH'],[23,'Telnet'],[25,'SMTP'],[53,'DNS'],[80,'HTTP'],[110,'POP3'],[143,'IMAP'],[443,'HTTPS'],[445,'SMB'],[3306,'MySQL'],[3389,'RDP'],[5432,'PostgreSQL'],[21,'FTP'],[389,'LDAP'],[161,'SNMP']];
GAMES.ports=()=>sprint('ports','Port Patrol',45,10,()=>{const [p,n]=pick(PORTS);const f=Math.random()<.5;
 if(f){const o=shuf(PORTS.filter(x=>x[0]!=p)).slice(0,3).map(x=>String(x[0]));return{q:`Which port does ${n} use?`,a:String(p),opts:[...o,String(p)]}}
 const o=shuf(PORTS.filter(x=>x[0]!=p)).slice(0,3).map(x=>x[1]);return{q:`Port ${p} is usually...`,a:n,opts:[...o,n]}},true);

// ---------- terminal missions: Log Detective and CTF ----------
let MS=null;
const msHud=()=>{if(!MS)return;const q=MS.qs[MS.i];hud(`<b class=hl>${MS.name}</b> · step ${MS.i+1}/${MS.qs.length}<div>${esc(q.p)}</div><div class=dim>Answer with: <b>submit ${esc(q.fmt)}</b> · <b>hint</b> · Ctrl+C quits</div>`)};
SH.stopMission=()=>{if(!MS)return;const m=MS;MS=null;m.clean();hud('');lesson&&lhud()};
function startMission(m){
 if(G||MS)return bad('another game is already running (Ctrl+C to quit)');
 MS=m;m.i=0;m.setup();msHud();P(`<span class=hl>${m.name}</span> started. ${esc(m.intro)}`)}
C.submit=a=>{
 if(!MS)return bad('bash: submit: no mission is running. Try: logdetective or ctf');
 const ans=a.join(' ').trim(),q=MS.qs[MS.i];if(!ans)return bad('usage: submit <answer>');
 if(q.ok(ans.toLowerCase())){beep(1320,.1);MS.i++;if(MS.i>=MS.qs.length){const m=MS;P(`<span class=ok>✔ Correct! Mission complete: ${m.name}</span>`);SH.stopMission();finish(m.id,true,m.qs.length*100,10)}else{P('<span class=ok>✔ Correct!</span>');msHud()}}
 else{beep(200,.2);P('<span class=bad>✘ That is not right. Keep investigating.</span>')}};
const oldHint=C.hint;
C.hint=a=>{if(MS)return P(`<span class=warn>${esc(MS.qs[MS.i].h)}</span>`);if(lesson&&M[cur()])return P(`<span class=warn>${esc(M[cur()].t)}</span>`);bad('bash: hint: command not found')};
C.logdetective=()=>{
 if(!done[6])return bad('Log Detective needs grep, sort and uniq. Finish module 7 (Searching text) first.');
 const log=get('/var/log/auth.log').c,fails=log.split('\n').filter(l=>/Failed password/.test(l)),cnt={},usr={};
 fails.forEach(l=>{const m=l.match(/for (?:invalid user )?(\S+) from (\S+)/);cnt[m[2]]=(cnt[m[2]]||0)+1;usr[m[1]]=(usr[m[1]]||0)+1});
 const top=Object.entries(cnt).sort((x,y)=>y[1]-x[1])[0][0],tu=Object.entries(usr).sort((x,y)=>y[1]-x[1])[0][0];
 const got=/Accepted password for \S+ from 203\.0\.113\.45/.test(log);
 startMission({id:'logdetective',name:'LOG DETECTIVE',intro:'The file is /var/log/auth.log. Investigate with grep, awk, sort and uniq -c.',setup(){cwd='/home/kali';setP()},clean(){},
  qs:[{p:'Which IP address has the most "Failed password" lines?',fmt:'<ip>',h:"Try: grep 'Failed password' /var/log/auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | head",ok:v=>v==top},
      {p:'Which username was targeted the most by that IP?',fmt:'<username>',h:"Try: grep "+top+" /var/log/auth.log | grep -o 'for [a-z]* from' | sort | uniq -c | sort -rn",ok:v=>v==tu},
      {p:'Did the attacker eventually log in successfully? (yes/no)',fmt:'yes|no',h:"Try: grep Accepted /var/log/auth.log",ok:v=>v==(got?'yes':'no')}]})};
// ---------- Linux Secret Hunter: three secrets, hidden differently every round ----------
C.hunt=()=>{
 if(!(done[0]&&done[1]&&done[2]&&done[3]))return bad('Secret Hunter needs pwd, ls, cd and cat. Finish modules 1 to 4 first.');
 const rn=n=>Math.floor(Math.random()*n),r=a=>a[rn(a.length)],sh=a=>a.slice().sort(()=>Math.random()-.5),home=ROOT.c.home.c.kali.c;
 const W1=['quiet','amber','rusty','silver','lucky','gentle','cosmic','swift','misty','bold'],W2=['fox','river','falcon','comet','lantern','harbor','maple','pebble','tiger','anchor'];
 const flag=()=>'flag{'+r(W1)+'_'+r(W2)+'_'+(100+rn(900))+'}';
 const DIRS=sh(['documents','projects','backup','photos','downloads','archive','reports','school','work','music']).slice(0,5);
 const DEC=[['todo.txt','buy milk\ncall mum\nfinish homework\n'],['readme.txt','Nothing interesting in here.\n'],['shopping.txt','rice\nbeans\ntomatoes\n'],['draft.txt','Dear team, the meeting is moved to Friday.\n'],['ideas.txt','learn linux\nbuild a website\nread about security\n'],['holiday.txt','Remember the flag day party on Saturday.\n']];
 const tree={};DIRS.forEach(d=>{tree[d]={};sh(DEC).slice(0,2).forEach(([n,t])=>tree[d][n]=t)});
 const styles=sh([
  {k:'hidden',h:'Hidden files start with a dot. Look inside the folders with: ls -a',put(f){tree[r(DIRS)]['.'+r(['token','private','old_key','keep'])]='secret: '+f+'\n'}},
  {k:'grep',h:'The secret is written inside a text file. Search every file at once: grep -r "flag{" ~/hunt',put(f){const d=r(DIRS),lines=[...Array(12)].map((_,i)=>'log entry '+(i+1)+': all good');lines[rn(12)]='access code: '+f;tree[d]['notes.txt']=lines.join('\n')+'\n'}},
  {k:'deep',h:'One file is buried in nested folders. Find it by name: find ~/hunt -name vault.key',put(f){const d=r(DIRS),a=r(['old','misc','stuff']),b=r(['2019','temp','keep']);tree[d][a]=tree[d][a]||{};tree[d][a][b]={'vault.key':'vault key: '+f+'\n'}}},
  {k:'named',h:'A file has "secret" in its name. Find it with: find ~/hunt -name "*secret*"',put(f){tree[r(DIRS)]['my_secret.txt']='shh... '+f+'\n'}}]).slice(0,3);
 const left=styles.map(s=>{s.flag=flag();return s});
 left.forEach(s=>s.put(s.flag));
 const build=t=>{const c={};Object.keys(t).forEach(n=>{c[n]=typeof t[n]=='string'?F(t[n]):build(t[n])});const d=D(c);d.o='kali';d.g='kali';d.ts=Date.now();return d};
 const own=t=>{Object.values(t.c).forEach(n=>{n.o='kali';n.g='kali';n.ts=Date.now();if(n.c&&typeof n.c=='object')own(n)})};
 const found=[];
 startMission({id:'hunt',name:'SECRET HUNTER',intro:'Three secrets are hidden somewhere inside the ~/hunt folder. Explore with ls, cd, find, grep and cat, then submit each one.',
  setup(){const root=build(tree);own(root);home.hunt=root;cwd='/home/kali';setP()},clean(){delete home.hunt},
  qs:[0,1,2].map(i=>({get p(){return `Secret ${i+1} of 3: find a hidden flag in ~/hunt`},fmt:'flag{...}',get h(){return left.length?left[0].h:'Look around with ls.'},
   ok:v=>{const k=left.findIndex(s=>s.flag.toLowerCase()==v);if(k<0)return false;left.splice(k,1);return true}}))})};
C.ctf=()=>{
 if(!done[6])return bad('CTF Warm-up needs ls, cat and grep. Finish module 7 (Searching text) first.');
 const f1='flag{hidden_in_plain_sight}',f2='flag{decoded_like_a_pro}',f3='flag{needle_in_a_haystack}',home=ROOT.c.home.c.kali.c;
 startMission({id:'ctf',name:'CTF WARM-UP',intro:'Open the ~/ctf folder and read README.txt.',
  setup(){const lines=[...Array(60)].map((_,i)=>`2026-10-03 02:${String(i%60).padStart(2,'0')} INFO worker-${i%4} heartbeat ok`);lines[37]=`2026-10-03 02:37 NOTICE secret=${f3}`;
   home.ctf=Object.assign(D({'README.txt':F('Three flags are hidden in this folder.\n1) One is in a hidden file.\n2) One is encoded in encoded.txt.\n3) One is buried in server.log.\nSubmit each flag with: submit flag{...}\n'),'.hidden_flag':F(f1+'\n'),'encoded.txt':F(btoa(f2)+'\n'),'server.log':F(lines.join('\n')+'\n'),notes:D({'todo.txt':F('nothing to see here\n')})}),{o:'kali',g:'kali',ts:Date.now()});
   Object.values(home.ctf.c).forEach(n=>{n.o='kali';n.g='kali';n.ts=Date.now()})},clean(){delete home.ctf},
  qs:[{p:'Flag 1: find the hidden file in ~/ctf',fmt:'flag{...}',h:'Hidden files start with a dot. Try: ls -a ~/ctf',ok:v=>v==f1},
      {p:'Flag 2: decode ~/ctf/encoded.txt',fmt:'flag{...}',h:'It is Base64. Try: base64 -d ~/ctf/encoded.txt',ok:v=>v==f2},
      {p:'Flag 3: find the secret inside ~/ctf/server.log',fmt:'flag{...}',h:'Try: grep secret ~/ctf/server.log',ok:v=>v==f3}]})};
window.GH={shell,stat,finish,alive,again,sprint,shuf,pick,mark,GL};
})();
