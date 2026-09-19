// v8.6.17 — PP2 moving guide carriage with clearly visible moving guide fingers
(function(){
  if(typeof machine==='undefined'||typeof pressCycle!=='function'||typeof returnHome!=='function')return;

  function pct(){return Math.max(0,Math.min(100,Number(machine.guide||0)))}
  function stateText(){
    if(currentFault?.id==='guidepos')return 'FAULT';
    if(machine.Y68)return 'MOVING';
    if(machine.B49)return 'CLOSED';
    if(machine.B64)return 'HOME';
    return 'POSITION';
  }
  function assembly(){return document.getElementById('pp2GuideAssembly')}

  function ensureAssembly(){
    const scene=document.getElementById('machineScene'),p2=document.getElementById('press2');
    if(!scene||!p2)return;
    scene.classList.add('pp2-guides-enabled');
    if(!assembly())p2.insertAdjacentHTML('beforeend','<div id="pp2GuideAssembly"><div class="pg-frame"></div><i class="pg-finger f1"></i><i class="pg-finger f2"></i><i class="pg-finger f3"></i><i class="pg-finger f4"></i><span class="pg-label">PP2 · ПОДВИЖНЫЕ НАПРАВЛЯЮЩИЕ</span><span class="pg-state">B64 · HOME</span></div>');
    if(!document.getElementById('guideReadout'))scene.insertAdjacentHTML('beforeend','<div id="guideReadout" class="guide-readout"></div>');

    const node=document.getElementById('node26Bits');
    if(node&&!node.querySelector('[data-nodeout="Y68"]'))node.insertAdjacentHTML('beforeend','<div class="bit node-guide-out" data-nodeout="Y68"><span>Y68 · GUIDE MOVE</span><i class="lamp"></i></div><div class="bit node-guide-out" data-nodeout="Y69"><span>Y69 · GUIDE PRESSURE</span><i class="lamp"></i></div>');

    const status=document.querySelector('#hmi-status .positions');
    if(status&&!document.getElementById('guideStatusCard'))status.insertAdjacentHTML('beforeend','<div id="guideStatusCard" class="guide-hmi-card">PP2 Guide <b id="guideStatusText">HOME</b></div>');

    const grid=document.getElementById('manualFunctions');
    if(grid&&grid.parentElement&&!document.getElementById('manualGuideControls')){
      grid.insertAdjacentHTML('beforebegin','<div id="manualGuideControls" class="guide-manual-controls"><b>PP2 · ПОДВИЖНЫЕ НАПРАВЛЯЮЩИЕ</b><div class="row"><button data-guidemanual="close">НАПРАВЛЯЮЩИЕ → CLOSED</button><button data-guidemanual="home">НАПРАВЛЯЮЩИЕ ← HOME</button></div><small>B64 — исходное положение · B69 — положение каретки · B49 — направляющие сомкнуты. Y68/Y69 показаны как учебные команды привода/давления.</small></div>');
      document.querySelectorAll('[data-guidemanual]').forEach(b=>b.onclick=async()=>{
        if(busy){log('Ручное движение направляющих заблокировано во время автоматического цикла.','bad');return}
        await moveGuide(b.dataset.guidemanual==='close'?100:0,false)
      })
    }
    const dg=document.querySelector('[data-diag="guide"]');if(dg)dg.textContent='PP2 направляющие · B64/B69/B49';
  }

  function paintGuide(){
    ensureAssembly();
    const a=assembly();if(!a)return;
    const p=pct();
    a.style.setProperty('--pp2-guide-shift',(-0.95*p)+'px');
    a.classList.toggle('moving',!!machine.Y68);
    a.classList.toggle('closed',!!machine.B49);
    a.classList.toggle('fault',currentFault?.id==='guidepos');
    const st=a.querySelector('.pg-state');if(st)st.textContent=stateText()+' · '+Math.round(p)+'%';
    const ro=document.getElementById('guideReadout');
    if(ro){
      const cls=currentFault?.id==='guidepos'?'bad':machine.Y68?'move':machine.B49?'good':'';
      ro.innerHTML='<strong>PP2 · ПОДВИЖНЫЕ НАПРАВЛЯЮЩИЕ</strong><span class="'+cls+'"><b>'+stateText()+'</b> · '+Math.round(p)+'%</span><br>B64 '+(machine.B64?'HOME':'—')+' · B69 '+(machine.B69?'POS':'MOVING')+' · B49 '+(machine.B49?'CLOSED':'OPEN')+'<br>Y68 '+(machine.Y68?'ON':'OFF')+' · Y69 '+(machine.Y69?'PRESSURE':'OFF');
    }
    const pos=document.getElementById('guidePos');if(pos)pos.textContent=Math.round(p)+'%';
    document.querySelectorAll('[data-nodeout]').forEach(x=>{const id=x.dataset.nodeout,v=!!machine[id],lamp=x.querySelector('i');if(lamp)lamp.className='lamp '+(v?'on':'')});
  }

  async function moveGuide(target,fromCycle=false){
    target=target?100:0;
    const start=pct();
    if(start===target){paintGuide();return true}
    machine.Y68=true;machine.Y69=false;machine.B49=false;machine.B64=false;machine.B69=false;
    setPhase(target?'НАПРАВЛЯЮЩИЕ PP2 · ВПЕРЁД':'НАПРАВЛЯЮЩИЕ PP2 · HOME');
    const steps=7;
    for(let n=1;n<=steps;n++){
      machine.guide=start+(target-start)*(n/steps);paintGuide();renderAll();await wait(opt.slow?190:115);
      if(fromCycle&&target===100&&currentFault?.id==='guidepos'&&n===4){machine.Y68=false;machine.Y69=false;machine.B69=false;machine.B49=false;paintGuide();triggerFault(currentFault);return false}
    }
    machine.guide=target;machine.Y68=false;machine.B69=true;
    if(target===100){
      machine.B49=true;machine.B64=false;machine.Y69=true;
      log('PP2: подвижная каретка направляющих достигла рабочего положения. B49 подтверждает замыкание пути проволоки.','good')
    }else{
      machine.B49=false;machine.B64=true;machine.Y69=false;
      log('PP2: каретка направляющих вернулась в исходное положение B64.','good')
    }
    paintGuide();renderAll();return true
  }

  if(typeof faults!=='undefined'&&!faults.some(f=>f.id==='guidepos'))faults.push({id:'guidepos',phase:'press',code:'TRAIN GUIDE POS',sym:'Каретка направляющих пресс-плиты 2 вышла из исходного положения, но не достигла рабочего положения.',root:'guide',evidence:'Учебный сценарий: команда движения есть, B64 уже снят, но B69 не подтверждает положение и B49 не подтверждает замыкание направляющих.',repair:'Проверить механику каретки PP2 и сигналы B64/B69/B49',quality:'hold'});

  const previousPressCycle=pressCycle;
  pressCycle=async function(){
    const ok=await previousPressCycle();if(!ok)return false;
    // Base/lift cycle closes the old simplified guide instantly. Reset it and show the real visible motion now.
    machine.guide=0;machine.B49=false;machine.B64=true;machine.B69=true;machine.Y68=false;machine.Y69=false;
    paintGuide();renderAll();
    setStep(4);log('После подпрессовки каретка направляющих на PP2 начинает движение к рабочему положению.');
    return await moveGuide(100,true)
  };

  const previousReturnHome=returnHome;
  returnHome=async function(){
    setStep(11);setPhase('ВОЗВРАТ · НАПРАВЛЯЮЩИЕ PP2');
    await moveGuide(0,false);
    return await previousReturnHome()
  };

  const previousReset=resetMachine;
  resetMachine=function(){
    previousReset();
    machine.Y68=false;machine.Y69=false;machine.guide=0;machine.B49=false;machine.B64=true;machine.B69=true;
    ensureAssembly();paintGuide()
  };

  const previousRenderAll=renderAll;
  renderAll=function(){
    previousRenderAll();ensureAssembly();paintGuide();
    const hs=document.getElementById('guideStatusText');if(hs)hs.textContent=stateText()+' · '+Math.round(pct())+'%';
    if(xray&&phase.includes('НАПРАВЛЯЮЩ')){
      const a=document.getElementById('xrayPhysics'),b=document.getElementById('xrayOutput'),c=document.getElementById('xrayInput'),d=document.getElementById('xrayWait');
      if(a)a.textContent='Физика: каретка направляющих на PP2 выдвигается и замыкает путь проволоки';
      if(b)b.textContent='Команда: привод направляющей';
      if(c)c.textContent='Входы: B64 HOME · B69 положение · B49 CLOSED';
      if(d)d.textContent='PLC ждёт: B49 CLOSED перед подачей проволоки'
    }
  };

  ensureAssembly();machine.Y68=!!machine.Y68;machine.Y69=!!machine.Y69;paintGuide();renderAll();
})();
