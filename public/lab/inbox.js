// inbox.js - the message icon on the profile page: announcements, private messages from the admin, and the Redeem coupon button.
// The lab cannot talk to the server itself. It asks the React app (the parent window) with postMessage and the app replies.
// Load this file AFTER profile.js so it can add to the profile page.
(function(){
 const embedded=window.parent!==window;
 const user=()=>{try{const o=JSON.parse(localStorage.getItem('kuser')||'null');return o&&!o.guest?o:null}catch(e){return null}};
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const TONE={info:1,success:1,warning:1};
 const RK='kannread'; // { announcementId: lastOpenedTimestamp }
 let box=null,rewards=[],boxAt=0,rwAt=0; // box: null loading/none, {ann,msgs}
 const rd=()=>{try{const o=JSON.parse(localStorage.getItem(RK)||'{}');return o&&typeof o=='object'?o:{}}catch(e){return{}}};
 const wr=o=>{try{localStorage.setItem(RK,JSON.stringify(o))}catch(e){}};
 const ask=(a,d)=>{if(!embedded)return;try{window.parent.postMessage({shellwise:a,data:d},location.origin)}catch(e){}};
 const ENV='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="m3 7 9 6.5L21 7"/></svg>';
 const ago=t=>{const s=Math.max(0,(Date.now()-new Date(t).getTime())/1000);if(s<90)return'just now';if(s<3600)return Math.round(s/60)+' min ago';if(s<86400)return Math.round(s/3600)+' h ago';return Math.round(s/86400)+' d ago'};

 // What counts as new: an announcement never opened, or opened longer ago than its snooze time (snooze 0 = only once). Unread private messages.
 const newAnn=()=>{if(!box)return[];const r=rd(),now=Date.now();return box.ann.filter(a=>{const t=+r[a.id];if(!t)return true;const h=+a.snooze_hours||0;return h>0&&now-t>=h*3600000})};
 const MK='kmsgread'; // ids of private messages already opened. Kept here too, so the dot cannot come back while the server is still saving.
 const mrd=()=>{try{const a=JSON.parse(localStorage.getItem(MK)||'[]');return new Set(Array.isArray(a)?a:[])}catch(e){return new Set()}};
 const mwr=set=>{try{localStorage.setItem(MK,JSON.stringify([...set].slice(-300)))}catch(e){}};
 const newMsg=()=>{if(!box)return[];const seen=mrd();return box.msgs.filter(m=>!m.read&&!seen.has(m.id))};
 const count=()=>newAnn().length+newMsg().length;

 const paint=()=>{
  const n=count();
  document.querySelectorAll('.inb-n').forEach(e=>{e.textContent=n>9?'9+':String(n);e.hidden=!n});
  document.querySelectorAll('.inb-btn').forEach(e=>e.setAttribute('aria-label',n?n+' new messages':'Messages'));
  const chip=document.getElementById('pchip');if(chip)chip.classList.toggle('has-new',n>0);
  document.querySelectorAll('.inb-rd em').forEach(e=>{e.textContent=String(rewards.length)});
 };
 const refresh=(force)=>{
  if(!embedded)return;
  if(force||Date.now()-boxAt>60000){boxAt=Date.now();ask('inbox')}
  if(user()&&(force||Date.now()-rwAt>60000)){rwAt=Date.now();ask('rewards')}
 };

 // Add the icon (and Redeem button) to the profile page header.
 const op=typeof R!='undefined'&&R.profile;
 if(op){
  R.profile=function(){
   const h=op.apply(this,arguments);
   if(typeof h!='string'||h.indexOf('class="pf-act"')<0)return h;
   setTimeout(()=>{refresh(false);paint()},0);
   const n=count();
   const rb=user()&&rewards.length?`<button type="button" class="btn ghost inb-rd" onclick="inbRedeem()">Redeem coupon<em>${rewards.length}</em></button>`:'';
   return h.replace('class="pf-act">','class="pf-act"><button type="button" class="inb-btn" onclick="inbOpen()" aria-label="'+(n?n+' new messages':'Messages')+'" title="Messages"><span class="inb-ic">'+ENV+'<span class="inb-n"'+(n?'':' hidden')+'>'+(n>9?'9+':n)+'</span></span><i class="pf-sep"></i><span>Inbox</span></button>'+rb);
  };
 }

 const modal=(id,html)=>{
  const old=document.getElementById(id);if(old)old.remove();
  const d=document.createElement('div');d.id=id;d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');
  d.innerHTML='<div class="up-s" data-x></div><div class="up-p">'+html+'</div>';
  document.body.appendChild(d);
  const close=()=>{d.remove();document.removeEventListener('keydown',key,true)};
  const key=e=>{if(e.key=='Escape'){e.stopPropagation();close()}};document.addEventListener('keydown',key,true);
  d.addEventListener('click',e=>{if(e.target.closest('[data-x]'))close()});
  return d;
 };

 window.inbOpen=function(){
  const items=[];
  const nA=new Set(newAnn().map(a=>a.id)),nM=new Set(newMsg().map(m=>m.id));
  if(box){
   box.ann.forEach(a=>items.push({k:'a',t:a.created_at,a,fresh:nA.has(a.id)}));
   box.msgs.forEach(m=>items.push({k:'m',t:m.created_at,m,fresh:nM.has(m.id)}));
  }
  items.sort((x,y)=>new Date(y.t)-new Date(x.t));
  const list=items.length?items.map(i=>i.k=='a'
   ?`<div class="inb-i ${TONE[i.a.tone]?esc(i.a.tone):'info'}"><div class="inb-t"><b>Announcement</b><span>${esc(ago(i.t))}</span>${i.fresh?'<em>New</em>':''}</div><p class="inb-b">${esc(i.a.message)}</p></div>`
   :`<div class="inb-i msg"><div class="inb-t"><b>${esc(i.m.subject||'Message from Shellwise')}</b><span>${esc(ago(i.t))}</span>${i.fresh?'<em>New</em>':''}</div><p class="inb-b">${esc(i.m.body)}</p></div>`).join('')
   :`<p class="inb-e">${box?'You have no messages yet. Announcements and messages from Shellwise will show here.':(embedded?'Loading...':'Open the lab from the website to see your messages.')}</p>`;
  modal('inbm',`<div class="inb-h"><h2>Messages</h2><button type="button" class="inb-x" data-x aria-label="Close">&times;</button></div><div class="inb-l">${list}</div>`);
  // Opening counts as reading: clear the dot now, and tell the server which private messages were read.
  if(box){
   const r=rd(),now=Date.now();box.ann.forEach(a=>{r[a.id]=now});wr(r);
   const ids=newMsg().map(m=>m.id);
   if(ids.length){const seen=mrd();ids.forEach(i=>seen.add(i));mwr(seen);box.msgs.forEach(m=>{m.read=true});ask('inboxread',ids)}
   paint();
  }else refresh(true);
 };

 window.inbRedeem=function(){
  if(!rewards.length)return;
  const list=rewards.map(x=>`<div class="rd-i"><span><code>${esc(x.code)}</code> &middot; ${Math.max(1,Math.min(90,+x.percent|0))}% off</span><button type="button" class="btn" onclick="inbUse('${esc(x.code)}')">Redeem</button></div>`).join('');
  modal('rdm',`<div class="inb-h"><h2>Redeem coupon</h2><button type="button" class="inb-x" data-x aria-label="Close">&times;</button></div>
   <p class="dim">You earned ${rewards.length==1?'a coupon':rewards.length+' coupons'} because a friend joined with your invite link and paid. Redeem one and it is taken off your next payment when you pay with Paystack.</p>${list}`);
 };
 window.inbUse=function(code){
  if(!/^[A-Z0-9_-]{3,24}$/.test(String(code)))return;
  ask('redeem',{code:String(code)});
 };

 window.addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==window.parent)return;
  const m=e.data;if(!m)return;
  if(m.shellwiseReply==='inbox'){
   const d=m.data;
   if(d&&Array.isArray(d.ann)&&Array.isArray(d.msgs)){
    box={ann:d.ann.filter(a=>a&&Number.isInteger(+a.id)).map(a=>({id:+a.id,message:String(a.message||'').slice(0,240),tone:String(a.tone||'info'),snooze_hours:+a.snooze_hours||0,created_at:a.created_at})),
     msgs:d.msgs.filter(x=>x&&Number.isInteger(+x.id)).map(x=>({id:+x.id,subject:String(x.subject||'').slice(0,80),body:String(x.body||'').slice(0,1000),read:!!x.read,created_at:x.created_at}))};
   }
   paint();
  }else if(m.shellwiseReply==='rewards'){
   rewards=(Array.isArray(m.data)?m.data:[]).filter(x=>x&&/^[A-Z0-9_-]{3,24}$/.test(String(x.code||''))).slice(0,20);
   paint();
   // the Redeem button appears on the profile page once the codes are known
   if(document.querySelector('.pf-act')&&rewards.length&&!document.querySelector('.inb-rd')){try{if(typeof go=='function'&&document.querySelector('.pf'))go('profile')}catch(x){}}
  }
 });
 // ---- "You have a new message" pop-up ----
 // A private message from the admin that is still unopened 5 minutes after it was sent pops up on top of whatever the
 // learner is doing (games, modules, quizzes, the terminal). Each message pops up once; the dot stays until it is opened.
 const AK='kmsgalert',WAIT=5*60000;
 const ard=()=>{try{const a=JSON.parse(localStorage.getItem(AK)||'[]');return new Set(Array.isArray(a)?a:[])}catch(e){return new Set()}};
 const awr=set=>{try{localStorage.setItem(AK,JSON.stringify([...set].slice(-300)))}catch(e){}};
 if(!document.getElementById('inb-alert-css')){const c=document.createElement('style');c.id='inb-alert-css';c.textContent=
  '@keyframes inbBlink{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(1.2)}}'
  +'#inba{position:fixed;right:16px;bottom:16px;z-index:2147483000;width:min(340px,calc(100vw - 32px));box-sizing:border-box;background:var(--side,#101a2e);color:var(--fg,#e6edf7);border:1px solid var(--blue,#2f8cff);border-radius:14px;padding:14px 14px 12px;box-shadow:0 18px 50px #000b;display:flex;gap:12px;align-items:flex-start}'
  +'#inba .ia-ic{flex:none;width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:#2f8cff26;color:var(--blue,#2f8cff);animation:inbBlink 1s ease-in-out infinite}'
  +'#inba .ia-ic svg{width:24px;height:24px}#inba b{display:block;font-size:15px;margin:1px 0 2px}#inba p{margin:0 0 10px;color:var(--dim,#8aa0bd);font-size:13px;line-height:1.35}'
  +'#inba .ia-a{display:flex;gap:8px;flex-wrap:wrap}#inba .ia-a .btn{margin:0;padding:8px 14px}#inba .ia-l{background:none;border:0;color:var(--dim,#8aa0bd);font:inherit;cursor:pointer;text-decoration:underline;padding:8px 4px}'
  +'@media(prefers-reduced-motion:reduce){#inba .ia-ic{animation:none}}';
  document.head.appendChild(c)}
 const alertClose=()=>{const a=document.getElementById('inba');if(a)a.remove()};
 const alertCheck=()=>{
  if(!user()||!box||document.hidden||document.getElementById('inba')||document.getElementById('inbm'))return;
  const done=ard(),now=Date.now();
  const due=newMsg().filter(m=>!done.has(m.id)&&now-new Date(m.created_at).getTime()>=WAIT);
  if(!due.length)return;
  due.forEach(m=>done.add(m.id));awr(done);
  const n=due.length;
  const d=document.createElement('div');d.id='inba';d.setAttribute('role','alertdialog');d.setAttribute('aria-label','New message');
  d.innerHTML='<span class="ia-ic">'+ENV+'</span><div><b>You have '+(n>1?n+' new messages':'a new message')+'</b><p>'+esc(due[0].subject||'Message from Shellwise')+'. Tap to read it.</p><div class="ia-a"><button type="button" class="btn" data-r>Read now</button><button type="button" class="ia-l" data-c>Later</button></div></div>';
  d.addEventListener('click',e=>{if(e.target.closest('[data-r]')){alertClose();inbOpen()}else if(e.target.closest('[data-c]'))alertClose()});
  document.body.appendChild(d);
 };
 const poll=()=>{if(!embedded||!user()||document.hidden)return;boxAt=Date.now();ask('inbox')};
 // First load, then check for new messages every 30 seconds (and when the tab comes back).
 window.addEventListener('sw-lab-ready',()=>refresh(true));
 setTimeout(()=>refresh(true),1500);
 setInterval(()=>{poll();alertCheck()},30000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){poll();setTimeout(alertCheck,1500)}});
 window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===window.parent&&e.data&&e.data.shellwiseReply==='inbox')setTimeout(alertCheck,50)});
})();
