// Plays BLS Ready stations and scenarios on a controllable clock (global.__T, seconds).
const {boot}=require('./bls_mock.js');
// o: rate (compressions/min), pulse (s), gap (s between breaths), handsOff (extra s before next compressions), breathEvery (s), choice ('good'|'bad'), wrongSeq
function play(id,tier=0,o={}){global.__T=1000;const {api,els}=boot();api.setTier(tier);api.runStart(id);const act=ds=>api.runAct(ds);const adv=s=>{global.__T+=s;};let guard=0;
  const cad=60/(o.rate||110);
  while(api.RUN()&&guard++<3000){const R=api.RUN(),s=R.steps[R.i],st=R.st;if(!s)break;
    if(s.k==='info'){adv(1.5);act({r:'next'});}
    else if(s.k==='choice'){if(st.solved){adv(1);act({r:'next'});}else{let i=s.o.findIndex(x=>x[1]===(o.choice||'good'));if(i<0||st.tried[i])i=s.o.findIndex(x=>x[1]==='good');adv(2);act({r:'opt',i:String(i)});}}
    else if(s.k==='seq'){adv(1);const want=s.items[st.next];if(o.wrongSeq&&!o._ws){o._ws=1;act({r:'seq',x:(s.decoys||[])[0]||s.items[s.items.length-1]});}else act({r:'seq',x:want});}
    else if(s.k==='timer'){adv(1);act({r:'timer'});adv(o.pulse||7);act({r:'timer'});}
    else if(s.k==='tap'){if(!st.taps.length)adv(o.handsOff||1.2);else adv(cad*(o.jitter?(.8+Math.random()*.4):1));act({r:'tap'});}
    else if(s.k==='breaths'){adv(o.gap||1.1);act({r:'breath'});}
    else if(s.k==='rhythm'){adv(st.taps.length?(o.breathEvery||(s.lo<3?2.5:6)):1);act({r:'rhythm'});}
    else if(s.k==='pads'){adv(1.5);const V=s.v,plan=o.pads||(V.key==='patch'?['prep:patch','pad:ru','pad:ls']:V.key==='hair'?['prep:shave','pad:ru','pad:ls']:['pad:ru','pad:ls']);st._k=st._k||0;const [kind,z]=(plan[st._k++]||'pad:ls').split(':');act(kind==='pad'?{r:'pad',z}:{r:'prep',x:z});}
    else if(s.k==='alt'){adv(.6);act({r:'alt',x:st.inCyc<5?'a':'b'});}
    else{adv(1);act({r:'next'});}}
  const done=els['done-s'].textContent;return {runs:api.load().runs||[],ok:!api.RUN()&&done!=='',score:+done,detail:els['done-b'].innerHTML.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()};}
module.exports={play};
