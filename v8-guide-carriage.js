// v8.6.14 — real PP2 moving guide carriage: B64/B69/B49, Y68/Y69
(function(){
  if(typeof machine==='undefined'||typeof pressCycle!=='function'||typeof returnHome!=='function')return;

  function g(){return document.getElementById('guide')}
  function pct(){return Math.max(0,Math.min(100,Number(machine.guide||0)))}
  function stateText(){
    if(currentFault?.id==='guidepos')return 'FAULT';
    if(machine.Y68)return 'MOVING';
    if(machine.B49)return 'CLOSED';
    if(machine.B64)return 'HOME';
    return 'POSITION';
  }
  function paintGuide(){
    const guide=g(); if(!guide)return;
    if(!guide.querySelector('.gc-frame'))guide.innerHTML='<div class="gc-frame"></div><span class="gc-label">PP2 · MOVING GUIDE</span><span class="gc-state">HOME</span>';
    guide.style.setProperty('--guide-x',(-0.92*pct())+'px');
    guide.classList.toggle('moving',!!machine.Y68);
    guide.classList.toggle('closed',!!machine.B49);
    guide.classList.toggle('fault',currentFault?.id==='guidepos');
    guide.classList.toggle('forward',pct()>=95);
    const s=guide.querySelector('.gc-state');if(s)s.textContent=stateText()+' · '+Math.round(pct())+'%';
    const ro=document.getElementById('guideReadout');
    if(ro){
      const cls=currentFault?.id==='guidepos'?'bad':machine.Y68?'move':machine.B49?'good':'';
      ro.innerHTML='<strong>PP2 · ПОДВИЖНАЯ НАПРАВЛЯЮЩА</strong><span class="'+cls+'"><b>'+stateText()+'</b> · '+Math.round(pct())+'%</span><br>B64 '+(machine.B64?'HOME':'—')+' · B69 '+(machine.B69?'POS':'MOVING')+' · B49 '+(machine.B49?'CLOSED':'OPEN')+'<br>Y68 '+(machine.Y68?'ON':'OFF')+' · Y69 '+(machine.Y69?'PRESSURE':'OFF');
    }
    const p=document.getElementById('guidePos');if(p)p.textContent=Math.round(pct())+'%';
    document.querySelectorAll('[data-nodeout]').forEach(x=>{const id=x.dataset.nodeout,v=!!machine[id];const lamp=x.querySelector('i');if(lamp)lamp.className='lamp '+(v?'on':'')});
  }

  function decorateGuide(){
    const guide=g(),p2=document.getElementById('press2'),scene=document.getElementById('machineScene');
    if(guide&&p2&&guide.parentElement!==p2)p2.appendChild(guide);
    if(scene&&!document.getElementById('guideReadout'))scene.insertAdjacentHTML('beforeend','<div id="guideReadout" class="guide-readout"></div>');
    if(guide&&!guide.querySelector('.gc-frame'))guide.innerHTML='<div class="gc-frame"></div><span class="gc-label">PP2 · MOVING GUIDE</span><span class="gc-state">HOME</span>';

    const node=document.getElementById('node26Bits');
    if(node&&!node.querySelector('[data-nodeout="Y68"]')){
      node.insertAdjacentHTML('beforeend','<div class="bit node-guide-out" data-nodeout="Y68"><span>U030:02 · Y68 GUIDE MOVE</span><i class="lamp"></i></div><div class="bit node-guide-out" data-nodeout="Y69"><span>U030:02 · Y69 GUIDE PRESSURE</span><i class="lamp"></i></div>');
    }
    const status=document.querySelector('#hmi-status .positions');
    if(status&&!document.getElementById('guideStatusCard'))status.insertAdjacentHTML('beforeend','<div id="guideStatusCard" class="guide-hmi-card">PP2 Guide <b id="guideStatusText">HOME</b></div>');
    const grid=document.getElementById('manualFunctions');
    if(grid&&grid.parentElement&&!document.getElementById('manualGuideControls')){
      grid.insertAdjacentHTML('beforebegin','<div id="manualGuideControls" class="guide-manual-controls"><b>PP2 · ПОДВИЖНАЯ НАПРАВЛЯЮЩА</b><div class="row"><button data-guidemanual="close">НАПРАВЛЯЮЩА → CLOSED</button><button data-guidemanual="home">НАПРАВЛЯЮЩА ← HOME</button></div><small>B64 — исходное положение · B69 — положение каретки · B49 — направляющая сомкнута · Y68 — движение · Y69 — давление.</small></div>');
      document.querySelectorAll('[data-guidemanual]').forEach(b=>b.onclick=async()=>{
        if(busy){log('Ручное движение направляющей заблокировано во время автоматического цикла.','bad');return}
        if(b.dataset.guidemanual==='close')await moveGuide(100);else await moveGuide(0);
      });
    }
    const dg=document.querySelector('[data-diag="guide"]');if(dg)dg.textContent='PP2 guide · B64/B69/B49';
    paintGuide();
  }

  async function moveGuide(target,fromCycle=false){
    target=target?100:0;
    const start=pct();
    if(start===target){paintGuide();return true}
    machine.Y68=true;machine.Y69=false;machine.B49=false;machine.B64=false;machine.B69=false;
    setPhase(target?'НАПРАВЛЯЮЩА PP2 · ВПЕРЁД':'НАПРАВЛЯЮЩА PP2 · HOME');
    const steps=5;
    for(let n=1;n<=steps;n++){
      machine.guide=start+(target-start)*(n/steps);
      paintGuide();renderAll();
      await wait(opt.slow?210:115);
      if(fromCycle&&target===100&&currentFault?.id==='guidepos'&&n===3){
        machine.Y68=false;machine.Y69=false;machine.B69=false;machine.B49=false;
        paintGuide();triggerFault(currentFault);return false;
      }
    }
    machine.guide=target;machine.Y68=false;machine.B69=true;
    if(target===100){machine.B49=true;machine.B64=false;machine.Y69=true;log('PP2: подвижная направляющая достигла рабочего положения. B49 подтверждает замыкание пути проволоки.','good')}
    else{machine.B49=false;machine.B64=true;machine.Y69=false;log('PP2: подвижная направляющая вернулась в исходное положение B64.','good')}
    paintGuide();renderAll();return true;
  }

  if(typeof faults!=='undefined'&&!faults.some(f=>f.id==='guidepos'))faults.push({
    id:'guidepos',phase:'press',code:'TRAIN GUIDE POS',
    sym:'Подвижная направляющая пресс-плиты 2 вышла из исходного положения, но не достигла рабочего положения.',
    root:'guide',
    evidence:'Учебный сценарий: Y68 даёт команду движения, B64 уже снят, но B69 не подтверждает положение и B49 не подтверждает замыкание направляющей.',
    repair:'Проверить механическое движение каретки PP2, B64/B69/B49, Y68/Y69 и Node 26',quality:'hold'
  });

  const previousPressCycle=pressCycle;
  pressCycle=async function(){
    const ok=await previousPressCycle();if(!ok)return false;
    // Previous cycle ended with a simplified instant guide closure; replace it by real visible motion.
    machine.guide=0;machine.B49=false;machine.B64=true;machine.B69=true;machine.Y68=false;machine.Y69=false;
    const guide=g();if(guide){guide.classList.remove('forward','closed','moving','fault');guide.style.setProperty('--guide-x','0px')}
    renderAll();
    setStep(4);log('После подпрессовки каретка направляющей на PP2 начинает движение к рабочему положению.');
    return await moveGuide(100,true);
  };

  const previousReturnHome=returnHome;
  returnHome=async function(){
    setStep(11);setPhase('ВОЗВРАТ · НАПРАВЛЯЮЩА PP2');
    await moveGuide(0,false);
    return await previousReturnHome();
  };

  const previousReset=resetMachine;
  resetMachine=function(){
    previousReset();
    machine.Y68=false;machine.Y69=false;machine.guide=0;machine.B49=false;machine.B64=true;machine.B69=true;
    decorateGuide();paintGuide();
  };

  const previousRenderAll=renderAll;
  renderAll=function(){
    previousRenderAll();decorateGuide();paintGuide();
    const hs=document.getElementById('guideStatusText');if(hs)hs.textContent=stateText()+' · '+Math.round(pct())+'%';
    if(xray&&phase.includes('НАПРАВЛЯЮЩА')){
      const a=document.getElementById('xrayPhysics'),b=document.getElementById('xrayOutput'),c=document.getElementById('xrayInput'),d=document.getElementById('xrayWait');
      if(a)a.textContent='Физика: каретка направляющей на PP2 замыкает/открывает путь проволоки';
      if(b)b.textContent='Выход: Y68 движение · Y69 давление';
      if(c)c.textContent='Вход: B64 HOME · B69 положение · B49 CLOSED';
      if(d)d.textContent='PLC ждёт: B49 CLOSED перед подачей проволоки';
    }
  };

  decorateGuide();machine.Y68=!!machine.Y68;machine.Y69=!!machine.Y69;paintGuide();renderAll();
})();
