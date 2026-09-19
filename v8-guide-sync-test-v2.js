// GUIDE INTEGRATION v2 — isolated geometry-driven PP1 KNB ↔ PP2 GUIDE model.
// Stable game/training files are NOT modified by this file.
(function(){
  if(typeof machine==='undefined'||typeof pressCycle!=='function'||typeof returnHome!=='function')return;

  const $id=id=>document.getElementById(id), clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const scene=()=>document.getElementById('machineScene');
  const p1=()=>document.getElementById('press1'), p2=()=>document.getElementById('press2'), guide=()=>document.getElementById('guide');
  const pause=ms=>wait(opt.slow?Math.round(ms*1.65):ms);
  let guidePx=0, contactMaxPx=1, p1Shift=0, p2Shift=0, coilWidth=292;

  machine.Y68=false; machine.guideDir='OFF'; machine.guide=0;

  function decorate(){
    const s=scene(),a=p1(),b=p2(),g=guide(); if(!s||!a||!b||!g)return;
    if(!a.querySelector('.gv2-knb'))a.insertAdjacentHTML('beforeend',`<div class="gv2-knb"><span class="gv2-knb-label">KNB · КАНАЛ 1 ИЗ 4</span><div class="gv2-knb-body"></div><div class="gv2-short-guide"><i class="gv2-head-tip"></i></div></div>`);
    if(!g.querySelector('.gv2-drive'))g.innerHTML=`<div class="gv2-drive"></div><div class="gv2-channel"><i class="gv2-mouth"></i></div><i class="gv2-origin"></i><span class="gv2-guide-label">PP2 · MOVING GUIDE</span>`;
    if(!s.querySelector('.gv2-contact'))s.insertAdjacentHTML('beforeend','<i class="gv2-contact"></i><div class="gv2-motion-arrow">GUIDE REV → PP2</div><div class="gv2-cycle-readout"><b>GUIDE INTEGRATION v2</b><span>геометрический стык KNB ↔ GUIDE</span></div>');
    if(!s.querySelector('#guideReadout'))s.insertAdjacentHTML('beforeend','<div id="guideReadout" class="guide-readout"></div>');
    const status=document.querySelector('#hmi-status .positions');
    if(status&&!document.getElementById('guideStatusCard'))status.insertAdjacentHTML('beforeend','<div id="guideStatusCard" class="guide-hmi-card">PP2 Guide <b id="guideStatusText">HOME</b></div>');
    const dg=document.querySelector('[data-diag="guide"]');if(dg)dg.textContent='PP2 guide · B64 / B69 / B49';
  }

  function setLift(v){
    machine.lift=v; const s=scene(),t=$id('liftTable');
    if(s){s.classList.toggle('table-half',v===50);s.classList.toggle('table-full',v===100)}
    if(t){t.className='lift-table'+(v===50?' half':v===100?' up':'');if(!t.querySelector('span'))t.innerHTML='<span>ПОДЪЁМНЫЙ СТОЛ</span>'}
  }
  function setPlates(a,b){
    p1Shift=a;p2Shift=b; const l=p1(),r=p2();
    if(l){l.classList.remove('in','approach');l.style.transform=`translateX(${a}px)`}
    if(r){r.classList.remove('in','approach');r.style.transform=`translateX(${b}px)`}
  }
  function setCoil(w,compressed=false){
    coilWidth=w; const c=$id('coil');if(!c)return;c.style.width=w+'px';c.classList.toggle('compressed',compressed)
  }
  function relX(el){const s=scene();if(!s||!el)return 0;const sr=s.getBoundingClientRect(),r=el.getBoundingClientRect();return r.left-sr.left+r.width/2}
  function headX(){return relX(document.querySelector('.gv2-head-tip'))}
  function originX(){return relX(document.querySelector('.gv2-origin'))}
  function mouthX(){return originX()-guidePx}
  function gapNow(){return Math.max(0,originX()-headX())}
  function geometryLocked(){return Math.abs(mouthX()-headX())<=4}
  function setGuideLength(px){
    guidePx=Math.max(0,px); const g=guide();if(g)g.style.setProperty('--gv2-len',guidePx+'px');
    machine.guide=clamp((guidePx/contactMaxPx)*100,0,100);
  }
  function phaseLabel(){
    if(machine.B64)return 'HOME'; if(machine.Y68&&machine.guideDir==='FWD')return 'FWD → KNB'; if(machine.Y68&&machine.guideDir==='REV')return 'REV → PP2'; if(machine.B49)return 'CONTACT LOCK'; return 'POSITION';
  }
  function paint(){
    decorate(); const s=scene(),g=guide(); if(!s||!g)return;
    g.classList.toggle('gv2-moving',!!machine.Y68);g.classList.toggle('gv2-locked',!!machine.B49);
    const c=s.querySelector('.gv2-contact'),arr=s.querySelector('.gv2-motion-arrow'),rd=s.querySelector('.gv2-cycle-readout');
    const hx=headX(); if(c){c.style.left=hx+'px';c.style.top='151px';c.classList.toggle('on',!!machine.B49)}
    if(arr){arr.style.left=Math.max(8,originX()-92)+'px';arr.style.top='181px';arr.classList.toggle('on',machine.Y68&&machine.guideDir==='REV')}
    const pct=Math.round(clamp((guidePx/contactMaxPx)*100,0,100));
    if(rd){const cls=machine.Y68&&machine.guideDir==='REV'?'rev':machine.B49?'good':'';rd.innerHTML=`<b class="${cls}">${phaseLabel()}</b><span>Guide ${pct}% · B49 ${machine.B49?'CLOSED':'OPEN'}</span>`}
    const ro=$id('guideReadout');if(ro){const cls=machine.Y68?'move':machine.B49?'good':'';ro.innerHTML=`<strong>PP2 · ПОДВИЖНАЯ НАПРАВЛЯЮЩА</strong><span class="${cls}"><b>${phaseLabel()}</b> · ${pct}%</span><br>B64 ${machine.B64?'HOME':'—'} · B69 ${machine.B69?'POS':'—'} · B49 ${machine.B49?'CLOSED':'OPEN'}<br>Y68 ${machine.Y68?machine.guideDir:'OFF'} · стык: ${geometryLocked()?'совпадает':'разомкнут'}`}
    const hs=$id('guideStatusText');if(hs)hs.textContent=phaseLabel()+' · '+pct+'%'; const gp=$id('guidePos');if(gp)gp.textContent=pct+'%';
  }
  async function frame(ms=135){paint();renderAll();await pause(ms)}

  async function guideHome(){
    const start=guidePx;machine.Y68=true;machine.guideDir='REV';machine.B49=false;machine.B64=false;machine.B69=false;
    for(let i=1;i<=7;i++){setGuideLength(start*(1-i/7));await frame(120)}
    setGuideLength(0);machine.Y68=false;machine.guideDir='OFF';machine.B64=true;machine.B69=true;paint();renderAll();
  }

  pressCycle=async function(){
    const c=$id('coil');setPlates(0,0);setGuideLength(0);setCoil(292,false);
    machine.B53=false;machine.B56=false;machine.B58=false;machine.B59=false;machine.B64=false;machine.B69=false;machine.B49=false;

    setStep(1);setPhase('ПОДПРЕССОВКА · СТОЛ ½');setLift(50);
    log('PP1 с KNB и PP2 начинают подход. Направляющая PP2 готовится к выдвижению.');
    for(let i=1;i<=4;i++){setPlates(i*3,-i*3);machine.B51+=5;machine.B52+=5;await frame(145)}

    setStep(2);setPhase('ПОДПРЕССОВКА · GUIDE FWD + B58');machine.Y68=true;machine.guideDir='FWD';
    for(let i=1;i<=4;i++){const gap=gapNow();setGuideLength(Math.max(0,gap*(0.16*i)));setPlates(12+i*2,-12-i*2);machine.B51+=4;machine.B52+=4;await frame(145)}
    if(currentFault?.id==='b58'){machine.B58=false;machine.Y68=false;triggerFault(currentFault);return false}
    machine.B58=true;log('B58: край бунта обнаружен — подъём и центровка разрешены.');renderAll();await pause(280);
    setLift(100);await pause(320);if(currentFault?.id==='b59'){machine.B59=false;machine.Y68=false;triggerFault(currentFault);return false}machine.B59=true;

    if(settings.prepress===2){
      setStep(3);setPhase('ДВОЙНАЯ ПОДПРЕССОВКА · РАЗГРУЗКА ~100 мм');
      const keep=Math.max(0,guidePx-8);for(let i=1;i<=5;i++){setPlates(20-i*2,-20+i*2);setGuideLength(Math.max(0,keep-i*2));machine.B51-=2;machine.B52-=2;await frame(135)}
      setPhase('ДВОЙНАЯ ПОДПРЕССОВКА · ПОВТОР');for(let i=1;i<=5;i++){setPlates(10+i*2,-10-i*2);machine.B51+=2;machine.B52+=2;setGuideLength(Math.min(gapNow()*0.72,guidePx+5));await frame(135)}
    }

    // Contact is established by real screen geometry: guide mouth reaches the KNB short-guide tip.
    setStep(4);setPhase('KNB ↔ GUIDE · ПОИСК СТЫКА');machine.Y68=true;machine.guideDir='FWD';machine.B49=false;machine.B69=false;
    const startP1=p1Shift,startP2=p2Shift,startW=coilWidth;
    for(let i=1;i<=9;i++){
      const k=i/9;setPlates(startP1+10*k,startP2-10*k);setCoil(startW-(startW-245)*k,false);machine.B51+=3;machine.B52+=3;
      const gap=gapNow();setGuideLength(Math.max(0,gap*(0.78+0.22*k)));await frame(125)
    }
    contactMaxPx=Math.max(12,gapNow());setGuideLength(contactMaxPx);await frame(120);
    if(currentFault?.id==='node26'){machine.Y68=false;triggerFault(currentFault);return false}
    if(currentFault?.id==='guidepos'){machine.Y68=false;machine.B49=false;machine.B69=false;paint();triggerFault(currentFault);return false}
    machine.B49=geometryLocked();machine.B69=machine.B49;machine.Y68=false;machine.guideDir='OFF';
    if(!machine.B49){log('GUIDE TEST: геометрия не дала физического стыка KNB ↔ GUIDE. B49 не включён.','bad');return false}
    log('Физический стык KNB ↔ PP2 GUIDE достигнут. B49 CLOSED.','good');await frame(320);

    // After meeting, plates continue inward. The required bridge length shrinks, so the guide visibly reverses toward PP2.
    setPhase('ПОДПРЕССОВКА · GUIDE REV → PP2');machine.Y68=true;machine.guideDir='REV';machine.B69=false;
    const meetP1=p1Shift,meetP2=p2Shift;const finalExt=Math.max(12,contactMaxPx*0.32);const extra=Math.max(8,(contactMaxPx-finalExt)/2);
    for(let i=1;i<=10;i++){
      const k=i/10;setPlates(meetP1+extra*k,meetP2-extra*k);setCoil(245-(245-205)*k,true);machine.B51+=2.5;machine.B52+=2.5;
      setGuideLength(gapNow());machine.B49=geometryLocked();await frame(150)
    }
    machine.Y68=false;machine.guideDir='OFF';machine.B69=true;machine.B49=geometryLocked();c.classList.add('compressed');
    if(machine.B49)log('Прессование продолжилось: направляющая ушла назад к PP2 и сохранила стык с KNB. B49 CLOSED.','good');
    else log('Потерян стык KNB ↔ GUIDE во время реверса. Требуется корректировка геометрии.','bad');
    paint();renderAll();return machine.B49;
  };

  returnHome=async function(){
    setStep(11);setPhase('ВОЗВРАТ · GUIDE HOME');machine.B49=false;await frame(160);await guideHome();log('B64: направляющая PP2 в исходном положении.','good');
    setPhase('ВОЗВРАТ · ПРЕСС-ПЛИТЫ');
    const a=p1Shift,b=p2Shift,w=coilWidth;for(let i=1;i<=8;i++){const k=i/8;setPlates(a*(1-k),b*(1-k));setCoil(w+(292-w)*k,false);machine.B51=Math.max(0,machine.B51*(1-k));machine.B52=Math.max(0,machine.B52*(1-k));await frame(120)}
    setPlates(0,0);setCoil(292,false);machine.B51=0;machine.B52=0;machine.B53=true;machine.B56=true;machine.B58=false;
    setPhase('ВОЗВРАТ · СТОЛ ВНИЗ');machine.B59=false;setLift(50);renderAll();await pause(260);setLift(0);await pause(260);machine.B59=true;
    $id('coil').classList.remove('compressed');$id('coil').classList.add('bound');resetHeadStates();await pause(180);setPhase('ИСХОДНОЕ');busy=false;stats.cycles++;stats.coils++;stats.shiftCoils++;save();renderAll();
  };

  if(typeof faults!=='undefined'&&!faults.some(f=>f.id==='guidepos'))faults.push({id:'guidepos',phase:'press',code:'TRAIN GUIDE CONTACT',sym:'Y68 двигает направляющую PP2, но физический стык с KNB не подтверждён.',root:'guide',evidence:'B64 снят, направляющая движется, но B49 не подтверждает замкнутый тракт KNB ↔ guide.',repair:'Проверить механику каретки, переход между короткой направляющей KNB и PP2 guide, B49/B64/B69',quality:'hold'});

  const oldReset=resetMachine;resetMachine=function(){oldReset();setPlates(0,0);setGuideLength(0);setCoil(292,false);machine.Y68=false;machine.guideDir='OFF';machine.B49=false;machine.B64=true;machine.B69=true;decorate();paint()};
  const oldRenderAll=renderAll;renderAll=function(){oldRenderAll();paint();if(xray&&phase.includes('GUIDE')){const a=$id('xrayPhysics'),b=$id('xrayOutput'),c=$id('xrayInput'),d=$id('xrayWait');if(a)a.textContent='Физика: короткая направляющая KNB встречается с подвижной направляющей PP2; при дальнейшем прессовании PP2 guide реверсирует';if(b)b.textContent='Выход: Y68 FWD → REV';if(c)c.textContent='Вход: B64 HOME · B69 position · B49 физический стык';if(d)d.textContent='PLC ждёт: B49 CLOSED перед подачей проволоки'}};

  decorate();setPlates(0,0);setGuideLength(0);paint();renderAll();
})();
