// TEST training v9 — advanced PP2 guide fault scenarios.
// Loaded only by test.html. Stable training.html and main game are untouched.
// No MutationObserver: safe for iPhone/Android mobile browsers.
(function(){
  if(typeof render!=='function')return;
  var KEY='compactorTrainingTestV1';
  var MIGRATION='compactorGuideFaultsV1';

  function q(s,r){return (r||document).querySelector(s)}
  function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){return {}}}
  function save(s){try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}}
  function setDone(idx,msg){
    var s=load();s.done=s.done||{};s.done[idx]=true;save(s);
    var task=q('#testTask');if(task)task.classList.add('complete');
    var f=q('#testTask .task-feedback');if(f){f.textContent=msg||'Сценарий пройден.';f.dataset.kind='good'}
    var p=q('#testProgressText');if(p){var n=Object.keys((s.done||{})).filter(function(k){return s.done[k]}).length;p.textContent='ИНТЕРАКТИВ: '+n+'/'+(typeof slides!=='undefined'?slides.length:11)}
    if(navigator.vibrate)navigator.vibrate(20);
  }
  function feedback(t,bad){var f=q('#testTask .task-feedback');if(f){f.textContent=t;f.dataset.kind=bad?'bad':'good'}}

  try{
    if(!localStorage.getItem(MIGRATION)){
      var st=load();st.done=st.done||{};delete st.done[6];delete st.done[8];delete st.done[9];save(st);localStorage.setItem(MIGRATION,'migrated');
    }
  }catch(e){}

  function signal(id,name,value,cls,sub){
    return '<div class="gfd-signal '+(cls||'')+'" id="'+id+'"><span>'+name+'</span><b>'+value+'</b><small>'+(sub||'')+'</small></div>';
  }
  function commonMachine(extra){
    return '<div class="gfd-machine '+(extra||'')+'"><div class="gfd-p1"><b>PP1</b><i>KNB</i></div><div class="gfd-coil"><span>БУНТ</span></div><div class="gfd-path"><i></i><b>GUIDE</b></div><div class="gfd-p2"><b>PP2</b></div></div>';
  }

  function sceneNoB49(){
    return '<div class="gfd-scene"><div class="gfd-title"><b>СЦЕНАРИЙ A · НЕТ B49</b><span>GUIDE идёт к KNB, но замкнутый тракт не подтверждён</span></div>'+commonMachine('fault-open')+
      '<div class="gfd-signals">'+
      signal('gfA64','B64','OFF','ok','каретка вышла из HOME')+
      signal('gfA68','Y68','FWD','run','команда движения вперёд')+
      signal('gfA69','B69','POSITION','run','позиционный сигнал меняется')+
      signal('gfA49','B49','OPEN','bad','стык/закрытие не подтверждено')+
      '</div><div class="gfd-note">Логика: движение есть, HOME снят, но разрешающий признак закрытого тракта B49 не появился.</div></div>';
  }
  function sceneLostB49(){
    return '<div class="gfd-scene"><div class="gfd-title"><b>СЦЕНАРИЙ B · B49 ПРОПАЛ</b><span>Стык был подтверждён, затем потерян во время PRESS + GUIDE REV</span></div>'+commonMachine('fault-drop')+
      '<div class="gfd-signals">'+
      signal('gfB68','Y68','REV','run','направляющая уходит назад к PP2')+
      signal('gfB49','B49','OPEN','bad','тракт больше не подтверждён')+
      signal('gfB64','B64','OFF','warn','HOME ещё не достигнут')+
      signal('gfB69','B69','POSITION','run','каретка не в исходном')+
      '</div><div class="gfd-note">B49 — это не «процент хода». Это подтверждение замкнутого пути проволоки. Потеря B49 означает, что нормальный тракт больше не подтверждён.</div></div>';
  }
  function sceneNoB64(){
    return '<div class="gfd-scene"><div class="gfd-title"><b>СЦЕНАРИЙ C · НЕТ B64 HOME</b><span>После обвязки GUIDE возвращается, но алгоритм возврата не завершается</span></div>'+commonMachine('fault-home')+
      '<div class="gfd-signals">'+
      signal('gfC49','B49','OPEN','ok','рабочий стык уже разомкнут')+
      signal('gfC68','Y68','REV','run','идёт команда возврата')+
      signal('gfC69','B69','POSITION','run','позиция каретки отслеживается')+
      signal('gfC64','B64','OFF','bad','HOME не подтверждён')+
      '</div><div class="gfd-note">По алгоритму возврата именно B64 подтверждает исходное положение направляющей и завершает её возврат.</div></div>';
  }

  function setFlow(labels,active){
    var f=q('.test-flow.diag');if(!f)return;
    f.classList.add('gfd-flow');
    f.innerHTML=labels.map(function(x,k){return '<span class="'+(k<active?'done ':k===active?'active ':'')+'"><i>'+(k+1)+'</i>'+x+'</span>'+(k<labels.length-1?'<b>→</b>':'')}).join('');
  }
  function setRemember(html){var r=q('#testRemember');if(r)r.innerHTML='<b>ЗАПОМНИ:</b> '+html}
  function setHeader(title,text){var t=q('#title'),x=q('#text');if(t)t.textContent=title;if(x)x.innerHTML=text}
  function replaceVisual(html){var v=q('#visual');if(v)v.innerHTML=html}
  function taskShell(body){
    var task=q('#testTask');if(!task)return null;
    var idx=(typeof i==='number'?i:0),st=load(),done=!!(st.done&&st.done[idx]);
    task.className='test-task gfd-task '+(done?'complete':'');
    task.innerHTML='<div class="task-head"><span>ДИАГНОСТИКА GUIDE</span><b>'+(idx+1)+'/'+(typeof slides!=='undefined'?slides.length:11)+'</b></div>'+body+'<div class="task-feedback">'+(done?'Сценарий уже выполнен.':'Проанализируй сигналы и выбери действие по фактам, а не наугад.')+'</div>';
    return task;
  }
  function bindAnswers(root,correct,okText,badText,onCorrect){
    qa('[data-gfd]',root).forEach(function(b){b.addEventListener('click',function(){
      qa('[data-gfd]',root).forEach(function(x){x.classList.remove('right','wrong')});
      var ok=b.dataset.gfd===correct;b.classList.add(ok?'right':'wrong');
      if(ok){feedback(okText,false);if(onCorrect)onCorrect(b)}else feedback(typeof badText==='function'?badText(b.dataset.gfd):badText,true);
    })});
  }

  function scenarioA(){
    setHeader('Авария GUIDE: B49 не появляется','Y68 ведёт направляющую от PP2 к KNB. B64 уже снят, B69 показывает движение/позицию, но <b>B49 остаётся OPEN</b>. Найди правильное направление диагностики.');
    setRemember('Если Y68 двигает каретку, а B49 не появляется, сначала проверяем фактическое смыкание короткой направляющей KNB с подвижной направляющей PP2, механику/соосность и цепь B49. B24/B28 относятся к проволоке и не объясняют отсутствие B49.');
    setFlow(['GUIDE FWD','B64 OFF','B69','B49 OPEN','ДИАГНОЗ'],3);
    replaceVisual(sceneNoB49());
    var task=taskShell('<p>Какой узел проверять <b>первым по этой картине сигналов</b>?</p><div class="task-options gfd-options"><button data-gfd="joint">Стык KNB ↔ GUIDE, механику/соосность и B49</button><button data-gfd="wire">B24/B28 — наличие и импульсы проволоки</button><button data-gfd="lift">B58/B59 — подъёмный стол</button></div>');
    if(!task)return;
    bindAnswers(task,'joint','Верно. Команда движения и уход из HOME уже есть; ключевой отсутствующий факт — подтверждение физического закрытия тракта B49.',function(a){return a==='wire'?'B24/B28 нужны для контроля проволоки. Здесь проблема возникает раньше — тракт GUIDE ещё не подтверждён B49.':'B58/B59 относятся к обнаружению края бунта и положению подъёмного стола, а не к смыканию GUIDE.'},function(){setDone(6,'Сценарий A пройден: при Y68 FWD + B64 OFF + B49 OPEN проверяем физический стык KNB ↔ GUIDE, механику и B49.')});
  }

  function scenarioB(){
    setHeader('Авария GUIDE: B49 потерян во время прессования','KNB и GUIDE уже встретились, B49 был CLOSED. При дальнейшем прессовании и реверсе направляющей B49 стал <b>OPEN</b>. Что это означает для цикла?');
    setRemember('Подача/обвязка допустима только при подтверждённом закрытом тракте. Если B49 потерян, нельзя считать путь проволоки нормальным, даже если Y68 и B69 продолжают показывать движение каретки.');
    setFlow(['B49 CLOSED','PRESS','Y68 REV','B49 LOST','HOLD'],3);
    replaceVisual(sceneLostB49());
    var task=taskShell('<p>Как трактовать ситуацию <b>B49 CLOSED → OPEN</b> во время PRESS + GUIDE REV?</p><div class="task-options gfd-options"><button data-gfd="hold">Тракт больше не подтверждён — нормальную подачу/обвязку не продолжать</button><button data-gfd="ignore">Игнорировать: B69 есть, значит всё нормально</button><button data-gfd="b64">Считать это только сигналом B64 HOME</button></div>');
    if(!task)return;
    bindAnswers(task,'hold','Верно. B49 подтверждает именно замкнутый путь. Его потеря — отдельный диагностический факт, который нельзя заменить наличием B69.',function(a){return a==='ignore'?'B69 — позиционный сигнал каретки. Он не заменяет B49, который подтверждает закрытие тракта.':'B64 относится к исходному положению/завершению возврата GUIDE. Потеря B49 в рабочей фазе — другая ситуация.'},function(){setDone(8,'Сценарий B пройден: потеря B49 во время PRESS/REV означает потерю подтверждения замкнутого тракта.')});
  }

  function scenarioC(){
    setHeader('Авария GUIDE: возврат не завершён','После обвязки B49 уже OPEN, Y68 работает в направлении возврата, но направляющая не даёт <b>B64 HOME</b>. Определи, что ждёт алгоритм и что проверять.');
    setRemember('B64 — признак исходного положения направляющей и завершения её алгоритма возврата. Если B64 не появляется, проверяем фактический возврат каретки, механику и цепь B64; не подменяем это сигналами проволоки.');
    setFlow(['ОБВЯЗКА','Y68 REV','ВОЗВРАТ','B64 OFF','ПРОВЕРКА'],3);
    replaceVisual(sceneNoB64());
    var task=taskShell('<p><b>Шаг 1.</b> Какой вход должен завершить возврат направляющей?</p><div class="task-options gfd-options" id="gfdC1"><button data-gfd="b64">B64 · GUIDE HOME</button><button data-gfd="b49">B49 · CLOSED PATH</button><button data-gfd="b24">B24 · WIRE PRESENT</button></div><div class="gfd-second" id="gfdC2"><p><b>Шаг 2.</b> B64 так и не появился. Что проверяем?</p><div class="task-options gfd-options"><button data-gfd2="return">Фактический возврат каретки + механику + B64</button><button data-gfd2="wire">Только B24/B28 проволоки</button><button data-gfd2="force">Усилие прессования HIGH/LOW</button></div></div>');
    if(!task)return;
    var step1=false;
    bindAnswers(task,'b64','Да. B64 подтверждает HOME и завершает возврат GUIDE.',function(a){return a==='b49'?'B49 подтверждает закрытый рабочий тракт, а не HOME.':'B24 относится к наличию проволоки.'},function(){step1=true;var s=q('#gfdC2');if(s)s.classList.add('on')});
    qa('[data-gfd2]',task).forEach(function(b){b.addEventListener('click',function(){
      qa('[data-gfd2]',task).forEach(function(x){x.classList.remove('right','wrong')});
      if(!step1){b.classList.add('wrong');feedback('Сначала определи, какой вход завершает возврат.',true);return}
      var ok=b.dataset.gfd2==='return';b.classList.add(ok?'right':'wrong');
      if(ok){setDone(9,'Сценарий C пройден: B64 завершает возврат; при его отсутствии проверяем фактический HOME каретки, механику и цепь B64.')}else feedback(b.dataset.gfd2==='wire'?'B24/B28 не подтверждают HOME направляющей.':'HIGH/LOW относится к натяжению/режиму, а не к признаку HOME GUIDE.',true);
    })});
  }

  function decorate(){
    if(typeof i==='undefined')return;
    if(i===6)scenarioA();
    else if(i===8)scenarioB();
    else if(i===9)scenarioC();
  }

  var prevRender=render;
  render=function(){prevRender();setTimeout(decorate,0)};
  setTimeout(decorate,0);
})();
