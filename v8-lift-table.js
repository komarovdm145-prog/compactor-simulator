// v8.6.7 — real PCH-ALFA lift table sequence + PP1 KNB positions
(function(){
  if(typeof machine==='undefined'||typeof pressCycle!=='function')return;

  function liftPct(){return Number(machine.lift||0)}
  function setSceneLift(pos){
    machine.lift=pos;
    const scene=document.getElementById('machineScene'),table=document.getElementById('liftTable');
    if(scene){scene.classList.toggle('table-half',pos===50);scene.classList.toggle('table-full',pos===100)}
    if(table){table.className='lift-table'+(pos===50?' half':pos===100?' up':'');if(!table.querySelector('span'))table.innerHTML='<span>ПОДЪЁМНЫЙ СТОЛ</span>'}
    const ro=document.getElementById('liftReadout');if(ro)ro.innerHTML=`СТОЛ <b>${pos}%</b> · B59 ${machine.B59?'OK':'MOVING'}`;
  }

  function decorate(){
    const scene=document.getElementById('machineScene');
    const table=document.getElementById('liftTable');
    if(table&&!table.querySelector('span'))table.innerHTML='<span>ПОДЪЁМНЫЙ СТОЛ</span>';
    if(scene&&!document.getElementById('liftReadout'))scene.insertAdjacentHTML('beforeend','<div id="liftReadout" class="lift-readout">СТОЛ <b>0%</b> · B59 HOME</div>');
    if(scene&&!document.getElementById('headMapGame'))scene.insertAdjacentHTML('beforeend',`<div id="headMapGame" class="head-map-game"><strong>PRESS PLATE 1 · СЛЕВА · KNB</strong><div class="head-map-grid"><i data-maphead="3">R3 · 3<br>↑ ЛЕВ.</i><i data-maphead="2">R2 · 2<br>↑ ПРАВ.</i><i data-maphead="4">R4 · 4<br>↓ ЛЕВ.</i><i data-maphead="1">R1 · 1<br>↓ ПРАВ.</i></div></div>`);
    const hb=document.querySelector('.head-bank>span');if(hb)hb.textContent='PP1 · KNB 1–4';
    document.querySelectorAll('.head-bank i').forEach(i=>{const n=i.textContent.trim(),map={1:'1/R1',2:'2/R2',3:'3/R3',4:'4/R4'};if(map[n])i.textContent=map[n]});
    const grid=document.getElementById('manualFunctions');
    if(grid&&grid.parentElement&&!document.getElementById('manualLiftControls')){
      grid.insertAdjacentHTML('beforebegin',`<div id="manualLiftControls" class="manual-lift-controls"><b>ПОДЪЁМНЫЙ СТОЛ · B58 / B59</b><div class="row"><button data-liftmanual="50">СТОЛ ↑ 50%</button><button data-liftmanual="100">СТОЛ ↑ SET</button><button data-liftmanual="0">СТОЛ ↓ HOME</button></div></div>`);
      document.querySelectorAll('[data-liftmanual]').forEach(b=>b.onclick=()=>{if(busy){log('Ручное движение стола заблокировано во время цикла.','bad');return}let p=+b.dataset.liftmanual;machine.B59=false;setSceneLift(p);renderAll();setTimeout(()=>{machine.B59=true;setSceneLift(p);renderAll();log(`Ручной режим: подъёмный стол ${p===0?'в исходном положении':p+'%'}.`)},320)});
    }
    const pg=document.querySelector('#hmi-prepress .param-grid');
    if(pg&&!document.getElementById('hmiLiftStatus'))pg.insertAdjacentHTML('beforeend','<div id="hmiLiftStatus"><span>Подъёмный стол</span><b id="hLift">0% · B59 HOME</b></div>');
    const pressDiag=document.querySelector('[data-diag="press"]');if(pressDiag)pressDiag.textContent='B58 / B59 / подъёмный стол';
    const b59bit=document.querySelector('[data-bit="B59"] span');if(b59bit)b59bit.textContent='B59 lift position';
  }

  if(typeof faults!=='undefined'&&!faults.some(f=>f.id==='b59'))faults.push({id:'b59',phase:'press',code:'ALM B59',sym:'Подъёмный стол начал подъём, но заданное положение не подтверждается.',root:'press',evidence:'B58 разрешил подъём, но B59 не подтверждает требуемую высоту. Проверить систему измерения B59, гидроцилиндр и гидравлику стола.',repair:'Проверить B59, гидроцилиндр и гидравлику подъёмного стола',quality:'hold'});

  const oldResetMachine=resetMachine;
  resetMachine=function(){oldResetMachine();machine.lift=0;machine.B59=true;const scene=document.getElementById('machineScene');if(scene)scene.classList.remove('table-half','table-full');setSceneLift(0);decorate();renderAll()};

  const oldRenderSensors=renderSensors;
  renderSensors=function(){
    oldRenderSensors();
    const cards=[...document.querySelectorAll('#sensorStrip .sensor')];
    const c=cards.find(x=>x.querySelector('span')?.textContent.startsWith('B59'));
    if(c){c.dataset.lift='1';c.querySelector('span').textContent=`B59 · ${liftPct()}%`;const lamp=c.querySelector('.lamp');if(!machine.B59)lamp.classList.add('moving')}
  };

  renderPrepressFlow=function(){
    const names=['Исходное · стол 0%','Стол ↑ ≈50%','Пресс-плиты вперёд','B58 край → стол ↑','B59 заданная высота','Предв. усилие / >30т','Двойная: -100 мм → повтор','B49 guide closed'];
    const el=document.getElementById('prepressFlow');if(el)el.innerHTML=names.map((n,i)=>`<div data-flow="${i}">${n}</div>`).join('')
  };

  renderXray=function(){
    if(!xray)return;
    const map={
      'ИСХОДНОЕ':['плиты разведены, стол внизу','—','B53 B56 · B59 HOME · B64 · B20','пусковой сигнал'],
      'СТОЛ':['стол поднимает бунт','гидравлика подъёмного стола','B58 разрешение · B59 положение','заданную высоту / центровку'],
      'ПОДПРЕССОВКА':['плиты сходятся, стол поддерживает и центрирует бунт','Y80/Y81/Y82/Y83','B51 B52 · B58 · B59','замедление импульсов / усилие'],
      'ПОДАЧА':['проволока идёт по направляющим','Y22 + Y23','B24 + B28 → B2','B2 + длину импульсов'],
      'НАТЯЖЕНИЕ':['проволока выбирается вокруг бунта','Y23 reverse/tension','B28 pulses','останов натяжения + заданные импульсы'],
      'СКРУТКА':['зажим → скрутка → резка','Y1 Y3 Y4 Y5','B5 → B3','подтверждение скрутки'],
      'ВОЗВРАТ':['головы/направляющие → плиты → стол вниз','Y2/Y3/Y20 + press return','B20 B53 B56 B64 · B59 HOME','все исходные сигналы']
    };
    let key=phase.includes('СТОЛ')?'СТОЛ':Object.keys(map).find(k=>phase.includes(k))||'ИСХОДНОЕ',a=map[key];
    $('xrayPhysics').textContent='Физика: '+a[0];$('xrayOutput').textContent='Выход: '+a[1];$('xrayInput').textContent='Вход: '+a[2];$('xrayWait').textContent='PLC ждёт: '+a[3]
  };

  pressCycle=async function(){
    const scene=$('machineScene'),p1=$('press1'),p2=$('press2');
    setStep(1);setPhase('ПОДПРЕССОВКА · СТОЛ ½');
    machine.B53=false;machine.B56=false;machine.B59=false;setSceneLift(50);p1.classList.add('approach');p2.classList.add('approach');
    log('Начало подпрессовки: подъёмный стол идёт примерно на половину рабочей высоты.');
    for(let i=0;i<3;i++){machine.B51+=8;machine.B52+=8;renderAll();await wait(opt.slow?260:150)}
    setStep(2);setPhase('ПОДПРЕССОВКА · ПОДХОД К БУНТУ');
    if(currentFault?.id==='b58'){machine.B58=false;triggerFault(currentFault);return false}
    machine.B58=true;renderAll();log('B58: край бунта обнаружен — разрешён подъём и центровка.');await wait(opt.slow?520:280);
    machine.B59=false;setSceneLift(100);setPhase('ПОДПРЕССОВКА · СТОЛ ВВЕРХ');await wait(opt.slow?650:340);
    if(currentFault?.id==='b59'){machine.B59=false;triggerFault(currentFault);return false}
    machine.B59=true;renderAll();log('B59: заданная высота подъёмного стола достигнута.');
    p1.classList.remove('approach');p2.classList.remove('approach');p1.classList.add('in');p2.classList.add('in');
    for(let i=3;i<6;i++){machine.B51+=12;machine.B52+=12;renderAll();await wait(opt.slow?240:140)}
    if(currentFault?.id==='node26'){triggerFault(currentFault);return false}
    setStep(3);setPhase('ПОДПРЕССОВКА · ФАЗА 2');
    if(settings.force>30){log('Предварительное усилие достигнуто: Y81/Y83 отключены, переход на полную силу.');await wait(350)}
    if(settings.prepress===2){
      log('Двойная подпрессовка: пресс-плиты реверсируют примерно на 100 мм; стол остаётся поднят и удерживает бунт.');
      p1.classList.remove('in');p2.classList.remove('in');p1.classList.add('approach');p2.classList.add('approach');machine.B51-=12;machine.B52-=12;renderAll();await wait(opt.slow?900:450);
      p1.classList.remove('approach');p2.classList.remove('approach');p1.classList.add('in');p2.classList.add('in');machine.B51+=12;machine.B52+=12;renderAll();await wait(opt.slow?800:400)
    }
    $('coil').classList.add('compressed');setStep(4);machine.B64=false;machine.B49=true;machine.guide=100;$('guide').classList.add('forward');log('B49: направляющие сомкнуты. Подача разрешена. Подъёмный стол остаётся в верхнем положении.');renderAll();return true
  };

  returnHome=async function(){
    setStep(11);setPhase('ВОЗВРАТ · НАПРАВЛЯЮЩИЕ');machine.B49=false;machine.B64=true;machine.guide=0;$('guide').classList.remove('forward');await wait(300);
    setPhase('ВОЗВРАТ · ПРЕСС-ПЛИТЫ');$('press1').classList.remove('in','approach');$('press2').classList.remove('in','approach');machine.B51=0;machine.B52=0;machine.B53=true;machine.B56=true;machine.B58=false;$('coil').classList.remove('compressed');$('coil').classList.add('bound');renderAll();await wait(opt.slow?720:420);
    setPhase('ВОЗВРАТ · СТОЛ ВНИЗ');machine.B59=false;setSceneLift(50);renderAll();await wait(opt.slow?550:300);setSceneLift(0);await wait(opt.slow?550:300);machine.B59=true;renderAll();log('B59: подъёмный стол в исходном нижнем положении.');
    resetHeadStates();await wait(250);setPhase('ИСХОДНОЕ');busy=false;stats.cycles++;stats.coils++;stats.shiftCoils++;save();renderAll()
  };

  const oldRenderAll=renderAll;
  renderAll=function(){
    oldRenderAll();decorate();
    const h=document.getElementById('hLift');if(h)h.textContent=`${liftPct()}% · B59 ${machine.B59?(liftPct()===0?'HOME':'POSITION OK'):'MOVING'}`;
    const ro=document.getElementById('liftReadout');if(ro)ro.innerHTML=`СТОЛ <b>${liftPct()}%</b> · B59 ${machine.B59?'OK':'MOVING'}`;
    document.querySelectorAll('[data-maphead]').forEach(cell=>{let n=cell.dataset.maphead,src=document.querySelector(`[data-vhead="${n}"]`);cell.className=src?.className||''})
  };

  decorate();renderPrepressFlow();machine.lift=machine.lift||0;setSceneLift(machine.lift);renderAll();
})();