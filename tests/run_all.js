#!/usr/bin/env node
/* BLS Ready — full test suite.   node tests/run_all.js   (exit code 0 = all passed)
   Sections: syntax content balance lesson clean mistakes jitter quiz record fuzz   (or: quick) */
global.window=global.window||{};
const path=require('path'),fs=require('fs'),vm=require('vm');
const ALL=['syntax','content','balance','lesson','clean','mistakes','jitter','quiz','record','drill','sound','smooth','pool','slow','fuzz'];
let want=process.argv.slice(2);if(!want.length)want=ALL;if(want.includes('quick'))want=['syntax','content','balance','lesson','quiz','record'];
let failed=0,n=0;const T0=Date.now();
function report(sec,name,ok,detail=''){n++;if(!ok)failed++;console.log(`${ok?'PASS':'FAIL'}  ${sec.padEnd(9)} ${name}${detail?'  — '+detail:''}`);}
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');const {boot}=require('./bls_mock.js');const {play}=require('./bls_bot.js');
const IDS=['tempo','adult','infant','child2','bvm','chokeA','chokeI','team','opioid','baby','child','pool','crib','slow'];
if(want.includes('syntax')){try{new vm.Script(html.split('<script>')[1].split('</script>')[0]);report('syntax','index.html script compiles',true);}catch(e){report('syntax','index.html script compiles',false,e.message);}
  {const ver=(html.match(/APP_VERSION='([^']+)'/)||[])[1],sw=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8'),cache=(sw.match(/CACHE = '([^']+)'/)||[])[1];
   report('syntax','service-worker cache matches app version',cache===`bls-ready-v${ver}`,`app ${ver}, cache ${cache}`);
{const cm=fs.readFileSync(path.join(__dirname,'..','CLAUDE.md'),'utf8'),rd=fs.readFileSync(path.join(__dirname,'..','README.txt'),'utf8');const cv=(cm.match(/\*\*Current version: ([\d.]+)/)||[])[1],av=(html.match(/APP_VERSION='([^']+)'/)||[])[1];
 report('syntax','the briefing names the shipped version and the README lists the core and the fonts (final sweep M3)',cv===av&&/preconnect-core\.js/.test(rd)&&/fonts\//.test(rd),`briefing ${cv}, app ${av}`);}
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
  {// Milestone B (final sweep, M1): the page and the shared core are both network-first with a short wait, bad answers are never saved, installs skip the HTTP cache, and index.html is stored once
   const sw5=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');const coreNF=sw5.includes("netFirst(req, 'preconnect-core.js')")&&/fellBack = Date\.now\(\)/.test(sw5),navNF=/req\.mode === 'navigate'\)\s*\{\s*e\.respondWith\(netFirst/.test(sw5),wait=/const NET_WAIT = (\d+)/.test(sw5)&&+sw5.match(/const NET_WAIT = (\d+)/)[1]<=4000&&/Promise\.race\(\[net, wait\]\)/.test(sw5),okOnly=/if \(r\.ok\) \{ const copy = r\.clone\(\); caches\.open\(CACHE\)\.then\(c => c\.put\(key, copy\)\)/.test(sw5),reload=/cache: 'reload'/.test(sw5),once=!/CORE = \['\.\/'/.test(sw5)&&/'index\.html'/.test(sw5);
   report('syntax','offline helper: page and shared core network-first with a short wait, bad answers never saved, fresh installs skip the HTTP cache, index stored once',coreNF&&navNF&&wait&&okOnly&&reload&&once,`core ${coreNF} nav ${navNF} wait ${wait} ok ${okOnly} reload ${reload} once ${once}`);}
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

if(want.includes('sound')){const fakeAudio=()=>{const log=[];const AC=function(){this.currentTime=0;this.state='running';this.destination={};this.resume=()=>{};this.createOscillator=()=>({type:'sine',frequency:{value:0},connect(){},start(t){log.push({f:this.frequency.value,t});},stop(){}});this.createGain=()=>({gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}});};const buzz=[];const F={log,buzz,fs:()=>log.map(x=>x.f),arm(){global.window=global.window||{};global.window.AudioContext=AC;navigator.vibrate=p=>{buzz.push(JSON.stringify(p));return true;};}};F.arm();return F;};
  {const F=fakeAudio();global.__T=1000;const {api,els}=boot();F.arm();api.setSetting('sound','on');F.log.length=0;F.buzz.length=0;api.setTier(0);api.runStart('adult');let metroDuringTap=false,guard=0;const adv=s=>{global.__T+=s;};
   while(api.RUN()&&guard++<600){const R=api.RUN(),s=R.steps[R.i],st=R.st;if(s.k==='tap'&&api.pcMetroState()&&api.pcMetroState().bpm===110)metroDuringTap=true;
    if(s.k==='info'){adv(1.5);api.runAct({r:'next'});}else if(s.k==='choice'){if(st.solved){adv(1);api.runAct({r:'next'});}else{adv(2);api.runAct({r:'opt',i:String(s.o.findIndex(x=>x[1]==='good'))});}}else if(s.k==='seq'){adv(1);api.runAct({r:'seq',x:s.items[st.next]});}else if(s.k==='timer'){adv(1);api.runAct({r:'timer'});adv(12);api.runAct({r:'timer'});}else if(s.k==='tap'){adv(st.taps.length?.545:1.2);api.runAct({r:'tap'});}else if(s.k==='breaths'){adv(1.1);api.runAct({r:'breath'});}else{adv(1);api.runAct({r:'next'});}}
   const fs=F.fs();report('sound','a station with sound on: metronome ticks during compressions and stops after, a bad cue and a buzz on the long pulse check, good cues, a chime at the end',metroDuringTap&&api.pcMetroState()===null&&fs.includes(880)&&fs.includes(220)&&F.buzz.includes('[30,40,30]')&&fs.includes(660)&&fs.join().includes('523,659,784')&&F.buzz.includes('[20,60,20,60,40]'),`tones ${fs.length}, buzz ${[...new Set(F.buzz)].join(' ')}`);}
  {const F=fakeAudio();global.__T=1000;const {api}=boot();F.arm();api.setSetting('sound','on');api.setTier(0);api.runStart('bvm');const adv=s=>{global.__T+=s;};for(let k=0;k<2;k++){const s=api.RUN().steps[api.RUN().i];adv(2);api.runAct({r:'opt',i:String(s.o.findIndex(x=>x[1]==='good'))});adv(1);api.runAct({r:'next'});}
   adv(1);api.runAct({r:'rhythm'});F.log.length=0;adv(3);api.runUpd();const early=F.fs().filter(f=>f===440).length;adv(2.2);api.runUpd();api.runUpd();const cued=F.fs().filter(f=>f===440).length;adv(1);api.runAct({r:'rhythm'});F.log.length=0;adv(5.2);api.runUpd();const again=F.fs().filter(f=>f===440).length;
   report('sound','Guided bag-mask: a breathe cue sounds once when the window opens, not before, and again for the next breath',early===0&&cued===1&&again===1,`early ${early}, cued ${cued}, again ${again}`);
   F.log.length=0;api.runAct({r:'quit'});api.examStart();const q=api.QZ().qs[0];api.quizAct({q:'ans',i:String(q.ord.indexOf(q.a))});const right=F.fs().join();api.quizAct({q:'next'});const q2=api.QZ().qs[1];F.log.length=0;F.buzz.length=0;api.quizAct({q:'ans',i:String(q2.ord.findIndex(o=>o!==q2.a))});
   report('sound','quiz: a right answer plays the good tone, a wrong one the bad tone with a buzz',right==='660,990'&&F.fs().includes(220)&&F.buzz.includes('[30,40,30]'));
   const G=boot();F.arm();G.api.setSetting('sound','off');F.log.length=0;G.api.runStart('tempo');report('sound','sound off: no metronome, no tones',G.api.pcMetroState()===null&&F.log.length===0);delete global.window.AudioContext;delete navigator.vibrate;}}

if(want.includes('drill')){global.__loc={search:'?drill=special'};const {api,els}=boot();global.__loc={search:'?drill=nope'};const b=boot();global.__loc=undefined;
  report('drill','daily-drill deep link: ?drill=special opens the Special situations drill on load; an unknown id is ignored',!!api.QZ()&&api.QZ().cfg&&api.QZ().cfg.id==='special'&&!els.quizov.classList.contains('hidden')&&!b.api.QZ()&&b.els.quizov.classList.contains('hidden'),`title ${els['qz-title'].textContent}`);}

if(want.includes('drill')){const AC=function(){this.currentTime=0;this.state='running';this.destination={};this.resume=()=>{};this.createOscillator=()=>({type:'sine',frequency:{value:0},connect(){},start(){},stop(){}});this.createGain=()=>({gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}});};global.__T=1000;const {api,els}=boot();global.window=global.window||{};global.window.AudioContext=AC;api.setSetting('sound','on');api.setTier(0);const hiddenOff=els['inst-fab'].classList.contains('hidden');api.setInst(true);api.runStart('adult');const shown=!els['inst-fab'].classList.contains('hidden');const R=api.RUN();
  // walk to the first compression step, then freeze mid-set and prove no time is charged
  const adv=s=>{global.__T+=s;};let g=0;while(api.RUN()&&api.RUN().steps[api.RUN().i].k!=='tap'&&g++<20){const s=api.RUN().steps[api.RUN().i],st=api.RUN().st;if(s.k==='seq'){adv(1);api.runAct({r:'seq',x:s.items[st.next]});}else if(s.k==='timer'){adv(1);api.runAct({r:'timer'});adv(7);api.runAct({r:'timer'});}else if(s.k==='choice'){if(st.solved){adv(1);api.runAct({r:'next'});}else{adv(2);api.runAct({r:'opt',i:String(s.o.findIndex(x=>x[1]==='good'))});}}else{adv(1);api.runAct({r:'next'});}}
  for(let k=0;k<10;k++){adv(k?.545:1.2);api.runAct({r:'tap'});}const t0=api.RUN().t0,lastTap=api.RUN().st.taps.slice(-1)[0];api.instOpen();const frozen=api.RUN().frozenAt!==null&&!els.instov.classList.contains('hidden')&&api.pcMetroState()===null;adv(40);api.runAct({r:'tap'});const ignored=api.RUN().st.taps.length===10;api.instAct('pads');const queued=api.RUN().steps[api.RUN().i+1].inj===true&&api.RUN().steps[api.RUN().i+1].p.includes('Check pads')&&api.RUN().injects.length===1;
  const shifted=Math.abs((api.RUN().t0-t0)-40)<.01&&Math.abs((api.RUN().st.taps.slice(-1)[0]-lastTap)-40)<.01&&api.RUN().frozenAt===null&&!!api.pcMetroState();api.instOpen();const second=/data-inj="vomit" disabled/.test(els['inst-body'].innerHTML);api.instAct('freeze');const held=api.INSTHOLD()&&api.RUN().frozenAt!==null&&els['inst-fab'].textContent.startsWith('Frozen');els['inst-fab'].onclick();const resumed=!api.INSTHOLD()&&api.RUN().frozenAt===null;
  for(let k=0;k<20;k++){adv(.545);api.runAct({r:'tap'});}const set=api.RUN().m.rates.length===1&&api.RUN().m.inRange[0]>=.75;const onInj=api.RUN().steps[api.RUN().i].inj===true;adv(1);api.runAct({r:'opt',i:String(api.RUN().steps[api.RUN().i].o.findIndex(x=>x[1]==='good'))});adv(1);api.runAct({r:'next'});api.runFinish();const r=api.load().runs.slice(-1)[0];const marked=r.inst===1&&/Instructor injects/.test(els['done-b'].innerHTML);delete global.window.AudioContext;
  report('drill','instructor mode: hidden until on and running, opening freezes the clock and the metronome, taps while frozen are ignored, resume shifts every timestamp so the set still scores clean, an inject queues one choice step and only one at a time, freeze holds until the button is tapped, injected runs are marked',hiddenOff&&shown&&frozen&&ignored&&queued&&shifted&&second&&held&&resumed&&set&&onInj&&marked,`frozen ${frozen}, ignored ${ignored}, shifted ${shifted}, set clean ${set}, onInj ${onInj}, marked ${marked}`);}

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
  const {api,els,store}=boot({'bls-ready':JSON.stringify({runs:[{kind:'station',id:'adult',score:80,d:new Date(Date.now()-3600e3).toISOString(),tier:0},{kind:'station',id:'adult',score:95,d:new Date(Date.now()-1800e3).toISOString(),tier:0}]})});api.showHome();const R=api.readiness();
  report('record','home shows a best-score chip per activity and a readiness count',els['chip-adult'].textContent==='95'&&els['chip-tempo'].textContent==='—'&&R.done===1&&R.total===20&&els['rdy-t'].textContent==='1 of 20 activities'&&els['rdy-n'].textContent==='5%',`adult ${els['chip-adult'].textContent}, ${R.done}/${R.total}`);
  const el={textContent:''};api.countUp(el,87);report('record','score count-up lands on the exact score when motion is unavailable',el.textContent==='87');
  let v=0;navigator.vibrate=()=>{v++;return true;};api.setSetting('haptics','off');api.haptic(8);const a=v;api.setSetting('haptics','on');const pv=v;api.haptic(8);report('record','haptics follow the shared setting (off means no vibration; turning it on previews one buzz)',a===0&&pv===1&&v===2,`off ${a}, preview ${pv}, on ${v}`);delete navigator.vibrate;
  api.setSetting('text','large');report('record','settings saved under preconnect-settings and applied to the page',JSON.parse(store['preconnect-settings']).text==='large'&&global.document.documentElement.dataset.text==='large');
  {const d=n=>new Date(Date.now()-n*864e5).toISOString();const b2=boot({'bls-ready':JSON.stringify({runs:[{kind:'station',id:'adult',score:95,d:d(10),tier:0},{kind:'station',id:'bvm',score:40,d:d(1),tier:0}]})});b2.api.showHome();
   report('record','home chips turn to Due / Again from the spacing schedule, and the readiness line counts them',b2.els['chip-adult'].textContent==='Due'&&b2.els['chip-bvm'].textContent==='Again'&&/2 due for review/.test(b2.els['rdy-s'].textContent),`${b2.els['chip-adult'].textContent}, ${b2.els['chip-bvm'].textContent}`);}
  {const b4=boot();global.__T=1000;b4.api.runStart('tempo');b4.api.runFinish();report('record','debrief uses the shared Debrief 2.0 body (compare line, clean-run line, score)',/pc-compare/.test(b4.els['done-b'].innerHTML)&&/Clean run/.test(b4.els['done-b'].innerHTML)&&b4.els['done-s'].textContent==='100',b4.els['done-s'].textContent);}}

