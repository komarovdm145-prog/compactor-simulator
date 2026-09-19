// v8.6.9 — make slides 10–11 beginner friendly
(function(){
  if(typeof slides==='undefined'||typeof graphic!=='function'||typeof bind!=='function')return;

  slides[9]={
    t:'Что делает механик?',
    x:'Если ошибка не исчезла после сброса, приходит механик. Он не разбирает всё подряд: сначала смотрит, где проблема, потом проверяет нужный узел и после ремонта запускает контрольный цикл.',
    v:'mechanicSimple'
  };
  slides[10]={
    t:'Главное, что нужно запомнить',
    x:'Обычный цикл простой: бунт зашёл → стол поднял его → пресс-плиты сжали → четыре головы обвязали → готово. Если появилась ошибка, оператор смотрит HMI и делает сброс. Если ошибка возвращается — зовёт механика.',
    v:'readySimple'
  };

  const previousGraphic=graphic, previousBind=bind;

  function mechanicSimpleGraphic(){
    return `<div class="stage simple-mech" id="stage">
      <div class="simple-title">МЕХАНИКУ НУЖНО ПОНЯТЬ ВСЕГО ТРИ ВЕЩИ</div>
      <div class="simple-mech-steps">
        <div id="sm1" class="simple-mech-step active"><em>1</em><span class="ico">👀</span><b>ПОСМОТРЕТЬ</b><small>какая ошибка появилась и где остановился цикл</small></div>
        <div id="sm2" class="simple-mech-step"><em>2</em><span class="ico">🔧</span><b>ПРОВЕРИТЬ</b><small>нужную голову, датчик, проводку или механизм</small></div>
        <div id="sm3" class="simple-mech-step"><em>3</em><span class="ico">▶️</span><b>ПРОВЕРИТЬ РАБОТУ</b><small>устранить причину и запустить контрольный цикл</small></div>
      </div>
      <div class="actions"><button id="simpleMechNext" class="primary">ДАЛЬШЕ →</button></div>
    </div>`
  }

  function readySimpleGraphic(){
    return `<div class="stage simple-summary" id="stage">
      <div class="summary-normal">
        <div class="summary-label">НОРМАЛЬНАЯ РАБОТА</div>
        <div class="summary-flow">
          <div class="summary-box active"><span><span class="ico">⭕</span>БУНТ</span></div><i class="summary-arrow">→</i>
          <div class="summary-box"><span><span class="ico">⬆️</span>СТОЛ</span></div><i class="summary-arrow">→</i>
          <div class="summary-box"><span><span class="ico">↔️</span>ПРЕСС</span></div><i class="summary-arrow">→</i>
          <div class="summary-box"><span><span class="ico">🧵</span>4 ГОЛОВЫ</span></div><i class="summary-arrow">→</i>
          <div class="summary-box"><span><span class="ico">✅</span>ГОТОВО</span></div>
        </div>
      </div>
      <div class="summary-fault">
        <div class="fault-title">ЕСЛИ ПОЯВИЛАСЬ ОШИБКА</div>
        <div class="fault-simple-flow">
          <div class="fault-simple warn"><span><b>👷 ОПЕРАТОР</b>смотрит HMI<br>квитирует / сбрасывает</span></div>
          <i>→</i>
          <div class="fault-simple service"><span><b>🔧 МЕХАНИК</b>если ошибка вернулась — ищет и устраняет причину</span></div>
          <i>→</i>
          <div class="fault-simple ok"><span><b>✅ КОНТРОЛЬ</b>пробный цикл<br>машина снова в работе</span></div>
        </div>
      </div>
      <div class="summary-bottom">Вот и весь смысл обучения. Детали будем разбирать уже в тренажёре.</div>
    </div>`
  }

  graphic=function(v){
    if(v==='mechanicSimple')return mechanicSimpleGraphic();
    if(v==='readySimple')return readySimpleGraphic();
    return previousGraphic(v)
  };

  bind=function(v){
    previousBind(v);
    if(v==='mechanicSimple'){
      let step=1;const btn=document.getElementById('simpleMechNext');
      btn.onclick=()=>{
        if(step<3)step++;
        ['sm1','sm2','sm3'].forEach((id,k)=>{
          const el=document.getElementById(id);if(!el)return;
          el.classList.toggle('active',k===step-1);
          el.classList.toggle('done',k<step-1);
        });
        btn.textContent=step===3?'ГОТОВО ✓':'ДАЛЬШЕ →';
      };
    }
    if(v==='readySimple'){
      const boxes=[...document.querySelectorAll('.summary-box')];
      let n=0;
      const tick=()=>{
        if(!document.body.contains(boxes[0]))return;
        boxes.forEach((b,k)=>{b.classList.toggle('active',k===n);b.classList.toggle('done',k<n)});
        if(n<boxes.length-1){n++;setTimeout(tick,520)}
      };
      setTimeout(tick,250);
    }
  };

  render();
})();