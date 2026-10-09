// =====================================================================
// content.js  -  extra data: filesystem, modules, quiz banks, man pages
// Loaded after script.js, before shell.js and ui.js
// =====================================================================
(()=>{
'use strict';

// ---------- tiny hash helpers (shared) ----------
function md5(s){
 const b=new TextEncoder().encode(s),n=b.length,K=new Uint32Array(64),S=[7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21];
 for(let i=0;i<64;i++)K[i]=Math.floor(Math.abs(Math.sin(i+1))*4294967296)>>>0;
 const len=(((n+8)>>6)+1)<<6,m=new Uint8Array(len);m.set(b);m[n]=0x80;
 const dv=new DataView(m.buffer);dv.setUint32(len-8,(n*8)>>>0,true);dv.setUint32(len-4,Math.floor(n*8/4294967296),true);
 let a0=0x67452301,b0=0xefcdab89,c0=0x98badcfe,d0=0x10325476;
 for(let o=0;o<len;o+=64){
  const W=new Uint32Array(16);for(let i=0;i<16;i++)W[i]=dv.getUint32(o+i*4,true);
  let A=a0,B=b0,Cc=c0,D=d0;
  for(let i=0;i<64;i++){let f,g;
   if(i<16){f=(B&Cc)|(~B&D);g=i}else if(i<32){f=(D&B)|(~D&Cc);g=(5*i+1)%16}else if(i<48){f=B^Cc^D;g=(3*i+5)%16}else{f=Cc^(B|~D);g=(7*i)%16}
   f=(f+A+K[i]+W[g])>>>0;A=D;D=Cc;Cc=B;const sh=S[(i>>4)*4+(i&3)];B=(B+((f<<sh)|(f>>>(32-sh))))>>>0}
  a0=(a0+A)>>>0;b0=(b0+B)>>>0;c0=(c0+Cc)>>>0;d0=(d0+D)>>>0}
 const out=new Uint8Array(16),ov=new DataView(out.buffer);[a0,b0,c0,d0].forEach((v,i)=>ov.setUint32(i*4,v,true));
 return[...out].map(x=>x.toString(16).padStart(2,'0')).join('')}
function sha256(s){
 const b=new TextEncoder().encode(s),n=b.length,pr=[];for(let p=2;pr.length<64;p++)if(pr.every(q=>p%q))pr.push(p);
 const fr=x=>Math.floor((x-Math.floor(x))*4294967296)>>>0,K=pr.map(p=>fr(Math.cbrt(p)));
 let H=pr.slice(0,8).map(p=>fr(Math.sqrt(p)));
 const len=(((n+8)>>6)+1)<<6,m=new Uint8Array(len);m.set(b);m[n]=0x80;
 const dv=new DataView(m.buffer);dv.setUint32(len-4,(n*8)>>>0);dv.setUint32(len-8,Math.floor(n*8/4294967296));
 const R=(x,k)=>(x>>>k)|(x<<(32-k));
 for(let o=0;o<len;o+=64){
  const w=new Uint32Array(64);for(let i=0;i<16;i++)w[i]=dv.getUint32(o+i*4);
  for(let i=16;i<64;i++){const s0=R(w[i-15],7)^R(w[i-15],18)^(w[i-15]>>>3),s1=R(w[i-2],17)^R(w[i-2],19)^(w[i-2]>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)>>>0}
  let[a,bb,c,d,e,f,g,h]=H;
  for(let i=0;i<64;i++){const S1=R(e,6)^R(e,11)^R(e,25),ch=(e&f)^(~e&g),t1=(h+S1+ch+K[i]+w[i])>>>0,S0=R(a,2)^R(a,13)^R(a,22),mj=(a&bb)^(a&c)^(bb&c),t2=(S0+mj)>>>0;
   h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=bb;bb=a;a=(t1+t2)>>>0}
  H=[a,bb,c,d,e,f,g,h].map((v,i)=>(H[i]+v)>>>0)}
 return H.map(x=>x.toString(16).padStart(8,'0')).join('')}
function sha1(s){
 const b=new TextEncoder().encode(s),n=b.length,len=(((n+8)>>6)+1)<<6,m=new Uint8Array(len);m.set(b);m[n]=0x80;
 const dv=new DataView(m.buffer);dv.setUint32(len-4,(n*8)>>>0);dv.setUint32(len-8,Math.floor(n*8/4294967296));
 let h0=0x67452301,h1=0xEFCDAB89,h2=0x98BADCFE,h3=0x10325476,h4=0xC3D2E1F0;const L=(x,k)=>(x<<k)|(x>>>(32-k));
 for(let o=0;o<len;o+=64){const w=new Uint32Array(80);for(let i=0;i<16;i++)w[i]=dv.getUint32(o+i*4);for(let i=16;i<80;i++)w[i]=L(w[i-3]^w[i-8]^w[i-14]^w[i-16],1);
  let a=h0,bb=h1,c=h2,d=h3,e=h4;
  for(let i=0;i<80;i++){let f,k;if(i<20){f=(bb&c)|(~bb&d);k=0x5A827999}else if(i<40){f=bb^c^d;k=0x6ED9EBA1}else if(i<60){f=(bb&c)|(bb&d)|(c&d);k=0x8F1BBCDC}else{f=bb^c^d;k=0xCA62C1D6}
   const t=(L(a,5)+f+e+k+w[i])>>>0;e=d;d=c;c=L(bb,30)>>>0;bb=a;a=t}
  h0=(h0+a)>>>0;h1=(h1+bb)>>>0;h2=(h2+c)>>>0;h3=(h3+d)>>>0;h4=(h4+e)>>>0}
 return[h0,h1,h2,h3,h4].map(x=>x.toString(16).padStart(8,'0')).join('')}
window.HASH={md5,sha256,sha1};

// ---------- filesystem additions ----------
const Fm=(c,m,o,g)=>{const n=F(c);if(m)n.m=m;if(o)n.o=o;if(g)n.g=g;return n};
const Dm=(c,m,o,g)=>{const n=D(c);if(m)n.m=m;if(o)n.o=o;if(g)n.g=g;return n};
let seed=20261003;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1)),pk=a=>a[Math.floor(rnd()*a.length)];
const pad=n=>String(n).padStart(2,'0');

