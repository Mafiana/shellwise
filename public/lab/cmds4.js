// cmds4.js - shell builtins, scripting helpers, editors, apt, help/man, fun
(()=>{
'use strict';
const SH=window.SH,ALIAS=SH.ALIAS,INSTALLED=SH.INSTALLED;
const flagsOf=a=>{const s=new Set();a.forEach(x=>{if(/^-[A-Za-z]+$/.test(x))x.slice(1).split('').forEach(c=>s.add(c))});return s};
// ----- environment & builtins -----
C.echo=a=>{let nl=true,e=false;while(a[0]=='-n'||a[0]=='-e'||a[0]=='-ne'||a[0]=='-en'){if(/n/.test(a[0]))nl=false;if(/e/.test(a[0]))e=true;a=a.slice(1)}
 let t=a.join(' ');if(e)t=t.replace(/\\n/g,'\n').replace(/\\t/g,'\t');P(esc(t))};
C.printf=a=>{if(!a.length)return bad('printf: usage: printf [-v var] format [arguments]');let i=0;const args=a.slice(1);
 const out=a[0].replace(/%([sd%])/g,(m,c)=>c=='%'?'%':c=='d'?String(parseInt(args[i++]||'0')||0):(args[i++]||'')).replace(/\\n/g,'\n').replace(/\\t/g,'\t');
 out.split('\n').forEach((l,j,arr)=>{if(j<arr.length-1||l)P(esc(l))})};
C.env=()=>{Object.entries(ENV).forEach(([k,v])=>P(`${k}=${esc(v)}`));P('PWD='+esc(cwd))};
C.printenv=a=>a[0]?(ENV[a[0]]!==undefined?P(esc(ENV[a[0]])):(err=true)):C.env();
C.export=a=>{a.forEach(x=>{const m=x.match(/^(\w+)=(.*)$/);if(m)ENV[m[1]]=m[2]})};
C.set=()=>Object.entries(ENV).forEach(([k,v])=>P(`${k}=${esc(v)}`));
C.unset=a=>a.forEach(k=>delete ENV[k]);
C.alias=a=>{if(!a.length)return Object.entries(ALIAS).forEach(([k,v])=>P(`alias ${k}='${esc(v)}'`));
 a.forEach(x=>{const m=x.match(/^([\w.-]+)=(.*)$/);if(m)ALIAS[m[1]]=m[2];else if(ALIAS[x])P(`alias ${x}='${esc(ALIAS[x])}'`);else bad(`bash: alias: ${x}: not found`)})};
C.unalias=a=>{if(!a.length)return bad('unalias: usage: unalias [-a] name [name ...]');a.forEach(x=>{if(x=='-a')Object.keys(ALIAS).forEach(k=>delete ALIAS[k]);else if(ALIAS[x])delete ALIAS[x];else bad(`bash: unalias: ${x}: not found`)})};
const BUILTIN=['cd','alias','unalias','echo','exit','export','history','jobs','bg','fg','kill','pwd','read','set','source','test','type','umask','unset','printf','['];
C.type=a=>{a.forEach(x=>{if(ALIAS[x])P(`${esc(x)} is aliased to \`${esc(ALIAS[x])}'`);else if(BUILTIN.includes(x))P(`${esc(x)} is a shell builtin`);else if(C[x])P(`${esc(x)} is /usr/bin/${esc(x)}`);else bad(`bash: type: ${x}: not found`)})};
C.which=a=>{a.forEach(x=>{if(C[x]&&!BUILTIN.includes(x))P('/usr/bin/'+esc(x));else err=true})};
C.whereis=a=>a.forEach(x=>P(C[x]?`${esc(x)}: /usr/bin/${esc(x)} /usr/share/man/man1/${esc(x)}.1.gz`:`${esc(x)}:`));
C.history=a=>{if(a.includes('-c')){H.length=0;hi=0;return}const n=+a.find(x=>/^\d+$/.test(x));(n?H.slice(-n):H).forEach((h,i,arr)=>P(String(H.length-arr.length+i+1).padStart(5)+'  '+esc(h)))};
C.true=()=>{};C.false=()=>{err=true};C[':']=()=>{};
C.read=a=>{const v=a.filter(x=>x[0]!='-').pop()||'REPLY',pi=a.indexOf('-p'),pr=pi>=0?a[pi+1]:'';if(pr)P(esc(pr));
 SH.setMode(l=>{ENV[v]=l;mode=null},'');};
C.test=C['[']=C['[[']=a=>{
 a=a.slice();if(a[a.length-1]==']'||a[a.length-1]==']]')a.pop();
 let neg=false;if(a[0]=='!'){neg=true;a.shift()}
 let r=false;const n=a[1]!==undefined&&a.length==2?get(a[1]):null;
 if(a.length==1)r=a[0]!=='';
 else if(a.length==2){const[o,v]=a;r=o=='-z'?v==='':o=='-n'?v!=='':o=='-e'?!!get(v):o=='-f'?!!n&&n.t=='f':o=='-d'?!!n&&n.t=='d':o=='-r'?!!n&&SH.can(n,4):o=='-w'?!!n&&SH.can(n,2):o=='-x'?!!n&&SH.canX(n):false}
 else if(a.length==3){const[x,o,y]=a,nx=+x,ny=+y;r=o=='='||o=='=='?x===y:o=='!='?x!==y:o=='-eq'?nx==ny:o=='-ne'?nx!=ny:o=='-lt'?nx<ny:o=='-le'?nx<=ny:o=='-gt'?nx>ny:o=='-ge'?nx>=ny:false}
 if(r==neg)err=true};
C.expr=a=>{const s=a.join(' ');if(!/^[\d+\-*/%() \s]+$/.test(s.replace(/\\\*/g,'*')))return bad('expr: non-integer argument');try{const v=Math.trunc(Function('return ('+a.join(' ').replace(/\\\*/g,'*')+')')());P(String(v));if(v==0)err=true}catch(e){bad('expr: syntax error')}};
C.bc=a=>{const t=stdin!==null?stdin:'';L(t).forEach(l=>{l=l.replace(/\^/g,'**');if(!/^[\d+\-*/%(). \s]+$/.test(l))return bad('(standard_in) 1: syntax error');try{const v=Function('return ('+l+')')();P(String(Number.isInteger(v)?v:+v.toFixed(4)))}catch(e){bad('(standard_in) 1: syntax error')}})};
C.factor=a=>a.forEach(x=>{let n=+x;if(!(n>1))return bad(`factor: ‘${x}’ is not a valid positive integer`);const f=[];for(let p=2;p*p<=n;p++)while(n%p==0){f.push(p);n/=p}if(n>1)f.push(n);P(`${x}: ${f.join(' ')}`)});
C.yes=a=>{for(let i=0;i<10;i++)P(esc(a.join(' ')||'y'));P('<span class=dim>(yes runs forever; stopped after 10 lines)</span>')};
C.bash=C.sh=C.zsh=a=>{
 const ci=a.indexOf('-c');if(ci>=0)return SH.runScript(a[ci+1]||'',a.slice(ci+2),'bash');
 const f=a.find(x=>x[0]!='-');if(!f){P('<span class=dim>(you are already in a bash shell)</span>');return}
 const n=get(f);if(!n)return bad(`bash: ${f}: No such file or directory`);if(n.t=='d')return bad(`bash: ${f}: Is a directory`);if(!SH.can(n,4))return bad(`bash: ${f}: Permission denied`);
 SH.runScript(n.c,a.slice(a.indexOf(f)+1),f)};
C.source=C['.']=a=>{const n=get(a[0]||'');if(!a[0])return bad('bash: source: filename argument required');if(!n)return bad(`bash: ${a[0]}: No such file or directory`);SH.runScript(n.c,a.slice(1),a[0])};
// ----- tiny text editor (nano / vi / vim) -----
function editor(name){return a=>{
 const f=a.find(x=>x[0]!='-');if(!f)return bad(`${name}: give a file name, e.g. ${name} script.sh`);
 const[p,nm]=par(f);if(!p)return bad(`${name}: ${f}: No such file or directory`);
 const ex=p.c[nm];if(ex&&ex.t=='d')return bad(`${name}: ${f}: Is a directory`);
 if(ex&&!SH.can(ex,4))return bad(`${name}: ${f}: Permission denied`);
 if(!ex&&!SH.can(p,2))return bad(`${name}: ${f}: Permission denied`);
 let buf=ex?L(ex.c):[];
 P(`<span class=hl>── ${name} (simple editor): ${esc(f)} ──</span>`);
 if(buf.length){buf.forEach((l,i)=>P(`<span class=dim>${String(i+1).padStart(3)}</span> ${esc(l)}`))}else P('<span class=dim>(new empty file)</span>');
 P('<span class=dim>Type lines to add them. Commands: :wq save+quit · :q! quit without saving · :p show buffer · :d N delete line N</span>');
 const save=()=>{if(!ex&&!SH.can(p,2))return bad(`${name}: cannot write: Permission denied`);if(ex&&!SH.can(ex,2))return bad(`${name}: ${f}: Permission denied (read-only)`);
  const n=F(buf.join('\n')+(buf.length?'\n':''));if(ex){n.m=ex.m;n.o=ex.o;n.g=ex.g}else Object.assign(n,SH.meta());n.ts=Date.now();p.c[nm]=n;return true};
 SH.setMode(l=>{
  const raw=l;l=l.trim();
  if(l==':wq'||l==':x'||l=='^X'){if(save()){mode=null;P(`<span class=ok>Wrote ${buf.length} lines to ${esc(f)}</span>`)}else mode=null;return}
  if(l==':q!'||l==':q'){mode=null;return P('<span class=dim>Quit without saving.</span>')}
  if(l==':p')return buf.forEach((x,i)=>P(`<span class=dim>${String(i+1).padStart(3)}</span> ${esc(x)}`));
  let m;if((m=l.match(/^:d\s+(\d+)$/))){buf.splice(+m[1]-1,1);return P('<span class=dim>line deleted</span>')}
  buf.push(raw)},`${name}> `,false,true);
}}
C.nano=editor('nano');C.vi=editor('vi');C.vim=editor('vim');C.nvim=C.vim;
// ----- apt -----
const KNOWN=['cowsay','figlet','htop','sl','fortune','cmatrix','lolcat','neovim','nginx','git','vim','tmux','python3','tree','curl','wget','nmap','wireshark','nano','unzip','zip','net-tools','dnsutils','john','hydra'];
SH.KNOWN=KNOWN;
C.apt=C['apt-get']=a=>{
 const s=a[0],pk=a.slice(1).filter(x=>x[0]!='-'),root=SH.user()=='root';
 if(!s)return P('apt 3.0.0 (amd64)\nUsage: apt [options] command\n\nMost used commands:\n  list - list packages based on package names\n  search - search in package descriptions\n  install - install packages\n  remove - remove packages\n  update - update list of available packages\n  upgrade - upgrade the system by installing/upgrading packages');
 if(['update','install','upgrade','remove','full-upgrade','autoremove'].includes(s)&&!root)return bad('E: Could not open lock file /var/lib/apt/lists/lock - open (13: Permission denied)\nE: Unable to lock directory /var/lib/apt/lists/\n(hint: try again with sudo)');
 if(s=='update')return SH.drip(['Get:1 http://http.kali.org/kali kali-rolling InRelease [41.5 kB]','Get:2 http://http.kali.org/kali kali-rolling/main amd64 Packages [20.9 MB]','Fetched 21.0 MB in 3s (7,012 kB/s)','Reading package lists... Done','Building dependency tree... Done','All packages are up to date.'],350);
 if(s=='upgrade'||s=='full-upgrade')return SH.drip(['Reading package lists... Done','Building dependency tree... Done','Calculating upgrade... Done','0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.'],300);
 if(s=='install'){
  if(!pk.length)return bad('E: No packages specified');
  const bd=pk.filter(x=>!KNOWN.includes(x));if(bd.length)return bad(`E: Unable to locate package ${bd[0]}`);
  const L1=['Reading package lists... Done','Building dependency tree... Done','Reading state information... Done'];
  pk.forEach(p=>{if(INSTALLED.has(p)||['tree','curl','wget','nmap','nano','unzip','zip','vim','git','python3','net-tools','dnsutils','john','hydra','wireshark'].includes(p))L1.push(`${p} is already the newest version.`);else L1.push(`The following NEW packages will be installed:\n  ${p}\n0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.\nGet:1 http://http.kali.org/kali kali-rolling/main amd64 ${p} amd64 1.0 [${20+p.length*3} kB]\nSelecting previously unselected package ${p}.\nUnpacking ${p} (1.0) ...\nSetting up ${p} (1.0) ...`);INSTALLED.add(p)});
  return SH.drip(L1,350)}
 if(s=='remove'){pk.forEach(p=>INSTALLED.delete(p));return P('Reading package lists... Done\nRemoving requested packages...')}
 if(s=='list'||s=='search'){const q=pk[0];return P('Listing... Done\n'+KNOWN.filter(k=>!q||k.includes(q)).map(k=>`${esc(k)}/kali-rolling,now 1.0 amd64 [${INSTALLED.has(k)?'installed':'available'}]`).join('\n'))}
 bad(`E: Invalid operation ${s}`)};
C.dpkg=a=>{if(a[0]=='-l')return P('Desired=Unknown/Install/Remove/Purge/Hold\n||/ Name           Version      Architecture Description\n+++-==============-============-============-=================================\nii  bash           5.2.32-1     amd64        GNU Bourne Again SHell\nii  nmap           7.95+dfsg-1  amd64        The Network Mapper\nii  openssh-server 1:9.7p1-7    amd64        secure shell (SSH) server');bad('dpkg: error: need an action option')};
// ----- fun -----
C.cowsay=a=>{if(!INSTALLED.has('cowsay'))return bad("Command 'cowsay' not found, but can be installed with:\nsudo apt install cowsay");const m=a.join(' ')||'Moo';P(esc(' '+'_'.repeat(m.length+2)+'\n< '+m+' >\n '+'-'.repeat(m.length+2)+'\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||'))};
const FORT=['The best way to learn the shell is to use it every day.','There is no place like 127.0.0.1.','Measure twice, rm -r once.','A good hacker reads the manual. A great one reads the logs.','sudo make me a sandwich.','Passwords are like underwear: change them often.','It works on my machine.'];
C.fortune=()=>{if(!INSTALLED.has('fortune'))return bad("Command 'fortune' not found, but can be installed with:\nsudo apt install fortune");P(esc(FORT[Math.floor(Math.random()*FORT.length)]))};
C.sl=()=>{if(!INSTALLED.has('sl'))return bad("Command 'sl' not found, but can be installed with:\nsudo apt install sl");P('      ====        ________                ___________\n  _D _|  |_______/        \\__I_I_____===__|_________|\n   |(_)---  |   H\\________/ |   |        =|___ ___|\n   /     |  |   H  |  |     |   |         ||_| |_||\n  |      |  |   H  |__--------------------| [___] |\n  | ________|___H__/__|_____/[][]~\\_______|       |\n  |/ |   |-----------I_____I [][] []  D   |=======|__')};
C.figlet=a=>{if(!INSTALLED.has('figlet'))return bad("Command 'figlet' not found, but can be installed with:\nsudo apt install figlet");P(esc('*** '+(a.join(' ')||'figlet').toUpperCase()+' ***'))};
C.htop=C.top;
C.neofetch=()=>{const m=done.filter(Boolean).length,c=['#5af78e','#2f8cff','#a78bfa','#ff9f43','#ff6b6b','#f3c969'];
 const L1=['  ┌──────────────┐ ','  │  &gt;_   kali   │ ','  │              │ ','  └──────────────┘ '];
 const info=[`<span class=u>${SH.user()}</span>@<span class=u>kali</span>`,'-----------','<span class=u>OS</span>: Kali GNU/Linux Rolling x86_64','<span class=u>Host</span>: VirtualBox 1.2','<span class=u>Kernel</span>: 6.8.11-amd64','<span class=u>Uptime</span>: 1 hour, 23 mins','<span class=u>Packages</span>: 2784 (dpkg)','<span class=u>Shell</span>: bash 5.2.32','<span class=u>DE</span>: Xfce 4.18','<span class=u>Terminal</span>: web-terminal','<span class=u>CPU</span>: Intel i7-1165G7 (2) @ 2.80GHz','<span class=u>Memory</span>: 1126MiB / 3890MiB','<span class=u>Modules</span>: '+m+'/'+M.length+' complete'];
 info.forEach((t,i)=>P(`<span class=hl>${L1[i]||'                    '}</span>`+t));P('                    '+c.map(x=>`<span style="color:${x}">███</span>`).join(''))};
// ----- help & man -----
SH.usage=c=>{const m=MAN[c];P(`<span class=hl>Usage:</span> ${esc(m[1])}\n${esc(m[0])}`);if(m[2].length){P('\n<span class=hl>Options:</span>');m[2].forEach(([f,d])=>P(`  <span class=ok>${esc(f.padEnd(14))}</span> ${esc(d)}`))}if(m[3].length)P('\n<span class=hl>Examples:</span>\n'+m[3].map(e=>'  '+esc(e)).join('\n'))};
C.man=a=>{
 const c=a.filter(x=>x[0]!='-')[0];if(!c)return bad('What manual page do you want?\nFor example, try \'man man\'.');
 const m=MAN[c];
 if(!m){const mi=modOf(c);if(mi>=0&&C[c])return P(`<span class=hl>${c.toUpperCase()}(1)</span>\n${esc(plain(M[mi].d))}`);return bad(`No manual entry for ${c}`)}
 const W=64,U=c.toUpperCase(),hdr=`${U}(1)`+' '.repeat(W-2*(U.length+3)-18)+'User Commands'+' '.repeat(18)+`${U}(1)`;
 P(`<span class=dim>${esc(hdr)}</span>\n\n<span class=hl>NAME</span>\n       ${esc(c)} - ${esc(m[0])}\n\n<span class=hl>SYNOPSIS</span>\n       ${esc(m[1])}`);
 if(m[2].length){P('\n<span class=hl>OPTIONS</span>');m[2].forEach(([f,d])=>P(`       <span class=ok>${esc(f)}</span>\n              ${esc(d)}`))}
 if(m[3].length)P('\n<span class=hl>EXAMPLES</span>\n'+m[3].map(e=>'       '+esc(e)).join('\n'));
 P(`\n<span class=dim>Shellwise                      ${new Date().toISOString().slice(0,10)}                      ${esc(U)}(1)</span>\n<span class=dim>(end of manual page - this is a short simulated version)</span>`)};
C.whatis=a=>a.forEach(c=>MAN[c]?P(`${esc(c)} (1)`.padEnd(20)+'- '+esc(MAN[c][0])):bad(`${c}: nothing appropriate.`));
C.apropos=a=>{const q=(a[0]||'').toLowerCase();Object.keys(MAN).filter(k=>k.includes(q)||MAN[k][0].includes(q)).forEach(k=>P(`${esc(k)} (1)`.padEnd(20)+'- '+esc(MAN[k][0])))};
const GROUPS=[['Files & folders','ls cd pwd cat head tail less more touch mkdir rmdir rm cp mv ln tree find stat file du df realpath basename dirname mktemp readlink split'],['Text','grep egrep sort uniq wc cut tr rev nl tac awk sed paste column xargs tee shuf diff cmp comm fold expand strings hexdump od base32 cksum'],['Permissions & users','chmod chown chgrp umask id whoami groups who w last lastb users su sudo passwd getent useradd userdel usermod groupadd groupdel chage'],['Processes & services','ps top htop kill pkill pgrep killall jobs bg fg nohup nice pstree lsof systemctl service watch sleep time timeout crontab'],['System info','uname hostname hostnamectl uptime date cal free lscpu lsblk lsusb lspci lsmod mount fdisk lsb_release neofetch timedatectl dmesg journalctl logger env printenv vmstat ulimit locale stty tput reset'],['Network','ifconfig ip route arp ping traceroute nslookup dig host whois curl wget ssh netstat ss nmap nc'],['Archives & hashes','tar gzip gunzip zcat zip unzip base64 xxd md5sum sha1sum sha256sum hashid openssl exiftool'],['Languages (version only)','python3 perl gcc make git node ruby'],['Shell','alias unalias type which history export set unset read test bash source nano vi vim echo printf expr bc factor seq clear man help apt']];
C.help=a=>{
 if(a[0]&&MAN[a[0]])return SH.usage(a[0]);
 P('<span class=hl>Shellwise - quick help</span>');
 GROUPS.forEach(([t,l])=>P(`<span class=ok>${t}</span>\n  ${l.split(' ').filter(c=>C[c]).map(c=>{const m=modOf(c);return lesson&&m>=0&&!done[m]?c+'*':c}).join('  ')}`));
 P('<span class=ok>Games</span>\n  rush  navigate  defuse  logdetective  ctf  guess  hangman  snake  typing  rps  (or open the Games tab)');
 P('\n<span class=dim>Tips: Tab completes · ↑/↓ history · !! repeats the last command · Ctrl+C stops · cmd --help · man cmd · * = locked during a lesson</span>')};
C.games=()=>{P('<span class=hl>Terminal games</span> (more in the Games tab)');P('  rush, navigate, defuse, logdetective, ctf, guess, hangman, snake, typing, rps')};
// ----- /usr/bin listing, banner -----
(()=>{const bin=ROOT.c.usr.c.bin;Object.keys(C).forEach(k=>{if(!BUILTIN.includes(k)&&!bin[k]&&/^[a-z][\w-]*$/.test(k)){const n=Object.assign(F(''),{m:'755',o:'root',g:'root'});n.ts=Date.now()-86400000*20;bin[k]=n}});ROOT.c.bin=bin})();
P('<span class=dim>┏━(Message from Shellwise)</span>');
P('<span class=dim>┃ This is a safe, simulated Kali Linux. Type</span> <b>help</b> <span class=dim>for commands, or open the Modules tab to learn step by step.</span>');
P('<span class=dim>┗━(Tab completes · man &lt;cmd&gt; shows a manual · sudo password: kali)</span>\n');
})();