if(want.includes('pool')){// Pulled from the pool, BLS Ready 0.15.0: four patients for the AED, the pad step, and the drowning breath lines tagged
  const V=k=>{global.window.FORCE_V={pool:k};};const off=()=>{delete global.window.FORCE_V;};
  for(const k of ['A','B','C','D']){V(k);const r=[play('pool',0),play('pool',1)];off();report('pool',`patient ${k}: a competent run scores 100 on Guided and Recall`,r.every(x=>x.ok&&x.score===100),r.map(x=>x.score).join('/'));}
  {const seen=new Set();for(let i=0;i<60;i++){global.__T=1000;const {api}=boot();api.runStart('pool');seen.add(api.RUN().V.v);}
   global.__T=1000;const d=boot({'preconnect-drill':JSON.stringify({on:true,inst:'Max',roster:['Jo'],who:'Jo',start:new Date().toISOString()})});d.api.runStart('pool');
   report('pool','patients are picked at random (all four seen in 60 starts); a Drill Night always gets A, the wet chest',seen.size===4&&d.api.RUN().V.key==='wet',[...seen].join(''));}
  {V('B');const r=play('pool',0);off();
   report('pool','the debrief names the patient',/Patient Medication patch/.test(r.detail));}
  {V('C');const r=play('pool',0);off();const last=r.runs.slice(-1)[0]||{};
   report('pool','the saved run carries the patient (v and pt) for the training record',last.id==='pool'&&last.v==='C'&&last.pt==='Implanted device',`${last.v} ${last.pt}`);}
  // helper: walk to the pad step with good play, then hand control back
  const toPads=(k,tier=0)=>{V(k);global.__T=1000;const B=boot();const {api}=B;api.setTier(tier);api.runStart('pool');off();const adv=s=>{global.__T+=s;};let g=0;
    while(api.RUN().steps[api.RUN().i].k!=='pads'&&g++<300){const R=api.RUN(),s=R.steps[R.i],st=R.st;
      if(s.k==='info'){adv(1.5);api.runAct({r:'next'});}else if(s.k==='choice'){adv(2);if(st.solved)api.runAct({r:'next'});else api.runAct({r:'opt',i:String(s.o.findIndex(x=>x[1]==='good'))});}
      else if(s.k==='seq'){adv(1);api.runAct({r:'seq',x:s.items[st.next]});}else if(s.k==='timer'){adv(1);api.runAct({r:'timer'});adv(7);api.runAct({r:'timer'});}
      else if(s.k==='tap'){adv(st.taps.length?.545:1.2);api.runAct({r:'tap'});}else if(s.k==='breaths'){adv(1.1);api.runAct({r:'breath'});}}
    const tap=(r,z)=>{adv(1.2);api.runAct(r==='pad'?{r,z}:{r,x:z});};return Object.assign(B,{tap,adv,onPads:()=>api.RUN()&&api.RUN().steps[api.RUN().i].k==='pads'});};
  {const T=toPads('B');T.tap('pad','ru');const R=T.api.RUN();const over=R.score===90&&R.st.overPatch&&/over the medication patch/.test(R.msg.html);T.tap('pad','ls');const held=T.onPads();T.tap('prep','patch');
   report('pool','patch: a pad over the patch happens and costs 10; the step waits until the patch is peeled off, then moves on',over&&held&&!T.onPads()&&R.score===90&&R.errs.length===1,`score ${R.score}`);}
  {const T=toPads('C');T.tap('pad','lu');const R=T.api.RUN();const hit=R.score===90&&/implanted device/.test(R.errs[0]||'')&&!R.st.on.lu;T.tap('pad','ru');T.tap('pad','ls');
   report('pool','implanted device: a pad on the bulge costs 10 and is moved; the standard spots clear it',hit&&!T.onPads()&&R.score===90&&/clear of the device/.test(R.log.slice(-1)[0].detail),`score ${R.score}`);}
  {const T=toPads('D');T.tap('pad','ru');T.tap('pad','ls');const R=T.api.RUN();const chk=R.st.check&&T.onPads()&&/Check pads/.test(R.msg.html)&&R.score===100;T.tap('prep','analyze');const an=R.score===95;T.tap('prep','press');const still=T.onPads()&&R.st.check;T.tap('prep','second');
   report('pool','very hairy chest: pads on the hair get "Check pads"; analyzing anyway costs 5; pressing is not enough; the second set fixes it',chk&&an&&still&&!T.onPads()&&R.score===95&&/second set/.test(R.log.slice(-1)[0].detail),`score ${R.score}`);}
  {const T=toPads('D');T.tap('pad','ru');T.tap('pad','ls');T.tap('prep','shave');const R=T.api.RUN();
   report('pool','very hairy chest: the kit razor after "Check pads" also fixes it, at no cost',!T.onPads()&&R.score===100);}
  {const T=toPads('A');const R=T.api.RUN();T.tap('pad','mid');const a=R.score===95;T.tap('pad','belly');const b=R.score===90;T.tap('prep','patch');T.tap('prep','shave');T.tap('prep','second');const c=R.score===90&&T.onPads();T.tap('pad','ru');T.tap('pad','ls');
   report('pool','wrong spots cost 5 each; a patch, razor or second-set tap with nothing to fix costs nothing',a&&b&&c&&!T.onPads()&&R.score===90,`score ${R.score}`);}
  {const T=toPads('A');const R=T.api.RUN();T.adv(.3);T.api.runAct({r:'pad',z:'ru'});const ign=!R.st.on.ru;T.adv(1);T.api.runAct({r:'next'});const stay=T.onPads();
   const spy=el=>{let n=0,v=el.innerHTML;Object.defineProperty(el,'innerHTML',{get:()=>v,set:x=>{v=x;n++;},configurable:true});return ()=>n;};const cnt=spy(T.els['run-box']);for(let i=0;i<20;i++){T.adv(.25);T.api.runUpd();}
   report('pool','pad step: a tap within half a second is ignored, Continue cannot skip it, and nothing is rebuilt while you look',ign&&stay&&cnt()===0,`rebuilds ${cnt()}`);}
  for(const [l,k,o] of [['moving him off the puddle, drying, and clearing the guest skipped (wrong choices)','A',{choice:'bad'}]]){V(k);const r=play('pool',0,o);off();report('pool',`${l} costs points`,r.ok&&r.score<100,'score '+r.score);}
  {const {api}=boot();const texts=[...api.LESSON.flatMap(sl=>[...sl.pts,sl.why]),...api.EXAM.map(q=>q[3]||q.why||''),...Object.values(api.DEFS).flatMap(d=>d.steps().flatMap(s=>[s.p,s.why||'']))].filter(Boolean);
   const ref=(html.match(/Drowning<\/span><b>[^<]*/)||[''])[0];const lines=texts.filter(t=>/drown/i.test(t)&&/breath/i.test(t)&&/(first|early|order)/i.test(t)).concat([ref]);
   report('pool','every drowning breath-order line (lesson, exam, pool scenario, pocket reference) says "to confirm with the 2025 course materials"',lines.length>=5&&lines.every(t=>/to confirm with the 2025 course materials/i.test(t)),`${lines.length} lines`);}
  {let lo=0,sh=0,t=0;for(const k of ['A','B','C','D']){V(k);global.__T=1000;const b=boot();off();b.api.runStart('pool');b.api.RUN().steps.forEach(s=>{if(s.k!=='choice')return;const L=s.o.map(x=>x[0].length),g=s.o.findIndex(x=>x[1]==='good');t++;if(L[g]===Math.max(...L))lo++;else if(L[g]===Math.min(...L))sh++;});}
   report('pool','pool decisions: the right answer is neither usually the longest nor the shortest',lo/t<=.45&&sh/t<=.45,`longest ${lo}, shortest ${sh} of ${t}`);}
}