// auth.log : one very loud attacker (203.0.113.45) in the documentation IP range
const authLog=(()=>{const L=[],users=['root','admin','test','oracle','ubuntu','pi'],noise=['198.51.100.7','192.0.2.88','10.0.2.2'];
 let t=2*3600+10*60;const stamp=()=>{t+=ri(2,40);return`Oct  3 ${pad(Math.floor(t/3600))}:${pad(Math.floor(t%3600/60))}:${pad(t%60)}`};
 const row=()=>{const r=rnd();
  if(r<.5)return`${stamp()} kali sshd[${ri(1400,1500)}]: Failed password for ${pk(users)} from 203.0.113.45 port ${ri(40000,60000)} ssh2`;
  if(r<.58)return`${stamp()} kali sshd[${ri(1400,1500)}]: Failed password for invalid user ${pk(['guest','test','postgres','git'])} from 203.0.113.45 port ${ri(40000,60000)} ssh2`;
  if(r<.7)return`${stamp()} kali sshd[${ri(1400,1500)}]: Failed password for ${pk(['kali','root'])} from ${pk(noise.slice(0,2))} port ${ri(40000,60000)} ssh2`;
  if(r<.82)return`${stamp()} kali sshd[${ri(1400,1500)}]: Accepted password for kali from 10.0.2.2 port ${ri(40000,60000)} ssh2`;
  if(r<.92)return`${stamp()} kali CRON[${ri(2000,2400)}]: pam_unix(cron:session): session opened for user root(uid=0) by (uid=0)`;
  return`${stamp()} kali sudo:     kali : TTY=pts/0 ; PWD=/home/kali ; USER=root ; COMMAND=/usr/bin/apt update`};
 for(let i=0;i<70;i++)L.push(row());
 L.splice(61,0,`${stamp()} kali sshd[1498]: Accepted password for root from 203.0.113.45 port 52211 ssh2`,`${stamp()} kali sshd[1498]: pam_unix(sshd:session): session opened for user root(uid=0) by (uid=0)`);
 return L.join('\n')+'\n'})();
const accessLog=(()=>{const L=[],ips=['10.0.2.2','10.0.2.2','198.51.100.7','192.0.2.88'],pg=['/','/index.html','/about.html','/contact.html','/images/logo.png','/css/style.css'];
 let t=2*3600;const st=()=>{t+=ri(5,90);return`[03/Oct/2026:${pad(Math.floor(t/3600))}:${pad(Math.floor(t%3600/60))}:${pad(t%60)} +0100]`};
 for(let i=0;i<34;i++){const r=rnd();
  if(r<.12)L.push(`203.0.113.45 - - ${st()} "GET ${pk(['/admin','/login.php','/wp-login.php','/phpmyadmin/'])} HTTP/1.1" ${pk([403,404,404])} 287 "-" "sqlmap/1.8"`);
  else if(r<.2)L.push(`${pk(ips)} - - ${st()} "GET ${pk(['/old-page.html','/missing.png'])} HTTP/1.1" 404 273 "-" "Mozilla/5.0"`);
  else L.push(`${pk(ips)} - - ${st()} "GET ${pk(pg)} HTTP/1.1" 200 ${ri(300,12000)} "-" "Mozilla/5.0 (X11; Linux x86_64) Firefox/128.0"`)}
 return L.join('\n')+'\n'})();
const syslog=(()=>{const L=[],msgs=['systemd[1]: Started Session 3 of User kali.','NetworkManager[612]: <info> device (eth0): state change: activated','CRON[2201]: (root) CMD (command -v debian-sa1 > /dev/null && debian-sa1 1 1)','systemd[1]: Starting Daily apt download activities...','systemd[1]: apt-daily.service: Deactivated successfully.','kernel: [UFW BLOCK] IN=eth0 OUT= SRC=203.0.113.45 DST=10.0.2.15 PROTO=TCP DPT=22','rsyslogd: [origin software="rsyslogd"] rsyslogd was HUPed','dbus-daemon[540]: [system] Activating via systemd: service name=\'org.freedesktop.PackageKit\'','systemd-logind[598]: New session 3 of user kali.','polkitd[601]: Registered Authentication Agent for unix-session:3'];
 let t=1*3600+5*60;for(let i=0;i<36;i++){t+=ri(20,300);L.push(`Oct  3 ${pad(Math.floor(t/3600))}:${pad(Math.floor(t%3600/60))}:${pad(t%60)} kali ${pk(msgs)}`)}return L.join('\n')+'\n'})();

const pw=['password','123456','password123','letmein','qwerty','abc123','iloveyou','admin','welcome','monkey','dragon','sunshine','football','kali','toor','master','login','princess','trustno1','shadow'];
const common=['admin','login','images','css','js','uploads','backup','config','test','server-status','wp-admin','cgi-bin','api','assets','static','private','old','dev'];

