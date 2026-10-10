// Headless test harness: loads ../index.html into a fake DOM so bots can play the real app logic.
const fs=require('fs'),path=require('path');
function boot(storeInit){
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');const js=html.split('<script>')[1].split('</script>')[0];const els={};
function mk(id){const e={id,_cls:new Set(),style:{},dataset:{},textContent:'',innerHTML:'',value:'',disabled:false,children:[],classList:{add:c=>e._cls.add(c),remove:c=>e._cls.delete(c),toggle:(c,v)=>{(v===undefined?!e._cls.has(c):v)?e._cls.add(c):e._cls.delete(c)},contains:c=>e._cls.has(c)},querySelector(){return mk('q')},querySelectorAll:()=>[],prepend(){},setAttribute(){},closest:()=>null,click(){}};Object.defineProperty(e,'lastChild',{get:()=>({remove(){}})});return e;}
for(const m of html.matchAll(/<[a-z0-9]+([^>]*?)id="([^"]+)"([^>]*)>/g)){const e=mk(m[2]);const cm=(m[1]+' '+m[3]).match(/class="([^"]*)"/);if(cm)cm[1].split(/\s+/).forEach(c=>c&&e._cls.add(c));els[m[2]]=e;}
const store=Object.assign({},storeInit||{});
global.localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}};
global.document={body:mk('body'),documentElement:{dataset:{}},addEventListener(){},getElementById:i=>{if(!els[i])els[i]=mk(i);return els[i];},querySelectorAll:()=>[],createElement:()=>mk('x')};
global.window=Object.assign(global.window||{},{addEventListener(){}});global.location=Object.assign({protocol:'file:'},global.__loc||{});
Object.defineProperty(globalThis,'navigator',{value:{userAgent:'qa'},configurable:true,writable:true});
global.setInterval=()=>{};global.__T=global.__T||0;global.performance={now:()=>global.__T*1000};
global.Blob=function(p){this.parts=p;};global.URL={createObjectURL:b=>{global.__csv=b.parts.join('');return 'x';}};
const api=new Function(require('fs').readFileSync(require('path').join(__dirname,'..','preconnect-core.js'),'utf8')+'\n'+js+';return {pcPauseHide,pcPauseShow,pcOnPause,INJECTS,INJ_STEPS,inject,instOpen,instAct,instClose,instSync,instOn,setInst:v=>{INST=v;instSync();},INSTHOLD:()=>INSTHOLD,freezeRun,thawRun,pcCue,pcBuzz,pcFx,pcMetro,pcMetroState,runUpd,pcDrill,pcDrillStart,pcDrillWho,pcDrillStamp,pcDrillBind,pcShuf,pcLessonStart,pcLessonAct,pcQuizStart,pcQuizAct,showHome,showDone,readiness,homeRender,pcSpacing,pcBestPrev,pcDebriefBody,settings,setSetting,countUp,haptic,runFinish,RUN:()=>RUN,LS:()=>LS,QZ:()=>QZ,DEFS,LESSON,EXAM,DRILLS,runStart,runAct,lessonStart,lessonAct,quizAct,examStart,drillMenu,$,load,setTier:t=>{TIER=t}};')();
return {api,els,store};}
module.exports={boot};
