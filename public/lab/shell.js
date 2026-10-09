// =====================================================================
// shell.js  -  a more realistic shell engine
//   users + permissions, sudo/su with a password prompt, ; && || chains,
//   $(...) and $((...)), globbing, aliases, for/while/if scripting,
//   history expansion (!!), background jobs, timed ("dripped") output.
// =====================================================================
(()=>{
'use strict';
const SH=window.SH={};

// ---------- users and permissions ----------
let user='kali',rootShell=false,sudoOK=false,lastStatus=0,hinted=false,PEND=false,CURLINE='',POS=['bash'];
const GR={kali:['kali','adm','sudo','dialout','audio','video','plugdev','netdev','wireshark','users'],root:['root']};
const HOME=()=>user=='root'?'/root':'/home/kali';
const MODE=n=>(n.m||(n.t=='d'?'755':'644')).slice(-3);
const can=(n,bit)=>{if(user=='root')return true;const m=MODE(n),o=n.o||'kali',g=n.g||o;const d=o==user?+m[0]:GR[user].includes(g)?+m[1]:+m[2];return(d&bit)!=0};
Object.assign(SH,{can,MODE,GR,HOME,user:()=>user,setUser:u=>{user=u},isRootShell:()=>rootShell});
window.canRead=n=>can(n,4);
const canX=n=>{const m=MODE(n);if(user=='root')return /[1357]/.test(m);const o=n.o||'kali',g=n.g||o,d=o==user?+m[0]:GR[user].includes(g)?+m[1]:+m[2];return(d&1)!=0};
SH.canX=canX;
const meta=()=>({o:user,g:user});
SH.meta=meta;

// ---------- prompt ----------
const pd=()=>{const h=HOME();return cwd==h?'~':cwd.startsWith(h+'/')?'~'+cwd.slice(h.length):cwd};
SH.pd=pd;
window.setP=function(){const r=user=='root';$('#p1').innerHTML=`┌──(<span class="${r?'u2':'u'}">${user}㉿kali</span>)-[<span>${esc(pd())}</span>]`;$('#pl').textContent=r?'└─# ':'└─$ ';$('#ttl').textContent=user+'@kali: '+pd()};
const promptHTML=l=>{const r=user=='root';return`<span class=p1>┌──(</span><span class="${r?'u2':'u'}">${user}㉿kali</span><span class=p1>)-[${esc(pd())}]</span>\n<span class=p2>${r?'└─#':'└─$'}</span> ${esc(l)}`};
let savedCwd='/home/kali';
function enterRoot(login){if(!rootShell)savedCwd=cwd;user='root';rootShell=true;if(login)cwd='/root';ENV.USER='root';ENV.HOME='/root';setP()}
function leaveRoot(){user='kali';rootShell=false;cwd=savedCwd;ENV.USER='kali';ENV.HOME='/home/kali';setP()}
SH.enterRoot=enterRoot;SH.leaveRoot=leaveRoot;

// ---------- interactive modes (password prompts, editors) ----------
let MI=null;
const setMode=(fn,prompt,mask,keep)=>{mode=fn;MI={fn,prompt,mask,keep}};
SH.setMode=setMode;
function askPass(prompt,valid,onOk,fail,retry){
 let tries=0;PEND=true;
 const end=()=>{PEND=false;mode=null;MI=null;inp.type='text'};
 const fn=l=>{if(valid(l)){end();onOk();post(CURLINE);return}
  if(++tries>=3){end();bad(fail);post(CURLINE);return}P(`<span class=dim>${esc(retry)}</span>`)};
 setMode(fn,prompt,true);inp.type='password';
 if(!hinted){hinted=true;P('<span class=dim>(lab hint: the password for kali and root is "kali")</span>')}}
SH.askPass=askPass;

// ---------- timed output ----------
let dripping=0,dq=[],dt=[];
function flush(){if(!dripping&&dq.length){const l=dq.shift();window.run(l)}}
function drip(lines,gap,after){
 if(cap!==null||!lines.length){lines.forEach(l=>P(l));if(after)after();return}
 dripping++;let i=0;
 const step=()=>{if(i>=lines.length){dripping--;if(after)after();return flush()}P(lines[i++]);dt.push(setTimeout(step,gap))};
 step()}
SH.drip=drip;
function stopAll(){dt.forEach(clearTimeout);dt=[];dripping=0;dq=[];PEND=false;MI=null;inp.type='text';if(SH.stopMission)SH.stopMission()}
inp.addEventListener('keydown',e=>{
 if(e.ctrlKey&&e.key=='c'){stopAll()}
 if(e.ctrlKey&&e.key=='u'){e.preventDefault();inp.value=''}
 if(e.ctrlKey&&e.key=='d'&&!inp.value){e.preventDefault();if(mode){mode=null;MI=null;inp.type='text';P('<span class=dim>(end of input)</span>')}else C.exit([])}
});

// ---------- aliases / jobs ----------
const ALIAS={ll:'ls -la',la:'ls -A',l:'ls -CF'};
SH.ALIAS=ALIAS;
const PROCS=[
 {pid:1,u:'root',cpu:0.1,mem:0.6,tty:'?',cmd:'/sbin/init splash',stat:'Ss'},
 {pid:214,u:'root',cpu:0.0,mem:1.1,tty:'?',cmd:'/lib/systemd/systemd-journald',stat:'Ss'},
 {pid:402,u:'root',cpu:0.0,mem:0.4,tty:'?',cmd:'/usr/sbin/cron -f',stat:'Ss'},
 {pid:540,u:'messagebus',cpu:0.0,mem:0.3,tty:'?',cmd:'/usr/bin/dbus-daemon --system',stat:'Ss'},
 {pid:598,u:'root',cpu:0.0,mem:0.4,tty:'?',cmd:'/lib/systemd/systemd-logind',stat:'Ss'},
 {pid:612,u:'root',cpu:0.2,mem:1.2,tty:'?',cmd:'/usr/sbin/NetworkManager --no-daemon',stat:'Ssl'},
 {pid:640,u:'root',cpu:0.0,mem:0.3,tty:'?',cmd:'/usr/sbin/rsyslogd -n',stat:'Ssl'},
 {pid:812,u:'root',cpu:0.0,mem:0.9,tty:'?',cmd:'/usr/sbin/apache2 -k start',stat:'Ss',svc:'apache2'},
 {pid:845,u:'www-data',cpu:0.0,mem:0.5,tty:'?',cmd:'/usr/sbin/apache2 -k start',stat:'S',svc:'apache2'},
 {pid:960,u:'root',cpu:0.0,mem:0.5,tty:'?',cmd:'sshd: /usr/sbin/sshd -D [listener]',stat:'Ss',svc:'ssh'},
 {pid:1010,u:'kali',cpu:0.1,mem:1.8,tty:'?',cmd:'xfce4-session',stat:'Ssl'},
 {pid:1021,u:'kali',cpu:0.0,mem:0.5,tty:'pts/0',cmd:'-bash',stat:'Ss'}];
const JOBS=[];let nextPid=2300;
const SVC={
 ssh:{d:'OpenBSD Secure Shell server',on:true,en:false,port:22,svc:'sshd',doc:'man:sshd(8)'},
 apache2:{d:'The Apache HTTP Server',on:true,en:false,port:80,svc:'apache2',doc:'https://httpd.apache.org/docs/2.4/'},
 postgresql:{d:'PostgreSQL RDBMS',on:false,en:false,port:5432,svc:'postgres',doc:''},
 mysql:{d:'MariaDB 11 database server',on:false,en:false,port:3306,svc:'mariadbd',doc:'man:mariadbd(8)'},
 NetworkManager:{d:'Network Manager',on:true,en:true,port:0,svc:'NetworkManager',fixed:true,doc:'man:NetworkManager(8)'},
 cron:{d:'Regular background program processing daemon',on:true,en:true,port:0,svc:'cron',fixed:true,doc:'man:cron(8)'},
 rsyslog:{d:'System Logging Service',on:true,en:true,port:0,svc:'rsyslogd',fixed:true,doc:'man:rsyslogd(8)'},
 bluetooth:{d:'Bluetooth service',on:false,en:false,port:0,svc:'bluetoothd',doc:'man:bluetoothd(8)'}};
Object.assign(SH,{PROCS,JOBS,SVC,ALIAS});
SH.addProc=(p)=>{p.pid=p.pid||nextPid++;PROCS.push(p);return p.pid};
SH.hms=()=>new Date().toTimeString().slice(0,5);
const LONG=['sleep','ping','watch','nc','tcpdump','top','yes','htop'];
function bgStart(rawCmd,args){
 const id=(JOBS.reduce((m,j)=>Math.max(m,j.id),0))+1,pid=nextPid++;
 P(`[${id}] ${pid}`);
 if(LONG.includes(args[0])){PROCS.push({pid,u:user,cpu:0,mem:0.1,tty:'pts/0',cmd:rawCmd,stat:'S'});JOBS.push({id,pid,cmd:rawCmd+' &',state:'Running'})}
 else{window.QUIET=false;execLine(rawCmd,false);P(`<span class=dim>[${id}]+  Done                    ${esc(rawCmd)}</span>`)}}

// ---------- parsing ----------
function splitChain(line){
 const out=[];let cur='',q=null,d=0,op=';';
 for(let i=0;i<line.length;i++){const ch=line[i];
  if(q){cur+=ch;if(ch==q)q=null;continue}
  if(ch=="'"||ch=='"'){q=ch;cur+=ch;continue}
  if(ch=='#'&&(i==0||/\s/.test(line[i-1]))&&d==0){while(i<line.length&&line[i]!='\n')i++;i--;continue}
  if(ch=='$'&&line[i+1]=='('){d++;cur+='$(';i++;continue}
  if(ch==')'&&d>0){d--;cur+=ch;continue}
  if(d==0){
   if(ch==';'||ch=='\n'){out.push({s:cur,op});cur='';op=';';continue}
   if(ch=='&'&&line[i+1]=='&'){out.push({s:cur,op});cur='';op='&&';i++;continue}
   if(ch=='|'&&line[i+1]=='|'){out.push({s:cur,op});cur='';op='||';i++;continue}}
  cur+=ch}
 out.push({s:cur,op});return out}
const arith=e=>{e=e.replace(/[A-Za-z_]\w*/g,v=>{const x=vget(v);return /^-?\d+$/.test(x)?x:'0'});
 if(!/^[\d+\-*/%()\s<>=!&|]*$/.test(e))return'0';try{return String(Math.trunc(Function('"use strict";return ('+e+')')()))}catch(x){return'0'}};
function vget(k){
 if(k=='?')return String(lastStatus);if(k=='#')return String(Math.max(0,POS.length-1));if(k=='@'||k=='*')return POS.slice(1).join(' ');
 if(/^\d$/.test(k))return POS[+k]||'';if(k=='$')return'1021';
 if(k=='PWD')return cwd;if(k=='USER'||k=='LOGNAME')return user;if(k=='HOME')return HOME();
 return ENV[k]!==undefined?ENV[k]:''}
function matchParen(s,i){let d=0;for(;i<s.length;i++){if(s[i]=='(')d++;else if(s[i]==')'){d--;if(d==0)return i}}return -1}
function preExpand(s){
 let out='',i=0,q=null;
 while(i<s.length){const ch=s[i];
  if(q=="'"){out+=ch;if(ch=="'")q=null;i++;continue}
  if(ch=="'"&&!q){q="'";out+=ch;i++;continue}
  if(ch=='"'){q=q=='"'?null:'"';out+=ch;i++;continue}
  if(ch=='\\'&&s[i+1]=='$'){out+='$';i+=2;continue}
  if(ch=='$'&&s[i+1]=='('&&s[i+2]=='('){const j=matchParen(s,i+1);if(j>0&&s[j-1]==')'){out+=arith(preExpand(s.slice(i+3,j-1)));i=j+1;continue}}
  if(ch=='$'&&s[i+1]=='('){const j=matchParen(s,i+1);if(j>0){const t=SH.capture(s.slice(i+2,j)).replace(/\n+$/,'');out+=q=='"'?t:t.replace(/\n/g,' ');i=j+1;continue}}
  if(ch=='`'){const j=s.indexOf('`',i+1);if(j>0){const t=SH.capture(s.slice(i+1,j)).replace(/\n+$/,'');out+=q=='"'?t:t.replace(/\n/g,' ');i=j+1;continue}}
  if(ch=='$'){let m;
   if((m=s.slice(i).match(/^\$\{(\w+)\}/))){out+=vget(m[1]);i+=m[0].length;continue}
   if((m=s.slice(i).match(/^\$([A-Za-z_]\w*|\d|\?|#|@|\*|\$)/))){out+=vget(m[1]);i+=m[0].length;continue}}
  out+=ch;i++;if(out.length>1e6)throw new Budget('expansion')}
 return out}
const TOK=/2>&1|2>>|2>|>>|>|<|\||&|(?:[^\s|><&"';]|"[^"]*"|'[^']*')+/g;
const OPS=/^(2>&1|2>>|2>|>>|>|<|\||&)$/;
function tokenize(str){
 return(str.match(TOK)||[]).map(t=>OPS.test(t)?{op:t}:{w:t.replace(/"([^"]*)"|'([^']*)'/g,(m,a,b)=>a!==undefined?a:b),q:/["']/.test(t)})}
function globTok(w){
 const sl=w.lastIndexOf('/'),dir=sl>=0?w.slice(0,sl+1):'',pat=w.slice(sl+1),n=get(dir||'.');
 if(!n||n.t!='d'||!/[*?]/.test(pat))return[w];
 const re=new RegExp('^'+pat.replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*').replace(/\?/g,'.')+'$');
 const hit=Object.keys(n.c).filter(k=>re.test(k)&&(pat[0]=='.'||k[0]!='.')).sort();
 return hit.length?hit.map(k=>dir+k):[w]}
const words=s=>tokenize(preExpand(s)).filter(t=>t.w!==undefined).flatMap(t=>t.q||!/[*?]/.test(t.w)?[t.w]:globTok(t.w));

// ---------- executing ----------
SH.capture=cmd=>execChain(cmd,true);
function execChain(line,capture){return execItems(splitChain(line),capture)}
const KW=k=>/^(for|while|until|if)$/.test(k),fw=s=>s.trim().split(/\s+/)[0];
function execItems(items,capture){
 let out='',ok=true;
 for(let i=0;i<items.length;i++){
  const it=items[i],s=it.s.trim();if(!s)continue;
  if(it.op=='&&'&&!ok)continue;if(it.op=='||'&&ok)continue;
  if(KW(fw(s))){
   let d=0,j=i;
   for(;j<items.length;j++){const k=fw(items[j].s);if(KW(k))d++;else if(k=='done'||k=='fi'){d--;if(d==0)break}}
   if(j>=items.length){bad('bash: syntax error: unexpected end of file');return out}
   const r=block(fw(s),items.slice(i,j+1),capture);out+=r.out;ok=r.ok;i=j;continue}
  err=false;const r=execLine(s,capture);if(capture)out+=r;ok=!err;lastStatus=ok?0:1}
 return out}
function block(kw,seg,capture){
 const first=seg[0].s.trim();let out='';
 const strip=b=>{b=b.map(x=>({...x}));if(b[0])b[0].s=b[0].s.replace(/^\s*do\b\s*/,'');return b};
 if(kw=='for'){
  const m=first.match(/^for\s+(\w+)\s+in\s*(.*)$/);if(!m){bad('bash: syntax error near unexpected token `do\'');return{out,ok:false}}
  const body=strip(seg.slice(1,-1));let n=0;
  for(const v of words(m[2])){BUD.tick();ENV[m[1]]=String(v).slice(0,100000);out+=execItems(body,capture);if(++n>500)break}
  return{out,ok:!err}}
 if(kw=='while'||kw=='until'){
  const cond=first.replace(/^(while|until)\s+/,''),body=strip(seg.slice(1,-1));
  for(let n=0;n<300;n++){BUD.tick();err=false;execItems([{s:cond,op:';'}],false);const c=!err;if(kw=='while'?!c:c)break;out+=execItems(body,capture)}
  return{out,ok:true}}
 // if / elif / else / fi
 const inner=seg.slice(1,-1),groups=[];let cur={cond:first.replace(/^if\s+/,''),body:[]},d=0;
 for(const it of inner){const s=it.s.trim(),k=fw(s);
  if(d==0&&k=='then'){const r=s.replace(/^then\s*/,'');if(r)cur.body.push({s:r,op:';'});continue}
  if(d==0&&k=='elif'){groups.push(cur);cur={cond:s.replace(/^elif\s+/,''),body:[]};continue}
  if(d==0&&k=='else'){groups.push(cur);cur={cond:null,body:[]};const r=s.replace(/^else\s*/,'');if(r)cur.body.push({s:r,op:';'});continue}
  cur.body.push(it);if(KW(k))d++;else if(k=='fi')d--}
 groups.push(cur);
 for(const g of groups){
  if(g.cond!==null){err=false;execItems([{s:g.cond,op:';'}],false);if(err)continue}
  out+=execItems(g.body,capture);break}
 return{out,ok:true}}

function writeRedirect(rf,t,ap){
 if(rf=='/dev/null')return;
 const[p,nm]=par(rf);if(!p){bad(`bash: ${rf}: No such file or directory`);return}
 const ex=p.c[nm];if(ex&&ex.t=='d'){bad(`bash: ${rf}: Is a directory`);return}
 if(ex?!can(ex,2):!can(p,2)){bad(`bash: ${rf}: Permission denied`);return}
 const n=F((ap&&ex?ex.c:'')+(t?t+'\n':''));if(ex){n.m=ex.m;n.o=ex.o;n.g=ex.g}else Object.assign(n,meta());p.c[nm]=n}

function execLine(raw,capture){
 BUD.tick();
 let s=raw.trim();if(!s)return'';
 s=preExpand(s);if(s.length>1e6)throw new Budget('expansion');
 let toks=tokenize(s),bg=false;
 if(toks.length&&toks[toks.length-1].op=='&'){bg=true;toks.pop()}
 if(!toks.length)return'';
 if(toks.every(t=>t.w!==undefined&&/^\w+=/.test(t.w))){toks.forEach(t=>{const m=t.w.match(/^(\w+)=(.*)$/);ENV[m[1]]=m[2].slice(0,100000)});return''}
 if(bg){const w=toks.filter(t=>t.w!==undefined).map(t=>t.w);return bgStart(s.replace(/\s*&\s*$/,''),w),''}
 const segs=[[]];toks.forEach(t=>t.op=='|'?segs.push([]):segs[segs.length-1].push(t));
 if(lesson&&segs.length>1&&!(done[11]||cur()==11)){bad('bash: pipes (|) are locked. Finish module 12 (Pipes and redirection) in the Modules tab.');return''}
 stdin=null;let result='';
 for(let si=0;si<segs.length;si++){
  const last=si==segs.length-1,sg=segs[si];let a=[],rf=null,ap=false,inf=null,quiet=false;
  for(let k=0;k<sg.length;k++){const t=sg[k];
   if(t.op){
    if(t.op=='>'||t.op=='>>'){const n=sg[++k];rf=n&&n.w;ap=t.op=='>>'}
    else if(t.op=='<'){const n=sg[++k];inf=n&&n.w}
    else if(t.op=='2>'||t.op=='2>>'){const n=sg[++k];if(n&&n.w=='/dev/null')quiet=true}}
   else a.push(t)}
  let args=[];
  a.forEach((t,idx)=>{let w=t.w;
   if(!t.q&&w[0]=='~'&&(w.length==1||w[1]=='/'))w=HOME()+w.slice(1);
   if(!t.q&&/[*?]/.test(w)&&idx>0)globTok(w).forEach(x=>args.push(x));else args.push(w)});
  if(rf&&rf[0]=='~')rf=HOME()+rf.slice(1);
  if(!args.length)continue;
  if(ALIAS[args[0]]){const rep=tokenize(preExpand(ALIAS[args[0]])).filter(t=>t.w!==undefined).map(t=>t.w);args=[...rep,...args.slice(1)]}
  if(inf){const n=get(inf);if(!n||n.t!='f'){bad(`bash: ${inf}: No such file or directory`);return result}stdin=n.c}
  cap=(last&&!rf&&!capture)?null:[];
  window.QUIET=quiet;
  try{runCmd(args)}finally{window.QUIET=false}
  if(cap){const t=cap.map(plain).join('\n');cap=null;
   if(rf)writeRedirect(rf,t,ap);else if(last&&capture)result=t;else stdin=t?t+'\n':''}}
 stdin=null;return result}

// ---------- command dispatch ----------
const lev=(a,b)=>{const d=[...Array(a.length+1)].map((_,i)=>[i,...Array(b.length).fill(0)]);for(let j=0;j<=b.length;j++)d[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]==b[j-1]?0:1));return d[a.length][b.length]};
const PKGS=['figlet','htop','sl','fortune','cmatrix','lolcat','neovim','nginx','python3','git','vim','tmux'];
SH.PKGS=PKGS;
function notFound(c){
 if(PKGS.includes(c)&&!SH.INSTALLED.has(c))return bad(`Command '${c}' not found, but can be installed with:\nsudo apt install ${c}`);
 const sg=Object.keys(C).filter(k=>k!=c&&lev(c,k)<=(c.length<4?1:2)).slice(0,3);
 if(sg.length)return bad(`Command '${c}' not found, did you mean:\n${sg.map(k=>`  command '${k}'`).join('\n')}`);
 bad(`bash: ${c}: command not found`)}
SH.INSTALLED=INST;
function runScript(text,args,name){
 if(++BUD.depth>25){BUD.depth--;bad('bash: fork: retry: Resource temporarily unavailable');throw new Budget('recursion')}
 const keep=POS;POS=[name||'bash',...(args||[])];
 try{execChain(text.replace(/^#!.*$/m,''),false)}finally{POS=keep;BUD.depth--}}
SH.runScript=runScript;
const WR={mkdir:'create directory',touch:'touch',rm:'remove',rmdir:'remove',ln:'create link',cp:'create regular file',mv:'move',tee:'open',nano:'open',vi:'open',vim:'open',unlink:'remove'};
function guard(c,a){
 if(!WR[c])return false;
 const args=a.filter(x=>x[0]!='-');let t=[];
 if(c=='cp'||c=='mv'){t=args.length>1?[args[args.length-1]]:[];if(c=='mv')t=t.concat(args.slice(0,-1))}else t=args;
 for(const x of t){const[p]=par(x),n=get(x);
  if(c=='mkdir'&&a.includes('-p'))continue;
  if(p&&!can(p,2)&&!((c=='cp'||c=='mv')&&n&&n.t=='d'&&can(n,2))){bad(`${c}: cannot ${WR[c]} '${x}': Permission denied`);return true}
  if((c=='nano'||c=='vi'||c=='vim'||c=='tee')&&n&&n.t=='f'&&!can(n,2)){bad(`${c}: ${x}: Permission denied`);return true}}
 return false}
function runCmd(a){
 const c=a[0],args=a.slice(1);
 if(c.includes('/')&&!C[c]){
  const n=get(c);
  if(!n)return bad(`bash: ${c}: No such file or directory`);
  if(n.t=='d')return bad(`bash: ${c}: Is a directory`);
  const base=c.split('/').pop();
  if(!n.c&&C[base])return runCmd([base,...args]);
  if(!canX(n))return bad(`bash: ${c}: Permission denied`);
  return runScript(n.c,args,c)}
 if(!C[c])return notFound(c);
 const m=modOf(c);
 if(lesson&&m>=0&&!done[m]&&m!=cur())return bad(`bash: ${c}: locked. Finish module ${m+1} (${M[m].n}) in the Modules tab.`);
 if(c=='sudo')return doSudo(args);
 if(args.includes('--help')&&MAN[c])return SH.usage(c);
 if(guard(c,args))return;
 C[c](args)}
SH.runCmd=runCmd;

function doSudo(args){
 let a=args.slice(),login=false,shell=false;
 if(!a.length)return bad('usage: sudo -h | -K | -k | -V\nusage: sudo [-i] [-u user] command');
 while(a[0]&&a[0][0]=='-'){const f=a.shift();
  if(f=='-i')login=true;else if(f=='-s')shell=true;else if(f=='-u')a.shift();
  else if(f=='-k'||f=='-K'){sudoOK=false;return}
  else if(f=='-l'){return P('Matching Defaults entries for kali on kali:\n    env_reset, mail_badpass, secure_path=/usr/local/sbin\\:/usr/local/bin\\:/usr/sbin\\:/usr/bin\\:/sbin\\:/bin\n\nUser kali may run the following commands on kali:\n    (ALL : ALL) ALL')}}
 const rootish=login||shell||(['su','bash','sh','zsh'].includes(a[0])&&a.length<=2);
 if(!a.length&&!rootish)return bad('usage: sudo [-i] [-u user] command');
 const go=()=>{
  if(rootish){enterRoot(login||(a[0]=='su'&&a[1]=='-'));return}
  const prev=user;user='root';try{runCmd(a)}finally{user=prev}};
 if(user=='root'||sudoOK)return go();
 askPass('[sudo] password for kali: ',pw=>pw=='kali',()=>{sudoOK=true;go()},'sudo: 3 incorrect password attempts','Sorry, try again.')}
C.sudo=doSudo;
C.su=a=>{
 const login=a.includes('-')||a.includes('-l')||a.includes('-i'),who=a.filter(x=>x[0]!='-')[0]||'root';
 if(who=='kali'||who==user&&user!='root'){if(user=='root')leaveRoot();return}
 if(who!='root')return bad(`su: user ${who} does not exist or the user entry does not contain all the required fields`);
 if(user=='root')return;
 askPass('Password: ',pw=>pw=='kali',()=>enterRoot(login),'su: Authentication failure','su: Authentication failure')};
C.exit=()=>{if(user=='root'&&rootShell){leaveRoot();P('exit')}else P('logout\n<span class=dim>(this is a browser terminal: there is no session to close)</span>')};
C.logout=C.exit;

// ---------- the main entry point ----------
function post(line){
 if(G)ghook(line);
 if(lesson&&(!err||(M[cur()]&&M[cur()].anyExit))&&M[cur()]&&M[cur()].ok.test(line))finish()}
SH.post=post;
window.run=function(line){
 if(dripping){dq.push(line);return}
 if(mode){
  const mi=MI&&MI.fn===mode?MI:null,t=line.trim();
  P(mi?(mi.mask?`<span class=dim>${esc(mi.prompt)}</span>`:`<span class=dim>${esc(mi.prompt)}</span>${esc(line)}`):`<span class=dim>&gt;</span> ${esc(line)}`);
  if(mi&&mi.keep)return mode(line);
  if(!t&&!(mi&&mi.mask))return;
  return mode(mi&&mi.mask?line:t)}
 P(promptHTML(line));
 line=line.trim();if(!line)return;
 if(/!!/.test(line)&&!/'[^']*!![^']*'/.test(line)){line=line.replace(/!!/g,H[H.length-1]||'');P(esc(line))}
 else if(/^!\d+$/.test(line)){line=H[+line.slice(1)-1]||'';P(esc(line))}
 else if(/^!\w/.test(line)){const w=line.slice(1),f=[...H].reverse().find(h=>h.startsWith(w));if(!f){bad(`bash: ${line}: event not found`);return}line=f;P(esc(line))}
 H.push(line);hi=H.length;err=false;CURLINE=line;
 // classic fork bombs such as :(){ :|:& };:  are refused like a real box that hit its process limit
 if(/([\w:]+)\s*\(\)\s*\{[^}]*\b\1\b[^}]*\|[^}]*\b\1\b[^}]*\}/.test(line)||/:\s*\(\)\s*\{\s*:\s*\|\s*:/.test(line)){
  for(let i=0;i<3;i++)P('<span class=bad>bash: fork: retry: Resource temporarily unavailable</span>');post(line);return}
 BUD.reset();BUD.on=true;
 try{execChain(line,false)}catch(e){BUD.on=false;if(e instanceof Budget)P('<span class=bad>Terminated</span>');else if(e instanceof RangeError)P('<span class=bad>bash: fork: retry: Resource temporarily unavailable</span>');else bad('bash: internal error: '+String(e&&e.message).slice(0,200))}
 BUD.on=false;
 cap=null;stdin=null;window.QUIET=false;
 if(PEND)return;
 post(line)};
})();