(()=>{
 const K=ROOT.c.home.c.kali.c,E=ROOT.c.etc.c;
 K['hello.sh']=Fm('#!/bin/bash\n# my first script\nname="Kali"\necho "Hello from $name!"\nfor i in 1 2 3; do\n  echo "Count: $i"\ndone\n');
 K['hashes.txt']=F(['password','123456','password123','letmein'].map((p,i)=>['user1','user2','user3','admin'][i]+':'+md5(p)).join('\n')+'\n');
 K.Documents.c['report.txt']=F('Quarterly report\n================\nSales: up 12%\nBugs: down 30%\nCoffee: up 400%\n');
 K.Documents.c['ideas.txt']=F('build a portfolio site\nlearn nmap\nwrite a bash script\nset up a home lab\njoin a CTF\n');
 K.Downloads.c['readme.md']=F('# Downloads\nFiles you download will land here.\n');
 K.Desktop.c['welcome.txt']=F('Welcome to Shellwise!\nOpen the Modules tab to start learning.\n');
 K['ports.csv']=F('service,port,protocol\nssh,22,tcp\nhttp,80,tcp\nhttps,443,tcp\ndns,53,udp\nftp,21,tcp\nsmtp,25,tcp\n');
 K['.bash_history']=F('ls\ncd Documents\ncat todo.txt\nnmap 127.0.0.1\n');
 E['os-release']=F('PRETTY_NAME="Kali GNU/Linux Rolling"\nNAME="Kali GNU/Linux"\nVERSION_ID="2025.3"\nVERSION="2025.3"\nVERSION_CODENAME=kali-rolling\nID=kali\nID_LIKE=debian\nHOME_URL="https://www.kali.org/"\nSUPPORT_URL="https://forums.kali.org/"\nBUG_REPORT_URL="https://bugs.kali.org/"\n');
 E['hosts']=F('127.0.0.1\tlocalhost\n127.0.1.1\tkali\n::1\t\tlocalhost ip6-localhost ip6-loopback\nff02::1\t\tip6-allnodes\nff02::2\t\tip6-allrouters\n');
 E['resolv.conf']=F('# Generated by NetworkManager\nnameserver 10.0.2.3\n');
 E['issue']=F('Kali GNU/Linux Rolling \\n \\l\n');
 E['group']=F('root:x:0:\nadm:x:4:kali\nsudo:x:27:kali\nusers:x:100:\nkali:x:1000:\nwireshark:x:119:kali\n');
 E['shadow']=Fm('root:$y$j9T$9sZk3$kQw1x7:19800:0:99999:7:::\nkali:$y$j9T$a1Bc4$Zp0t9m:19800:0:99999:7:::\n','640','root','shadow');
 E['fstab']=F('# <file system> <mount point> <type> <options> <dump> <pass>\nUUID=3b2f-77a1 / ext4 errors=remount-ro 0 1\nUUID=91c0-12de none swap sw 0 0\n');
 E['passwd']=F('root:x:0:0:root:/root:/usr/bin/zsh\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nsshd:x:104:65534::/run/sshd:/usr/sbin/nologin\nkali:x:1000:1000:Kali,,,:/home/kali:/usr/bin/zsh\n');
 E['ssh']=D({'sshd_config':F('Port 22\nPermitRootLogin prohibit-password\nPasswordAuthentication yes\nX11Forwarding yes\nSubsystem sftp /usr/lib/openssh/sftp-server\n')});
 E['apt']=D({'sources.list':F('deb http://http.kali.org/kali kali-rolling main contrib non-free non-free-firmware\n')});
 E['motd']=F('');
 ROOT.c.var=D({log:D({'auth.log':Fm(authLog,'640','root','adm'),'syslog':Fm(syslog,'640','root','adm'),'dpkg.log':Fm('2026-10-02 18:21:07 status installed nmap:amd64 7.95+dfsg-1kali1\n2026-10-02 18:21:09 status installed nikto:all 1:2.5.0+git20230114-1kali1\n2026-10-02 18:22:40 status installed gobuster:amd64 3.6.0-0kali1\n','644','root','root'),'apache2':D({'access.log':Fm(accessLog,'640','root','adm'),'error.log':Fm('[Sat Oct 03 02:00:11.123456 2026] [mpm_prefork:notice] [pid 812] AH00163: Apache/2.4.62 (Debian) configured\n','640','root','adm')},'750','root','adm')}),www:D({html:D({'index.html':F('<html><body><h1>It works!</h1></body></html>\n')})}),tmp:D({}),lib:D({})});
 ROOT.c.root=Dm({'.bashrc':F('# root bashrc\n'),'flag.txt':Fm('flag{root_access_unlocked}\n','600','root','root'),'notes.txt':Fm('Only root can read this folder.\n','600','root','root')},'700','root','root');
 ROOT.c.usr.c.share=D({wordlists:D({'rockyou.txt':F(pw.join('\n')+'\n'),'README':F('Small lab wordlists. The real rockyou.txt has 14 million entries.\n'),dirb:D({'common.txt':F(common.join('\n')+'\n')})})});
 ROOT.c.usr.c.sbin=D({});
 ['boot','dev','lib','media','mnt','opt','proc','run','srv','sys'].forEach(k=>ROOT.c[k]=D({}));
 ROOT.c.dev.c['null']=Fm('','666');ROOT.c.dev.c['zero']=Fm('','666');ROOT.c.dev.c['tty']=Fm('','666');
 ROOT.c.proc.c['cpuinfo']=F('processor\t: 0\nvendor_id\t: GenuineIntel\nmodel name\t: Intel(R) Core(TM) i7-1165G7 @ 2.80GHz\ncpu MHz\t\t: 2803.200\ncache size\t: 12288 KB\ncpu cores\t: 2\n\nprocessor\t: 1\nvendor_id\t: GenuineIntel\nmodel name\t: Intel(R) Core(TM) i7-1165G7 @ 2.80GHz\ncpu MHz\t\t: 2803.200\ncache size\t: 12288 KB\ncpu cores\t: 2\n');
 ROOT.c.proc.c['meminfo']=F('MemTotal:        3984000 kB\nMemFree:         1990000 kB\nMemAvailable:    2830000 kB\nBuffers:           84120 kB\nCached:           820000 kB\nSwapTotal:       1048572 kB\nSwapFree:        1048572 kB\n');
 ROOT.c.proc.c['version']=F('Linux version 6.8.11-amd64 (devel@kali.org) (gcc-13 (Debian 13.2.0-25) 13.2.0) #1 SMP PREEMPT_DYNAMIC Kali 6.8.11-1kali2 (2024-05-30)\n');
 ROOT.c.proc.c['uptime']=F('4983.21 9812.44\n');
 // owners: everything is root-owned except the user's home and /tmp
 const setOwn=(n,o,g,force)=>{if(force||!n.o){n.o=o;n.g=n.g&&!force?n.g:(g||o)}if(n.t=='d')Object.values(n.c).forEach(x=>setOwn(x,n.o,n.g,false))};
 ROOT.o='root';ROOT.g='root';
 Object.keys(ROOT.c).forEach(k=>{if(k=='home'||k=='tmp')return;setOwn(ROOT.c[k],'root','root',false)});
 ROOT.c.home.o='root';ROOT.c.home.g='root';
 setOwn(ROOT.c.home.c.kali,'kali','kali',true);
 ROOT.c.tmp.o='root';ROOT.c.tmp.g='root';ROOT.c.tmp.m='777';
 // fake modification times (days ago, stable per name)
 const hash=s=>{let x=7;for(const c of s)x=(x*31+c.charCodeAt(0))>>>0;return x};
 const stamp=(n,name)=>{n.ts=Date.now()-(2+hash(name)%40)*86400000-hash(name+'t')%86400000;if(n.t=='d')Object.entries(n.c).forEach(([k,v])=>stamp(v,k))};
 stamp(ROOT,'/');
})();

