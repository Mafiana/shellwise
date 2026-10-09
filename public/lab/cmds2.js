// cmds2.js - users, processes, services, hardware, archives, logs, hashes
(()=>{
'use strict';
const SH=window.SH,{PROCS,JOBS,SVC}=SH;
const two=n=>String(n).padStart(2,'0'),MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],DAY=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const flagsOf=a=>{const s=new Set();a.forEach(x=>{if(/^-[A-Za-z]+$/.test(x))x.slice(1).split('').forEach(c=>s.add(c))});return s};
const BOOT=Date.now()-83*60000;

// ----- identity -----
C.whoami=()=>P(SH.user());
C.id=()=>P(SH.user()=='root'?'uid=0(root) gid=0(root) groups=0(root)':'uid=1000(kali) gid=1000(kali) groups=1000(kali),4(adm),20(dialout),24(cdrom),25(floppy),27(sudo),29(audio),30(dip),44(video),46(plugdev),100(users),106(netdev),119(wireshark),122(bluetooth),134(scanner),142(kaboxer)');
C.groups=()=>P(SH.GR[SH.user()].join(' '));
C.hostname=a=>P(a.includes('-I')?'10.0.2.15':'kali');
C.users=()=>P('kali');
C.who=()=>{const d=new Date(BOOT);P(`kali     tty7         ${d.getFullYear()}-${two(d.getMonth()+1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())} (:0)\nkali     pts/0        ${d.getFullYear()}-${two(d.getMonth()+1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes()+1)} (10.0.2.2)`)};
C.w=()=>{const t=new Date();P(` ${two(t.getHours())}:${two(t.getMinutes())}:${two(t.getSeconds())} up 1:23,  2 users,  load average: 0.08, 0.03, 0.01\nUSER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT\nkali     tty7     :0               ${two(new Date(BOOT).getHours())}:${two(new Date(BOOT).getMinutes())}    1:23m  0.02s  0.02s xfce4-session\nkali     pts/0    10.0.2.2         ${two(new Date(BOOT).getHours())}:${two(new Date(BOOT).getMinutes())}    0.00s  0.04s  0.00s w`)};
C.last=()=>{const d=new Date(BOOT);const f=x=>`${DAY[x.getDay()]} ${MON[x.getMonth()]} ${String(x.getDate()).padStart(2)} ${two(x.getHours())}:${two(x.getMinutes())}`;P(`kali     pts/0        10.0.2.2         ${f(d)}   still logged in\nkali     tty7         :0               ${f(d)}   still logged in\nreboot   system boot  6.8.11-amd64     ${f(d)}   still running\n\nwtmp begins ${f(new Date(BOOT-864e5*30))} ${d.getFullYear()}`)};
C.lastb=()=>{if(SH.user()!='root')return bad('lastb: cannot open /var/log/btmp: Permission denied');const t=get('/var/log/auth.log').c.split('\n').filter(l=>/Failed password/.test(l)).slice(-10);t.forEach(l=>{const m=l.match(/for (?:invalid user )?(\S+) from (\S+) port/);P(`${(m[1]).padEnd(9)}ssh:notty    ${m[2].padEnd(16)} ${esc(l.slice(0,12))}`)});P('\nbtmp begins Oct  3 2026')};
C.lastlog=()=>P('Username         Port     From             Latest\nroot                                       **Never logged in**\nkali             pts/0    10.0.2.2         Sat Oct  3 02:00:11 +0100 2026');
C.getent=a=>{const db=a[0],k=a[1];if(db=='passwd'){const t=get('/etc/passwd').c.split('\n').filter(l=>!k||l.startsWith(k+':'));if(k&&!t.filter(Boolean).length)return;t.filter(Boolean).forEach(l=>P(esc(l)))}else if(db=='group'){get('/etc/group').c.split('\n').filter(l=>l&&(!k||l.startsWith(k+':'))).forEach(l=>P(esc(l)))}else if(db=='hosts')P('127.0.0.1       localhost');else bad('Unknown database: '+(db||''))};
C.passwd=()=>{if(SH.user()=='root')return P('New password: \npasswd: password updated successfully');bad('passwd: Authentication token manipulation error')};
// ----- date / uname / time -----
const fmtDate=(d,f)=>f.replace(/%([YmdHMSAaBbZsFTyjpe%])/g,(m,c)=>({Y:d.getFullYear(),m:two(d.getMonth()+1),d:two(d.getDate()),e:String(d.getDate()).padStart(2),H:two(d.getHours()),M:two(d.getMinutes()),S:two(d.getSeconds()),A:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()],a:DAY[d.getDay()],B:['January','February','March','April','May','June','July','August','September','October','November','December'][d.getMonth()],b:MON[d.getMonth()],Z:'WAT',s:Math.floor(d/1000),F:`${d.getFullYear()}-${two(d.getMonth()+1)}-${two(d.getDate())}`,T:`${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`,y:String(d.getFullYear()).slice(2),j:'276',p:d.getHours()<12?'AM':'PM','%':'%'}[c]));
C.date=a=>{const d=new Date(),f=a.find(x=>x[0]=='+');if(f)return P(esc(fmtDate(d,f.slice(1))));if(a.includes('-u'))return P(esc(d.toUTCString().replace('GMT','UTC')));P(esc(fmtDate(d,`%a %b %e %T ${d.getHours()<12?'AM':'PM'} %Z %Y`)))};
C.uname=a=>{const fl=flagsOf(a),p=[];if(fl.has('a')){return P('Linux kali 6.8.11-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.8.11-1kali2 (2024-05-30) x86_64 GNU/Linux')}
 if(fl.has('s')||!fl.size)p.push('Linux');if(fl.has('n'))p.push('kali');if(fl.has('r'))p.push('6.8.11-amd64');if(fl.has('v'))p.push('#1 SMP PREEMPT_DYNAMIC Kali 6.8.11-1kali2');if(fl.has('m'))p.push('x86_64');if(fl.has('o'))p.push('GNU/Linux');P(p.join(' '))};
