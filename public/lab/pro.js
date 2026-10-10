// pro.js - Advanced missions (CTF packs), learning paths and the placement test. Pro plan.
// Data is in pro-data.js. Progress is kept in localStorage (kctf, kpath) and synced for paid accounts by the React app.
(function(){
 const D=window.SWD;if(!D)return;
 const $=s=>document.querySelector(s);
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pv=()=>document.getElementById('pv');
 const shuf=a=>a.slice().sort(()=>Math.random()-.5);
 const rd=(k,d)=>{try{const r=localStorage.getItem(k);if(!r||r.length>50000)return d;const o=JSON.parse(r);return o&&typeof o=='object'&&!Array.isArray(o)?o:d}catch(e){return d}};
 const wr=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
 const gate=f=>{if(window.SWP&&!SWP.can(f)){window.upsell(f);return false}return true};
 const lockedCard=(f,title,text)=>`<div class="xt-lock"><div class="xt-lk">🔒</div><h3>${title}</h3><p>${text}</p><button class="btn" onclick="upsell('${f}')">Unlock with ${SWP.name(SWP.need(f))}</button></div>`;

 // ---- compact synchronous SHA-256 (flags are compared by hash, so they are not readable in the page source)
 function sha256(str){
  const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const b=new TextEncoder().encode(str),l=b.length,n=((l+9+63)>>6)<<6,m=new Uint8Array(n);m.set(b);m[l]=0x80;
  const dv=new DataView(m.buffer);dv.setUint32(n-4,(l*8)>>>0);dv.setUint32(n-8,Math.floor(l*8/4294967296));
  let H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];const w=new Array(64);
  const R=(x,k)=>(x>>>k)|(x<<(32-k));
  for(let o=0;o<n;o+=64){
   for(let i=0;i<16;i++)w[i]=dv.getUint32(o+i*4);
   for(let i=16;i<64;i++){const a=R(w[i-15],7)^R(w[i-15],18)^(w[i-15]>>>3),c=R(w[i-2],17)^R(w[i-2],19)^(w[i-2]>>>10);w[i]=(w[i-16]+a+w[i-7]+c)|0}
   let [a,bb,c,d,e,f,g,h]=H;
   for(let i=0;i<64;i++){const S1=R(e,6)^R(e,11)^R(e,25),ch=(e&f)^(~e&g),t1=(h+S1+ch+K[i]+w[i])|0,S0=R(a,2)^R(a,13)^R(a,22),mj=(a&bb)^(a&c)^(bb&c),t2=(S0+mj)|0;h=g;g=f;f=e;e=(d+t1)|0;d=c;c=bb;bb=a;a=(t1+t2)|0}
   H=[H[0]+a|0,H[1]+bb|0,H[2]+c|0,H[3]+d|0,H[4]+e|0,H[5]+f|0,H[6]+g|0,H[7]+h|0];
  }
  return H.map(x=>(x>>>0).toString(16).padStart(8,'0')).join('');
 }
 window.swSha=sha256;

 // ---- sidebar
 const side=document.getElementById('side'),careers=side&&side.querySelector('button[data-v=careers]');
 const mk=(v,label,feat)=>{const b=document.createElement('button');b.type='button';b.dataset.v=v;b.onclick=()=>go(v);b.dataset.feat=feat;const m=/^(\S+)\s+(.*)$/.exec(label),ic=m&&window.ICO&&window.ICO_MAP&&window.ICO_MAP[m[1]];if(ic){b.innerHTML=window.ICO(ic)+' ';b.appendChild(document.createTextNode(m[2]))}else b.textContent=label;side.insertBefore(b,careers);return b};
 if(side&&careers){mk('ctf','🚩 Missions','ctf');mk('paths','🧭 Paths','paths')}
 const og=window.go;window.go=function(v){og(v)};

 // =====================================================================
 // MISSIONS (CTF packs)
 // =====================================================================
 const ct=()=>{const o=rd('kctf',{});return{solved:o.solved&&typeof o.solved=='object'?o.solved:{},hints:o.hints&&typeof o.hints=='object'?o.hints:{}}};
 const allC=()=>D.packs.flatMap(p=>p.cs);
 const findC=id=>{for(const p of D.packs){const c=p.cs.find(x=>x.id==id);if(c)return[p,c]}return[null,null]};
 const worth=(c,h)=>Math.max(Math.ceil(c.pts/2),Math.round(c.pts*(1-.25*h)));
 R.ctf=function(){
  if(window.SWP&&!SWP.can('ctf'))return `<h2>Advanced missions</h2><p class=dim>Capture-the-flag packs that feel like real security work.</p>`+lockedCard('ctf','Advanced missions and CTF packs','Three packs of hands-on puzzles: decode, read logs, spot attacks and investigate an intrusion. Available on the Pro plan.');
  const st=ct(),tot=allC().length,got=Object.keys(st.solved).filter(k=>findC(k)[1]).length,pts=Object.keys(st.solved).reduce((a,k)=>a+(+st.solved[k]||0),0);
  return `<h2>Advanced missions</h2><p class=dim>Capture-the-flag packs. Find the flag, type it in the form SW{...} and earn XP. Hints cost a quarter of the reward each.</p>
  <div class="ms-sum"><div><b>${got}/${tot}</b><span>flags captured</span></div><div><b>${pts}</b><span>XP earned</span></div></div>
  <div class="ms-packs">${D.packs.map(p=>{const n=p.cs.filter(c=>st.solved[c.id]!==undefined).length;
   return `<article class="mc ms-pack"><div class="ms-ph"><span class="ms-ic">${p.ic}</span><div><h3>${esc(p.name)}</h3><span class="ms-lv ms-${p.lvl.toLowerCase()}">${p.lvl}</span></div></div><p class=dim>${esc(p.d)}</p>
   <div class="ms-bar"><i style="width:${n/p.cs.length*100}%"></i></div><div class="ms-dots">${p.cs.map(c=>`<button class="${st.solved[c.id]!==undefined?'ok':''}" onclick="msOpen('${c.id}')" title="${esc(c.t)}">${esc(c.t)}<small>${st.solved[c.id]!==undefined?'✔ captured':c.pts+' XP'}</small></button>`).join('')}</div></article>`}).join('')}</div>`};
 window.msOpen=function(id){
  if(!gate('ctf'))return;const [p,c]=findC(id);if(!c)return;
  const st=ct(),ok=st.solved[id]!==undefined,hn=Math.min(+st.hints[id]||0,c.hints.length);
  pv().innerHTML=`<div class="ms-c"><button class="btn ghost" onclick="go('ctf')">◀ All missions</button>
   <div class=dim style="margin-top:14px">${esc(p.name)} · ${p.lvl}</div><h2>${esc(c.t)}</h2><p>${esc(c.story)}</p>
   <pre class="ms-data" tabindex="0">${esc(c.data)}</pre><p><b>${esc(c.q)}</b></p>
   ${ok?`<div class="fb ok">✔ Flag captured. You earned ${st.solved[id]} XP.</div>`:`<form class="ms-f" onsubmit="return msTry(event,'${id}')"><input id="msf" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="SW{...}" aria-label="Flag"><button class="btn" type="submit">Submit flag</button></form><div id="msm" class="ms-m" role="status"></div>`}
   <div class="ms-h"><b>Hints</b> <span class=dim>(reward now ${worth(c,hn)} XP)</span>
   ${c.hints.slice(0,hn).map((x,k)=>`<p class="ms-hint">💡 ${k+1}. ${esc(x)}</p>`).join('')}
   ${!ok&&hn<c.hints.length?`<button class="btn ghost" onclick="msHint('${id}')">Show hint ${hn+1} (−25%)</button>`:''}</div></div>`;
  const i=$('#msf');if(i)i.focus()};
 window.msHint=function(id){if(!gate('ctf'))return;const [,c]=findC(id);if(!c)return;const st=ct();if((+st.hints[id]||0)<c.hints.length){st.hints[id]=(+st.hints[id]||0)+1;wr('kctf',st)}msOpen(id)};
 window.msTry=function(e,id){
  e.preventDefault();if(!gate('ctf'))return false;const [,c]=findC(id);if(!c)return false;
  let v=String($('#msf').value||'').trim().slice(0,200);if(!v)return false;
  if(!/^sw\{/i.test(v))v='SW{'+v.replace(/\}$/,'')+'}';
  const m=$('#msm');
  if(sha256(v.toLowerCase())===c.h){
   const st=ct();if(st.solved[id]===undefined){const xp=worth(c,+st.hints[id]||0);st.solved[id]=xp;wr('kctf',st);gain(xp);try{badges()}catch(x){}}
   msOpen(id)}
  else{m.textContent='Not the flag. Check the data again and keep the format SW{...}.';m.className='ms-m bad';const f=$('#msf');f.classList.remove('shake');void f.offsetWidth;f.classList.add('shake')}
  return false};

 // =====================================================================
 // LEARNING PATHS + PLACEMENT TEST
 // =====================================================================
 const pp=()=>{const o=rd('kpath',{});return{claimed:o.claimed&&typeof o.claimed=='object'?o.claimed:{},place:o.place&&typeof o.place=='object'?o.place:null}};
 const pathProg=p=>{const n=p.m.filter(i=>i<M.length&&done[i]).length;return{n,total:p.m.length,next:p.m.find(i=>i<M.length&&!done[i])}};
 const claim=()=>{const s=pp();let g=0;D.paths.forEach(p=>{const q=pathProg(p);if(q.n==q.total&&!s.claimed[p.id]){s.claimed[p.id]=Date.now();g+=100}});
  if(g){wr('kpath',s);setTimeout(()=>gain(g),50)}};
 R.paths=function(){
  if(window.SWP&&!SWP.can('paths'))return `<h2>Learning paths</h2><p class=dim>A guided order through the modules, plus a test that tells you where to start.</p>`+lockedCard('paths','Learning paths and placement test','Five guided paths, from Linux basics to penetration testing, and a 12 question placement test that recommends your starting point. Available on the Pro plan.');
  claim();const s=pp(),pl=s.place,rec=pl&&D.paths.find(p=>p.id==pl.rec);
  return `<h2>Learning paths</h2><p class=dim>Follow a path to learn in a sensible order. Finish every module in a path for a 100 XP bonus.</p>
  <div class="mc ms-place"><div><h3>🎯 Placement test</h3>${pl?`<p>Your last result: <b>${pl.score}/12</b>. We suggest <b>${esc(rec?rec.name:'Linux Foundations')}</b>.</p>`:'<p>12 quick questions. We will tell you which path to start with.</p>'}</div><div class="ms-pa"><button class="btn" onclick="plStart()">${pl?'Retake the test':'Take the test'}</button>${rec?`<button class="btn ghost" onclick="pathOpen('${rec.id}')">Open suggested path</button>`:''}</div></div>
  <div class="ms-packs">${D.paths.map(p=>{const q=pathProg(p);return `<article class="mc ms-pack${rec&&rec.id==p.id?' ms-rec':''}"><div class="ms-ph"><span class="ms-ic">${p.ic}</span><div><h3>${esc(p.name)}</h3><span class="ms-lv ms-${p.lvl.toLowerCase()}">${p.lvl}</span>${rec&&rec.id==p.id?' <span class="ms-lv ms-sug">Suggested</span>':''}</div></div>
   <p class=dim>${esc(p.d)}</p><div class="ms-bar"><i style="width:${q.n/q.total*100}%"></i></div><div class="mc-ft"><span class=dim>${q.n} of ${q.total} modules</span><button class="btn" onclick="pathOpen('${p.id}')">${q.n?(q.n==q.total?'Review':'Continue'):'Start'}</button></div></article>`}).join('')}</div>`};
 window.pathOpen=function(id){
  if(!gate('paths'))return;const p=D.paths.find(x=>x.id==id);if(!p)return;const q=pathProg(p);
  pv().innerHTML=`<div class="ms-c"><button class="btn ghost" onclick="go('paths')">◀ All paths</button><div class=dim style="margin-top:14px">${p.lvl} path</div><h2>${p.ic} ${esc(p.name)}</h2><p>${esc(p.d)}</p>
  <div class="ms-bar"><i style="width:${q.n/q.total*100}%"></i></div><p class=dim>${q.n} of ${q.total} modules finished${q.n==q.total?'. Path complete.':'.'}</p>
  <ol class="ms-steps">${p.m.filter(i=>i<M.length).map((i,k)=>`<li class="${done[i]?'ok':i==q.next?'now':''}"><button onclick="modOpen(${i})"><i>${done[i]?'✔':k+1}</i><span><b>${esc(M[i].n)}</b><small>Module ${i+1} · ${esc((M[i].c||[]).slice(0,4).join(', '))}</small></span><em>${done[i]?'Done':i==q.next?'Up next':''}</em></button></li>`).join('')}</ol></div>`};
 let PL=null;
 window.plStart=function(){if(!gate('paths'))return;PL={qs:D.place.map(q=>({t:q[0],q:q[1],c:q[2],o:shuf(q.slice(2)),pick:-1})),i:0,left:72,tot:72};
  PL.tm=setInterval(()=>{const z=PL;if(!z)return clearInterval(z&&z.tm);if(!$('#plt')){clearInterval(z.tm);PL=null;return}z.left--;plPaint();if(z.left<=0){clearInterval(z.tm);plEnd(true)}},1000);plShow()};
 function plPaint(){const z=PL;if(!z)return;const e=$('#plt'),b=$('#pltb'),c=$('#plc');if(!e)return;const l=Math.max(0,z.left);e.textContent=Math.floor(l/60)+':'+String(l%60).padStart(2,'0');if(b)b.style.width=(l/z.tot*100)+'%';if(c)c.className='pl-clock'+(l<=10?' red':l<=30?' amb':'')}
 function plShow(){
  const z=PL;if(!z)return;if(z.i>=z.qs.length)return plEnd();const x=z.qs[z.i];
  pv().innerHTML=`<div class=qz><div class=qz-top><button class="btn ghost" onclick="plQuit()">✕ Quit</button><div class=qz-t>🎯 Placement test</div><div class=qz-s>${z.i+1}/${z.qs.length}</div><div id=plc class=pl-clock><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/></svg><b id=plt></b></div></div><div class=pl-tb><i id=pltb></i></div><div class=qz-bar><i style="width:${z.i/z.qs.length*100}%"></i></div>
  <h3 class=qz-q>${esc(x.q)}</h3><div id="plo">${x.o.map((o,k)=>`<button class="opt" onclick="plPick(${k})">${esc(o)}</button>`).join('')}</div></div>`;
  plPaint();const b=$('#plo .opt');if(b)b.focus()}
 window.plPick=function(k){const z=PL;if(!z)return;const x=z.qs[z.i];x.pick=k;z.i++;plShow()};
 window.plQuit=function(){if(PL&&PL.tm)clearInterval(PL.tm);PL=null;go('paths')};
 function plEnd(late){
  const z=PL;if(!z)return;if(z.tm)clearInterval(z.tm);PL=null;const t={basics:0,inter:0,sec:0};let score=0;z.qs.forEach(x=>{if(x.o[x.pick]==x.c){t[x.t]++;score++}});
  const rec=t.basics<3?'foundations':t.inter<3?'power':t.sec<3?'soc':'pentest';
  const s=pp();s.place={score,rec,t,at:Date.now()};wr('kpath',s);
  const p=D.paths.find(x=>x.id==rec),q=pathProg(p),lv=score<=5?'Beginner':score<=9?'Intermediate':'Advanced';
  pv().innerHTML=`<div class=qz><h2>Your placement</h2><div class=res><div class=ring style="--p:${Math.round(score/12*100)}"><b>${score}/12</b></div><div>${late?'<p class=pl-late>⏱ Time is up! Unanswered questions count as wrong.</p>':''}<h3>${lv} level</h3><p>Basics ${t.basics}/4 · Intermediate ${t.inter}/4 · Security ${t.sec}/4</p></div></div>
  <div class="mc ms-place" style="margin-top:16px"><div><h3>${p.ic} Start with: ${esc(p.name)}</h3><p>${esc(p.d)}</p></div><div class="ms-pa"><button class="btn" onclick="pathOpen('${p.id}')">${q.n?'Continue the path':'Open the path'}</button><button class="btn ghost" onclick="go('paths')">All paths</button></div></div></div>`}
 try{window.addEventListener('beforeunload',()=>{})}catch(e){}
})();
