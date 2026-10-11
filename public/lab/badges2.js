// badges2.js - more badges. They use progress the lab already keeps, and are awarded by the normal badges() check.
(function(){
 if(typeof BG==='undefined'||!Array.isArray(BG))return;
 const rd=k=>{try{const o=JSON.parse(localStorage.getItem(k)||'{}');return o&&typeof o=='object'?o:{}}catch(e){return{}}};
 const mods=()=>done.filter(Boolean).length;
 const flags=()=>Object.keys(rd('kctf').solved||{}).length;
 const best=()=>+rd('kdaily').best||0;
 const kinds=()=>Object.keys(S.gwon||{}).length;
 BG.push(
  ['🌱','Getting Started','Finish 3 modules',()=>mods()>=3],
  ['✅','First Answer','Get 1 quiz answer right',()=>S.qc>=1],
  ['🎓','Quiz Master','100 correct answers',()=>S.qc>=100],
  ['💯','Perfectionist','5 perfect quizzes',()=>(S.perf||0)>=5],
  ['🎲','Game Sampler','Win 3 different games',()=>kinds()>=3],
  ['🏆','Champion','Win 25 games',()=>S.gw>=25],
  ['🌈','Game Collector','Win every game at least once',()=>typeof GM!=='undefined'&&kinds()>=GM.length],
  ['📅','3-Day Streak','Do the daily challenge 3 days in a row',()=>best()>=3],
  ['🔥','7-Day Streak','Do the daily challenge 7 days in a row',()=>best()>=7],
  ['🚩','First Flag','Capture your first CTF flag',()=>flags()>=1],
  ['🏴','Flag Hunter','Capture 5 CTF flags',()=>flags()>=5],
  ['⚡','1000 XP','Earn 1000 XP',()=>S.xp>=1000],
  ['🚀','Level 20','Reach level 20',()=>lv()>=20]
 );
})();
