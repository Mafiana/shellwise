// cmds3.js - network commands and defensive/diagnostic tools (all simulated)
(()=>{
'use strict';
const SH=window.SH,{SVC,PROCS}=SH,drip=SH.drip;
const flagsOf=a=>{const s=new Set();a.forEach(x=>{if(/^-[A-Za-z]+$/.test(x))x.slice(1).split('').forEach(c=>s.add(c))});return s};
const hashN=h=>{let x=7;for(const c of h)x=(x*31+c.charCodeAt(0))>>>0;return x};
const fip=h=>{if(/^\d+\.\d+\.\d+\.\d+$/.test(h))return h;if(h=='localhost')return'127.0.0.1';const x=hashN(h);return`${x%200+20}.${(x>>8)%250}.${(x>>16)%250}.${(x>>4)%250+1}`};
const isLocal=h=>/^(127\.|localhost$|10\.0\.2\.15$|kali$)/.test(h);
const valid=h=>/^\d+\.\d+\.\d+\.\d+$/.test(h)||h.includes('.')||h=='localhost'||h=='kali';
const LAB='<span class=dim>(simulated output)</span>';
C.ping=a=>{
 const ci=a.indexOf('-c'),cnt=ci>=0?Math.max(1,Math.min(10,+a[ci+1]||4)):4,h=a.filter((x,i)=>x[0]!='-'&&i!=(ci>=0?ci+1:-1))[0];
 if(!h)return bad('ping: usage error: Destination address required');
 if(!valid(h))return bad(`ping: ${h}: Name or service not known`);
 const ip=fip(h),loc=isLocal(h),ttl=loc?64:ip=='8.8.8.8'?117:54,t=[];
 const L1=[`PING ${esc(h)} (${ip}) 56(84) bytes of data.`];
 for(let i=1;i<=cnt;i++){const ms=loc?Math.random()*.08+.02:Math.random()*25+8;t.push(ms);L1.push(`64 bytes from ${h==ip?ip:esc(h)+' ('+ip+')'}: icmp_seq=${i} ttl=${ttl} time=${ms.toFixed(loc?3:1)} ms`)}
 const mn=Math.min(...t),mx=Math.max(...t),av=t.reduce((s,x)=>s+x,0)/t.length;
 L1.push(`\n--- ${esc(h)} ping statistics ---\n${cnt} packets transmitted, ${cnt} received, 0% packet loss, time ${(cnt-1)*1001}ms\nrtt min/avg/max/mdev = ${mn.toFixed(3)}/${av.toFixed(3)}/${mx.toFixed(3)}/${((mx-mn)/2).toFixed(3)} ms`);
 drip(L1,loc?250:450)};
C.ifconfig=()=>P('eth0: flags=4163&lt;UP,BROADCAST,RUNNING,MULTICAST&gt;  mtu 1500\n        inet 10.0.2.15  netmask 255.255.255.0  broadcast 10.0.2.255\n        inet6 fe80::a00:27ff:feab:cdef  prefixlen 64  scopeid 0x20&lt;link&gt;\n        ether 08:00:27:ab:cd:ef  txqueuelen 1000  (Ethernet)\n        RX packets 2153  bytes 1893441 (1.8 MiB)\n        TX packets 1472  bytes 187215 (182.8 KiB)\n\nlo: flags=73&lt;UP,LOOPBACK,RUNNING&gt;  mtu 65536\n        inet 127.0.0.1  netmask 255.0.0.0\n        inet6 ::1  prefixlen 128  scopeid 0x10&lt;host&gt;\n        loop  txqueuelen 1000  (Local Loopback)');
C.ip=a=>{const s=a.join(' ');
 if(/^r/.test(a[0]||''))return P('default via 10.0.2.2 dev eth0 proto dhcp src 10.0.2.15 metric 100\n10.0.2.0/24 dev eth0 proto kernel scope link src 10.0.2.15 metric 100');
 if(/-br/.test(s))return P('lo               UNKNOWN        127.0.0.1/8 ::1/128\neth0             UP             10.0.2.15/24 fe80::a00:27ff:feab:cdef/64');
 if(/^l/.test(a[0]||''))return P('1: lo: &lt;LOOPBACK,UP,LOWER_UP&gt; mtu 65536 state UNKNOWN\n    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00\n2: eth0: &lt;BROADCAST,MULTICAST,UP,LOWER_UP&gt; mtu 1500 state UP\n    link/ether 08:00:27:ab:cd:ef brd ff:ff:ff:ff:ff:ff');
 P('1: lo: &lt;LOOPBACK,UP,LOWER_UP&gt; mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000\n    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00\n    inet 127.0.0.1/8 scope host lo\n       valid_lft forever preferred_lft forever\n2: eth0: &lt;BROADCAST,MULTICAST,UP,LOWER_UP&gt; mtu 1500 qdisc fq_codel state UP group default qlen 1000\n    link/ether 08:00:27:ab:cd:ef brd ff:ff:ff:ff:ff:ff\n    inet 10.0.2.15/24 brd 10.0.2.255 scope global dynamic noprefixroute eth0\n       valid_lft 86350sec preferred_lft 86350sec')};
C.route=()=>P('Kernel IP routing table\nDestination     Gateway         Genmask         Flags Metric Ref    Use Iface\ndefault         10.0.2.2        0.0.0.0         UG    100    0        0 eth0\n10.0.2.0        0.0.0.0         255.255.255.0   U     100    0        0 eth0');
C.arp=()=>P('Address                  HWtype  HWaddress           Flags Mask            Iface\n10.0.2.2                 ether   52:54:00:12:35:02   C                     eth0\n10.0.2.3                 ether   52:54:00:12:35:03   C                     eth0');
const listeners=()=>Object.keys(SVC).filter(k=>SVC[k].on&&SVC[k].port).map(k=>[SVC[k].port,k]);
C.netstat=C.ss=a=>{const p=flagsOf(a).has('p');P('Proto Recv-Q Send-Q Local Address           Foreign Address         State'+(p?'       PID/Program name':''));
 listeners().forEach(([port,k])=>{const pr=PROCS.find(x=>x.svc==k);P(`tcp        0      0 0.0.0.0:${String(port).padEnd(15)} 0.0.0.0:*               LISTEN${p&&pr?'      '+pr.pid+'/'+SVC[k].svc:''}`)});P('tcp        0      0 127.0.0.1:631           0.0.0.0:*               LISTEN')};
C.traceroute=a=>{const h=a[0];if(!h)return bad('Specify "host" missing argument.');if(!valid(h))return bad(`${h}: Name or service not known`);
 const L1=[`traceroute to ${esc(h)} (${fip(h)}), 30 hops max, 60 byte packets`];for(let i=1;i<=5;i++)L1.push(` ${i}  ${i<5?'10.'+i+'.0.1':fip(h)}  ${(Math.random()*9+1).toFixed(3)} ms  ${(Math.random()*9+1).toFixed(3)} ms  ${(Math.random()*9+1).toFixed(3)} ms`);drip(L1,300)};
C.nslookup=a=>a[0]?valid(a[0])?P(`Server:\t\t10.0.2.3\nAddress:\t10.0.2.3#53\n\nNon-authoritative answer:\nName:\t${esc(a[0])}\nAddress: ${fip(a[0])}`):bad(`** server can't find ${a[0]}: NXDOMAIN`):bad('nslookup: missing host');
C.dig=a=>{const h=a.find(x=>x[0]!='-'&&x[0]!='@');if(!h)return bad('dig: missing host');P(`; &lt;&lt;&gt;&gt; DiG 9.20.2-Debian &lt;&lt;&gt;&gt; ${esc(h)}\n;; Got answer:\n;; status: ${valid(h)?'NOERROR':'NXDOMAIN'}, id: 41212\n\n;; QUESTION SECTION:\n;${esc(h)}.\t\t\tIN\tA\n`+(valid(h)?`\n;; ANSWER SECTION:\n${esc(h)}.\t300\tIN\tA\t${fip(h)}\n`:'')+`\n;; Query time: 21 msec\n;; SERVER: 10.0.2.3#53(10.0.2.3)`)};
C.host=a=>a[0]?P(`${esc(a[0])} has address ${fip(a[0])}`):bad('Usage: host [-aCdilrTvVw] [-c class] [-N ndots] [-t type] [-W time]');
C.whois=a=>a[0]?P(`Domain Name: ${esc(a[0]).toUpperCase()}\nRegistrar: Simulated Registrar Inc.\nCreation Date: 2010-01-01T00:00:00Z\nName Server: NS1.EXAMPLE.NET\n${LAB}`):bad('whois: missing domain');
C.ssh=a=>{const h=a.find(x=>x[0]!='-');if(!h)return bad('usage: ssh [-options] [user@]hostname [command]');const host=h.split('@').pop();
 if(isLocal(host)&&SVC.ssh.on)return P(`The authenticity of host '${esc(host)} (127.0.0.1)' can't be established.\nED25519 key fingerprint is SHA256:simulated.\n<span class=dim>(a real login is not possible in the browser)</span>`);
 bad(`ssh: connect to host ${host} port 22: ${isLocal(host)?'Connection refused':'Connection timed out'}`)};
C.nc=C.netcat=a=>{const fl=flagsOf(a),p=a.filter(x=>x[0]!='-');if(p.length<2||!fl.has('z'))return bad('In this lab nc only checks ports on the local machine.\nusage: nc -zv HOST PORT');
 const port=+p[1],h=p[0];if(!isLocal(h))return bad('nc: the simulator only checks ports on this lab machine (127.0.0.1)');
 listeners().some(x=>x[0]==port)?P(`Connection to ${esc(h)} ${port} port [tcp/*] succeeded!`):bad(`nc: connect to ${h} port ${port} (tcp) failed: Connection refused`)};
C.curl=a=>{
 const fl=flagsOf(a),oi=a.indexOf('-o'),u=a.find((x,i)=>x[0]!='-'&&i!=oi+1);if(!u)return bad("curl: try 'curl --help' or 'curl --manual' for more information");
 const host=u.replace(/^https?:\/\//,'').split('/')[0].split(':')[0];
 if(!valid(host))return bad(`curl: (6) Could not resolve host: ${host}`);
 if(isLocal(host)&&!SVC.apache2.on)return bad(`curl: (7) Failed to connect to ${host} port 80 after 0 ms: Couldn't connect to server`);
 const body=isLocal(host)?'<!DOCTYPE html>\n<html><head><title>Apache2 Debian Default Page: It works</title></head>\n<body><h1>It works!</h1></body></html>':host=='example.com'?'<html><head><title>Example Domain</title></head>\n<body><h1>Example Domain</h1><p>This domain is for use in illustrative examples.</p></body></html>':`<html><body>Simulated response from ${host}</body></html>`;
 const hdr=`HTTP/1.1 200 OK\nDate: ${new Date().toUTCString()}\nServer: ${isLocal(host)?'Apache/2.4.62 (Debian)':'nginx'}\nContent-Type: text/html; charset=UTF-8\nContent-Length: ${body.length}`;
 if(oi>=0){const[p,nm]=par(a[oi+1]||'');if(p&&SH.can(p,2)){p.c[nm]=Object.assign(F(body+'\n'),SH.meta(),{ts:Date.now()})}return}
 if(fl.has('I'))return P(esc(hdr));if(fl.has('i'))P(esc(hdr)+'\n');P(esc(body))};
C.wget=a=>{const u=a.find(x=>x[0]!='-');if(!u)return bad('wget: missing URL\nUsage: wget [OPTION]... [URL]...');const host=u.replace(/^https?:\/\//,'').split('/')[0];
 if(!valid(host))return bad(`wget: unable to resolve host address '${host}'`);
 const nm=u.split('/').filter(Boolean).slice(1).pop()||'index.html',t=get('.');if(!SH.can(t,2))return bad(`${nm}: Permission denied`);
 const n=Object.assign(F(`simulated download of ${u}\n`),SH.meta(),{ts:Date.now()});t.c[nm]=n;const d=new Date().toISOString().slice(0,19).replace('T',' ');
 drip([`--${d}--  ${esc(u)}`,`Resolving ${esc(host)}... ${fip(host)}`,`Connecting to ${esc(host)}|${fip(host)}|:80... connected.`,'HTTP request sent, awaiting response... 200 OK',`Length: ${n.c.length} [text/plain]`,`Saving to: '${esc(nm)}'`,`\n${esc(nm)}   100%[===================>]   ${n.c.length}  --.-KB/s    in 0s\n\n${d} (1.2 MB/s) - '${esc(nm)}' saved [${n.c.length}/${n.c.length}]`],220)};
// nmap: this lab only scans the local simulated machine
const SERV={22:['ssh','OpenSSH 9.7p1 Debian 7'],80:['http','Apache httpd 2.4.62 ((Debian))'],5432:['postgresql','PostgreSQL DB 16.3'],3306:['mysql','MariaDB 11.4.2']};
C.nmap=a=>{
 const fl=a.filter(x=>x[0]=='-').join(' '),pi=a.indexOf('-p'),pl=pi>=0?(a[pi+1]||'').split(',').map(Number):null,t=a.filter((x,i)=>x[0]!='-'&&i!=(pi>=0?pi+1:-1))[0];
 if(!t)return bad('nmap: no target specified\nWARNING: No targets were specified, so 0 hosts scanned.');
 if(!isLocal(t))return bad(`This simulator only scans the local lab machine (127.0.0.1 / localhost).\nIn real life, only scan systems you own or have written permission to test.`);
 const sv=/-sV|-A/.test(fl),L1=['Starting Nmap 7.95 ( https://nmap.org ) at '+new Date().toISOString().slice(0,16).replace('T',' ')+' WAT',`Nmap scan report for ${esc(t)}`,'Host is up (0.00011s latency).'];
 if(/-sn/.test(fl)){L1.push('Nmap done: 1 IP address (1 host up) scanned in 0.03 seconds');return drip(L1,200)}
 let open=listeners().map(x=>x[0]);if(pl)open=open.filter(p=>pl.includes(p));
 const closed=Math.max(0,(pl?pl.length:1000)-open.length);
 if(!open.length&&!pl)L1.push('All 1000 scanned ports on '+esc(t)+' are closed');
 else{if(closed)L1.push(`Not shown: ${closed} closed tcp ports (conn-refused)`);L1.push(`PORT     STATE SERVICE${sv?'    VERSION':''}`);
  open.forEach(p=>{const s=SERV[p]||['unknown',''];L1.push(`${(p+'/tcp').padEnd(8)} <span class=ok>open</span>  ${s[0].padEnd(sv?10:7)}${sv?s[1]:''}`)});
  if(pl)pl.filter(p=>!open.includes(p)).forEach(p=>L1.push(`${(p+'/tcp').padEnd(8)} <span class=bad>closed</span> ${(SERV[p]||['unknown'])[0]}`))}
 L1.push('\nNmap done: 1 IP address (1 host up) scanned in 0.08 seconds',LAB);drip(L1,150)};
// ----- defensive / diagnostic tools -----
const hashType=h=>/^\$2[aby]\$/.test(h)?['bcrypt']:/^\$6\$/.test(h)?['SHA-512 Crypt']:/^\$1\$/.test(h)?['MD5 Crypt']:/^[a-f0-9]{32}$/i.test(h)?['MD5','MD4','NTLM']:/^[a-f0-9]{40}$/i.test(h)?['SHA-1','RIPEMD-160']:/^[a-f0-9]{64}$/i.test(h)?['SHA-256','GOST R 34.11-94']:/^[a-f0-9]{128}$/i.test(h)?['SHA-512','Whirlpool']:null;
C.hashid=a=>{const h=a.find(x=>x[0]!='-');if(!h)return bad('usage: hashid [-h] [-e] [-m] [-j] [-o FILE] [--version] INPUT');const r=hashType(h);P(`Analyzing '${esc(h)}'`);if(!r)return P('[+] Unknown hash');r.forEach(x=>P(`[+] ${x}`));P('<span class=dim>Tip: MD5 and SHA-1 are too fast and weak for storing passwords. Use bcrypt or Argon2.</span>')};
C.openssl=a=>{
 if(a[0]=='version')return P('OpenSSL 3.3.2 3 Sep 2024 (Library: OpenSSL 3.3.2 3 Sep 2024)');
 if(a[0]=='rand'){const n=+a[a.length-1]||8,b=crypto.getRandomValues(new Uint8Array(n));return P(a.includes('-hex')?[...b].map(x=>x.toString(16).padStart(2,'0')).join(''):btoa(String.fromCharCode(...b)))}
 if(a[0]=='dgst'){const al=a.find(x=>/^-(md5|sha1|sha256)$/.test(x)),f=a[a.length-1],t=rd(f,'openssl');if(t===null||!al)return;const k=al.slice(1);return P(`${k.toUpperCase()}(${esc(f)})= ${HASH[k](t)}`)}
 bad("Invalid command '"+(a[0]||'')+"'; type \"help\" for a list.\nTry: openssl version | rand -hex 8 | dgst -sha256 FILE")};
C.exiftool=a=>{const f=a[0],n=f&&get(f);if(!n||n.t!='f')return bad(`File not found: ${f||''}`);P(`ExifTool Version Number         : 12.76\nFile Name                       : ${esc(f.split('/').pop())}\nFile Size                       : ${n.c.length} bytes\nFile Permissions                : ${SH.permStr(n)}\nFile Type                       : ${/^#!/.test(n.c)?'SH':'TXT'}\nMIME Type                       : text/plain\nNewlines                        : Unix LF\nLine Count                      : ${(n.c.match(/\n/g)||[]).length}\nWord Count                      : ${n.c.split(/\s+/).filter(Boolean).length}`)};
})();