C.arch=()=>P('x86_64');C.nproc=()=>P('2');C.tty=()=>P('/dev/pts/0');
C.uptime=a=>{const m=Math.floor((Date.now()-BOOT)/60000),t=new Date();if(a.includes('-p'))return P(`up ${Math.floor(m/60)} hours, ${m%60} minutes`);if(a.includes('-s'))return P(fmtDate(new Date(BOOT),'%F %T'));P(` ${two(t.getHours())}:${two(t.getMinutes())}:${two(t.getSeconds())} up ${Math.floor(m/60)}:${two(m%60)},  2 users,  load average: 0.08, 0.03, 0.01`)};
C.hostnamectl=()=>P(' Static hostname: kali\n       Icon name: computer-vm\n         Chassis: vm 🖴\n      Machine ID: 3f2a8c1d5b7e4f60a9d2c4e8b1a07356\n    Virtualization: oracle\n Operating System: Kali GNU/Linux Rolling\n           Kernel: Linux 6.8.11-amd64\n     Architecture: x86-64');
C.timedatectl=()=>{const d=new Date();P(`               Local time: ${fmtDate(d,'%a %F %T WAT')}\n           Universal time: ${fmtDate(new Date(d.getTime()-3600000),'%a %F %T UTC')}\n                 Time zone: Africa/Lagos (WAT, +0100)\nSystem clock synchronized: yes\n              NTP service: active`)};
C.lsb_release=a=>P(a.includes('-a')?'No LSB modules are available.\nDistributor ID:\tKali\nDescription:\tKali GNU/Linux Rolling\nRelease:\t2025.3\nCodename:\tkali-rolling':'No LSB modules are available.');
C.lscpu=()=>P('Architecture:                         x86_64\nCPU op-mode(s):                       32-bit, 64-bit\nByte Order:                           Little Endian\nCPU(s):                               2\nVendor ID:                            GenuineIntel\nModel name:                           Intel(R) Core(TM) i7-1165G7 @ 2.80GHz\nThread(s) per core:                   1\nCore(s) per socket:                   2\nSocket(s):                            1\nHypervisor vendor:                    KVM\nVirtualization type:                  full');
C.lsblk=()=>P('NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS\nsda      8:0    0   40G  0 disk \n├─sda1   8:1    0   39G  0 part /\n├─sda2   8:2    0    1K  0 part \n└─sda5   8:5    0  975M  0 part [SWAP]\nsr0     11:0    1 1024M  0 rom  ');
C.lsusb=()=>P('Bus 001 Device 002: ID 80ee:0021 VirtualBox USB Tablet\nBus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub');
C.lspci=()=>P('00:00.0 Host bridge: Intel Corporation 440FX - 82441FX PMC [Natoma] (rev 02)\n00:02.0 VGA compatible controller: VMware SVGA II Adapter\n00:03.0 Ethernet controller: Intel Corporation 82540EM Gigabit Ethernet Controller (rev 02)\n00:04.0 System peripheral: InnoTek Systemberatung GmbH VirtualBox Guest Service\n00:05.0 Multimedia audio controller: Intel Corporation 82801AA AC\'97 Audio Controller (rev 01)');
C.lsmod=()=>P('Module                  Size  Used by\nvboxguest             49152  1\nsnd_intel8x0          49152  2\nsnd_ac97_codec       188416  1 snd_intel8x0\ne1000                159744  0\nvboxvideo             16384  0\nnf_tables            311296  0');
C.mount=()=>P('/dev/sda1 on / type ext4 (rw,relatime,errors=remount-ro)\nproc on /proc type proc (rw,nosuid,nodev,noexec,relatime)\nsysfs on /sys type sysfs (rw,nosuid,nodev,noexec,relatime)\ntmpfs on /run type tmpfs (rw,nosuid,nodev,noexec,relatime,size=399208k,mode=755)\ntmpfs on /dev/shm type tmpfs (rw,nosuid,nodev)');
C.fdisk=a=>{if(SH.user()!='root')return bad('fdisk: cannot open /dev/sda: Permission denied');P('Disk /dev/sda: 40 GiB, 42949672960 bytes, 83886080 sectors\nDisk model: VBOX HARDDISK\nUnits: sectors of 1 * 512 = 512 bytes\nDisklabel type: dos\n\nDevice     Boot    Start      End  Sectors  Size Id Type\n/dev/sda1  *        2048 81889279 81887232   39G 83 Linux\n/dev/sda2       81891326 83884031  1992706  973M  5 Extended\n/dev/sda5       81891328 83884031  1992704  973M 82 Linux swap / Solaris')};
C.free=a=>{const h=a.includes('-h')||a.includes('-m')||a.includes('-g');P(h?'               total        used        free      shared  buff/cache   available\nMem:           3.8Gi       1.1Gi       1.9Gi        24Mi       0.9Gi       2.7Gi\nSwap:          1.0Gi          0B       1.0Gi':'               total        used        free      shared  buff/cache   available\nMem:         3984000     1153000     1990000       24576      940000     2830000\nSwap:        1048572           0     1048572')};
C.dmesg=()=>{if(SH.user()!='root')return bad('dmesg: read kernel buffer failed: Operation not permitted');['Linux version 6.8.11-amd64 (devel@kali.org) (gcc-13) #1 SMP PREEMPT_DYNAMIC Kali','Command line: BOOT_IMAGE=/boot/vmlinuz-6.8.11-amd64 root=UUID=3b2f-77a1 ro quiet splash','BIOS-provided physical RAM map:','smpboot: Allowing 2 CPUs, 0 hotplug CPUs','e1000: Intel(R) PRO/1000 Network Driver','e1000 0000:00:03.0 eth0: (PCI:33MHz:32-bit) 08:00:27:ab:cd:ef','EXT4-fs (sda1): mounted filesystem with ordered data mode','systemd[1]: Started Journal Service.','e1000: eth0 NIC Link is Up 1000 Mbps Full Duplex'].forEach((l,i)=>P(`[${(i*0.7+(i?1.2:0)).toFixed(6).padStart(12)}] ${esc(l)}`))};
C.journalctl=a=>{
 const ni=a.indexOf('-n'),n=ni>=0?+a[ni+1]:30,ui=a.indexOf('-u'),u=ui>=0?a[ui+1]:null;
 let ls=get('/var/log/syslog').c.split('\n').filter(Boolean);if(u)ls=ls.filter(l=>l.toLowerCase().includes(u.toLowerCase()));
 if(SH.user()!='root')P('<span class=dim>Hint: You are currently not seeing messages from other users and the system.</span>');
 P('<span class=dim>-- Journal begins at '+esc(fmtDate(new Date(BOOT),'%a %F %T WAT'))+' --</span>');ls.slice(-n).forEach(l=>P(esc(l.replace(/^Oct  3 /,'Oct 03 '))));if(!ls.length)P('-- No entries --')};
