// TEST training — PP2 moving guides in the full-cycle lesson without changing stable training
(function(){
  if(typeof render!=='function')return;
  const TEST_KEY='compactorTrainingTestV1';
  const MIGRATION_KEY='compactorGuideLessonV1';
  let guideReady=false;

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

  function decorateFlow(){
    if(typeof i==='undefined'||i>5)return;
    const flow=document.querySelector('.test-flow:not(.diag)');if(!flow)return;
    let gs=flow.querySelector('.flow-guide-pp2');
    if(!gs){
      const press=[...flow.querySelectorAll('span')].find(x=>x.textContent.includes('ПРЕСС'));
      if(press){
        const arrow=document.createElement('b');arrow.textContent='→';
        gs=document.createElement('span');gs.className='flow-guide-pp2';gs.innerHTML='<i>G</i>PP2 GUIDE';
        press.after(arrow,gs);
      }
    }
    if(gs){
      gs.classList.remove('active','done');
      if(i===4){flow.querySelectorAll('span').forEach(x=>x.classList.remove('active'));gs.classList.add('active')}
      else if(i>4)gs.classList.add('done');
    }
  }

  function decorate(){
    decorateFlow();
    if(typeof i==='undefined'||i!==4)return;
    const stage=document.getElementById('stage'),task=document.getElementById('testTask');
    if(!stage||!task)return;
    guideReady=guideReady||persistedDone();

    if(!document.getElementById('testGuidePP2'))stage.insertAdjacentHTML('beforeend','<div id="testGuidePP2" class="test-pp2-guide"><div class="tg-plate"></div><div class="tg-carriage"></div><i class="tg-finger g1"></i><i class="tg-finger g2"></i><i class="tg-finger g3"></i><i class="tg-finger g4"></i><span class="tg-label">PP2 · ПОДВИЖНЫЕ НАПРАВЛЯЮЩИЕ</span><span class="tg-state">B64 · HOME</span></div>');

    const p=task.querySelector('p');
    if(p)p.innerHTML='Сначала выдвини <b>каретку направляющих PP2</b>: она должна дойти до рабочего положения и замкнуть путь проволоки. После подтверждения <b>B49</b> переходи к PP1 и четырём вязальным головам.';

    if(!document.getElementById('guideSubtask')){
      const opts=task.querySelector('.task-options');
      if(opts)opts.insertAdjacentHTML('beforebegin','<div id="guideSubtask" class="guide-subtask"><b>ШАГ 1 · PP2 GUIDE CARRIAGE</b><button id="testGuideMove">ВЫДВИНУТЬ НАПРАВЛЯЮЩИЕ →</button><div class="guide-sequence"><span id="gs64">B64 HOME</span><span id="gs68">MOVE</span><span id="gs69">B69 POS</span><span id="gs49">B49 CLOSED</span></div></div>');
    }

    const front=task.querySelector('[data-view="front"]');
    if(front&&!guideReady)front.disabled=true;
    if(front&&guideReady)front.disabled=false;
    const move=document.getElementById('testGuideMove');
    const demo=document.getElementById('testGuidePP2');
    if(guideReady&&move){move.classList.add('done');move.textContent='✓ НАПРАВЛЯЮЩИЕ CLOSED';demo?.classList.add('closed');const st=demo?.querySelector('.tg-state');if(st)st.textContent='B49 · CLOSED';['gs69','gs49'].forEach(id=>document.getElementById(id)?.classList.add('on'));}

    if(move&&!move.dataset.bound){
      move.dataset.bound='1';
      move.addEventListener('click',async()=>{
        if(guideReady)return;
        move.disabled=true;demo?.classList.add('moving');
        const s64=document.getElementById('gs64'),s68=document.getElementById('gs68'),s69=document.getElementById('gs69'),s49=document.getElementById('gs49'),label=demo?.querySelector('.tg-state');
        s64?.classList.remove('on');s68?.classList.add('on');if(label)label.textContent='MOVING';
        const fb=task.querySelector('.task-feedback');if(fb)fb.textContent='Каретка сошла с B64 HOME и движется от PP2 в рабочую зону…';
        await new Promise(r=>setTimeout(r,550));
        s68?.classList.remove('on');s69?.classList.add('on');if(label)label.textContent='B69 · POSITION';
        await new Promise(r=>setTimeout(r,300));
        demo?.classList.remove('moving');demo?.classList.add('closed');s49?.classList.add('on');if(label)label.textContent='B49 · CLOSED';
        guideReady=true;move.disabled=false;move.classList.add('done');move.textContent='✓ НАПРАВЛЯЮЩИЕ CLOSED';if(front)front.disabled=false;
        if(fb)fb.textContent='Верно. B49 подтвердил замыкание направляющих — путь проволоки готов. Теперь нажми «PP1 СПЕРЕДИ».';
      });
    }
  }

  const previousRender=render;
  render=function(){previousRender();setTimeout(decorate,0)};
  setTimeout(decorate,0);
})();
