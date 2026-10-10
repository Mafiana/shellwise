// ui.js - paginated Modules / Quizzes / Games, quiz engine, progress page
(()=>{
'use strict';
const PER=6;
let curV='term';
const go0=window.go;
window.go=function(v){curV=v;QZS=null;go0(v);if(DEF[v])fill(v)};
const pvEl=()=>document.getElementById('pv');
const shuf=a=>a.slice().sort(()=>Math.random()-.5);
const short=(s,n)=>{s=plain(s);return s.length>n?s.slice(0,n-1)+'…':s};
const hs=()=>S.hs||(S.hs={}),qb=()=>S.qb||(S.qb={});
const ST={mods:{p:0,f:'all',q:''},quiz:{p:0,f:'all',q:''},games:{p:0,f:'all',q:''}};
const DEF={};
window.UI={ST,DEF};

// ---------- generic paginated listing ----------
function pagerHTML(key,total){
 const pages=Math.max(1,Math.ceil(total/PER)),p=ST[key].p;
 if(pages<2)return total?`<div class=pgi>${total} item${total==1?'':'s'}</div>`:'';
 const set=new Set([0,pages-1,p-1,p,p+1]);const nums=[];let last=-1;
 [...set].filter(n=>n>=0&&n<pages).sort((a,b)=>a-b).forEach(n=>{if(last>=0&&n-last>1)nums.push('<span class=pgd>…</span>');nums.push(`<button class="pn ${n==p?'on':''}" onclick="PG('${key}',${n})" aria-label="Page ${n+1}" ${n==p?'aria-current=page':''}>${n+1}</button>`);last=n});
 return `<nav class=pg aria-label="Pagination"><button class=pn ${p==0?'disabled':''} onclick="PG('${key}',${p-1})" aria-label="Previous page">‹</button>${nums.join('')}<button class=pn ${p==pages-1?'disabled':''} onclick="PG('${key}',${p+1})" aria-label="Next page">›</button></nav><div class=pgi>Page ${p+1} of ${pages} · ${total} items · use ← → keys</div>`}
function fill(key){
 const d=DEF[key],s=ST[key],q=s.q.trim().toLowerCase();
 const items=d.items().filter(it=>d.match(it,s.f,q));
 const pages=Math.max(1,Math.ceil(items.length/PER));if(s.p>=pages)s.p=pages-1;if(s.p<0)s.p=0;
 const L1=document.getElementById('lst'),P1=document.getElementById('pgr');if(!L1)return;
 L1.innerHTML=items.slice(s.p*PER,s.p*PER+PER).map((it,k)=>d.card(it,k)).join('')||'<div class=empty>Nothing matches. Try another filter or search.</div>';
 P1.innerHTML=pagerHTML(key,items.length)}
function frame(key,title,sub,top,filters,ph){
 const s=ST[key];
 return `<h2>${title}</h2><p class=dim>${sub}</p>${top}<div class=tb><div class=fl role=group aria-label="Filter">${filters.map(([v,t])=>`<button data-f="${v}" class="${s.f==v?'on':''}" onclick="LF('${key}','${v}')">${t}</button>`).join('')}</div><input class=sr type=search placeholder="${ph}" value="${esc(s.q)}" oninput="LQ('${key}',this.value)" aria-label="Search"></div><div id=lst class=pgrid></div><div id=pgr></div>`}
window.PG=(key,n)=>{ST[key].p=n;fill(key);pvEl().scrollTop=0};
window.LF=(key,f)=>{ST[key].f=f;ST[key].p=0;document.querySelectorAll('.fl button').forEach(b=>b.classList.toggle('on',b.dataset.f==f));fill(key)};
window.LQ=(key,v)=>{ST[key].q=v;ST[key].p=0;fill(key)};
function refresh(key){const el=pvEl();el.innerHTML=R[key]();fill(key)}
document.addEventListener('keydown',e=>{
 if(!DEF[curV]||pvEl().style.display=='none'||/INPUT|TEXTAREA/.test((e.target||{}).tagName||''))return;
 if(QZS||document.getElementById('gm'))return;
 const key=curV,total=DEF[key].items().filter(it=>DEF[key].match(it,ST[key].f,ST[key].q.trim().toLowerCase())).length,pages=Math.ceil(total/PER);
 if(e.key=='ArrowRight'&&ST[key].p<pages-1)PG(key,ST[key].p+1);
 if(e.key=='ArrowLeft'&&ST[key].p>0)PG(key,ST[key].p-1)});

// ---------- modules ----------
const stOf=i=>done[i]?'done':i==cur()?'now':'lock';
const lvCls=l=>l=='Beginner'?'lb':l=='Intermediate'?'li':'la';
DEF.mods={
 items:()=>M.map((m,i)=>i),
 match:(i,f,q)=>(f=='all'||stOf(i)==f||(f=='open'&&stOf(i)!='lock'))&&(!q||(M[i].n+' '+M[i].c.join(' ')+' '+MI[i][1]).toLowerCase().includes(q)),
 card:(i,k)=>{const m=M[i],s=stOf(i),[ic,lv]=MI[i];
  return `<article class="mc st-${s}" style="--i:${k}"><div class=mc-top><span class=mc-ic>${ic}</span><span class=mc-n>#${String(i+1).padStart(2,'0')}</span><span class="lv ${lvCls(lv)}">${lv}</span></div><h3>${esc(m.n)}</h3><p class=mc-d>${esc(short(m.d,112))}</p><div class=chips>${m.c.slice(0,5).map(c=>`<span class=chip2>${esc(c)}</span>`).join('')}${m.c.length>5?`<span class=chip2>+${m.c.length-5}</span>`:''}</div><div class=mc-ft><span class="stt ${s}">${s=='done'?'✔ Completed':s=='now'?'▶ Up next':'🔒 Locked'}</span>${s=='lock'?`<span class=dim>Finish #${cur()+1} first</span>`:`<button class=btn onclick="modOpen(${i})">${s=='now'?'Open lesson':'Review'}</button>`}</div></article>`}};
R.mods=()=>{const n=done.filter(Boolean).length,pc=Math.round(n/M.length*100);
 return frame('mods','Modules',`${M.length} guided lessons. Finish them in order; each one unlocks new commands in lessons. The Terminal tab is always open for free practice.`,
 `<div class=sumbar><div><b>${n}</b> of ${M.length} completed <span class=dim>· ${pc}%</span></div><div class=xpb style="height:8px"><i style="width:${pc}%"></i></div></div>`,
 [['all','All'],['done','Completed'],['now','Up next'],['lock','Locked']],'Search modules or commands…')};
window.modOpen=i=>{
 const m=M[i],s=stOf(i),[ic,lv]=MI[i],el=pvEl();
 el.innerHTML=`<div class="md"><button class="btn ghost" onclick="go('mods')">◀ All modules</button><div class=md-h><span class=md-ic>${ic}</span><div><div class=dim>Module ${i+1} of ${M.length} · <span class="lv ${lvCls(lv)}">${lv}</span></div><h2>${esc(m.n)}</h2></div></div><section><h3>What you will learn</h3><p>${m.d}</p></section><section><h3>Commands unlocked</h3><div class=chips>${m.c.map(c=>`<span class=chip2>${esc(c)}</span>`).join('')}</div></section><section><h3>Your task</h3><div class=task>${esc(m.t)}</div></section><div class=md-act>${s=='now'?`<button class=btn onclick="startLesson()">▶ Start lesson</button>`:`<button class=btn onclick="go('term')">Practice in terminal</button>`}${done[i]?`<button class="btn ghost" onclick="go('quiz');qzStart('m${i}')">🧠 Take the quiz</button>`:''}</div><div class=md-nav>${i>0?`<button class="btn ghost" onclick="modOpen(${i-1})" ${stOf(i-1)=='lock'?'disabled':''}>‹ Previous</button>`:'<span></span>'}${i<M.length-1&&stOf(i+1)!='lock'?`<button class="btn ghost" onclick="modOpen(${i+1})">Next ›</button>`:'<span></span>'}</div></div>`;el.scrollTop=0};

// ---------- quizzes ----------
const topicSets=()=>TQ.map(t=>({id:t.id,t:t.t,ic:t.ic,kind:'topic',d:t.d,qs:()=>t.qs,locked:false}));
const modSets=()=>M.map((m,i)=>({id:'m'+i,t:m.n,ic:MI[i][0],kind:'mod',d:'Commands: '+m.c.slice(0,4).join(', '),qs:()=>Q[i]||[],locked:!done[i],need:i+1}));
const mixSet=()=>({id:'mix',t:'Mixed review',ic:'🎲',kind:'mix',d:'Random questions from every module you finished plus all topic quizzes.',qs:()=>[...M.flatMap((m,i)=>done[i]?Q[i]||[]:[]),...TQ.flatMap(t=>t.qs)],locked:false});
const allSets=()=>[mixSet(),...topicSets(),...modSets()];
const setById=id=>allSets().find(s=>s.id==id);
DEF.quiz={
 items:()=>allSets(),
 match:(s,f,q)=>(f=='all'||(f=='open'?!s.locked:s.kind==f))&&(!q||(s.t+' '+s.d).toLowerCase().includes(q)),
 card:(s,k)=>{const b=qb()[s.id],n=s.qs().length,pc=b?Math.round(b.best/b.of*100):null;
  return `<article class="mc qc ${s.locked?'st-lock':'st-open'}" style="--i:${k}"><div class=mc-top><span class=mc-ic>${s.ic}</span><span class=mc-n>${s.kind=='mod'?'Module quiz':s.kind=='topic'?'Topic':'Review'}</span></div><h3>${esc(s.t)}</h3><p class=mc-d>${esc(short(s.d,100))}</p><div class=mc-ft><span class=dim>${n} question${n==1?'':'s'}${pc!==null?` · best ${pc}% ${pc==100?'⭐':''}`:''}</span>${s.locked?`<span class="stt lock">🔒 Finish module ${s.need}</span>`:`<button class=btn onclick="qzStart('${s.id}')">${b?'Retry':'Start'}</button>`}</div>${pc!==null?`<div class=xpb style="margin-top:8px"><i style="width:${pc}%"></i></div>`:''}</article>`}};
R.quiz=()=>{const t=Object.keys(qb()).length;
 return frame('quiz','Quizzes',`Module quizzes unlock when you finish the module. Topic quizzes are open to everyone. Each correct answer gives 5 XP, a perfect score gives +20.`,
 `<div class=sumbar><div><b>${S.qc}</b> correct answers <span class=dim>· ${t} quiz${t==1?'':'zes'} attempted</span></div></div>`,
 [['all','All'],['topic','Topics'],['mod','Modules'],['open','Unlocked']],'Search quizzes…')};
let QZS=null;
window.qzStart=id=>{const s=setById(id);if(!s||s.locked)return;const pool=s.qs();if(!pool.length)return;
 if(QZS&&QZS.tm)clearInterval(QZS.tm);
 QZS={s,qs:shuf(pool).slice(0,25),i:0,score:0,streak:0,best:0,wrong:[],ans:false,log:[],left:120};
 const z=QZS;z.tm=setInterval(()=>{if(QZS!==z||z.over){clearInterval(z.tm);return}z.left--;qzClock();if(z.left<=0){clearInterval(z.tm);qzEnd(true)}},1000);qzShow()};
const qzFmt=t=>Math.floor(Math.max(0,t)/60)+':'+String(Math.max(0,t)%60).padStart(2,'0');
function qzClock(){const z=QZS,e=document.getElementById('qzt');if(!z||!e)return;e.textContent='⏱ '+qzFmt(z.left);e.classList.toggle('warn',z.left<=20)}
function qzShow(){
 const z=QZS,el=pvEl();
 if(z.i>=z.qs.length)return qzEnd();
 const q=z.qs[z.i];z.opts=shuf(q.slice(1));z.ans=false;
 el.innerHTML=`<div class=qz><div class=qz-top><button class="btn ghost" onclick="qzQuit()">✕ Quit</button><div class=qz-t>${z.s.ic} ${esc(z.s.t)}</div><div class="xt-tm" id=qzt>⏱ ${qzFmt(z.left)}</div><div class=qz-s>${z.streak>1?'🔥 '+z.streak+' · ':''}${z.score}/${z.i} correct</div></div><div class=qz-bar><i style="width:${z.i/z.qs.length*100}%"></i></div><div class=dim>Question ${z.i+1} of ${z.qs.length}</div><h3 class=qz-q>${esc(q[0])}</h3><div id=qo>${z.opts.map((o,i)=>`<button class=opt onclick="qzAns(${i})"><span class=kb>${i+1}</span>${esc(o)}</button>`).join('')}</div><div id=qf></div></div>`;
 el.scrollTop=0}
window.qzAns=i=>{const z=QZS;if(!z||z.ans)return;z.ans=true;const q=z.qs[z.i],ok=z.opts[i]==q[1];
 document.querySelectorAll('#qo .opt').forEach((b,j)=>{b.disabled=true;if(z.opts[j]==q[1])b.classList.add('right');else if(j==i)b.classList.add('wrong')});
 z.log[z.i]={picked:z.opts[i]};
 if(ok){z.score++;z.streak++;z.best=Math.max(z.best,z.streak);S.qc++;gain(5);beep(880,.08)}else{z.streak=0;z.wrong.push(q);beep(200,.2)}
 const last=z.i+1>=z.qs.length;
 document.getElementById('qf').innerHTML=`<div class="fb ${ok?'ok':'bad'}">${ok?'✔ Correct! +5 XP':'✘ Not quite. The answer is: <b>'+esc(q[1])+'</b>'}</div><button class=btn id=qn onclick="qzNext()">${last?'See results':'Next question ›'}</button> <span class=dim>or press Enter</span>`;
 const nb=document.getElementById('qn');if(nb)nb.focus()};
window.qzNext=()=>{if(!QZS)return;QZS.i++;qzShow()};
window.qzQuit=()=>{if(QZS&&QZS.tm)clearInterval(QZS.tm);QZS=null;go('quiz')};
window.qzRev=()=>{const b=document.getElementById('qrv'),t=document.getElementById('qrb');if(!b||!t)return;const o=b.hidden;b.hidden=!o;t.textContent=o?'🙈 Hide correct answers':'📖 Show correct answers'};
function qzEnd(late){
 const z=QZS;if(!z||z.over)return;clearInterval(z.tm);z.over=true;
 if(late===true)z.wrong=z.qs.filter((q,k)=>z.log[k]&&z.log[k].picked!==q[1]);
 const n=z.qs.length,pc=Math.round(z.score/n*100),el=pvEl();
 const b=qb()[z.s.id]||{best:0,of:n,pct:0};if(pc>=b.pct)qb()[z.s.id]={best:z.score,of:n,pct:pc};
 let bonus='';if(z.score==n&&n>=3){gain(20);S.perf=(S.perf||0)+1;bonus='<div class="fb ok">🏆 Perfect score! +20 XP bonus</div>'}
 badges();sv();
 const msg=pc==100?'Flawless!':pc>=80?'Great work!':pc>=60?'Good effort, review the misses.':'Keep practising, you will get there.';
 const rev=z.qs.map((q,k)=>{const l=z.log[k],ok=l&&l.picked===q[1];return `<div class=miss style="border-left-color:${ok?'var(--ok)':'var(--bad)'}"><div><b>${k+1}.</b> ${esc(q[0])}</div><div class=ok>✔ ${esc(q[1])}</div>${l?(ok?'':`<div style="color:var(--bad)">✘ Your answer: ${esc(l.picked)}</div>`):'<div class=dim>Not answered</div>'}</div>`}).join('');
 el.innerHTML=`<div class=qz><h2>${late===true?'⏱ Time is up!':'Quiz complete'}</h2><div class=res><div class=ring style="--p:${pc}"><b>${pc}%</b></div><div><h3>${msg}</h3><p>${z.score} of ${n} correct${late===true?' · '+(n-z.log.filter(Boolean).length)+' unanswered':''} · best streak ${z.best}</p><p class=dim>${esc(z.s.t)}</p></div></div>${bonus}${z.wrong.length?`<h3>Review your misses</h3>${z.wrong.map(q=>`<div class=miss><div>${esc(q[0])}</div><div class=ok>✔ ${esc(q[1])}</div></div>`).join('')}`:''}<div class=md-act><button class="btn xt-quit" id=qrb onclick="qzRev()">📖 Show correct answers</button></div><div id=qrv hidden><h3>Correct answers</h3>${rev}</div><div class=md-act><button class=btn onclick="qzStart('${z.s.id}')">↻ Try again</button><button class="btn ghost" onclick="qzQuit()">All quizzes</button></div></div>`;
 el.scrollTop=0}
document.addEventListener('keydown',e=>{
 if(!QZS||curV!='quiz'||QZS.over)return;
 if(/^[1-4]$/.test(e.key)&&!QZS.ans&&QZS.opts&&QZS.opts[+e.key-1]!==undefined)qzAns(+e.key-1);
 else if(e.key=='Enter'&&QZS.ans){e.preventDefault();qzNext()}});

// ---------- progress ----------
BG.push(['🧩','Explorer','Finish 12 modules',()=>done.filter(Boolean).length>=12],['🎯','Sharpshooter','Get a perfect quiz score',()=>(S.perf||0)>=1],['📚','Scholar','50 correct answers',()=>S.qc>=50],['🕹️','Game Master','Win 10 games',()=>S.gw>=10],['⭐','Level 5','Reach level 5',()=>lv()>=5],['🔥','Level 10','Reach level 10',()=>lv()>=10]);
R.prog=()=>{const n=done.filter(Boolean).length,got=S.b.length;
 return `${window.pfCard?window.pfCard():''}<h2>Progress</h2><div class=stats><div class=stat><b>${lv()}</b><span>Level</span></div><div class=stat><b>${S.xp}</b><span>Total XP</span></div><div class=stat><b>${n}/${M.length}</b><span>Modules</span></div><div class=stat><b>${S.qc}</b><span>Correct answers</span></div><div class=stat><b>${S.gw}</b><span>Games won</span></div><div class=stat><b>${got}/${BG.length}</b><span>Badges</span></div></div>
 <p class=dim>${S.xp%100} / 100 XP to level ${lv()+1}</p><div class=xpb style="height:10px"><i style="width:${S.xp%100}%"></i></div>
 <h3>Module map</h3><div class=map>${M.map((m,i)=>`<button class="dot ${stOf(i)}" title="${i+1}. ${esc(m.n)}" onclick="${stOf(i)=='lock'?'':`go('mods');modOpen(${i})`}">${i+1}</button>`).join('')}</div>
 <h3>Badges</h3><div class=badges>${BG.map(b=>`<div class="bd ${S.b.includes(b[1])?'':'off'}"><div style="font-size:26px">${b[0]}</div><b>${b[1]}</b><div class=dim>${b[2]}</div></div>`).join('')}</div>
 <button class="btn ghost" style="margin-top:18px" onclick="swConfirm('Reset everything?','This clears all your progress, XP and badges. It cannot be undone.','Reset',true).then(function(y){if(y){done=[];save();lesson=false;S={xp:0,qc:0,gw:0,b:[],hs:{},qb:{}};sv();upd();go('prog')}})">Reset everything</button>`};
if(!S.hs)S.hs={};if(!S.qb)S.qb={};
})();
