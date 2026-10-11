import {loadState,saveState,freshState,advance,circuitReady,COLORS,STATIONS} from './src/state.js';

const $=selector=>document.querySelector(selector);
let storage;
try{storage=window.localStorage;}catch{storage={getItem:()=>null,setItem:()=>{}};}
const state=loadState(storage);
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let scene,game,paused=false,launching=false,toastTimeout,audioContext,positionStamp=0;
const dialog=$('#dialog'),content=$('#dialog-content');
const persist=()=>saveState(storage,state);

function tone(frequency=660,duration=.11){
  if(!state.sound)return;
  try{
    audioContext??=new(window.AudioContext||window.webkitAudioContext)();
    if(audioContext.state==='suspended')audioContext.resume();
    const osc=audioContext.createOscillator(),gain=audioContext.createGain();
    osc.type='sine';osc.frequency.value=frequency;gain.gain.setValueAtTime(.035,audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);
    osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+duration);
  }catch{/* Sound is optional. */}
}
function toast(message){clearTimeout(toastTimeout);$('#toast').textContent=message;$('#toast').classList.add('show');toastTimeout=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
function updateHUD(){
  $('#quest-counter').textContent=`${state.stage} / 4`;
  document.querySelectorAll('[data-visit]').forEach((button,i)=>{
    button.classList.toggle('active',i===state.stage);button.classList.toggle('done',i<state.stage);
    button.querySelector('.step-number').textContent=i<state.stage?'✓':`0${i+1}`;
    button.setAttribute('aria-label',`${STATIONS[i].title}, ${STATIONS[i].name}${i<state.stage?', complete':i===state.stage?', current mission':''}`);
  });
  $('#start-mission').innerHTML=state.stage===4?'Open your product <span>↗</span>':state.stage===0?'Let’s build something <span>→</span>':'Continue the adventure <span>→</span>';
  $('#spark-count').textContent=`${state.sparks.length}/6`;
  document.querySelectorAll('.spark-track i').forEach((spark,i)=>spark.classList.toggle('filled',i<state.sparks.length));
  $('.spark-track').setAttribute('aria-label',`${state.sparks.length} of 6 idea sparks collected`);
  $('#sound-button').setAttribute('aria-pressed',String(state.sound));$('#sound-button').setAttribute('aria-label',state.sound?'Turn sound off':'Turn sound on');$('.sound-state').textContent=state.sound?'ON':'OFF';
  scene?.refreshProgress();
}
function show(html){
  if(launching)return;
  content.innerHTML=html;if(!dialog.open)dialog.showModal();dialog.scrollTop=0;scene?.setPaused(true);
}
function close(){dialog.close();}
$('#close-dialog').addEventListener('click',close);
dialog.addEventListener('close',()=>{scene?.setPaused(paused||launching);});
dialog.addEventListener('click',event=>{
  const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))close();
});
function agentHeader(index){const s=STATIONS[index];return `<div class="dialog-agent"><span class="small-bot" style="background:${COLORS[s.color]}" aria-hidden="true"><i>••</i></span><span>${s.name}<small>AGENT ${s.number} / ${s.role}</small></span></div>`;}
function travel(index){
  if(launching)return;
  if(paused)setPause(false);
  if(scene)scene.goToStation(index);else openStage(index);
}
function complete(index){
  if(!advance(state,index))return;
  persist();updateHUD();tone(880,.16);close();toast(`${STATIONS[index].role} COMPLETE · ${index<3?'Next stop: '+STATIONS[index+1].name:'Your product is live.'}`);
}
function openStage(index){
  if(launching)return;
  tone(440,.06);
  if(index>state.stage){
    show(`${agentHeader(index)}<span class="dialog-label">GOOD THINGS HAVE A SEQUENCE.</span><h2 id="dialog-title">A little groundwork first.</h2><p>I’m ready when you are. First, ${STATIONS[state.stage].name} needs your input. Every great product starts with a clear direction.</p><button class="primary dialog-primary" id="go-current">Visit ${STATIONS[state.stage].name} <span>→</span></button>`);
    $('#go-current').onclick=()=>{close();travel(state.stage);};return;
  }
  if(index<state.stage){
    if(state.stage===4&&index===3){showProduct();return;}
    const summaries=[`A ${state.minutes}-minute space for a little more focus.`,`A ${state.color} palette, a clear countdown, and one action at a time.`,`A connected circuit and a working timer. Ready for the launchpad.`];
    show(`${agentHeader(index)}<span class="dialog-label">MISSION COMPLETE</span><h2 id="dialog-title">One step closer to real.</h2><p>${summaries[index]}</p><p>${crewCopy[index]}</p><button class="primary dialog-primary" id="go-next">${state.stage===4?'Open your product':'Continue with '+STATIONS[state.stage].name} <span>→</span></button>`);
    $('#go-next').onclick=()=>{close();if(state.stage===4)showProduct();else travel(state.stage);};return;
  }
  if(index===0)showResearch();if(index===1)showDesign();if(index===2)showBuild();if(index===3)showLaunch();
}
const crewCopy=[
  'z-peak is the lead and your point of contact. It turns your intent into a clear direction, keeps the crew aligned, and brings decisions back to you.',
  'z-current is the PM. It turns that direction into a focused brief, sets priorities, and keeps the product small enough to ship.',
  'z-timber is the Dev. It connects the pieces and turns the plan into working software that the crew can inspect.',
  'z-lens is the Reviewer. It checks the product against the brief and reports whether the build is ready for your final go-ahead.'
];
function showResearch(){
  show(`${agentHeader(0)}<span class="dialog-label">01 / THE HUMAN SETS THE DIRECTION</span><h2 id="dialog-title">A little less noise.<br>A little more focus.</h2><p>I’m z-peak, your lead. Let’s make <strong>Little Focus</strong>: a tiny timer that helps someone do one thing at a time. Who are we building for? I’ll carry your decision to the crew.</p><div class="choice-list" role="group" aria-label="Choose the focus duration">${[[25,'The deep thinker','Room to get into the flow.'],[15,'The busy maker','One small task between the big ones.'],[5,'The fresh starter','A gentle way to get going.']].map(([minutes,title,description])=>`<button class="choice" data-minutes="${minutes}" aria-pressed="${state.minutes===minutes}"><span>${minutes}<small>MIN</small></span><div><strong>${title}</strong><small>${description}</small></div></button>`).join('')}</div><button class="primary dialog-primary" id="approve-research">This is our direction <span>→</span></button><p class="subtle-note">YOU CHOOSE THE WHY. THE CREW HELPS WITH THE HOW.</p>`);
  document.querySelectorAll('[data-minutes]').forEach(button=>button.onclick=()=>{state.minutes=Number(button.dataset.minutes);persist();document.querySelectorAll('[data-minutes]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));tone(520,.05);});
  $('#approve-research').onclick=()=>{timerRemaining=state.minutes*60;complete(0);};
}
function previewMarkup(interactive=false){
  return `<div class="timer-preview" style="--accent:${COLORS[state.color]}"><span class="pixel">LITTLE FOCUS</span><div class="timer-value" id="timer-value">${String(state.minutes).padStart(2,'0')}:00</div><p id="timer-message">One thing. A little room to do it.</p>${interactive?'<div class="timer-controls"><button id="timer-toggle">Start focusing</button><button id="timer-reset">Reset timer</button></div>':''}</div>`;
}
function showDesign(){
  show(`${agentHeader(1)}<span class="dialog-label">02 / TURN DIRECTION INTO A PLAN</span><h2 id="dialog-title">Shape the product brief.</h2><p>I’m z-current, the PM. We have the audience and session length; now let’s choose the interface direction to put in the brief. The product preview updates as you decide.</p><div class="palette-choices" role="group" aria-label="Product color">${Object.entries(COLORS).map(([name,hex])=>`<button class="palette-choice" data-color="${name}" style="--swatch:${hex}" aria-pressed="${state.color===name}"><i></i>${name[0].toUpperCase()+name.slice(1)}</button>`).join('')}</div>${previewMarkup()}<button class="primary dialog-primary" id="approve-design">Add this to the plan <span>→</span></button>`);
  document.querySelectorAll('[data-color]').forEach(button=>button.onclick=()=>{state.color=button.dataset.color;persist();$('.timer-preview').style.setProperty('--accent',COLORS[state.color]);document.querySelectorAll('[data-color]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));tone(590,.05);});
  $('#approve-design').onclick=()=>complete(1);
}
function showBuild(){
  show(`${agentHeader(2)}<span class="dialog-label">03 / CONNECT THE PIECES</span><h2 id="dialog-title">Let’s make it work.</h2><p>I’m z-timber, the Dev. z-current’s brief is ready, and I’ve got the pieces. Help connect the circuit from the power source to the product. Click each tile to rotate its wire into a horizontal line.</p><div class="circuit"><span class="circuit-power" aria-hidden="true">ϟ</span>${state.circuit.map((rotation,i)=>`<button class="circuit-node" data-wire="${i}" aria-label="Rotate wire ${i+1}" style="--angle:${rotation*90}deg"></button>`).join('')}<span class="circuit-power" aria-hidden="true">▣</span></div><p class="circuit-status" id="circuit-status" role="status" aria-live="polite"></p><button class="primary dialog-primary" id="approve-build">Power up the product <span>→</span></button><p class="subtle-note">A SMALL PUZZLE ABOUT TURNING PIECES INTO A SYSTEM.</p>`);
  const refresh=()=>{
    document.querySelectorAll('[data-wire]').forEach((button,i)=>{button.style.setProperty('--angle',`${state.circuit[i]*90}deg`);button.classList.toggle('connected',state.circuit[i]%2===0);button.setAttribute('aria-label',`Rotate wire ${i+1}, ${state.circuit[i]%2===0?'connected horizontally':'vertical, disconnected'}`);});
    const ready=circuitReady(state.circuit);$('#circuit-status').textContent=ready?'CIRCUIT CONNECTED. READY TO BUILD.':'ROTATE THE TILES TO CONNECT THE CIRCUIT.';$('#approve-build').disabled=!ready;
  };
  document.querySelectorAll('[data-wire]').forEach(button=>button.onclick=()=>{const i=Number(button.dataset.wire);state.circuit[i]=(state.circuit[i]+1)%4;persist();refresh();tone(350+100*i,.07);});
  refresh();$('#approve-build').onclick=()=>complete(2);
}
function showLaunch(){
  const checks=[
    {label:`${state.minutes}-minute session matches the human brief`,pass:[5,15,25].includes(state.minutes)},
    {label:`${state.color[0].toUpperCase()+state.color.slice(1)} interface matches the PM plan`,pass:Object.hasOwn(COLORS,state.color)},
    {label:'Working circuit connects the timer',pass:circuitReady(state.circuit)}
  ];
  show(`${agentHeader(3)}<span class="dialog-label">04 / REVIEW BEFORE RELEASE</span><h2 id="dialog-title">Let’s check the build.</h2><p>I’m z-lens, the Reviewer. Run my checks against your brief. If they pass, the final launch decision is yours.</p><ul class="launch-checks">${checks.map((check,i)=>`<li>${check.label} <span data-review="${i}">·</span></li>`).join('')}</ul><p class="circuit-status" id="review-status" role="status" aria-live="polite">REVIEW READY. RUN THE CHECKS.</p><button class="quiet-button" id="run-review">Run z-lens review →</button><button class="primary dialog-primary" id="approve-launch" disabled>Approve launch <span>↗</span></button><p class="subtle-note">A PLAYABLE DEMO. YOUR TIMER RUNS RIGHT HERE IN THE BROWSER.</p>`);
  $('#run-review').onclick=()=>{
    checks.forEach((check,i)=>{$(`[data-review="${i}"]`).textContent=check.pass?'PASS':'ISSUE';});
    const passed=checks.every(check=>check.pass);
    $('#review-status').textContent=passed?'Z-LENS REVIEW PASSED. READY FOR YOUR GO-AHEAD.':'REVIEW FOUND AN ISSUE. THE BUILD NEEDS WORK.';
    $('#approve-launch').disabled=!passed;
    tone(passed?760:240,.12);
  };
  $('#approve-launch').onclick=()=>{
    launching=true;close();$('#launch-overlay').hidden=false;$('#world-hint').hidden=true;$('#interact-button').hidden=true;tone(220,.5);
    const finish=()=>{advance(state,3);persist();updateHUD();launching=false;$('#launch-overlay').hidden=true;tone(1040,.4);showProduct(true);};
    if(scene)scene.launch(finish);else finish();
  };
}

let timerRemaining=state.minutes*60,timerDeadline=null;
function showProduct(justLaunched=false){
  show(`<div class="success-badge">${justLaunched?'✦ FIRST PRODUCT: LAUNCHED.':'✦ BUILT BY YOU + THE CREW.'}</div><h2 id="dialog-title">A little idea.<br>Now a real little thing.</h2><p>z-peak carried your direction, z-current shaped the plan, z-timber built it, and z-lens checked it. You chose when to launch. Your timer is ready.</p><div style="margin-top:22px">${previewMarkup(true)}</div><p class="subtle-note">YOUR QUEST IS SAVED ON THIS DEVICE. THE TIMER CONTINUES WHILE YOU EXPLORE; RELOADING RESETS THE COUNTDOWN.</p><button class="quiet-button" id="back-to-world">Keep exploring the outpost ↗</button>`);
  $('#timer-toggle').onclick=()=>{
    if(timerDeadline){timerRemaining=Math.max(0,Math.ceil((timerDeadline-Date.now())/1000));timerDeadline=null;}
    else{if(timerRemaining===0)timerRemaining=state.minutes*60;timerDeadline=Date.now()+timerRemaining*1000;}
    tone(640,.06);renderTimer();
  };
  $('#timer-reset').onclick=()=>{timerDeadline=null;timerRemaining=state.minutes*60;renderTimer();};
  $('#back-to-world').onclick=close;renderTimer();
}
function renderTimer(){
  if(timerDeadline){timerRemaining=Math.max(0,Math.ceil((timerDeadline-Date.now())/1000));if(timerRemaining===0){timerDeadline=null;tone(880,.7);toast('A little progress, made. Your focus session is complete.');}}
  if(!$('#timer-toggle'))return;
  $('#timer-value').textContent=`${String(Math.floor(timerRemaining/60)).padStart(2,'0')}:${String(timerRemaining%60).padStart(2,'0')}`;
  $('#timer-toggle').textContent=timerDeadline?'Pause session':timerRemaining===0?'Start again':timerRemaining<state.minutes*60?'Resume session':'Start focusing';
  $('#timer-message').textContent=timerRemaining===0?'A little progress, made. Nicely done.':timerDeadline?'Just this one thing. You’ve got time.':'One thing. A little room to do it.';
}
setInterval(renderTimer,250);

function openInfo(kind){
  if(kind==='about'){
    show('<span class="dialog-label">Z / ONE PERSON COMPANY</span><h2 id="dialog-title">Small by choice.<br>Ambitious by nature.</h2><p>Z is an independent product company exploring what one person can build with a crew of AI agents.</p><p>The human sets the direction: which problems matter, what good looks like, and when a product is ready. z-peak leads the human conversation, z-current manages the product plan, z-timber builds it, and z-lens reviews the result.</p><p>We make our own products. We follow useful ideas, work in small steps, and learn from what reaches the world.</p><div class="dialog-summary"><small>OUR OPERATING PRINCIPLE</small><strong>Human imagination. Agent execution.</strong></div><p>This playable outpost is an invitation to experience that process. The crew here are characters in a local demo; your choices create a working focus timer.</p><button class="primary dialog-primary" id="info-play">Visit the crew <span>→</span></button>');
    $('#info-play').onclick=()=>{close();travel(Math.min(state.stage,3));};
  }else if(kind==='crew'){
    show(`<span class="dialog-label">FOUR SKILLS. ONE SHARED MISSION.</span><h2 id="dialog-title">Meet your party.</h2>${STATIONS.map((s,i)=>`<div class="crew-row"><h3>${s.name}</h3><small>${s.role}</small><p>${crewCopy[i]}</p><button class="quiet-button" data-crew-go="${i}">Visit the workshop ↗</button></div>`).join('')}`);
    document.querySelectorAll('[data-crew-go]').forEach(b=>b.onclick=()=>{close();travel(Number(b.dataset.crewGo));});
  }else{
    show('<span class="dialog-label">THE OUTPOST / FIELD GUIDE</span><h2 id="dialog-title">A little guide<br>to getting lost.</h2><p>Explore at your own pace. The mission takes about two minutes, and your progress saves automatically on this device.</p><div class="guide-grid"><div><h3>Take a walk</h3><p>Use WASD, arrow keys, or tap the ground. On a phone, use the directional pad.</p></div><div><h3>Say hello</h3><p>Click an agent’s workshop, use a mission button, or press E when nearby.</p></div><div><h3>Collect a thought</h3><p>Walk over the six glowing crystals. They’re optional little sparks of inspiration.</p></div><div><h3>Ship something</h3><p>Give z-peak your direction, plan with z-current, connect the build with z-timber, then let z-lens review before you launch the timer.</p></div></div><p>You can pause, toggle the camera, or turn on gentle sound effects. Prefer reading? The company story is always one click away.</p><div class="reset-options"><button class="primary" id="guide-done">Got it. Let’s explore →</button><button class="quiet-button" id="restart-quest">Restart my quest</button></div>');
    $('#guide-done').onclick=close;$('#restart-quest').onclick=confirmRestart;
  }
}
function confirmRestart(){
  show('<span class="dialog-label">A FRESH ADVENTURE</span><h2 id="dialog-title">Back to the first spark?</h2><p>This resets this demo’s four missions, design choices, timer, and collected sparks on this device.</p><div class="reset-options"><button class="primary" id="confirm-restart">Start a new quest →</button><button class="quiet-button" id="cancel-restart">Keep my progress</button></div>');
  $('#cancel-restart').onclick=close;$('#confirm-restart').onclick=()=>{Object.assign(state,freshState());persist();location.reload();};
}
function setPause(value){
  if(launching)return;
  paused=value;scene?.setPaused(value);if(scene){if(value)scene.tweens.pauseAll();else if(!reducedMotion)scene.tweens.resumeAll();}
  $('#paused-overlay').hidden=!value;$('#pause-button').textContent=value?'▷':'Ⅱ';$('#pause-button').setAttribute('aria-pressed',String(value));$('#pause-button').setAttribute('aria-label',value?'Resume the world':'Pause the world');
}
document.querySelectorAll('[data-open]').forEach(button=>button.onclick=()=>openInfo(button.dataset.open));
document.querySelectorAll('[data-visit]').forEach(button=>button.onclick=()=>travel(Number(button.dataset.visit)));
$('#start-mission').onclick=()=>state.stage===4?showProduct():travel(state.stage);
$('#interact-button').onclick=()=>scene?.interact();
$('#dismiss-hint').onclick=()=>{$('#world-hint').hidden=true;};
$('#sound-button').onclick=()=>{state.sound=!state.sound;persist();updateHUD();tone(740,.12);};
$('#pause-button').onclick=()=>setPause(!paused);$('#resume-button').onclick=()=>setPause(false);
$('#camera-button').onclick=()=>{if(scene){const follow=scene.toggleZoom();toast(follow?'Follow camera · Your world, up close.':'Map camera · The whole crew in view.');}};
document.querySelectorAll('[data-direction]').forEach(button=>{
  button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);if(scene){const direction=button.dataset.direction;scene.touch[direction]=true;scene.nudge(...{up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[direction]);}});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>{if(scene)scene.touch[button.dataset.direction]=false;});
});
window.addEventListener('blur',()=>{if(scene){scene.touch={};scene.input.keyboard.resetKeys();}});
const updateClock=()=>{$('#world-clock').textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false});};
updateClock();setInterval(updateClock,30000);updateHUD();

async function boot(){
  try{
    await document.fonts.ready;
    const {createWorld}=await import('./src/world.js');
    game=createWorld($('#game'),{state,reducedMotion,
      onReady:world=>{scene=world;$('#loading').remove();updateHUD();},
      onInteract:openStage,
      onTravel:index=>{$('#world-hint').hidden=true;toast(`On our way to ${STATIONS[index].name}…`);},
      onHint:toast,
      onNearby:index=>{$('#interact-button').hidden=index===null;if(index!==null){$('#interact-button span').textContent=`Talk to ${STATIONS[index].name}`;$('#world-hint').hidden=true;}},
      onCollect:id=>{if(state.sparks.includes(id))return;state.sparks.push(id);persist();updateHUD();tone(850+id*80,.17);toast(state.sparks.length===6?'✦ ALL SIX SPARKS FOUND · Curiosity is your superpower.':`✦ IDEA SPARK FOUND · ${state.sparks.length} of 6`);},
      onPosition:(x,y)=>{if(Date.now()-positionStamp>120){$('#coordinates').textContent=`${String(x).padStart(4,'0')} / ${String(y).padStart(4,'0')}`;positionStamp=Date.now();}}
    });
  }catch(error){
    console.error('The outpost could not start:',error);
    $('#loading').innerHTML='<span class="pixel">THE WORLD COULDN’T LOAD.</span><p>You can still meet the crew and complete the missions.</p><button class="primary" id="fallback-play">Start the guided adventure →</button>';
    $('#fallback-play').onclick=()=>openStage(Math.min(state.stage,3));
  }
}
boot();
