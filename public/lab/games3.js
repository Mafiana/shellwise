// games3.js - 8 more games, plus "which command" scenarios for the newer modules
(()=>{
'use strict';
const {shell,stat,finish,again,shuf,pick,mark,GL,mcq,SC}=window.GH;

// ---- more scenarios (module index, question, answer, wrong|wrong|wrong, why) ----
const SC2=[
[40,'Which command shows the lines that differ between two files?','diff','cmp -l|ls -d|tac','diff lists the differing lines.'],
[40,'Which command finds the first byte where two files differ?','cmp','diff -u|comm|rev','cmp compares byte by byte.'],
[41,'Which command shows a file as hex next to readable text?','xxd','rev|fold|nl','xxd makes a hex dump.'],
[41,'Which command pulls readable text out of a binary file?','strings','tac|cut|tr','strings prints printable runs.'],
[42,'Which command prints only the file name part of a path?','basename','dirname|cd|ls','basename strips the folders.'],
[42,'Which command prints the full absolute path of a file?','realpath','pwd -a|which|cd','realpath resolves to the absolute path.'],
[43,'Which command writes to a file AND shows the output?','tee','cat|rev|nl','tee splits output to a file and the screen.'],
[44,'Which command makes a safe, uniquely named temp file?','mktemp','touch -t|tmpfile|mkdir -t','mktemp creates it in /tmp.'],
[44,'Which command cuts a big file into smaller pieces?','split','cut|join|fold','split writes numbered pieces.'],
[45,'Which command creates a new user account?','useradd','usermod -n|mkuser|passwd -n','useradd (as root) adds the user.'],
[45,'Which command removes a user and their home folder?','userdel -r','rm user|useradd -d|groupdel','userdel -r deletes the account and home.'],
[46,'Which command creates a new group?','groupadd','useradd -g|mkgroup|chgrp','groupadd adds a group.'],
[46,'Which command adds alice to the sudo group without removing other groups?','usermod -aG sudo alice','usermod -G sudo alice|groupadd alice|chown sudo alice','-aG appends to the groups.'],
[47,'Which command shows how long a command takes?','time','watch|nice|jobs','time reports real, user and sys.'],
[47,'Which command stops a job that runs too long?','timeout','nohup|bg|renice','timeout kills it after a limit.'],
[47,'Which command shows the open-files limit?','ulimit -n','ls -n|free -n|df -n','ulimit shows resource limits.'],
[48,'Which command lists the current user\'s scheduled jobs?','crontab -l','at|jobs|history','crontab -l lists cron jobs.'],
[48,'Which file holds the system-wide cron schedule?','/etc/crontab','/etc/cron.txt|/var/cron|/tmp/jobs','/etc/crontab is the system schedule.'],
[49,'Which command finds files with the setuid bit set?','find / -perm -4000','ls -s /|grep setuid /|find / -setuid','-perm -4000 matches the setuid bit.'],
[50,'Which find option runs a command on each match?','-exec','-do|-run|-xargs','-exec cmd {} \\; runs per file.'],
[50,'Which find test selects files bigger than 1 megabyte?','-size +1M','-big 1M|-len 1M|-mb 1','-size +1M means larger than 1 MB.'],
[51,'Which command prints each line backwards?','rev','tac|fold|nl','rev reverses characters per line.'],
[51,'Which command wraps long lines at a set width?','fold','cut|rev|tee','fold -w N wraps lines.'],
[52,'Which command encodes text using only A-Z and 2-7?','base32','base64|xxd|rev','base32 uses that alphabet.'],
[53,'Which command shows the Python version?','python3 --version','python3 --list|pip show|py --os','--version prints the version.'],
[54,'Which command prints the terminal width in columns?','tput cols','stty -w|locale|reset','tput cols prints the width.'],
[54,'Which command fixes a garbled terminal?','reset','clear -f|tput reboot|stty size','reset reinitialises the terminal.'],
[29,'Which command shows the current user name?','whoami','id -n|who -a|hostname','whoami prints the username.'],
[0,'You are lost in the filesystem. Which command prints your exact current folder?','pwd','ls -d|cd -|echo','pwd = print working directory.'],
[2,'Which command returns you to the previous folder?','cd -','cd ~|cd ..|pwd -','cd - jumps back.'],
[6,'Which command counts how many lines match a word?','grep -c','grep -v|grep -n|wc -w','grep -c counts matching lines.'],
[11,'Which command removes duplicate lines (after sorting)?','sort | uniq','uniq | sort -r|cut | tr|tac | rev','uniq needs sorted input.'],
[13,'Which command shows a file\'s owner and permissions in detail?','stat','pwd|file|date','stat shows full file info.'],
[18,'Which command lets only the owner read and write secret.txt?','chmod 600 secret.txt','chmod 777 secret.txt|chmod 644 secret.txt|chown 600 secret.txt','600 = rw- for the owner only.'],
[19,'Which command shows whether the ssh service is active?','systemctl status ssh','service ssh -s|ps ssh|ls ssh','systemctl status reports the state.'],
[22,'Which command runs hello.sh without making it executable?','bash hello.sh','./hello.sh|cat hello.sh|run hello.sh','bash runs the script directly.'],
[23,'Which command shows only failed logins in auth.log?','grep Failed /var/log/auth.log','cat -f /var/log/auth.log|ls Failed|head Failed','grep filters lines.']
];
SC2.forEach(s=>{SC.push(s);const w=s[3].split('|');if(Q[s[0]])Q[s[0]].push([s[1],s[2],w[0],w[1]])});

// ---- 1. True or False ----
const TF=[
['The command rm -r removes a folder and everything inside it.',1,'-r means recursive.'],
['cat opens a file in an editor.',0,'cat only prints a file; nano or vim are editors.'],
['Base64 is a strong form of encryption.',0,'Base64 is encoding and is trivially reversible.'],
['The root user has user ID 0.',1,'UID 0 is the superuser.'],
['chmod 777 is a safe default for scripts.',0,'It lets everyone modify the file.'],
['ls -a also shows hidden files.',1,'Hidden files start with a dot.'],
['/etc usually holds system configuration files.',1,'Yes, config lives in /etc.'],
['A pipe (|) sends the output of one command into another.',1,'That is exactly what a pipe does.'],
['grep -v shows only the lines that match.',0,'-v inverts the match: it shows lines that do NOT match.'],
['The command cd .. moves you up one folder.',1,'.. means the parent folder.'],
['sudo should be put in front of every command to be safe.',0,'Use sudo only when needed (least privilege).'],
['SSH normally listens on port 22.',1,'Port 22 is the SSH default.'],
['MD5 is recommended for storing passwords.',0,'MD5 is fast and broken; use bcrypt or Argon2.'],
['The > symbol appends to a file.',0,'> replaces; >> appends.'],
['wc -l counts lines.',1,'-l = lines.'],
['The kali user in this lab can read /etc/shadow without sudo.',0,'shadow is readable by root only.'],
['history shows the commands you ran before.',1,'It lists your command history.'],
['A file named .bashrc is hidden by default.',1,'It starts with a dot.'],
['free -h shows disk usage.',0,'free shows memory; df shows disks.'],
['tar -czf creates a compressed archive.',1,'c = create, z = gzip, f = file.']];
GAMES.tf=()=>mcq('tf','True or False',TF,10,7,t=>({q:esc(t[0]),a:t[1]?'True':'False',w:[t[1]?'False':'True'],why:t[2]}),'Decide whether each statement about Linux and security is true.',60);

// ---- 2. Fill the Command ----
const FC=[
['ls ___ ~','-a','to show hidden files',['-l','-r','-h'].concat([])],
['rm ___ old_folder','-r','to remove a folder and its contents',['-a','-v','-p']],
['grep ___ error log.txt','-i','to ignore upper and lower case',['-r','-c','-l']],
['mkdir ___ a/b/c','-p','to create parent folders as needed',['-r','-a','-m']],
['tar ___ backup.tar.gz Documents','-czf','to create a compressed archive',['-xzf','-tf','-zxf']],
['tar ___ backup.tar.gz','-xzf','to extract the archive',['-czf','-tf','-cf']],
['chmod ___ script.sh','+x','to make it executable',['-x','+r','777']],
['ping ___ 4 localhost','-c','to send exactly 4 packets',['-n','-t','-p']],
['df ___','-h','to show readable sizes',['-a','-x','-r']],
['ps ___','aux','to list every process',['-k','abc','-ls']],
['sort ___ numbers.txt','-n','to sort by number value',['-r','-u','-h']],
['head ___ 3 notes.txt','-n','to show the first 3 lines',['-c','-f','-l']],
['tail ___ /var/log/syslog','-f','to follow new lines live',['-r','-n','-x']],
['wc ___ notes.txt','-l','to count lines',['-w','-c','-m']],
['find / ___ passwd','-name','to search by file name',['-type','-user','-print']],
['sudo apt ___ nmap','install','to add the package',['update','search','remove']],
['sudo ___ -m alice','useradd','to create a user with a home folder',['userdel','passwd','usermod']],
['ss ___','-tuln','to list listening ports',['-tuxn','-abc','-s']]];
GAMES.fillcmd=()=>mcq('fillcmd','Fill the Command',FC,10,7,f=>({q:`<code>${esc(f[0])}</code><br><span class=dim>What goes in the blank ${esc(f[2])}?</span>`,a:f[1],w:f[3],why:f[0].replace('___',f[1])+' works because it does exactly that.'}),'Complete each command with the right option or word.');

// ---- 3. Odd One Out ----
const OO=[
[['ls','cd','pwd','nmap'],'nmap','The others are everyday file-navigation commands; nmap scans ports.'],
[['cat','head','tail','useradd'],'useradd','The others read files; useradd creates users.'],
[['chmod','chown','chgrp','grep'],'grep','The others change permissions or owners; grep searches text.'],
[['ping','traceroute','dig','tar'],'tar','The others are network tools; tar makes archives.'],
[['ps','top','kill','ls'],'ls','The others deal with processes; ls lists files.'],
[['md5sum','sha256sum','sha1sum','mkdir'],'mkdir','The others compute hashes; mkdir creates folders.'],
[['gzip','zip','tar','rev'],'rev','The others pack or compress files; rev reverses text.'],
[['sort','uniq','cut','ping'],'ping','The others process text; ping tests a network.'],
[['sudo','su','useradd','date'],'date','The others relate to users and privileges; date prints the time.'],
[['df','du','free','cp'],'cp','The others report usage; cp copies files.'],
[['ssh','curl','wget','head'],'head','The others talk to other machines; head reads a file.'],
[['journalctl','dmesg','logger','mv'],'mv','The others work with logs; mv moves files.'],
[['top','vmstat','uptime','touch'],'touch','The others report system load; touch creates a file.'],
[['crontab','at','sleep','cat'],'cat','The others schedule or delay; cat prints files.']];
GAMES.odd=()=>mcq('odd','Odd One Out',OO,10,7,o=>({q:'Which command does NOT belong with the others?',a:o[1],w:o[0].filter(x=>x!=o[1]),why:o[2]}),'Three commands share a job. Spot the one that does not.',60);

// ---- 4. Directory Detective ----
const DD=[
['Where are system-wide configuration files kept?','/etc'],['Where do most log files live?','/var/log'],['Which folder holds each user\'s personal files?','/home'],
['Where are device files such as disks found?','/dev'],['Which folder is a virtual view of running processes?','/proc'],['Where are most user programs installed?','/usr/bin'],
['Which folder holds temporary files?','/tmp'],['Where does the root user keep personal files?','/root'],['Which folder holds the files needed to boot?','/boot'],
['Where are hashed passwords stored (root only)?','/etc/shadow'],['Which file lists user accounts?','/etc/passwd'],['Which file lists groups?','/etc/group'],
['Which file records login attempts?','/var/log/auth.log'],['Which file maps names to IP addresses locally?','/etc/hosts'],['Where are optional add-on programs often placed?','/opt']];
const ALLD=DD.map(x=>x[1]);
GAMES.dirs=()=>mcq('dirs','Directory Detective',DD,10,7,d=>({q:esc(d[0]),a:d[1],w:shuf(ALLD.filter(x=>x!=d[1])).slice(0,3),why:d[1]+' is the standard place for that.'}),'Know your way around the Linux filesystem.');

// ---- 5. Security Terms ----
const TT=[
['A weakness that could be exploited','Vulnerability'],['Taking advantage of a weakness','Exploit'],['Tricking people into revealing secrets','Social engineering'],
['A fake message that steals logins','Phishing'],['Extra proof of identity at login','Multi-factor authentication'],['Giving users only the access they need','Least privilege'],
['A one-way fingerprint of data','Hash'],['Scrambling data so only key holders can read it','Encryption'],['Software that locks files for payment','Ransomware'],
['Rules that allow or block network traffic','Firewall'],['A permitted, authorised simulated attack','Penetration test'],['A flaw with no fix available yet','Zero-day'],
['Layering protections so one failure is not fatal','Defence in depth'],['Random data added before hashing a password','Salt'],['A record of events on a system','Log'],
['A competition with hidden flags to find','Capture the Flag'],['Software that secretly spies on you','Spyware'],['Checking who you are','Authentication']];
const ALLT=TT.map(x=>x[1]);
GAMES.terms=()=>mcq('terms','Security Terms',TT,10,7,t=>({q:esc(t[0]),a:t[1],w:shuf(ALLT.filter(x=>x!=t[1])).slice(0,3),why:t[1]+': '+t[0].toLowerCase()+'.'}),'Match each definition to the right security term.');

// ---- 6. Log Reader ----
const LG=[
['Oct 4 02:11:09 kali sshd[812]: Failed password for root from 203.0.113.45 port 51234 ssh2','Someone tried and failed to log in as root over SSH',['A user changed their password','The SSH service restarted','A file was deleted']],
['Oct 4 02:14:51 kali sshd[820]: Accepted publickey for kali from 10.0.2.2 port 40022 ssh2','kali logged in with an SSH key',['kali failed to log in','A key was deleted','SSH was disabled']],
['Oct 4 03:01:12 kali sudo: kali : TTY=pts/0 ; PWD=/home/kali ; USER=root ; COMMAND=/usr/bin/apt update','kali ran apt update as root with sudo',['kali logged out','root changed a password','apt was removed']],
['Oct 4 03:05:40 kali systemd[1]: Started OpenBSD Secure Shell server.','The SSH service was started',['SSH was blocked','A user was added','The disk is full']],
['Oct 4 04:20:02 kali CRON[1893]: (root) CMD (/usr/bin/apt-get update)','A scheduled job ran as root',['A user typed a command','The system rebooted','A login failed']],
['Oct 4 05:33:17 kali useradd[2210]: new user: name=alice, UID=1001, GID=1001','A new user account was created',['A user was deleted','A group was renamed','Alice logged in']],
['Oct 4 06:02:44 kali sshd[900]: Invalid user admin from 198.51.100.7 port 4410','Someone tried a user name that does not exist',['A valid admin logged in','The firewall blocked a port','A key expired']],
['Oct 4 07:15:01 kali kernel: Out of memory: Killed process 4210 (python3)','The system ran out of memory and killed a process',['A user pressed Ctrl+C','Python was updated','The network dropped']],
['Oct 4 08:40:03 kali sshd[951]: Disconnected from user kali 10.0.2.2 port 40022','A user ended their SSH session',['The server crashed','The password expired','A scan started']],
['Oct 4 09:12:31 kali passwd[3012]: pam_unix(passwd:chauthtok): password changed for kali','kali\'s password was changed',['kali was deleted','A login failed','A group was created']],
['Oct 4 10:02:11 kali sshd[1033]: Failed password for invalid user test from 203.0.113.45 port 50011 ssh2','A failed login for a user that does not exist',['A successful login','A sudo command','A file transfer']],
['Oct 4 11:45:20 kali ufw[1100]: [UFW BLOCK] IN=eth0 SRC=203.0.113.9 DST=10.0.2.15 PROTO=TCP DPT=23','The firewall blocked an inbound Telnet attempt',['The firewall allowed SSH','A user was blocked','DNS failed']]];
GAMES.logread=()=>mcq('logread','Log Reader',LG,8,6,l=>({q:`<code style="font-size:.7em">${esc(l[0])}</code><br><span class=dim>What does this log line tell you?</span>`,a:l[1],w:l[2],why:'Reading logs quickly is a core defender skill.'}),'Real systems write lines like these. Can you read them?');

// ---- 7. Harden or Hazard ----
const HH=[
['PermitRootLogin yes (in sshd_config)',0,'Direct root SSH login is a big target. Use a normal user plus sudo.'],
['PasswordAuthentication no, with SSH keys',1,'Keys are far harder to guess than passwords.'],
['chmod 777 on a web upload folder',0,'World-writable folders let anyone plant files.'],
['Automatic security updates turned on',1,'Patches close known holes quickly.'],
['Using the same password on every site',0,'One leak exposes all your accounts.'],
['A password manager with unique passwords',1,'Unique, long passwords limit damage.'],
['Leaving telnet (port 23) open to the internet',0,'Telnet sends everything in plain text.'],
['A firewall that denies by default and allows only needed ports',1,'Default-deny keeps the attack surface small.'],
['Running every service as root',0,'A bug in any service becomes full system control.'],
['Running services as dedicated low-privilege users',1,'Least privilege limits the damage.'],
['Storing passwords as plain text in a database',0,'A leak would reveal every password.'],
['Storing passwords as salted bcrypt hashes',1,'Slow, salted hashes resist cracking.'],
['Disabling logging to save disk space',0,'Without logs you cannot investigate incidents.'],
['Sending logs to a separate log server',1,'Attackers cannot easily erase remote logs.'],
['Opening email attachments from unknown senders',0,'Attachments are a common malware route.'],
['Turning on multi-factor authentication',1,'A stolen password alone is no longer enough.']];
GAMES.harden=()=>mcq('harden','Harden or Hazard',HH,10,7,h=>({q:esc(h[0]),a:h[1]?'Hardening':'Hazard',w:[h[1]?'Hazard':'Hardening'],why:h[2]}),'Is this a hardening step or a hazard? Decide fast.');

// ---- 8. Order the Steps (click pieces in order) ----
const OS=[
['Create a user and give them sudo',['sudo useradd -m alice','sudo passwd alice','sudo usermod -aG sudo alice']],
['Investigate a suspicious login',['grep Failed /var/log/auth.log','sort','uniq -c']],
['Back up Documents and check it',['tar -czf docs.tar.gz Documents','tar -tf docs.tar.gz','sha256sum docs.tar.gz']],
['Install and check a tool',['sudo apt update','sudo apt install cowsay','cowsay --version']],
['Run a new script safely',['cat hello.sh','chmod +x hello.sh','./hello.sh']],
['Incident response, in order',['Detect','Contain','Eradicate','Recover','Review']],
['The CIA triad as a story',['Confidentiality','Integrity','Availability']],
['A safe pen test, in order',['Get written permission','Define the scope','Test','Write the report']],
['Find, count, report failed logins',['grep Failed auth.log','wc -l','echo done']],
['Set up a project folder',['mkdir project','cd project','touch notes.txt']]];
GAMES.order=()=>{
 const set=shuf(OS).slice(0,5);let i=0,mis=0,pos=0,built=[];const MAXM=2;
 const done_=won=>{const sc=won?Math.max(10,50-mis*10):0;finish('order',won,sc,won?(mis==0?10:5):0);shell('order','Order the Steps',`<div class="fb ${won?'ok':'bad'}" style="font-size:1.1em"><b>${won?'🏆 YOU WIN!':'💥 YOU LOSE'}</b><br>${won?'Well ordered! '+(mis==0?'Flawless.':mis+' wrong '+(mis==1?'pick':'picks')+' - you stayed under the limit.'):'You made '+mis+' wrong picks. The limit is '+MAXM+'. Try again.'}</div>`+again('order'));mark('order');stat(won?'Won · score '+sc:'Lost');};
 const show=()=>{
  if(i>=set.length)return done_(true);
  const p=set[i];pos=0;built=[];
  shell('order','Order the Steps',`<p class=dim>Click the steps in the right order.</p><div class=sq>${esc(p[0])}</div><div id=pb class=pb></div><div class=pcs>${shuf(p[1].map((t,k)=>[t,k])).map(([t,k])=>`<button class=opt data-k="${k}">${esc(t)}</button>`).join('')}</div><div id=pf></div>`);mark('order');stat(`Puzzle ${i+1} of ${set.length} · mistakes ${mis}/${MAXM}`);
  document.querySelectorAll('.pcs .opt').forEach(b=>b.onclick=()=>{if(b.disabled)return;if(+b.dataset.k==pos){built.push(p[1][pos]);pos++;b.disabled=true;b.classList.add('right');beep(900,.05);document.getElementById('pb').textContent=built.map((x,n)=>(n+1)+'. '+x).join('   ');
    if(pos>=p[1].length){document.getElementById('pf').innerHTML=`<div class="fb ok">✔ Correct order</div><button class=btn id=nx>${i+1>=set.length?'Results':'Next ›'}</button>`;const nx=document.getElementById('nx');nx.onclick=()=>{i++;show()};nx.focus()}}
   else{mis++;beep(200,.15);if(mis>MAXM)return done_(false);b.classList.add('wrong');setTimeout(()=>b.classList.remove('wrong'),400);stat(`Puzzle ${i+1} of ${set.length} · mistakes ${mis}/${MAXM}`)}})};
 show()};

GL.push(
{id:'tf',t:'True or False',ic:'⚖',cat:'Knowledge',lvl:1,d:'Twenty quick statements about Linux and security. True or false? Modules 1-30.',kind:'panel'},
{id:'fillcmd',t:'Fill the Command',ic:'🧩',cat:'Commands',lvl:2,d:'Complete each command with the right flag or word. Modules 2-20 and 45.',kind:'panel'},
{id:'odd',t:'Odd One Out',ic:'🎯',cat:'Commands',lvl:1,d:'Three commands share a job. Spot the one that does not. Modules 1-50.',kind:'panel'},
{id:'dirs',t:'Directory Detective',ic:'🗂',cat:'Knowledge',lvl:1,d:'Where do logs, configs, devices and users live? Modules 1-4 and 24.',kind:'panel'},
{id:'terms',t:'Security Terms',ic:'📖',cat:'Knowledge',lvl:2,d:'Match definitions to terms like phishing, salt and zero-day.',kind:'panel'},
{id:'logread',t:'Log Reader',ic:'🔎',cat:'Knowledge',lvl:3,d:'Read real-looking log lines and say what happened. Modules 24, 49 and 51.',kind:'panel'},
{id:'harden',t:'Harden or Hazard',ic:'🛡',cat:'Knowledge',lvl:2,d:'Is this a hardening step or a hazard? Modules 19, 49 and 51.',kind:'panel'},
{id:'order',t:'Order the Steps',ic:'🔢',cat:'Commands',lvl:2,d:'Put steps in the right order, from adding users to incident response. Modules 46-50.',kind:'panel'},
{id:'hunt',t:'Linux Secret Hunter',ic:'🔎',cat:'Terminal',lvl:1,d:'Search the virtual terminal for hidden secrets. Use ls, find, grep, cat and cd. The secrets are in new places every round. Best for beginners.',kind:'term'});
})();
