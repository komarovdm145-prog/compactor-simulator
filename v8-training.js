// v8.3 — interactive training + selectable 4 / 8 ties
(function(){
  if(typeof settings==='undefined') return;

  settings.tiePasses=settings.tiePasses||2;

  function addTieModeControl(){
    const grid=document.querySelector('.controls-grid');
    if(grid&&!document.getElementById('tieModeControl')){
      grid.classList.add('has-tie-mode');
      grid.insertAdjacentHTML('beforeend',`<label id="tieModeControl" class="tie-mode-label">Обвязка бунта<div class="seg"><button data-tiepasses="1">ОДИН. · 4</button><button data-tiepasses="2">ДВОЙН. · 8</button></div></label>`);
      document.querySelectorAll('[data-tiepasses]').forEach(b=>b.onclick=()=>setTiePasses(+b.dataset.tiepasses));
    }
    const info=document.querySelector('.hmi-info');
    if(info&&!document.getElementById('hmiTieMode')) info.insertAdjacentHTML('beforeend','<div id="hmiTieMode" class="hmi-tie-mode"><span>Обвязка</span><b>ДВОЙНАЯ · 8</b></div>');
  }

  function setTiePasses(n){
    settings.tiePasses=n===1?1:2;
    document.querySelectorAll('[data-tiepasses]').forEach(b=>b.classList.toggle('active',+b.dataset.tiepasses===settings.tiePasses));
    updateTieModeUI();
    renderAll();
    log(settings.tiePasses===1?'Выбрана одинарная обвязка: 4 вязки.':'Выбрана двойная обвязка: 4 + 4 = 8 вязок.');
  }

  function updateTieModeUI(){
    document.querySelectorAll('[data-tiepasses]').forEach(b=>b.classList.toggle('active',+b.dataset.tiepasses===settings.tiePasses));
    const total=settings.tiePasses===1?4:8;
    if(document.getElementById('hmiTieMode')) document.querySelector('#hmiTieMode b').textContent=settings.tiePasses===1?'ОДИНАРНАЯ · 4':'ДВОЙНАЯ · 8';
    if(document.getElementById('beginnerHint')) $('beginnerHint').textContent=settings.tiePasses===1?'Нажми «Пуск цикла». Машина сожмёт бунт и выполнит одну серию из 4 вязок.':'Нажми «Пуск цикла». Машина сожмёт бунт и выполнит две серии по 4 вязки — всего 8.';
    if(document.getElementById('hPass')) $('hPass').textContent=pass?pass+'/'+settings.tiePasses:'—';
    if(document.getElementById('passRead')) $('passRead').textContent=pass?pass+'/'+settings.tiePasses:'—';
    const tl=[...document.querySelectorAll('#timeline div')];
    [8,9,10].forEach(i=>{if(tl[i]) tl[i].classList.toggle('tie-skip',settings.tiePasses===1)});
    if(tl[11]) tl[11].textContent=(settings.tiePasses===1?'9. ':'12. ')+'Возврат';
    if(document.getElementById('qualityBadge')&&!busy&&!currentFault) $('qualityBadge').textContent=total+' ВЯЗОК';
  }

  addTieModeControl();
  const oldRenderAll=renderAll;
  renderAll=function(){oldRenderAll();updateTieModeUI();};

  function reflowSingleTies(){
    [...$('tieLayer').children].forEach((t,i)=>t.style.top=(16+i*22)+'%');
  }

  const oldGenerateQuality=generateQuality;
  generateQuality=function(){
    const count=settings.tiePasses===1?4:8;
    let r=Math.random(),q={id:'ok',title:`${count}/${count} · качество OK`,text:count===4?'Все четыре вязки выполнены. Петли плотные, узлы удерживаются.':'Все восемь вязок выполнены. Петли плотные, узлы удерживаются.',defect:false};
    if(r<(opt.difficulty==='easy'?.06:opt.difficulty==='advanced'?.12:.19)){
      let arr=[
        {id:'loose',title:'Слабая утяжка',text:'Одна из вязок заметно свободнее остальных.',defect:true},
        {id:'twist',title:'Повреждение скрутки',text:'На одной скрутке виден дефект или отделившийся конец.',defect:true},
        {id:'scratch',title:'След от перетяжки',text:'Проволока затянута чрезмерно и оставила заметный след.',defect:true}
      ];q=arr[Math.floor(Math.random()*arr.length)]
    }
    qualityCase=q;$('qualityTitle').textContent=q.title;$('qualityText').textContent=q.text;
    $('qualityCoil').innerHTML=Array.from({length:count},(_,i)=>`<i style="top:${count===4?16+i*22:10+i*11}%" class="${q.defect&&i===Math.min(3,count-1)?(q.id==='loose'?'weak':'bad'):''}"></i>`).join('');
    $('qualityModal').classList.remove('hidden');
  };

  runCycle=async function(){
    if(busy||currentFault)return;
    if(settings.mode==='local'&&opt.difficulty!=='easy'){log('Автоматический цикл не запускается: выбран МЕСТНЫЙ режим.','bad');return}
    busy=true;currentFault=chooseFault();let f=currentFault;if(f&&settings.tiePasses===1)f.pass=1;currentFault=null;
    $('qualityBadge').textContent='ЦИКЛ';
    log('Пуск автоматического цикла · '+(settings.tiePasses===1?'одинарная обвязка 4 вязки.':'двойная обвязка 4+4 вязки.'));
    let ok=await pressCycleWithFault(f);if(!ok){busy=false;return}
    currentFault=f&&['feed','tension','twist'].includes(f.phase)?f:null;
    ok=await tyingPass(1);if(!ok){busy=false;return}
    if(settings.tiePasses===1){
      reflowSingleTies();currentFault=null;await returnHome();generateQuality();return;
    }
    currentFault=f&&f.pass===2?f:null;await wait(250);
    ok=await tyingPass(2);if(!ok){busy=false;return}
    currentFault=null;await returnHome();generateQuality();
  };
  if(document.getElementById('startCycle')) $('startCycle').onclick=runCycle;

  tutorials.splice(0,tutorials.length,
    ['Зачем нужен компактор?','С линии приходит большой рыхлый бунт катанки. Его нужно сжать и обвязать, чтобы он держал форму и его было удобно перевозить.','loose'],
    ['Бунт заходит в компактор','Бунт оказывается между двумя пресс-плитами. Машина ставит его в рабочее положение и готовится сжимать.','arrive'],
    ['Компактор сжимает бунт','Левая и правая плиты сходятся навстречу друг другу и прессуют бунт. Он становится короче и плотнее.','press'],
    ['Компактор обвязывает бунт','Четыре вязальные головы обводят бунт стальной проволокой, натягивают её, делают скрутку и отрезают. После этого бунт держит форму.','bound'],
    ['Попробуй полный цикл','Нажми «Запустить». Сначала плиты сожмут бунт, затем головы выполнят обвязку. Это тот же принцип, что и в основной игре, только упрощённо.','cycle'],
    ['Одинарная и двойная обвязка','Одинарная обвязка — один проход четырёх голов: 4 вязки. Двойная — два прохода по 4: всего 8 вязок. Выбери вариант и посмотри результат.','ties'],
    ['Иногда появляется ошибка','Во время работы может пропасть сигнал датчика, остановиться проволока, закусить направляющую или не завершиться вязка. Тогда машина показывает аварию.','fault'],
    ['Что делает оператор','Сначала оператор квитирует сообщение и может выполнить сброс. Если ошибка была случайной — машина вернётся в работу. Если причина осталась, одним сбросом её не починить: вызывают механика.','operator'],
    ['Что делает механик','Механик смотрит HMI и PLC, находит какой сигнал или механизм ведёт себя неправильно, проверяет узел, устраняет причину и после ремонта делает контрольный цикл.','mechanic'],
    ['Готово','Теперь можно идти в игру: запусти цикл, попробуй 4 и 8 вязок, посмотри HMI, а затем переходи к неисправностям и работе механика.','ready']
  );

  function bands(n,weak=false){return Array.from({length:n},(_,i)=>`<i class="learn-band ${weak&&i===Math.min(2,n-1)?'weak':''}" style="top:${n===4?20+i*20:12+i*10}%"></i>`).join('')}
  function machineMarkup(cls=''){return `<div class="learn-stage ${cls}" id="learnStage"><div class="learn-grid"></div><div class="learn-floor"></div><div class="learn-press left"></div><div class="learn-press right"></div><div class="learn-coil ${cls==='loose'?'loose':''}" id="learnCoil"></div></div>`}

  trainingGraphic=function(v){
    if(v==='loose')return machineMarkup('loose')+'<div class="learn-note">Большой рыхлый бунт катанки</div>';
    if(v==='arrive')return machineMarkup('')+'<div class="learn-arrow">↓ БУНТ В РАБОЧЕЙ ЗОНЕ</div>';
    if(v==='press')return machineMarkup('press')+'<div class="learn-note">Пресс-плиты сходятся слева и справа</div>';
    if(v==='bound')return `<div class="learn-stage bound"><div class="learn-grid"></div><div class="learn-floor"></div><div class="learn-press left"></div><div class="learn-press right"></div><div class="learn-coil">${bands(4)}</div></div><div class="learn-note">Сжат → обвязан → готов</div>`;
    if(v==='cycle')return `<div class="learn-stage" id="learnStage"><div class="learn-grid"></div><div class="learn-floor"></div><div class="learn-press left"></div><div class="learn-press right"></div><div class="learn-coil" id="learnCoil">${bands(4)}</div><div class="learn-actions"><button id="trainRunCycle" class="primary">▶ ЗАПУСТИТЬ</button></div><div class="learn-status"><span id="trainStatus">Готов к запуску</span></div></div>`;
    if(v==='ties')return `<div class="learn-stage compressed" id="learnStage"><div class="learn-grid"></div><div class="learn-floor"></div><div class="learn-press left"></div><div class="learn-press right"></div><div class="learn-coil" id="learnCoil">${bands(8)}</div><div class="learn-note" id="trainTieInfo">Двойная: 4 + 4 = 8 вязок</div><div class="learn-actions"><button id="train4">ОДИНАРНАЯ · 4</button><button id="train8" class="primary">ДВОЙНАЯ · 8</button></div></div>`;
    if(v==='fault')return `<div class="learn-stage compressed" id="learnStage"><div class="learn-grid"></div><div class="learn-floor"></div><div class="learn-press left"></div><div class="learn-press right"></div><div class="learn-coil">${bands(4,true)}</div><div class="learn-actions"><button id="trainFault" class="danger">⚠ ПОКАЗАТЬ АВАРИЮ</button></div><div id="trainAlarm"></div></div>`;
    if(v==='operator')return `<div class="learn-stage"><div class="learn-grid"></div><div id="trainOpAlarm" class="learn-alarm">АВАРИЯ · ЦИКЛ ОСТАНОВЛЕН</div><div class="learn-note" id="trainOpText">1. Оператор видит сообщение об ошибке.</div><div class="learn-actions"><button id="trainAck">✓ КВИТ.</button><button id="trainReset" class="warn">↻ СБРОС</button><button id="trainCall" class="danger">🔧 МЕХАНИК</button></div></div>`;
    if(v==='mechanic')return `<div class="learn-stage"><div class="learn-grid"></div><div class="learn-mechanic"><div id="m1" class="active"><b>1</b>HMI / PLC<br>смотрим сигнал</div><div id="m2"><b>2</b>Проверяем<br>датчик или механизм</div><div id="m3"><b>3</b>Устраняем причину<br>контрольный цикл</div></div><div class="learn-actions"><button id="trainMech" class="primary">ДАЛЬШЕ →</button></div></div>`;
    return `<div class="learn-stage"><div class="learn-ready">ГОТОВ К РАБОТЕ<small>Начни с простого режима и попробуй полный цикл</small></div></div>`;
  };

  function bindTraining(v){
    if(v==='cycle'&&document.getElementById('trainRunCycle')){
      $('trainRunCycle').onclick=async()=>{let s=$('learnStage'),st=$('trainStatus');$('trainRunCycle').disabled=true;st.textContent='Бунт в компакторе';await wait(450);st.textContent='Сжатие';s.classList.add('compressed');await wait(850);st.textContent='Обвязка: 4 вязки';[...s.querySelectorAll('.learn-band')].forEach((b,i)=>setTimeout(()=>b.classList.add('on'),i*180));await wait(1050);st.textContent='Готовый бунт';$('trainRunCycle').disabled=false};
    }
    if(v==='ties'){
      const draw=n=>{let coil=$('learnCoil');coil.innerHTML=bands(n);[...coil.querySelectorAll('.learn-band')].forEach(b=>b.classList.add('on'));$('trainTieInfo').textContent=n===4?'Одинарная: 1 проход × 4 головы = 4 вязки':'Двойная: 2 прохода × 4 головы = 8 вязок'};
      $('train4').onclick=()=>draw(4);$('train8').onclick=()=>draw(8);draw(8);
    }
    if(v==='fault'&&document.getElementById('trainFault')) $('trainFault').onclick=()=>{$('trainAlarm').className='learn-alarm';$('trainAlarm').textContent='АВАРИЯ · ВЯЗКА НЕ ЗАВЕРШЕНА';$('trainFault').textContent='Ошибка появилась на HMI';$('trainFault').disabled=true};
    if(v==='operator'){
      $('trainAck').onclick=()=>{$('trainOpAlarm').classList.add('ack');$('trainOpAlarm').textContent='КВИТИРОВАНО';$('trainOpText').textContent='2. Квитирование подтверждает, что оператор увидел сообщение. Причину оно не устраняет.'};
      $('trainReset').onclick=()=>{$('trainOpAlarm').className='learn-alarm';$('trainOpAlarm').textContent='ОШИБКА ВЕРНУЛАСЬ';$('trainOpText').textContent='3. Сброс попробовали, но неисправность осталась. Значит нужен механик.'};
      $('trainCall').onclick=()=>{$('trainOpAlarm').className='learn-alarm ack';$('trainOpAlarm').textContent='МЕХАНИК ВЫЗВАН';$('trainOpText').textContent='4. Оператор передаёт механику симптом и место, где остановился цикл.'};
    }
    if(v==='mechanic'){
      let i=1;$('trainMech').onclick=()=>{i=Math.min(3,i+1);['m1','m2','m3'].forEach((id,j)=>$(id).classList.toggle('active',j<i));$('trainMech').textContent=i===3?'✓ ПРИЧИНА УСТРАНЕНА':'ДАЛЬШЕ →';};
    }
  }

  showTraining=function(){
    let [t,txt,v]=tutorials[trainIndex];$('trainingTitle').textContent=t;$('trainingText').innerHTML=txt;$('trainingCount').textContent=(trainIndex+1)+' / '+tutorials.length;$('trainingBar').style.width=((trainIndex+1)/tutorials.length*100)+'%';$('trainingPrev').disabled=trainIndex===0;$('trainingNext').textContent=trainIndex===tutorials.length-1?'Начать игру →':'Далее →';$('trainingVisual').innerHTML=trainingGraphic(v);bindTraining(v);
  };

  updateTieModeUI();
})();
