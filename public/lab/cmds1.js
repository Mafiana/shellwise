// cmds1.js - files, permissions and text tools (replaces the simple versions)
(()=>{
'use strict';
const SH=window.SH,can=SH.can,MODE=SH.MODE;
const flagsOf=(a,long)=>{const s=new Set();a.forEach(x=>{if(/^--/.test(x)){const m=(long||{})[x];if(m)s.add(m)}else if(/^-[A-Za-z0-9]+$/.test(x)&&!/^-\d+$/.test(x))x.slice(1).split('').forEach(c=>s.add(c))});return s};
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fdate=ts=>{const d=new Date(ts),old=Date.now()-ts>15552000000;return`${MON[d.getMonth()]} ${String(d.getDate()).padStart(2)} ${old?' '+d.getFullYear():String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}`};
const nsz=n=>n.t=='f'?n.c.length:4096;
const hsz=b=>b<1024?String(b):b<1048576?(b/1024).toFixed(b<10240?1:0)+'K':(b/1048576).toFixed(1)+'M';
const permStr=n=>{let s=(n.t=='d'?'d':'-')+MODE(n).split('').map(d=>((d&4)?'r':'-')+((d&2)?'w':'-')+((d&1)?'x':'-')).join('');if(n.su)s=s.slice(0,3)+(s[3]=='x'?'s':'S')+s.slice(4);return s};
const isArc=s=>/\.(tar|gz|tgz|zip|bz2|xz|7z)$/.test(s);
function stamp(n){if(!n.ts)n.ts=Date.now();return n.ts}
function nameFmt(n,name,F){
 let cls='',suf='';
 if(n.t=='d'){cls='d';suf='/'}else if(isArc(name))cls='ar';else if(/[1357]/.test(MODE(n)[0]))cls='x',suf='*';
 const t=esc(name)+(F?suf:'');return cls?`<span class=${cls}>${t}</span>`:t}
SH.nameFmt=nameFmt;SH.permStr=permStr;SH.fdate=fdate;SH.hsz=hsz;
const cols=()=>{const t=document.getElementById('term'),w=(t.clientWidth||900)-30,fs=parseFloat(getComputedStyle(t).fontSize)||14;return Math.max(20,Math.floor(w/(fs*0.6)))};
const skey=s=>s.replace(/^\./,'').toLowerCase();
const sortNames=(k,n,fl)=>{
 if(fl.has('U'))return k;
 if(fl.has('t'))k.sort((x,y)=>stamp(n.c[y])-stamp(n.c[x]));
 else if(fl.has('S'))k.sort((x,y)=>nsz(n.c[y])-nsz(n.c[x]));
 else k.sort((x,y)=>skey(x)<skey(y)?-1:skey(x)>skey(y)?1:0);
 if(fl.has('r'))k.reverse();return k};
function lsDir(n,label,fl,pathShown){
 let k=Object.keys(n.c);
 if(!fl.has('a')&&!fl.has('A'))k=k.filter(x=>x[0]!='.');
 sortNames(k,n,fl);
 const ent=k.map(x=>[x,n.c[x]]);
 if(fl.has('a'))ent.unshift(['.',n],['..',n]);
 if(fl.has('l')){
  const rows=ent.map(([x,c])=>({m:permStr(c),o:c.o||'kali',g:c.g||c.o||'kali',s:fl.has('h')?hsz(nsz(c)):String(nsz(c)),d:fdate(stamp(c)),nm:nameFmt(c,x,fl.has('F')),l:c.t=='d'?2+Object.values(c.c).filter(v=>v.t=='d').length:1}));
  const w=f=>Math.max(...rows.map(r=>String(r[f]).length),1);
  const wl=w('l'),wo=w('o'),wg=w('g'),ws=w('s');
  P(`total ${Math.max(0,ent.reduce((s,[,c])=>s+Math.max(4,Math.ceil(nsz(c)/4096)*4),0))}`);
  rows.forEach(r=>P(`${r.m} ${String(r.l).padStart(wl)} ${r.o.padEnd(wo)} ${r.g.padEnd(wg)} ${r.s.padStart(ws)} ${r.d} ${r.nm}`));return}
 if(!ent.length)return;
 if(cap!==null||fl.has('1')){ent.forEach(([x,c])=>P(nameFmt(c,x,fl.has('F'))));return}
 const names=ent.map(([x,c])=>x+(fl.has('F')?(c.t=='d'?'/':/[1357]/.test(MODE(c)[0])?'*':''):'')),mx=Math.max(...names.map(s=>s.length))+2,C0=Math.max(1,Math.floor(cols()/mx)),rows=Math.ceil(ent.length/C0),lines=[];
 for(let r=0;r<rows;r++){let line='';for(let c=0;c<C0;c++){const i=c*rows+r;if(i>=ent.length)break;const[x,cn]=ent[i];line+=nameFmt(cn,x,fl.has('F'))+(c<C0-1&&(c+1)*rows+r<ent.length?' '.repeat(mx-names[i].length):'')}lines.push(line)}
 P(lines.join('\n'))}
C.ls=a=>{
 const fl=flagsOf(a,{'--all':'a','--almost-all':'A','--human-readable':'h','--reverse':'r','--recursive':'R'});
 const paths=a.filter(x=>x[0]!='-');if(!paths.length)paths.push('.');
 const files=[],dirs=[];
 for(const p of paths){const n=get(p);
  if(!n){bad(`ls: cannot access '${p}': No such file or directory`);continue}
  if(n.t=='d'&&!fl.has('d')){if(!can(n,4)){bad(`ls: cannot open directory '${p}': Permission denied`);continue}dirs.push([p,n])}else files.push([p,n])}
 files.forEach(([p,n])=>{if(fl.has('l'))P(`${permStr(n)} 1 ${n.o||'kali'} ${n.g||n.o||'kali'} ${nsz(n)} ${fdate(stamp(n))} ${nameFmt(n,p,fl.has('F'))}`);else P(nameFmt(n,p,fl.has('F')))});
 const walk=(p,n,first)=>{if((paths.length>1||files.length||fl.has('R'))&&!(first&&paths.length==1&&!fl.has('R')))P((first?'':'')+esc(p)+':');lsDir(n,p,fl);
  if(fl.has('R'))Object.keys(n.c).filter(k=>n.c[k].t=='d'&&(fl.has('a')||k[0]!='.')).sort().forEach(k=>{if(can(n.c[k],4)){P('');walk((p=='/'?'':p.replace(/\/$/,''))+'/'+k,n.c[k],false)}})};
 dirs.forEach(([p,n],i)=>{if(i>0||files.length)P('');walk(p,n,i==0&&!files.length)})};
C.cd=a=>{
 let t=a[0]||'~';if(t=='-'){t=ENV.OLDPWD||cwd;P(esc(t))}
 if(t=='~'||t.startsWith('~/'))t=SH.HOME()+t.slice(1);
 const n=get(t);if(!n)return bad(`bash: cd: ${a[0]}: No such file or directory`);
 if(n.t!='d')return bad(`bash: cd: ${a[0]}: Not a directory`);
 if(!can(n,1))return bad(`bash: cd: ${a[0]}: Permission denied`);
 ENV.OLDPWD=cwd;cwd='/'+parts(t).join('/');setP()};
// ----- reading -----
const numFlag=a=>{let k=10,f=[];for(let i=0;i<a.length;i++){const x=a[i];if(x=='-n'||x=='--lines')k=+a[++i];else if(/^-n\d+$/.test(x))k=+x.slice(2);else if(/^-\d+$/.test(x))k=+x.slice(1);else if(x[0]!='-'||x=='-')f.push(x)}return[k,f]};
C.cat=a=>{
 const fl=flagsOf(a),f=a.filter(x=>x[0]!='-');let n=0;
 const out=t=>L(t).forEach(l=>P((fl.has('n')?String(++n).padStart(6)+'\t':'')+esc(l)+(fl.has('A')?'$':'')));
 if(!f.length){if(stdin!==null)out(stdin);return}
 f.forEach(x=>{const t=rd(x,'cat');if(t!==null)out(t)})};
C.less=C.more=C.cat;
C.head=a=>{const[k,f]=numFlag(a);if(!f.length){if(stdin!==null)L(stdin).slice(0,k).forEach(l=>P(esc(l)));return}f.forEach((x,i)=>{const t=rd(x,'head');if(t===null)return;if(f.length>1)P((i?'\n':'')+`==> ${esc(x)} <==`);L(t).slice(0,k).forEach(l=>P(esc(l)))})};
C.tail=a=>{const fl=a.filter(x=>x=='-f'),[k,f]=numFlag(a.filter(x=>x!='-f'));
 const go=(t,x,i)=>{if(f.length>1)P((i?'\n':'')+`==> ${esc(x)} <==`);L(t).slice(-k).forEach(l=>P(esc(l)))};
 if(!f.length){if(stdin!==null)go(stdin,'',0);return}
 f.forEach((x,i)=>{const t=rd(x,'tail');if(t!==null)go(t,x,i)});
 if(fl.length)P('<span class=dim>(tail -f would keep watching; stopped in this simulator)</span>')};
C.tac=a=>{const t=rd(a.find(x=>x[0]!='-'),'tac');if(t!==null)L(t).reverse().forEach(l=>P(esc(l)))};
C.shuf=a=>{const t=rd(a.find(x=>x[0]!='-'),'shuf');if(t!==null)L(t).sort(()=>Math.random()-.5).forEach(l=>P(esc(l)))};
C.paste=a=>{const f=a.filter(x=>x[0]!='-').map(x=>L(rd(x,'paste')||'')),m=Math.max(0,...f.map(x=>x.length));for(let i=0;i<m;i++)P(f.map(x=>esc(x[i]||'')).join('\t'))};
C.column=a=>{const t=rd(a.find(x=>x[0]!='-'&&!/^.$/.test(x)&&x!=a[a.indexOf('-s')+1]),'column');if(t===null)return;const si=a.indexOf('-s'),sep=si>=0?a[si+1]:null,rows=L(t).map(l=>sep?l.split(sep):l.trim().split(/\s+/));
 if(!a.includes('-t'))return rows.forEach(r=>P(esc(r.join(' '))));
 const w=[];rows.forEach(r=>r.forEach((c,i)=>w[i]=Math.max(w[i]||0,c.length)));rows.forEach(r=>P(esc(r.map((c,i)=>i<r.length-1?c.padEnd(w[i]+2):c).join(''))))};
C.nl=a=>{const t=rd(a.find(x=>x[0]!='-'),'nl');if(t!==null)L(t).forEach((l,i)=>P(`${String(i+1).padStart(6)}\t${esc(l)}`))};
C.sort=a=>{
 const fl=flagsOf(a),f=[];let k=0,sep=null;
 for(let i=0;i<a.length;i++){if(a[i]=='-k')k=+a[++i];else if(a[i]=='-t')sep=a[++i];else if(a[i][0]!='-')f.push(a[i])}
 const t=rd(f[0],'sort');if(t===null)return;
 const key=l=>k?(sep?l.split(sep):l.trim().split(/\s+/))[k-1]||'':l;
 let l=L(t).sort((x,y)=>fl.has('n')?parseFloat(key(x))-parseFloat(key(y))||0:key(x)<key(y)?-1:key(x)>key(y)?1:0);
 if(fl.has('u'))l=l.filter((x,i)=>i==0||key(x)!==key(l[i-1]));
 if(fl.has('r'))l.reverse();l.forEach(x=>P(esc(x)))};
C.wc=a=>{
 const fl=flagsOf(a),f=a.filter(x=>x[0]!='-');const one=(t,nm)=>{const o=[];const lc=(t.match(/\n/g)||[]).length,wc=t.split(/\s+/).filter(Boolean).length;
  if(fl.has('l'))o.push(lc);if(fl.has('w'))o.push(wc);if(fl.has('c'))o.push(t.length);if(!o.length)o.push(lc,wc,t.length);P(o.join(' ')+(nm?' '+esc(nm):''))};
 if(!f.length){if(stdin!==null)one(stdin,'');return}f.forEach(x=>{const t=rd(x,'wc');if(t!==null)one(t,x)})};
// ----- grep -----
C.grep=a=>{
 const fl=new Set(),pos=[];let A=0,B=0;
 for(let i=0;i<a.length;i++){const x=a[i];
  if(x=='-A'||x=='-B'||x=='-C'){const v=+a[++i];if(x!='-B')A=v;if(x!='-A')B=v;continue}
  if(/^-[A-Za-z]+$/.test(x))x.slice(1).split('').forEach(c=>fl.add(c));
  else if(x=='--color=auto'||x=='--color')continue;else pos.push(x)}
 if(!pos.length)return bad('Usage: grep [OPTION]... PATTERNS [FILE]...');
 const pat=pos[0];let re;
 try{re=new RegExp(fl.has('F')?pat.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'):fl.has('w')?'\\b(?:'+pat+')\\b':pat,fl.has('i')?'gi':'g')}catch(e){return bad('grep: Unmatched ( or \\(')}
 let files=pos.slice(1);const rec=fl.has('r')||fl.has('R');
 if(!files.length&&rec)files=['.'];
 const targets=[];
 const addT=(p,n)=>{if(n.t=='f')targets.push([p,n]);else if(rec)Object.keys(n.c).sort().forEach(k=>addT(p.replace(/\/$/,'')+'/'+k,n.c[k]))};
 if(files.length){files.forEach(f=>{const n=get(f);if(!n)return bad(`grep: ${f}: No such file or directory`);if(n.t=='d'&&!rec)return bad(`grep: ${f}: Is a directory`);addT(f,n)})}
 else targets.push(['(standard input)',{c:stdin||''}]);
 const multi=(targets.length>1||rec)&&!fl.has('h');let any=false;
 for(const[p,n]of targets){
  if(n.t&&!can(n,4)){bad(`grep: ${p}: Permission denied`);continue}
  const ls=L(n.c),pre=(i,sep)=>(multi?`<span class=fn>${esc(p)}</span><span class=sp>${sep}</span>`:'')+(fl.has('n')?`<span class=ok>${i+1}</span><span class=sp>${sep}</span>`:'');
  const hit=ls.map(l=>{re.lastIndex=0;return re.test(l)!=fl.has('v')});
  const cnt=hit.filter(Boolean).length;if(cnt)any=true;
  if(fl.has('q'))continue;
  if(fl.has('l')){if(cnt)P(`<span class=fn>${esc(p)}</span>`);continue}
  if(fl.has('c')){P((multi?esc(p)+':':'')+cnt);continue}
  const show=new Set();hit.forEach((h,i)=>{if(h)for(let j=Math.max(0,i-B);j<=Math.min(ls.length-1,i+A);j++)show.add(j)});
  let lastI=-2;
  [...show].sort((x,y)=>x-y).forEach(i=>{if((A||B)&&lastI>=0&&i>lastI+1)P('<span class=sp>--</span>');lastI=i;
   if(fl.has('o')&&hit[i]){re.lastIndex=0;(ls[i].match(re)||[]).forEach(m=>P(pre(i,':')+`<span class=bad>${esc(m)}</span>`));return}
   const body=hit[i]&&!fl.has('v')?esc(ls[i]).replace(new RegExp(re.source,re.flags),m=>`<span class=bad>${m}</span>`):esc(ls[i]);
   P(pre(i,hit[i]?':':'-')+body)})}
 if(!any)err=true};
C.egrep=a=>C.grep(a);C.fgrep=a=>C.grep(['-F',...a]);
// ----- find -----
C.find=a=>{
 let start='.',i=0;if(a[0]&&a[0][0]!='-'){start=a[0];i=1}
 const ex={name:null,iname:null,type:null,max:99,empty:false,size:null};
 for(;i<a.length;i++){const x=a[i];
  if(x=='-name')ex.name=a[++i];else if(x=='-iname')ex.iname=a[++i];else if(x=='-type')ex.type=a[++i];
  else if(x=='-maxdepth')ex.max=+a[++i];else if(x=='-empty')ex.empty=true;else if(x=='-print'){}
  else if(x[0]=='-')return bad(`find: unknown predicate '${x}'`)}
 const rx=(p,ic)=>new RegExp('^'+p.replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*').replace(/\?/g,'.')+'$',ic?'i':'');
 const rn=ex.name&&rx(ex.name),ri2=ex.iname&&rx(ex.iname,true);
 const n=get(start);if(!n)return bad(`find: '${start}': No such file or directory`);
 const test=(k,c)=>(!rn||rn.test(k))&&(!ri2||ri2.test(k))&&(!ex.type||(ex.type=='d'?c.t=='d':c.t=='f'))&&(!ex.empty||(c.t=='d'?!Object.keys(c.c).length:!c.c.length));
 const w=(c,p,d)=>{if(c.t!='d'||d>=ex.max)return;if(!can(c,4)){bad(`find: '${p}': Permission denied`);return}
  Object.keys(c.c).sort().forEach(k=>{const q=(p=='/'?'':p.replace(/\/$/,''))+'/'+k;if(test(k,c.c[k]))P(esc(q));w(c.c[k],q,d+1)})};
 if(test(start.split('/').filter(Boolean).pop()||start,n)&&(!rn||rn.test(start.split('/').pop())))P(esc(start));
 w(n,start,0)};
C.xargs=a=>{if(stdin===null)return;const toks=stdin.split(/\s+/).filter(Boolean);const cmd=a.length?a:['echo'];SH.runCmd([...cmd,...toks])};
// ----- stat / file / tree / du / df -----
C.stat=a=>{a.filter(x=>x[0]!='-').forEach(x=>{const n=get(x);if(!n)return bad(`stat: cannot statx '${x}': No such file or directory`);
 const ts=stamp(n),d=new Date(ts),iso=d.toISOString().replace('T',' ').replace('Z','000000 +0000');
 P(`  File: ${esc(x)}\n  Size: ${String(nsz(n)).padEnd(10)}\tBlocks: ${String(Math.max(8,Math.ceil(nsz(n)/4096)*8)).padEnd(10)} IO Block: 4096   ${n.t=='d'?'directory':n.c.length?'regular file':'regular empty file'}\nDevice: 8,1\tInode: ${262144+(x.length*977)%9000}      Links: 1\nAccess: (0${MODE(n)}/${permStr(n)})  Uid: ( ${(n.o||'kali')=='root'?'   0':'1000'}/ ${(n.o||'kali').padStart(7)})   Gid: ( ${(n.g||n.o||'kali')=='root'?'   0':'1000'}/ ${(n.g||n.o||'kali').padStart(7)})\nAccess: ${iso}\nModify: ${iso}\nChange: ${iso}\n Birth: -`)})};
C.file=a=>a.filter(x=>x[0]!='-').forEach(f=>{const n=get(f);let r;
 if(!n)r='cannot open (No such file or directory)';else if(n.t=='d')r='directory';
 else if(n.arc)r=/\.zip$/.test(f)?'Zip archive data, at least v2.0 to extract':/\.gz$/.test(f)&&!/\.tar\.gz$|\.tgz$/.test(f)?'gzip compressed data, from Unix':/\.tar\.gz$|\.tgz$/.test(f)?'gzip compressed data, from Unix':'POSIX tar archive (GNU)';
 else if(!n.c.length)r=/[1357]/.test(MODE(n)[0])?'ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked':'empty';
 else if(/^#!/.test(n.c))r='Bourne-Again shell script, ASCII text executable';else r='ASCII text';
 P(esc(f)+': '+r)});
C.tree=a=>{
 const fl=flagsOf(a),p=a.find(x=>x[0]!='-')||'.',n=get(p);if(!n||n.t!='d')return bad(`${esc(p)} [error opening dir]`);
 let nd=0,nf=0;const dl=a.indexOf('-L'),mx=dl>=0?+a[dl+1]:99;
 P(`<span class=d>${esc(p)}</span>`);
 const w=(c,pre,d)=>{if(d>=mx||!can(c,4))return;const k=Object.keys(c.c).filter(x=>fl.has('a')||x[0]!='.').sort((x,y)=>skey(x)<skey(y)?-1:1);
  k.forEach((x,i)=>{const l=i==k.length-1;P(pre+(l?'└── ':'├── ')+nameFmt(c.c[x],x));if(c.c[x].t=='d'){nd++;w(c.c[x],pre+(l?'    ':'│   '),d+1)}else nf++})};
 w(n,'',0);P(`\n${nd} director${nd==1?'y':'ies'}, ${nf} file${nf==1?'':'s'}`)};
C.du=a=>{const fl=flagsOf(a),p=a.find(x=>x[0]!='-')||'.',n=get(p);if(!n)return bad(`du: cannot access '${p}': No such file or directory`);
 const sz=c=>c.t=='f'?c.c.length:4096+Object.values(c.c).reduce((s,x)=>s+sz(x),0),fmt=b=>fl.has('h')?hsz(b):Math.ceil(b/1024);
 if(fl.has('s')||n.t=='f')return P(fmt(sz(n))+'\t'+esc(p));
 const w=(c,q)=>{if(c.t!='d')return;Object.keys(c.c).sort().forEach(k=>w(c.c[k],q+'/'+k));P(fmt(sz(c))+'\t'+esc(q))};w(n,p)};
C.df=a=>{const h=a.includes('-h')||a.includes('-H');P(h?'Filesystem      Size  Used Avail Use% Mounted on\nudev            1.9G     0  1.9G   0% /dev\ntmpfs           390M  1.1M  389M   1% /run\n/dev/sda1        40G   12G   26G  32% /\ntmpfs           1.9G     0  1.9G   0% /dev/shm\ntmpfs           5.0M     0  5.0M   0% /run/lock\ntmpfs           390M   48K  390M   1% /run/user/1000':'Filesystem     1K-blocks     Used Available Use% Mounted on\nudev             1963764        0   1963764   0% /dev\n/dev/sda1       41152736 12582912  27262976  32% /\ntmpfs            1983212        0   1983212   0% /dev/shm')};
// ----- permissions -----
function parseMode(spec,n){
 if(/^[0-7]{3,4}$/.test(spec))return spec.slice(-3);
 let d=MODE(n).split('').map(Number);
 for(const cl of spec.split(',')){const m=cl.match(/^([ugoa]*)([-+=])([rwxX]*)$/);if(!m)return null;
  const who=m[1]||'a',bits=(m[3].includes('r')?4:0)|(m[3].includes('w')?2:0)|(m[3].includes('x')||(m[3].includes('X')&&n.t=='d')?1:0);
  ['u','g','o'].forEach((c,i)=>{if(who.includes(c)||who.includes('a')){d[i]=m[2]=='+'?d[i]|bits:m[2]=='-'?d[i]&~bits:bits}})}
 return d.join('')}
C.chmod=a=>{
 const rest=a.filter(x=>x!='-R'&&x!='-v'&&x!='--recursive'),rec=a.includes('-R');
 if(rest.length<2)return bad(rest.length?`chmod: missing operand after '${rest[0]}'\nTry 'chmod --help' for more information.`:'chmod: missing operand\nTry \'chmod --help\' for more information.');
 const spec=rest[0];
 const apply=(n,x)=>{const m=parseMode(spec,n);if(!m)return bad(`chmod: invalid mode: '${spec}'\nTry 'chmod --help' for more information.`);n.m=m;if(rec&&n.t=='d')Object.values(n.c).forEach(c=>apply(c,x))};
 rest.slice(1).forEach(x=>{const n=get(x);if(!n)return bad(`chmod: cannot access '${x}': No such file or directory`);
  if(SH.user()!='root'&&(n.o||'kali')!=SH.user())return bad(`chmod: changing permissions of '${x}': Operation not permitted`);apply(n,x)})};
const chownLike=(c)=>a=>{
 const f=a.filter(x=>x[0]!='-');if(f.length<2)return bad(`${c}: missing operand`);
 const[o,g]=f[0].split(':');
 f.slice(1).forEach(x=>{const n=get(x);if(!n)return bad(`${c}: cannot access '${x}': No such file or directory`);
  if(SH.user()!='root')return bad(`${c}: changing ownership of '${x}': Operation not permitted`);
  if(c=='chown'&&o)n.o=o;if(c=='chown'&&g)n.g=g;if(c=='chgrp')n.g=f[0]})};
C.chown=chownLike('chown');C.chgrp=chownLike('chgrp');
let UMASK='0022';
C.umask=a=>{if(a[0]&&/^[0-7]{3,4}$/.test(a[0]))UMASK=a[0].padStart(4,'0');else P(UMASK)};
// ----- awk / sed -----
C.awk=a=>{
 let fs=null,prog=null,file=null;
 for(let i=0;i<a.length;i++){const x=a[i];if(x=='-F')fs=a[++i];else if(/^-F./.test(x))fs=x.slice(2);else if(prog===null)prog=x;else file=x}
 if(prog===null)return bad('usage: awk [-F fs] \'program\' [file ...]');
 const t=rd(file,'awk');if(t===null)return;
 const mEnd=prog.match(/^\s*END\s*\{\s*print\s+(.*?)\s*\}\s*$/);
 const m=prog.match(/^\s*(?:\/(.*?)\/|(NR)\s*(==|>=|<=|>|<|!=)\s*(\d+)|\$(\d+)\s*(==|!=|~)\s*"?([^"\s]*)"?)?\s*(?:\{\s*print\s*(.*?)\s*\})?\s*$/);
 const lines=L(t);
 const val=(e,f,line,nr)=>{e=e.trim();if(e=='$0')return line;if(e=='NF')return String(f.length);if(e=='NR')return String(nr);if(e=='$NF')return f[f.length-1]||'';let mm;if((mm=e.match(/^\$(\d+)$/)))return f[+mm[1]-1]||'';if((mm=e.match(/^"(.*)"$/)))return mm[1];return e};
 const split=l=>fs===null||fs==' '?l.trim().split(/\s+/):fs.length>1&&fs!='\\t'?l.split(new RegExp(fs)):l.split(fs=='\\t'?'\t':fs);
 if(mEnd){const w=mEnd[1].trim();return P(esc(w=='NR'?String(lines.length):w=='NF'?'0':w.replace(/"/g,'')))}
 if(!m)return bad('awk: syntax error (this simulator supports print, /regex/, NR and $N conditions)');
 lines.forEach((line,i)=>{const f=split(line),nr=i+1;let ok=true;
  if(m[1]!==undefined)ok=new RegExp(m[1]).test(line);
  else if(m[2]){const v=+m[4];ok={'==':nr==v,'>=':nr>=v,'<=':nr<=v,'>':nr>v,'<':nr<v,'!=':nr!=v}[m[3]]}
  else if(m[5]){const v=f[+m[5]-1]||'';ok=m[6]=='=='?v==m[7]:m[6]=='!='?v!=m[7]:new RegExp(m[7]).test(v)}
  if(!ok)return;
  const pr=m[8];if(pr===undefined||pr==='')return P(esc(line));
  P(esc(pr.split(/\s*,\s*/).map(e=>val(e,f,line,nr)).join(' ')))})};
C.sed=a=>{
 const fl=flagsOf(a.filter(x=>x!='-e')),args=a.filter(x=>x[0]!='-'||x=='-');let scr=null,file=null;
 for(const x of args){if(scr===null)scr=x;else file=x}
 if(scr===null)return bad('Usage: sed [OPTION]... {script-only-if-no-other-script} [input-file]...');
 const t=rd(file,'sed');if(t===null)return;let ls=L(t);
 let m;
 if((m=scr.match(/^s(.)(.*?)\1(.*?)\1([gi]*)$/))){const re=new RegExp(m[2],(m[4].includes('g')?'g':'')+(m[4].includes('i')?'i':''));ls=ls.map(l=>l.replace(re,m[3].replace(/&/g,'$&')));if(!fl.has('n'))ls.forEach(l=>P(esc(l)));return}
 if((m=scr.match(/^(\d+)(?:,(\d+))?([pd])$/))){const s=+m[1],e=m[2]?+m[2]:s;ls.forEach((l,i)=>{const hit=i+1>=s&&i+1<=e;if(m[3]=='p'){if(fl.has('n')?hit:true)P(esc(l));if(!fl.has('n')&&hit)P(esc(l))}else if(!hit)P(esc(l))});return}
 if((m=scr.match(/^\/(.*)\/([pd])$/))){const re=new RegExp(m[1]);ls.forEach(l=>{const hit=re.test(l);if(m[2]=='d'){if(!hit)P(esc(l))}else if(fl.has('n')?hit:true){P(esc(l));if(hit&&!fl.has('n'))P(esc(l))}});return}
 bad(`sed: -e expression #1, char 1: unknown command: \`${scr[0]}'`)};
// ----- cp/mv/rm/touch/mkdir keep the originals but record owner and time -----
const oldMk=C.mkdir,oldTouch=C.touch,oldCp=C.cp;
const own=(parent,names)=>names.forEach(k=>{const n=parent.c[k];if(n&&!n.o){Object.assign(n,SH.meta());n.ts=Date.now()}});
C.mkdir=a=>{oldMk(a);a.filter(x=>x[0]!='-').forEach(x=>{const n=get(x);if(n&&!n.o){Object.assign(n,SH.meta());n.ts=Date.now()}})};
C.touch=a=>{const f=a.filter(x=>x[0]!='-');if(!f.length)return bad('touch: missing file operand');f.forEach(x=>{oldTouch([x]);const n=get(x);if(n&&!n.o)Object.assign(n,SH.meta());if(n)n.ts=Date.now()})};
C.rm=a=>{
 const fl=flagsOf(a),f=a.filter(x=>x[0]!='-');if(!f.length)return bad('rm: missing operand\nTry \'rm --help\' for more information.');
 f.forEach(x=>{if(x=='/'||x=='~'){return bad(`rm: it is dangerous to operate recursively on '${x}'\nrm: use --no-preserve-root to override this failsafe`)}
  const[p,nm]=par(x);if(!p||!p.c[nm]){if(!fl.has('f'))bad(`rm: cannot remove '${x}': No such file or directory`);return}
  if(p.c[nm].t=='d'&&!fl.has('r')&&!fl.has('R'))return bad(`rm: cannot remove '${x}': Is a directory`);
  if(!can(p,2))return bad(`rm: cannot remove '${x}': Permission denied`);delete p.c[nm]})};
})();