C.logger=a=>{const t=get('/var/log/syslog');if(t&&SH.can(t,2))t.c+=`${fmtDate(new Date(),'%b %e %T')} kali ${SH.user()}: ${a.join(' ')}\n`};
// ----- hashes (synchronous) -----
const hashCmd=(fn)=>a=>{const fs=a.filter(x=>x[0]!='-');const go=(t,nm)=>P(fn(t)+'  '+esc(nm||'-'));if(!fs.length){if(stdin!==null)go(stdin,'-');return}fs.forEach(f=>{const t=rd(f,'hash');if(t!==null)go(t,f)})};
C.md5sum=hashCmd(HASH.md5);C.sha256sum=hashCmd(HASH.sha256);C.sha1sum=hashCmd(HASH.sha1);
// ----- processes -----
const fmtTime=m=>`${two(Math.floor(m/60))}:${two(m%60)}`;
C.ps=a=>{
 const s=a.join(' '),full=/aux|ef|-e|-A/.test(s),me=SH.user();
 const mine={pid:2900+JOBS.length,u:me,cpu:0,mem:0.2,tty:'pts/0',cmd:'ps '+a.join(' '),stat:'R+'};
 if(!full){P('    PID TTY          TIME CMD\n   1021 pts/0    00:00:00 bash');PROCS.filter(p=>p.tty=='pts/0'&&p.pid!=1021).forEach(p=>P(`${String(p.pid).padStart(7)} pts/0    00:00:00 ${esc(p.cmd.split(' ')[0])}`));return P(`${String(mine.pid).padStart(7)} pts/0    00:00:00 ps`)}
 const all=[...PROCS,mine];
 if(/aux/.test(s)){P('USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND');all.forEach(p=>P(`${p.u.slice(0,10).padEnd(10)} ${String(p.pid).padStart(5)} ${p.cpu.toFixed(1).padStart(4)} ${p.mem.toFixed(1).padStart(4)} ${String(12000+p.pid*7%90000).padStart(6)} ${String(3000+p.pid*3%9000).padStart(5)} ${p.tty.padEnd(8)} ${p.stat.padEnd(4)} 02:00   0:00 ${esc(p.cmd)}`))}
 else{P('UID          PID    PPID  C STIME TTY          TIME CMD');all.forEach(p=>P(`${p.u.slice(0,8).padEnd(8)} ${String(p.pid).padStart(7)} ${String(p.pid==1?0:p.pid>1000?1021:1).padStart(7)}  0 02:00 ${p.tty.padEnd(8)} 00:00:00 ${esc(p.cmd)}`))}};
