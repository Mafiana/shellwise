const $=s=>document.querySelector(s),out=$('#out'),inp=$('#in'),term=$('#term');
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
// SECURITY / RESILIENCE: central output + CPU budget. P() is the single output funnel for every command (including new command files),
// so the caps below apply automatically. BUD.on is true only while run() executes a command line.
const BUD=window.BUD={on:false,lines:0,chars:0,ops:0,t0:0,depth:0,MAXL:5000,MAXC:2000000,MAXOPS:50000,MAXMS:2500,OUTN:2000,OUTC:3000000};
class Budget extends Error{};window.Budget=Budget;
BUD.reset=()=>{BUD.lines=0;BUD.chars=0;BUD.ops=0;BUD.depth=0;BUD.t0=Date.now()};
BUD.tick=()=>{if(BUD.on&&(++BUD.ops>BUD.MAXOPS||Date.now()-BUD.t0>BUD.MAXMS))throw new Budget('cpu budget')};
let cap=null,outChars=0;const P=(h='')=>{h=String(h);if(h.length>100000)h=h.slice(0,100000)+'...';
 if(BUD.on&&(++BUD.lines>BUD.MAXL||(BUD.chars+=h.length)>BUD.MAXC))throw new Budget('output budget');
 if(cap){cap.push(h);return}
 if(!out.firstChild)outChars=0;const d=document.createElement('div');d.innerHTML=h;d._n=h.length;outChars+=h.length;out.appendChild(d);
 while(out.firstChild&&(out.childElementCount>BUD.OUTN||outChars>BUD.OUTC)){outChars-=out.firstChild._n||0;out.removeChild(out.firstChild)}
 term.scrollTop=term.scrollHeight};
