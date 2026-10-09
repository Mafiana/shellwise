// account.js - Settings > "Security" (change password) and "Invite friends" (referral code + reward codes).
// The lab cannot talk to the server itself. It asks the React app (the parent window) with postMessage, and the app
// replies. Load this file BEFORE danger.js so the Danger Zone stays last on the Settings page.
(function(){
 const user=()=>{try{const o=JSON.parse(localStorage.getItem('kuser')||'null');return o&&!o.guest?o:null}catch(e){return null}};
 const embedded=window.parent!==window;
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const say=t=>{try{if(window.toast)window.toast(t)}catch(e){}};
 let ref,refAt=0; // undefined = loading, false = not available, object = loaded

 const refHtml=()=>{
  if(!embedded)return '<div class=dim>Open the lab from the website to see your invite code.</div>';
  if(ref===undefined)return '<div class=dim>Loading your invite code...</div>';
  if(!ref)return '<div class=dim>Your invite code is not available right now. It needs the online account.</div>';
  const pc=Math.max(1,Math.min(90,+ref.percent|0||15));
  const rw=(Array.isArray(ref.rewards)?ref.rewards:[]).filter(x=>x&&/^[A-Z0-9_-]{3,24}$/.test(x.code||'')).slice(0,10);
  return `<div><b>Give a friend a discount, get one too</b><div class=dim>A friend who signs up with your code gets ${pc}% off their first paid plan. After they pay, you get a one-time ${pc}% code.</div></div>
   <div class="sx-code"><code>${esc(ref.code)}</code><button class="btn ghost" onclick="invCopy('code',this)">Copy code</button><button class="btn ghost" onclick="invCopy('link',this)">Copy invite link</button></div>
   <div class=dim>${+ref.invited|0} joined with your code · ${+ref.paid|0} paid</div>
   ${rw.length?`<div><b>Your reward codes</b>${rw.map(x=>`<div class="sx-rw"><code>${esc(x.code)}</code> · ${Math.max(1,Math.min(90,+x.percent|0))}% off · ${x.used?'used':'ready to use'}</div>`).join('')}<div class=dim>Enter a reward code under "Have a discount code?" in the Plans section of the website.</div></div>`:''}`;
 };
 const paint=()=>{const el=document.getElementById('invbody');if(el)el.innerHTML=refHtml()};
 const loadRef=()=>{
  if(!embedded||!user())return;
  if(ref&&Date.now()-refAt<20000)return;
  refAt=Date.now();
  try{window.parent.postMessage({shellwise:'referral'},location.origin)}catch(e){}
 };
 window.invCopy=function(w,btn){
  if(!ref||!ref.code)return;
  const t=w=='link'?location.origin+'/auth?mode=signup&ref='+encodeURIComponent(ref.code):ref.code;
  // The button itself says "Copied" for 2 seconds, like most web apps.
  const ok=()=>{
   say(w=='link'?'Invite link copied':'Code copied');
   if(btn&&btn.isConnected){const o=btn.dataset.t||btn.textContent;btn.dataset.t=o;btn.textContent='Copied \u2713';btn.classList.add('copied');clearTimeout(btn._t);btn._t=setTimeout(()=>{btn.textContent=o;btn.classList.remove('copied')},2000)}
  };
  const fb=()=>swAlert('Copy this','Select the text below and copy it.',t);try{navigator.clipboard.writeText(t).then(ok,fb)}catch(e){fb()}
 };

 const o=R.settings;
 R.settings=()=>{
  const html=o();if(!user())return html;
  setTimeout(loadRef,0);
  return html+`<h3 class="sx-h">Security</h3><div class="sx"><div><b>Password</b><div class=dim>Change the password you use to log in. You need your current password. Your other devices are signed out.</div></div><button class="btn" onclick="sxPw()">Change password</button></div>
   <h3 class="sx-h">Invite friends</h3><div class="sx sx-col" id="invbody">${refHtml()}</div>`;
 };

 const score=v=>{let s=0;if(v.length>=8)s++;if(v.length>=12)s++;if(/[A-Z]/.test(v)&&/[a-z]/.test(v))s++;if(/\d/.test(v)&&/[^A-Za-z0-9]/.test(v))s++;return v?s:0};
 window.sxPw=function(){
  if(!user())return;
  const old=document.getElementById('sxm');if(old)old.remove();
  const d=document.createElement('div');d.id='sxm';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-labelledby','sxt');
  d.innerHTML=`<div class="up-s" data-x></div><div class="up-p dz-p"><div class="up-i">🔐</div><h2 id="sxt">Change password</h2>
   <p class=dim>Enter your current password, then choose a new one.</p>
   <label class="dz-l">Current password<input id="sx0" type="password" autocomplete="current-password" maxlength="128"></label>
   <label class="dz-l">New password<input id="sx1" type="password" autocomplete="new-password" maxlength="128" placeholder="At least 8 characters"></label>
   <div class="sx-m" id="sxs" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
   <label class="dz-l">Confirm new password<input id="sx2" type="password" autocomplete="new-password" maxlength="128"></label>
   <label class="sx-show"><input type="checkbox" id="sxsh"> Show passwords</label>
   <div id="sxerr" class="dz-err" role="alert"></div>
   <div class="up-a"><button class="btn" id="sxgo" disabled>Update password</button><button class="btn ghost" data-x>Cancel</button></div></div>`;
  document.body.appendChild(d);
  const close=()=>{d.remove();document.removeEventListener('keydown',key,true)};
  const key=e=>{if(e.key=='Escape'){e.stopPropagation();close()}};document.addEventListener('keydown',key,true);
  const a0=d.querySelector('#sx0'),a1=d.querySelector('#sx1'),a2=d.querySelector('#sx2'),go=d.querySelector('#sxgo'),er=d.querySelector('#sxerr'),m=d.querySelector('#sxs');
  const check=()=>{
   m.dataset.s=score(a1.value);
   er.className='dz-err';
   er.textContent=a2.value&&a1.value!==a2.value?'The two new passwords do not match.':'';
   go.disabled=!(a0.value&&a1.value.length>=8&&a1.value===a2.value);
  };
  [a0,a1,a2].forEach(i=>i.addEventListener('input',check));
  d.querySelector('#sxsh').onchange=e=>{[a0,a1,a2].forEach(i=>{i.type=e.target.checked?'text':'password'})};
  d.addEventListener('click',e=>{if(e.target.closest('[data-x]'))close()});
  go.onclick=()=>{
   if(go.disabled)return;
   if(a1.value===a0.value){er.textContent='Your new password must be different from the current one.';return}
   if(!embedded){er.textContent='Open the lab from the website to change your password.';return}
   go.disabled=true;go.textContent='Updating...';er.textContent='';
   try{window.parent.postMessage({shellwise:'password',data:{current:a0.value,next:a1.value}},location.origin)}catch(e){er.textContent='Could not reach the website. Try again.';go.disabled=false;go.textContent='Update password'}
  };
  a0.focus();
 };

 window.addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==window.parent)return;
  const m=e.data;if(!m)return;
  if(m.shellwiseReply==='referral'){
   const r=m.data;
   ref=r&&typeof r=='object'&&/^[A-Z0-9]{3,12}$/.test(String(r.code||''))?r:false;
   paint();
  }else if(m.shellwiseReply==='password'){
   const er=document.getElementById('sxerr'),go=document.getElementById('sxgo');if(!er||!go)return;
   if(m.ok){
    ['sx0','sx1','sx2'].forEach(id=>{const i=document.getElementById(id);if(i)i.value=''});
    er.className='dz-err sx-ok';er.textContent='Password updated. Your other devices were signed out.';go.textContent='Done';
    setTimeout(()=>{const d=document.getElementById('sxm');if(d)d.remove()},1800);
   }else{
    er.className='dz-err';er.textContent=String(m.message||'Could not change your password.').slice(0,200);
    go.textContent='Update password';go.disabled=false;
   }
  }
 });
})();
