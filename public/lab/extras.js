// extras.js - certificate of completion, daily challenge + streaks, timed exam mode.
// Plan gates: daily needs Learner or higher, the exam and the certificate need Pro (see access.js).
// All data is kept in the browser (localStorage keys kdaily, kexam, kcert) and synced for paid accounts by the React app.
(function(){
 const FOUNDER='Mafiana C. Stanley';
 const $=s=>document.querySelector(s);
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pv=()=>document.getElementById('pv');
 const shuf=a=>a.slice().sort(()=>Math.random()-.5);
 const rd=(k,d)=>{try{const r=localStorage.getItem(k);if(!r||r.length>100000)return d;const o=JSON.parse(r);return o&&typeof o=='object'?o:d}catch(e){return d}};
 const wr=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
 const pad=n=>String(n).padStart(2,'0');
 // Shellwise message box (replaces the browser's confirm / alert). swConfirm(title,msg,okLabel,danger) -> Promise<boolean>; swAlert(title,msg,textToCopy) -> Promise.
 function dlg(t,m,ok,danger,cancel,res,txt){
  const old=document.getElementById('swdlg');if(old)old.remove();
  const o=document.createElement('div');o.id='swdlg';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');
  o.innerHTML=`<div class="up-s"></div><div class="up-p"><h2>${esc(t)}</h2><p>${esc(m)}</p>${txt?`<input class="sw-cp" readonly value="${esc(txt)}" aria-label="Text to copy">`:''}<div class="md-act">${cancel?`<button type="button" class="btn ghost" data-r="0">${esc(cancel)}</button>`:''}<button type="button" class="btn${danger?' danger':''}" data-r="1">${esc(ok)}</button></div></div>`;
  const prev=document.activeElement;let done1=false;
  const close=v=>{if(done1)return;done1=true;document.removeEventListener('keydown',kd,true);o.remove();try{prev&&prev.focus&&prev.focus()}catch(e){}res(v)};
  const kd=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(false)}else if(e.key==='Tab'){const f=[...o.querySelectorAll('button,input')];if(!f.length)return;const i=f.indexOf(document.activeElement);e.preventDefault();f[(i+(e.shiftKey?-1:1)+f.length)%f.length].focus()}else if(!/^(Enter| )$/.test(e.key)&&e.target&&!o.contains(e.target))e.stopPropagation()};
  document.addEventListener('keydown',kd,true);
  o.querySelector('.up-s').onclick=()=>close(false);
  o.querySelectorAll('button[data-r]').forEach(b=>b.onclick=()=>close(b.dataset.r==='1'));
  document.body.appendChild(o);
  const inp=o.querySelector('.sw-cp');if(inp){inp.focus();inp.select()}else{const b=o.querySelector(danger?'button[data-r="0"]':'button[data-r="1"]')||o.querySelector('button');b.focus()}}
 window.swConfirm=(t,m,ok,danger)=>new Promise(r=>dlg(t,m,ok||'OK',!!danger,'Cancel',r));
 window.swAlert=(t,m,txt)=>new Promise(r=>dlg(t,m,'OK',false,null,r,txt));
 const dkey=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
 const today=()=>dkey(new Date());
 const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
 const user=()=>{try{const o=JSON.parse(localStorage.getItem('kuser')||'null');return o&&!o.guest?o:null}catch(e){return null}};
 const gate=f=>{if(window.SWP&&!SWP.can(f)){window.upsell(f);return false}return true};

 // ---- question pool: topic quizzes plus the module questions the current plan opens
 function pool(){
  const lim=(window.SWP&&SWP.plan&&SWP.plan())||'free',maxMod={free:10,learner:35,pro:1e9}[lim];
  const out=[];
  TQ.forEach(t=>t.qs.forEach(q=>out.push(q)));
  Q.forEach((a,i)=>{if(i<maxMod)(a||[]).forEach(q=>out.push(q))});
  return out.filter(q=>Array.isArray(q)&&q.length>=3);
 }
 // seeded random so everyone gets the same daily set on the same date
 function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
 const seedOf=s=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0};

 // ---- sidebar buttons
 const side=document.getElementById('side');
 const careers=side&&side.querySelector('button[data-v=careers]');
 const mk=(v,label,feat)=>{const b=document.createElement('button');b.type='button';b.dataset.v=v;b.onclick=()=>go(v);b.dataset.feat=feat;const m=/^(\S+)\s+(.*)$/.exec(label),ic=m&&window.ICO&&window.ICO_MAP&&window.ICO_MAP[m[1]];if(ic){b.innerHTML=window.ICO(ic)+' ';b.appendChild(document.createTextNode(m[2]))}else b.textContent=label;side.insertBefore(b,careers);return b};
 if(side&&careers){mk('daily','🔥 Daily','daily');mk('exam','⏱️ Exam','exam');mk('cert','🎓 Certificate','cert')}
 function lockMarks(){side&&side.querySelectorAll('button[data-feat]').forEach(b=>{const lock=window.SWP&&!SWP.can(b.dataset.feat);b.classList.toggle('feat-lock',!!lock);b.title=lock?'Part of the '+SWP.name(SWP.need(b.dataset.feat))+' plan':''})}
 lockMarks();window.addEventListener('storage',lockMarks);
 const og=window.go;window.go=function(v){lockMarks();og(v)};

 // =====================================================================
 // DAILY CHALLENGE + STREAKS
 // =====================================================================
 const DAILY_N=5;
 const dd=()=>{const o=rd('kdaily',{});return{done:o.done&&typeof o.done=='object'?o.done:{},best:+o.best||0}};
 function streakOf(done){ // consecutive days ending today (or yesterday if today is still open)
  let d=new Date(),n=0;if(!done[dkey(d)])d=addDays(d,-1);
  while(done[dkey(d)]){n++;d=addDays(d,-1)}return n}
 const dailySet=()=>{const p=pool(),r=rng(seedOf('sw-'+today())),used=new Set(),out=[];
  while(out.length<DAILY_N&&used.size<p.length){const i=Math.floor(r()*p.length);if(!used.has(i)){used.add(i);out.push(p[i])}}return out};
 let DQ=null;
 function lockedCard(f,title,text){return `<div class="xt-lock"><div class="xt-lk">🔒</div><h3>${title}</h3><p>${text}</p><button class="btn" onclick="upsell('${f}')">Unlock with ${SWP.name(SWP.need(f))}</button></div>`}
 R.daily=function(){
  const D=dd(),t=today(),st=streakOf(D.done),doneToday=D.done[t]!==undefined;
  const cells=[];for(let i=27;i>=0;i--){const d=addDays(new Date(),-i),k=dkey(d);cells.push(`<i class="${D.done[k]!==undefined?'on':''}${k==t?' now':''}" title="${k}${D.done[k]!==undefined?': '+D.done[k]+'/'+DAILY_N:''}"></i>`)}
  const next=[3,7,14,30].find(m=>m>st)||null;
  const body=`<div class="xt-hero"><div class="xt-flame ${st?'lit':''}">🔥</div><div><div class="xt-big">${st}</div><div class="dim">day streak${D.best>st?` · best ${D.best}`:''}</div></div></div>
   <div class="xt-cal" aria-label="Last 28 days">${cells.join('')}</div>
   ${next?`<p class="dim">${next-st} more day${next-st==1?'':'s'} to a ${next}-day streak.</p>`:'<p class="dim">You are past a 30-day streak. Outstanding.</p>'}
   <div class="mc xt-card"><h3>Today's challenge</h3>
    ${doneToday?`<p>Done. You scored <b>${D.done[t]}/${DAILY_N}</b>. Come back tomorrow to keep your streak alive.</p><p class="dim">New challenge in ${hoursLeft()}.</p>`
    :`<p>${DAILY_N} questions, the same set for everyone today. Finish it to earn <b>${dailyXp(st+1)} XP</b> and extend your streak.</p><button class="btn" onclick="dcStart()">▶ Start today's challenge</button>`}</div>`;
  const locked=window.SWP&&!SWP.can('daily');
  return `<h2>Daily challenge</h2><p class=dim>One short set a day. Keep the streak going.</p>`+(locked?lockedCard('daily','Daily challenge and streaks','Build a habit with a new question set every day. Available on the Learner plan and above.'):body)};
 const hoursLeft=()=>{const n=new Date(),e=new Date(n.getFullYear(),n.getMonth(),n.getDate()+1),h=Math.ceil((e-n)/36e5);return h+' hour'+(h==1?'':'s')};
 const dailyXp=s=>20+5*Math.min(Math.max(s,1),6);
 window.dcStart=function(){if(!gate('daily'))return;if(dd().done[today()]!==undefined)return go('daily');
  const qs=dailySet();if(!qs.length)return;DQ={qs,i:0,score:0,ans:false};dcShow()};
 function dcShow(){
  const z=DQ,el=pv();if(!z)return;if(z.i>=z.qs.length)return dcEnd();
  const q=z.qs[z.i];z.opts=shuf(q.slice(1));z.ans=false;
  el.innerHTML=`<div class=qz><div class=qz-top><button class="btn ghost" onclick="dcQuit()">✕ Quit</button><div class=qz-t>🔥 Daily challenge</div><div class=qz-s>${z.score}/${z.i} correct</div></div><div class=qz-bar><i style="width:${z.i/z.qs.length*100}%"></i></div><div class=dim>Question ${z.i+1} of ${z.qs.length}</div><h3 class=qz-q>${esc(q[0])}</h3><div id=dqo>${z.opts.map((o,i)=>`<button class=opt onclick="dcAns(${i})"><span class=kb>${i+1}</span>${esc(o)}</button>`).join('')}</div><div id=dqf></div></div>`;el.scrollTop=0}
 window.dcAns=function(i){const z=DQ;if(!z||z.ans)return;z.ans=true;const q=z.qs[z.i],ok=z.opts[i]==q[1];
  document.querySelectorAll('#dqo .opt').forEach((b,j)=>{b.disabled=true;if(z.opts[j]==q[1])b.classList.add('right');else if(j==i)b.classList.add('wrong')});
  if(ok)z.score++;
  const last=z.i+1>=z.qs.length;
  $('#dqf').innerHTML=`<div class="fb ${ok?'ok':'bad'}">${ok?'✔ Correct!':'✘ Not quite. The answer is: <b>'+esc(q[1])+'</b>'}</div><button class=btn id=dqn onclick="dcNext()">${last?'Finish':'Next question ›'}</button>`;
  const nb=$('#dqn');if(nb)nb.focus()};
 window.dcNext=function(){if(!DQ)return;DQ.i++;dcShow()};
 window.dcQuit=function(){DQ=null;go('daily')};
 function dcEnd(){
  const z=DQ;DQ=null;const D=dd(),t=today();
  let xp=0,already=D.done[t]!==undefined;
  if(!already){D.done[t]=z.score;const st=streakOf(D.done);D.best=Math.max(D.best,st);
   // keep the record small: last 120 days only
   const keep={};Object.keys(D.done).sort().slice(-120).forEach(k=>keep[k]=D.done[k]);D.done=keep;wr('kdaily',D);
   xp=dailyXp(st);gain(xp);try{badges()}catch(e){}}
  const st=streakOf(dd().done);
  pv().innerHTML=`<div class=qz><h2>Daily challenge complete</h2><div class=res><div class=ring style="--p:${Math.round(z.score/z.qs.length*100)}"><b>${z.score}/${z.qs.length}</b></div><div><h3>${st>=2?'🔥 '+st+'-day streak':'Streak started'}</h3><p>${xp?`+${xp} XP earned.`:'Already counted today.'} Come back tomorrow.</p></div></div><div class=md-act><button class=btn onclick="go('daily')">Back to daily</button></div></div>`}

 // =====================================================================
 // TIMED EXAM MODE
 // =====================================================================
 const EXAMS=[{id:'q',name:'Quick check',n:15,min:12},{id:'s',name:'Standard',n:30,min:25},{id:'f',name:'Full exam',n:50,min:40}];
 const PASS=70;
 const ex=()=>{const o=rd('kexam',{});return{hist:Array.isArray(o.hist)?o.hist.slice(-20):[],passed:o.passed&&typeof o.passed=='object'?o.passed:{}}};
 let EX=null,exT=0;
 const fmt=s=>{s=Math.max(0,Math.floor(s));return pad(Math.floor(s/60))+':'+pad(s%60)};
 R.exam=function(){
  if(window.SWP&&!SWP.can('exam'))return `<h2>Timed exam mode</h2><p class=dim>Practise under real exam conditions.</p>`+lockedCard('exam','Timed exam mode','A countdown, no hints, no answers until the end, and a pass mark of '+PASS+'%. Available on the Pro plan and above.');
  if(EX&&!EX.over)return exView();
  if(EX&&EX.over)return exResult();
  const H=ex(),P=pool().length;
  return `<h2>Timed exam mode</h2><p class=dim>No feedback until you submit. Pass mark ${PASS}%. Answers can be changed and questions flagged until time runs out. The exam submits itself when the timer ends.</p>
   <div class="pgrid">${EXAMS.map(e=>`<article class="mc"><div class=mc-top><span class=mc-ic>⏱️</span><span class=mc-n>${e.min} min</span></div><h3>${e.name}</h3><p class=mc-d>${e.n} mixed questions from the content your plan opens.${H.passed[e.id]?' ✔ Passed before.':''}</p><div class=mc-ft><span class=dim>${P>=e.n?e.n+' questions':'Needs '+e.n+' questions'}</span><button class=btn ${P>=e.n?'':'disabled'} onclick="exStart('${e.id}')">Start</button></div></article>`).join('')}</div>
   ${H.hist.length?`<h3 style="margin-top:26px">Recent attempts</h3><div class="xt-hist">${H.hist.slice().reverse().slice(0,6).map(h=>`<div><b>${h.pct}%</b> <span class="${h.pass?'xt-p':'xt-f'}">${h.pass?'Passed':'Not passed'}</span> <span class=dim>${esc(h.name)} · ${h.score}/${h.of} · ${fmt(h.secs)} · ${esc(h.date)}</span></div>`).join('')}</div>`:''}`};
 window.exStart=function(id){if(!gate('exam'))return;const e=EXAMS.find(x=>x.id==id);if(!e)return;
  const qs=shuf(pool()).slice(0,e.n);if(qs.length<e.n)return;
  EX={e,qs:qs.map(q=>({q:q[0],a:q[1],opts:shuf(q.slice(1)),pick:-1,flag:false})),i:0,end:Date.now()+e.min*60000,t0:Date.now(),over:false};
  clearInterval(exT);exT=setInterval(exTick,500);go('exam')};
 function exTick(){if(!EX||EX.over){clearInterval(exT);return}
  const left=(EX.end-Date.now())/1000,el=$('#extm');if(el){el.textContent=fmt(left);el.classList.toggle('warn',left<60)}
  if(left<=0)exFinish(true)}
 function exView(){
  const z=EX,c=z.qs[z.i],ans=z.qs.filter(x=>x.pick>=0).length;
  return `<div class="qz xt-ex"><div class=qz-top><div class=qz-t>⏱️ ${z.e.name}</div><div class="xt-tm" id=extm>${fmt((z.end-Date.now())/1000)}</div><div class=qz-s>${ans}/${z.qs.length} answered</div></div>
   <div class=qz-bar><i style="width:${ans/z.qs.length*100}%"></i></div>
   <div class="xt-nav" role=group aria-label="Questions">${z.qs.map((x,k)=>`<button class="${k==z.i?'cur':''}${x.pick>=0?' ans':''}${x.flag?' flg':''}" onclick="exGo(${k})" aria-label="Question ${k+1}${x.flag?' flagged':''}">${k+1}</button>`).join('')}</div>
   <div class=dim>Question ${z.i+1} of ${z.qs.length}</div><h3 class=qz-q>${esc(c.q)}</h3>
   <div>${c.opts.map((o,k)=>`<button class="opt${c.pick==k?' sel':''}" onclick="exPick(${k})"><span class=kb>${k+1}</span>${esc(o)}</button>`).join('')}</div>
   <div class=md-act><button class="btn ghost" onclick="exGo(${z.i-1})" ${z.i?'':'disabled'}>‹ Previous</button><button class="btn ghost" onclick="exFlag()">${c.flag?'⚑ Unflag':'⚐ Flag'}</button><button class="btn ghost" onclick="exGo(${z.i+1})" ${z.i<z.qs.length-1?'':'disabled'}>Next ›</button><button class="btn" onclick="exSubmit()">Submit exam</button></div></div>`}
 const repaint=()=>{const v=pv();if(v&&document.querySelector('#side button[data-v=exam].on'))v.innerHTML=R.exam()};
 window.exGo=function(k){if(!EX||EX.over||k<0||k>=EX.qs.length)return;EX.i=k;repaint();pv().scrollTop=0};
 window.exPick=function(k){if(!EX||EX.over)return;EX.qs[EX.i].pick=k;repaint()};
 window.exFlag=function(){if(!EX||EX.over)return;EX.qs[EX.i].flag=!EX.qs[EX.i].flag;repaint()};
 window.exSubmit=function(){if(!EX||EX.over)return;const un=EX.qs.filter(x=>x.pick<0).length;
  if(!un){exFinish(false);return}
  swConfirm('Submit the exam?',un+' question'+(un==1?' is':'s are')+' unanswered. Submit anyway?','Submit exam').then(y=>{if(y&&EX&&!EX.over)exFinish(false)})};
 function exFinish(timeUp){
  const z=EX;if(!z||z.over)return;z.over=true;z.timeUp=timeUp;clearInterval(exT);
  z.secs=Math.min(z.e.min*60,Math.round((Date.now()-z.t0)/1000));
  z.score=z.qs.filter(x=>x.pick>=0&&x.opts[x.pick]==x.a).length;z.pct=Math.round(z.score/z.qs.length*100);z.pass=z.pct>=PASS;
  const H=ex();H.hist.push({id:z.e.id,name:z.e.name,score:z.score,of:z.qs.length,pct:z.pct,pass:z.pass,secs:z.secs,date:today()});
  z.xp=0;if(z.pass&&!H.passed[z.e.id]){H.passed[z.e.id]=1;z.xp=z.e.n*2;gain(z.xp)}
  wr('kexam',{hist:H.hist.slice(-20),passed:H.passed});
  if(document.querySelector('#side button[data-v=exam].on'))pv().innerHTML=R.exam();
  try{S.ex=(S.ex||0)+(z.pass?1:0);sv()}catch(e){}}
 function exResult(){
  const z=EX,wrong=z.qs.filter(x=>!(x.pick>=0&&x.opts[x.pick]==x.a));
  return `<div class=qz><h2>${z.timeUp?'Time is up':'Exam submitted'}</h2><div class=res><div class=ring style="--p:${z.pct}"><b>${z.pct}%</b></div><div><h3>${z.pass?'✔ Passed':'Not passed this time'}</h3><p>${z.score} of ${z.qs.length} correct · pass mark ${PASS}% · time ${fmt(z.secs)}</p>${z.xp?`<p>+${z.xp} XP for your first pass.</p>`:''}</div></div>
   ${wrong.length?`<h3>Review</h3>${wrong.map(x=>`<div class=miss><div>${esc(x.q)}</div><div class=dim>Your answer: ${x.pick>=0?esc(x.opts[x.pick]):'not answered'}</div><div class=ok>✔ ${esc(x.a)}</div></div>`).join('')}`:'<div class="fb ok">Perfect. Every answer was right.</div>'}
   <div class=md-act><button class=btn onclick="exAgain()">New exam</button></div></div>`}
  window.exSetLeft=function(ms){if(EX&&!EX.over)EX.end=Date.now()+ms};
 window.exAgain=function(){EX=null;go('exam')};

 // =====================================================================
 // CERTIFICATE OF COMPLETION
 // =====================================================================
 // The certificate (Pro) is earned by finishing everything: all modules, all quizzes (70% or better), all games (won once) and all missions.
 const PASSQ=70;
 function reqs(){
  const gl=(window.GH&&GH.GL)||[],qb=(S&&S.qb)||{},gw=(S&&S.gwon)||{},ms=rd('kctf',{}).solved||{},D=window.SWD,mis=D?D.packs.flatMap(p=>p.cs.map(c=>c.id)):[];
  const qids=[...TQ.map(t=>t.id),...M.map((m,i)=>'m'+i)];
  return[
   {k:'mods',ic:'📚',t:'Modules',n:done.slice(0,M.length).filter(Boolean).length,total:M.length,go:'mods'},
   {k:'quiz',ic:'🧠',t:'Quizzes passed ('+PASSQ+'%+)',n:qids.filter(id=>qb[id]&&qb[id].pct>=PASSQ).length,total:qids.length,go:'quiz'},
   {k:'games',ic:'🎮',t:'Games won',n:gl.filter(g=>gw[g.id]).length,total:gl.length,go:'games'},
   {k:'ms',ic:'🚩',t:'Missions captured',n:mis.filter(id=>ms[id]!==undefined).length,total:mis.length,go:'ctf'}]}
 const finished=()=>reqs().every(r=>r.total>0&&r.n>=r.total);
 function certInfo(){
  const u=user(),name=(u&&(u.name||u.user))||'';
  let c=rd('kcert',{});
  if(finished()&&!c.date){c={date:Date.now()};wr('kcert',c)}
  const when=c.date?new Date(c.date):null;
  // The ID is made from the account (email + username + id) and the completion time, so every learner gets a different one.
  const seed=[(u&&u.email)||'',(u&&u.user)||'',(u&&u.id)||'',name,c.date||0].join('|');
  const hs=(str,sd)=>{let h=sd>>>0;for(let i=0;i<str.length;i++)h=Math.imul(h^str.charCodeAt(i),16777619)>>>0;return h};
  const id='SW-'+(hs(seed,2166136261).toString(36)+hs(seed.split('').reverse().join(''),374761393).toString(36)).toUpperCase().padStart(12,'0').slice(0,12);
  return{name,when,id}}
 const dateStr=d=>d?d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}):'';
 // Hand-drawn style signature of the founder (SVG path, 220x80). Used on the page and on the downloaded image.
 // The founder's signature image (public/lab/signature.svg). Used on the page and on the downloaded image.
 const sigSvg='<img class="cert-sg" src="signature.svg" alt="Signature of '+FOUNDER+'">';
 function certHtml(ci,preview){
  return `<div class="cert-wrap"><div class="cert ${preview?'prev':''}" id="certbox"><div class="cert-in">
   <div class="cert-seal">★</div>
   <p class="cert-k">SHELLWISE</p><h2 class="cert-t">Certificate of Completion</h2>
   <p class="cert-s">This certifies that</p><p class="cert-n">${esc(ci.name||'Your name')}</p>
   <p class="cert-s">has completed every module, quiz, game and mission of the Shellwise Linux and cybersecurity practice lab.</p>
   <div class="cert-f"><div class="cert-col"><div class="cert-top"><b>${ci.when&&!preview?esc(dateStr(ci.when)):'&nbsp;'}</b></div><div class="cert-ln"><span>Date of completion</span></div></div><div class="cert-col"><div class="cert-top">${sigSvg}</div><div class="cert-ln"><b>${esc(FOUNDER)}</b><span>Founder, Shellwise</span></div></div></div>
   ${preview?'':`<p class="cert-id"><span>Certificate ID</span><code>${esc(ci.id)}</code></p>`}
   <p class="cert-d">Awarded for completing practice-lab coursework. This is not an industry certification or exam credential.</p></div></div></div>`}
 R.cert=function(){
  const can=!window.SWP||SWP.can('cert'),ci=certInfo(),u=user(),rq=reqs(),fin=finished(),ok=can&&!!u&&fin;
  let top='';
  if(!can)top=lockedCard('cert','Certificate of completion','Finish every module, quiz, game and mission to earn a certificate with your name on it. Available on the Pro plan.');
  else if(!u)top=`<div class="xt-lock"><div class="xt-lk">🎓</div><h3>Sign in to get your certificate</h3><p>Your certificate carries your name, so it needs an account.</p></div>`;
  else top=`<div class="mc cert-req"><h3>${fin?'🎉 Everything is complete':'What you still need'}</h3>${rq.map(r=>{const pc=Math.round(Math.min(1,r.n/Math.max(1,r.total))*100);return `<div class="cr-row ${r.n>=r.total?'ok':''}"><span class="cr-t">${r.ic} ${r.t}</span><span class="cr-n">${r.n} / ${r.total}</span><div class="cr-b"><i style="width:${pc}%"></i></div>${r.n>=r.total?'<em>✔ Done</em>':`<button class="btn ghost" onclick="go('${r.go}')">Open</button>`}</div>`}).join('')}</div>`;
  const act=can&&u?`<div class="md-act"><button class="btn cert-dl${ok?'':' locked'}" ${ok?'onclick="certPng()"':'disabled aria-disabled="true" title="Complete every requirement to unlock"'}>${ok?'⬇':'🔒'} Download certificate</button>${ok?'<button class="btn ghost" onclick="window.print()">🖨 Print or save as PDF</button>':''}</div>`:'';
  return `<h2>Certificate of completion</h2><p class=dim>Awarded when you finish all modules, quizzes, games and missions.</p>${top}${act}${certHtml(ci,!ok)}`};
 window.certPng=function(){
  if(!(SWP.can('cert')&&user()&&finished()))return;
  const ci=certInfo(),W=1600,H=1131,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  let sg=null;
  const go2=()=>{
   x.fillStyle='#fbf7ee';x.fillRect(0,0,W,H);
   x.strokeStyle='#1d3a6b';x.lineWidth=10;x.strokeRect(40,40,W-80,H-80);x.strokeStyle='#c9a24a';x.lineWidth=3;x.strokeRect(64,64,W-128,H-128);
   x.textAlign='center';x.fillStyle='#1d3a6b';
   x.font='600 30px Georgia,serif';x.fillText('S H E L L W I S E',W/2,170);
   x.font='italic 400 92px "Instrument Serif",Georgia,serif';x.fillText('Certificate of Completion',W/2,300);
   x.fillStyle='#4a5875';x.font='400 34px Georgia,serif';x.fillText('This certifies that',W/2,400);
   x.fillStyle='#0b1b3a';let fs=120;x.font=`400 ${fs}px "Instrument Serif",Georgia,serif`;while(x.measureText(ci.name).width>W-300&&fs>50){fs-=6;x.font=`400 ${fs}px "Instrument Serif",Georgia,serif`}
   x.fillText(ci.name,W/2,540);x.strokeStyle='#c9a24a';x.lineWidth=2;x.beginPath();x.moveTo(300,575);x.lineTo(W-300,575);x.stroke();
   x.fillStyle='#4a5875';x.font='400 34px Georgia,serif';
   const line='has completed every module, quiz, game and mission of the Shellwise',line2='Linux and cybersecurity practice lab.';
   x.fillText(line,W/2,660);x.fillText(line2,W/2,708);
   x.fillStyle='#0b1b3a';x.font='600 34px Georgia,serif';
   x.fillText(dateStr(ci.when),460,884);x.fillText(FOUNDER,W-460,940);
   if(sg&&sg.naturalWidth){const sh=118,sw=sh*sg.naturalWidth/sg.naturalHeight;x.drawImage(sg,W-460-sw/2,894-sh,sw,sh)}
   x.strokeStyle='#8a94aa';x.lineWidth=2;[460,W-460].forEach(cx=>{x.beginPath();x.moveTo(cx-210,900);x.lineTo(cx+210,900);x.stroke()});
   x.fillStyle='#6b7690';x.font='400 26px Georgia,serif';x.fillText('Founder, Shellwise',W-460,978);x.fillText('Date of completion',460,940);
   x.textAlign='center';x.fillStyle='#8a6a1e';x.font='600 22px "Courier New",monospace';x.fillText('CERTIFICATE ID',W/2-150,1018);x.fillStyle='#1d3a6b';x.font='700 30px "Courier New",monospace';x.fillText(ci.id,W/2+80,1018);
   x.font='italic 400 24px Georgia,serif';x.fillText('Awarded for completing practice-lab coursework. This is not an industry certification or exam credential.',W/2,1058);
   c.toBlob(b=>{if(!b)return;const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='shellwise-certificate.png';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)},'image/png')};
  const loadSig=new Promise(r=>{const im=new Image();im.onload=()=>{sg=im;r()};im.onerror=()=>r();im.src='signature.svg'});
  Promise.all([loadSig,document.fonts&&document.fonts.load?document.fonts.load('400 40px "Instrument Serif"').catch(()=>{}):Promise.resolve()]).then(go2,go2)};
})();
