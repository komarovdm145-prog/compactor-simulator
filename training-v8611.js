// v8.6.11 — integrate KNB heads into Press Plate 1; remove floating mini-map concept
(function(){
  if(typeof slides==='undefined'||typeof graphic!=='function'||typeof bind!=='function'||typeof knbAssembly!=='function')return;

  slides[4]={
    t:'Полный цикл: где находятся вязальные головы?',
    x:'Слева находится пресс-плита №1. Все четыре вязальные головы KNB установлены именно на ней. На боковом виде видно, откуда они работают; затем мы смотрим прямо на эту же плиту спереди и видим расположение R3, R2, R4 и R1.',
    v:'cycle'
  };
  if(slides[5])slides[5].x='Одинарная обвязка — один проход четырёх голов пресс-плиты №1: 4 вязки. Двойная — те же четыре головы делают второй проход: 4 + 4 = 8 вязок.';
  if(slides[6])slides[6].x='При неполадке смотрят HMI. Страница I/O показывает сигналы четырёх вязальных голов на пресс-плите №1: U1, U2, U3 и U4, а также входы датчиков B и выходы клапанов Y.';
  if(slides[7])slides[7].x='В журнале аварий видно, какая именно часть компактора дала ошибку. Если в тексте указана голова 1–4, речь идёт о вязальных головах на пресс-плите №1.';
  if(slides[8])slides[8].x='Оператор читает сообщение, смотрит нужную страницу I/O и по номеру понимает, какая голова на пресс-плите №1 требует внимания. Затем квитирует и пробует сброс.';

  const previousGraphic=graphic, previousBind=bind;

  function cycleGraphicIntegrated(){
    return `<div class="stage cycle-demo" id="stage">
      <div class="grid"></div>
      <div id="cycleSide" class="cycle-layer cycle-side active">
        <div class="floor"></div>
        <div class="cycle-press left">
          <div class="pp1-side-plate">
            <span class="pp1-side-title">PRESS PLATE 1</span>
            <div class="pp1-head-pack">
              <i>R3 / 3</i><i>R2 / 2</i><i>R4 / 4</i><i>R1 / 1</i>
            </div>
          </div>
        </div>
        <div class="pp1-side-note"><b>4 ГОЛОВЫ НА PP1</b>Они установлены на левой пресс-плите и работают отсюда к зоне обвязки.</div>
        <div class="cycle-press right"></div>
        <div class="cycle-coil"></div>
        <div class="cycle-lift"><i></i><i></i><small>ПОДЪЁМНЫЙ СТОЛ</small></div>
        <div class="cycle-sensor" id="cycleB58">B58 · ЖДЁТ КРАЙ</div>
        <div class="cycle-arrows">→ <b>ПРЕСС</b> ←</div>
      </div>
      <div id="cycleFront" class="cycle-layer cycle-front">
        <div class="front-view-label">ВИД СПЕРЕДИ НА ЭТУ ЖЕ <b>PRESS PLATE 1</b></div>
        ${knbAssembly()}
      </div>
      <div class="cycle-caption" id="cycleCaption">Готов к запуску</div>
      <div class="cycle-steps"><i data-c="1">1</i><i data-c="2">2</i><i data-c="3">3</i><i data-c="4">4</i><i data-c="5">5</i><i data-c="6">6</i><i data-c="7">7</i></div>
      <div class="actions"><button id="runCycle" class="primary">▶ ЗАПУСТИТЬ ЦИКЛ</button></div>
    </div>`
  }

  graphic=function(v){
    if(v==='cycle')return cycleGraphicIntegrated();
    return previousGraphic(v)
  };

  function addInlineContext(v){
    const st=document.getElementById('stage');
    if(!st||st.querySelector('.inline-pp1'))return;
    if(v==='ties')st.insertAdjacentHTML('beforeend','<div class="inline-pp1"><b>PP1 · СЛЕВА</b><br><span>те же 4 головы R3/R2/R4/R1</span></div>');
    if(v==='io')st.insertAdjacentHTML('beforeend','<div class="inline-pp1"><b>U1–U4 = 4 головы PP1</b><br><span>I/O показывает их датчики B и клапаны Y</span></div>');
    if(v==='alarms')st.insertAdjacentHTML('beforeend','<div class="inline-pp1"><b>«Голова 1–4»</b><br><span>это KNB на пресс-плите №1</span></div>');
    if(v==='operator2')st.insertAdjacentHTML('beforeend','<div class="inline-pp1"><b>Номер головы → PP1</b><br><span>оператор понимает, какой узел смотреть</span></div>');
  }

  bind=function(v){
    previousBind(v);
    addInlineContext(v);
  };

  render();
})();