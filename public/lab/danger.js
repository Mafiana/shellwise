// danger.js - "Danger Zone" at the bottom of Settings: delete the account (signed-in users only).
// The lab cannot delete anything itself. It asks the React app (parent window), which calls the server.
(function(){
 const user=()=>{try{const o=JSON.parse(localStorage.getItem('kuser')||'null');return o&&!o.guest?o:null}catch(e){return null}};
 const embedded=window.parent!==window;
 const o=R.settings;
 R.settings=()=>{
  const html=o();if(!user())return html;
  return html+`<h3 class="dz-h">Danger Zone</h3><div class="dz"><div><b>Delete account</b><div class=dim>Permanently removes your account, profile, progress, certificate and payment records. This cannot be undone.</div></div><button class="btn dz-btn" onclick="dzOpen()">Delete Account</button></div>`};
 window.dzOpen=function(){
  if(!user())return;
  const old=document.getElementById('dzm');if(old)old.remove();
  const u=user(),d=document.createElement('div');d.id='dzm';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-labelledby','dzt');
  d.innerHTML=`<div class="up-s" data-x></div><div class="up-p dz-p"><div class="up-i">⚠️</div><h2 id="dzt">Delete your account?</h2>
   <p>This permanently deletes <b></b> and everything saved with it: progress, certificate, missions and payment records. Any paid plan ends right away and is not refunded. This cannot be undone.</p>
   <label class="dz-l">Type <b>DELETE</b> to confirm<input id="dzin" autocomplete="off" autocapitalize="characters" spellcheck="false"></label>
   <div id="dzerr" class="dz-err" role="alert"></div>
   <div class="up-a"><button class="btn dz-btn" id="dzgo" disabled>Delete my account</button><button class="btn ghost" data-x>Cancel</button></div></div>`;
  d.querySelector('b').textContent=u.email||u.user||'your account';
  document.body.appendChild(d);
  const close=()=>{d.remove();document.removeEventListener('keydown',key,true)};
  const key=e=>{if(e.key=='Escape'){e.stopPropagation();close()}};document.addEventListener('keydown',key,true);
  const go=d.querySelector('#dzgo'),inp2=d.querySelector('#dzin');
  inp2.oninput=()=>{go.disabled=inp2.value.trim()!=='DELETE'};
  d.addEventListener('click',e=>{if(e.target.closest('[data-x]'))close()});
  go.onclick=()=>{
   if(inp2.value.trim()!=='DELETE')return;
   go.disabled=true;go.textContent='Deleting...';d.querySelector('#dzerr').textContent='';
   if(embedded){try{window.parent.postMessage({shellwise:'delete'},location.origin)}catch(e){}}
   else{d.querySelector('#dzerr').textContent='Open the lab from the website to delete your account.';go.textContent='Delete my account';go.disabled=false}
  };
  inp2.focus();
 };
 window.addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==window.parent)return;
  const m=e.data;if(!m||m.shellwiseReply!=='delete-failed')return;
  const er=document.getElementById('dzerr'),go=document.getElementById('dzgo');
  if(er)er.textContent=String(m.message||'Could not delete your account.').slice(0,200);
  if(go){go.textContent='Delete my account';go.disabled=false}
 });
})();
