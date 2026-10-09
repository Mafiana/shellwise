// snake.js - Snake, played with commands. The board fills the top half of the window and the terminal the bottom half.
// Type the right command before the timer runs out: the snake reaches the ball and grows. Only the timer ends the game.
// The game state lives in G (script.js); these helpers draw the board and run the eating animation.
const SN={W:28,H:11,C:20,body:[],ball:null,iv:0,hide:0,over:0};
const snT=score=>Math.max(10,15-Math.floor(score/4)*.5); // seconds per command: 15, easing down to 10 as the snake grows
// Extra snake-only commands so the snake can keep growing (each unlocks with its module).
const snx=()=>{const R=r=>l=>r.test(l);return [
{m:0,p:'Print today\'s date',t:R(/^date$/)},{m:0,p:'Show the computer name',t:R(/^hostname$/)},{m:0,p:'Show your user and group IDs',t:R(/^id$/)},
{m:1,p:'Print the word hello with echo',t:R(/^echo\s+["']?hello["']?$/)},{m:1,p:'List the Desktop folder',t:R(/^ls\s+(~\/|\/home\/kali\/)?Desktop\/?$/)},
{m:1,p:'List the /etc folder without leaving home',t:R(/^ls\s+\/etc\/?$/)},{m:1,p:'Long listing with human-readable sizes',t:R(/^ls\s+-\w*l\w*h|^ls\s+-\w*h\w*l/)},
{m:2,p:'Go into the Desktop folder',t:()=>cwd==H0+'/Desktop'},{m:2,p:'Go to /var/log',t:()=>cwd=='/var/log'},{m:2,p:'Go to /tmp',t:()=>cwd=='/tmp'},
{m:2,p:'Go to the root folder /',t:()=>cwd=='/'},{m:2,s:'/var/log',p:'Go home with a single short command',t:()=>cwd==H0},
{m:3,p:'Show the last 2 lines of notes.txt',t:R(/^tail\s+-n\s*2\s+\S*notes\.txt$/)},{m:3,p:'Count the words in notes.txt',t:R(/^wc\s+-w\s+\S*notes\.txt$/)},
{m:3,p:'Print the file /etc/hostname',t:R(/^cat\s+\/etc\/hostname$/)},
{m:4,p:'Create an empty file named hello.txt',t:R(/^touch\s+hello\.txt$/)},{m:4,p:'Create a folder named pond',t:R(/^mkdir\s+pond$/)},
{m:5,p:'Copy notes.txt to copy.txt',t:R(/^cp\s+notes\.txt\s+copy\.txt$/)},
{m:6,p:'Count lines containing kali in notes.txt with grep -c',t:R(/^grep\s+-c\s+kali\s+\S*notes\.txt$/)},{m:6,p:'Search notes.txt for "linux", ignoring case',t:R(/^grep\s+-i\s+linux\s+\S*notes\.txt$/)},
{m:7,p:'Show the kernel release with uname',t:R(/^uname\s+-r$/)},
{m:10,p:'Find every .txt file under your home folder',t:R(/^find\s+(~|\.|\/home\/kali)\s+-name\s+["']?\*\.txt["']?$/)},
{m:12,p:'Show disk space in human-readable form',t:R(/^df\s+-h$/)},{m:12,p:'Show how long the system has been up',t:R(/^uptime$/)}]};
function pickSn(){const all=CH.concat(snx()),a=all.filter(c=>done[c.m]);return (a.length?a:all.filter(c=>c.m<=3)).slice().sort(()=>Math.random()-.5)}
function snBall(){let b,n=0;do{b={x:Math.floor(Math.random()*SN.W),y:Math.floor(Math.random()*SN.H)};n++}while(n<80&&(SN.body.some(s=>s.x==b.x&&s.y==b.y)||(SN.body[0]&&Math.abs(b.x-SN.body[0].x)+Math.abs(b.y-SN.body[0].y)<5)));SN.ball=b}
function snDraw(msg){
 const cv=document.getElementById('snc');if(!cv)return;const x=cv.getContext('2d'),C=SN.C;
 x.fillStyle='#10141b';x.fillRect(0,0,cv.width,cv.height);
 x.fillStyle='#ffffff10';for(let i=0;i<SN.W;i++)for(let j=0;j<SN.H;j++)x.fillRect(i*C+C/2-1,j*C+C/2-1,2,2);
 if(SN.ball){const b=SN.ball,cx=b.x*C+C/2,cy=b.y*C+C/2,g=x.createRadialGradient(cx-3,cy-3,1,cx,cy,C/2);g.addColorStop(0,'#ffb3b3');g.addColorStop(1,'#e23b3b');x.fillStyle=g;x.beginPath();x.arc(cx,cy,C/2-2,0,7);x.fill();x.fillStyle='#4fe08f';x.fillRect(cx-1,cy-C/2,3,4)}
 const n=SN.body.length;
 for(let k=n-1;k>=0;k--){const s=SN.body[k],t=k/Math.max(1,n-1);x.fillStyle=k?`hsl(${205-t*45},85%,${58-t*14}%)`:'#5db2ff';const r=k?4:7;x.beginPath();x.roundRect?x.roundRect(s.x*C+1,s.y*C+1,C-2,C-2,r):x.rect(s.x*C+1,s.y*C+1,C-2,C-2);x.fill()}
 const h=SN.body[0];if(h){x.fillStyle='#06101f';x.fillRect(h.x*C+C*.3,h.y*C+C*.3,3,3);x.fillRect(h.x*C+C*.6,h.y*C+C*.3,3,3)}
 if(msg){x.fillStyle='#000a';x.fillRect(0,0,cv.width,cv.height);x.fillStyle='#ff6b6b';x.font='700 26px "JetBrains Mono",monospace';x.textAlign='center';x.fillText(msg[0],cv.width/2,cv.height/2-4);x.fillStyle='#d8dce4';x.font='15px "JetBrains Mono",monospace';x.fillText(msg[1],cv.width/2,cv.height/2+22)}
}
function snShow(){
 clearTimeout(SN.hide);clearInterval(SN.iv);
 const box=document.getElementById('snk');if(!box)return;
 box.innerHTML=`<div class="sn-top"><div class="sn-task" id="sntask"></div><div class="sn-meta" id="snmeta"></div></div><div class="sn-bar"><i id="snbar"></i></div><div class="sn-board"><canvas id="snc" width="${SN.W*SN.C}" height="${SN.H*SN.C}" aria-label="Snake board"></canvas></div>`;
 SN.body=[{x:5,y:5},{x:4,y:5},{x:3,y:5}];snBall();snDraw();
 document.getElementById('win').classList.add('sn');
 snHud();setTimeout(()=>{try{inp.focus()}catch(e){}},30);
}
function snHide(){clearInterval(SN.iv);const w=document.getElementById('win');if(w)w.classList.remove('sn')}
function snHud(){
 if(!G||G.type!='snake')return;
 const t=document.getElementById('sntask'),m=document.getElementById('snmeta'),bar=document.getElementById('snbar');if(!t)return;
 const l=Math.max(0,(G.end-Date.now())/1000),tot=snT(G.score);
 t.innerHTML=G.busy?'🐍 Nice! Eating...':'Type the command: <b>'+esc(G.t.p)+'</b>';
 m.innerHTML=`Score <b>${G.score}</b> · ⏱ <b class="${!G.busy&&l<=3?'bad':'warn'}">${G.busy?tot.toFixed(0):l.toFixed(1)}s</b>`;
 bar.style.width=(G.busy?100:Math.min(100,l/tot*100))+'%';bar.className=!G.busy&&l<=3?'low':'';
}
function snEat(done2){ // walk the snake to the ball, grow it, then continue
 const b=SN.ball,steps=[];let x=SN.body[0].x,y=SN.body[0].y;
 while(x!=b.x){x+=Math.sign(b.x-x);steps.push({x,y})}
 while(y!=b.y){y+=Math.sign(b.y-y);steps.push({x,y})}
 let i=0;clearInterval(SN.iv);
 SN.iv=setInterval(()=>{
  if(i<steps.length){SN.body.unshift(steps[i]);i++;if(i<steps.length)SN.body.pop();snDraw()}
  else{clearInterval(SN.iv);SN.body.length=Math.min(SN.body.length,SN.W*SN.H-2);snBall();snDraw();setTimeout(()=>{if(G&&G.type=='snake')done2()},180)}
 },steps.length>12?32:55);
}
function snOver(score){ // the game state is already cleared when this runs
 clearInterval(SN.iv);snDraw(['SNAKE OVER','Score: '+score]);
 const bar=document.getElementById('snbar');if(bar)bar.style.width='0';
 clearTimeout(SN.hide);SN.hide=setTimeout(snHide,3500);
}