if(want.includes('slow')){// She has a pulse, but it's slow (BLS Ready 0.16.0): a 3-year-old after a seizure, rescue breaths, rechecks, the under-60 rule
  const V=k=>{global.window.FORCE_V={slow:k};};const off=()=>{delete global.window.FORCE_V;};const pl=(k,t,o)=>{V(k);const r=play('slow',t,o||{});off();return r;};
  for(const k of ['A','B','C']){const r=[pl(k,0),pl(k,1)];report('slow',`patient ${k}: a competent run scores 100 on Guided and Recall`,r.every(x=>x.ok&&x.score===100),r.map(x=>x.score).join('/'));}
  {const seen=new Set();for(let i=0;i<40;i++){global.__T=1000;const {api}=boot();api.runStart('slow');seen.add(api.RUN().V.v);}
   global.__T=1000;const d=boot({'preconnect-drill':JSON.stringify({on:true,inst:'Max',roster:['Jo'],who:'Jo',start:new Date().toISOString()})});d.api.runStart('slow');
   report('slow','patients are random (all three seen in 40 starts); a Drill Night always gets A, the pulse that comes back',seen.size===3&&d.api.RUN().V.key==='up',[...seen].join(''));}
  {const a=pl('A',0),b=pl('B',0),c=pl('C',0);const has=(r,rx)=>rx.test(r.detail);
   report('slow','only B and C reach compressions and the AED ("No shock advised"); A ends in the recovery position with no compressions',!/compressions ·/.test(a.detail)&&/Recovery position/.test(JSON.stringify(require('./bls_mock.js').boot().api.DEFS.slow.steps({key:'up'})))&&/30 compressions/.test(b.detail)&&/15 compressions/.test(c.detail)&&/No shock advised/.test(JSON.stringify(require('./bls_mock.js').boot().api.DEFS.slow.steps({key:'late'}))));
   report('slow','the debrief shows the patient, her pulse at each check, the breath window, the average and the big breaths',has(b,/Patient Pulse falls at the first recheck/)&&has(b,/Her pulse at each check 70, then 50/)&&has(b,/Rescue breaths in the 2–3 s window 9 of 9/)&&has(b,/Average time between breaths 2\.5 s/)&&has(b,/Breaths too big 0/),b.detail.slice(0,240));
   const last=c.runs.slice(-1)[0]||{};report('slow','the saved run carries the patient for the training record',last.id==='slow'&&last.kind==='scenario'&&last.v==='C'&&last.pt==='Pulse falls at the second recheck');}
  {const r=pl('A',0,{big:3});report('slow','big breaths happen and cost 3 each; the third says her belly is swelling',r.ok&&r.score===91&&/belly is swelling/.test(r.detail),'score '+r.score);}
  {const r=pl('A',0,{breathEvery:6});report('slow','breaths at the adult pace (every 6 s) cost points and say it is the adult pace',r.ok&&r.score<100&&/adult pace/.test(r.detail),'score '+r.score);}
  {const r=pl('A',0,{breathEvery:1});report('slow','breaths every second are caught as too fast',r.ok&&r.score<100&&/too fast/.test(r.detail),'score '+r.score);}
  // drive a run by hand to the card that matters
  const run=(k,until,tier=0)=>{V(k);global.__T=1000;const B=boot();const {api}=B;api.setTier(tier);api.runStart('slow');off();const adv=s=>{global.__T+=s;};let g=0;
    while(api.RUN()&&!until(api.RUN())&&g++<400){const R=api.RUN(),s=R.steps[R.i],st=R.st;
      if(s.k==='info'){adv(1.5);api.runAct({r:'next'});}else if(s.k==='choice'){adv(2);if(st.solved)api.runAct({r:'next'});else api.runAct({r:'opt',i:String(s.o.findIndex(x=>x[1]==='good'))});}
      else if(s.k==='seq'){adv(1);api.runAct({r:'seq',x:s.items[st.next]});}else if(s.k==='timer'){adv(1);api.runAct({r:'timer'});adv(7);api.runAct({r:'timer'});}
      else if(s.k==='tap'){adv(st.taps.length?.545:1.2);api.runAct({r:'tap'});}else if(s.k==='breaths'){adv(1.1);api.runAct({r:'breath'});}else if(s.k==='rhythm'){adv(st.taps.length?2.5:1);api.runAct({r:'rhythm'});}}
    return Object.assign(B,{adv});};
  const cardOf=rx=>R=>{const s=R.steps[R.i];return s.k==='choice'&&rx.test(s.p)&&!R.st.solved;};
  {const B=run('A',cardOf(/about 100/));const R=B.api.RUN(),s=R.steps[R.i];B.adv(2);B.api.runAct({r:'opt',i:String(s.o.findIndex(x=>/Start compressions/.test(x[0])))});
   report('slow','compressions on a child with a pulse of 100 cost 10 and the feedback says her heart is pumping',R.score===90&&/pumping on its own/.test(R.msg.html),`score ${R.score}`);}
  {const B=run('B',cardOf(/about 50/));const R=B.api.RUN(),s=R.steps[R.i],n0=R.steps.length;B.adv(2);B.api.runAct({r:'opt',i:String(s.o.findIndex(x=>x[1]==='later'))});
   const spliced=R.steps.length===n0+4&&R.steps[R.i].k==='rhythm'&&R.score===90&&/do not wait/.test(R.errs[0]);let g=0,X;
   while(X=B.api.RUN(),X&&!(X.steps[X.i].k==='choice'&&/about 40/.test(X.steps[X.i].p))&&g++<40){const s=X.steps[X.i];if(s.k==='rhythm'){B.adv(X.st.taps.length?2.5:1);B.api.runAct({r:'rhythm'});}else if(s.k==='info'){B.adv(1.5);B.api.runAct({r:'next'});}else if(s.k==='timer'){B.adv(1);B.api.runAct({r:'timer'});B.adv(7);B.api.runAct({r:'timer'});}}
   const again=B.api.RUN()&&/about 40/.test(B.api.RUN().steps[B.api.RUN().i].p);
   report('slow','keeping the breaths going with a pulse under 60 happens: costs 10, another round is played, the pulse falls to 40 and the CPR card comes back',spliced&&again,`spliced ${spliced}, again ${again}`);}
  {const res=['B','C'].map(k=>{const B=run(k,R=>R.steps[R.i].k==='tap');const R=B.api.RUN();B.adv(14);B.api.runAct({r:'tap'});return R.score===95&&/finding her pulse under 60/.test(R.errs[0]||'');});
   report('slow','a slow start to compressions after finding the pulse under 60 is timed on the real clock and costs 5 (B at the first recheck, C at the second)',res.every(Boolean),res.join(' '));}
  {const B=run('A',R=>R.steps[R.i].k==='rhythm');const R=B.api.RUN();B.adv(1);B.api.runAct({r:'rhythm'});B.adv(.3);B.api.runAct({r:'rhythm',x:'big'});const fast=R.score===94;
   const spy=el=>{let n=0,v=el.innerHTML;Object.defineProperty(el,'innerHTML',{get:()=>v,set:x=>{v=x;n++;},configurable:true});return ()=>n;};const cnt=spy(B.els['run-box']);for(let i=0;i<6;i++){B.adv(2.5);B.api.runAct({r:'rhythm'});}for(let i=0;i<10;i++){B.adv(.25);B.api.runUpd();}
   report('slow','breath pads: a big breath that is also too fast costs for both; breathing and waiting rebuild nothing',fast&&cnt()===0,`score ${R.score}, rebuilds ${cnt()}`);}
  {const {api}=boot();const all=['up','down','late'].map(k=>api.DEFS.slow.steps(api.DEFS&&{key:k,pt:'',trend:''}));
   report('slow','2025 rules: rescue breaths timed at 2–3 s, under 60 with poor color means CPR, 15:2 with two, about 2 inches, child or adult pads not touching',all.every(st=>st.some(s=>s.k==='rhythm'&&s.lo===1.5&&s.hi===3.5&&s.n===10&&s.big))&&/under 60 with poor color/.test(JSON.stringify(all[1]))&&/15 compressions to 2 breaths/.test(JSON.stringify(all[2]))&&/about 2 inches/.test(JSON.stringify(all[1]))&&/adult pads not touching/.test(JSON.stringify(all[2])));
   let lo=0,sh=0,t=0;all.forEach(st=>st.forEach(s=>{if(s.k!=='choice')return;const L=s.o.map(x=>x[0].length),g=s.o.findIndex(x=>x[1]==='good');t++;if(L[g]===Math.max(...L))lo++;else if(L[g]===Math.min(...L))sh++;}));
   report('slow','decisions: the right answer is neither usually the longest nor the shortest',lo/t<=.45&&sh/t<=.45,`longest ${lo}, shortest ${sh} of ${t}`);}
}
if(want.includes('record')){// final sweep M1: CSV cells safe, wrong-shape data never bricks the page, older saved-data formats still load
  {// final sweep M3: My progress lists every one of the 20 activities, built from ACTS (it used to hard-code 6 stations and 4 scenarios)
   const {api,els}=boot();api.showHome();els['h-prog'].onclick();const h=els['info-b'].innerHTML;const rows=(h.match(/class="mrow"/g)||[]).length;
   const names=['Child CPR — two rescuers','Pulled from the pool','Not breathing in the crib',"She has a pulse, but it's slow"].filter(n=>h.includes(n.replace(/'/g,'&#39;'))||h.includes(n));
   report('record','My progress lists all 20 activities from ACTS, including the child two-rescuer station and the pool, crib and slow-pulse scenarios',rows===api.ACTS.length&&names.length===4,`${rows} rows of ${api.ACTS.length}, found ${names.length}/4 newer names`);}
  {global.__T=1000;const {api,els}=boot({'bls-ready':JSON.stringify({runs:[{kind:'lesson',id:'lesson',score:90,d:'2026-10-01T00:00:00Z',tier:0},{kind:'scenario',id:'ghost',score:50,d:'2026-10-02T00:00:00Z',tier:0}]})});api.showHome();els['h-prog'].onclick();els['p-name'].value='=HYPERLINK("http://x","x")';els['p-dept'].value='@SUM(1)';global.__csv='';els['p-csv'].onclick();const csv=global.__csv||'';
   report('record','CSV: a name typed as a formula is defused with a leading apostrophe, and an unknown activity id still exports',/"'=HYPERLINK\(""http:\/\/x"",""x""\)","'@SUM\(1\)"/.test(csv)&&/"ghost"/.test(csv)&&csv.split('\n').length===3,csv.split('\n')[1]);}
  {let ok=true,why='';for(const bad of ['[]','5','{"runs":5}','{"runs":[null,{"kind":"lesson","id":"lesson","score":50,"d":"2026-10-01T00:00:00Z","tier":0}]}']){try{global.__T=1000;const b=boot({'bls-ready':bad});b.api.showHome();const p=b.api.load();if(!Array.isArray(p.runs)||p.runs.some(r=>!r||typeof r!=='object'))throw new Error('runs not clean for '+bad);b.api.runStart('tempo');b.api.runFinish();if(b.api.load().runs.slice(-1)[0].id!=='tempo')throw new Error('record failed for '+bad);}catch(e){ok=false;why=e.message;}}
   report('record','wrong-shape saved data ([] / 5 / {"runs":5} / a null run) loads as an empty record and a new run still saves',ok,why);}
  {const dir=path.join(__dirname,'fixtures');let n=0,bad=[];for(const f of fs.readdirSync(dir).filter(x=>x.startsWith('bls-')&&x.endsWith('.json'))){const data=fs.readFileSync(path.join(dir,f),'utf8');const before=JSON.parse(data);try{global.__T=1000;const b=boot({'bls-ready':data});b.api.showHome();b.api.readiness();b.els['h-prog'].onclick();b.els['p-name'].value=before.name||'';b.els['p-dept'].value=before.dept||'';global.__csv='';b.els['p-csv'].onclick();b.api.runStart('tempo');b.api.runFinish();const after=b.api.load();if(after.runs.length!==before.runs.length+1)throw new Error('runs shrank');for(const k of ['name','dept','inst'])if(before[k]!==undefined&&after[k]!==before[k])throw new Error('lost '+k);if(!/Name/.test(global.__csv))throw new Error('no csv');n++;}catch(e){bad.push(f+': '+e.message);}}
   report('record',`older saved-data formats (${n} fixtures) load, show progress, export and keep every field when a new run is added`,n>=3&&!bad.length,bad.join(' | ')||`${n} fixtures`);}
}
if(want.includes('smooth')){// rule 15 (final sweep M2): the real clock stops while the screen is off; the instructor's freeze wins; the wake lock is released on every quit path
  const start=(id,tier=0)=>{global.__T=1000;const B=boot();B.api.setTier(tier);B.api.runStart(id);return B;};const adv=s=>{global.__T+=s;};
  {const {api,els}=start('tempo');adv(1);api.runAct({r:'next'});adv(.6);for(let i=0;i<10;i++){api.runAct({r:'tap'});adv(.545);}api.pcPauseHide();adv(90);api.pcPauseShow();const line=els['run-now'].innerHTML;for(let i=0;i<20;i++){api.runAct({r:'tap'});adv(.545);}const R=api.RUN();
   report('smooth','rule 15: the phone goes dark for 90 s in the middle of a compression set; the set still scores clean and a line says it was paused',R.score===100&&R.m.rates.length===1&&R.m.inRange[0]>=.75&&/Paused while the screen was off/.test(line),`score ${R.score}, in zone ${R.m.inRange[0]}`);}
  {const {api}=start('adult');adv(1);for(const x of api.RUN().steps[0].items){adv(1);api.runAct({r:'seq',x});}adv(1);api.runAct({r:'timer'});adv(3);api.pcPauseHide();adv(120);api.pcPauseShow();adv(4);api.runAct({r:'timer'});const R=api.RUN();
   report('smooth','rule 15: a pulse check interrupted by a 2-minute phone call still reads the seconds you actually counted',R.m.pulse.length===1&&Math.abs(R.m.pulse[0]-7)<.01&&R.score===100,`read ${R.m.pulse[0]} s, score ${R.score}`);}
  {const {api}=start('tempo');adv(1);api.runAct({r:'next'});adv(.6);for(let i=0;i<5;i++){api.runAct({r:'tap'});adv(.545);}api.setInst(true);api.instOpen();const f0=api.RUN().frozenAt;api.pcPauseHide();adv(30);api.pcPauseShow();const still=api.RUN().frozenAt===f0&&api.RUN().frozenAt!==null;api.instAct('freeze');api.pcPauseHide();adv(30);api.pcPauseShow();const held=api.INSTHOLD()&&api.RUN().frozenAt!==null;
   report('smooth','rule 15: the screen going off and on never thaws a run the instructor froze (sheet open, or Freeze and discuss)',still&&held,`sheet ${still}, hold ${held}`);}
  {const B=boot();let req=0,rel=0;const lock={addEventListener(){},release(){rel++;return Promise.resolve();}};navigator.wakeLock={request(){req++;return {then(f){f(lock);return {catch(){}};}};}};global.__T=1000;
   B.api.runStart('tempo');B.api.runAct({r:'quit'});const a=[req,rel];B.api.lessonStart();B.api.lessonAct({l:'quit'});const b=[req,rel];B.api.examStart();B.api.quizAct({q:'quit'});const c=[req,rel];
   B.api.examStart();let g=0;while(B.api.QZ()&&B.api.QZ().qs&&B.api.QZ().i<B.api.QZ().qs.length&&g++<30){const q=B.api.QZ().qs[B.api.QZ().i];B.api.quizAct({q:'ans',i:String(q.ord.indexOf(q.a))});B.api.quizAct({q:'next'});}const d=[req,rel];delete navigator.wakeLock;
   report('smooth','the wake lock is released when a run is quit, a lesson is left, a quiz is quit and when a quiz finishes',a[0]===1&&a[1]===1&&b[0]===2&&b[1]===2&&c[0]===3&&c[1]===3&&d[0]===4&&d[1]===4,`run ${a} lesson ${b} quiz quit ${c} quiz done ${d}`);}
}
if(want.includes('fuzz')){let crashes=0;const errs=[];const R=['next','opt','seq','timer','tap','breath','rhythm','alt','quit'];
  for(let run=0;run<60;run++){global.__T=1000;const {api}=boot();api.runStart(IDS[run%IDS.length]);
    try{for(let i=0;i<800&&api.RUN();i++){global.__T+=Math.random()*3;const a=R[Math.floor(Math.random()*(R.length-(i<700?1:0)))],s=api.RUN().steps[api.RUN().i];
      api.runAct({r:a,i:String(Math.floor(Math.random()*3)),x:Math.random()<.5?'a':(s&&s.items?s.items[Math.floor(Math.random()*s.items.length)]:'b')});}}catch(e){crashes++;errs.push(e.message);}}
  report('fuzz','60 runs × 800 random actions, no crashes',crashes===0,crashes?[...new Set(errs)].slice(0,3).join(' | '):'');}
console.log(`\n${n-failed}/${n} checks passed · ${Math.round((Date.now()-T0)/1000)} s`);process.exit(failed?1:0);
