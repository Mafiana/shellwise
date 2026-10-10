// support.js - "Learner support": a chat room with the Shellwise admin. Messages show up in the admin panel under Tickets.
// The lab cannot reach the server itself, so it asks the React app (parent window) with postMessage and the app replies.
(function(){
 const embedded=window.parent!==window;
 const user=()=>{try{const o=JSON.parse(localStorage.getItem('kuser')||'null');return o&&!o.guest?o:null}catch(e){return null}};
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const ask=(a,d)=>{if(!embedded)return;try{window.parent.postMessage({shellwise:a,data:d},location.origin)}catch(e){}};
 let box=null,err='',sending=false,timer=0;
 const hm=t=>{const d=new Date(t);return d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})};
 const dl=t=>{const d=new Date(t),n=new Date(),y=new Date(Date.now()-864e5);const same=(a,b)=>a.toDateString()==b.toDateString();return same(d,n)?'Today':same(d,y)?'Yesterday':d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})};
 const active=()=>!!document.getElementById('spl');
 const badge=()=>{const n=box&&+box.unread||0;const e=document.getElementById('supn');if(e){e.textContent=n>9?'9+':String(n);e.hidden=!n||active()}};

 function list(){
  if(!box)return'<p class="sup-e">Loading your conversation...</p>';
  const ms=Array.isArray(box.messages)?box.messages:[];
  if(!ms.length)return'<div class="sup-hello"><b>Hi'+(user()?' '+esc(user().name||user().user||''):'')+'! 👋</b><p>Tell us what you need help with and an admin will reply here. Your conversation stays in this room.</p></div>';
  let out='',last='';
  ms.forEach((m,i)=>{
   const d=dl(m.created_at);if(d!==last){out+='<div class="sup-day"><span>'+esc(d)+'</span></div>';last=d}
   out+='<div class="sup-m '+(m.sender=='admin'?'adm':'me')+'"><div class="sup-b">'+(m.sender=='admin'?'<small>Shellwise support</small>':'')+'<p>'+esc(m.body)+'</p><time>'+esc(hm(m.created_at))+'</time></div></div>';
  });
  if(!box.open)out+='<div class="sup-day"><span>Ticket closed. Send a message to start a new one.</span></div>';
  return out;
 }
 function paintList(stick){
  const l=document.getElementById('spl');if(!l)return;
  const near=l.scrollHeight-l.scrollTop-l.clientHeight<80;
  l.innerHTML=list();
  if(stick||near)l.scrollTop=l.scrollHeight;
  const e=document.getElementById('spe');if(e)e.textContent=err;
  const st=document.getElementById('sps');if(st){st.className='sup-st'+(box&&box.open?' on':'');st.textContent=box&&box.open?'Open':'Waiting for you'}
 }
 function view(){
  const u=user();
  if(!u)return'<h2>🎧 Customer support</h2><p class=dim>Log in to chat with the Shellwise team.</p><button class=btn onclick="location.href=\'/auth?mode=login\'">Log in</button>';
  if(!embedded)return'<h2>🎧 Customer support</h2><p class=dim>Open the lab from the website to chat with support.</p>';
  return'<div class="sup"><div class="sup-h"><div><h2>🎧 Customer support</h2><p class=dim>Type what you need. An admin will reply here.</p></div><span id="sps" class="sup-st">...</span></div>'
   +'<div id="spl" class="sup-l" aria-live="polite"></div><p id="spe" class="sup-er" role="alert"></p>'
   +'<form class="sup-f" onsubmit="return supSend(event)"><textarea id="spi" rows="1" maxlength="2000" placeholder="Type your message..." aria-label="Message to support" onkeydown="supKey(event)" oninput="supGrow(this)"></textarea><button class="btn sup-go" id="spb" type="submit">Send</button></form></div>';
 }
 window.supGrow=t=>{t.style.height='auto';t.style.height=Math.min(120,t.scrollHeight)+'px'};
 window.supKey=e=>{if(e.key=='Enter'&&!e.shiftKey){e.preventDefault();supSend(e)}};
 window.supSend=e=>{
  if(e&&e.preventDefault)e.preventDefault();
  const t=document.getElementById('spi');if(!t||sending)return false;
  const body=t.value.trim();if(!body)return false;
  sending=true;err='';t.value='';supGrow(t);
  // show it straight away; the server copy replaces it
  if(!box)box={open:true,unread:0,messages:[]};
  box.messages=(box.messages||[]).concat([{id:'x'+Date.now(),sender:'user',body,created_at:new Date().toISOString()}]);box.open=true;
  paintList(true);ask('supportsend',{body});
  return false;
 };
 function open(){
  err='';
  if(user()&&embedded){ask('support',{mark:true});clearInterval(timer);timer=setInterval(()=>{if(!active()){clearInterval(timer);return}ask('support',{mark:true})},5000)}
  setTimeout(()=>{paintList(true);badge()},0);
 }
 R.support=()=>{setTimeout(open,0);return view()};
 const og=window.go;
 window.go=function(v){og(v);if(v!='support'){clearInterval(timer);badge()}};

 window.addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==window.parent)return;
  const m=e.data;if(!m||m.shellwiseReply!=='support')return;
  sending=false;
  const d=m.data;
  if(d&&d.error){err=String(d.error);paintList(false);return}
  if(d&&Array.isArray(d.messages)){
   const n=d.messages.length;
   box={open:!!d.open,unread:active()?0:(+d.unread||0),messages:d.messages.slice(-100).map(x=>({id:x.id,sender:x.sender=='admin'?'admin':'user',body:String(x.body||'').slice(0,2000),created_at:x.created_at}))};
   paintList(false);badge();
  }
 });
 // The red number on the sidebar button: new replies from support while you were elsewhere.
 const poll=()=>{if(user()&&embedded&&!active())ask('support',{mark:false})};
 window.addEventListener('sw-lab-ready',poll);setTimeout(poll,2500);setInterval(poll,60000);
})();
