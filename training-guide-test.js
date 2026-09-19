// TEST training — add PP2 moving guide to the full-cycle lesson without changing stable training
(function(){
  if(typeof render!=='function')return;
  const TEST_KEY='compactorTrainingTestV1';
  const MIGRATION_KEY='compactorGuideLessonV1';
  let guideReady=false;

  // The PP2 guide is a new required lesson. Unlock old saved progress only once at slide 5
  // so a user who completed TEST before this addition must actually perform the new action.
  try{
    if(!localStorage.getItem(MIGRATION_KEY)){
      const s=JSON.parse(localStorage.getItem(TEST_KEY)||'{}')||{};
      if(s.done)delete s.done[4];
      localStorage.setItem(TEST_KEY,JSON.stringify(s));
      localStorage.setItem(MIGRATION_KEY,'migrated');
    }
  }catch(e){}

  function persistedDone(){
    try{const s=JSON.parse(localStorage.getItem(TEST_KEY)||'{}');return !!(s.done&&s.done[4])}catch(e){return false}
  }

  function decorate(){
    if(typeof i==='undefined'||i!==4)return;
    const stage=document.getElementById('stage'),task=document.getElementById('testTask');
    if(!stage||!task)return;
    guideReady=guideReady||persistedDone();

    if(!document.getElementById('testGuidePP2'))stage.insertAdjacentHTML('beforeend','<div id="testGuidePP2" class="test-pp2-guide"><div class="tg-plate"></div><div class="tg-arm"></div><div class="tg-carriage"></div><span class="tg-label">PP2 · ПОДВИЖНАЯ НАПРАВЛЯЮЩА</span><span class="tg-state">B64 · HOME</span></div>');

    const p=task.querySelector('p');
    if(p)p.innerHTML='Сначала выдвини <b>подвижную направляющую PP2</b>: она замыкает путь проволоки. После подтверждения <b>B49</b> посмотри прямо на PP1 с четырьмя вязальными головами.';

    if(!document.getElementById('guideSubtask')){
      const opts=task.querySelector('.task-options');
      if(opts)opts.insertAdjacentHTML('beforebegin','<div id="guideSubtask" class="guide-subtask"><b>ШАГ 1 · PP2 GUIDE</b><button id="testGuideMove">ВЫДВИНУТЬ НАПРАВЛЯЮЩУЮ →</button><div class="guide-sequence"><span id="gs64">B64 HOME</span><span id="gs68">Y68 MOVE</span><span id="gs69">B69 POS</span><span id="gs49">B49 CLOSED</span></div></div>');
    }

    const front=task.querySelector('[data-view="front"]');
    if(front&&!guideReady)front.disabled=true;
    if(front&&guideReady)front.disabled=false;
    const move=document.getElementById('testGuideMove');
    const demo=document.getElementById('testGuidePP2');
    if(guideReady&&move){move.classList.add('done');move.textContent='✓ НАПРАВЛЯЮЩА CLOSED';demo?.classList.add('closed');const st=demo?.querySelector('.tg-state');if(st)st.textContent='B49 · CLOSED';['gs64','gs68','gs69','gs49'].forEach((id,k)=>document.getElementById(id)?.classList.toggle('on',k>1));}

    if(move&&!move.dataset.bound){
      move.dataset.bound='1';
      move.addEventListener('click',async()=>{
        if(guideReady)return;
        move.disabled=true;demo?.classList.add('moving');
        const s64=document.getElementById('gs64'),s68=document.getElementById('gs68'),s69=document.getElementById('gs69'),s49=document.getElementById('gs49'),label=demo?.querySelector('.tg-state');
        s64?.classList.remove('on');s68?.classList.add('on');if(label)label.textContent='Y68 · MOVING';
        const fb=task.querySelector('.task-feedback');if(fb)fb.textContent='Каретка вышла из B64 HOME. Y68 перемещает направляющую от PP2 к рабочему положению…';
        await new Promise(r=>setTimeout(r,500));
        s68?.classList.remove('on');s69?.classList.add('on');if(label)label.textContent='B69 · POSITION';
        await new Promise(r=>setTimeout(r,300));
        demo?.classList.remove('moving');demo?.classList.add('closed');s49?.classList.add('on');if(label)label.textContent='B49 · CLOSED';
        guideReady=true;move.disabled=false;move.classList.add('done');move.textContent='✓ НАПРАВЛЯЮЩА CLOSED';if(front)front.disabled=false;
        if(fb)fb.textContent='Верно. B49 подтвердил замыкание направляющей — теперь путь проволоки готов. Нажми «PP1 СПЕРЕДИ».';
      });
    }
  }

  const previousRender=render;
  render=function(){previousRender();setTimeout(decorate,0)};
  setTimeout(decorate,0);
})();
