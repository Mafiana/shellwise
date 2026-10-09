// games2.js - "which command?" question bank (also feeds module quizzes) and 6 module-based games
(()=>{
'use strict';
const {shell,stat,finish,alive,again,sprint,shuf,pick,mark,GL}=window.GH;

// [module index, question, answer, wrong options, why]
const SC=[
[0,'Which command shows exactly where you are in the filesystem?','pwd','whoami|date|hostname','pwd prints the working directory, your exact location.'],
[0,'You opened a terminal and feel lost. Which command tells you the folder you are in?','pwd','ls|id|cal','pwd = print working directory.'],
[1,'Which command lists the files in the current folder?','ls','pwd|cat|cd','ls lists directory contents.'],
[1,'Which command shows hidden files too?','ls -a','ls -l|ls -h|pwd','Hidden names start with a dot; -a (all) reveals them.'],
[2,'Which command moves you into the Documents folder?','cd Documents','ls Documents|pwd Documents|cat Documents','cd changes directory.'],
[2,'Which command takes you back to your home folder from anywhere?','cd ~','cd ..|cd /|ls ~','~ is shorthand for your home folder.'],
[3,'Which command prints the contents of a text file?','cat','ls|cd|mkdir','cat prints a file to the screen.'],
[3,'Which command shows only the first lines of a file?','head','tail|tac|wc','head prints the start of a file.'],
[4,'Which command creates a new folder?','mkdir','touch|rm|cd','mkdir = make directory.'],
[4,'Which command creates an empty file?','touch','mkdir|cat|ls','touch makes an empty file (or updates its time).'],
[5,'Which command copies a file?','cp','mv|rm|ls','cp = copy.'],
[5,'Which command renames or moves a file?','mv','cp|rm|cat','mv moves, and renaming is just moving to a new name.'],
[5,'Which command deletes a file?','rm','mv|cp|cd','rm = remove.'],
[6,'Which command searches inside a file for a word?','grep','find|ls|cd','grep searches text.'],
[7,'Which command shows the kernel and system information?','uname -a','pwd|ls -a|date','uname prints system information.'],
[8,'Which command checks which ports are open on your own lab machine?','nmap 127.0.0.1','ping -a|ls 127.0.0.1|cat nmap','nmap scans ports. Only scan systems you own.'],
[9,'Which command shows a summary of your system with a logo?','neofetch','whoami|lsblk|cal','neofetch prints OS, kernel, memory and more.'],
[10,'Which command finds a file by its name anywhere in a folder tree?','find','grep|cat|head','find searches the filesystem for names.'],
[11,'Which symbol sends the output of one command into another?','|','>|&|*','The pipe connects output to input.'],
[11,'Which command counts lines, words and characters?','wc','sort|cut|tr','wc = word count.'],
[12,'Which command shows how much memory is free?','free -h','df -h|du -sh|lsblk','free reports RAM and swap.'],
[13,'Which command shows a file\'s size, owner and timestamps in detail?','stat','pwd|date|echo','stat prints full file details.'],
[14,'Which command shows your IP address?','ip a','ls -a|pwd|cal','ip a lists network interfaces and addresses.'],
[14,'Which command checks whether another machine answers?','ping','cat|mkdir|cut','ping sends test packets.'],
[15,'Which command encodes text as Base64?','base64','md5sum|tar|cut','base64 encodes and decodes.'],
[16,'Which command refreshes the list of available software?','sudo apt update','apt-cache|ls -a|sudo cat','apt update downloads the latest package lists.'],
[16,'Why do you put sudo before apt install?','Installing changes the whole system','It makes it faster|It hides output|It is required for ls','Only admins can change system files.'],
[17,'Which command replaces words in text without opening an editor?','sed','cat|ls|cut','sed edits text as it flows through.'],
[18,'Which command changes who may read, write or run a file?','chmod','chown|ls|cd','chmod sets permissions.'],
[18,'Which command changes who OWNS a file?','chown','chmod|chgrp -r|mv','chown changes the owner.'],
[19,'Which command checks whether the SSH service is running?','systemctl status ssh','ls ssh|cat ssh|ps ssh','systemctl manages services.'],
[20,'Which command lists disks and partitions?','lsblk','lscpu|lsusb|free','lsblk = list block devices.'],
[21,'Which command packs a folder into a compressed archive?','tar -czf','tar -xzf|tar -tf|gzip -d','c = create, z = gzip, f = file.'],
[22,'Which command runs a shell script called hello.sh?','bash hello.sh','cat hello.sh|ls hello.sh|cd hello.sh','bash runs the script.'],
[23,'Which file records login attempts on Kali?','/var/log/auth.log','/etc/hosts|/tmp/log|/home/kali','auth.log holds authentication events.'],
[23,'Which command shows failed login attempts?','lastb','last|who|date','lastb lists bad login attempts (needs root).'],
[24,'Which command tells you what type of hash you have?','hashid','md5sum|sed|base64','hashid identifies hash types.'],
[25,'Which command shows the routing table?','ip route','ip a|ls route|pwd','The routing table shows where traffic goes.'],
[26,'Which command turns a domain name into an IP address?','host','cat|df|top','host does a DNS lookup.'],
[27,'Which command shows listening network ports?','ss -tuln','ls -tuln|cat -tuln|date -tuln','ss lists sockets.'],
[28,'Which command prints the current date and time?','date','cal|uptime|id','date prints the time.'],
[28,'Which command shows how long the system has been running?','uptime','date|hostname|who','uptime shows time up and load.'],
[29,'Which command shows the name of this machine?','hostname','whoami|id|date','hostname prints the machine name.'],
[29,'Which command shows which user you are logged in as?','whoami','hostname|pwd|uptime','whoami prints your username.'],
[29,'Which command shows your user ID and groups?','id','pwd|cal|ls','id lists UID, GID and groups.'],
[29,'Which command shows who is logged in right now?','who','whoami|id|ls','who lists current sessions.'],
[30,'Which command creates an environment variable?','export','cat|mkdir|cut','export makes a variable available to programs.'],
[30,'Which command lists all environment variables?','env','ls|top|cal','env prints the environment.'],
[31,'Which command shows the commands you typed before?','history','date|last|who','history lists past commands.'],
[32,'Which command checks whether a file exists?','test -f file','cat -f file|ls -f file|cd -f file','test -f is true for a regular file.'],
[33,'Which keyword repeats commands for each item in a list?','for','if|echo|cd','for ... do ... done is a loop.'],
[33,'Which command prints the numbers 1 to 5?','seq 1 5','ls 1 5|cat 1 5|date 1 5','seq prints number ranges.'],
[34,'Which command lists installed packages?','dpkg -l','ls -l|apt -l|cat -l','dpkg manages Debian packages.'],
[35,'Which command opens the manual for ls?','man ls','ls man|cat ls|help me','man shows manual pages.'],
[35,'Which command gives a one-line summary of a command?','whatis','whoami|which|where','whatis prints a short description.'],
[35,'Which command shows where a program is installed?','which','who|whatis|what','which prints the program path.'],
[36,'Which command creates a SHA-256 fingerprint of a file?','sha256sum','md5|sha256|hashfile','sha256sum prints the hash.'],
[37,'Which command shows how big a folder is?','du -sh','df -h|free -h|ls -a','du = disk usage.'],
[37,'Which command shows free space on your disks?','df -h','du -sh|free -h|lsusb','df = disk free.'],
[37,'Which command draws folders as a tree?','tree','top|cd|pwd','tree shows a folder structure.'],
[38,'Which symbol writes command output into a file?','>','|&|*','> sends output to a file (replacing it).'],
[38,'Which symbol ADDS output to the end of a file?','>>','>|||','>> appends.'],
[39,'Which command pauses for 5 seconds?','sleep 5','wait 5|pause 5|stop 5','sleep waits.'],
[39,'Which command keeps a program running after you log out?','nohup','nice|sleep|jobs','nohup ignores the hang-up signal.'],
[19,'Which command shows running processes?','ps aux','ls aux|cat aux|cd aux','ps aux lists every process.'],
[19,'Which command stops a process by its ID?','kill','rm|stop|cd','kill sends a signal to a process ID.'],
[10,'Which command finds every .txt file under your home folder?','find ~ -name "*.txt"','ls ~ *.txt|cat ~ .txt|grep ~ .txt','find with -name matches file names.'],
[6,'Which flag makes grep ignore upper and lower case?','-i','-v|-c|-n','-i = ignore case.'],
[11,'Which command sorts lines alphabetically?','sort','cut|head|wc','sort orders lines.'],
[11,'Which command removes duplicate neighbouring lines?','uniq','tac|cut|sed','uniq collapses repeats (sort first).'],
[18,'Which command makes a script runnable?','chmod +x script.sh','cat script.sh|ls script.sh|cd script.sh','+x adds the execute permission.'],
[1,'Which command lists files with sizes and owners?','ls -l','ls -a|ls -r|pwd','-l is the long format.'],
[3,'Which command shows the last lines of a file?','tail','head|cat -h|ls','tail prints the end of a file.'],
[12,'Which command shows live CPU and memory use?','top','ls|cat|cd','top updates continuously. Press q to quit.'],
[14,'Which command shows your network interfaces and addresses?','ifconfig','pwd|df|tar','ifconfig (or ip a) shows interfaces.'],
[16,'Which command removes an installed package?','sudo apt remove','sudo apt update|sudo rm apt|apt list','apt remove uninstalls a package.']
];
// share the bank with the module quizzes (3-option format: question, answer, two wrong)
SC.forEach(s=>{const w=s[3].split('|');if(Q[s[0]])Q[s[0]].push([s[1],s[2],w[0],w[1]])});

const mcq=(id,title,bank,n,goal,qf,ctx)=>{
 const set=shuf(bank).slice(0,n);let i=0,sc=0;
 const show=()=>{
  if(i>=set.length){const ok=sc>=goal;finish(id,ok,sc,sc==set.length?10:ok?5:0);shell(id,title,`<div class="fb ${ok?'ok':'bad'}">${sc} of ${set.length} correct. ${ok?'Great work!':'Goal is '+goal+'. Review the answers and try again.'}</div>`+again(id));mark(id);stat(`${sc}/${set.length}`);return}
  const q=qf(set[i]);const opts=shuf([q.a,...q.w]);
  shell(id,title,`<p class=dim>${ctx}</p><div class=sq>${q.q}</div><div class=opts2>${opts.map(o=>`<button class=opt data-o="${encodeURIComponent(o)}">${esc(o)}</button>`).join('')}</div><div id=mf></div>`);mark(id);stat(`Question ${i+1} of ${set.length} · ${sc} correct`);
  document.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{const v=decodeURIComponent(b.dataset.o),ok=v==q.a;document.querySelectorAll('.opt').forEach(x=>{x.disabled=true;if(decodeURIComponent(x.dataset.o)==q.a)x.classList.add('right');else if(x==b)x.classList.add('wrong')});
   if(ok){sc++;beep(1100,.08)}else beep(200,.2);
   document.getElementById('mf').innerHTML=`<div class="fb ${ok?'ok':'bad'}">${ok?'✔ Correct':'✘ Not quite'}. ${esc(q.why)}</div><button class=btn id=nx>${i+1>=set.length?'Results':'Next ›'}</button>`;
   const nx=document.getElementById('nx');nx.onclick=()=>{i++;show()};nx.focus()});
 };
 show()};

// 1. Which Command?
GAMES.whichcmd=()=>mcq('whichcmd','Which Command?',SC,10,7,s=>({q:esc(s[1]),a:s[2],w:s[3].split('|'),why:s[4]+' (Module '+(s[0]+1)+')'}),'Pick the command for the job. Questions come from all modules.');

// 2. Flag Finder
const FL=[
['ls -a','Shows hidden files too'],['ls -l','Shows a long list with permissions and sizes'],['ls -t','Sorts by modification time'],['ls -R','Lists folders and everything inside them'],
['rm -r','Removes a folder and its contents'],['cp -r','Copies a folder and its contents'],['mkdir -p','Creates parent folders as needed'],['grep -i','Ignores upper and lower case'],
['grep -v','Shows lines that do NOT match'],['grep -c','Counts the matching lines'],['grep -n','Shows line numbers'],['grep -r','Searches inside every file in a folder'],
['head -n 3','Shows only the first 3 lines'],['tail -f','Follows a file as it grows'],['sort -n','Sorts numbers by value'],['sort -r','Sorts in reverse order'],
['uniq -c','Counts how many times each line repeats'],['wc -l','Counts lines'],['df -h','Shows disk space in readable sizes'],['du -sh','Shows one readable total for a folder'],
['free -h','Shows memory in readable sizes'],['tar -czf','Creates a compressed archive'],['tar -xzf','Extracts a compressed archive'],['tar -tf','Lists what is inside an archive'],
['ping -c 4','Sends exactly 4 packets'],['history -c','Clears the command history'],['find -name','Looks for files by name'],['find -type d','Looks only for folders'],
['chmod +x','Makes a file executable'],['ps aux','Lists every running process'],['ss -tuln','Lists listening TCP and UDP ports'],['date +%Y','Prints just the year'],
['sudo -l','Lists what you may run as admin'],['cut -d, -f2','Prints the 2nd comma-separated column'],['tr a-z A-Z','Turns lowercase into uppercase'],['nl','Numbers the lines of a file']];
GAMES.flags=()=>mcq('flags','Flag Finder',FL,10,7,f=>{const w=shuf(FL.filter(x=>x[0]!=f[0])).slice(0,3).map(x=>x[1]);return {q:`What does <code>${esc(f[0])}</code> do?`,a:f[1],w,why:f[0]+' → '+f[1]+'.'}},'Flags change what a command does. Know your options.');

// 3. Error Doctor
const ER=[
['cat: notes.txt: No such file or directory','The file is not in this folder (check pwd and ls)',['You lack permission','The disk is full','cat is not installed']],
['bash: gobble: command not found','The command is mistyped or not installed',['The file is locked','You are offline','The folder is empty']],
['cat: secret.txt: Permission denied','Your user may not read that file (check ls -l, chmod or sudo)',['The file does not exist','The file is empty','The terminal is full']],
['mkdir: cannot create directory ‘lab’: File exists','A file or folder called lab is already there',['You are not root','The disk is read-only','The name is too long']],
['rm: cannot remove ‘Documents’: Is a directory','You need -r to remove folders',['You need sudo for every rm','The folder is hidden','rm cannot delete anything']],
['cp: -r not specified; omitting directory ‘Documents’','Copying a folder needs the -r flag',['The folder is empty','You need to be root','cp is broken']],
['bash: ./hello.sh: Permission denied','The script is not executable yet (chmod +x)',['The script has a typo','bash is missing','The file is too big']],
['E: Could not open lock file /var/lib/dpkg/lock - Permission denied','Installing needs sudo',['The internet is down','The package does not exist','The disk is full']],
['ping: unknown host examplee.test','The name did not resolve in DNS (check the spelling)',['The host blocked ping','Your cable is unplugged','You need sudo']],
['ssh: connect to host 127.0.0.1 port 2222: Connection refused','Nothing is listening on that port',['The password is wrong','The key is too old','DNS is down']],
['cd: Documents/todo.txt: Not a directory','You tried to cd into a file',['The folder is hidden','You need sudo','The file is empty']],
['tar: docs.tar.gz: Cannot open: No such file or directory','The archive is not in this folder',['The archive is corrupt','You need sudo','tar is missing']],
['sudo: 3 incorrect password attempts','The sudo password was wrong (in this lab it is kali)',['sudo is not installed','The user does not exist','The network is down']],
['grep: Documents: Is a directory','grep needs -r to search inside a folder',['The folder is empty','You need sudo','grep is outdated']]];
GAMES.errdoc=()=>mcq('errdoc','Error Doctor',ER,8,6,e=>({q:`<code>${esc(e[0])}</code><br><span class=dim>What does this error mean?</span>`,a:e[1],w:e[2],why:'Reading the error message first is the fastest fix.'}),'Real terminals give short errors. Learn to read them.');

// 4. Predict the Output
const PR=[
['echo hello | wc -c','6',['5','hello','1'],'wc -c counts characters, including the newline: 5 + 1.'],
['echo kali | tr a-z A-Z','KALI',['kali','Kali','a-z'],'tr translates lowercase to uppercase.'],
['seq 3','1 2 3 (one per line)',['3','1','3 2 1'],'seq prints a range, one number per line.'],
['echo $((2+3))','5',['23','2+3','$5'],'$(( )) does arithmetic.'],
['whoami','kali',['root','Kali','user'],'You are the user kali in this lab.'],
['echo "a b c" | wc -w','3',['5','1','6'],'wc -w counts words.'],
['pwd (right after opening a terminal)','/home/kali',['/','/root','~'],'A new shell starts in your home folder.'],
['echo $HOME','/home/kali',['HOME','~/kali','/root'],'$HOME is your home directory.'],
['expr 6 / 2','3',['12','4','6/2'],'expr evaluates integer arithmetic.'],
['echo hi > f.txt; cat f.txt','hi',['f.txt','Nothing','hi > f.txt'],'> writes into the file, cat prints it.'],
['printf "x\\ny\\n" | wc -l','2',['1','3','4'],'Two newline characters means two lines.'],
['test -f nothing.txt && echo yes','Nothing is printed',['yes','no','error'],'test fails, so && does not run echo.'],
['for i in 1 2 3; do echo $i; done | wc -l','3',['1','6','123'],'Three iterations print three lines.'],
['echo one two | cut -d" " -f2','two',['one','one two','2'],'cut -f2 keeps the second field.']];
GAMES.predict=()=>mcq('predict','Predict the Output',PR,8,6,p=>({q:`What does this print?<br><code>${esc(p[0])}</code>`,a:p[1],w:p[2],why:p[3]}),'Read the command and work out the result before you pick.');

// 5. Permission Maths (typed, timed)
const R3=['---','--x','-w-','-wx','r--','r-x','rw-','rwx'];
GAMES.chmod=()=>sprint('chmod','Permission Maths',60,8,()=>{const d=[0,1,2,3].map(()=>[0,4,5,6,7][Math.floor(Math.random()*5)]);const n=d.slice(0,3).join('');const s=d.slice(0,3).map(x=>R3[x]).join('');
 return Math.random()<.5?{q:`chmod ${n}  →  permissions as letters? (e.g. rw-r--r--)`,a:s}:{q:`${s}  →  chmod number? (3 digits)`,a:n}});

// 6. Pipeline Builder
const PL=[
['Count the lines in notes.txt that contain kali',['cat ~/notes.txt','|','grep kali','|','wc -l']],
['Show only the first 3 entries of a long listing',['ls -l ~','|','head -n 3']],
['Find the ssh process',['ps aux','|','grep ssh']],
['Show your last 5 commands',['history','|','tail -n 5']],
['Encode the word kali in Base64',['echo kali','|','base64']],
['Refresh the package list as admin',['sudo','apt','update']],
['Pack Documents into docs.tar.gz',['tar','-czf','docs.tar.gz','Documents']],
['Count how many files are in your home folder',['ls ~','|','wc -l']],
['Sort a file and remove the repeats',['sort ~/notes.txt','|','uniq']],
['Count failed logins in auth.log',['grep Failed /var/log/auth.log','|','wc -l']]];
GAMES.pipeline=()=>{
 const set=shuf(PL).slice(0,5);let i=0,mis=0,pos=0,built=[];const MAXM=2;
 const done_=won=>{const sc=won?Math.max(10,50-mis*10):0;finish('pipeline',won,sc,won?(mis==0?10:5):0);shell('pipeline','Pipeline Builder',`<div class="fb ${won?'ok':'bad'}" style="font-size:1.1em"><b>${won?'🏆 YOU WIN!':'💥 YOU LOSE'}</b><br>${won?'Nicely built! '+(mis==0?'Flawless.':mis+' wrong '+(mis==1?'pick':'picks')+' - you stayed under the limit.'):'You made '+mis+' wrong picks. The limit is '+MAXM+'. Try again.'}</div>`+again('pipeline'));mark('pipeline');stat(won?'Won · score '+sc:'Lost');};
 const show=()=>{
  if(i>=set.length)return done_(true);
  const p=set[i];pos=0;built=[];
  shell('pipeline','Pipeline Builder',`<p class=dim>Click the pieces in the right order to build the command.</p><div class=sq>${esc(p[0])}</div><div id=pb class=pb></div><div class=pcs>${shuf(p[1].map((t,k)=>[t,k])).map(([t,k])=>`<button class=opt data-k="${k}">${esc(t)}</button>`).join('')}</div><div id=pf></div>`);mark('pipeline');stat(`Puzzle ${i+1} of ${set.length} · mistakes ${mis}/${MAXM}`);
  document.querySelectorAll('.pcs .opt').forEach(b=>b.onclick=()=>{const t=p[1][pos];if(p[1][+b.dataset.k]==t&&!b.disabled){built.push(t);pos++;b.disabled=true;b.classList.add('right');beep(900,.05);document.getElementById('pb').textContent=built.join(' ');
    if(pos>=p[1].length){document.getElementById('pf').innerHTML=`<div class="fb ok">✔ <code>${esc(built.join(' '))}</code></div><button class=btn id=nx>${i+1>=set.length?'Results':'Next ›'}</button>`;const nx=document.getElementById('nx');nx.onclick=()=>{i++;show()};nx.focus()}}
   else{mis++;beep(200,.15);if(mis>MAXM)return done_(false);b.classList.add('wrong');setTimeout(()=>b.classList.remove('wrong'),400);stat(`Puzzle ${i+1} of ${set.length} · mistakes ${mis}/${MAXM}`)}})};
 show()};

window.GH.mcq=mcq;window.GH.SC=SC;
GL.push(
{id:'whichcmd',t:'Which Command?',ic:'🧭',cat:'Commands',lvl:1,d:'Pick the right command for each job, like "where exactly am I?". Modules 1-40.',kind:'panel'},
{id:'flags',t:'Flag Finder',ic:'🚩',cat:'Commands',lvl:2,d:'What does -a, -r, -v or -c change? Match flags to their effect. Modules 1-22.',kind:'panel'},
{id:'errdoc',t:'Error Doctor',ic:'🩺',cat:'Commands',lvl:2,d:'Read a terminal error and pick what went wrong. Modules 1-20.',kind:'panel'},
{id:'predict',t:'Predict the Output',ic:'🔮',cat:'Commands',lvl:3,d:'Work out what a command prints before you run it. Modules 11 and 30-39.',kind:'panel'},
{id:'chmod',t:'Permission Maths',ic:'🔢',cat:'Commands',lvl:2,d:'Convert chmod numbers and rwx letters in 60 seconds. Module 19.',kind:'panel'},
{id:'pipeline',t:'Pipeline Builder',ic:'🧱',cat:'Commands',lvl:2,d:'Click the pieces in order to build working pipelines. Modules 11-24.',kind:'panel'});
})();
