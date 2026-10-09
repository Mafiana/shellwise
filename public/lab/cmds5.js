// cmds5.js - more everyday Linux commands (all simulated, nothing touches the real system)
(()=>{
'use strict';
const SH=window.SH,can=SH.can;
const flags=a=>{const s=new Set();a.forEach(x=>{if(/^-[A-Za-z]+$/.test(x))x.slice(1).split('').forEach(c=>s.add(c))});return s};
const args=a=>a.filter(x=>x[0]!='-'||x=='-');
const abs=p=>'/'+parts(p).join('/')||'/';
const put=(path,content,append)=>{
 const ps=parts(path),name=ps.pop();if(!name)return 'dir';let d=ROOT;
 for(const x of ps){d=d&&d.t=='d'?d.c[x]:null}
 if(!d||d.t!='d')return 'none';if(!can(d,2))return 'denied';
 const ex=d.c[name];if(ex&&ex.t=='d')return 'dir';
 if(ex){if(!can(ex,2))return 'denied';ex.c=append?ex.c+content:content;ex.ts=Date.now()}
 else d.c[name]=Object.assign(F(content),SH.meta(),{ts:Date.now()});
 return true};
const text=(f,c)=>{const t=rd(f,c);return t===null||t===undefined?null:t};
const isRoot=()=>SH.user()=='root';
const needRoot=c=>{if(isRoot())return true;bad(`${c}: Permission denied.`);return false};

// ---------- comparing and splitting ----------
function lcs(a,b){const n=a.length,m=b.length;if(n*m>4e6)return null;const t=Array.from({length:n+1},()=>new Uint16Array(m+1));
 for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)t[i][j]=a[i]==b[j]?t[i+1][j+1]+1:Math.max(t[i+1][j],t[i][j+1]);
 const ops=[];let i=0,j=0;while(i<n&&j<m){if(a[i]==b[j]){ops.push(['=',i,j]);i++;j++}else if(t[i+1][j]>=t[i][j+1]){ops.push(['-',i,j]);i++}else{ops.push(['+',i,j]);j++}}
 while(i<n)ops.push(['-',i++,j]);while(j<m)ops.push(['+',i,j++]);return ops}
C.diff=a=>{const fl=flags(a),f=args(a);if(f.length<2)return bad('diff: missing operand after \''+(f[0]||'diff')+'\'');
 const x=text(f[0],'diff'),y=text(f[1],'diff');if(x===null||y===null)return err=true;
 const A=L(x),B=L(y),ops=lcs(A,B);if(!ops)return bad('diff: files too large');
 if(!ops.some(o=>o[0]!='=')){return}
 err=true;if(fl.has('q'))return P(`Files ${esc(f[0])} and ${esc(f[1])} differ`);
 if(fl.has('u')){P(`--- ${esc(f[0])}\n+++ ${esc(f[1])}\n@@ -1,${A.length} +1,${B.length} @@`);ops.forEach(([o,i,j])=>P(o=='='?' '+esc(A[i]):o=='-'?`<span class=bad>-${esc(A[i])}</span>`:`<span class=ok>+${esc(B[j])}</span>`));return}
 let k=0;while(k<ops.length){if(ops[k][0]=='='){k++;continue}let s=k;while(k<ops.length&&ops[k][0]!='=')k++;
  const ch=ops.slice(s,k),del=ch.filter(o=>o[0]=='-'),add=ch.filter(o=>o[0]=='+');
  const r=(l,h)=>l.length?(l[0]+1==(h||l[0]+1)?`${l[0]+1}`:`${l[0]+1},${h}`):'';
  const ar=del.length?(del.length>1?`${del[0][1]+1},${del[del.length-1][1]+1}`:`${del[0][1]+1}`):`${ch[0][1]}`;
  const br=add.length?(add.length>1?`${add[0][2]+1},${add[add.length-1][2]+1}`:`${add[0][2]+1}`):`${ch[0][2]}`;
  P(`${ar}${del.length&&add.length?'c':del.length?'d':'a'}${br}`);
  del.forEach(o=>P('<span class=bad>&lt; '+esc(A[o[1]])+'</span>'));if(del.length&&add.length)P('---');add.forEach(o=>P('<span class=ok>&gt; '+esc(B[o[2]])+'</span>'))}};
C.cmp=a=>{const f=args(a);if(f.length<2)return bad('cmp: missing operand');const x=text(f[0],'cmp'),y=text(f[1],'cmp');if(x===null||y===null)return err=true;
 const n=Math.min(x.length,y.length);for(let i=0;i<n;i++)if(x[i]!=y[i]){err=true;return P(`${esc(f[0])} ${esc(f[1])} differ: byte ${i+1}, line ${x.slice(0,i).split('\n').length}`)}
 if(x.length!=y.length){err=true;P(`cmp: EOF on ${esc(x.length<y.length?f[0]:f[1])} after byte ${n}`)}};
C.comm=a=>{const fl=flags(a),f=args(a);if(f.length<2)return bad('comm: missing operand');const x=text(f[0],'comm'),y=text(f[1],'comm');if(x===null||y===null)return err=true;
 const A=L(x),B=L(y);let i=0,j=0;const out=[];const col=(c,s)=>{if(!fl.has(String(c)))out.push('\t'.repeat([1,2,3].filter(k=>k<c&&!fl.has(String(k))).length)+s)};
 while(i<A.length||j<B.length){if(j>=B.length||(i<A.length&&A[i]<B[j]))col(1,A[i++]);else if(i>=A.length||B[j]<A[i])col(2,B[j++]);else{col(3,A[i]);i++;j++}}
 out.forEach(l=>P(esc(l)))};
C.split=a=>{const fl=args(a);let n=1000,i=a.indexOf('-l');if(i>=0)n=+a[i+1]||1000;const f=a.filter((x,k)=>x[0]!='-'&&a[k-1]!='-l');
 if(!f.length)return bad('split: missing operand');const t=text(f[0],'split');if(t===null)return;const pre=f[1]||'x',ls=L(t);
 for(let k=0,p=0;k<ls.length;k+=n,p++){const nm=pre+String.fromCharCode(97+Math.floor(p/26))+String.fromCharCode(97+p%26);const r=put(nm,ls.slice(k,k+n).join('\n')+'\n');if(r!==true)return bad(`split: ${nm}: Permission denied`)}};
C.rev=a=>{const f=args(a);const t=f.length?text(f[0],'rev'):stdin;if(t===null)return;L(t).forEach(l=>P(esc([...l].reverse().join(''))))};
C.fold=a=>{let w=80,i=a.indexOf('-w');if(i>=0)w=Math.max(1,+a[i+1]||80);const f=a.filter((x,k)=>x[0]!='-'&&a[k-1]!='-w');const t=f.length?text(f[0],'fold'):stdin;if(t===null)return;
 L(t).forEach(l=>{if(!l)return P('');for(let k=0;k<l.length;k+=w)P(esc(l.slice(k,k+w)))})};
C.expand=a=>{const f=args(a);const t=f.length?text(f[0],'expand'):stdin;if(t===null)return;L(t).forEach(l=>P(esc(l.replace(/\t/g,'        '))))};
C.tee=a=>{const ap=a.includes('-a'),f=args(a);const t=stdin===null?'':stdin;P(esc(t.replace(/\n$/,'')));
 f.forEach(x=>{const r=put(x,t.endsWith('\n')||!t?t:t+'\n',ap);if(r!==true)bad(`tee: ${x}: ${r=='denied'?'Permission denied':'No such file or directory'}`)})};
C.less=C.more=a=>{const f=args(a);const t=f.length?text(f[0],'less'):stdin;if(t===null)return;L(t).forEach(l=>P(esc(l)))};
C.nl=C.nl;

// ---------- paths ----------
C.basename=a=>{const f=args(a);if(!f.length)return bad('basename: missing operand');let b=f[0].replace(/\/+$/,'').split('/').pop()||'/';if(f[1]&&b.endsWith(f[1])&&b!=f[1])b=b.slice(0,-f[1].length);P(esc(b))};
C.dirname=a=>{const f=args(a);if(!f.length)return bad('dirname: missing operand');f.forEach(p=>{const s=p.replace(/\/+$/,'');const i=s.lastIndexOf('/');P(esc(i<0?'.':i==0?'/':s.slice(0,i)))})};
C.realpath=C.readlink=a=>{const f=args(a);if(!f.length)return bad('realpath: missing operand');f.forEach(p=>{const ps=parts(p);const par='/'+ps.slice(0,-1).join('/');if(ps.length&&!get(par))return bad(`realpath: ${p}: No such file or directory`);P(esc(abs(p)))})};
C.mktemp=a=>{const d=a.includes('-d');const id=Array.from({length:10},()=>'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random()*62)]).join('');const p='/tmp/tmp.'+id;
 const tmp=get('/tmp');if(!tmp)return bad('mktemp: failed to create file via template ‘/tmp/tmp.XXXXXXXXXX’: No such file or directory');
 tmp.c['tmp.'+id]=Object.assign(d?D({}):F(''),SH.meta(),{ts:Date.now()});if(d)tmp.c['tmp.'+id].m='700';P(p)};

// ---------- looking inside files ----------
const bytes=s=>Array.from(new TextEncoder().encode(s));
const hx=n=>n.toString(16).padStart(2,'0');
C.xxd=a=>{const fl=flags(a),f=args(a);const t=f.length?text(f[0],'xxd'):stdin;if(t===null)return;const b=bytes(t);
 if(fl.has('p')){let s='';b.forEach(x=>s+=hx(x));return (s.match(/.{1,60}/g)||[]).forEach(l=>P(l))}
 for(let i=0;i<b.length;i+=16){const ch=b.slice(i,i+16);let h='';for(let k=0;k<16;k+=2){h+=(ch[k]!==undefined?hx(ch[k]):'  ')+(ch[k+1]!==undefined?hx(ch[k+1]):'  ')+' '}
  P(`${i.toString(16).padStart(8,'0')}: ${h} ${esc(ch.map(x=>x>=32&&x<127?String.fromCharCode(x):'.').join(''))}`)}};
C.hexdump=a=>{const f=args(a);const t=f.length?text(f[0],'hexdump'):stdin;if(t===null)return;const b=bytes(t);
 for(let i=0;i<b.length;i+=16){const ch=b.slice(i,i+16);let h='';for(let k=0;k<16;k++){h+=(ch[k]!==undefined?hx(ch[k]):'  ')+' ';if(k==7)h+=' '}
  P(`${i.toString(16).padStart(8,'0')}  ${h} |${esc(ch.map(x=>x>=32&&x<127?String.fromCharCode(x):'.').join(''))}|`)}
 P(b.length.toString(16).padStart(8,'0'))};
C.od=a=>{const f=args(a);const t=f.length?text(f[0],'od'):stdin;if(t===null)return;const b=bytes(t),fl=a.join(' ');
 for(let i=0;i<b.length;i+=16){const ch=b.slice(i,i+16);const cells=/-c/.test(fl)?ch.map(x=>x==10?' \\n':x==9?' \\t':x>=32&&x<127?'  '+String.fromCharCode(x):' '+x.toString(8).padStart(3,'0')):/tx1|-x/.test(fl)?ch.map(x=>' '+hx(x)):ch.map(x=>' '+x.toString(8).padStart(3,'0'));
  P((/-A\s*n|-An/.test(fl)?'':i.toString(8).padStart(7,'0'))+esc(cells.join('')))}
 if(!/-An/.test(fl))P(b.length.toString(8).padStart(7,'0'))};
C.strings=a=>{const f=args(a);const t=f.length?text(f[0],'strings'):stdin;if(t===null)return;(t.match(/[\x20-\x7e]{4,}/g)||[]).forEach(s=>P(esc(s)))};
const B32='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
C.base32=a=>{const dec=a.includes('-d'),f=args(a);const t=f.length?text(f[0],'base32'):stdin;if(t===null)return;
 if(!dec){let bits='';bytes(t.replace(/\n$/,'')).forEach(x=>bits+=x.toString(2).padStart(8,'0'));let o='';for(let i=0;i<bits.length;i+=5)o+=B32[parseInt(bits.slice(i,i+5).padEnd(5,'0'),2)];while(o.length%8)o+='=';P(o)}
 else{let bits='';t.replace(/[=\s]/g,'').toUpperCase().split('').forEach(c=>{const v=B32.indexOf(c);if(v>=0)bits+=v.toString(2).padStart(5,'0')});const out=[];for(let i=0;i+8<=bits.length;i+=8)out.push(parseInt(bits.slice(i,i+8),2));P(esc(new TextDecoder().decode(new Uint8Array(out))))}};
C.cksum=a=>{const f=args(a);const run=(t,nm)=>{let c=0;const b=bytes(t);const tbl=[];for(let i=0;i<256;i++){let r=i<<24;for(let j=0;j<8;j++)r=(r&0x80000000)?((r<<1)^0x04C11DB7):(r<<1);tbl[i]=r>>>0}
  for(const x of b)c=((c<<8)^tbl[((c>>>24)^x)&255])>>>0;let n=b.length;while(n>0){c=((c<<8)^tbl[((c>>>24)^(n&255))&255])>>>0;n=Math.floor(n/256)}c=(~c)>>>0;P(`${c} ${b.length}${nm?' '+esc(nm):''}`)};
 if(!f.length){if(stdin!==null)run(stdin,'');return}f.forEach(x=>{const t=text(x,'cksum');if(t!==null)run(t,x)})};

// ---------- time, limits, terminal ----------
C.time=a=>{if(!a.length)return;const t0=performance.now();SH.runCmd(a);const s=(performance.now()-t0)/1000;P(`\nreal\t0m${s.toFixed(3)}s\nuser\t0m0.00${Math.floor(Math.random()*9)}s\nsys\t0m0.00${Math.floor(Math.random()*9)}s`)};
C.timeout=a=>{const f=a.filter(x=>x[0]!='-');if(f.length<2)return bad('timeout: missing operand');if(!/^\d+(\.\d+)?[smhd]?$/.test(f[0]))return bad(`timeout: invalid time interval ‘${f[0]}’`);SH.runCmd(f.slice(1))};
C.ulimit=a=>{const fl=a.join(' ');const T={n:['open files','1024'],u:['max user processes','31337'],s:['stack size','8192'],f:['file size','unlimited'],t:['cpu time','unlimited'],v:['virtual memory','unlimited'],c:['core file size','0']};
 if(/-a/.test(fl))return Object.entries({'core file size (blocks, -c)':'0','file size (blocks, -f)':'unlimited','open files (-n)':'1024','stack size (kbytes, -s)':'8192','cpu time (seconds, -t)':'unlimited','max user processes (-u)':'31337','virtual memory (kbytes, -v)':'unlimited'}).forEach(([k,v])=>P(k.padEnd(32)+v));
 const m=fl.match(/-([nusftvc])/);P(m?T[m[1]][1]:'unlimited')};
C.vmstat=()=>P('procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----\n r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st\n 1  0      0 812340  61224 902118    0    0    42    18  120  240  2  1 97  0  0');
C.locale=()=>P('LANG=en_US.UTF-8\nLANGUAGE=\nLC_CTYPE="en_US.UTF-8"\nLC_NUMERIC="en_US.UTF-8"\nLC_TIME="en_US.UTF-8"\nLC_COLLATE="en_US.UTF-8"\nLC_MONETARY="en_US.UTF-8"\nLC_MESSAGES="en_US.UTF-8"\nLC_ALL=');
C.stty=a=>{if(a[0]=='size')return P('24 80');P('speed 38400 baud; rows 24; columns 80; line = 0;\nintr = ^C; quit = ^\\; erase = ^?; kill = ^U; eof = ^D; susp = ^Z;')};
C.tput=a=>{const m={cols:'80',lines:'24',colors:'256',longname:'xterm with 256 colors'};if(a[0]=='clear'||a[0]=='reset')return C.clear?C.clear([]):0;if(m[a[0]])P(m[a[0]])};
C.reset=()=>{if(C.clear)C.clear([])};
C.ncal=a=>C.cal?C.cal(a):0;
C.crontab=a=>{const fl=flags(a);if(fl.has('e'))return bad('crontab: no editor available in this lab (use nano /etc/crontab as root)');
 if(fl.has('l')){if(isRoot())return P('# m h  dom mon dow   command\n0 2 * * * /usr/bin/apt-get update\n30 3 * * 0 /usr/bin/tar -czf /root/backup.tar.gz /home/kali');return bad('no crontab for '+SH.user())}
 bad('usage: crontab [-l] [-e] [-r]')};

// ---------- user and group administration (root only, edits the simulated /etc files) ----------
const pw=()=>get('/etc/passwd'),gr=()=>get('/etc/group');
const uids=()=>L(pw().c).map(l=>+l.split(':')[2]).filter(n=>n>=1000&&n<60000);
const nameOk=n=>/^[a-z_][a-z0-9_-]{0,30}$/.test(n);
C.useradd=C.adduser=a=>{if(!needRoot(a.length?'useradd':'adduser'))return;const fl=flags(a);const f=a.filter((x,i)=>x[0]!='-'&&!['-s','-G','-d','-c'].includes(a[i-1]));const u=f[f.length-1];
 if(!u)return bad('Usage: useradd [options] LOGIN');if(!nameOk(u))return bad(`useradd: invalid user name '${u}'`);
 if(L(pw().c).some(l=>l.split(':')[0]==u))return bad(`useradd: user '${u}' already exists`);
 const id=Math.max(1000,...uids())+1,si=a.indexOf('-s'),sh=si>=0?a[si+1]:'/bin/sh';
 pw().c+=`${u}:x:${id}:${id}::/home/${u}:${sh}\n`;gr().c+=`${u}:x:${id}:\n`;
 if(fl.has('m')){get('/home').c[u]=Object.assign(D({}),{o:u,g:u,m:'755',ts:Date.now()})}
 const sd=get('/etc/shadow');if(sd)sd.c+=`${u}:!:19800:0:99999:7:::\n`;
 if(a[0]=='adduser'||C.__adduser)P(`Adding user \`${esc(u)}' ...`)};
C.userdel=a=>{if(!needRoot('userdel'))return;const u=args(a)[0];if(!u)return bad('Usage: userdel [options] LOGIN');
 if(u=='root'||u=='kali')return bad(`userdel: user ${u} is protected in this lab`);
 const ls=L(pw().c);if(!ls.some(l=>l.split(':')[0]==u))return bad(`userdel: user '${u}' does not exist`);
 pw().c=ls.filter(l=>l.split(':')[0]!=u).join('\n')+'\n';gr().c=L(gr().c).filter(l=>l.split(':')[0]!=u).join('\n')+'\n';
 const sd=get('/etc/shadow');if(sd)sd.c=L(sd.c).filter(l=>l.split(':')[0]!=u).join('\n')+'\n';
 if(flags(a).has('r')){delete get('/home').c[u]}};
C.groupadd=a=>{if(!needRoot('groupadd'))return;const g=args(a)[0];if(!g)return bad('Usage: groupadd [options] GROUP');if(!nameOk(g))return bad(`groupadd: '${g}' is not a valid group name`);
 if(L(gr().c).some(l=>l.split(':')[0]==g))return bad(`groupadd: group '${g}' already exists`);
 const ids=L(gr().c).map(l=>+l.split(':')[2]).filter(n=>n>=1000&&n<60000);gr().c+=`${g}:x:${Math.max(1000,...ids)+1}:\n`};
C.groupdel=a=>{if(!needRoot('groupdel'))return;const g=args(a)[0];if(!g)return bad('Usage: groupdel [options] GROUP');
 const ls=L(gr().c);if(!ls.some(l=>l.split(':')[0]==g))return bad(`groupdel: group '${g}' does not exist`);gr().c=ls.filter(l=>l.split(':')[0]!=g).join('\n')+'\n'};
C.usermod=a=>{if(!needRoot('usermod'))return;const f=args(a).filter((x,i)=>true);const u=a[a.length-1];const gi=a.indexOf('-G'),ag=a.includes('-a');
 if(gi<0)return bad('Usage: usermod [options] LOGIN');const g=a[gi+1];if(!ag)return bad('usermod: use -aG to add a group without removing the user from others (lab safety)');
 if(!L(pw().c).some(l=>l.split(':')[0]==u))return bad(`usermod: user '${u}' does not exist`);
 const ls=L(gr().c);let hit=false;const out=ls.map(l=>{const p=l.split(':');if(p[0]==g){hit=true;const m=p[3]?p[3].split(','):[];if(!m.includes(u))m.push(u);p[3]=m.join(',');return p.join(':')}return l});
 if(!hit)return bad(`usermod: group '${g}' does not exist`);gr().c=out.join('\n')+'\n'};
C.chage=a=>{const u=args(a).pop()||SH.user();if(a.includes('-l')){if(!isRoot()&&u!=SH.user())return bad('chage: Permission denied');
 P(`Last password change\t\t\t\t\t: Jun 18, 2026\nPassword expires\t\t\t\t\t: never\nPassword inactive\t\t\t\t\t: never\nAccount expires\t\t\t\t\t\t: never\nMinimum number of days between password change\t\t: 0\nMaximum number of days between password change\t\t: 99999\nNumber of days of warning before password expires\t: 7`);return}
 bad('Usage: chage -l LOGIN')};
C.groupmod=C.chsh=C.chfn=a=>bad('This change is not available in the lab.');

// ---------- version-only stubs for common tools ----------
const VER={python3:'Python 3.12.8',python:'Python 3.12.8',perl:'This is perl 5, version 40, subversion 1 (v5.40.1) built for x86_64-linux-gnu-thread-multi',gcc:'gcc (Debian 14.2.0-12) 14.2.0',make:'GNU Make 4.4.1',git:'git version 2.47.2',node:'v20.19.2',ruby:'ruby 3.3.5',curlx:''};
['python3','python','perl','gcc','make','git','node','ruby'].forEach(c=>{C[c]=a=>{if(a.includes('--version')||a.includes('-V')||a[0]=='-v')return P(esc(VER[c]));bad(`${c}: this lab only shows the version. Try: ${c} --version`)}});

// ---------- find: -perm, -user, -size, -mtime, -exec, -delete (replaces the basic one) ----------
const oldFind=C.find;
C.find=a=>{
 if(!a.some(x=>['-perm','-user','-size','-mtime','-exec','-delete','-newer','-group'].includes(x)))return oldFind(a);
 let start='.',i=0;if(a[0]&&a[0][0]!='-'){start=a[0];i=1}
 const ex={name:null,iname:null,type:null,max:99,empty:false,perm:null,user:null,group:null,size:null,mtime:null,exec:null,del:false};
 for(;i<a.length;i++){const x=a[i];
  if(x=='-name')ex.name=a[++i];else if(x=='-iname')ex.iname=a[++i];else if(x=='-type')ex.type=a[++i];else if(x=='-maxdepth')ex.max=+a[++i];
  else if(x=='-empty')ex.empty=true;else if(x=='-perm')ex.perm=a[++i];else if(x=='-user')ex.user=a[++i];else if(x=='-group')ex.group=a[++i];
  else if(x=='-size')ex.size=a[++i];else if(x=='-mtime')ex.mtime=a[++i];else if(x=='-print'||x=='-a')continue;else if(x=='-delete')ex.del=true;
  else if(x=='-exec'){const e=[];i++;while(i<a.length&&a[i]!=';'&&a[i]!='\\;'&&a[i]!='\\'&&a[i]!='+'){e.push(a[i]);i++}ex.exec=e}
  else if(x[0]=='-')return bad(`find: unknown predicate '${x}'`);}
 const rx=(p,ic)=>new RegExp('^'+p.replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*').replace(/\?/g,'.')+'$',ic?'i':'');
 const rn=ex.name&&rx(ex.name),ri=ex.iname&&rx(ex.iname,true);
 const n0=get(start);if(!n0)return bad(`find: ‘${start}’: No such file or directory`);
 const modeNum=c=>parseInt((SH.MODE(c)||'000').slice(-3),8)|(c.su?0o4000:0);
 const permOk=c=>{if(!ex.perm)return true;const m=ex.perm;if(m[0]=='-'){const w=parseInt(m.slice(1),8);return (modeNum(c)&w)==w}if(m[0]=='/'){const w=parseInt(m.slice(1),8);return (modeNum(c)&w)!=0}return modeNum(c)==parseInt(m,8)};
 const sizeOk=c=>{if(!ex.size)return true;const m=ex.size.match(/^([+-]?)(\d+)([ckMGb]?)$/);if(!m)return true;const u={c:1,k:1024,M:1048576,G:1073741824,b:512,'':512}[m[3]];const sz=c.t=='f'?c.c.length:4096;const blocks=Math.ceil(sz/u);const v=+m[2];return m[1]=='+'?blocks>v:m[1]=='-'?blocks<v:blocks==v};
 const mtOk=c=>{if(!ex.mtime)return true;const m=ex.mtime.match(/^([+-]?)(\d+)$/);if(!m)return true;const days=Math.floor((Date.now()-(c.ts||Date.now()))/864e5);const v=+m[2];return m[1]=='+'?days>v:m[1]=='-'?days<v:days==v};
 const test=(k,c)=>(!rn||rn.test(k))&&(!ri||ri.test(k))&&(!ex.type||(ex.type=='d'?c.t=='d':c.t=='f'))&&(!ex.empty||(c.t=='d'?!Object.keys(c.c).length:!c.c.length))&&permOk(c)&&(!ex.user||(c.o||'kali')==ex.user)&&(!ex.group||(c.g||c.o||'kali')==ex.group)&&sizeOk(c)&&mtOk(c);
 const hits=[];
 const w=(c,p,d)=>{if(c.t!='d'||d>=ex.max)return;if(!can(c,4)){bad(`find: ‘${p}’: Permission denied`);return}
  Object.keys(c.c).sort().forEach(k=>{BUD.tick();const q=(p=='/'?'':p.replace(/\/$/,''))+'/'+k;if(test(k,c.c[k]))hits.push([q,c,k]);w(c.c[k],q,d+1)})};
 if(test(start.split('/').filter(Boolean).pop()||start,n0))hits.push([start,null,null]);
 w(n0,start,0);
 hits.forEach(([q,par,k])=>{
  if(ex.del){if(par&&can(par,2))delete par.c[k];else bad(`find: cannot delete ‘${q}’: Permission denied`);return}
  if(ex.exec){SH.runCmd(ex.exec.map(t=>t=='{}'?q:t));return}
  P(esc(q))})};

// ---------- setuid files for the security audit lesson, cron file, man pages ----------
(()=>{
 const bin=get('/usr/bin');if(bin)['sudo','su','passwd','mount','umount','chsh','chfn','newgrp','gpasswd','pkexec'].forEach(n=>{const f=bin.c[n]||(bin.c[n]=Object.assign(F('#!/bin/sh\n# lab stub\n'),{ts:Date.now()}));f.o='root';f.g='root';f.m='755';f.su=true});
 const etc=get('/etc');if(etc&&!etc.c.crontab)etc.c.crontab=Object.assign(F('# /etc/crontab: system-wide crontab\nSHELL=/bin/sh\n# m h dom mon dow user  command\n17 *\t* * *\troot    cd / && run-parts --report /etc/cron.hourly\n25 6\t* * *\troot\ttest -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.daily )\n'),{o:'root',g:'root',m:'644',ts:Date.now()});
 const M=window.MAN;if(M)Object.assign(M,{
  diff:['compare files line by line','diff [OPTION]... FILE1 FILE2',[['-u','unified output'],['-q','only say whether files differ']],['diff notes.txt todo.txt','diff -u a.txt b.txt']],
  cmp:['compare two files byte by byte','cmp FILE1 FILE2',[],['cmp a.txt b.txt']],
  comm:['compare two sorted files line by line','comm [-123] FILE1 FILE2',[['-1','hide lines only in FILE1'],['-2','hide lines only in FILE2'],['-3','hide lines in both']],['comm -12 a.txt b.txt']],
  split:['split a file into pieces','split [-l LINES] FILE [PREFIX]',[['-l N','N lines per piece']],['split -l 5 notes.txt part_']],
  rev:['reverse each line','rev [FILE]',[],['echo kali | rev']],
  fold:['wrap long lines','fold [-w WIDTH] [FILE]',[['-w N','wrap at N columns']],['fold -w 20 notes.txt']],
  tee:['copy input to a file and to the screen','tee [-a] FILE',[['-a','append instead of overwrite']],['echo hi | tee out.txt']],
  basename:['strip the folder from a path','basename PATH [SUFFIX]',[],['basename /etc/passwd']],
  dirname:['strip the file name from a path','dirname PATH',[],['dirname /etc/passwd']],
  realpath:['print the absolute path','realpath FILE',[],['realpath ../notes.txt']],
  mktemp:['create a unique temporary file','mktemp [-d]',[['-d','make a folder instead']],['mktemp']],
  xxd:['show a hex dump of a file','xxd [-p] [FILE]',[['-p','plain hex only']],['echo hello | xxd']],
  hexdump:['show a hex dump','hexdump -C [FILE]',[['-C','canonical hex + ASCII']],['hexdump -C notes.txt']],
  od:['dump a file in octal, hex or characters','od [-c|-tx1] [FILE]',[['-c','show characters'],['-tx1','show hex bytes']],['echo hi | od -c']],
  strings:['print readable text found in a file','strings FILE',[],['strings /usr/bin/ls']],
  base32:['encode or decode Base32','base32 [-d] [FILE]',[['-d','decode']],['echo kali | base32']],
  cksum:['print a CRC checksum','cksum [FILE]',[],['cksum notes.txt']],
  time:['time how long a command takes','time COMMAND',[],['time ls']],
  timeout:['run a command with a time limit','timeout DURATION COMMAND',[],['timeout 5 ping -c 1 localhost']],
  ulimit:['show or set resource limits','ulimit [-a] [-n]',[['-a','show all limits'],['-n','open files']],['ulimit -n']],
  vmstat:['report memory, CPU and IO statistics','vmstat',[],['vmstat']],
  locale:['show language and region settings','locale',[],['locale']],
  crontab:['view scheduled jobs','crontab -l',[['-l','list jobs']],['crontab -l','cat /etc/crontab']],
  useradd:['create a user (root only)','useradd [-m] [-s SHELL] LOGIN',[['-m','create a home folder'],['-s','login shell']],['sudo useradd -m alice']],
  userdel:['delete a user (root only)','userdel [-r] LOGIN',[['-r','remove the home folder too']],['sudo userdel -r alice']],
  usermod:['change a user (root only)','usermod -aG GROUP LOGIN',[['-aG','add to a group']],['sudo usermod -aG sudo alice']],
  groupadd:['create a group (root only)','groupadd GROUP',[],['sudo groupadd devs']],
  groupdel:['delete a group (root only)','groupdel GROUP',[],['sudo groupdel devs']],
  chage:['show password ageing','chage -l LOGIN',[['-l','list ageing info']],['chage -l kali']]})
})();
})();
