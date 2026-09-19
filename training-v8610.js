// v8.6.10 — persistent spatial cue: all four KNB heads are mounted on left Press Plate 1
(function(){
  if(typeof render!=='function'||typeof slides==='undefined')return;

  const previousRender=render;

  function anchorMarkup(isSlide5,cue){
    return `<div class="pp1-anchor ${isSlide5?'slide5':''}" id="pp1Anchor">
      <strong>ПРЕСС-ПЛИТА №1 · СЛЕВА</strong>
      <div class="mini-plate">
        <span class="mini-head h3">R3/3</span>
        <span class="mini-head h2">R2/2</span>
        <span class="mini-head h4">R4/4</span>
        <span class="mini-head h1">R1/1</span>
      </div>
      <small>Все 4 вязальные головы установлены здесь</small>
      <div class="cue">${cue}</div>
    </div>`
  }

  function cueFor(index){
    if(index===4)return '<b>Во время обвязки</b> головы выдвигаются с PP1 к бунту, выполняют вязку и возвращаются обратно.';
    if(index===5)return '<b>4 головы PP1</b> делают один проход; при двойной обвязке те же головы делают второй проход.';
    if(index===6)return '<b>U1–U4 на HMI</b> относятся к четырём вязальным головам пресс-плиты №1.';
    if(index===7)return 'Сообщения «голова 1–4» в журнале относятся к этим головам на PP1.';
    if(index===8)return 'Оператор по номеру головы понимает, какой узел на PP1 нужно проверить по HMI.';
    if(index===9)return 'Механик идёт к нужной голове на PP1, а не ищет её по всей машине.';
    return 'Запомни: <b>все четыре KNB-головы находятся на левой пресс-плите №1.</b>';
  }

  function decoratePP1(){
    if(typeof i==='undefined'||i<4)return;
    const stage=document.getElementById('stage');
    if(!stage||document.getElementById('pp1Anchor'))return;
    stage.classList.add('pp1-context');
    stage.insertAdjacentHTML('beforeend',anchorMarkup(i===4,cueFor(i)));

    if(i===4){
      stage.insertAdjacentHTML('beforeend','<div class="pp1-arrow-note">отсюда работают 4 вязальные головы</div>');
    }
    if(i===6){
      stage.insertAdjacentHTML('beforeend','<div class="pp1-hmi-note"><b>U1 / U2 / U3 / U4</b> = головы PP1</div>');
    }
    if(i===7){
      stage.insertAdjacentHTML('beforeend','<div class="pp1-hmi-note">«Голова 1–4» = KNB на <b>PRESS PLATE 1</b></div>');
    }
  }

  render=function(){
    previousRender();
    decoratePP1();
  };

  render();
})();