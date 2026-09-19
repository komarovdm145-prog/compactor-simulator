// TEST training — approved PP1 KNB ↔ PP2 moving guide lesson.
// Stable training.html is not touched. No MutationObserver: iPhone-safe render addon.
(function(){
  if(typeof render!=='function')return;
  var TEST_KEY='compactorTrainingTestV1';
  var MIGRATION_KEY='compactorGuideLessonV2';
  var running=false, cycleSeen=false, answerOK=false;

  try{
    if(!localStorage.getItem(MIGRATION_KEY)){
      var s=JSON.parse(localStorage.getItem(TEST_KEY)||'{}')||{};
      if(s.done)delete s.done[4];
      localStorage.setItem(TEST_KEY,JSON.stringify(s));
      localStorage.setItem(MIGRATION_KEY,'migrated');
    }
  }catch(e){}

  function delay(ms){return new Promise(function(r){setTimeout(r,ms)})}
  function persistedDone(){try{var s=JSON.parse(localStorage.getItem(TEST_KEY)||'{}');return !!(s.done&&s.done[4])}catch(e){return false}}
  function q(sel,root){return (root||document).querySelector(sel)}
  function qa(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel))}

  function decorateFlow(){
    if(typeof i==='undefined'||i!==4)return;
    var flow=q('.test-flow:not(.diag)');if(!flow)return;
    flow.classList.add('guide-cycle-flow');
    flow.innerHTML='<span class="done"><i>1</i>БУНТ</span><b>→</b><span class="done"><i>2</i>СТОЛ</span><b>→</b><span class="active"><i>3</i>ПРЕСС</span><b>→</b><span class="active"><i>4</i>KNB ↔ GUIDE</span><b>→</b><span><i>5</i>B49</span><b>→</b><span><i>6</i>GUIDE REV</span><b>→</b><span><i>7</i>ОБВЯЗКА</span>';
  }

  function setRemember(){
    if(typeof i==='undefined'||i!==4)return;
    var r=document.getElementById('testRemember');
    if(r)r.innerHTML='<b>ЗАПОМНИ:</b> PP1 с KNB и направляющая PP2 идут навстречу. После физического стыка появляется B49 CLOSED. Прессование продолжается, а направляющая реверсирует назад к PP2, сохраняя стык. Бунт при этом сжимается только по оси.';
  }

  function sceneMarkup(){
    return '<div class="guide-lesson-v2" id="guideLessonV2">'+
      '<div class="gl-head"><b>PP1 KNB ↔ PP2 GUIDE</b><span id="glPhase">HOME</span></div>'+
      '<div class="gl-scene" id="glScene">'+
        '<div class="gl-axis">ОСЬ БУНТА</div>'+
        '<div class="gl-coil" id="glCoil"><span>БУНТ</span><em id="glLength">L 100%</em></div>'+
        '<div class="gl-p1" id="glP1"><b>PP1</b><div class="gl-knb"><i></i><span>KNB</span><div class="gl-short"></div></div></div>'+
        '<div class="gl-p2" id="glP2"><b>PP2</b><div class="gl-drive"><span>GUIDE</span></div></div>'+
        '<div class="gl-guide" id="glGuide"><div class="gl-channel"></div><i class="gl-mouth"></i></div>'+
        '<div class="gl-contact" id="glContact">B49 CLOSED</div>'+
        '<div class="gl-rev" id="glRev">GUIDE REV → PP2</div>'+
      '</div>'+
      '<div class="gl-signals">'+
        '<span id="sig64">B64 HOME</span><span id="sig68f">Y68 FWD</span><span id="sig49">B49 CLOSED</span><span id="sig68r">Y68 REV</span><span id="sig69">B69 POSITION</span>'+
      '</div>'+
      '<button id="guideCycleRun" class="gl-run">▶ ПРОЙТИ ЦИКЛ НАПРАВЛЯЮЩЕЙ</button>'+
      '<div class="gl-question" id="glQuestion"><b>После B49 CLOSED плиты продолжают прессовать. Что делает направляющая PP2?</b><div><button data-guide-answer="stop">Остаётся в центре</button><button data-guide-answer="rev">Реверсирует назад к PP2</button></div></div>'+
    '</div>';
  }

  function resetScene(){
    var sc=q('#glScene');if(!sc)return;
    sc.className='gl-scene state-home';
    var ph=q('#glPhase');if(ph)ph.textContent='HOME · B64 ON';
    var len=q('#glLength');if(len)len.textContent='L 100%';
    ['sig64','sig68f','sig49','sig68r','sig69'].forEach(function(id){var e=document.getElementById(id);if(e)e.classList.remove('on','warn')});
    var s64=document.getElementById('sig64');if(s64)s64.classList.add('on');
  }

  async function runCycle(){
    if(running)return;running=true;
    var btn=document.getElementById('guideCycleRun'),sc=q('#glScene'),ph=q('#glPhase'),len=q('#glLength');
    if(!btn||!sc){running=false;return}
    btn.disabled=true;btn.textContent='ЦИКЛ ИДЁТ…';
    resetScene();await delay(350);

    sc.className='gl-scene state-approach';if(ph)ph.textContent='APPROACH · PP1 + GUIDE FWD';
    document.getElementById('sig64').classList.remove('on');document.getElementById('sig68f').classList.add('on');if(len)len.textContent='L 90%';
    await delay(1100);

    sc.className='gl-scene state-contact';if(ph)ph.textContent='CONTACT · B49 CLOSED';
    document.getElementById('sig68f').classList.remove('on');document.getElementById('sig49').classList.add('on');if(len)len.textContent='L 82%';
    await delay(850);

    sc.className='gl-scene state-reverse';if(ph)ph.textContent='PRESS + GUIDE REV';
    document.getElementById('sig68r').classList.add('on');if(len)len.textContent='L 63%';
    await delay(1500);

    sc.className='gl-scene state-tie';if(ph)ph.textContent='READY FOR TIE · B49 CLOSED';
    document.getElementById('sig68r').classList.remove('on');document.getElementById('sig69').classList.add('on');if(len)len.textContent='L 63%';
    cycleSeen=true;btn.disabled=false;btn.classList.add('done');btn.textContent='✓ ЦИКЛ ПРОСМОТРЕН — МОЖНО ПОВТОРИТЬ';
    var fq=q('#testTask .task-feedback');if(fq)fq.textContent='Теперь ответь на вопрос ниже: что делает направляющая после стыка B49, пока плиты продолжают прессовать?';
    running=false;syncFront();
  }

  function syncFront(){
    var task=document.getElementById('testTask');if(!task)return;
    var front=q('[data-view="front"]',task),hint=q('.gl-final-hint',task);
    var allow=(cycleSeen&&answerOK)||persistedDone();
    if(front){front.disabled=!allow;front.textContent=allow?'PP1 СПЕРЕДИ → ЗАВЕРШИТЬ':'PP1 СПЕРЕДИ · ПОСЛЕ УРОКА'}
    if(hint)hint.style.display=allow?'block':'none';
  }

  function bindLesson(){
    var run=document.getElementById('guideCycleRun');if(run&&!run.dataset.bound){run.dataset.bound='1';run.addEventListener('click',runCycle)}
    qa('[data-guide-answer]').forEach(function(b){if(b.dataset.bound)return;b.dataset.bound='1';b.addEventListener('click',function(){
      qa('[data-guide-answer]').forEach(function(x){x.classList.remove('right','wrong')});
      if(!cycleSeen){b.classList.add('wrong');var f=q('#testTask .task-feedback');if(f)f.textContent='Сначала просмотри цикл — тогда ответ будет очевиден.';return}
      if(b.dataset.guideAnswer==='rev'){
        answerOK=true;b.classList.add('right');var f2=q('#testTask .task-feedback');if(f2)f2.textContent='Верно. После B49 направляющая реверсирует к PP2 и сохраняет стык с KNB, пока бунт продолжает осевое сжатие. Теперь нажми «PP1 СПЕРЕДИ».';
      }else{
        b.classList.add('wrong');var f3=q('#testTask .task-feedback');if(f3)f3.textContent='Не так. Если бы она осталась в центре, дальнейший ход плит нарушил бы стык. Смотри фазу GUIDE REV.';
      }
      syncFront();
    })});
  }

  function decorate(){
    decorateFlow();setRemember();
    if(typeof i==='undefined'||i!==4)return;
    var task=document.getElementById('testTask');if(!task)return;
    var p=q('p',task);if(p)p.innerHTML='Проследи правильную кинематику: <b>PP1 с KNB идёт навстречу направляющей PP2 → физический стык → B49 CLOSED → прессование продолжается → GUIDE реверсирует назад к PP2</b>. Бунт одновременно сжимается только по оси.';
    if(!document.getElementById('guideLessonV2')){
      var opts=q('.task-options',task);if(opts)opts.insertAdjacentHTML('beforebegin',sceneMarkup()+'<div class="gl-final-hint">Финальный шаг: переключись на PP1 спереди, чтобы связать боковой цикл с четырьмя головами на PP1.</div>');
    }
    if(persistedDone()){cycleSeen=true;answerOK=true;var sc=q('#glScene');if(sc)sc.className='gl-scene state-tie';var ph=q('#glPhase');if(ph)ph.textContent='УРОК ПРОЙДЕН';var run=document.getElementById('guideCycleRun');if(run){run.classList.add('done');run.textContent='✓ ЦИКЛ ПРОСМОТРЕН — МОЖНО ПОВТОРИТЬ'}}
    resetScene();if(cycleSeen){var sc2=q('#glScene');if(sc2)sc2.className='gl-scene state-tie';var ph2=q('#glPhase');if(ph2)ph2.textContent='READY FOR TIE · B49 CLOSED';var le=q('#glLength');if(le)le.textContent='L 63%';}
    bindLesson();syncFront();
  }

  var previousRender=render;
  render=function(){previousRender();setTimeout(decorate,0)};
  setTimeout(decorate,0);
})();