C.top=()=>{const t=new Date();P(`top - ${two(t.getHours())}:${two(t.getMinutes())}:${two(t.getSeconds())} up 1:23,  2 users,  load average: 0.08, 0.03, 0.01\nTasks: ${PROCS.length+1} total,   1 running, ${PROCS.length} sleeping,   0 stopped,   0 zombie\n%Cpu(s):  1.2 us,  0.5 sy,  0.0 ni, 98.1 id,  0.2 wa,  0.0 hi,  0.0 si,  0.0 st\nMiB Mem :   3890.6 total,   1943.4 free,   1126.0 used,    886.9 buff/cache\nMiB Swap:   1024.0 total,   1024.0 free,      0.0 used.   2764.6 avail Mem\n\n  PID USER      PR  NI    VIRT    RES  %CPU  %MEM     TIME+ COMMAND`);
 [...PROCS].sort((x,y)=>y.cpu-x.cpu).slice(0,10).forEach(p=>P(`${String(p.pid).padStart(5)} ${p.u.slice(0,8).padEnd(9)} 20   0 ${String(120000+p.pid*11%300000).padStart(7)} ${String(30000+p.pid*5%60000).padStart(6)} ${p.cpu.toFixed(1).padStart(5)} ${p.mem.toFixed(1).padStart(5)}   0:0${p.pid%9}.${two(p.pid%100)} ${esc(p.cmd.split(' ')[0].split('/').pop())}`));
 P('<span class=dim>(snapshot - the real top keeps refreshing; press q to quit)</span>')};
