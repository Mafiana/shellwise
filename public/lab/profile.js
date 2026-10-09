// Profile chip (sidebar) + profile card. Reads the signed-in user saved by the landing page ('kuser').
// Everything shown is escaped; stored values are validated again here because localStorage is untrusted input.
(function(){
 const KU='kuser',UN=/^[a-z][a-z0-9_]{2,19}$/;
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const clean=(v,n)=>String(v==null?'':v).replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,n);
 const PLAN={free:'Free',learner:'Learner',pro:'Pro'};
    const GEN={male:'Male',female:'Female',other:'Other',prefer_not:'Prefer not to say'};
 const AVRE=/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]{1,79000}$/;
 function load(){let o=null;try{o=JSON.parse(localStorage.getItem(KU)||'null')}catch(e){}
  if(!o||typeof o!='object'||Array.isArray(o)||o.guest)return{guest:true,name:'Guest',user:'',since:o&&+o.since>0?+o.since:0};
  const em=clean(o.email,254),user=UN.test(String(o.user||''))?String(o.user):clean(em.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g,'_'),20)||'learner';
  return{guest:false,name:clean(o.name,60)||user,user,email:em,avatar:AVRE.test(String(o.avatar||''))?String(o.avatar):'',loc:clean(o.location,60),bio:clean(o.bio,200),gender:GEN[o.gender]?o.gender:'',plan:o.plan=='team'?'pro':PLAN[o.plan]?o.plan:'free',since:Number.isFinite(+o.since)?+o.since:0}}
 const HUES=[[210,260],[160,200],[30,350],[280,320],[190,230],[10,40],[120,170],[250,300]];
 const hue=u=>{let h=0;for(const c of u)h=(h*31+c.charCodeAt(0))>>>0;return HUES[h%HUES.length]};
 const PERSON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>';
 const grad=u=>{if(!u.user)return'linear-gradient(135deg,#5b6a8a,#2b3550)';const[a,b]=hue(u.user);return`linear-gradient(135deg,hsl(${a} 85% 62%),hsl(${b} 80% 45%))`};
 function stats(){
  const xp=typeof S!='undefined'&&S&&+S.xp||0,qc=typeof S!='undefined'&&S&&+S.qc||0,gw=typeof S!='undefined'&&S&&+S.gw||0,bd=typeof S!='undefined'&&S&&Array.isArray(S.b)?S.b.filter(x=>typeof x=='string').slice(0,12):[];
  const dn=typeof done!='undefined'&&Array.isArray(done)?done.filter(Boolean).length:0,mt=typeof M!='undefined'?M.length:0;
  return{xp,lvl:Math.floor(xp/100)+1,into:xp%100,qc,gw,bd,dn,mt}}
 // Inside the React app the lab runs in an iframe: ask the parent page to navigate instead.
 const toParent=a=>{if(window.parent===window)return false;try{window.parent.postMessage({shellwise:a},location.origin);return true}catch(e){return false}};
 window.goHome=function(){try{sv();save()}catch(e){}if(!toParent('home'))location.href=location.pathname};
 // ---- chip
 const side=document.getElementById('side');if(!side)return;
 const chip=document.createElement('button');chip.id='pchip';chip.type='button';chip.dataset.v='profile';chip.onclick=()=>go('profile');
 side.insertBefore(chip,side.children[1]||null);
 function paint(){const u=load();chip.innerHTML=`<span class="pav" style="background:${u.avatar?'#0b1020':grad(u)}">${u.avatar?`<img src="${u.avatar}" alt="">`:PERSON}</span><span class="pnm">${u.guest?'GUEST':esc(u.user)}</span>`;chip.title=u.guest?'Guest profile':'Profile: @'+u.user;chip.setAttribute('aria-label',u.guest?'Open guest profile':'Open profile for '+u.user)}
 paint();window.addEventListener('kuser',paint);window.addEventListener('storage',e=>{if(e.key==KU)paint()});
 // ---- profile page (a normal view in the app, like Progress)
 function seg(into){const n=20,f=Math.floor(into/5);return Array.from({length:n},(_,i)=>`<i class="${i<f?'f':''}"></i>`).join('')}
 let editing=false,draft=null;
 R.profile=function(){const u=load(),s=stats();if(editing&&!u.guest)return editForm(u);
  const since=u.since?new Date(u.since).toLocaleDateString(undefined,{month:'long',year:'numeric'}):'';
  const bg=(typeof BG!='undefined'&&Array.isArray(BG)?BG:[]).map(b=>({i:String(b[0]),n:String(b[1]),d:String(b[2]),on:s.bd.includes(String(b[1]))}));
  const earned=bg.filter(b=>b.on).length;
  const rows=[['Modules finished',`${s.dn} <em>of ${s.mt}</em>`],['Correct quiz answers',s.qc],['Games won',s.gw],['Badges earned',`${earned} <em>of ${bg.length}</em>`]];
  return `<div class="pf" style="--g:${grad(u)}">
   <header class="pf-top"><div class="pf-id">
     <div class="pf-avw"><div class="pf-av" ${u.avatar?'':'aria-hidden="true"'}>${u.avatar?`<img src="${u.avatar}" alt="Profile photo of ${esc(u.user)}">`:PERSON}</div>${u.guest?'':`<div class="pf-avb"><button type="button" class="btn ghost" id="pfup">${u.avatar?'Change photo':'Upload photo'}</button>${u.avatar?'<button type="button" class="btn ghost" id="pfrm">Remove</button>':''}</div><input type="file" id="pffile" accept="image/png,image/jpeg,image/webp" hidden><p class="pf-aer" id="pfaer" role="alert"></p>`}</div>
     <div class="pf-who"><h2>${u.guest?'Guest':esc(u.name)}</h2><p class="pf-han">${u.guest?'Not signed in':'@'+esc(u.user)}${u.loc?` · <span class="pf-loc">📍 ${esc(u.loc)}</span>`:''}</p>${u.bio?`<p class="pf-bio">${esc(u.bio)}</p>`:''}
      <ul class="pf-tags"><li class="${u.guest?'':'pl-'+esc(u.plan)}">${u.guest?'Guest session':PLAN[u.plan]+' plan'}</li>${since?`<li>${u.guest?'Started':'Member since'} ${esc(since)}</li>`:''}${u.guest?'':`<li>${esc(u.email)}</li>`}${!u.guest&&u.gender?`<li>${GEN[u.gender]}</li>`:''}</ul></div></div>
    <div class="pf-act">${u.guest?'<button class="btn" data-pa="signup">Create a free account</button><button class="btn ghost" data-pa="login">Log in</button>':'<button class="btn" id="pfedit">Edit profile</button><button class="btn ghost" data-pa="out">Sign out</button>'}</div>
   </header>
   ${u.guest?'<p class="pf-hint">You are using Shellwise as a guest. Your progress is saved in this browser only. An account gives you a username and a profile to come back to.</p>':''}
   <div class="pf-cols">
    <section class="pf-lv"><h3>Level</h3><div class="pf-num">${s.lvl}</div><div class="pf-seg" role="img" aria-label="${s.into} of 100 XP towards level ${s.lvl+1}">${seg(s.into)}</div><p>${s.xp} XP in total. ${100-s.into} XP to level ${s.lvl+1}.</p></section>
    <section class="pf-st"><h3>Activity</h3><dl>${rows.map(r=>`<div><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join('')}</dl></section>
   </div>
   <section class="pf-bd"><h3>Badges</h3><ul>${bg.map(b=>`<li class="${b.on?'on':''}"><span class="pf-bi" aria-hidden="true">${esc(b.i)}</span><b>${esc(b.n)}</b><small>${esc(b.d)}</small><em>${b.on?'Earned':'Locked'}</em></li>`).join('')}</ul></section>
  </div>`};
 function editForm(u){const d=draft||(draft={name:u.name,loc:u.loc,bio:u.bio,gender:u.gender});
  return `<div class="pf pf-edit" style="--g:${grad(u)}"><h2>Edit profile</h2>
  <div class="pf-ed">
   <div class="pf-avw"><div class="pf-av">${u.avatar?`<img src="${u.avatar}" alt="Your profile photo">`:PERSON}</div><div class="pf-avb"><button type="button" class="btn ghost" id="pfup">${u.avatar?'Change photo':'Upload photo'}</button>${u.avatar?'<button type="button" class="btn ghost" id="pfrm">Remove</button>':''}</div><input type="file" id="pffile" accept="image/png,image/jpeg,image/webp" hidden><p class="pf-aer" id="pfaer" role="alert"></p></div>
   <form id="pfform" class="pf-form" novalidate>
    <label>Full name<input id="pfn" maxlength="60" autocomplete="name" value="${esc(d.name)}"></label>
    <label>Username<input value="@${esc(u.user)}" disabled></label>
    <label>Location<input id="pfl" maxlength="60" placeholder="City, Country" autocomplete="address-level2" value="${esc(d.loc)}"></label>
          <label>Gender<select id="pfg"><option value="">Select gender</option>${Object.keys(GEN).map(k=>`<option value="${k}"${d.gender==k?' selected':''}>${GEN[k]}</option>`).join('')}</select></label>
    <label>Bio<textarea id="pfb" maxlength="200" rows="4" placeholder="Tell people a little about you">${esc(d.bio)}</textarea><small id="pfc">${d.bio.length} / 200</small></label>
    <p class="pf-aer" id="pfer" role="alert"></p>
    <div class="pf-fa"><button class="btn" type="submit">Save changes</button><button class="btn ghost" type="button" id="pfcx">Cancel</button></div>
   </form></div></div>`}
 function openPv(){const v=document.getElementById('pv');if(v)v.innerHTML=R.profile()}
 function snap(){const g=i=>{const e=document.getElementById(i);return e?e.value:''};if(draft&&document.getElementById('pfform'))draft={name:g('pfn'),loc:g('pfl'),bio:g('pfb'),gender:g('pfg')}}
 function saveProfile(){const g=i=>clean(document.getElementById(i).value,i=='pfb'?200:60),er=document.getElementById('pfer'),name=g('pfn'),loc=g('pfl'),bio=g('pfb'),gv=document.getElementById('pfg').value,gender=GEN[gv]?gv:'';
  if(name.length<1){er.textContent='Enter your full name.';return}
  let o={};try{o=JSON.parse(localStorage.getItem(KU)||'{}')||{}}catch(e){}
  o.name=name;o.location=loc;o.bio=bio;o.gender=gender;try{localStorage.setItem(KU,JSON.stringify(o))}catch(e){}
  if(window.parent!==window){try{window.parent.postMessage({shellwise:'profile',data:{name,location:loc,bio,gender}},location.origin)}catch(e){}}
  editing=false;draft=null;paint();openPv();try{toast('Profile saved')}catch(e){}}
 document.addEventListener('click',e=>{if(e.target.closest('#pfedit')){editing=true;draft=null;openPv();return}if(e.target.closest('#pfcx')){editing=false;draft=null;openPv()}});
 document.addEventListener('submit',e=>{if(e.target.id=='pfform'){e.preventDefault();saveProfile()}});
 document.addEventListener('input',e=>{if(e.target.id=='pfb'){const c=document.getElementById('pfc');if(c)c.textContent=e.target.value.length+' / 200'}});
 // the Progress (dashboard) view shows who is signed in
 window.pfCard=function(){const u=load();if(u.guest)return'';return`<div class="pf-mini" style="--g:${grad(u)}"><span class="pav" style="background:${u.avatar?'#0b1020':grad(u)}">${u.avatar?`<img src="${u.avatar}" alt="">`:PERSON}</span><div><b>${esc(u.name)}</b><small>@${esc(u.user)}${u.loc?' · 📍 '+esc(u.loc):''}</small>${u.bio?`<p>${esc(u.bio)}</p>`:''}</div></div>`};
 // ---- profile photo: resized to 256x256 JPEG in the browser, then saved to the account by the parent page
 function setAv(data){let o={};try{o=JSON.parse(localStorage.getItem(KU)||'{}')||{}}catch(e){}
  if(data)o.avatar=data;else delete o.avatar;
  try{localStorage.setItem(KU,JSON.stringify(o))}catch(e){}
  paint();if(document.querySelector('#pv .pf')){snap();document.getElementById('pv').innerHTML=R.profile()}
  if(window.parent!==window){try{window.parent.postMessage({shellwise:'avatar',data:data||''},location.origin)}catch(e){}}}
 function pickImage(f){const er=document.getElementById('pfaer'),say=m=>{if(er)er.textContent=m};say('');
  if(!f)return;if(!/^image\/(png|jpeg|webp)$/.test(f.type))return say('Choose a PNG, JPEG or WebP image.');
  if(f.size>8*1024*1024)return say('That image is too large. Choose one under 8 MB.');
  const img=new Image(),fr=new FileReader();
  fr.onerror=()=>say('That file could not be read.');
  img.onerror=()=>say('That file could not be read as an image.');
  img.onload=()=>{const N=256,c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d'),m=Math.min(img.width,img.height);
   x.fillStyle='#0b1020';x.fillRect(0,0,N,N);x.drawImage(img,(img.width-m)/2,(img.height-m)/2,m,m,0,0,N,N);
   let d=c.toDataURL('image/jpeg',.85);if(d.length>79000)d=c.toDataURL('image/jpeg',.6);
   if(!AVRE.test(d))return say('That image could not be saved. Try a smaller one.');setAv(d)};
  fr.onload=()=>{img.src=String(fr.result)};fr.readAsDataURL(f)}
 document.addEventListener('click',e=>{if(e.target.closest('#pfup')){document.getElementById('pffile').click();return}if(e.target.closest('#pfrm')){setAv('');return}});
 document.addEventListener('change',e=>{if(e.target.id=='pffile')pickImage(e.target.files[0])});
 document.addEventListener('click',e=>{const a=e.target.closest('#pv [data-pa]');if(!a)return;
  const act=a.dataset.pa=='out'?'signout':a.dataset.pa;
  try{if(a.dataset.pa=='out'){sv();save()}}catch(x){}
  if(toParent(act))return;
  try{if(a.dataset.pa=='out'){localStorage.removeItem(KU);sessionStorage.removeItem('kgo')}else sessionStorage.setItem('kgo',a.dataset.pa)}catch(x){}
  location.reload()});
})();
