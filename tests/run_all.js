#!/usr/bin/env node
/* BLS Ready — full test suite.   node tests/run_all.js   (exit code 0 = all passed)
   Sections: syntax content balance lesson clean mistakes jitter quiz record fuzz   (or: quick) */
global.window=global.window||{};
const path=require('path'),fs=require('fs'),vm=require('vm');
const ALL=['syntax','content','balance','lesson','clean','mistakes','jitter','quiz','record','drill','smooth','fuzz'];
let want=process.argv.slice(2);if(!want.length)want=ALL;if(want.includes('quick'))want=['syntax','content','balance','lesson','quiz','record'];
let failed=0,n=0;const T0=Date.now();
function report(sec,name,ok,detail=''){n++;if(!ok)failed++;console.log(`${ok?'PASS':'FAIL'}  ${sec.padEnd(9)} ${name}${detail?'  — '+detail:''}`);}
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');const {boot}=require('./bls_mock.js');const {play}=require('./bls_bot.js');
const IDS=['tempo','adult','infant','child2','bvm','chokeA','chokeI','team','opioid','baby','child','pool','crib'];
if(want.includes('syntax')){try{new vm.Script(html.split('<script>')[1].split('</script>')[0]);report('syntax','index.html script compiles',true);}catch(e){report('syntax','index.html script compiles',false,e.message);}
  {const ver=(html.match(/APP_VERSION='([^']+)'/)||[])[1],sw=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8'),cache=(sw.match(/CACHE = '([^']+)'/)||[])[1];
   report('syntax','service-worker cache matches app version',cache===`bls-ready-v${ver}`,`app ${ver}, cache ${cache}`);
  {// Milestone 3: the shared core is loaded before the app, listed in the offline cache, and its header hash matches its body (edit without re-hashing = fail)
   const cp=path.join(__dirname,'..','preconnect-core.js');const ct=fs.existsSync(cp)?fs.readFileSync(cp,'utf8'):'';const first=ct.split('\n')[0]||'';const body=ct.slice(first.length+1);
   const want=(first.match(/sha256:([0-9a-f]{64})/)||[])[1];const got=require('crypto').createHash('sha256').update(body,'utf8').digest('hex');const sw4=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');
   const tagOK=html.indexOf('<script src="preconnect-core.js"></script>')>-1&&html.indexOf('<script src="preconnect-core.js"></script>')<html.indexOf('\n<script>\n');
   report('syntax','shared core loaded first, cached offline, header hash matches body',!!ct&&want===got&&sw4.includes("'preconnect-core.js'")&&tagOK,want===got?'hash ok':`hash expected ${got.slice(0,12)}`);}
  {// Milestone 3: due-again spacing and the debrief body are pure functions; prove them here
   const {boot}=require('./bls_mock.js');const {api}=boot();const d=n=>new Date(Date.now()-n*864e5).toISOString();
   const never=api.pcSpacing([]).status==='never',one=api.pcSpacing([{d:d(0),score:90}]),two=api.pcSpacing([{d:d(5),score:90},{d:d(4),score:90}]),miss=api.pcSpacing([{d:d(5),score:90},{d:d(1),score:40}]),due=api.pcSpacing([{d:d(10),score:95}]);
   report('syntax','spacing: 1, 3, 7, 14, 30 days after each clear at 70+; a miss resets; overdue reads as due',never&&one.level===1&&one.dueIn===1&&one.status==='ok'&&two.level===2&&two.status==='due'&&miss.status==='missed'&&due.status==='due'&&due.level===1,`one ${one.status}/${one.dueIn}d, two ${two.status}, miss ${miss.status}, due ${due.status}`);
   const bp=api.pcBestPrev([{d:d(3),score:80},{d:d(1),score:60}]);const h=api.pcDebriefBody({score:90,compare:bp,metrics:[['Rate','110 / min']],feedback:['Late breath'],lessons:[{k:'x',name:'Breaths'}],steps:[{name:'Check pulse',ok:true,at:'0:05'},{name:'Shock',ok:false,missed:true}]});
   report('syntax','debrief body: compare line, metrics table, what cost points, lessons, steps table',bp.best===80&&bp.prev===60&&/Best 80 · last time 60 · new best/.test(h)&&/pc-metrics/.test(h)&&/What cost points/.test(h)&&/data-k="x"/.test(h)&&/pc-steps/.test(h)&&/✗/.test(h));}

  {// Milestone 1: fonts are served from this site; nothing loads from Google (offline fidelity + privacy). Every font file exists and is in the offline cache list.
   const sw3=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');const urls=[...html.matchAll(/url\((fonts\/[^)]+)\)/g)].map(m=>m[1]);
   const ok=!/fonts\.googleapis|gstatic\.com/.test(html)&&urls.length>=5&&urls.every(u=>fs.existsSync(path.join(__dirname,'..',u))&&sw3.includes(`'${u}'`));
   report('syntax','fonts served from this site, cached offline, no request to Google',ok,`${urls.length} font files`);}
  {// Milestone 1: the screen stays awake while an activity runs and is released after (stubbed wake lock; the real one is async)
   const {api}=boot();let req=0,rel=0;const lock={addEventListener(){},release(){rel++;return Promise.resolve();}};navigator.wakeLock={request(){req++;return {then(f){f(lock);return {catch(){}};}};}};
   try{api.runStart('tempo');}catch(e){report('syntax','screen stays awake during an activity, released after',false,e.message);}
   const a=req>=1;api.showHome();report('syntax','screen stays awake during an activity, released after',a&&rel>=1&&rel===req,`requests ${req}, releases ${rel}`);delete navigator.wakeLock;}

  report('syntax','offline helper only clears its own old caches',/k\.startsWith\('bls-ready-v'\)/.test(fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8')));
  {const sw2=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');report('syntax','offline helper never caches anonymous statistics',/goatcounter\\\.com\$\|\(\^\|\\\.\)zgo\\\.at/.test(sw2)||sw2.includes('goatcounter')&&sw2.includes('zgo'));}
   const man=JSON.parse(fs.readFileSync(path.join(__dirname,'..','manifest.json'),'utf8'));report('syntax','install manifest, icons, and offline helper wired up',/rel="manifest"/.test(html)&&/serviceWorker\.register\('sw\.js'\)/.test(html)&&man.icons.length>=2&&fs.existsSync(path.join(__dirname,'..','icon-512.png')));}
  report('syntax','trademark notice and "not affiliated" statement present',/trademarks of the American Heart Association/.test(html)&&/not affiliated/.test(html));
  report('syntax','app name does not use AHA trademarks',!/<title>[^<]*(Heartsaver|BLS Provider|American Heart)/i.test(html)&&!/class="brand">[^<]*(HEARTSAVER|AHA)/.test(html));}
if(want.includes('content')){// 2025 guideline facts that must never regress
  const {api}=boot();const all=JSON.stringify(api.LESSON)+JSON.stringify(api.EXAM)+JSON.stringify(Object.values(api.DEFS).map(d=>d.steps()));
  report('content','two-finger infant compressions are never the right answer',!api.EXAM.some(q=>/two fingers/i.test(q.a)&&!/no longer/i.test(q.q))&&Object.values(api.DEFS).every(d=>d.steps().every(s=>s.k!=='choice'||!s.o.some(o=>/two fingers/i.test(o[0])&&o[1]==='good'))));
  report('content','choking teaches back blows first (2025)',/5 back blows, then 5 abdominal thrusts/.test(all)&&/5 back blows, then 5 chest thrusts/.test(all));
  report('content','rate 100–120, adult depth 2–2.4 in, 15:2 for two-rescuer pediatric',/100 to 120/.test(all)&&/2\.4/.test(all)&&/15 compressions to 2 breaths/.test(all));
  report('content','pulse check is 5–10 seconds',/lo:5,hi:10/.test(html)&&/never more than 10/.test(all));
  // depth pack (Milestone 8): drowning gets breaths first and a dry chest; a visibly pregnant patient gets the belly pushed left; pediatric pulse under 60 with poor perfusion means CPR; child depth about 2 inches; child pulse carotid or femoral
  const goodOf=rx=>Object.values(api.DEFS).some(d=>d.steps().some(s=>s.k==='choice'&&s.o.some(o=>rx.test(o[0])&&o[1]==='good')))||api.EXAM.some(q=>rx.test(q.a))||api.LESSON.some(sl=>sl.o.some(o=>rx.test(o[0])&&o[1]==='good'));
  report('content','depth pack: drowning = breaths first and a dry chest; pregnancy = belly to her left; pediatric pulse under 60 = CPR; child depth about 2 in; child pulse carotid/femoral',goodOf(/breaths? (first|early)/i)&&goodOf(/dry|towel/i)&&goodOf(/to her left/i)&&goodOf(/under 60/i)&&goodOf(/About 2 inches/)&&goodOf(/Carotid.*femoral/i)&&!Object.values(api.DEFS).some(d=>d.steps().some(s=>s.k==='choice'&&s.o.some(o=>/compressions only/i.test(o[0])&&o[1]==='good'&&/drown|pool|water/i.test(s.p)))));
  report('content','infant rescue breaths are timed at one every 2–3 seconds (the crib scenario), adult at one every 6',api.DEFS.crib.steps().some(s=>s.k==='rhythm'&&s.lo===1.5&&s.hi===3.5&&/2 to 3/.test(s.every))&&api.DEFS.bvm.steps().some(s=>s.k==='rhythm'&&s.lo===4.5&&s.hi===8));}
if(want.includes('balance')){const {api}=boot();let lo=0,sh=0,t=0;const chk=(arr,gi)=>{const L=arr.map(x=>x.length);t++;if(L[gi]===Math.max(...L))lo++;else if(L[gi]===Math.min(...L))sh++;};
  api.LESSON.forEach(s=>chk(s.o.map(x=>x[0]),s.o.findIndex(x=>x[1]==='good')));for(const k in api.DEFS)api.DEFS[k].steps().forEach(s=>{if(s.k==='choice')chk(s.o.map(x=>x[0]),s.o.findIndex(x=>x[1]==='good'));});api.EXAM.forEach(q=>chk([q.a,...q.d],0));
  report('balance','right answer not usually the longest',lo/t<=.45,`${lo} of ${t}`);report('balance','right answer not usually the shortest',sh/t<=.45,`${sh} of ${t}`);}
if(want.includes('lesson')){for(const mode of ['right','wrong']){const {api,els}=boot();api.lessonStart();let g=0;while(api.LS()&&g++<60){const L=api.LS(),s=api.LESSON[L.i];if(mode==='wrong'&&L.first[L.i]===undefined)api.lessonAct({l:'ans',k:String(s.o.findIndex(x=>x[1]!=='good'))});api.lessonAct({l:'ans',k:String(s.o.findIndex(x=>x[1]==='good'))});api.lessonAct({l:'next'});}
  report('lesson',`all ${api.LESSON.length} slides; first-try ${mode} scores ${mode==='right'?100:0}`,String(els['done-s'].textContent)===(mode==='right'?'100':'0'),'score '+els['done-s'].textContent);}}
if(want.includes('clean'))for(const id of IDS){const r=[play(id,0),play(id,1)];report('clean',`${id}: competent run scores 100 (Guided and Recall)`,r.every(x=>x.ok&&x.score===100),r.map(x=>x.score).join('/'));}
if(want.includes('mistakes')){for(const [l,id,o] of [['rate 135/min','adult',{rate:135}],['rate 90/min','tempo',{rate:90}],['pulse check 12 s','adult',{pulse:12}],['pulse check 3 s','adult',{pulse:3}],['hands off 14 s','tempo',{handsOff:14}],['breaths too fast','tempo',{gap:.4}],['bagging every 3 s','bvm',{breathEvery:3}],['bagging every 10 s','bvm',{breathEvery:10}],['infant breaths every 6 s (too slow)','crib',{breathEvery:6}],['infant breaths every 1 s (too fast)','crib',{breathEvery:1}],['steps out of order','team',{wrongSeq:true}],['wrong decisions','opioid',{choice:'bad'}]]){const r=play(id,0,o);report('mistakes',`${l} is caught`,r.ok&&r.score<100,'score '+r.score);}}
if(want.includes('jitter')){const sc=[];for(let i=0;i<20;i++)sc.push(play('adult',0,{jitter:true}).score);const avg=sc.reduce((a,b)=>a+b,0)/sc.length;report('jitter','human-like ±20% tap variation at 110/min: every run 85+, average 97+ (random jitter can legitimately earn one or two "aim for steadier" notes)',sc.every(x=>x>=85)&&avg>=97,`min ${Math.min(...sc)}, average ${avg.toFixed(1)}`);
  report('jitter','edges of the zone (102 and 118/min) score 100',play('tempo',0,{rate:102}).score===100&&play('tempo',0,{rate:118}).score===100);}
if(want.includes('quiz')){const {api,els}=boot();for(const mode of ['right','wrong']){api.examStart();let g=0;while(api.QZ()&&api.QZ().qs&&api.QZ().i<api.QZ().qs.length&&g++<30){const q=api.QZ().qs[api.QZ().i];api.quizAct({q:'ans',i:String(mode==='right'?q.ord.indexOf(q.a):q.ord.findIndex(o=>o!==q.a))});api.quizAct({q:'next'});}
  report('quiz',`exam practice: all ${mode} scores ${mode==='right'?100:0}`,(els['qz-body'].innerHTML.match(/class="big">(\d+)/)||[])[1]===(mode==='right'?'100':'0'));}
  let bad=0;api.EXAM.forEach(q=>{if(new Set([q.a,...q.d]).size!==3)bad++;});for(const k in api.DRILLS)api.DRILLS[k].bank().forEach(q=>{if(new Set([q.a,...q.d]).size!==3)bad++;});report('quiz','every question has 3 distinct options',bad===0);
  report('quiz',`exam bank has ${api.EXAM.length} questions (36 after the depth pack); exam practice asks 15; every drill bank index exists`,api.EXAM.length===36&&/EXAM,15,'exam'/.test(html)&&Object.values(api.DRILLS).every(d=>d.bank().every(q=>q&&q.q&&q.a&&q.d&&q.d.length===2)));}
if(want.includes('record')){global.__T=1000;const {api,els}=boot();api.lessonStart();while(api.LS()){const s=api.LESSON[api.LS().i];api.lessonAct({l:'ans',k:String(s.o.findIndex(x=>x[1]==='good'))});api.lessonAct({l:'next'});}
  report('record','results saved',api.load().runs.some(r=>r.kind==='lesson'));els['h-prog'].onclick();els['p-name'].value='Test Student';els['p-csv'].onclick();report('record','CSV export works',/"Name","Organization","Type"/.test(global.__csv||'')&&/Test Student/.test(global.__csv||''));}
if(want.includes('drill')){global.__T=1000;const start=new Date().toISOString();const {api,els}=boot({'preconnect-drill':JSON.stringify({on:true,inst:'Max',roster:['Jo'],who:'Jo',start})});api.lessonStart();while(api.LS()){const s=api.LESSON[api.LS().i];api.lessonAct({l:'ans',k:String(s.o.findIndex(x=>x[1]==='good'))});api.lessonAct({l:'next'});}const runs=api.load().runs;const r=runs[runs.length-1];
  report('drill','Drill Night: bar shows who is up and the saved lesson names them with the instructor and the night',/Up: Jo/.test(els['pc-drill'].innerHTML)&&(r.who||[])[0]==='Jo'&&r.inst==='Max'&&r.night===start,`who ${r.who}, inst ${r.inst}`);}

if(want.includes('smooth')){
  const spy=el=>{let n=0,v='';Object.defineProperty(el,'innerHTML',{get:()=>v,set:x=>{v=x;n++;},configurable:true});return ()=>n;};
  const start=(id,tier=0)=>{global.__T=1000;const B=boot();B.api.setTier(tier);B.api.runStart(id);return B;};
  const act=(api,r,extra={})=>api.runAct(Object.assign({r},extra));const adv=s=>{global.__T+=s;};
  // 1) the pad isn't rebuilt on every compression
  {const {api,els}=start('tempo');adv(1);act(api,'next');const cnt=spy(els['run-box']);for(let i=0;i<10;i++){adv(.545);act(api,'tap');}
   report('smooth','compression pad is not rebuilt on every tap',cnt()===0,`${cnt()} rebuilds in 10 compressions`);}
  // 2) momentum: taps right after a step change are ignored; taps on the stop panel never become breaths
  {const {api}=start('tempo');adv(1);act(api,'next');adv(.6);for(let i=0;i<30;i++){act(api,'tap');adv(.545);}
   const R=api.RUN();report('smooth','after 30 compressions the screen moves to breaths',R.steps[R.i].k==='breaths');
   act(api,'over');adv(.545);act(api,'over');report('smooth','overshoot taps on the "stop" panel never count as breaths',R.st.taps.length===0&&R.errs.length===0);
   adv(.1);act(api,'breath');report('smooth','a deliberate breath still registers',R.st.taps.length===1);}
  {const {api}=start('adult');adv(1);for(const x of api.RUN().steps[0].items){adv(1);act(api,'seq',{x});}const R=api.RUN();adv(.25);act(api,'timer');
   report('smooth','a tap within half a second of a new step is ignored (no accidental timer start)',R.steps[R.i].k==='timer'&&R.st.t0===null);adv(.4);act(api,'timer');report('smooth','…and works normally after that',R.st.t0!==null);}
  // 3) feedback stays on screen after the step changes
  {const {api,els}=start('tempo');adv(1);act(api,'next');adv(.6);for(let i=0;i<30;i++){act(api,'tap');adv(.44);}
   report('smooth','a penalty stays visible after the step changes',/too fast/.test(els['run-now'].innerHTML),els['run-now'].innerHTML.replace(/<[^>]+>/g,''));}
  {const {api,els}=start('tempo');adv(1);act(api,'next');adv(.6);for(let i=0;i<30;i++){act(api,'tap');adv(.545);}
   report('smooth','good work gets positive feedback',/✓ Set 1: 110\/min · 100% in the zone/.test(els['run-now'].innerHTML));}
  // 4) Guided coaches the rate live; Recall stays silent
  {const {api,els}=start('tempo',0);adv(1);act(api,'next');adv(.6);for(let i=0;i<8;i++){act(api,'tap');adv(.42);}api.runAct({r:'noop'});
   report('smooth','Guided coaches live ("Slow down a little" at ~143/min)',/Slow down/.test(els['run-coach'].textContent),els['run-coach'].textContent);}
  {const {api,els}=start('tempo',1);adv(1);act(api,'next');adv(.6);for(let i=0;i<8;i++){act(api,'tap');adv(.42);}api.runAct({r:'noop'});
   report('smooth','Recall gives no live coaching',els['run-coach'].textContent==='');}
  {const {api,els}=start('adult',1);adv(1);for(const x of api.RUN().steps[0].items){adv(1);act(api,'seq',{x});}adv(1);act(api,'timer');adv(4);api.runAct({r:'noop'});
   report('smooth','Recall hides the pulse-check seconds (count it yourself)',els['kv-a'].textContent==='…');}
  // 5) debrief lists every step
  {const r=play('team',0);report('smooth','debrief lists your steps',/Your steps/i.test(r.detail)&&(r.detail.match(/✓/g)||[]).length>=10,((r.detail.match(/✓/g)||[]).length)+' steps shown');}
}
if(want.includes('record')){// Milestone 2: home readiness, best-score chips, count-up, haptics setting, settings sheet, report-style debrief
  const {api,els,store}=boot({'bls-ready':JSON.stringify({runs:[{kind:'station',id:'adult',score:80,d:'2026-10-01T10:00:00Z',tier:0},{kind:'station',id:'adult',score:95,d:'2026-10-02T10:00:00Z',tier:0}]})});api.showHome();const R=api.readiness();
  report('record','home shows a best-score chip per activity and a readiness count',els['chip-adult'].textContent==='95'&&els['chip-tempo'].textContent==='—'&&R.done===1&&R.total===19&&els['rdy-t'].textContent==='1 of 19 activities'&&els['rdy-n'].textContent==='5%',`adult ${els['chip-adult'].textContent}, ${R.done}/${R.total}`);
  const el={textContent:''};api.countUp(el,87);report('record','score count-up lands on the exact score when motion is unavailable',el.textContent==='87');
  let v=0;navigator.vibrate=()=>{v++;return true;};api.setSetting('haptics','off');api.haptic(8);const a=v;api.setSetting('haptics','on');api.haptic(8);report('record','haptics follow the shared setting (off means no vibration)',a===0&&v===1,`off ${a}, on ${v}`);delete navigator.vibrate;
  api.setSetting('text','large');report('record','settings saved under preconnect-settings and applied to the page',JSON.parse(store['preconnect-settings']).text==='large'&&global.document.documentElement.dataset.text==='large');
  {const d=n=>new Date(Date.now()-n*864e5).toISOString();const b2=boot({'bls-ready':JSON.stringify({runs:[{kind:'station',id:'adult',score:95,d:d(10),tier:0},{kind:'station',id:'bvm',score:40,d:d(1),tier:0}]})});b2.api.showHome();
   report('record','home chips turn to Due / Again from the spacing schedule, and the readiness line counts them',b2.els['chip-adult'].textContent==='Due'&&b2.els['chip-bvm'].textContent==='Again'&&/2 due for review/.test(b2.els['rdy-s'].textContent),`${b2.els['chip-adult'].textContent}, ${b2.els['chip-bvm'].textContent}`);}
  {const b4=boot();global.__T=1000;b4.api.runStart('tempo');b4.api.runFinish();report('record','debrief uses the shared Debrief 2.0 body (compare line, clean-run line, score)',/pc-compare/.test(b4.els['done-b'].innerHTML)&&/Clean run/.test(b4.els['done-b'].innerHTML)&&b4.els['done-s'].textContent==='100',b4.els['done-s'].textContent);}}
if(want.includes('fuzz')){let crashes=0;const errs=[];const R=['next','opt','seq','timer','tap','breath','rhythm','alt','quit'];
  for(let run=0;run<60;run++){global.__T=1000;const {api}=boot();api.runStart(IDS[run%IDS.length]);
    try{for(let i=0;i<800&&api.RUN();i++){global.__T+=Math.random()*3;const a=R[Math.floor(Math.random()*(R.length-(i<700?1:0)))],s=api.RUN().steps[api.RUN().i];
      api.runAct({r:a,i:String(Math.floor(Math.random()*3)),x:Math.random()<.5?'a':(s&&s.items?s.items[Math.floor(Math.random()*s.items.length)]:'b')});}}catch(e){crashes++;errs.push(e.message);}}
  report('fuzz','60 runs × 800 random actions, no crashes',crashes===0,crashes?[...new Set(errs)].slice(0,3).join(' | '):'');}
console.log(`\n${n-failed}/${n} checks passed · ${Math.round((Date.now()-T0)/1000)} s`);process.exit(failed?1:0);