C.htop=C.top;
C.pstree=()=>P('systemd─┬─NetworkManager\n        ├─apache2───apache2\n        ├─cron\n        ├─dbus-daemon\n        ├─rsyslogd\n        ├─sshd\n        ├─systemd-journal\n        ├─systemd-logind\n        └─xfce4-session───bash───pstree');
const killPid=(pid,sig)=>{const i=PROCS.findIndex(p=>p.pid==pid);if(i<0)return bad(`bash: kill: (${pid}) - No such process`);
 if(PROCS[i].u!=SH.user()&&SH.user()!='root')return bad(`bash: kill: (${pid}) - Operation not permitted`);
 if(pid==1021)return P('<span class=dim>(you cannot kill your own shell in this simulator)</span>');
 const p=PROCS[i];PROCS.splice(i,1);if(p.svc&&SVC[p.svc])SVC[p.svc].on=false;const j=JOBS.findIndex(x=>x.pid==pid);if(j>=0)JOBS[j].state='Terminated'};
C.kill=a=>{const f=a.filter(x=>x[0]!='-');if(!f.length)return bad('kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]');f.forEach(x=>{if(x[0]=='%'){const j=JOBS.find(y=>y.id==+x.slice(1));return j?killPid(j.pid):bad(`bash: kill: ${x}: no such job`)}if(!/^\d+$/.test(x))return bad(`bash: kill: ${x}: arguments must be process or job IDs`);killPid(+x)})};
const byName=n=>PROCS.filter(p=>p.cmd.split(' ')[0].split('/').pop().replace(/^-/,'').toLowerCase().includes(n.toLowerCase())||p.cmd.toLowerCase().includes(n.toLowerCase()));
C.pgrep=a=>{const n=a.filter(x=>x[0]!='-')[0];if(!n)return bad('pgrep: no matching criteria specified');const r=byName(n);r.forEach(p=>P(String(p.pid)));if(!r.length)err=true};
C.pkill=a=>{const n=a.filter(x=>x[0]!='-')[0];if(!n)return bad('pkill: no matching criteria specified');const r=byName(n).filter(p=>p.pid!=1021);if(!r.length)err=true;r.forEach(p=>killPid(p.pid))};
C.killall=a=>{const n=a.filter(x=>x[0]!='-')[0];if(!n)return bad('killall: no process specification');const r=byName(n).filter(p=>p.pid!=1021);if(!r.length)return bad(`${n}: no process found`);r.forEach(p=>killPid(p.pid))};
C.jobs=()=>{JOBS.forEach((j,i)=>P(`[${j.id}]${i==JOBS.length-1?'+':' '}  ${j.state.padEnd(22)}${esc(j.cmd)}`));for(let i=JOBS.length-1;i>=0;i--)if(JOBS[i].state=='Terminated')JOBS.splice(i,1)};
C.bg=()=>{if(!JOBS.length)return bad('bash: bg: current: no such job');P(`[${JOBS[JOBS.length-1].id}]+ ${esc(JOBS[JOBS.length-1].cmd)}`)};
C.fg=()=>{if(!JOBS.length)return bad('bash: fg: current: no such job');P(esc(JOBS[JOBS.length-1].cmd.replace(/ &$/,'')));P('<span class=dim>(press Ctrl+C to stop it)</span>')};
C.nohup=a=>{if(!a.length)return bad('nohup: missing operand');P('nohup: ignoring input and appending output to \'nohup.out\'');SH.runCmd(a)};
C.nice=a=>{const i=a.indexOf('-n');const r=i>=0?a.slice(i+2):a;if(!r.length)return P('0');SH.runCmd(r)};
C.sleep=()=>{};C.watch=a=>{const f=a.filter(x=>x[0]!='-'&&!/^\d+(\.\d+)?$/.test(x));P(`<span class=dim>Every 2.0s: ${esc(f.join(' '))}</span>`);if(f.length)SH.runCmd(f);P('<span class=dim>(watch would refresh forever; showing one frame)</span>')};
C.lsof=a=>{const net=a.includes('-i');P('COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME');if(net){PROCS.filter(p=>p.svc&&SVC[p.svc].on).forEach(p=>P(`${(p.cmd.split(' ')[0].split('/').pop()).slice(0,9).padEnd(9)} ${String(p.pid).padStart(4)} ${p.u.padEnd(6)} 3u  IPv4  12345      0t0  TCP *:${SVC[p.svc].port} (LISTEN)`));return}
 P('bash     1021 kali  cwd    DIR    8,1     4096 2342 /home/kali\nbash     1021 kali  rtd    DIR    8,1     4096    2 /\nbash     1021 kali    0u   CHR  136,0      0t0    3 /dev/pts/0')};