// ---------- modules ----------
const I=(h)=>h;
M.push(
{n:'Text power tools',c:['awk','sed','xargs','paste','column','tac','shuf'],d:I("<span class=hl>sed 's/old/new/' file</span> replaces text, <span class=hl>awk '{print $1}'</span> prints a column, <span class=hl>tac</span> prints a file upside down, <span class=hl>column -t</span> lines text up in a table and <span class=hl>xargs</span> turns input into arguments."),t:"Type: sed 's/kali/hacker/' notes.txt",ok:/^sed\s+['"]s\/kali\/\w+\/g?['"]\s+\S*notes\.txt$/},
{n:'Users and permissions',c:['groups','who','w','last','umask','chgrp','getent','users','lastlog'],d:I("Every file has three permission sets: owner, group and others. Each can have read (r=4), write (w=2) and execute (x=1). <span class=hl>chmod 600 file</span> means owner read+write, nobody else. <span class=hl>ls -l</span> shows permissions and <span class=hl>groups</span> shows which groups you belong to."),t:'Type: chmod 600 secret.txt',ok:/^chmod\s+600\s+\S*secret\.txt$/},
{n:'Processes and services',c:['pgrep','pkill','jobs','bg','fg','systemctl','service','lsof','nohup','nice','pstree','killall'],d:I("Programs run as processes. <span class=hl>ps aux</span> lists them, <span class=hl>kill PID</span> stops one, and adding <span class=hl>&amp;</span> runs a command in the background. Services such as SSH are managed with <span class=hl>systemctl status|start|stop ssh</span>."),t:'Type: systemctl status ssh',ok:/^(sudo\s+)?systemctl\s+status\s+\w+(\.service)?$/},
{n:'Disks and hardware',c:['lsblk','lscpu','lspci','lsusb','mount','lsmod','lsb_release','hostnamectl','fdisk','nproc','arch','timedatectl'],d:I("<span class=hl>lsblk</span> shows disks and partitions, <span class=hl>lscpu</span> the processor, <span class=hl>lsusb</span> and <span class=hl>lspci</span> attached devices, <span class=hl>mount</span> mounted filesystems and <span class=hl>lsb_release -a</span> the OS version."),t:'Type: lsblk',ok:/^lsblk$/},
{n:'Archives and compression',c:['tar','gzip','gunzip','zip','unzip','zcat'],d:I("<span class=hl>tar -czf out.tar.gz folder</span> packs and compresses (c=create, z=gzip, f=file). <span class=hl>tar -xzf out.tar.gz</span> extracts, <span class=hl>tar -tf</span> lists. <span class=hl>zip</span> and <span class=hl>unzip</span> do the same for .zip files."),t:'Type: tar -czf docs.tar.gz Documents',ok:/^tar\s+-?\w*c\w*f\s+\S+\s+\S+/},
{n:'Shell scripting',c:['alias','unalias','type','expr','bc','printf','test','bash','sh','source','nano','vi','vim','read'],d:I("A script is a text file of commands. Edit it with <span class=hl>nano file</span>, make it runnable with <span class=hl>chmod +x</span>, then run <span class=hl>bash file</span> or <span class=hl>./file</span>. Use <span class=hl>alias ll='ls -la'</span> for shortcuts and loops like <span class=hl>for i in 1 2 3; do echo $i; done</span>."),t:'Type: bash hello.sh',ok:/^(bash|sh)\s+\S*hello\.sh$/},
{n:'Logs and investigation',c:['journalctl','dmesg','lastb','logger','md5sum'],d:I("Logs tell the story of a system. <span class=hl>/var/log/auth.log</span> records logins, <span class=hl>journalctl</span> reads the system journal, <span class=hl>lastb</span> lists failed logins and <span class=hl>md5sum</span> checks that a file has not changed. Combine <span class=hl>grep</span>, <span class=hl>sort</span> and <span class=hl>uniq -c</span> to spot attackers."),t:'Type: grep Failed /var/log/auth.log',ok:/^grep\s+(-\w+\s+)?Failed\s+\/var\/log\/auth\.log$/},
{n:'Security essentials',c:['hashid','openssl','exiftool','nc'],d:I("Defenders check things constantly. <span class=hl>hashid</span> tells you what kind of hash you are looking at (and why MD5 is weak), <span class=hl>openssl</span> hashes files and makes random keys, <span class=hl>exiftool</span> reads file metadata and <span class=hl>nc -zv 127.0.0.1 22</span> checks whether a port on your own machine is open. <b>Only test systems you own or have written permission to test.</b>"),t:'Type: hashid 5f4dcc3b5aa765d61d8327deb882cf99',ok:/^hashid\s+[a-fA-F0-9]{32,128}$/}
);

// icon + level for each module card
window.MI=[['📍','Beginner'],['👀','Beginner'],['🧭','Beginner'],['📖','Beginner'],['🛠️','Beginner'],['📦','Beginner'],['🔎','Beginner'],['🪪','Beginner'],['🌐','Beginner'],['✨','Beginner'],
 ['🕵️','Intermediate'],['🔗','Intermediate'],['📊','Intermediate'],['🗂️','Intermediate'],['📡','Intermediate'],['🔑','Intermediate'],['📥','Intermediate'],['✂️','Intermediate'],['🔐','Intermediate'],
 ['⚙️','Advanced'],['💽','Advanced'],['🗜️','Advanced'],['📜','Advanced'],['🔍','Advanced'],['🛡️','Advanced']];

// ---------- more quiz questions for existing modules (same index as M) ----------
const add=(i,...qs)=>{(Q[i]=Q[i]||[]).push(...qs)};
add(0,['What does the "p" in pwd stand for?','print','program','path'],['Which directory is the default home folder on Kali?','/home/kali','/root/kali','/usr/kali'],['What does the path "/" mean?','The root of the filesystem','Your home folder','The trash']);
add(1,['Which command lists files with sizes and dates?','ls -l','ls -a','ls -x'],['Hidden files start with...','A dot (.)','An underscore','A tilde'],['What does ls -t sort by?','Modification time','File type','Owner']);
add(2,['What does cd - do?','Returns to the previous folder','Goes up two folders','Lists folders'],['What does a path starting with / mean?','It is absolute, starting at the root','It is relative to here','It is hidden'],['What does . mean in a path?','The current folder','The parent folder','Your home']);
add(3,['Which command shows the last lines of a file?','tail','head','nl'],['What does cat -n do?','Numbers each line','Counts words','Sorts lines'],['Which command counts words?','wc -w','wc -l','head -w']);
add(4,['What does mkdir -p a/b/c do?','Creates nested folders','Prints a path','Protects a folder'],['What does echo hi > f.txt do?','Writes hi into f.txt, replacing it','Appends hi to f.txt','Prints hi twice'],['Which command makes an empty file?','touch','mkdir','new']);
add(5,['What does cp -r do?','Copies folders recursively','Renames files','Removes files'],['Which command moves AND renames?','mv','cp','ren'],['What does rm -r do?','Removes a folder and its contents','Reads a file','Restores a file']);
add(6,['What does grep -v do?','Shows lines that do NOT match','Prints the version','Verifies the file'],['What does sort -r do?','Reverses the order','Removes duplicates','Reads a file'],['Which command removes adjacent duplicate lines?','uniq','tac','cut']);
add(7,['What does id show?','Your user and group IDs','Your IP address','Disk space'],['Which command prints the hostname?','hostname','date','who'],['What does date show?','Current date and time','File dates','Only the year']);
add(8,['What does ping measure?','Whether a host replies and how fast','Open ports','File size'],['What does nmap -p 22 host check?','Whether port 22 is open','The ping time','The SSH password'],['When is scanning with nmap acceptable?','Only on systems you own or may test','Any public server','Only at night']);
add(9,['What does neofetch show?','System information','Network speed','Folder sizes'],['What does history -c do?','Clears your command history','Copies history','Counts commands'],['Which key recalls the previous command?','Up arrow','Tab','Esc']);
add(10,['What does chmod +x file do?','Makes the file executable','Deletes it','Hides it'],['What does ps show?','Running processes','Installed packages','Passwords'],['What does which ls show?','Where the ls program lives','Which files exist','Your location']);
add(11,['What does cut -d: -f1 do?','Prints the first colon-separated field','Cuts the file in half','Deletes colons'],['What does tee do?','Writes output to a file and the screen','Types text','Truncates a file'],['What happens to an existing file with > ?','It is overwritten','Text is appended','The command fails']);
add(12,['Which command shows memory usage?','free','du','env'],['What does du -sh dir show?','Total size of a folder','Free disk space','Open files'],['Which command shows live running tasks?','top','cal','seq']);
add(13,['What does ln create?','A link to a file','A copy','A folder'],['What does realpath do?','Prints the full absolute path','Finds a file','Checks the network'],['What does file report?','The type of a file','The owner','Only its size']);
add(14,['Which command looks up DNS records?','dig','traceroute','ssh'],['What does traceroute show?','The hops to a host','Open ports','File routes'],['What does ssh do?','Opens a secure remote shell','Scans ports','Shares files']);
add(15,['Is base64 encryption?','No, it is only encoding','Yes, strong encryption','Yes, but weak'],['What does xxd show?','Bytes in hexadecimal','Free memory','DNS records'],['Why do systems store password hashes?','To avoid keeping the real password','To make logins faster','To compress data']);
add(16,['What does apt update do?','Refreshes the package lists','Upgrades the kernel','Deletes packages'],['What does su do?','Switches to another user','Shows users','Creates users'],['Why must you use sudo carefully?','It runs commands with admin power','It slows the system','It logs you out']);
Q.push(
[['What does sed s/a/b/ do?','Replaces the first a with b on each line','Deletes every a','Counts the a letters'],['Which command prints the 2nd column of a file?',"awk '{print $2}'",'cut -d2','sed 2'],['What does tac do?','Prints lines in reverse order','Compresses a file','Translates text'],['What does column -t do?','Lines text up into a table','Cuts a column','Counts columns'],['What does xargs do?','Turns input into command arguments','Runs a command twice','Lists archives']],
[['What does chmod 755 mean?','Owner rwx, group and others r-x','Everyone can write','Only the owner can read'],['In rwx, what number is w?','2','1','4'],['Which command shows your groups?','groups','who','last'],['What does umask control?','Default permissions of new files','The network mask','Memory size'],['Which command shows who is logged in?','who','id','cat']],
[['Which command manages system services?','systemctl','jobs','nice'],['What does kill 1234 do?','Sends a terminate signal to process 1234','Deletes file 1234','Shows process 1234'],['What does adding & to a command do?','Runs it in the background','Runs it as admin','Repeats it'],['What does pgrep ssh do?','Finds process IDs by name','Starts ssh','Scans ports'],['Which command shows background jobs?','jobs','lsof','nice']],
[['Which command lists disks and partitions?','lsblk','lsusb','lscpu'],['Which command shows CPU details?','lscpu','lspci','mount'],['What does lsusb list?','USB devices','Users','Services'],['What does mount show?','Mounted filesystems','Memory use','Open ports'],['Which command shows the OS release info?','lsb_release -a','ls -a','free -a']],
[['What does tar -czf do?','Creates a gzip-compressed archive','Extracts an archive','Lists an archive'],['Which tar flag extracts an archive?','x','c','t'],['What does gzip file do?','Compresses it into file.gz','Encrypts it','Copies it'],['Which command unpacks a .zip?','unzip','untar','gunzip'],['What does tar -tf archive.tar do?','Lists the archive contents','Tests the network','Truncates the file']],
[['What does alias ll="ls -la" do?','Makes ll a shortcut for ls -la','Deletes ll','Lists all aliases'],['What does chmod +x script.sh allow?','Running ./script.sh','Editing it','Deleting it'],['What does the first line #!/bin/bash do?','Names the interpreter for the script','Comments the script out','Makes it faster'],['What does $? hold?','The exit status of the last command','The process ID','The current folder'],['What does for i in 1 2 3; do echo $i; done print?','1, 2 and 3 on separate lines','Only 3','Nothing']],
[['Which file records login attempts on Kali/Debian?','/var/log/auth.log','/etc/hosts','/tmp/log'],['What does lastb show?','Failed login attempts','Last boot time','Last backup'],['What does md5sum help check?','File integrity','Disk space','Network speed'],['Which command prints kernel messages?','dmesg','logger','uptime'],['One IP with hundreds of "Failed password" lines usually means...','A brute-force attempt','A backup job','A software update']],
[['What does hashid do?','Guesses the type of a hash','Reverses a hash','Creates a hash'],['Why is MD5 a poor choice for storing passwords?','It is fast and has known weaknesses','It is too slow','It needs a license'],['What does nc -zv 127.0.0.1 22 check?','Whether port 22 is open on your own machine','The ping time','Your password'],['What does openssl dgst -sha256 file produce?','A SHA-256 hash of the file','An encrypted copy','A zip archive'],['What must you have before testing a system?','Permission from the owner','A fast computer','A VPN']]
);

// ---------- topic quizzes (always unlocked) ----------
window.TQ=[
{id:'t-sec',t:'Security Fundamentals',ic:'🛡️',d:'CIA triad, least privilege, MFA and the basics every defender knows.',qs:[
['What does the CIA triad stand for?','Confidentiality, Integrity, Availability','Control, Inspect, Authorize','Crypto, Identity, Access'],
['Which principle gives users only the access they need?','Least privilege','Defense in depth','Security by obscurity'],
['What is a vulnerability?','A weakness that could be exploited','A type of firewall','A backup copy'],
['What does MFA add to a login?','An extra proof of identity','A faster login','A longer password limit'],
['What is a zero-day?','A flaw with no fix available yet','A virus that deletes in 0 days','A free antivirus'],
['What is the goal of a penetration test?','Find weaknesses with permission before attackers do','Steal data quietly','Speed up the network'],
['What does a firewall do?','Filters network traffic by rules','Encrypts the disk','Removes viruses by hand'],
['What is the best way to store passwords?','As salted hashes','In plain text','As base64']]},
{id:'t-net',t:'Networking Essentials',ic:'🌐',d:'Ports, protocols, DNS and the layers underneath every connection.',qs:[
['Which port does HTTPS use by default?','443','80','22'],
['What does DNS do?','Translates names into IP addresses','Encrypts traffic','Assigns MAC addresses'],
['Which port does SSH use?','22','23','25'],
['What does DHCP do?','Hands out IP addresses automatically','Blocks ports','Stores web pages'],
['Which protocol is connectionless?','UDP','TCP','HTTPS'],
['What is the loopback address?','127.0.0.1','192.168.0.1','10.0.0.0'],
['How does a TCP handshake start?','With a SYN packet','With an ACK packet','With a FIN packet'],
['Which OSI layer does IP belong to?','Network (3)','Transport (4)','Application (7)']]},
{id:'t-web',t:'Web Security (OWASP)',ic:'🕸️',d:'Injection, XSS, CSRF and how web apps get broken and fixed.',qs:[
['What is SQL injection?','Crafted input that changes a database query','Overloading a server with traffic','Guessing passwords'],
['What does XSS let an attacker do?',"Run script in another user's browser",'Read the server disk','Reset the router'],
['What is CSRF?',"Tricking a logged-in user's browser into sending a request",'A kind of DDoS','A password hash'],
['Which fix stops most SQL injection?','Parameterized queries','Longer URLs','Hiding the login page'],
['What does HTTPS protect against?','Eavesdropping on traffic in transit','Weak passwords','SQL injection'],
['What is IDOR?',"Reading other users' data by changing an ID",'A firewall rule','A hashing mode'],
['Which tool is often used to intercept and edit web requests?','Burp Suite','Nano','Tar'],
['What does the OWASP Top 10 list?','The most critical web app risks','The ten most common passwords','The ten best antivirus tools']]},
{id:'t-crypto',t:'Cryptography Basics',ic:'🔐',d:'Hashes, keys, salts and why MD5 is retired.',qs:[
['Which of these is a hashing algorithm?','SHA-256','AES','RSA'],
['What is symmetric encryption?','One shared key encrypts and decrypts','Two different keys','No key at all'],
['What is salting?','Adding random data before hashing','Encrypting twice','Compressing a hash'],
['Which is an asymmetric algorithm?','RSA','AES','MD5'],
['Why is MD5 unsuitable for passwords?','It is fast and has collisions','It is too slow','It needs a license'],
['What does a digital signature prove?','Who signed it and that it was not changed','That it is encrypted','That it is virus free'],
['What does TLS do?','Encrypts data between client and server','Scans for malware','Assigns IP addresses'],
['Can a good hash be reversed to the original?','No, it is one-way','Yes, with the key','Yes, with the salt']]},
{id:'t-tools',t:'Kali Tools Trivia',ic:'🐉',d:'Match the tool to the job: Nmap, Wireshark, Burp, John and friends.',qs:[
['Which tool maps open ports?','Nmap','Wireshark','John'],
['Which tool captures and inspects packets?','Wireshark','Nikto','Hashcat'],
['Which tool is a proxy for testing web apps?','Burp Suite','Gobuster','Netcat'],
['Which tool cracks password hashes offline?','John the Ripper','WhatWeb','Ping'],
['Which framework runs exploit modules?','Metasploit','Tar','Nano'],
['What does Aircrack-ng target?','Wi-Fi security','Databases','Email'],
['Which tool finds hidden web directories?','Gobuster','Tcpdump','Ping'],
['What is Kali Linux based on?','Debian','Arch','Windows']]},
{id:'t-social',t:'Social Engineering',ic:'🎣',d:'Phishing, pretexting and the human side of security.',qs:[
['What is phishing?','Tricking people with fake messages to steal info','Scanning ports','Cracking hashes'],
['Which is a red flag in an email?','Urgent demand plus a mismatched link','A known sender and a clear subject','A normal signature'],
['What is vishing?','Phishing by voice call','Phishing by SMS','Phishing by QR code'],
['What is pretexting?','Inventing a believable story to gain trust','Sending malware','Deleting logs'],
['Best response to a suspicious link?','Do not click it; report it','Click to check','Forward it to friends'],
['What is tailgating?','Following someone through a secured door','A slow network','Copying a disk'],
['What is smishing?','Phishing by SMS','Phishing by phone call','A type of DDoS'],
['Why do password managers help?','Unique strong passwords for every site','They replace MFA','They speed up Wi-Fi']]},
{id:'t-linux',t:'Linux Master Review',ic:'🐧',d:'Filesystem layout, root, pipes and permissions in one mixed round.',qs:[
['Which folder holds system config files?','/etc','/tmp','/dev'],
['Where are logs usually stored?','/var/log','/bin','/home'],
['Which user has full control of the system?','root','kali','guest'],
['What does ~ mean?','Your home directory','The root','A hidden file'],
['Which command opens the manual for a command?','man','doc','guide'],
['What does the | symbol do?','Pipes output into another command','Comments a line','Ends a command'],
['What does chmod 777 do?','Gives everyone full permissions','Locks the file','Deletes it'],
['Which folder holds temporary files?','/tmp','/opt','/boot']]}
];

// ---------- extra Command Rush challenges for the new modules ----------
const rg2=r=>l=>r.test(l);
CH.push(
{m:17,p:"Replace kali with hacker in notes.txt using sed",t:rg2(/^sed\s+['"]s\/kali\/\w+\/g?['"]\s+\S*notes\.txt$/)},
{m:17,p:'Print notes.txt upside down with tac',t:rg2(/^tac\s+\S*notes\.txt$/)},
{m:18,p:'Show which groups you belong to',t:rg2(/^groups$/)},
{m:18,p:'Show a long listing of /etc',t:rg2(/^ls\s+-\w*l\w*\s+\/etc\/?$/)},
{m:19,p:'List every process with ps aux',t:rg2(/^ps\s+(aux|-ef)$/)},
{m:19,p:'Check the status of the ssh service',t:rg2(/^(sudo\s+)?systemctl\s+status\s+ssh$/)},
{m:20,p:'List disks and partitions',t:rg2(/^lsblk$/)},
{m:20,p:'Show CPU information',t:rg2(/^lscpu$/)},
{m:21,p:'List the contents of an archive: tar -tf docs.tar.gz',t:rg2(/^tar\s+-?\w*t\w*f\s+\S+/)},
{m:22,p:'Print the numbers 1 to 5 with a for loop',t:rg2(/for\s+\w+\s+in\s+.+;\s*do\s+echo/)},
{m:23,p:'Find failed logins in /var/log/auth.log',t:rg2(/^grep\s+(-\w+\s+)?Failed\s+\/var\/log\/auth\.log$/)},
{m:24,p:'Identify the hash 5f4dcc3b5aa765d61d8327deb882cf99 with hashid',t:rg2(/^hashid\s+5f4dcc3b5aa765d61d8327deb882cf99$/)}
);

// ---------- manual pages ----------
// cmd : [summary, synopsis, [[option, meaning],...], [examples]]
window.MAN={
ls:['list directory contents','ls [OPTION]... [FILE]...',[['-l','long listing format'],['-a','show hidden files'],['-h','human-readable sizes (with -l)'],['-t','sort by modification time'],['-S','sort by size'],['-r','reverse order'],['-R','list subdirectories recursively'],['-1','one entry per line'],['-d','list directories themselves'],['-F','add / and * indicators']],['ls -la ~','ls -lhS /var/log']],
cd:['change the working directory','cd [DIR]',[['-','go to the previous directory'],['~','go to your home directory'],['..','go up one level']],['cd /etc','cd -']],
pwd:['print name of current/working directory','pwd',[],['pwd']],
cat:['concatenate files and print on the standard output','cat [OPTION]... [FILE]...',[['-n','number all output lines']],['cat notes.txt','cat -n /etc/passwd']],
head:['output the first part of files','head [OPTION]... [FILE]...',[['-n N','print the first N lines (default 10)']],['head -n 3 notes.txt']],
tail:['output the last part of files','tail [OPTION]... [FILE]...',[['-n N','print the last N lines (default 10)']],['tail -n 5 /var/log/auth.log']],
wc:['print newline, word, and byte counts','wc [OPTION]... [FILE]...',[['-l','lines'],['-w','words'],['-c','bytes']],['wc -l notes.txt']],
grep:['print lines that match patterns','grep [OPTION]... PATTERN [FILE]...',[['-i','ignore case'],['-v','invert match'],['-n','show line numbers'],['-c','count matching lines'],['-r','search directories recursively'],['-l','only print names of matching files'],['-w','match whole words'],['-o','print only the matching part'],['-A N','show N lines after a match'],['-B N','show N lines before a match'],['-q','quiet, set exit status only']],['grep -i kali notes.txt','grep -rn "flag" ~','grep Failed /var/log/auth.log | wc -l']],
find:['search for files in a directory hierarchy','find [PATH]... [EXPRESSION]',[['-name PATTERN','match the file name (supports *)'],['-iname PATTERN','same, ignoring case'],['-type f|d','files or directories'],['-maxdepth N','descend at most N levels'],['-empty','empty files and directories']],['find ~ -name "*.txt"','find / -type d -name log']],
sort:['sort lines of text files','sort [OPTION]... [FILE]',[['-r','reverse'],['-n','numeric sort'],['-u','unique lines only'],['-k N','sort by field N'],['-t SEP','field separator']],['sort names.txt','sort -rn counts.txt']],
uniq:['report or omit repeated lines','uniq [OPTION]... [FILE]',[['-c','prefix lines with the number of repeats'],['-d','only print duplicate lines']],['sort file | uniq -c']],
cut:['remove sections from each line of files','cut -d DELIM -f FIELDS [FILE]',[['-d','field delimiter'],['-f','which field to print']],['cut -d: -f1 /etc/passwd']],
tr:['translate or delete characters','tr [OPTION] SET1 [SET2]',[['-d','delete characters in SET1']],['echo hello | tr a-z A-Z']],
awk:['pattern scanning and processing language','awk [-F SEP] \'PROGRAM\' [FILE]',[['-F SEP','input field separator'],['$1 $2 ... $NF','fields of the current line'],['NR','current line number']],["awk '{print $1}' access.log","awk -F: '{print $1}' /etc/passwd"]],
sed:['stream editor for filtering and transforming text','sed [OPTION]... \'SCRIPT\' [FILE]',[['s/old/new/','replace first match on each line'],['s/old/new/g','replace every match'],['-n \'5p\'','print only line 5'],['\'/pat/d\'','delete matching lines']],["sed 's/kali/hacker/' notes.txt","sed -n '2,4p' notes.txt"]],
xargs:['build and execute command lines from standard input','xargs [COMMAND [ARGS]]',[],['find . -name "*.txt" | xargs wc -l']],
chmod:['change file mode bits','chmod MODE FILE...',[['755','rwxr-xr-x'],['644','rw-r--r--'],['600','rw-------'],['+x','add execute permission'],['u+w','give the owner write permission']],['chmod 600 secret.txt','chmod +x script.sh']],
chown:['change file owner and group','chown [OWNER][:GROUP] FILE...',[],['sudo chown root:root file']],
ps:['report a snapshot of the current processes','ps [aux | -ef]',[['aux','all processes, user-oriented format'],['-ef','all processes, full format']],['ps aux | grep ssh']],
kill:['send a signal to a process','kill [-SIGNAL] PID...',[['-9','force kill (SIGKILL)'],['-15','polite terminate (SIGTERM, default)']],['kill 1234','kill -9 1234']],
tar:['an archiving utility','tar [OPTION...] [FILE]...',[['c','create an archive'],['x','extract an archive'],['t','list the contents'],['z','filter through gzip'],['v','verbose, list files as processed'],['f ARCHIVE','use this archive file']],['tar -czf backup.tar.gz Documents','tar -xzf backup.tar.gz','tar -tf backup.tar.gz']],
gzip:['compress or expand files','gzip [OPTION]... [FILE]...',[['-d','decompress'],['-k','keep the original file']],['gzip notes.txt','gunzip notes.txt.gz']],
zip:['package and compress files','zip ARCHIVE.zip FILE...',[],['zip docs.zip Documents/*']],
unzip:['extract compressed files in a ZIP archive','unzip [-l] ARCHIVE.zip',[['-l','list the files only']],['unzip docs.zip']],
ssh:['OpenSSH remote login client','ssh [user@]hostname',[],['ssh kali@10.0.2.15']],
ping:['send ICMP ECHO_REQUEST to network hosts','ping [-c COUNT] DESTINATION',[['-c N','stop after N packets']],['ping -c 3 127.0.0.1']],
nmap:['network exploration tool and port scanner','nmap [OPTIONS] TARGET',[['-sV','detect service versions'],['-p PORTS','scan only these ports, e.g. -p 22,80'],['-A','aggressive scan (OS, version, scripts)'],['-sn','ping scan only, no ports'],['-Pn','skip host discovery']],['nmap 127.0.0.1','nmap -sV -p 22,80 127.0.0.1']],
curl:['transfer a URL','curl [OPTIONS] URL',[['-I','fetch headers only'],['-s','silent mode'],['-o FILE','write output to a file']],['curl -I http://127.0.0.1']],
wget:['non-interactive network downloader','wget URL',[],['wget http://example.com/file.txt']],
sudo:['execute a command as another user','sudo [-i] COMMAND',[['-i','open a root login shell'],['-l','list what you may run']],['sudo apt update','sudo !!']],
apt:['command-line package manager','apt update | upgrade | install PKG | remove PKG | search WORD',[],['sudo apt update','sudo apt install cowsay']],
systemctl:['control the systemd system and service manager','systemctl status|start|stop|restart|enable|disable UNIT',[],['systemctl status ssh','sudo systemctl start ssh']],
man:['an interface to the system reference manuals','man COMMAND',[],['man ls']],
echo:['display a line of text','echo [-n] [-e] [STRING]...',[['-n','no trailing newline'],['-e','interpret \\n and \\t']],['echo "hello" > file.txt']],
mkdir:['make directories','mkdir [-p] DIRECTORY...',[['-p','create parent directories as needed']],['mkdir -p lab/tools']],
rm:['remove files or directories','rm [-r] [-f] FILE...',[['-r','remove directories and their contents'],['-f','ignore missing files, never prompt']],['rm old.txt','rm -r oldfolder']],
cp:['copy files and directories','cp [-r] SOURCE DEST',[['-r','copy directories recursively']],['cp notes.txt backup.txt']],
mv:['move (rename) files','mv SOURCE DEST',[],['mv old.txt new.txt']],
touch:['change file timestamps / create empty files','touch FILE...',[],['touch newfile.txt']],
df:['report file system space usage','df [-h]',[['-h','human-readable sizes']],['df -h']],
du:['estimate file space usage','du [-sh] [FILE]',[['-s','summary only'],['-h','human-readable']],['du -sh ~']],
free:['display amount of free and used memory','free [-h]',[['-h','human-readable']],['free -h']],
top:['display Linux processes','top',[],['top']],
base64:['base64 encode/decode data','base64 [-d] [FILE]',[['-d','decode']],['echo kali | base64','echo a2FsaQo= | base64 -d']],
md5sum:['compute and check MD5 message digest','md5sum [FILE]...',[],['md5sum notes.txt']],
sha256sum:['compute and check SHA256 message digest','sha256sum [FILE]...',[],['sha256sum notes.txt']],
openssl:['OpenSSL command line tool','openssl version | rand -hex N | dgst -sha256 FILE',[],['openssl rand -hex 8','openssl dgst -sha256 notes.txt']],
nc:['netcat: check TCP ports (lab: local machine only)','nc -zv HOST PORT',[['-z','just check, send no data'],['-v','verbose']],['nc -zv 127.0.0.1 22']],
hashid:['identify the type of a hash','hashid HASH',[],['hashid 5f4dcc3b5aa765d61d8327deb882cf99']],
journalctl:['query the systemd journal','journalctl [-n N] [-u UNIT]',[['-n N','show the last N lines'],['-u UNIT','only this service']],['journalctl -n 10']],
alias:['define or display aliases','alias [NAME[=VALUE]]',[],["alias ll='ls -la'"]],
bc:['an arbitrary precision calculator language','echo "EXPR" | bc',[],['echo "2+3*4" | bc']],
history:['show the command history','history [N] [-c]',[['-c','clear the history']],['history 5','!!']],
}
})();