// ---------- filesystem ----------
// SECURITY: directory tables are null-prototype maps so user-chosen names like __proto__ / constructor / toString are just ordinary names
const F=(c)=>({t:'f',c:typeof c=='string'&&c.length>1e6?c.slice(0,1e6):c}),D=(c)=>({t:'d',c:Object.assign(Object.create(null),c)});
const dclone=n=>{if(!n||typeof n!='object')return n;const o=Object.assign({},n);if(n.t=='d'){o.c=Object.create(null);for(const k of Object.keys(n.c))o.c[k]=dclone(n.c[k])}else if(n.arc)o.arc=JSON.parse(JSON.stringify(n.arc));return o};
const ROOT=D({home:D({kali:D({Desktop:D({}),Documents:D({'todo.txt':F('buy coffee\nlearn bash\nbreak nothing\n')}),Downloads:D({}),'notes.txt':F('kali linux rocks\nlearn the shell\npractice every day\nkali tools are powerful\nstay ethical\n'),'secret.txt':F('flag{you_found_the_hidden_flag}\n'),'.bashrc':F('# kali bashrc\nalias ll="ls -la"\n')})}),etc:D({hostname:F('kali\n'),passwd:F('root:x:0:0:root:/root:/bin/bash\nkali:x:1000:1000:kali:/home/kali:/bin/bash\n')}),tmp:D({}),usr:D({bin:D({})})});
let cwd='/home/kali';
const parts=p=>{p=p.replace(/^~/,'/home/kali');let s=p.startsWith('/')?[]:cwd.split('/').filter(Boolean);for(const x of p.split('/')){if(!x||x=='.')continue;if(x=='..')s.pop();else s.push(x)}return s};
const get=p=>{let n=ROOT;for(const x of parts(p)){if(!n||n.t!='d'||!n.c[x])return null;n=n.c[x]}return n};
const par=p=>{const s=parts(p),name=s.pop();let n=ROOT;for(const x of s)n=n&&n.c&&n.c[x];return[n&&n.t=='d'?n:null,name]};
const pdir=()=>cwd=='/home/kali'?'~':cwd.startsWith('/home/kali/')?'~'+cwd.slice(9):cwd;
// ---------- modules ----------
const M=[
{n:'Where am I?',c:['pwd'],d:'Every shell session lives in a directory. <span class=hl>pwd</span> (print working directory) shows where you are.',t:'Type: pwd',ok:/^pwd$/},
{n:'Looking around',c:['ls'],d:'<span class=hl>ls</span> lists files. Add <span class=hl>-l</span> for details and <span class=hl>-a</span> to show hidden files (names starting with a dot).',t:'Type: ls -a',ok:/^ls\s+-\w*a/},
{n:'Moving around',c:['cd'],d:'<span class=hl>cd folder</span> enters a folder, <span class=hl>cd ..</span> goes up, <span class=hl>cd ~</span> goes home.',t:'Type: cd Documents',ok:/^cd\s+Documents\/?$/},
{n:'Reading files',c:['cat','head','tail','wc'],d:'<span class=hl>cat file</span> prints a file. <span class=hl>head -n 2 file</span> shows the first lines, <span class=hl>wc -l file</span> counts lines.',t:'Type: cat todo.txt',ok:/^cat\s+todo\.txt$/},
{n:'Making things',c:['mkdir','touch','echo'],d:'<span class=hl>mkdir name</span> creates a folder, <span class=hl>touch file</span> creates an empty file, <span class=hl>echo hi &gt; file</span> writes text into a file.',t:'Type: mkdir lab',ok:/^mkdir\s+lab\/?$/},
{n:'Copy, move, delete',c:['cp','mv','rm'],d:'<span class=hl>cp a b</span> copies, <span class=hl>mv a b</span> moves or renames, <span class=hl>rm file</span> deletes (no recycle bin!).',t:'Type: cp ~/notes.txt ~/lab/copy.txt  (from any folder)',ok:/^cp\s+\S*notes\.txt\s+\S*copy\.txt$/},
{n:'Searching text',c:['grep','sort','uniq'],d:'<span class=hl>grep word file</span> prints lines containing a word. <span class=hl>-i</span> ignores case.',t:'Type: grep kali ~/notes.txt',ok:/^grep\s+(-i\s+)?kali\s+\S*notes\.txt$/},
{n:'Who & what',c:['whoami','id','uname','hostname','date'],d:'<span class=hl>whoami</span> shows your user, <span class=hl>uname -a</span> shows the system, <span class=hl>date</span> shows the time.',t:'Type: uname -a',ok:/^uname\s+-a$/},
{n:'Network basics',c:['ifconfig','ping','nmap'],d:'<span class=hl>ifconfig</span> shows interfaces, <span class=hl>ping host</span> tests reachability, <span class=hl>nmap host</span> scans ports. Only scan systems you own or have permission to test.',t:'Type: nmap 127.0.0.1',ok:/^nmap\s+127\.0\.0\.1$/},
{n:'Show off',c:['neofetch','history','tree'],d:'<span class=hl>neofetch</span> prints system info, <span class=hl>history</span> lists past commands, <span class=hl>tree</span> draws the folder tree.',t:'Type: neofetch',ok:/^neofetch$/}
];
const FREE=['help','learn','modules','clear','games','reset','guess','hangman','snake','hint','skip','typing','rps'];
let done=[];try{const r=kJSON('kdone',5000);if(Array.isArray(r))done=r.slice(0,200).map(Boolean)}catch(e){}
const save=()=>{try{localStorage.setItem('kdone',JSON.stringify(done))}catch(e){}};
const cur=()=>{for(let i=0;i<M.length;i++)if(!done[i])return i;return M.length};
let lesson=false,err=false,mode=null;
const modOf=c=>M.findIndex(m=>m.c.includes(c));
// ---------- commands ----------
const bad=(m)=>{err=true;if(window.QUIET)return;const c0=cap;cap=null;P(`<span class=bad>${esc(m)}</span>`);cap=c0};
const lsFmt=(n,name)=>n.t=='d'?`<span class=d>${esc(name)}</span>`:esc(name);
const C={
help(){P('<span class=hl>Free commands:</span> learn  modules  games  guess  hangman  snake  clear  reset');P('<span class=hl>Linux commands</span> (🔒 = locked until its module is done):');M.forEach((m,i)=>P(`  ${done[i]?'<span class=ok>✔</span>':'🔒'} ${m.c.join(', ')}`));P('<span class=dim>Tip: type <b>learn</b> to start. Tab completes, ↑/↓ browse history.</span>')},
modules(){P('<span class=hl>Learning modules</span>');M.forEach((m,i)=>P(` ${done[i]?'<span class=ok>[✔]</span>':i==cur()?'<span class=warn>[▶]</span>':'<span class=dim>[🔒]</span>'} ${i+1}. ${m.n} — ${m.c.join(', ')}`));P(`Progress: ${done.filter(Boolean).length}/${M.length}`)},
learn(){const i=cur();if(i>=M.length)return P('<span class=ok>🎉 All modules complete! Try the games.</span>');lesson=true;const m=M[i];P(`<span class=hl>── Module ${i+1}: ${m.n} ──</span>`);P(m.d);P(`<span class=warn>Task → ${m.t}</span>`);P('<span class=dim>(hint: type "hint" · "skip" is not allowed 😉)</span>')},
hint(){const i=cur();i<M.length?P(`<span class=warn>${M[i].t}</span>`):P('Nothing left to learn.')},
skip(){P('<span class=bad>Nice try. Complete the task to unlock more.</span>')},
reset(){done=[];save();lesson=false;P('<span class=warn>Progress reset. Type learn.</span>')},
clear(){out.innerHTML=''},
games(){P('<span class=hl>Games</span>');P('  guess    — guess the number (1-100)');P('  hangman  — guess the security word');P('  snake    — classic snake')},
pwd(){P(esc(cwd))},
ls(a){let fl=a.filter(x=>x[0]=='-').join(''),t=a.find(x=>x[0]!='-')||'.',n=get(t);if(!n)return bad(`ls: cannot access '${t}': No such file or directory`);if(n.t=='f')return P(esc(t));let k=Object.keys(n.c).sort();if(!fl.includes('a'))k=k.filter(x=>x[0]!='.');else k=['.','..',...k];if(fl.includes('l'))k.forEach(x=>{const c=n.c[x]||{t:'d',c:{}};P(`${c.t=='d'?'drwxr-xr-x':'-rw-r--r--'} 1 kali kali ${String(c.t=='f'?c.c.length:4096).padStart(5)} Oct  3 10:00 ${lsFmt(c,x)}`)});else if(cap)k.forEach(x=>P(lsFmt(n.c[x]||{t:'d'},x)));else P(k.map(x=>lsFmt(n.c[x]||{t:'d'},x)).join('  '))},
cd(a){const t=a[0]||'~',n=get(t);if(!n)return bad(`bash: cd: ${t}: No such file or directory`);if(n.t!='d')return bad(`bash: cd: ${t}: Not a directory`);cwd='/'+parts(t).join('/');setP()},
cat(a){if(!a.length)return bad('cat: missing file');a.forEach(f=>{const n=get(f);if(!n)bad(`cat: ${f}: No such file or directory`);else if(n.t=='d')bad(`cat: ${f}: Is a directory`);else n.c.split('\n').slice(0,-1).forEach(l=>P(esc(l)))})},
head(a){const i=a.indexOf('-n'),k=i>=0?+a[i+1]:10,f=a.filter((x,j)=>x[0]!='-'&&j!=i+1)[0],n=f&&get(f);if(!n||n.t!='f')return bad('head: cannot open file');n.c.split('\n').slice(0,k).forEach(l=>P(esc(l)))},
tail(a){const i=a.indexOf('-n'),k=i>=0?+a[i+1]:10,f=a.filter((x,j)=>x[0]!='-'&&j!=i+1)[0],n=f&&get(f);if(!n||n.t!='f')return bad('tail: cannot open file');n.c.split('\n').slice(0,-1).slice(-k).forEach(l=>P(esc(l)))},
wc(a){const f=a.find(x=>x[0]!='-'),n=f&&get(f);if(!n||n.t!='f')return bad('wc: cannot open file');const l=n.c.split('\n').length-1,w=n.c.split(/\s+/).filter(Boolean).length;P(a.includes('-l')?`${l} ${esc(f)}`:`${l} ${w} ${n.c.length} ${esc(f)}`)},
echo(a){const i=a.findIndex(x=>x=='>'||x=='>>');if(i<0)return P(esc(a.join(' ')));const txt=a.slice(0,i).join(' ')+'\n',[p,nm]=par(a[i+1]||'');if(!p)return bad('bash: no such directory');const f=p.c[nm];if(f&&f.t=='d')return bad('bash: Is a directory');p.c[nm]=F((a[i]=='>>'&&f?f.c:'')+txt)},
mkdir(a){if(!a[0])return bad('mkdir: missing operand');const[p,n]=par(a[0]);if(!p)return bad(`mkdir: cannot create directory '${a[0]}'`);if(p.c[n])return bad(`mkdir: cannot create directory '${a[0]}': File exists`);p.c[n]=D({})},
touch(a){if(!a[0])return bad('touch: missing file operand');const[p,n]=par(a[0]);if(!p)return bad('touch: no such directory');if(!p.c[n])p.c[n]=F('')},
rm(a){const r=a.some(x=>/^-\w*r/.test(x)),f=a.filter(x=>x[0]!='-');if(!f.length)return bad('rm: missing operand');f.forEach(x=>{const[p,n]=par(x);if(!p||!p.c[n])return bad(`rm: cannot remove '${x}': No such file or directory`);if(p.c[n].t=='d'&&!r)return bad(`rm: cannot remove '${x}': Is a directory (use -r)`);delete p.c[n]})},
cp(a){if(a.length<2)return bad('cp: missing destination');const s=get(a[0]);if(!s)return bad(`cp: cannot stat '${a[0]}'`);let[p,n]=par(a[1]);const d=get(a[1]);if(d&&d.t=='d'){p=d;n=parts(a[0]).pop()}if(!p)return bad(`cp: cannot create regular file '${a[1]}': No such file or directory`);p.c[n]=dclone(s)},
mv(a){if(a.length<2)return bad('mv: missing destination');const s=get(a[0]);if(!s)return bad(`mv: cannot stat '${a[0]}'`);let[p,n]=par(a[1]);const d=get(a[1]);if(d&&d.t=='d'){p=d;n=parts(a[0]).pop()}if(!p)return bad(`mv: cannot move '${a[0]}' to '${a[1]}': No such file or directory`);p.c[n]=s;const[sp,sn]=par(a[0]);if(sp.c[sn]===s&&sp!==p||sn!==n)delete sp.c[sn]},
grep(a){const i=a.includes('-i'),r=a.filter(x=>x[0]!='-'),n=r[1]&&get(r[1]);if(!n||n.t!='f')return bad('grep: file not found');const re=new RegExp(r[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),i?'gi':'g');n.c.split('\n').slice(0,-1).filter(l=>l.match(re)).forEach(l=>P(esc(l).replace(re,m=>`<span class=bad>${m}</span>`)))},
sort(a){const n=a[0]&&get(a[0]);if(!n||n.t!='f')return bad('sort: file not found');n.c.split('\n').slice(0,-1).sort().forEach(l=>P(esc(l)))},
uniq(a){const n=a[0]&&get(a[0]);if(!n||n.t!='f')return bad('uniq: file not found');let l0;n.c.split('\n').slice(0,-1).forEach(l=>{if(l!=l0)P(esc(l));l0=l})},
whoami(){P('kali')},id(){P('uid=1000(kali) gid=1000(kali) groups=1000(kali),27(sudo)')},hostname(){P('kali')},date(){P(new Date().toString())},
uname(a){P(a.includes('-a')?'Linux kali 6.8.11-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.8.11 x86_64 GNU/Linux':'Linux')},
ifconfig(){P('eth0: flags=4163&lt;UP,BROADCAST,RUNNING,MULTICAST&gt;  mtu 1500\n        inet 10.0.2.15  netmask 255.255.255.0  broadcast 10.0.2.255\n        ether 08:00:27:ab:cd:ef  txqueuelen 1000\nlo: flags=73&lt;UP,LOOPBACK,RUNNING&gt;  mtu 65536\n        inet 127.0.0.1  netmask 255.0.0.0')},
ping(a){if(!a[0])return bad('ping: usage error: Destination address required');P(`PING ${esc(a[0])} 56(84) bytes of data.`);for(let i=1;i<=4;i++)P(`64 bytes from ${esc(a[0])}: icmp_seq=${i} ttl=64 time=${(Math.random()*20+.5).toFixed(1)} ms`);P(`--- ${esc(a[0])} ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss`)},
nmap(a){if(!a[0])return bad('nmap: no target specified');P(`Starting Nmap 7.95 ( https://nmap.org )\nNmap scan report for ${esc(a[0])}\nHost is up (0.00012s latency).\nPORT   STATE SERVICE\n22/tcp open  ssh\n80/tcp open  http\n443/tcp open https\n\nNmap done: 1 IP address (1 host up) scanned in 0.08 seconds`);P('<span class=dim>(simulated output)</span>')},
neofetch(){P('<span class=u>kali</span>@<span class=u>kali</span>\n-----------\n<span class=u>OS</span>: Kali GNU/Linux Rolling x86_64\n<span class=u>Kernel</span>: 6.8.11-amd64\n<span class=u>Shell</span>: bash 5.2\n<span class=u>Terminal</span>: web-terminal\n<span class=u>Modules</span>: '+done.filter(Boolean).length+'/'+M.length+' complete')},
history(){H.forEach((h,i)=>P(String(i+1).padStart(4)+'  '+esc(h)))},
tree(){const w=(n,p)=>{const k=Object.keys(n.c).filter(x=>x[0]!='.');k.forEach((x,i)=>{const l=i==k.length-1;P(p+(l?'└── ':'├── ')+lsFmt(n.c[x],x));if(n.c[x].t=='d')w(n.c[x],p+(l?'    ':'│   '))})};P('<span class=d>.</span>');w(get('.'),'')}
};
// ---------- shell ----------
const H=[];let hi=0;
function setP(){$('#p1').innerHTML=`┌──(<span class=u>kali㉿kali</span>)-[<span>${esc(pdir())}</span>]`;$('#pl').textContent='└─$ ';$('#ttl').textContent='kali@kali: '+pdir()}
function run(line){
 const pre=mode?'':'';P(mode?`<span class=dim>&gt;</span> ${esc(line)}`:`<span class=p1>┌──(</span><span class=u>kali㉿kali</span><span class=p1>)-[${esc(pdir())}]</span>\n<span class=p2>└─$</span> ${esc(line)}`);
 line=line.trim();if(!line)return;
 if(mode)return mode(line);
 H.push(line);hi=H.length;
 const a=(line.match(/"[^"]*"|'[^']*'|\S+/g)||[]).map(s=>s.replace(/^["']|["']$/g,'')),c=a[0];
 if(!C[c])return P(`<span class=bad>bash: ${esc(c)}: command not found</span>`);
 const m=modOf(c);
 if(m>=0&&!done[m]&&!(m==cur()&&lesson)){
  const i=cur();
  return P(`<span class=bad>🔒 '${esc(c)}' is locked.</span> Complete module ${m+1} (${M[m].n}) first.`+(m==i?' Type <b>learn</b> to start it.':` Next up: module ${i+1} — type <b>learn</b>.`));
 }
 err=false;C[c](a.slice(1));
 if(lesson&&!err&&M[cur()]&&M[cur()].ok.test(line))finish();
}
function finish(){const i=cur();done[i]=true;save();lesson=false;gain(50);badges();P(`<span class=ok>✔ Module ${i+1} complete! Unlocked: ${M[i].c.join(', ')}</span>`);P(cur()<M.length?'Type <b>learn</b> for the next module.':'<span class=ok>🎉 You finished every module. All commands unlocked — play some games!</span>')}
const X=c=>{run(c);inp.focus()};
inp.addEventListener('keydown',e=>{
 if(e.key=='Enter'){const v=inp.value;inp.value='';run(v)}
 else if(e.key=='ArrowUp'){if(hi>0)inp.value=H[--hi]||'';e.preventDefault()}
 else if(e.key=='ArrowDown'){hi<H.length?inp.value=H[++hi]||'':0;e.preventDefault()}
 else if(e.key=='Tab'){e.preventDefault();const v=inp.value,w=v.split(' '),l=w.pop();let pool;if(!w.length)pool=Object.keys(C);else{const s=l.lastIndexOf('/'),d=get(s>=0?l.slice(0,s+1)||'/':'.');pool=d&&d.t=='d'?Object.keys(d.c).map(x=>(s>=0?l.slice(0,s+1):'')+x):[]}const m=pool.filter(x=>x.startsWith(l));if(m.length==1)inp.value=[...w,m[0]].join(' ')+(w.length?'':' ');else if(m.length>1)P(m.map(esc).join('  '))}
 else if(e.key=='l'&&e.ctrlKey){e.preventDefault();C.clear()}
 else if(e.key=='c'&&e.ctrlKey){P(esc(inp.value)+'^C');inp.value='';mode=null;if(G)gquit()}
});
term.addEventListener('click',()=>{if(!getSelection().toString())inp.focus()});
// ---------- games ----------
C.guess=()=>{let n=1+Math.floor(Math.random()*100),t=0;P('<span class=hl>Guess the number (1-100).</span> Type "q" to quit.');mode=l=>{if(l=='q'){mode=null;return P('Bye. It was '+n)}const g=+l;if(isNaN(g))return P('Numbers only.');t++;if(g==n){P(`<span class=ok>Correct in ${t} tries!</span>`);mode=null;win('guess')}else P(g<n?'Higher ↑':'Lower ↓')}};
C.hangman=()=>{const W=['exploit','payload','firewall','kernel','phishing','malware','python','terminal','encryption','sudo','bash','network'],w=W[Math.floor(Math.random()*W.length)];let g=new Set,life=7;const show=()=>w.split('').map(c=>g.has(c)?c:'_').join(' ');P('<span class=hl>Hangman:</span> guess one letter at a time. "q" quits.');P(show()+`   lives: ${life}`);mode=l=>{l=l.toLowerCase();if(l=='q'){mode=null;return P('Word was '+w)}if(!/^[a-z]$/.test(l))return P('One letter please.');if(g.has(l))return P('Already tried.');g.add(l);if(!w.includes(l))life--;P(show()+`   lives: ${life}`);if(!show().includes('_')){P('<span class=ok>You win!</span>');mode=null;win('hangman')}else if(life<=0){P(`<span class=bad>Game over. Word: ${w}</span>`);mode=null}}};
let sn=null;
C.snake=()=>gstart('snake',0,'SNAKE');
const sd=(a,b)=>sn&&sn.d(a,b);
function snEnd(s){if(!sn)return;clearInterval(sn.t);sn=null;$('#ov').style.display='none';if(s>=5)win();P(`<span class=warn>Snake over. Score: ${s||0}</span>`);inp.focus()}
addEventListener('keydown',e=>{if(!sn)return;const k={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(k){sd(...k);e.preventDefault()}if(e.key=='Escape')snEnd()});
// ---------- v2: sidebar, XP, quizzes, more commands ----------
M.push({n:'Find, permissions, processes',c:['find','chmod','ps','which'],d:'<span class=hl>find dir -name file</span> searches by name, <span class=hl>chmod +x file</span> changes permissions, <span class=hl>ps</span> lists processes, <span class=hl>which cmd</span> shows where a command lives.',t:'Type: find ~ -name notes.txt',ok:/^find\s+\S+\s+-name\s+notes\.txt$/});
C.find=a=>{const i=a.indexOf('-name'),nm=a[i+1];if(i<0||!nm)return bad('find: usage: find <dir> -name <pattern>');const re=new RegExp('^'+nm.replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*')+'$'),d=a[0]||'.',n=get(d);if(!n)return bad('find: no such directory');const w=(n,p)=>{if(n.t=='d')Object.keys(n.c).forEach(k=>{const q=(p=='/'?'':p)+'/'+k;if(re.test(k))P(esc(q));w(n.c[k],q)})};w(n,'/'+parts(d).join('/'))};
C.chmod=a=>{if(a.length<2)return bad('chmod: missing operand');if(!get(a[1]))bad(`chmod: cannot access '${a[1]}': No such file or directory`)};
C.ps=()=>P('  PID TTY          TIME CMD\n 1021 pts/0    00:00:00 bash\n 1187 pts/0    00:00:00 ps');
C.which=a=>{if(C[a[0]])P('/usr/bin/'+esc(a[0]));else err=true};
C.games=()=>{P('<span class=hl>Games</span> (win to earn XP)');P('  guess, hangman, snake, typing, rps')};
C.typing=()=>{const W=['the quick brown fox jumps over the lazy dog','sudo apt update and apt full-upgrade','linux is free and open source','practice makes a good hacker'],s=W[Math.floor(Math.random()*W.length)];P('<span class=hl>Typing test.</span> Type this exactly, then press Enter:');P(`<span class=warn>${s}</span>`);const t0=Date.now();mode=l=>{mode=null;const sec=(Date.now()-t0)/1000;if(l!=s)return P('<span class=bad>Mismatch. Run typing to retry.</span>');P(`<span class=ok>${Math.round(s.split(' ').length/(sec/60))} WPM in ${sec.toFixed(1)}s</span>`);win('typing')}};
C.rps=()=>{P('<span class=hl>Rock Paper Scissors</span>: type rock, paper or scissors. First to 3 wins, "q" quits.');let a=0,b=0;const O=['rock','paper','scissors'];mode=l=>{if(l=='q'){mode=null;return P('Bye.')}const u=O.indexOf(l.toLowerCase());if(u<0)return P('rock, paper or scissors?');const c=Math.floor(Math.random()*3);P(`You: ${O[u]}, Kali: ${O[c]}`);if(u==c)P('Draw.');else if((u+1)%3==c){b++;P('Kali scores.')}else{a++;P('You score.')}P(`Score ${a}-${b}`);if(a==3){P('<span class=ok>You win!</span>');mode=null;win('rps')}else if(b==3){P('<span class=bad>Kali wins.</span>');mode=null}}};
let S={xp:0,qc:0,gw:0,b:[]};
// SECURITY: saved progress is untrusted input; rebuild S from whitelisted, clamped, plain values (no __proto__ keys, no HTML-bearing strings)
try{const r=kJSON('kstate',200000),has=k=>Object.prototype.hasOwnProperty.call(r,k),nn=v=>typeof v=='number'&&isFinite(v)?Math.min(1e9,Math.max(0,Math.floor(v))):0,id=k=>/^[A-Za-z0-9_-]{1,40}$/.test(k);
 if(r&&!Array.isArray(r)){S.xp=has('xp')?nn(r.xp):0;S.qc=has('qc')?nn(r.qc):0;S.gw=has('gw')?nn(r.gw):0;
  const BN=['First Steps','Halfway','Graduate','Quiz Whiz','Gamer'];S.b=has('b')&&Array.isArray(r.b)?[...new Set(r.b.filter(x=>typeof x=='string'&&x.length>0&&x.length<=40).slice(0,60))]:[];
  S.hs=Object.create(null);if(has('hs')&&r.hs&&typeof r.hs=='object'&&!Array.isArray(r.hs))Object.keys(r.hs).slice(0,200).forEach(k=>{if(id(k)&&typeof r.hs[k]=='number'&&isFinite(r.hs[k]))S.hs[k]=Math.min(1e9,Math.max(-1e9,r.hs[k]))});
  S.gwon=Object.create(null);if(has('gwon')&&r.gwon&&typeof r.gwon=='object'&&!Array.isArray(r.gwon))Object.keys(r.gwon).slice(0,100).forEach(k=>{if(id(k)&&r.gwon[k])S.gwon[k]=1});
  S.qb=Object.create(null);if(has('qb')&&r.qb&&typeof r.qb=='object'&&!Array.isArray(r.qb))Object.keys(r.qb).slice(0,200).forEach(k=>{const v=r.qb[k];if(id(k)&&v&&typeof v=='object'){const of=Math.max(1,Math.min(1000,Math.floor(+v.of)||1));S.qb[k]={best:Math.max(0,Math.min(of,Math.floor(+v.best)||0)),of,pct:Math.max(0,Math.min(100,Math.floor(+v.pct)||0))}}})}}catch(e){S={xp:0,qc:0,gw:0,b:[]}}
const sv=()=>{try{localStorage.setItem('kstate',JSON.stringify(S))}catch(e){}};
const BG=[['👣','First Steps','Finish module 1',()=>done[0]],['🧭','Halfway','Finish 6 modules',()=>done.filter(Boolean).length>=6],['🎓','Graduate','Finish every module',()=>done.filter(Boolean).length>=M.length],['🧠','Quiz Whiz','10 correct answers',()=>S.qc>=10],['🎮','Gamer','Win a game',()=>S.gw>=1]];
const lv=()=>Math.floor(S.xp/100)+1;
function upd(){$('#sx').innerHTML=`<div class=dim>Level ${lv()}, ${S.xp} XP</div><div class=xpb><i style="width:${S.xp%100}%"></i></div>`}
function badges(){BG.forEach(b=>{if(!S.b.includes(b[1])&&b[3]()){S.b.push(b[1]);toast(`🏅 Badge unlocked: ${b[0]} ${b[1]}`)}});sv()}
function gain(n){S.xp+=n;sv();upd();toast('+'+n+' XP')}
const win=id=>{S.gw++;if(id&&/^[a-z0-9]{1,20}$/.test(id)){(S.gwon||(S.gwon={}))[id]=1}gain(10);badges()};
const Q=[
[['What does pwd print?','The current directory','Your password','Running processes'],['Which command shows your location in the filesystem?','pwd','whoami','date']],
[['Which flag shows hidden files?','-a','-l','-r'],['What does ls -l add?','Detailed info per file','Hidden files','Colors']],
[['How do you go up one folder?','cd ..','cd ~','cd /'],['What does cd ~ do?','Goes to your home folder','Goes to root','Deletes the folder']],
[['Which command prints a whole file?','cat','wc','sort'],['What does wc -l count?','Lines','Words','Folders']],
[['Which command creates a folder?','mkdir','touch','echo'],['What does touch on a new name do?','Creates an empty file','Deletes it','Opens an editor']],
[['Which command renames a file?','mv','cp','rm'],['Does rm have a recycle bin?','No, files are gone','Yes, in ~/.trash','Yes, for 30 days']],
[['What does grep -i do?','Ignores upper/lower case','Inverts the file','Prints line numbers'],['grep kali notes.txt prints...','Lines containing kali','The file size','Only the first line']],
[['Which command shows your username?','whoami','hostname','uname'],['What does uname -a show?','System and kernel info','Your users','Disk usage']],
[['Which command tests if a host is reachable?','ping','nmap','ifconfig'],['What does nmap do?','Scans ports on a host','Draws a network map','Resets Wi-Fi']],
[['Which command prints your past commands?','history','tree','neofetch'],['What does tree draw?','The folder structure','A family chart','A process list']],
[['Which command finds files by name?','find','which','chmod'],['What does chmod change?','File permissions','File size','The hostname']]];
let QS=[],qi=0,qd=0,qo=[],qsc=0;
function qStart(m){const pool=m<0?Q.flatMap((x,i)=>done[i]?x:[]):Q[m];QS=pool.slice().sort(()=>Math.random()-.5).slice(0,6);qi=0;qsc=0;qd=0;qShow()}
function qShow(){const pv=$('#pv');if(qi>=QS.length){pv.innerHTML=`<h2>Quiz finished</h2><p>Score: ${qsc} of ${QS.length}</p><button class=btn onclick="go('quiz')">Back to quizzes</button>`;return badges()}const q=QS[qi];qo=q.slice(1).sort(()=>Math.random()-.5);pv.innerHTML=`<h2>Quiz</h2><div class=dim>Question ${qi+1} of ${QS.length}</div><h3>${esc(q[0])}</h3>`+qo.map((o,i)=>`<button class=opt onclick="qAns(${i})">${esc(o)}</button>`).join('')+'<div id=qf></div>'}
function qAns(i){if(qd)return;qd=1;const q=QS[qi],ok=qo[i]==q[1];document.querySelectorAll('.opt').forEach((b,j)=>{if(qo[j]==q[1])b.classList.add('right');else if(j==i)b.classList.add('wrong')});if(ok){qsc++;S.qc++;gain(5)}$('#qf').innerHTML=`<p class=${ok?'ok':'bad'}>${ok?'Correct! +5 XP':'Not quite. Answer: '+esc(q[1])}</p><button class=btn onclick="qi++;qd=0;qShow()">${qi+1>=QS.length?'Finish':'Next question'}</button>`}
const GM=[['rush','Command Rush','60 seconds. Run the right command for each task. It beeps in the last 10 seconds.'],['navigate','Maze Hunt','Find flag.txt in a maze of folders before the clock runs out.'],['defuse','Defuse the Bomb','Five tasks in 45 seconds. The bomb beeps faster and wrong commands cost time.'],['guess','Guess the number','Find a number from 1 to 100.'],['hangman','Hangman','Guess the security word.'],['hunt','Linux Secret Hunter','Find three hidden secrets in ~/hunt with ls, find, grep and cat. Different places every round.'],['snake','Snake','Eat 5 or more to win XP.'],['typing','Typing test','Type a phrase exactly.'],['rps','Rock Paper Scissors','First to 3 wins.']];
const R={
mods(){const c=cur();return `<h2>Modules</h2><p class=dim>Finish them in order. Lessons run in a guided terminal where later commands stay locked. The Terminal tab is always open for free practice.</p>`+M.map((m,i)=>`<div class="card ${done[i]?'dn':i==c?'now':'lock'}"><b>${done[i]?'✔':i==c?'▶':'🔒'} ${i+1}. ${m.n}</b><div class=dim>Commands: ${m.c.join(', ')}</div>${i<=c?`<div>${m.d}</div><div class=warn>${m.t}</div>`:''}${i==c?`<button class=btn onclick="startLesson()">Start lesson</button>`:''}</div>`).join('')},
quiz(){return `<h2>Quizzes</h2><p class=dim>A quiz unlocks when its module is complete. Each correct answer gives 5 XP.</p>`+M.map((m,i)=>`<div class="card ${done[i]?'':'lock'}"><b>${done[i]?'':'🔒 '}${i+1}. ${m.n}</b>${done[i]?`<div><button class=btn onclick="qStart(${i})">Start quiz</button></div>`:''}</div>`).join('')+(done.some(Boolean)?`<div class=card><b>Mixed review</b><div class=dim>Up to 6 questions from finished modules.</div><button class=btn onclick="qStart(-1)">Start review</button></div>`:'')},
games(){return `<h2>Games</h2><p class=dim>Win a game to earn 10 XP. Games run in the terminal.</p>`+GM.map(g=>`<div class=card><b>${g[1]}</b><div class=dim>${g[2]}</div><button class=btn onclick="go('term');X('${g[0]}')">Play</button></div>`).join('')},
prog(){return `<h2>Progress</h2><p>Level ${lv()}, ${S.xp} XP</p><div class=xpb><i style="width:${S.xp%100}%"></i></div><p>Modules finished: ${done.filter(Boolean).length} of ${M.length}. Correct quiz answers: ${S.qc}. Games won: ${S.gw}.</p><h3>Badges</h3><div class=badges>${BG.map(b=>`<div class="bd ${S.b.includes(b[1])?'':'off'}"><div style="font-size:26px">${b[0]}</div><b>${b[1]}</b><div class=dim>${b[2]}</div></div>`).join('')}</div><button class=btn onclick="done=[];save();lesson=false;S={xp:0,qc:0,gw:0,b:[]};sv();upd();go('prog')">Reset everything</button>`}};
function go(v){document.querySelectorAll('#side button[data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v==v));const pv=$('#pv'),t=v=='term';$('#term').style.display=t?'':'none';pv.style.display=t?'none':'block';if(t)return inp.focus();pv.innerHTML=R[v]();pv.scrollTop=0}
upd();
// ---------- v3: real shell (pipes, redirects), more commands, timed games ----------
['learn','modules','hint','reset','games'].forEach(k=>delete C[k]);
let stdin=null,G=null,BC=null,snd=KST.snd;
const ENV=Object.assign(Object.create(null),{USER:'kali',HOME:'/home/kali',SHELL:'/bin/bash',HOSTNAME:'kali',PATH:'/usr/local/bin:/usr/bin:/bin',TERM:'xterm-256color',LANG:'en_US.UTF-8'}),H0='/home/kali',INST=new Set();
const plain=h=>String(h).replace(/<[^>]+>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const L=t=>t?t.replace(/\n$/,'').split('\n'):[];
const rd=(f,c)=>{if(!f)return stdin;const n=get(f);if(!n){bad(`${c}: ${f}: No such file or directory`);return null}if(n.t=='d'){bad(`${c}: ${f}: Is a directory`);return null}if(window.canRead&&!window.canRead(n)){bad(`${c}: ${f}: Permission denied`);return null}return n.c};
const toast=m=>{const d=document.createElement('div');d.textContent=m;$('#toast').appendChild(d);setTimeout(()=>d.remove(),3200)};
const hud=h=>{const e=$('#hud');e.style.display=h?'block':'none';e.innerHTML=h||''};
// modules
M.push(
{n:'Pipes and redirection',c:['tee','cut','tr','rev'],d:'The pipe <span class=hl>|</span> sends one command\'s output into the next. <span class=hl>&gt;</span> writes output to a file, <span class=hl>&gt;&gt;</span> appends. Pipes stay locked until you finish this module.',t:'Type: cat notes.txt | grep kali | wc -l',ok:/^cat\s+\S*notes\.txt\s*\|\s*grep\s+\S+\s*\|\s*wc\s+-l$/},
{n:'System information',c:['uptime','free','df','du','env','printenv','export','top','kill','sleep','cal','seq'],d:'<span class=hl>free -h</span> shows memory, <span class=hl>df -h</span> disk space, <span class=hl>du -sh dir</span> folder size, <span class=hl>uptime</span> load, <span class=hl>top</span> processes, <span class=hl>env</span> variables, <span class=hl>cal</span> a calendar.',t:'Type: free -h',ok:/^free\s+-h$/},
{n:'Files in depth',c:['rmdir','stat','file','diff','nl','ln','realpath','basename','dirname','less','more'],d:'<span class=hl>stat file</span> shows details, <span class=hl>file x</span> guesses the type, <span class=hl>diff a b</span> compares, <span class=hl>nl</span> numbers lines, <span class=hl>rmdir</span> removes empty folders, <span class=hl>realpath</span> prints the full path.',t:'Type: stat notes.txt',ok:/^stat\s+\S*notes\.txt$/},
{n:'Network tools',c:['ip','curl','wget','ssh','netstat','ss','traceroute','nslookup','dig','whois'],d:'<span class=hl>ip a</span> shows addresses, <span class=hl>curl url</span> fetches a page, <span class=hl>nslookup host</span> and <span class=hl>dig host</span> query DNS, <span class=hl>netstat</span> lists connections. Output here is simulated.',t:'Type: ip a',ok:/^ip\s+(a|addr)$/},
{n:'Hashes and encoding',c:['base64','sha256sum','sha1sum','xxd','strings'],d:'<span class=hl>base64</span> encodes text (<span class=hl>-d</span> decodes), <span class=hl>sha256sum</span> makes a hash, <span class=hl>xxd</span> shows bytes in hex, <span class=hl>strings</span> pulls readable text.',t:'Type: echo kali | base64',ok:/^echo\s+kali\s*\|\s*base64$/},
{n:'Packages and privilege',c:['sudo','apt','su','passwd','chown'],d:'<span class=hl>sudo cmd</span> runs a command as admin, <span class=hl>apt update</span> refreshes package lists, <span class=hl>apt install name</span> installs software. Try installing cowsay afterwards.',t:'Type: sudo apt update',ok:/^sudo\s+apt\s+update$/});
Q.push(
[['What does | do?','Sends one command\'s output into the next','Writes output to a file','Runs a command twice'],['What does >> do?','Appends output to a file','Overwrites a file','Reads from a file']],
[['Which command shows free memory?','free','df','uptime'],['What does df -h show?','Disk space in readable units','Directory contents','Running tasks']],
[['Which command shows detailed file info?','stat','nl','ln'],['Which command compares two files?','diff','file','less']],
[['Which command shows IP addresses?','ip a','ping','nmap'],['What does curl do?','Fetches data from a URL','Scans ports','Resets DNS']],
[['Which command encodes text as base64?','base64','xxd','strings'],['What does sha256sum produce?','A fixed-length hash','An encrypted file','A zip archive']],
[['What does sudo do?','Runs a command as administrator','Deletes a user','Shows the system'],['Which command installs software on Kali?','apt install','cd','cat']]);
// shell engine
function runOne(a){const c=a[0],v=c.match(/^(\w+)=(.*)$/);if(v){ENV[v[1]]=v[2];return}
 if(!C[c])return bad(`bash: ${c}: command not found`);
 const m=modOf(c);if(lesson&&m>=0&&!done[m]&&m!=cur())return bad(`bash: ${c}: locked. Finish module ${m+1} (${M[m].n}) in the Modules tab.`);
 C[c](a.slice(1))}
function run(line){
 P(mode?`<span class=dim>&gt;</span> ${esc(line)}`:`<span class=p1>┌──(</span><span class=u>kali㉿kali</span><span class=p1>)-[${esc(pdir())}]</span>\n<span class=p2>└─$</span> ${esc(line)}`);
 line=line.trim();if(!line)return;if(mode)return mode(line);
 H.push(line);hi=H.length;err=false;
 const ex=t=>t.replace(/\$(\w+)/g,(_,k)=>k=='PWD'?cwd:ENV[k]||''),
 tk=(line.match(/"[^"]*"|'[^']*'|>>|>|\||[^\s|>"']+/g)||[]).map(s=>/^'/.test(s)?s.slice(1,-1):ex(/^"/.test(s)?s.slice(1,-1):s)),
 segs=[[]];tk.forEach(t=>t=='|'?segs.push([]):segs[segs.length-1].push(t));
 if(lesson&&segs.length>1&&!(done[11]||cur()==11))return bad('bash: pipes (|) are locked. Finish module 12 (Pipes and redirection) in the Modules tab.');
 stdin=null;
 try{segs.forEach((sg,i)=>{let a=sg,rf=null,ap=false;const ri=a.findIndex(x=>x=='>'||x=='>>');if(ri>=0){ap=a[ri]=='>>';rf=a[ri+1];a=a.slice(0,ri)}
  if(!a.length)return;cap=(i==segs.length-1&&!rf)?null:[];runOne(a);
  if(cap){const t=cap.map(plain).join('\n');cap=null;
   if(rf){const[p,nm]=par(rf);if(!p||(p.c[nm]&&p.c[nm].t=='d'))bad(`bash: ${rf}: cannot write`);else p.c[nm]=F((ap&&p.c[nm]?p.c[nm].c:'')+(t?t+'\n':''))}else stdin=t?t+'\n':''}})}
 catch(e){bad('bash: internal error: '+e.message)}
 cap=null;stdin=null;
 if(G)ghook(line);
 if(lesson&&!err&&M[cur()]&&M[cur()].ok.test(line))finish()}
function finish(){const i=cur();done[i]=true;save();lesson=false;gain(50);badges();toast(`Module ${i+1} complete. Unlocked: ${M[i].c.join(', ')}`);G?ghud():hud('')}
function lhud(){const i=cur();hud(lesson&&i<M.length?`📚 <b>Module ${i+1}: ${esc(M[i].n)}</b><div class=warn>${esc(M[i].t)}</div><a href="#" onclick="go('mods');return false" style="color:var(--blue)">Lesson details</a> &nbsp; <a href="#" onclick="lesson=false;lhud();return false" style="color:var(--dim)">Exit lesson</a>`:'')}
function startLesson(){if(cur()>=M.length)return;lesson=true;go('term');lhud()}
// text tools (stdin aware)
C.echo=a=>{if(a[0]=='-e'){a=a.slice(1).map(x=>x.replace(/\\n/g,'\n').replace(/\\t/g,'\t'))}P(esc(a.join(' ')))};
C.cat=a=>{const f=a.filter(x=>x[0]!='-');if(!f.length){if(stdin!==null)L(stdin).forEach(l=>P(esc(l)));return}f.forEach(x=>{const t=rd(x,'cat');if(t!==null)L(t).forEach(l=>P(esc(l)))})};C.less=C.more=C.cat;
const kf=a=>{const i=a.indexOf('-n');return[i>=0?+a[i+1]:10,a.filter((x,j)=>x[0]!='-'&&j!=i+1)[0]]};
C.head=a=>{const[k,f]=kf(a),t=rd(f,'head');if(t!==null)L(t).slice(0,k).forEach(l=>P(esc(l)))};
C.tail=a=>{const[k,f]=kf(a),t=rd(f,'tail');if(t!==null)L(t).slice(-k).forEach(l=>P(esc(l)))};
C.wc=a=>{const f=a.find(x=>x[0]!='-'),t=rd(f,'wc');if(t===null)return;const fl=a.filter(x=>x[0]=='-').join(''),o=[];if(/l/.test(fl))o.push(L(t).length);if(/w/.test(fl))o.push(t.split(/\s+/).filter(Boolean).length);if(/c/.test(fl))o.push(t.length);if(!o.length)o.push(L(t).length,t.split(/\s+/).filter(Boolean).length,t.length);P(o.join(' ')+(f?' '+esc(f):''))};
C.grep=a=>{const fl=a.filter(x=>/^-\w+$/.test(x)).join(''),r=a.filter(x=>!/^-\w+$/.test(x));if(!r[0])return bad('Usage: grep [OPTION]... PATTERNS [FILE]...');const t=rd(r[1],'grep');if(t===null)return;let re;try{re=new RegExp(r[0],/i/.test(fl)?'gi':'g')}catch(e){return bad('grep: invalid regular expression')}const v=/v/.test(fl),ls=L(t).map((l,i)=>[l,i+1]).filter(([l])=>(l.match(re)!==null)!=v);if(/c/.test(fl))return P(String(ls.length));ls.forEach(([l,i])=>P((/n/.test(fl)?`<span class=ok>${i}</span>:`:'')+(v?esc(l):esc(l).replace(re,m=>`<span class=bad>${m}</span>`))));if(!ls.length)err=true};
C.sort=a=>{const t=rd(a.find(x=>x[0]!='-'),'sort');if(t===null)return;const l=L(t).sort(a.includes('-n')?(x,y)=>parseFloat(x)-parseFloat(y):undefined);if(a.includes('-r'))l.reverse();l.forEach(x=>P(esc(x)))};
C.uniq=a=>{const t=rd(a.find(x=>x[0]!='-'),'uniq');if(t===null)return;let p,n=0;const o=[];L(t).forEach(l=>{if(l===p)n++;else{if(p!==undefined)o.push([p,n]);p=l;n=1}});if(p!==undefined)o.push([p,n]);o.forEach(([l,c])=>P((a.includes('-c')?String(c).padStart(7)+' ':'')+esc(l)))};
C.tee=a=>{if(stdin===null)return;const[p,nm]=par(a.filter(x=>x[0]!='-')[0]||'');if(p)p.c[nm]=F(stdin);L(stdin).forEach(l=>P(esc(l)))};
C.cut=a=>{let d='\t',f=0,fl;for(let i=0;i<a.length;i++){const x=a[i];if(x=='-d')d=a[++i];else if(/^-d./.test(x))d=x.slice(2);else if(x=='-f')f=+a[++i]-1;else if(/^-f\d/.test(x))f=+x.slice(2)-1;else fl=x}const t=rd(fl,'cut');if(t!==null)L(t).forEach(l=>P(esc(l.split(d)[f]||'')))};
C.tr=a=>{const xp=s=>s.replace(/(.)-(.)/g,(_,x,y)=>{let r='';for(let c=x.charCodeAt(0);c<=y.charCodeAt(0);c++)r+=String.fromCharCode(c);return r}),del=a[0]=='-d',x=a.filter(v=>v[0]!='-'||v.length==1),A=xp(x[0]||''),B=xp(x[1]||'');if(stdin===null)return;L(stdin.split('').map(c=>{const i=A.indexOf(c);return i<0?c:del?'':(B[Math.min(i,B.length-1)]||'')}).join('')).forEach(l=>P(esc(l)))};
C.rev=a=>{const t=rd(a[0],'rev');if(t!==null)L(t).forEach(l=>P(esc(l.split('').reverse().join(''))))};
C.mkdir=a=>{const p=a.includes('-p'),f=a.filter(x=>x[0]!='-');if(!f.length)return bad('mkdir: missing operand');f.forEach(x=>{if(p){let n=ROOT;for(const s of parts(x)){if(n.t!='d')return bad('mkdir: not a directory');n=n.c[s]=n.c[s]||D({})}return}const[q,nm]=par(x);if(!q)return bad(`mkdir: cannot create directory '${x}': No such file or directory`);if(q.c[nm])return bad(`mkdir: cannot create directory '${x}': File exists`);q.c[nm]=D({})})};
['cp','mv','touch'].forEach(k=>{const o=C[k];C[k]=a=>o(a.filter(x=>x[0]!='-'))});
// system
const sz=n=>n.t=='f'?n.c.length:4096+Object.values(n.c).reduce((s,x)=>s+sz(x),0),hs=b=>b<1024?b+'':b<1048576?(b/1024).toFixed(1)+'K':(b/1048576).toFixed(1)+'M',tm=()=>new Date().toTimeString().slice(0,8);
C.uptime=()=>P(` ${tm()} up 1:23,  1 user,  load average: 0.08, 0.03, 0.01`);
C.free=a=>P(a.includes('-h')?'               total        used        free      shared  buff/cache   available\nMem:           3.8Gi       1.1Gi       1.9Gi        24Mi       0.9Gi       2.7Gi\nSwap:          1.0Gi          0B       1.0Gi':'               total        used        free      shared  buff/cache   available\nMem:         3984000     1153000     1990000       24576      940000     2830000\nSwap:        1048572           0     1048572');
C.df=()=>P('Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        40G   12G   26G  32% /\ntmpfs           1.9G     0  1.9G   0% /dev/shm');
C.du=a=>{const p=a.find(x=>x[0]!='-')||'.',n=get(p);if(!n)return bad(`du: cannot access '${p}': No such file or directory`);P((a.some(x=>/^-\w*h/.test(x))?hs(sz(n)):Math.ceil(sz(n)/1024))+'\t'+esc(p))};
C.env=()=>{Object.entries(ENV).forEach(([k,v])=>P(`${k}=${esc(v)}`));P('PWD='+esc(cwd))};
C.printenv=a=>a[0]?(ENV[a[0]]!==undefined?P(esc(ENV[a[0]])):(err=true)):C.env();
C.export=a=>a.forEach(x=>{const m=x.match(/^(\w+)=(.*)$/);if(m)ENV[m[1]]=m[2]});
C.top=()=>P(`top - ${tm()} up 1:23,  1 user,  load average: 0.08, 0.03, 0.01\nTasks:   2 total,   1 running\n  PID USER      %CPU %MEM COMMAND\n 1021 kali       0.3  0.4 bash\n 1187 kali       0.1  0.2 top`);
C.kill=a=>{const p=a.find(x=>x[0]!='-');if(!p)return bad('kill: usage: kill [-s sigspec] pid');if(!['1021','1187'].includes(p))bad(`bash: kill: (${p}) - No such process`)};
C.sleep=()=>{};
C.cal=()=>{const d=new Date(),y=d.getFullYear(),m=d.getMonth(),f=new Date(y,m,1).getDay(),n=new Date(y,m+1,0).getDate();let t=['January','February','March','April','May','June','July','August','September','October','November','December'][m]+' '+y;P(esc(t.padStart(Math.floor((20+t.length)/2))));P('Su Mo Tu We Th Fr Sa');let r='   '.repeat(f);for(let i=1;i<=n;i++){r+=String(i).padStart(2)+' ';if((f+i)%7==0){P(r.trimEnd());r=''}}if(r)P(r.trimEnd())};
C.seq=a=>{const x=a.map(Number),s=x.length>1?x[0]:1,e=x[x.length-1];for(let i=s;i<=e&&i-s<1000;i++)P(String(i))};
// files
C.rmdir=a=>{const n=get(a[0]||'');if(!n)return bad(`rmdir: failed to remove '${a[0]}': No such file or directory`);if(n.t!='d')return bad(`rmdir: failed to remove '${a[0]}': Not a directory`);if(Object.keys(n.c).length)return bad(`rmdir: failed to remove '${a[0]}': Directory not empty`);const[p,nm]=par(a[0]);delete p.c[nm]};
C.stat=a=>{const n=get(a[0]||'');if(!n)return bad(`stat: cannot statx '${a[0]}': No such file or directory`);P(`  File: ${esc(a[0])}\n  Size: ${sz(n)}\t\t${n.t=='d'?'directory':'regular file'}\nAccess: (${n.t=='d'?'0755/drwxr-xr-x':'0644/-rw-r--r--'})  Uid: ( 1000/ kali)   Gid: ( 1000/ kali)`)};
C.file=a=>a.forEach(f=>{const n=get(f);P(esc(f)+': '+(!n?'cannot open (No such file or directory)':n.t=='d'?'directory':n.c.length?'ASCII text':'empty'))});
C.diff=a=>{const x=rd(a[0],'diff'),y=rd(a[1],'diff');if(x===null||y===null)return;const A=L(x),B=L(y);let d=0;for(let i=0;i<Math.max(A.length,B.length);i++)if(A[i]!==B[i]){d=1;if(A[i]!==undefined)P(`&lt; ${esc(A[i])}`);if(B[i]!==undefined)P(`&gt; ${esc(B[i])}`)}if(d)err=true};
C.nl=a=>{const t=rd(a[0],'nl');if(t!==null)L(t).forEach((l,i)=>P(`${String(i+1).padStart(6)}\t${esc(l)}`))};
C.ln=a=>{const s=a.filter(x=>x[0]!='-'),n=get(s[0]||'');if(!n)return bad('ln: failed to access');const[p,nm]=par(s[1]||'');if(!p)return bad('ln: bad destination');p.c[nm]=n};
C.realpath=a=>P(esc('/'+parts(a[0]||'.').join('/')));
C.basename=a=>P(esc((a[0]||'').split('/').filter(Boolean).pop()||'/'));
C.dirname=a=>{const s=(a[0]||'').split('/');s.pop();P(esc(s.join('/')||'.'))};
// network (simulated)
const fip=h=>{let x=7;for(const c of h)x=(x*31+c.charCodeAt(0))>>>0;return `${x%200+20}.${(x>>8)%250}.${(x>>16)%250}.${(x>>4)%250+1}`};
C.ip=a=>P(/^r/.test(a[0]||'')?'default via 10.0.2.2 dev eth0\n10.0.2.0/24 dev eth0 proto kernel scope link src 10.0.2.15':'1: lo: &lt;LOOPBACK,UP&gt; mtu 65536\n    inet 127.0.0.1/8 scope host lo\n2: eth0: &lt;BROADCAST,MULTICAST,UP&gt; mtu 1500\n    link/ether 08:00:27:ab:cd:ef\n    inet 10.0.2.15/24 brd 10.0.2.255 scope global eth0');
C.curl=a=>{const u=a.find(x=>x[0]!='-');if(!u)return bad("curl: try 'curl --help' for more information");P(`&lt;html&gt;&lt;head&gt;&lt;title&gt;${esc(u)}&lt;/title&gt;&lt;/head&gt;\n&lt;body&gt;Simulated response from ${esc(u)}&lt;/body&gt;&lt;/html&gt;`)};
C.wget=a=>{const u=a.find(x=>x[0]!='-');if(!u)return bad('wget: missing URL');const nm=u.split('/').filter(Boolean).pop()||'index.html';get('.').c[nm]=F(`simulated download of ${u}\n`);P(`--${new Date().toISOString().slice(0,19)}--  ${esc(u)}\nHTTP request sent, awaiting response... 200 OK\nSaving to: '${esc(nm)}'\n'${esc(nm)}' saved`)};
C.ssh=a=>{const h=a.find(x=>x[0]!='-');if(!h)return bad('usage: ssh [user@]hostname');bad(`ssh: connect to host ${h.split('@').pop()} port 22: Connection refused`)};
C.netstat=C.ss=()=>P('Proto Recv-Q Send-Q Local Address           Foreign Address         State\ntcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN\ntcp        0      0 127.0.0.1:631           0.0.0.0:*               LISTEN');
C.traceroute=a=>{const h=a[0];if(!h)return bad('Specify "host" missing argument.');P(`traceroute to ${esc(h)} (${fip(h)}), 30 hops max`);for(let i=1;i<=4;i++)P(` ${i}  ${i<4?'10.'+i+'.0.1':fip(h)}  ${(Math.random()*9+1).toFixed(3)} ms`)};
C.nslookup=a=>a[0]?P(`Server:  10.0.2.3\n\nName:    ${esc(a[0])}\nAddress: ${fip(a[0])}`):bad('nslookup: missing host');
C.dig=a=>a[0]?P(`;; ANSWER SECTION:\n${esc(a[0])}.\t300\tIN\tA\t${fip(a[0])}`):bad('dig: missing host');
C.whois=a=>a[0]?P(`Domain Name: ${esc(a[0]).toUpperCase()}\nRegistrar: Simulated Registrar Inc.\nCreation Date: 2010-01-01`):bad('whois: missing domain');
// hashes
C.base64=a=>{const d=a.includes('-d'),t=rd(a.find(x=>x[0]!='-'),'base64');if(t===null)return;try{P(esc(d?atob(t.trim()):btoa(unescape(encodeURIComponent(t)))))}catch(e){bad('base64: invalid input')}};
const sha=al=>a=>{const f=a.find(x=>x[0]!='-'),t=rd(f,'sha');if(t===null)return;try{crypto.subtle.digest(al,new TextEncoder().encode(t)).then(b=>P([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')+'  '+(f||'-')))}catch(e){bad('hash: not supported in this browser context')}};
C.sha256sum=sha('SHA-256');C.sha1sum=sha('SHA-1');
C.xxd=a=>{const t=rd(a[0],'xxd');if(t===null)return;const b=[...new TextEncoder().encode(t)];for(let i=0;i<b.length;i+=16){const c=b.slice(i,i+16),g=j=>c[j]!==undefined?c[j].toString(16).padStart(2,'0'):'  ';let h='';for(let j=0;j<16;j+=2)h+=g(j)+g(j+1)+' ';P(i.toString(16).padStart(8,'0')+': '+h+' '+esc(c.map(x=>x>31&&x<127?String.fromCharCode(x):'.').join('')))}};
C.strings=a=>{const t=rd(a[0],'strings');if(t!==null)L(t).filter(l=>l.length>3).forEach(l=>P(esc(l)))};
// packages and misc
C.sudo=a=>{if(!a.length)return bad('usage: sudo command');runOne(a)};
C.apt=a=>{const s=a[0],pk=a.slice(1).filter(x=>x[0]!='-');if(s=='update')P('Hit:1 http://http.kali.org/kali kali-rolling InRelease\nReading package lists... Done\nAll packages are up to date.');else if(s=='install'){if(!pk.length)return bad('E: No packages specified');pk.forEach(p=>{INST.add(p);P(`Reading package lists... Done\nSetting up ${esc(p)} (1.0) ...`)})}else if(s=='list'||s=='search')P('Listing... Done');else bad('E: Invalid operation '+(s||''))};
C.cowsay=a=>{if(!INST.has('cowsay'))return bad('bash: cowsay: command not found');const m=a.join(' ')||'Moo';P(esc(' '+'_'.repeat(m.length+2)+'\n< '+m+' >\n '+'-'.repeat(m.length+2)+'\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||'))};
C.su=()=>bad('su: Authentication failure');C.passwd=()=>bad('passwd: Authentication token manipulation error');
C.chown=a=>{const f=a.filter(x=>x[0]!='-')[1];if(f&&!get(f))bad(`chown: cannot access '${f}': No such file or directory`)};
C.exit=()=>P('logout');
C.man=a=>{const m=modOf(a[0]);if(m<0||!done[m])return bad(`No manual entry for ${a[0]||'(none)'}`);P(esc(plain(M[m].d)))};
C.help=()=>{P('Available commands (* = locked during lessons):');const v=[];M.forEach((m,i)=>m.c.forEach(c=>v.push(!lesson||done[i]?c:c+'*')));P(v.join('  '));P('games: rush  navigate  defuse  snake  guess  hangman  typing  rps')};
C.skip=()=>{if(!G)bad('bash: skip: command not found')};
// timed games
const beep=(f,d)=>{if(!snd)return;try{BC=BC||new(window.AudioContext||window.webkitAudioContext)();const o=BC.createOscillator(),g=BC.createGain();o.type='square';o.frequency.value=f;g.gain.value=.08*(KST.vol/100);o.connect(g);g.connect(BC.destination);o.start();o.stop(BC.currentTime+d)}catch(e){}};
const rg=r=>l=>r.test(l);
const CH=[
{m:0,p:'Print the working directory',t:rg(/^pwd$/)},
{m:1,p:'List ALL files, including hidden ones',t:rg(/^ls\s+-\w*a/)},
{m:1,p:'Show a long listing (ls -l)',t:rg(/^ls\s+-\w*l/)},
{m:2,p:'Go into the Documents folder',t:()=>cwd==H0+'/Documents'},
{m:2,p:'Go to /etc',t:()=>cwd=='/etc'},
{m:2,s:'/etc',p:'Jump back to your home folder',t:()=>cwd==H0},
{m:2,s:'/usr/bin',p:'Go up one level',t:()=>cwd=='/usr'},
{m:3,p:'Print notes.txt',t:rg(/^cat\s+\S*notes\.txt$/)},
{m:3,p:'Show only the first 2 lines of notes.txt',t:rg(/^head\s+-n\s*2\s+\S*notes\.txt$/)},
{m:3,p:'Count the lines in notes.txt',t:rg(/^wc\s+-l\s+\S*notes\.txt$/)},
{m:4,p:'Create a folder named dojo',t:rg(/^mkdir\s+dojo$/)},
{m:4,p:'Create an empty file named flag.txt',t:rg(/^touch\s+flag\.txt$/)},
{m:5,p:'Copy notes.txt to backup.txt',t:rg(/^cp\s+notes\.txt\s+backup\.txt$/)},
{m:6,p:'Find lines containing "kali" in notes.txt',t:rg(/^grep\s+(-i\s+)?kali\s+\S*notes\.txt$/)},
{m:7,p:'Print your username',t:rg(/^whoami$/)},
{m:7,p:'Show full system info with uname',t:rg(/^uname\s+-a$/)},
{m:8,p:'Scan 127.0.0.1 with nmap',t:rg(/^nmap\s+(127\.0\.0\.1|localhost)$/)},
{m:9,p:'Draw the folder tree',t:rg(/^tree$/)},
{m:10,p:'Find notes.txt using find',t:rg(/^find\s+\S+\s+-name\s+notes\.txt$/)},
{m:11,p:'Count lines containing "kali": cat, grep and wc -l',t:rg(/cat\s+\S*notes\.txt\s*\|\s*grep\s+(-i\s+)?kali\s*\|\s*wc\s+-l/)},
{m:12,p:'Show memory in human-readable form',t:rg(/^free\s+-h$/)},
{m:14,p:'Show your IP addresses',t:rg(/^ip\s+(a|addr)$/)}];
const pick=n=>CH.filter(c=>done[c.m]).sort(()=>Math.random()-.5).slice(0,n);
function ghud(){if(!G)return;if(G.type=='snake')return snHud();const l=Math.max(0,(G.end-Date.now())/1000);hud(`<b class=hl>${G.name}</b> ⏱ <b class="${l<=10?'bad':'warn'}">${l.toFixed(0)}s</b> ⭐ ${G.score}${G.type=='rush'?' 🔥x'+G.st:''}${G.type=='defuse'?' 💣 '+G.k+'/5':''}<div>${G.type=='nav'?'Find <b>flag.txt</b> and cat it':esc(G.t.p)}</div>`)}
function gnext(){if(!G.q.length){if(G.type=='defuse')return gend(true);G.q=G.type=='snake'?pickSn():pick(99)}G.t=G.q.shift();G.t0=Date.now();if(G.type=='snake'){G.busy=false;G.end=Date.now()+snT(G.score)*1000}cwd=G.t.s||H0;['dojo','flag.txt','backup.txt','hello.txt','pond','copy.txt'].forEach(n=>delete ROOT.c.home.c.kali.c[n]);setP();ghud()}
function mkMaze(){const W=['alpha','bravo','charlie','delta','echo','foxtrot','golf','hotel','india','juliet'],root=D({README:F('Somewhere below here is flag.txt. Explore with ls and cd, then cat it.\n')});ROOT.c.tmp.c.maze=root;let n=root,path='/tmp/maze';for(let d=0;d<4;d++){const nm=W.slice().sort(()=>Math.random()-.5).slice(0,3);nm.forEach(x=>n.c[x]=D({'note.txt':F('Wrong way. Try another door.\n')}));const g=nm[Math.floor(Math.random()*3)];path+='/'+g;n=n.c[g]}n.c['flag.txt']=F('flag{speed_runner_'+Math.floor(Math.random()*9999)+'}\n');G.flag=path+'/flag.txt';cwd='/tmp/maze';setP()}
function gstart(type,secs,name){if(G)return bad('a game is already running (Ctrl+C to quit)');if(type=='snake'?false:type=='nav'?!(done[0]&&done[1]&&done[2]&&done[3]):!pick(1).length)return bad(type=='nav'?'Maze Hunt needs pwd, ls, cd and cat. Finish modules 1 to 4 first.':'Finish module 1 first to unlock game challenges.');
 G={type,name,end:Date.now()+secs*1000,score:0,st:0,k:0,ls:0,fresh:1,q:type=='defuse'?pick(5):[]};
 if(type=='nav')mkMaze();else{gnext();if(type=='snake')snShow()}G.iv=setInterval(gtick,250);ghud();P(`<span class=hl>${name}</span>: the clock is running. Ctrl+C quits.`)}
function gtick(){if(G.busy)return ghud();const l=(G.end-Date.now())/1000;if(l<=0)return gend(false);const s=Math.ceil(l);
 if(G.type=='defuse'){const u=l<=15?Math.floor(l*2):s;if(u!=G.ls)beep(l<=15?1000+(15-l)*40:600,.05);G.ls=u}else{if(l<=(G.type=='snake'?3:10)&&s!=G.ls)beep(l<=3?1200:800,.06);G.ls=s}ghud()}
function ghook(line){if(G.fresh){G.fresh=0;return}
 if(G.type=='snake'){if(G.busy||!line.trim())return;if(!err&&G.t.t(line)){beep(1320,.1);G.score++;G.busy=true;snEat(gnext)}else beep(180,.12);return}
 if(line=='skip'&&G.type!='nav'){G.end-=3000;G.st=0;return gnext()}
 if(G.type=='nav'){const m=line.match(/^cat\s+(\S+)/);if(m&&'/'+parts(m[1]).join('/')==G.flag){G.score=Math.round((G.end-Date.now())/100);gend(true)}return}
 if(!err&&G.t.t(line)){const sec=(Date.now()-G.t0)/1000;beep(1320,.1);if(G.type=='rush'){G.st++;G.score+=10+Math.max(0,Math.round(8-sec))+G.st}else{G.k++;G.score+=100}gnext()}
 else if(G.type=='defuse'){G.end-=4000;beep(180,.25)}else{G.st=0;beep(220,.15)}
 ghud()}
function gstop(){clearInterval(G.iv);const g=G;G=null;if(g.type=='snake')snOver(g.score);if(g.type=='nav')delete ROOT.c.tmp.c.maze;cwd=H0;setP();lesson?lhud():hud('');return g}
function gquit(){gstop()}
function gend(w){const g=gstop();if(g.type=='rush')w=g.score>=60;if(g.type=='snake')w=g.score>=5;
 const msg={rush:`Time! Final score ${g.score}`,defuse:w?`Bomb defused! Score ${g.score}`:'💥 BOOM. The bomb went off.',nav:w?`Flag captured! Score ${g.score}`:'Time is up. The maze wins.',snake:`Snake over. Score: ${g.score}${w?' (5 or more earns XP)':''}`}[g.type];
 P(`<span class="${w?'ok':'bad'}">${g.type=='snake'?'':g.name+': '}${msg}</span>`);beep(w?1568:150,w?.2:.5);if(w)win(g.type=='nav'?'navigate':g.type)}
C.rush=()=>gstart('rush',60,'COMMAND RUSH');C.navigate=()=>gstart('nav',90,'MAZE HUNT');C.defuse=()=>gstart('defuse',45,'DEFUSE');
const CAR=[
{i:'🛡️',n:'SOC Analyst',s:'Watches alerts and stops attacks early',m:'A Security Operations Center (SOC) analyst monitors a company\'s networks and systems around the clock, investigates alerts from tools like a SIEM, decides what is a real attack, and escalates or contains it. It is the most common entry point into cybersecurity.',l:['Networking (TCP/IP, DNS, HTTP)','Linux and Windows basics','Log analysis','SIEM tools (Splunk, Elastic)','MITRE ATT&CK','Incident triage'],c:['CompTIA Security+ (foundation)','CompTIA CySA+ (analyst skills)','Splunk Core Certified User','Blue Team Level 1 (BTL1)','GIAC GSEC or GCIA (advanced)']},
{i:'🎯',n:'Penetration Tester',s:'Hacks systems legally to find weaknesses',m:'A penetration tester is hired to break into systems, networks and apps with permission, then writes a report explaining what was found and how to fix it. Kali Linux is one of the main toolkits for this job.',l:['Linux command line','Networking','Web flaws (OWASP Top 10)','Nmap, Burp Suite, Metasploit','Privilege escalation','Python or Bash scripting','Report writing'],c:['eJPT (entry level)','PNPT (practical)','CompTIA PenTest+','OSCP (industry favorite)','GIAC GPEN or CEH (recognised by employers)']},
{i:'🔴',n:'Red Team Operator',s:'Simulates real attackers against a whole organization',m:'Red teams run long, stealthy attack simulations that copy real threat groups, testing whether a company\'s people, processes and defenders can detect and stop them. It usually follows several years of penetration testing.',l:['Active Directory attacks','Phishing and social engineering','Command-and-control frameworks','Evading antivirus and EDR','Windows internals','Tool development','Operational security'],c:['OSCP (base skills)','CRTP (Active Directory)','CRTO (Certified Red Team Operator)','OSEP (advanced evasion)']},
{i:'🚨',n:'Incident Responder',s:'Takes charge when a breach happens',m:'Incident responders investigate active attacks, contain the damage, remove the attacker and help the business recover. They work under pressure and write the timeline of what happened.',l:['Log and memory analysis','Endpoint detection (EDR)','Windows and Linux internals','Malware triage','Network traffic analysis (Wireshark)','Calm communication'],c:['CompTIA CySA+','GIAC GCIH','GIAC GCFA (forensics)','Blue Team Level 1 or 2','EC-Council ECIH']},
{i:'🔍',n:'Digital Forensics Analyst',s:'Recovers and proves what happened on a device',m:'Forensic analysts collect and examine evidence from computers, phones and networks in a way that holds up in court or an internal investigation, recovering deleted files, timelines and attacker activity.',l:['File systems and disk imaging','Chain of custody','Windows artifacts and registry','Memory forensics (Volatility)','Mobile forensics','Report writing and legal basics'],c:['GIAC GCFE','GIAC GCFA','EnCE (EnCase)','EC-Council CHFI','CompTIA Security+ (foundation)']},
{i:'🦠',n:'Malware Analyst',s:'Takes malicious software apart to see how it works',m:'Malware analysts study viruses, ransomware and trojans in safe labs to learn what they do, how they spread and how to detect or stop them. It mixes programming knowledge with detective work.',l:['C and assembly basics','Windows internals','Static and dynamic analysis','Debuggers and disassemblers (x64dbg, Ghidra)','Safe lab and VM setup','Python scripting'],c:['GIAC GREM','GIAC GCFA','SANS FOR610 course (reverse engineering malware)','CompTIA Security+ (foundation)']},
{i:'🧱',n:'Security Engineer',s:'Builds and hardens the defenses',m:'Security engineers design, deploy and maintain a company\'s protections: firewalls, identity systems, monitoring and secure configurations. They turn security policy into working systems.',l:['Networking and firewalls','Linux and Windows hardening','Scripting and automation','Identity and access management','Cryptography basics','Infrastructure as code'],c:['CompTIA Security+','GIAC GSEC','CISSP (needs work experience)','CCSP (cloud)']},
{i:'☁️',n:'Cloud Security Engineer',s:'Protects systems on AWS, Azure or Google Cloud',m:'Cloud security engineers secure accounts, data and workloads hosted by cloud providers by fixing misconfigurations, controlling access and monitoring for attacks.',l:['One cloud in depth (AWS, Azure or GCP)','IAM policies','Containers and Kubernetes security','Terraform or similar tools','Cloud logging and monitoring','Network security groups'],c:['AWS Certified Security - Specialty','Microsoft AZ-500','Google Professional Cloud Security Engineer','CCSP','CCSK']},
{i:'📋',n:'GRC Analyst',s:'Keeps the company compliant and manages risk',m:'Governance, Risk and Compliance analysts check that an organization follows laws and standards such as ISO 27001, SOC 2 and data protection rules, assess risks and write policies. A good path if you prefer less hands-on technical work.',l:['Risk assessment methods','ISO 27001, NIST CSF, SOC 2','Privacy law (GDPR, Nigeria Data Protection Act)','Policy and audit writing','Vendor risk management','Clear communication'],c:['CompTIA Security+','ISACA CISA','ISACA CISM','ISACA CRISC','ISO 27001 Lead Implementer or Auditor']},
{i:'🧩',n:'Application Security Engineer',s:'Makes software safe before it ships',m:'AppSec engineers review code and test web and mobile apps for flaws, help developers fix them, and build security into the software development process.',l:['OWASP Top 10','Secure coding in one language','Code review','Burp Suite and SAST/DAST tools','APIs and authentication','CI/CD pipelines'],c:['Burp Suite Certified Practitioner','GIAC GWAPT','CSSLP','OSWE (advanced)']}];
R.careers=()=>`<h2>Cybersecurity careers</h2><p class=dim>Pick a career to see what it means, what to learn and which certifications to get.</p><div class=cg>${CAR.map((c,i)=>`<button class=cc style="animation-delay:${i*70}ms" onclick="career(${i})"><span class=ic>${c.i}</span><b>${c.n}</b><div class=dim>${c.s}</div></button>`).join('')}</div>`;
CAR.push(
{i:'🐞',g:'Offensive',n:'Bug Bounty Hunter',s:'Gets paid for finding flaws in real companies\' apps',m:'Bug bounty hunters test websites, APIs and apps for companies that publish a public or private program, then report valid vulnerabilities for a reward. You work for yourself, choose your targets and are paid per accepted finding, so income can swing a lot, especially at the start. Only test assets that a program lists as in scope and follow its rules. Testing anything else is illegal, even if you mean well.',l:['Web basics (HTTP, cookies, sessions, JWT)','OWASP Top 10 in depth','Burp Suite','Recon and subdomain discovery','IDOR, XSS, SSRF, auth bypass','Writing clear, reproducible reports','Patience and note-keeping'],c:['PortSwigger Web Security Academy (free training)','Burp Suite Certified Practitioner (BSCP)','Hack The Box CBBH (Certified Bug Bounty Hunter)','eWPT or eWPTX (web testing)','No cert is required: a track record on HackerOne, Bugcrowd or Intigriti counts most']},
{i:'🟣',g:'Offensive',n:'Purple Team Specialist',s:'Makes attackers and defenders work together',m:'Purple teamers run attack techniques on purpose, then check with the defenders whether the alerts fired and the logs caught it. The goal is to fix detection gaps fast instead of waiting for a real breach.',l:['MITRE ATT&CK mapping','Atomic Red Team and adversary emulation','Detection rules (Sigma, KQL, SPL)','SIEM and EDR tuning','Basic pentesting skills','Clear reporting to both sides'],c:['CompTIA CySA+ and PenTest+ (covers both sides)','Blue Team Level 1 (BTL1)','OSCP (offensive base)','GIAC GDAT (Defending Advanced Threats)']},
{i:'🧬',g:'Offensive',n:'Vulnerability Researcher',s:'Finds new bugs in software nobody has looked at closely',m:'Vulnerability researchers and exploit developers dig into operating systems, browsers, drivers and firmware to discover unknown flaws and prove them with working exploits. It is one of the hardest paths and usually follows years of programming and reverse engineering practice.',l:['C and C++','x86/x64 and ARM assembly','Debuggers (GDB, WinDbg) and Ghidra','Memory corruption (stack, heap)','Fuzzing (AFL++, libFuzzer)','Kernel and browser internals','Responsible disclosure'],c:['OSCP (starting point)','OSED (OffSec Exploit Developer)','OSEE (OffSec Exploit Expert, very advanced)','GIAC GXPN','CVE credits and public write-ups carry a lot of weight']},
{i:'📱',g:'Offensive',n:'Mobile Security Tester',s:'Breaks Android and iOS apps before criminals do',m:'Mobile security testers analyse apps for insecure storage, weak authentication, broken encryption and API flaws. Banks, fintechs and wallet apps hire for this, which makes it a good fit where mobile money is big.',l:['Android internals (APK, adb, jadx)','iOS basics','Frida and runtime hooking','Certificate pinning and how to test around it','OWASP MASVS and MASTG','API testing with Burp Suite'],c:['eMAPT (Mobile Application Penetration Tester)','GIAC GMOB','OWASP MASTG (free guide to follow)','OSCP (base skills)']},
{i:'🔌',g:'Offensive',n:'IoT and Hardware Security Specialist',s:'Hacks smart devices, routers and embedded gear',m:'These specialists test physical devices: opening them up, finding debug ports, pulling out firmware and probing radio links like Bluetooth. The field is young and has few formal certifications, so hands-on projects and public write-ups matter most.',l:['Embedded Linux','Electronics basics and a multimeter','UART, SPI and JTAG','Firmware extraction (binwalk)','Bluetooth LE and radio (SDR)','C and assembly basics'],c:['CompTIA Security+ (foundation)','CompTIA PenTest+','OSCP (base skills)','GIAC GPEN','Few IoT-specific certs exist: build a portfolio of device write-ups']},
{i:'⛓️',g:'Offensive',n:'Smart Contract Auditor',s:'Reviews blockchain code where one bug can drain millions',m:'Smart contract auditors read Solidity or Rust code for flaws like reentrancy, broken access control and price-oracle tricks. You can work at an audit firm or compete in public audit contests where findings are paid. Results are public, so a good record doubles as your CV.',l:['Solidity and the EVM','Common DeFi attack patterns','Foundry or Hardhat testing','Slither and fuzzing tools','Reading other people\'s audit reports','Basic cryptography'],c:['Secureum bootcamp material (free)','Cyfrin Updraft security courses (free)','Practice: Ethernaut and Damn Vulnerable DeFi','Audit contests (Code4rena, Sherlock, Cantina) act as proof of skill','No widely recognised formal certification exists yet']},
{i:'🏹',g:'Defensive',n:'Threat Hunter',s:'Searches for attackers who slipped past the alarms',m:'Threat hunters do not wait for alerts. They form a theory ("an attacker might be using this technique here") and search logs and endpoints for proof. Findings become new detection rules.',l:['Log analysis at scale','MITRE ATT&CK','Windows and Linux internals','Query languages (KQL, SPL, SQL)','EDR and SIEM tools','Python for data analysis','Hypothesis-driven investigation'],c:['CompTIA CySA+','eCTHPv2 (Certified Threat Hunting Professional)','GIAC GCIA (intrusion analysis)','GIAC GCDA (detection analyst)']},
{i:'🕵️',g:'Defensive',n:'Threat Intelligence Analyst',s:'Studies attackers to predict what they will do next',m:'Threat intelligence analysts research hacking groups, malware campaigns and leaked data, then turn it into short reports that help defenders prepare. It mixes technical skill, research and strong writing.',l:['OSINT techniques','MITRE ATT&CK and the kill chain','STIX/TAXII and MISP','Malware and infrastructure tracking','Dark web safety and opsec','Report writing and briefing','Geopolitics and regional threat awareness'],c:['GIAC GCTI','EC-Council CTIA','CompTIA CySA+','CompTIA Security+ (foundation)']},
{i:'⚙️',g:'Engineering',n:'DevSecOps Engineer',s:'Builds security into the software delivery pipeline',m:'DevSecOps engineers add automatic security checks to the build and deploy process: code scanning, dependency checks, secret detection and hardened containers, so problems are caught before release.',l:['Git and CI/CD (GitHub Actions, GitLab CI)','Docker and Kubernetes','SAST, DAST and dependency scanning','Infrastructure as code (Terraform)','Secrets management','Python or Bash automation'],c:['CKS (Certified Kubernetes Security Specialist)','AWS Certified Security - Specialty','GIAC GCSA (Cloud Security Automation)','Certified DevSecOps Professional (Practical DevSecOps)','CompTIA Security+ (foundation)']},
{i:'🏛️',g:'Engineering',n:'Security Architect',s:'Designs how the whole system stays safe',m:'Security architects plan the big picture: how networks, identity, cloud and applications fit together securely. They review designs, run threat modelling and set the standards engineers follow. It is a senior role that normally comes after years of hands-on work.',l:['Zero trust design','Threat modelling (STRIDE)','Network and cloud architecture','Identity and access management','Risk assessment','Security frameworks (NIST, ISO 27001)','Communicating with executives'],c:['CISSP (needs work experience)','CISSP-ISSAP (architecture concentration)','SABSA certification','CCSP (cloud)','TOGAF (enterprise architecture)']},
{i:'🏭',g:'Engineering',n:'OT / ICS Security Engineer',s:'Protects power plants, factories and pipelines',m:'Operational technology (OT) security protects the control systems that run physical processes. A mistake here can stop production or hurt people, so safety comes first and many tools used in normal IT are unsafe to run. Energy, oil and gas and manufacturing employers hire for this.',l:['PLCs and SCADA basics','Industrial protocols (Modbus, DNP3)','Purdue model and network segmentation','IEC 62443','Passive monitoring tools','Safety-first mindset'],c:['GIAC GICSP (Global Industrial Cyber Security Professional)','GIAC GRID','ISA/IEC 62443 cybersecurity certificates','CompTIA Security+ (foundation)']},
{i:'🗝️',g:'Governance',n:'Privacy / Data Protection Officer',s:'Makes sure people\'s personal data is handled lawfully',m:'Privacy specialists and Data Protection Officers advise on how personal data is collected, stored and shared. They run impact assessments, handle breach notifications and answer to regulators. Laws like the Nigeria Data Protection Act and GDPR make this a growing field.',l:['Nigeria Data Protection Act and GDPR','Data mapping and DPIAs','Breach notification procedures','Contracts and vendor reviews','Consent and retention policies','Plain-language communication'],c:['IAPP CIPP/E (European law)','IAPP CIPM (privacy management)','IAPP CIPT (technology)','ISO 27701 Lead Implementer','Data protection training recognised by the Nigeria Data Protection Commission (check its site for current requirements)']},
{i:'👔',g:'Governance',n:'CISO (Chief Information Security Officer)',s:'Leads security for the whole organization',m:'The CISO owns a company\'s security strategy, budget and team, reports to executives and the board, and leads during major incidents. It is a leadership role that usually needs many years of experience and strong business communication.',l:['Security strategy and budgeting','Risk management','Board-level communication','Incident leadership','Team building and hiring','Regulation and compliance','Vendor and cloud oversight'],c:['ISACA CISM','CISSP','EC-Council CCISO','ISACA CRISC','Usually requires 10 or more years of experience']}
);
const GRP={'SOC Analyst':'Defensive','Penetration Tester':'Offensive','Red Team Operator':'Offensive','Incident Responder':'Defensive','Digital Forensics Analyst':'Defensive','Malware Analyst':'Defensive','Security Engineer':'Engineering','Cloud Security Engineer':'Engineering','GRC Analyst':'Governance','Application Security Engineer':'Engineering'};
CAR.forEach(c=>{if(!c.g)c.g=GRP[c.n]});
{const b=CAR.findIndex(c=>c.n=='Bug Bounty Hunter'),p=CAR.findIndex(c=>c.n=='Penetration Tester');CAR.splice(p+1,0,CAR.splice(b,1)[0])}
let cf='All';
R.careers=()=>{const gs=['All','Offensive','Defensive','Engineering','Governance'],ls=CAR.map((c,i)=>[c,i]).filter(([c])=>cf=='All'||c.g==cf);return `<h2>Cybersecurity careers</h2><p class=dim>${CAR.length} paths. Pick one to see what it means, what to learn and which certifications to get.</p><div class=fl role=group aria-label="Filter careers">${gs.map(g=>`<button class="${cf==g?'on':''}" onclick="cfilter('${g}')">${g}${g=='All'?'':' ('+CAR.filter(c=>c.g==g).length+')'}</button>`).join('')}</div><div class=cg>${ls.map(([c,i],k)=>`<button class=cc style="animation-delay:${Math.min(k,12)*50}ms" onclick="career(${i})"><span class=ic>${c.i}</span><b>${c.n}</b><div class=dim>${c.s}</div><span class=tag>${c.g}</span></button>`).join('')}</div>`};
function cfilter(g){cf=g;const pv=$('#pv'),y=pv.scrollTop;pv.innerHTML=R.careers();pv.scrollTop=y}
function career(i){const c=CAR[i],pv=$('#pv');pv.innerHTML=`<div class=cd><button class=btn onclick="go('careers')">◀ All careers</button><h2>${c.i} ${c.n}</h2><p class=dim>${c.s}</p><section style="animation-delay:.1s"><h3>What it means</h3><p>${c.m}</p></section><section style="animation-delay:.25s"><h3>What to learn</h3>${c.l.map((x,k)=>`<span class=chip style="animation-delay:${.35+k*.07}s">${x}</span>`).join('')}</section><section style="animation-delay:.45s"><h3>Certifications to get</h3>${c.c.map((x,k)=>`<div class=cert style="animation-delay:${.6+k*.1}s">${x}</div>`).join('')}</section><p class=dim style="margin-top:16px">Certification names, prices and requirements change. Check each vendor's site before you commit.</p></div>`;pv.scrollTop=0}
const WA='<a class="wa" href="https://chat.whatsapp.com/DCb6Pvwu0Di84aUHFuWNG3?s=cl&p=a&mlu=4&ilr=4" target="_blank" rel="noopener noreferrer"><span class="wi"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.08-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.78h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.89-9.89 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 7c0 5.45-4.44 9.88-9.88 9.88M20.46 3.49A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.9 11.9 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.42"/></svg></span>Join group</a>';
// ---------- settings ----------
const svS=()=>{try{localStorage.setItem('ksettings',JSON.stringify(KST))}catch(e){}};
function setOpt(k,v,quiet){KST[k]=v;snd=KST.snd;svS();kApply();if(!quiet)renderSet()}
function renderSet(){const pv=$('#pv'),y=pv.scrollTop;pv.innerHTML=R.settings();pv.scrollTop=y}
function resetSet(){KST=Object.assign({},KDEF);snd=KST.snd;svS();kApply();renderSet();toast('Settings reset')}
const SW=(k,l,d)=>`<div class=set><div><b>${l}</b><div class=dim>${d}</div></div><button class="sw ${KST[k]?'on':''}" role=switch aria-checked="${!!KST[k]}" aria-label="${l}" onclick="setOpt('${k}',!KST.${k})"></button></div>`;
const SEG=(k,l,d,o)=>`<div class=set><div><b>${l}</b><div class=dim>${d}</div></div><div class=seg role=group aria-label="${l}">${o.map(([v,t])=>`<button class="${KST[k]==v?'on':''}" aria-pressed="${KST[k]==v}" onclick="setOpt('${k}','${v}')">${t}</button>`).join('')}</div></div>`;
R.settings=()=>`<h2>Settings</h2><p class=dim>Saved in this browser. Changes apply instantly.</p>
<h3>Sound</h3>
${SW('snd','Sound effects','Game beeps, countdown ticks and success tones.')}
<div class=set><div><b>Volume</b><div class=dim>How loud the effects are.</div></div><div class=rg><input type=range min=0 max=100 step=5 value="${KST.vol}" aria-label="Volume" oninput="this.nextElementSibling.textContent=this.value+'%';setOpt('vol',+this.value,1)"><span>${KST.vol}%</span></div></div>
${SW('keys','Key click sound','A soft tick for every key you type in the terminal.')}
<div class=set><div><b>Test sound</b><div class=dim>Plays a short tone at the current volume.</div></div><button class="btn ghost" style="margin:0" onclick="beep(880,.1);setTimeout(()=>beep(1320,.12),120)">▶ Play</button></div>
<h3>Appearance</h3>
${SEG('theme','Theme','Dark, light, or follow your device.',[['dark','🌙 Dark'],['light','☀️ Light'],['system','💻 System']])}
<div class=set><div><b>Accent color</b><div class=dim>Buttons, highlights and the loader logo.</div></div><div class=sat role=group aria-label="Accent color">${Object.keys(KACC).map(k=>`<button class="${KST.acc==k?'on':''}" style="background:${KACC[k][KST.theme=='light'||(KST.theme=='system'&&matchMedia('(prefers-color-scheme: light)').matches)?1:0]}" title="${k}" aria-label="${k}" aria-pressed="${KST.acc==k}" onclick="setOpt('acc','${k}')"></button>`).join('')}</div></div>
${SW('crt','CRT scanlines','Retro screen lines over the terminal.')}
${SW('rm','Reduce animations','Turns off most motion and transitions.')}
<h3>Terminal</h3>
<div class=set><div><b>Text size</b><div class=dim>Font size across the app.</div></div><div class=rg><input type=range min=11 max=20 step=1 value="${KST.fs}" aria-label="Text size" oninput="this.nextElementSibling.textContent=this.value+'px';setOpt('fs',+this.value,1)"><span>${KST.fs}px</span></div></div>
<h3>Startup</h3>
${SW('intro','Intro animation','Show the Kali logo loader when the app opens.')}
<h3>Reset</h3>
<button class="btn ghost" style="margin:8px 0 0" onclick="resetSet()">Reset settings to default</button>`;
matchMedia('(prefers-color-scheme: light)').addEventListener('change',()=>{if(KST.theme=='system'){kApply();if($('#pv').style.display=='block'&&$('#pv').querySelector('.sat'))renderSet()}});
inp.addEventListener('keydown',e=>{if(KST.keys&&snd&&e.key.length==1)beep(420+Math.random()*120,.015)});
// ---------- boot ----------
const LM=['Starting kernel...','Mounting filesystems...','Loading modules...','Preparing quizzes...','Warming up the terminal...'];let lk=0;const li=setInterval(()=>{const e=$('#lt');if(e)e.textContent=LM[lk++%LM.length]},1600);$('#lt').textContent=LM[lk++];
const bootEnd=()=>{clearInterval(li);$('#load').style.opacity=0;setTimeout(()=>$('#load').remove(),650);inp.focus()};
if(KST.intro&&window.parent===window)setTimeout(bootEnd,KST.rm?1200:8000);else{clearInterval(li);$('#load').remove();inp.focus()}
setP();