// ----- services -----
const unit=n=>(n||'').replace(/\.service$/,'');
const svcStatus=n=>{const s=SVC[n];const since=fmtDate(new Date(BOOT+60000),'%a %F %T WAT');
 if(s.on){const p=PROCS.find(x=>x.svc==n)||{pid:1500};P(`<span class=ok>●</span> ${n}.service - ${s.d}\n     Loaded: loaded (/lib/systemd/system/${n}.service; ${s.en?'enabled':'disabled'}; preset: enabled)\n     Active: <span class=ok>active (running)</span> since ${since}; 1h 22min ago\n       Docs: ${s.doc}\n   Main PID: ${p.pid} (${s.svc})\n      Tasks: 1 (limit: 4607)\n     Memory: 4.2M\n        CPU: 31ms\n     CGroup: /system.slice/${n}.service\n             └─${p.pid} ${esc(p.cmd)}`)}
 else P(`○ ${n}.service - ${s.d}\n     Loaded: loaded (/lib/systemd/system/${n}.service; ${s.en?'enabled':'disabled'}; preset: enabled)\n     Active: inactive (dead)\n       Docs: ${s.doc}`)};
const svcAct=(act,n)=>{const s=SVC[n];
 if(['start','stop','restart','reload','enable','disable'].includes(act)&&SH.user()!='root')return bad(`Failed to ${act} ${n}.service: Interactive authentication required.\nSee system logs and 'systemctl status ${n}.service' for details.`);
 if(act=='start'||act=='restart'||act=='reload'){if(s.fixed&&act=='start')return;if(act!='reload'){const i=PROCS.findIndex(p=>p.svc==n);if(i>=0)PROCS.splice(i,1);SH.addProc({u:'root',cpu:0,mem:0.5,tty:'?',cmd:`/usr/sbin/${s.svc} -D`,stat:'Ss',svc:n})}s.on=true}
 else if(act=='stop'){if(s.fixed)return bad(`Failed to stop ${n}.service: Unit is protected in this lab.`);s.on=false;for(let i=PROCS.length-1;i>=0;i--)if(PROCS[i].svc==n)PROCS.splice(i,1)}
 else if(act=='enable'){s.en=true;P(`Created symlink /etc/systemd/system/multi-user.target.wants/${n}.service → /lib/systemd/system/${n}.service.`)}
 else if(act=='disable'){s.en=false;P(`Removed "/etc/systemd/system/multi-user.target.wants/${n}.service".`)}};
C.systemctl=a=>{
 const f=a.filter(x=>x[0]!='-'),act=f[0],n=unit(f[1]);
 if(!act||act=='list-units'||act=='list-unit-files'){P('  UNIT                      LOAD   ACTIVE SUB     DESCRIPTION');Object.keys(SVC).forEach(k=>P(`  ${(k+'.service').padEnd(25)} loaded ${SVC[k].on?'active':'inactive'} ${SVC[k].on?'running':'dead   '} ${SVC[k].d}`));return P('\n'+Object.keys(SVC).length+' loaded units listed.')}
 if(act=='daemon-reload')return SH.user()=='root'?0:bad('Failed to reload daemon: Interactive authentication required.');
 if(!n)return bad('Too few arguments.');
 if(!SVC[n])return bad(`${act=='status'?'Unit':'Failed to '+act}${act=='status'?' '+n+'.service could not be found.':' '+n+'.service: Unit '+n+'.service not found.'}`);
 if(act=='status')return svcStatus(n);
 if(act=='is-active'){return P(SVC[n].on?'active':'inactive'),SVC[n].on?0:(err=true)}
 if(act=='is-enabled')return P(SVC[n].en?'enabled':'disabled');
 svcAct(act,n)};
