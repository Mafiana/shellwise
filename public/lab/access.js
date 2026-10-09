// Plan limits for the lab. Free and guest accounts see everything but can open only part of it;
// each paid plan opens more. Edit LIMITS to change what each plan gets (Infinity = everything).
// NOTE: this runs in the browser, so it is a product gate, not a security boundary.
// To enforce it for real, serve locked content from the server (see README).
(function(){
 const UIDEF=window.UI.DEF,GL=window.GH.GL;
 const PN={free:'Free',learner:'Learner',pro:'Pro'};
 const NEXT={free:'learner',learner:'pro'};
 const LIMITS={
  free:   {mods:10, topics:2, games:6},
  learner:{mods:35, topics:8, games:20},
  pro:    {mods:Infinity, topics:Infinity, games:Infinity}};
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function plan(){try{const o=JSON.parse(localStorage.getItem('kuser')||'null');return o&&!o.guest?(o.plan=='team'?'pro':LIMITS[o.plan]?o.plan:'free'):'free'}catch(e){return'free'}}
 const lim=()=>LIMITS[plan()];
 const modOk=i=>i<lim().mods;
 const gameOk=id=>{const k=GL.findIndex(g=>g.id==id);return k<0||k<lim().games};
 const quizOk=id=>{const L=lim();if(id=='mix')return true;if(id[0]=='m'&&/^m\d+$/.test(id))return +id.slice(1)<L.mods;const k=TQ.findIndex(t=>t.id==id);return k<0||k<L.topics};
 const WHAT={mods:'modules',quiz:'quizzes',games:'games'};
 // Features by minimum plan (used by extras.js)
 const RANK={free:0,learner:1,pro:2};
 const FEAT={cert:['pro','Your certificate of completion'],daily:['learner','The daily challenge and streaks'],exam:['pro','Timed exam mode'],ctf:['pro','Advanced missions and CTF packs'],paths:['pro','Learning paths and the placement test']};
 window.SWP={plan,can:f=>RANK[plan()]>=RANK[FEAT[f][0]],need:f=>FEAT[f][0],name:p=>PN[p],mods:()=>Math.min(M.length,lim().mods)};

 // ---- upgrade prompt
 function upsell(kind){
  const p=plan(),n=NEXT[p],L=LIMITS[p];
  if(FEAT[kind])return upsellFeat(kind);
  const have=kind=='mods'?`the first ${L.mods} of ${M.length} modules`:kind=='games'?`${L.games} of ${GL.length} games`:`${L.topics} of ${TQ.length} topic quizzes and the quizzes for your first ${L.mods} modules`;
  open2('This is part of a bigger plan',`Your ${PN[p]} plan includes ${have}. ${n?`Choose a plan to keep going. ${PN[n]} opens more, and you can pick any higher plan.`:''}`);
 }
 function open2(title,text){
  const old=document.getElementById('upsell');if(old)old.remove();
  const d=document.createElement('div');d.id='upsell';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-labelledby','upt');
  d.innerHTML=`<div class="up-s" data-x></div><div class="up-p"><div class="up-i">🔒</div><h2 id="upt">${esc(title)}</h2>
   <p>${esc(text)}</p>
   <div class="up-a"><button class="btn" id="upgo">Choose a plan</button><button class="btn ghost" data-x>Not now</button></div></div>`;
  document.body.appendChild(d);
  const close=()=>{d.remove();document.removeEventListener('keydown',key,true)};
  const key=e=>{if(e.key=='Escape'){e.stopPropagation();close()}};document.addEventListener('keydown',key,true);
  d.addEventListener('click',e=>{if(e.target.closest('[data-x]'))close()});
  d.querySelector('#upgo').onclick=()=>{close();if(window.parent!==window){try{window.parent.postMessage({shellwise:'plans'},location.origin)}catch(e){}}else{location.href='/#plans'}};
  d.querySelector('#upgo').focus();
 }
 function upsellFeat(kind){const [need,label]=FEAT[kind],p=plan();
  open2(`${label} is part of the ${PN[need]} plan`,`You are on the ${PN[p]} plan. Choose ${PN[need]} or higher to unlock this and keep going.`)}
 window.upsell=upsell;

 // ---- keep locked cards looking locked and make their button open the prompt
 const lockFoot=(html,kind)=>html.replace(/<div class=mc-ft>[\s\S]*?<\/div>/,`<div class=mc-ft><span class="stt lock">🔒 ${PN[NEXT[plan()]||'pro']} plan or higher</span><button class="btn" onclick="upsell('${kind}')">Unlock</button></div>`).replace('<article class="mc','<article class="mc plan-lock');
 const oc=UIDEF.mods.card;UIDEF.mods.card=(i,k)=>{const h=oc(i,k);return modOk(i)?h:lockFoot(h,'mods')};
 const oq=UIDEF.quiz.card;UIDEF.quiz.card=(s,k)=>{const h=oq(s,k);return quizOk(s.id)?h:lockFoot(h,'quiz')};
 const og=UIDEF.games.card;UIDEF.games.card=(g,k)=>{const h=og(g,k);return gameOk(g.id)?h:lockFoot(h,'games')};

 // ---- banner above each list
 const banner=kind=>{const p=plan();if(p=='pro')return'';const L=lim(),total=kind=='mods'?M.length:kind=='games'?GL.length:TQ.length+M.length;
  const open=kind=='mods'?L.mods:kind=='games'?L.games:L.topics+L.mods+1;
  return `<div class="up-bar"><div><b>${PN[p]} plan</b> opens ${Math.min(open,total)} of ${total} ${WHAT[kind]}.</div><button class="btn" onclick="upsell('${kind}')">See plans</button></div>`};
 ['mods','quiz','games'].forEach(k=>{const o=R[k];R[k]=()=>banner(k)+o()});

 // ---- block direct calls too
 const om=window.modOpen;window.modOpen=i=>{if(!modOk(i))return upsell('mods');om(i)};
 const oqs=window.qzStart;window.qzStart=id=>{if(!quizOk(id))return upsell('quiz');oqs(id)};
 const op=window.playGame;window.playGame=id=>{if(!gameOk(id))return upsell('games');op(id)};
 const osl=window.startLesson;window.startLesson=()=>{if(!modOk(cur()))return upsell('mods');osl()};
})();
