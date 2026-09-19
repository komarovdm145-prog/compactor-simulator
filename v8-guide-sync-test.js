// Isolated integration test — verified PP1 KNB ↔ PP2 moving guide kinematics.
// Does NOT change the stable game unless loaded by game-guide-integration.html.
(function(){
  if(typeof machine==='undefined'||typeof pressCycle!=='function'||typeof returnHome!=='function')return;

  const guideEl=()=>document.getElementById('guide');
  const clamp=v=>Math.max(0,Math.min(100,Number(v)||0));
  const delay=()=>opt.slow?210:115;

  machine.guide=clamp(machine.guide||0);
  machine.Y68=false;
  machine.guideDir='OFF';

  function setLift(p){
    machine.lift=p;
    const scene=document.getElementById('machineScene'),table=document.getElementById('liftTable');
    if(scene){scene.classList.toggle('table-half',p===50);scene.classList.toggle('table-full',p===100)}
    if(table){table.className='lift-table'+(p===50?' half':p===100?' up':'');if(!table.querySelector('span'))table.innerHTML='<span>ПОДЪЁМНЫЙ СТОЛ</span>'}
  }

  function stateText(){
    if(machine.Y68)return machine.guideDir==='REV'?'REV → PP2':'FWD → KNB';
    if(machine.B49)return 'CONTACT LOCK';
    if(machine.B64)return 'HOME';
    return 'POSITION';
  }

  function decorate(){
    const g=guideEl(),p2=document.getElementById('press2'),scene=document.getElementById('machineScene');
    if(g&&p2&&g.parentElement!==p2)p2.appendChild(g);
    if(g&&!g.querySelector('.gc-frame'))g.innerHTML='<div class="gc-frame"></div><span class="gc-label">PP2 · MOVING GUIDE</span><span class="gc-state">HOME</span>';
    if(scene&&!document.getElementById('guideReadout'))scene.insertAdjacentHTML('beforeend','<div id="guideReadout" class="guide-readout"></div>');
    const dg=document.querySelector('[data-diag="guide"]');if(dg)dg.textContent='PP2 guide · B64 / B69 / B49';
    const status=document.querySelector('#hmi-status .positions');
    if(status&&!document.getElementById('guideStatusCard'))status.insertAdjacentHTML('beforeend','<div id="guideStatusCard" class="guide-hmi-card">PP2 Guide <b id="guideStatusText">HOME</b></div>');
  }

  function paint(){
    decorate();
    const g=guideEl();if(!g)return;
    const pct=clamp(machine.guide);
    g.style.setProperty('--guide-x',(-0.92*pct)+'px');
    g.classList.toggle('moving',!!machine.Y68);
    g.classList.toggle('closed',!!machine.B49);
    g.classList.toggle('forward',pct>5);
    const s=g.querySelector('.gc-state');if(s)s.textContent=stateText()+' · '+Math.round(pct)+'%';
    const ro=document.getElementById('guideReadout');
    if(ro){
      const cls=machine.Y68?'move':machine.B49?'good':'';
      ro.innerHTML='<strong>PP2 · ПОДВИЖНАЯ НАПРАВЛЯЮЩА</strong><span class="'+cls+'"><b>'+stateText()+'</b> · '+Math.round(pct)+'%</span><br>B64 '+(machine.B64?'HOME':'—')+' · B69 '+(machine.B69?'POSITION':'—')+' · B49 '+(machine.B49?'CLOSED':'OPEN')+'<br>Y68 '+(machine.Y68?machine.guideDir:'OFF');
    }
    const hs=document.getElementById('guideStatusText');if(hs)hs.textContent=stateText()+' · '+Math.round(pct)+'%';
    const gp=document.getElementById('guidePos');if(gp)gp.textContent=Math.round(pct)+'%';
  }

  async function animateGuide(target,dir,keepContact=false){
    target=clamp(target);
    const start=clamp(machine.guide),steps=7;
    machine.Y68=true;machine.guideDir=dir;machine.B64=false;machine.B69=false;
    if(!keepContact)machine.B49=false;
    for(let n=1;n<=steps;n++){
      machine.guide=start+(target-start)*(n/steps);
      if(keepContact)machine.B49=true;
      paint();renderAll();await wait(delay());
    }
    machine.guide=target;machine.Y68=false;machine.guideDir='OFF';machine.B69=true;
    if(target===0){machine.B64=true;machine.B49=false}
    paint();renderAll();
  }

  // Replace the lift-table press cycle only inside this integration test.
  pressCycle=async function(){
    const p1=document.getElementById('press1'),p2=document.getElementById('press2'),coil=document.getElementById('coil');

    setStep(1);setPhase('ПОДПРЕССОВКА · СТОЛ ½ + GUIDE FWD');
    machine.B53=false;machine.B56=false;machine.B59=false;machine.B64=false;machine.B49=false;machine.B69=false;
    setLift(50);p1.classList.add('approach');p2.classList.add('approach');
    log('PP1 и PP2 начинают движение. Одновременно подвижная направляющая PP2 идёт вперёд навстречу KNB.');
    machine.Y68=true;machine.guideDir='FWD';
    for(let i=0;i<4;i++){
      machine.B51+=7;machine.B52+=7;machine.guide=8+i*10;paint();renderAll();await wait(opt.slow?260:150)
    }

    setStep(2);setPhase('ПОДПРЕССОВКА · B58 / СТОЛ ВВЕРХ');
    if(currentFault?.id==='b58'){machine.B58=false;machine.Y68=false;triggerFault(currentFault);return false}
    machine.B58=true;renderAll();log('B58: край бунта обнаружен — разрешён подъём и центровка.');await wait(opt.slow?520:280);
    machine.B59=false;setLift(100);await wait(opt.slow?650:340);
    if(currentFault?.id==='b59'){machine.B59=false;machine.Y68=false;triggerFault(currentFault);return false}
    machine.B59=true;

    if(settings.prepress===2){
      setStep(3);setPhase('ДВОЙНАЯ ПОДПРЕССОВКА · -100 мм → ПОВТОР');
      p1.classList.remove('approach');p2.classList.remove('approach');machine.B51-=10;machine.B52-=10;renderAll();await wait(opt.slow?850:430);
      p1.classList.add('approach');p2.classList.add('approach');machine.B51+=10;machine.B52+=10;renderAll();await wait(opt.slow?700:360);
    }

    // Final approach: PP1+KNB and PP2+guide meet.
    setStep(4);setPhase('KNB ↔ GUIDE · ВСТРЕЧА');
    p1.classList.remove('approach');p2.classList.remove('approach');p1.classList.add('in');p2.classList.add('in');
    machine.Y68=true;machine.guideDir='FWD';
    const start=clamp(machine.guide);
    for(let i=1;i<=7;i++){
      machine.B51+=6;machine.B52+=6;machine.guide=start+(100-start)*(i/7);paint();renderAll();await wait(delay())
    }
    if(currentFault?.id==='node26'){machine.Y68=false;triggerFault(currentFault);return false}
    if(currentFault?.id==='guidepos'){
      machine.Y68=false;machine.B49=false;machine.B69=false;paint();triggerFault(currentFault);return false
    }
    machine.guide=100;machine.Y68=false;machine.guideDir='OFF';machine.B49=true;machine.B69=true;machine.B64=false;
    log('KNB ↔ PP2 GUIDE: тракт сомкнулся. B49 CLOSED — подача проволоки разрешена.','good');paint();renderAll();await wait(opt.slow?650:360);

    // VERIFIED USER CORRECTION: plates keep pressing while guide reverses toward PP2.
    setPhase('ПОДПРЕССОВКА · GUIDE REV → PP2');
    log('После встречи пресс-плиты продолжают сходиться, а направляющая реверсирует назад к PP2, сохраняя стык с KNB.');
    machine.Y68=true;machine.guideDir='REV';
    const revStart=100,revTarget=42;
    for(let i=1;i<=8;i++){
      machine.B51+=4;machine.B52+=4;machine.guide=revStart+(revTarget-revStart)*(i/8);machine.B49=true;paint();renderAll();await wait(opt.slow?260:150)
    }
    machine.guide=revTarget;machine.Y68=false;machine.guideDir='OFF';machine.B49=true;machine.B69=true;
    coil.classList.add('compressed');
    log('Рабочее положение: направляющая частично убрана к PP2, но B49 остаётся CLOSED — тракт с KNB непрерывный.','good');paint();renderAll();return true;
  };

  returnHome=async function(){
    setStep(11);setPhase('ВОЗВРАТ · РАЗМЫКАНИЕ GUIDE');
    machine.B49=false;paint();renderAll();await wait(180);
    await animateGuide(0,'REV',false);
    log('B64: подвижная направляющая PP2 вернулась в исходное положение.','good');
    setPhase('ВОЗВРАТ · ПРЕСС-ПЛИТЫ');
    document.getElementById('press1').classList.remove('in','approach');document.getElementById('press2').classList.remove('in','approach');
    machine.B51=0;machine.B52=0;machine.B53=true;machine.B56=true;machine.B58=false;
    document.getElementById('coil').classList.remove('compressed');document.getElementById('coil').classList.add('bound');renderAll();await wait(opt.slow?720:420);
    setPhase('ВОЗВРАТ · СТОЛ ВНИЗ');machine.B59=false;setLift(50);renderAll();await wait(opt.slow?550:300);setLift(0);await wait(opt.slow?550:300);machine.B59=true;renderAll();
    resetHeadStates();await wait(250);setPhase('ИСХОДНОЕ');busy=false;stats.cycles++;stats.coils++;stats.shiftCoils++;save();renderAll();
  };

  if(typeof faults!=='undefined'&&!faults.some(f=>f.id==='guidepos'))faults.push({
    id:'guidepos',phase:'press',code:'TRAIN GUIDE CONTACT',sym:'Направляющая PP2 начала движение, но тракт с KNB не сомкнулся.',root:'guide',
    evidence:'Учебный сценарий: B64 снят, Y68 двигает каретку, но B49 не подтверждает контакт KNB ↔ guide.',repair:'Проверить механику каретки, соосность стыка и сигналы B64/B69/B49',quality:'hold'
  });

  const oldReset=resetMachine;
  resetMachine=function(){oldReset();machine.guide=0;machine.Y68=false;machine.guideDir='OFF';machine.B49=false;machine.B64=true;machine.B69=true;decorate();paint()};
  const oldRenderAll=renderAll;
  renderAll=function(){oldRenderAll();paint();if(xray&&phase.includes('GUIDE')){const a=document.getElementById('xrayPhysics'),b=document.getElementById('xrayOutput'),c=document.getElementById('xrayInput'),d=document.getElementById('xrayWait');if(a)a.textContent='Физика: PP1/KNB встречается с PP2 guide; после B49 guide реверсирует к PP2';if(b)b.textContent='Выход: Y68 FWD → REV';if(c)c.textContent='Вход: B64 HOME · B69 position · B49 contact closed';if(d)d.textContent='PLC ждёт: B49 CLOSED перед подачей проволоки'}};

  decorate();paint();renderAll();
})();