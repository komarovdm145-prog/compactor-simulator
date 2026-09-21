// TEST training v10 — integrated full compactor + PP2 guide cycle on slide 5.
// Stable training.html is untouched. No MutationObserver: mobile-safe.
(function(){
  if(typeof render!=='function')return;
  var KEY='compactorTrainingTestV1';
  var MIGRATION='compactorGuideLessonV3';
  var running=false,cycleSeen=false,answerOK=false;

  function q(s,r){return (r||document).querySelector(s)}
  function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  function delay(ms){return new Promise(function(ok){setTimeout(ok,ms)})}
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){return {}}}
  function save(s){try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}}
  function done(){var s=load();return !!(s.done&&s.done[4])}
  function setDone(msg){
    var s=load();s.done=s.done||{};s.done[4]=true;save(s);
    var task=q('#testTask');if(task)task.classList.add('complete');
    var f=q('#testTask .task-feedback');if(f){f.textContent=msg||'Полный цикл понятен.';f.dataset.kind='good'}
    var p=q('#testProgressText');if(p){var n=Object.keys(s.done||{}).filter(function(k){return s.done[k]}).length;p.textContent='ИНТЕРАКТИВ: '+n+'/'+(typeof slides!=='undefined'?slides.length:11)}
    if(navigator.vibrate)navigator.vibrate(20);
  }

  try{
    if(!localStorage.getItem(MIGRATION)){
      var st=load();st.done=st.done||{};delete st.done[4];save(st);localStorage.setItem(MIGRATION,'migrated');
    }
  }catch(e){}

  function fullScene(){
    return '<div class="ig-wrap">'+
      '<div class="ig-head"><b>ПОЛНЫЙ ЦИКЛ · COMPACTOR + GUIDE</b><span id="igPhase">HOME</span></div>'+
      '<div class="ig-scene state-home" id="igScene">'+
        '<div class="ig-axis">ОСЬ БУНТА</div><div class="ig-floor"></div>'+
        '<div class="ig-coil"><span>БУНТ</span><em id="igLength">L 100%</em><i class="tie t1"></i><i class="tie t2"></i><i class="tie t3"></i><i class="tie t4"></i></div>'+
        '<div class="ig-table"><i></i><i></i><small>ПОДЪЁМНЫЙ СТОЛ</small></div>'+
        '<div class="ig-pp ig-p1"><b>PP1</b><div class="ig-knb"><strong>KNB 1–4</strong><i></i><span></span></div></div>'+
        '<div class="ig-pp ig-p2"><b>PP2</b><div class="ig-drive">GUIDE</div></div>'+
        '<div class="ig-guide"><div></div><i></i></div>'+
        '<div class="ig-contact">B49 CLOSED</div><div class="ig-rev">GUIDE REV → PP2</div>'+
        '<div class="ig-b58">B58 · КРАЙ БУНТА</div><div class="ig-b59">B59 · POSITION</div>'+
      '</div>'+
      '<div class="ig-signals"><span id="ig64">B64 HOME</span><span id="ig58">B58 EDGE</span><span id="ig59">B59 POS</span><span id="ig68">Y68</span><span id="ig49">B49</span><span id="ig69">B69 POS</span></div>'+
    '</div>';
  }

  function controls(){
    return '<div class="ig-controls" id="igControls">'+
      '<button id="igRun" class="ig-run">▶ ЗАПУСТИТЬ ПОЛНЫЙ ЦИКЛ</button>'+
      '<div class="ig-question"><b>После встречи KNB ↔ GUIDE и появления B49 CLOSED прессование продолжается. Что происходит с направляющей?</b><div><button data-ig-answer="stop">Остаётся выдвинутой в центре</button><button data-ig-answer="rev">Реверсирует назад к PP2, сохраняя стык</button></div></div>'+
    '</div>';
  }

  function signal(id,on,text){var e=document.getElementById(id);if(!e)return;e.classList.toggle('on',!!on);e.classList.toggle('warn',on==='warn');if(text)e.textContent=text}
  function phase(cls,title,length){var sc=q('#igScene');if(sc)sc.className='ig-scene '+cls;var p=q('#igPhase');if(p)p.textContent=title;var l=q('#igLength');if(l)l.textContent=length||'L 100%'}
  function reset(){
    phase('state-home','HOME · B64 ON','L 100%');
    ['ig64','ig58','ig59','ig68','ig49','ig69'].forEach(function(id){signal(id,false)});
    signal('ig64',true,'B64 HOME');signal('ig58',false,'B58 EDGE');signal('ig59',false,'B59 POS');signal('ig68',false,'Y68 OFF');signal('ig49',false,'B49 OPEN');signal('ig69',false,'B69 POS');
  }

  async function run(){
    if(running)return;running=true;
    var btn=q('#igRun');if(!btn){running=false;return}
    btn.disabled=true;btn.textContent='ЦИКЛ ИДЁТ…';reset();await delay(400);

    phase('state-table','1 · СТОЛ ½','L 100%');signal('ig59',true,'B59 POS');
    await delay(700);

    phase('state-approach','2 · PP1 + PP2 / GUIDE FWD','L 94%');signal('ig64',false,'B64 OFF');signal('ig68',true,'Y68 FWD');signal('ig69',true,'B69 POS');
    await delay(750);

    phase('state-center','3 · B58 / ЦЕНТРОВКА','L 88%');signal('ig58',true,'B58 EDGE');
    await delay(700);

    phase('state-contact','4 · KNB ↔ GUIDE · B49 CLOSED','L 82%');signal('ig49',true,'B49 CLOSED');signal('ig68',false,'Y68 HOLD');
    await delay(850);

    phase('state-reverse','5 · PRESS + GUIDE REV','L 63%');signal('ig68',true,'Y68 REV');
    await delay(1500);

    phase('state-tie','6 · ОБВЯЗКА · 4 KNB','L 63%');signal('ig68',false,'Y68 OFF');
    await delay(1050);

    phase('state-return','7 · ВОЗВРАТ GUIDE / ПЛИТ / СТОЛА','L 63%');signal('ig49',false,'B49 OPEN');signal('ig68',true,'Y68 REV');signal('ig58',false,'B58 EDGE');
    await delay(1000);

    phase('state-done','ГОТОВО · B64 HOME','L 63% · ОБВЯЗАН');signal('ig68',false,'Y68 OFF');signal('ig64',true,'B64 HOME');signal('ig69',true,'B69 POS');signal('ig59',true,'B59 POS');
    cycleSeen=true;running=false;btn.disabled=false;btn.classList.add('done');btn.textContent='✓ ПОЛНЫЙ ЦИКЛ ПРОСМОТРЕН — ПОВТОРИТЬ';
    var f=q('#testTask .task-feedback');if(f)f.textContent='Теперь ответь на вопрос: что делает GUIDE после B49 CLOSED, пока PP1 и PP2 продолжают прессовать бунт?';
  }

  function decorateFlow(){
    var flow=q('.test-flow:not(.diag)');if(!flow)return;
    flow.classList.add('guide-cycle-flow');
    flow.innerHTML='<span><i>1</i>СТОЛ</span><b>→</b><span><i>2</i>PP1+PP2</span><b>→</b><span><i>3</i>GUIDE FWD</span><b>→</b><span><i>4</i>B49</span><b>→</b><span><i>5</i>PRESS+REV</span><b>→</b><span><i>6</i>4 KNB</span><b>→</b><span><i>7</i>ВОЗВРАТ</span>';
  }

  function setRemember(){var r=q('#testRemember');if(r)r.innerHTML='<b>ЗАПОМНИ:</b> На одном цикле видно всё вместе: стол центрирует бунт, PP1 и PP2 сходятся, GUIDE с PP2 идёт навстречу KNB на PP1, B49 подтверждает стык, затем прессование продолжается и GUIDE реверсирует назад к PP2. Бунт уменьшается только по осевой длине.'}

  function bind(){
    var b=q('#igRun');if(b&&!b.dataset.bound){b.dataset.bound='1';b.addEventListener('click',run)}
    qa('[data-ig-answer]').forEach(function(x){if(x.dataset.bound)return;x.dataset.bound='1';x.addEventListener('click',function(){
      qa('[data-ig-answer]').forEach(function(y){y.classList.remove('right','wrong')});
      var f=q('#testTask .task-feedback');
      if(!cycleSeen&&!done()){x.classList.add('wrong');if(f){f.textContent='Сначала просмотри полный цикл компактора — ответ будет виден в фазе PRESS + GUIDE REV.';f.dataset.kind='bad'}return}
      if(x.dataset.igAnswer==='rev'){
        answerOK=true;x.classList.add('right');setDone('Верно. Это один общий процесс: плиты продолжают осевое сжатие бунта, а GUIDE после B49 реверсирует к PP2, сохраняя стык с KNB.');
      }else{x.classList.add('wrong');if(f){f.textContent='Нет. После B49 направляющая не остаётся в центре: при дальнейшем ходе плит она реверсирует назад к PP2 и сохраняет стык.';f.dataset.kind='bad'}}
    })})
  }

  function decorate(){
    if(typeof i==='undefined'||i!==4)return;
    setRemember();decorateFlow();
    var visual=q('#visual'),task=q('#testTask');if(!visual||!task)return;
    document.body.classList.add('integrated-guide-slide');
    visual.classList.add('integrated-guide-visual');visual.innerHTML=fullScene();
    var ori=q('.test-orientation');if(ori)ori.style.display='none';
    var p=q('p',task);if(p)p.innerHTML='Запусти <b>один общий цикл</b> и смотри на компактор целиком: подъёмный стол, PP1, PP2, сжатие бунта, KNB и направляющую PP2. Теперь GUIDE не отдельный урок — он работает внутри реального цикла машины.';
    var opts=q('.task-options',task);if(opts)opts.remove();
    if(!q('#igControls',task))p.insertAdjacentHTML('afterend',controls());
    if(done()){cycleSeen=true;answerOK=true;var c=q('#igControls');if(c)c.classList.add('passed');var rb=q('#igRun');if(rb){rb.classList.add('done');rb.textContent='✓ УРОК ПРОЙДЕН — ПОВТОРИТЬ'}}
    reset();bind();
  }

  var old=render;
  render=function(){document.body.classList.remove('integrated-guide-slide');old();setTimeout(decorate,0)};
  setTimeout(decorate,0);
})();