C.service=a=>{
 if(a[0]=='--status-all'){Object.keys(SVC).forEach(k=>P(` [ ${SVC[k].on?'+':'-'} ]  ${k}`));return}
 const n=unit(a[0]),act=a[1];if(!n||!act)return bad('Usage: service < option > | --status-all | [ service_name [ command | --full-restart ] ]');
 if(!SVC[n])return bad(`${n}: unrecognized service`);
 if(act=='status')return svcStatus(n);svcAct(act,n)};
// ----- archives -----
const sizeOf=n=>n.t=='f'?n.c.length:Object.values(n.c).reduce((s,x)=>s+sizeOf(x),0)+0;
const clone=n=>dclone(n);
const listPaths=(name,n,out)=>{out.push(name+(n.t=='d'?'/':''));if(n.t=='d')Object.keys(n.c).sort().forEach(k=>listPaths(name+'/'+k,n.c[k],out));return out};
const mkArc=(nodes,ratio)=>{const raw=Object.values(nodes).reduce((s,x)=>s+sizeOf(x),0),n=F('\x1f\x8b\x08\x00'+'�'.repeat(Math.max(20,Math.floor(raw*ratio))));n.arc={nodes};Object.assign(n,SH.meta());n.ts=Date.now();return n};
C.tar=a=>{
 let opt='',rest=[],dir=null;
 for(let i=0;i<a.length;i++){const x=a[i];if(x=='-C'){dir=a[++i];continue}if(opt===''&&/^-?[cxtzvfjJ]+$/.test(x)){opt=x.replace('-','');continue}if(/^-[cxtzvfjJ]+$/.test(x)){opt+=x.slice(1);continue}rest.push(x)}
 if(!opt)return bad("tar: You must specify one of the '-Acdtrux', '--delete' or '--test-label' options\nTry 'tar --help' or 'tar --usage' for more information.");
 const v=opt.includes('v'),z=opt.includes('z')||opt.includes('j')||opt.includes('J'),fi=opt.indexOf('f');
 const af=fi>=0?rest.shift():null;if(!af)return bad('tar: Refusing to read archive contents from terminal (missing -f option?)');
 if(opt.includes('c')){
  if(!rest.length)return bad('tar: Cowardly refusing to create an empty archive');
  const nodes=Object.create(null);let miss=false;
  rest.forEach(s=>{const n=get(s);if(!n){miss=true;return bad(`tar: ${s}: Cannot stat: No such file or directory`)}if(n.t=='d'&&!SH.can(n,4)){miss=true;return bad(`tar: ${s}: Cannot open: Permission denied`)}nodes[s.replace(/^\/+/,'').replace(/\/$/,'')]=clone(n)});
  if(v)Object.entries(nodes).forEach(([k,n])=>listPaths(k,n,[]).forEach(l=>P(esc(l))));
  const[p,nm]=par(af);if(!p)return bad(`tar: ${af}: Cannot open: No such file or directory`);if(!SH.can(p,2))return bad(`tar: ${af}: Cannot open: Permission denied`);
  p.c[nm]=mkArc(nodes,z?0.35:1);if(miss)bad('tar: Exiting with failure status due to previous errors');return}
 const an=get(af);if(!an)return bad(`tar: ${af}: Cannot open: No such file or directory`);
 if(!an.arc)return bad(`tar: This does not look like a tar archive\ntar: Exiting with failure status due to previous errors`);
 if(opt.includes('t')){Object.entries(an.arc.nodes).forEach(([k,n])=>listPaths(k,n,[]).forEach(l=>P(esc(l))));return}
 if(opt.includes('x')){const target=dir?get(dir):get('.');if(!target||target.t!='d')return bad(`tar: ${dir}: Cannot open: No such file or directory`);if(!SH.can(target,2))return bad(`tar: Cannot open: Permission denied`);
  Object.entries(an.arc.nodes).forEach(([k,n])=>{const nn=clone(n);Object.assign(nn,SH.meta());nn.ts=Date.now();target.c[k.split('/').pop()]=nn;if(v)listPaths(k,n,[]).forEach(l=>P(esc(l)))})}};
