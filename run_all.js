#!/usr/bin/env node
/* BLS Ready — full test suite.   node tests/run_all.js   (exit code 0 = all passed)
   Sections: syntax content balance lesson clean mistakes jitter quiz record fuzz   (or: quick) */
global.window=global.window||{};
const path=require('path'),fs=require('fs'),vm=require('vm');
const ALL=['syntax','content','balance','lesson','clean','mistakes','jitter','quiz','record','fuzz'];
let want=process.argv.slice(2);if(!want.length)want=ALL;if(want.includes('quick'))want=['syntax','content','balance','lesson','quiz','record'];
let failed=0,n=0;const T0=Date.now();
function report(sec,name,ok,detail=''){n++;if(!ok)failed++;console.log(`${ok?'PASS':'FAIL'}  ${sec.padEnd(9)} ${name}${detail?'  — '+detail:''}`);}
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');const {boot}=require('./bls_mock.js');const {play}=require('./bls_bot.js');
const IDS=['tempo','adult','infant','bvm','chokeA','chokeI','team','opioid','baby','child'];
if(want.includes('syntax')){try{new vm.Script(html.split('<script>')[1].split('</script>')[0]);report('syntax','index.html script compiles',true);}catch(e){report('syntax','index.html script compiles',false,e.message);}
  {const ver=(html.match(/APP_VERSION='([^']+)'/)||[])[1],sw=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8'),cache=(sw.match(/CACHE = '([^']+)'/)||[])[1];
   report('syntax','service-worker cache matches app version',cache===`bls-ready-v${ver}`,`app ${ver}, cache ${cache}`);
  report('syntax','offline helper only clears its own old caches',/k\.startsWith\('bls-ready-v'\)/.test(fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8')));
   const man=JSON.parse(fs.readFileSync(path.join(__dirname,'..','manifest.json'),'utf8'));report('syntax','install manifest, icons, and offline helper wired up',/rel="manifest"/.test(html)&&/serviceWorker\.register\('sw\.js'\)/.test(html)&&man.icons.length>=2&&fs.existsSync(path.join(__dirname,'..','icon-512.png')));}
  report('syntax','trademark notice and "not affiliated" statement present',/trademarks of the American Heart Association/.test(html)&&/not affiliated/.test(html));
  report('syntax','app name does not use AHA trademarks',!/<title>[^<]*(Heartsaver|BLS Provider|American Heart)/i.test(html)&&!/class="brand">[^<]*(HEARTSAVER|AHA)/.test(html));}
if(want.includes('content')){// 2025 guideline facts that must never regress
  const {api}=boot();const all=JSON.stringify(api.LESSON)+JSON.stringify(api.EXAM)+JSON.stringify(Object.values(api.DEFS).map(d=>d.steps()));
  report('content','two-finger infant compressions are never the right answer',!api.EXAM.some(q=>/two fingers/i.test(q.a)&&!/no longer/i.test(q.q))&&Object.values(api.DEFS).every(d=>d.steps().every(s=>s.k!=='choice'||!s.o.some(o=>/two fingers/i.test(o[0])&&o[1]==='good'))));
  report('content','choking teaches back blows first (2025)',/5 back blows, then 5 abdominal thrusts/.test(all)&&/5 back blows, then 5 chest thrusts/.test(all));
  report('content','rate 100–120, adult depth 2–2.4 in, 15:2 for two-rescuer pediatric',/100 to 120/.test(all)&&/2\.4/.test(all)&&/15 compressions to 2 breaths/.test(all));
  report('content','pulse check is 5–10 seconds',/lo:5,hi:10/.test(html)&&/never more than 10/.test(all));}
if(want.includes('balance')){const {api}=boot();let lo=0,sh=0,t=0;const chk=(arr,gi)=>{const L=arr.map(x=>x.length);t++;if(L[gi]===Math.max(...L))lo++;else if(L[gi]===Math.min(...L))sh++;};
  api.LESSON.forEach(s=>chk(s.o.map(x=>x[0]),s.o.findIndex(x=>x[1]==='good')));for(const k in api.DEFS)api.DEFS[k].steps().forEach(s=>{if(s.k==='choice')chk(s.o.map(x=>x[0]),s.o.findIndex(x=>x[1]==='good'));});api.EXAM.forEach(q=>chk([q.a,...q.d],0));
  report('balance','right answer not usually the longest',lo/t<=.45,`${lo} of ${t}`);report('balance','right answer not usually the shortest',sh/t<=.45,`${sh} of ${t}`);}
if(want.includes('lesson')){for(const mode of ['right','wrong']){const {api,els}=boot();api.lessonStart();let g=0;while(api.LS()&&g++<60){const L=api.LS(),s=api.LESSON[L.i];if(mode==='wrong'&&L.first[L.i]===undefined)api.lessonAct({l:'ans',k:String(s.o.findIndex(x=>x[1]!=='good'))});api.lessonAct({l:'ans',k:String(s.o.findIndex(x=>x[1]==='good'))});api.lessonAct({l:'next'});}
  report('lesson',`all ${api.LESSON.length} slides; first-try ${mode} scores ${mode==='right'?100:0}`,String(els['done-s'].textContent)===(mode==='right'?'100':'0'),'score '+els['done-s'].textContent);}}
if(want.includes('clean'))for(const id of IDS){const r=[play(id,0),play(id,1)];report('clean',`${id}: competent run scores 100 (Guided and Recall)`,r.every(x=>x.ok&&x.score===100),r.map(x=>x.score).join('/'));}
if(want.includes('mistakes')){for(const [l,id,o] of [['rate 135/min','adult',{rate:135}],['rate 90/min','tempo',{rate:90}],['pulse check 12 s','adult',{pulse:12}],['pulse check 3 s','adult',{pulse:3}],['hands off 14 s','tempo',{handsOff:14}],['breaths too fast','tempo',{gap:.4}],['bagging every 3 s','bvm',{breathEvery:3}],['bagging every 10 s','bvm',{breathEvery:10}],['steps out of order','team',{wrongSeq:true}],['wrong decisions','opioid',{choice:'bad'}]]){const r=play(id,0,o);report('mistakes',`${l} is caught`,r.ok&&r.score<100,'score '+r.score);}}
if(want.includes('jitter')){const sc=[];for(let i=0;i<20;i++)sc.push(play('adult',0,{jitter:true}).score);const avg=sc.reduce((a,b)=>a+b,0)/sc.length;report('jitter','human-like ±20% tap variation at 110/min: every run 90+, average 97+',sc.every(x=>x>=90)&&avg>=97,`min ${Math.min(...sc)}, average ${avg.toFixed(1)}`);
  report('jitter','edges of the zone (102 and 118/min) score 100',play('tempo',0,{rate:102}).score===100&&play('tempo',0,{rate:118}).score===100);}
if(want.includes('quiz')){const {api,els}=boot();for(const mode of ['right','wrong']){api.examStart();let g=0;while(api.QZ()&&api.QZ().qs&&api.QZ().i<api.QZ().qs.length&&g++<30){const q=api.QZ().qs[api.QZ().i];api.quizAct({q:'ans',i:String(mode==='right'?q.ord.indexOf(q.a):q.ord.findIndex(o=>o!==q.a))});api.quizAct({q:'next'});}
  report('quiz',`exam practice: all ${mode} scores ${mode==='right'?100:0}`,(els['qz-body'].innerHTML.match(/class="big">(\d+)/)||[])[1]===(mode==='right'?'100':'0'));}
  let bad=0;api.EXAM.forEach(q=>{if(new Set([q.a,...q.d]).size!==3)bad++;});for(const k in api.DRILLS)api.DRILLS[k].bank().forEach(q=>{if(new Set([q.a,...q.d]).size!==3)bad++;});report('quiz','every question has 3 distinct options',bad===0);}
if(want.includes('record')){global.__T=1000;const {api,els}=boot();api.lessonStart();while(api.LS()){const s=api.LESSON[api.LS().i];api.lessonAct({l:'ans',k:String(s.o.findIndex(x=>x[1]==='good'))});api.lessonAct({l:'next'});}
  report('record','results saved',api.load().runs.some(r=>r.kind==='lesson'));els['h-prog'].onclick();els['p-name'].value='Test Student';els['p-csv'].onclick();report('record','CSV export works',/"Name","Organization","Type"/.test(global.__csv||'')&&/Test Student/.test(global.__csv||''));}
if(want.includes('fuzz')){let crashes=0;const errs=[];const R=['next','opt','seq','timer','tap','breath','rhythm','alt','quit'];
  for(let run=0;run<60;run++){global.__T=1000;const {api}=boot();api.runStart(IDS[run%IDS.length]);
    try{for(let i=0;i<800&&api.RUN();i++){global.__T+=Math.random()*3;const a=R[Math.floor(Math.random()*(R.length-(i<700?1:0)))],s=api.RUN().steps[api.RUN().i];
      api.runAct({r:a,i:String(Math.floor(Math.random()*3)),x:Math.random()<.5?'a':(s&&s.items?s.items[Math.floor(Math.random()*s.items.length)]:'b')});}}catch(e){crashes++;errs.push(e.message);}}
  report('fuzz','60 runs × 800 random actions, no crashes',crashes===0,crashes?[...new Set(errs)].slice(0,3).join(' | '):'');}
console.log(`\n${n-failed}/${n} checks passed · ${Math.round((Date.now()-T0)/1000)} s`);process.exit(failed?1:0);
