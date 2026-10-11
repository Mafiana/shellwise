// feedback.js - "Rate & suggest": star rating, feature ideas and bug reports from learners.
// Shown in the sidebar, and as a polite pop-up once the learner has been around for a few days.
// The lab cannot reach the server itself, so it asks the React app (parent window) with postMessage and the app replies.
(function(){
 const embedded=window.parent!==window;
 const user=()=>{try{const o=JSON.parse(localStorage.getItem('kuser')||'null');return o&&!o.guest?o:null}catch(e){return null}};
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const ask=(a,d)=>{if(!embedded)return;try{window.parent.postMessage({shellwise:a,data:d},location.origin)}catch(e){}};
 const DAY=864e5, FIRST_AFTER=3*DAY, LATER=7*DAY, CLOSE_SNOOZE=3*DAY;
 const get=k=>{try{return +localStorage.getItem(k)||0}catch(e){return 0}};
 const put=(k,v)=>{try{localStorage.setItem(k,String(v))}catch(e){}};
 const KINDS=[['feedback','💬 Feedback'],['feature','💡 Feature idea'],['bug','🐞 Bug']];
 const HINT={feedback:'What do you like, and what could be better?',feature:'What should we add to Shellwise?',bug:'What went wrong? Tell us what you clicked and what you saw.'};
 const LABEL=['','Poor','Fair','Good','Very good','Excellent'];

 // styles live here so this file works on its own
 if(!document.getElementById('fb-css')){const s=document.createElement('style');s.id='fb-css';s.textContent=
  '.fb{max-width:560px;margin:0 auto}.fb h2{margin:0 0 4px}.fb .fb-p{color:var(--dim);margin:0 0 14px}'
  +'.fb-st{display:flex;gap:6px;margin:6px 0 4px}.fb-st button{background:none;border:0;padding:2px;font-size:34px;line-height:1;cursor:pointer;color:var(--line);transition:transform .12s,color .12s}'
  +'.fb-st button.on{color:#ffc53d}.fb-st button:hover{transform:scale(1.15)}.fb-st button:focus-visible{outline:2px solid var(--teal);border-radius:6px}'
  +'.fb-lb{min-height:20px;color:var(--warn);font-weight:700;font-size:13px;margin:0 0 10px}'
  +'.fb-k{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 10px}.fb-k button{background:var(--card);color:var(--fg);border:1px solid var(--line);border-radius:999px;padding:7px 13px;font:inherit;font-size:13px;cursor:pointer}'
  +'.fb-k button.on{border-color:var(--blue);color:var(--blue);font-weight:700}'
  +'.fb textarea,.fbp textarea{width:100%;box-sizing:border-box;min-height:96px;resize:vertical;background:var(--card);color:var(--fg);border:1px solid var(--line);border-radius:10px;padding:10px 12px;font:inherit}'
  +'.fb textarea:focus,.fbp textarea:focus{outline:none;border-color:var(--blue)}'
  +'.fb-er{color:var(--bad);min-height:18px;margin:6px 0 0;font-size:13px}.fb-ok{text-align:center;padding:28px 10px}.fb-ok b{font-size:20px;display:block;margin-bottom:6px}'
  +'.fbo{position:fixed;inset:0;z-index:9000;display:grid;place-items:center;padding:16px;background:#050a16b8;backdrop-filter:blur(2px)}'
  +'.fbp{position:relative;width:min(420px,100%);box-sizing:border-box;background:var(--side);color:var(--fg);border:1px solid var(--line);border-radius:16px;padding:22px 20px 18px;box-shadow:0 24px 60px #000a}'
  +'.fbp h3{margin:0 0 4px;font-size:18px}.fbp p{margin:0 0 8px;color:var(--dim);font-size:14px}.fbp .fb-st{justify-content:center}.fbp .fb-lb{text-align:center}'
  +'.fbp-x{position:absolute;top:8px;right:8px;width:32px;height:32px;border-radius:9px;border:1px solid var(--line);background:none;color:var(--fg);font-size:20px;cursor:pointer}'
  +'.fbp-a{display:flex;gap:8px;align-items:center;margin-top:10px}.fbp-a .btn{margin:0}.fbp-l{background:none;border:0;color:var(--dim);font:inherit;cursor:pointer;text-decoration:underline;padding:8px}';
  document.head.appendChild(s)}

 let st={stars:0,kind:'feedback',msg:'',busy:false,err:'',done:false};
 let pop=null,popWanted=false;

 const starRow=(fn)=>{let h='<div class="fb-st" role="radiogroup" aria-label="Rating">';
  for(let i=1;i<=5;i++)h+='<button type="button" role="radio" aria-checked="'+(st.stars===i)+'" aria-label="'+i+' star'+(i>1?'s':'')+'" class="'+(i<=st.stars?'on':'')+'" onclick="'+fn+'('+i+')">★</button>';
  return h+'</div><p class="fb-lb" id="fblb">'+esc(LABEL[st.stars]||'')+'</p>'};

 function view(){
  const u=user();
  if(!u)return'<h2>⭐ Rate &amp; suggest</h2><p class=dim>Log in to rate Shellwise and send ideas.</p><button class=btn onclick="location.href=\'/auth?mode=login\'">Log in</button>';
  if(!embedded)return'<h2>⭐ Rate &amp; suggest</h2><p class=dim>Open the lab from the website to send feedback.</p>';
  if(st.done)return'<div class="fb"><div class="fb-ok"><b>Thank you! 🎉</b><p class=dim>Your feedback helps us make Shellwise better.</p><button class=btn onclick="fbAgain()">Send more</button></div></div>';
  let k='';KINDS.forEach(x=>{k+='<button type="button" class="'+(st.kind===x[0]?'on':'')+'" onclick="fbKind(\''+x[0]+'\')">'+x[1]+'</button>'});
  return'<div class="fb"><h2>⭐ Rate &amp; suggest</h2><p class="fb-p">How is Shellwise working for you? Rate it, suggest a feature, or report a bug.</p>'
   +starRow('fbStar')+'<div class="fb-k" role="group" aria-label="Type">'+k+'</div>'
   +'<textarea id="fbm" maxlength="1500" placeholder="'+esc(HINT[st.kind])+'" aria-label="Your message" oninput="fbText(this.value)">'+esc(st.msg)+'</textarea>'
   +'<p class="fb-er" id="fber" role="alert">'+esc(st.err)+'</p>'
   +'<button class=btn id="fbgo" onclick="fbSend()"'+(st.busy?' disabled':'')+'>'+(st.busy?'Sending...':'Send')+'</button></div>';
 }
 window.fbStar=n=>{st.stars=n;const w=document.querySelector('.fb:not(.fbp) .fb-st');if(w){w.querySelectorAll('button').forEach((x,i)=>{x.className=i<n?'on':'';x.setAttribute('aria-checked',String(i+1===n))})}const l=document.getElementById('fblb');if(l)l.textContent=LABEL[n]||''};
 window.fbKind=k=>{st.kind=k;const m=document.getElementById('fbm');if(m)st.msg=m.value;go('feedback')};
 window.fbText=v=>{st.msg=v};
 window.fbAgain=()=>{st={stars:0,kind:'feedback',msg:'',busy:false,err:'',done:false};go('feedback')};
 window.fbSend=()=>{
  if(st.busy)return;
  const m=document.getElementById('fbm');if(m)st.msg=m.value;
  const msg=st.msg.trim();
  if(!st.stars&&msg.length<3){st.err='Pick a star rating or write a short message.';const e=document.getElementById('fber');if(e)e.textContent=st.err;return}
  st.busy=true;st.err='';const b=document.getElementById('fbgo');if(b){b.disabled=true;b.textContent='Sending...'}
  ask('feedback',{stars:st.stars||null,kind:st.kind,message:msg});
 };
 R.feedback=()=>view();

 // ---- the pop-up (a few days after the first visit; once, then rarely) ----
 function closePop(){if(pop){pop.remove();pop=null}}
 let ps={stars:0};
 function popHtml(){
  let h='<div class="fbp" role="dialog" aria-modal="true" aria-labelledby="fbpt"><button class="fbp-x" aria-label="Close" onclick="fbpClose()">&times;</button>'
   +'<h3 id="fbpt">Enjoying Shellwise? 🙂</h3><p>Rate your experience. It takes ten seconds and helps a lot.</p>'
   +'<div class="fb-st" role="radiogroup" aria-label="Rating">';
  for(let i=1;i<=5;i++)h+='<button type="button" role="radio" aria-label="'+i+' star'+(i>1?'s':'')+'" class="'+(i<=ps.stars?'on':'')+'" onclick="fbpStar('+i+')">★</button>';
  h+='</div><p class="fb-lb">'+esc(LABEL[ps.stars]||'')+'</p>'
   +'<textarea id="fbpm" maxlength="1500" placeholder="Anything we should improve or add? (optional)" aria-label="Optional comment"></textarea>'
   +'<p class="fb-er" id="fbpe" role="alert"></p>'
   +'<div class="fbp-a"><button class="btn" id="fbpgo" onclick="fbpSend()">Send</button><button class="fbp-l" onclick="fbpLater()">Maybe later</button></div></div>';
  return h;
 }
 function showPop(){
  if(pop||!user()||!embedded)return;
  ps={stars:0};pop=document.createElement('div');pop.className='fbo';pop.innerHTML=popHtml();
  pop.addEventListener('mousedown',e=>{if(e.target===pop)fbpClose()});
  document.body.appendChild(pop);
 }
 window.fbpStar=n=>{ps.stars=n;if(!pop)return;pop.querySelectorAll('.fb-st button').forEach((x,i)=>{x.className=i<n?'on':''});const l=pop.querySelector('.fb-lb');if(l)l.textContent=LABEL[n]||''};
 window.fbpClose=()=>{put('kfb_snooze',Date.now()+CLOSE_SNOOZE);closePop()};
 window.fbpLater=()=>{put('kfb_snooze',Date.now()+LATER);closePop()};
 window.fbpSend=()=>{
  const m=pop&&pop.querySelector('#fbpm'),msg=m?m.value.trim():'';
  if(!ps.stars){const e=document.getElementById('fbpe');if(e)e.textContent='Tap a star to rate.';return}
  const b=document.getElementById('fbpgo');if(b){b.disabled=true;b.textContent='Sending...'}
  popSending=true;ask('feedback',{stars:ps.stars,kind:'feedback',message:msg});
 };
 let popSending=false;

 // decide whether to show the pop-up
 function maybePop(){
  if(!user()||!embedded)return;
  const now=Date.now();
  if(!get('kfb_first'))put('kfb_first',now);
  if(get('kfb_done'))return;
  if(now-get('kfb_first')<FIRST_AFTER)return;
  if(get('kfb_snooze')>now)return;
  popWanted=true;ask('feedbackmy');           // check the server first, so we never ask someone who already answered
  setTimeout(()=>{if(popWanted){popWanted=false;showPop()}},4000); // server did not answer: ask anyway
 }

 window.addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==window.parent)return;
  const m=e.data;if(!m||m.shellwiseReply!=='feedback')return;
  const d=m.data;
  if(d&&typeof d.count==='number'&&!('ok' in d)){ // answer to feedbackmy
   if(!popWanted)return;popWanted=false;
   if(d.count>0){put('kfb_done',Date.now());return}
   setTimeout(showPop,20000);return;
  }
  if(popSending){ // the pop-up form was sent
   popSending=false;
   if(d&&d.error){const er=document.getElementById('fbpe');if(er)er.textContent=String(d.error);const b=document.getElementById('fbpgo');if(b){b.disabled=false;b.textContent='Send'}return}
   put('kfb_done',Date.now());
   if(pop){pop.querySelector('.fbp').innerHTML='<div class="fb-ok"><b>Thank you! 🎉</b><p>Your feedback helps us make Shellwise better.</p></div>';setTimeout(closePop,1800)}
   return;
  }
  // the sidebar form was sent
  st.busy=false;
  if(d&&d.error){st.err=String(d.error);const er=document.getElementById('fber');if(er)er.textContent=st.err;const b=document.getElementById('fbgo');if(b){b.disabled=false;b.textContent='Send'}return}
  put('kfb_done',Date.now());st.done=true;go('feedback');
 });
 setTimeout(maybePop,12000);
})();