C.gzip=a=>{
 const fl=flagsOf(a),f=a.filter(x=>x[0]!='-');if(!f.length)return bad('gzip: compressed data not written to a terminal. Use -f to force compression.');
 f.forEach(x=>{const n=get(x);if(!n)return bad(`gzip: ${x}: No such file or directory`);
  if(fl.has('d')){return C.gunzip([x])}
  if(n.t=='d')return bad(`gzip: ${x} is a directory -- ignored`);
  const[p,nm]=par(x);if(!SH.can(p,2))return bad(`gzip: ${x}: Permission denied`);
  const g=mkArc({[nm]:clone(n)},0.4);g.arc.single=true;p.c[nm+'.gz']=g;if(!fl.has('k'))delete p.c[nm]})};
C.gunzip=a=>{
 const f=a.filter(x=>x[0]!='-');if(!f.length)return bad('gzip: compressed data not read from a terminal.');
 f.forEach(x=>{const n=get(x);if(!n)return bad(`gzip: ${x}: No such file or directory`);if(!n.arc||!n.arc.single)return bad(`gzip: ${x}: not in gzip format`);
  const[p,nm]=par(x),out=nm.replace(/\.gz$/,''),orig=Object.values(n.arc.nodes)[0],nn=clone(orig);Object.assign(nn,SH.meta());nn.ts=Date.now();p.c[out]=nn;delete p.c[nm]})};
C.zcat=a=>{const n=get(a[0]||'');if(!n||!n.arc||!n.arc.single)return bad(`gzip: ${a[0]||''}: not in gzip format`);L(Object.values(n.arc.nodes)[0].c).forEach(l=>P(esc(l)))};
C.zip=a=>{
 const f=a.filter(x=>x[0]!='-');if(f.length<2)return bad('zip error: Nothing to do!');
 const nodes={};f.slice(1).forEach(s=>{const n=get(s);if(!n)return P(`\tzip warning: name not matched: ${esc(s)}`);nodes[s.replace(/^\/+/,'').replace(/\/$/,'')]=clone(n);listPaths(s.replace(/\/$/,''),n,[]).forEach(l=>P(`  adding: ${esc(l)} (${l.endsWith('/')?'stored 0%':'deflated 35%'})`))});
 const zn=f[0].endsWith('.zip')?f[0]:f[0]+'.zip',[p,nm]=par(zn);if(!p||!SH.can(p,2))return bad(`zip error: Could not create output file (${zn})`);p.c[nm]=mkArc(nodes,0.5)};
C.unzip=a=>{
 const f=a.filter(x=>x[0]!='-'),n=get(f[0]||'');if(!f.length)return bad('UnZip 6.00 of 20 April 2009, by Debian. Usage: unzip [-l] file[.zip]');
 if(!n)return bad(`unzip:  cannot find or open ${f[0]}, ${f[0]}.zip or ${f[0]}.ZIP.`);if(!n.arc)return bad(`End-of-central-directory signature not found.  Either this file is not\na zipfile, or it constitutes one disk of a multi-part archive.`);
 if(a.includes('-l')){P(`Archive:  ${esc(f[0])}\n  Length      Date    Time    Name\n---------  ---------- -----   ----`);Object.entries(n.arc.nodes).forEach(([k,x])=>listPaths(k,x,[]).forEach(l=>P(`${String(l.endsWith('/')?0:sizeOf(x)).padStart(9)}  2026-10-03 02:00   ${esc(l)}`)));return}
 P(`Archive:  ${esc(f[0])}`);const t=get('.');Object.entries(n.arc.nodes).forEach(([k,x])=>{const nn=clone(x);Object.assign(nn,SH.meta());nn.ts=Date.now();t.c[k.split('/').pop()]=nn;listPaths(k,x,[]).forEach(l=>P(`  ${l.endsWith('/')?'   creating':'  inflating'}: ${esc(l)}`))})};
})();
