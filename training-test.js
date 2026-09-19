// EXPERIMENTAL TRAINING — keeps stable training intact and adds guided learning UX
(function(){
  if(typeof slides==='undefined'||typeof render!=='function'||typeof bind!=='function') return;

  const TEST_KEY='compactorTrainingTestV1';
  let testState={done:{},...safeLoad()};
  const chapters=[
    {name:'1 · УСТРОЙСТВО',from:0,to:3},
    {name:'2 · РАБОЧИЙ ЦИКЛ',from:4,to:5},
    {name:'3 · ОШИБКИ И ДЕЙСТВИЯ',from:6,to:10}
  ];
  const remembers=[
    'Бунт сжимается по оси: его высота уменьшается, наружный диаметр почти не меняется.',
    'Бунт находится между PP1 и PP2, а под ним расположен подъёмный стол.',
    'Сначала стол поднимается примерно на ½ хода, затем B58 разрешает центровку, B59 контролирует положение.',
    'Все четыре KNB-головы находятся на левой пресс-плите №1.',
    'Полный цикл: стол → пресс → головы PP1 → обвязка → возврат механизмов.',
    'Один проход четырёх голов = 4 вязки. Два прохода = 8 вязок.',
    'I/O показывает, что PLC видит на входах B и что включает на выходах Y.',
    'Журнал аварий показывает актуальные сообщения и историю. Сброс не устраняет физическую причину.',
    'Оператор читает сообщение, смотрит I/O, квитирует и пробует сброс. Если ошибка вернулась — вызывает механика.',
    'Механик сначала понимает, где проблема, затем проверяет нужный узел и выполняет контрольный цикл.',
    'Главное: нормальный цикл понятен, а при ошибке действуем по информации HMI, а не наугад.'
  ];

  const normalFlow=['БУНТ','СТОЛ','ПРЕСС','ГОЛОВЫ PP1','ОБВЯЗКА','ВОЗВРАТ'];
  const diagFlow=['ОШИБКА','I/O','ЖУРНАЛ','ОПЕРАТОР','МЕХАНИК'];

  function safeLoad(){
    try{return JSON.parse(localStorage.getItem(TEST_KEY)||'{}')||{}}catch(e){return{}}
  }
  function save(){try{localStorage.setItem(TEST_KEY,JSON.stringify(testState))}catch(e){}}
  function markDone(index,msg){
    testState.done[index]=true; save();
    const card=document.getElementById('testTask');
    if(card){card.classList.add('complete'); const f=card.querySelector('.task-feedback'); if(f)f.textContent=msg||'Отлично. Этот шаг понятен.'}
    updateTestProgress();
    if(navigator.vibrate) navigator.vibrate(20);
  }
  function updateTestProgress(){
    const el=document.getElementById('testProgressText');
    if(!el)return;
    const n=Object.keys(testState.done||{}).filter(k=>testState.done[k]).length;
    el.textContent=`ИНТЕРАКТИВ: ${n}/${slides.length}`;
  }

  function chapterFor(idx){return chapters.find(c=>idx>=c.from&&idx<=c.to)||chapters[0]}
  function cycleStepFor(idx){
    if(idx===0||idx===1)return 0;
    if(idx===2)return 1;
    if(idx===3)return 3;
    if(idx===4)return 2;
    if(idx===5)return 4;
    return -1;
  }
  function diagStepFor(idx){return idx<6?-1:Math.min(4,idx-6)}

  function orientationMarkup(idx){
    if(idx>5)return '';
    let focus='coil';
    if(idx===2)focus='table';
    if(idx===3||idx===5)focus='pp1';
    if(idx===4)focus='all';
    return `<div class="test-orientation" data-focus="${focus}">
      <div class="ori-pp ori-left"><b>PP1</b><small>ПРЕСС-ПЛИТА №1</small><span class="ori-heads"><i>R3</i><i>R2</i><i>R4</i><i>R1</i></span></div>
      <div class="ori-arrow">→</div>
      <div class="ori-coil"><span></span><b>БУНТ</b><small>СТОЛ ПОД НИМ</small><i class="ori-table"></i></div>
      <div class="ori-arrow">←</div>
      <div class="ori-pp ori-right"><b>PP2</b><small>ПРЕСС-ПЛИТА №2</small></div>
    </div>`
  }

  function flowMarkup(idx){
    const diagnostic=idx>=6;
    const items=diagnostic?diagFlow:normalFlow;
    const active=diagnostic?diagStepFor(idx):cycleStepFor(idx);
    return `<div class="test-flow ${diagnostic?'diag':''}">${items.map((x,k)=>`<span class="${k===active?'active':''} ${active>k?'done':''}"><i>${k+1}</i>${x}</span>${k<items.length-1?'<b>→</b>':''}`).join('')}</div>`
  }

  function taskMarkup(idx){
    const done=!!testState.done[idx];
    const body={
      0:`<p>Посмотри на схему и запомни главное: наружный диаметр бунта почти не меняется.</p><button data-task="understood">ПОНЯЛ ✓</button>`,
      1:`<p>Что находится <b>под бунтом</b> во время работы компактора?</p><div class="task-options"><button data-answer="table">Подъёмный стол</button><button data-answer="heads">Вязальные головы</button></div>`,
      2:`<p>Запусти подпрессовку и проследи последовательность <b>стол ½ → B58 → центровка → B59</b>.</p><button data-task="press">▶ ЗАПУСТИТЬ ПОКАЗ</button>`,
      3:`<p>Найди на пресс-плите №1 <b>голову 3 / R3</b>. Нажми прямо на неё.</p>`,
      4:`<p>Свяжи два вида одной машины: сначала боковой вид, затем посмотри <b>прямо на PP1</b>.</p><div class="task-options"><button data-view="side">СБОКУ</button><button data-view="front">PP1 СПЕРЕДИ</button></div>`,
      5:`<p>Сколько вязок получится при <b>двойной обвязке</b>?</p><div class="task-options"><button data-answer="4">4 вязки</button><button data-answer="8">8 вязок</button></div>`,
      6:`<p>На реальном I/O найди вход <b>B24</b> — наличие проволоки. Нажми строку B24.</p>`,
      7:`<p>Открой <b>ИСТОРИЮ</b>, чтобы увидеть не только текущие, но и прошлые ошибки.</p><button data-task="history">ПОКАЗАТЬ ИСТОРИЮ</button>`,
      8:`<p>Запомни порядок оператора: <b>прочитать → I/O → квитировать/сбросить → если вернулась, вызвать механика</b>.</p><button data-task="operator">ПРОЙТИ ШАГИ</button>`,
      9:`<p>Три действия механика: <b>посмотреть → проверить → контрольный цикл</b>.</p><button data-task="mechanic">ПОКАЗАТЬ 3 ШАГА</button>`,
      10:`<div class="final-mini" id="finalMini"></div>`
    }[idx]||'';
    return `<section id="testTask" class="test-task ${done?'complete':''}"><div class="task-head"><span>ТВОЁ ДЕЙСТВИЕ</span><b>${idx+1}/${slides.length}</b></div>${body}<div class="task-feedback">${done?'Этот шаг уже выполнен.':'Выполни одно простое действие — так информация лучше запомнится.'}</div></section>`
  }

  function cleanHMIMarkup(idx){
    if(idx!==6&&idx!==7)return '';
    const text=idx===6?'B = входы датчиков · Y = выходы/клапаны · U1–U4 = четыре головы PP1':'АКТУАЛЬНЫЕ = сейчас · ИСТОРИЯ = раньше · КВИТ. = увидел · СБРОС = попытка снять аварию';
    return `<div class="hmi-modebar"><span>${text}</span><button id="hmiCoachToggle">УБРАТЬ ПОДСКАЗКИ</button></div>`
  }

  function decorateTest(){
    const idx=i;
    const visual=document.getElementById('visual');
    const text=document.getElementById('text');
    if(!visual||!text)return;

    document.body.dataset.testSlide=String(idx+1);
    const ch=chapterFor(idx);
    const chapter=document.getElementById('testChapter');
    if(chapter)chapter.textContent=ch.name;
    const remember=document.getElementById('testRemember');
    if(remember)remember.innerHTML=`<b>ЗАПОМНИ:</b> ${remembers[idx]}`;

    visual.insertAdjacentHTML('afterend',orientationMarkup(idx)+flowMarkup(idx)+cleanHMIMarkup(idx));
    text.insertAdjacentHTML('afterend',taskMarkup(idx));
    updateTestProgress();
    bindTestTask(idx);
  }

  function setFeedback(text,kind){
    const f=document.querySelector('#testTask .task-feedback');
    if(!f)return;
    f.textContent=text;
    f.dataset.kind=kind||'';
  }

  function bindTestTask(idx){
    const task=document.getElementById('testTask'); if(!task)return;
    task.querySelector('[data-task="understood"]')?.addEventListener('click',()=>markDone(idx,'Верно. На следующих слайдах будем смотреть, как компактор уменьшает именно осевую высоту.'));

    task.querySelectorAll('[data-answer]').forEach(btn=>btn.addEventListener('click',()=>{
      const a=btn.dataset.answer;
      const ok=(idx===1&&a==='table')||(idx===5&&a==='8');
      task.querySelectorAll('[data-answer]').forEach(x=>x.classList.remove('right','wrong'));
      btn.classList.add(ok?'right':'wrong');
      if(ok){
        if(idx===5) document.getElementById('eight')?.classList.add('selected');
        markDone(idx,idx===1?'Да. Под бунтом находится подъёмный стол.':'Да. Два прохода четырёх голов дают 8 вязок.');
      }else setFeedback(idx===1?'Нет. Вязальные головы находятся на PP1, а под бунтом — подъёмный стол.':'Нет. Один проход = 4 вязки, двойная обвязка = два прохода = 8.','bad');
    }));

    task.querySelector('[data-task="press"]')?.addEventListener('click',()=>{
      document.getElementById('pressDemoBtn')?.click();
      markDone(idx,'Следи за подписями: стол ½ → сходятся плиты → B58 → стол центрирует → B59 контролирует положение.');
    });

    if(idx===3){
      document.querySelectorAll('.knb-arm[data-head]').forEach(h=>{
        h.classList.add('test-clickable');
        h.addEventListener('click',e=>{
          e.stopPropagation();
          const ok=h.dataset.head==='3';
          document.querySelectorAll('.knb-arm[data-head]').forEach(x=>x.classList.remove('test-right','test-wrong'));
          h.classList.add(ok?'test-right':'test-wrong');
          if(ok)markDone(idx,'Да. R3 / голова 3 находится сверху слева на PP1.');
          else setFeedback(`Это ${h.dataset.r}. Нужна R3 — верхняя левая голова.`,'bad');
        });
      });
    }

    task.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>{
      const side=document.getElementById('cycleSide'),front=document.getElementById('cycleFront');
      if(!side||!front)return;
      const isFront=btn.dataset.view==='front';
      side.classList.toggle('active',!isFront); front.classList.toggle('active',isFront);
      task.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('right',x===btn));
      if(isFront) markDone(idx,'Вот та же самая PP1, только вид прямо на её торец. Теперь расположение R3/R2/R4/R1 читается естественно.');
      else setFeedback('Это боковой вид: PP1 находится слева. Теперь переключись на PP1 спереди.');
    }));

    if(idx===6){
      document.querySelectorAll('.io-row').forEach(row=>{
        row.classList.add('test-io-clickable');
        row.addEventListener('click',()=>{
          const code=row.querySelector('b')?.textContent?.trim();
          document.querySelectorAll('.io-row').forEach(x=>x.classList.remove('test-right','test-wrong'));
          const ok=code==='B24'; row.classList.add(ok?'test-right':'test-wrong');
          if(ok)markDone(idx,'Да. B24 показывает наличие проволоки. Именно так I/O помогает связать экран с реальным механизмом.');
          else setFeedback(`Это ${code||'другой сигнал'}. Найди строку B24.`,'bad');
        });
      });
    }

    task.querySelector('[data-task="history"]')?.addEventListener('click',()=>{
      document.getElementById('historyAlarms')?.click();
      markDone(idx,'История нужна, чтобы увидеть, какие ошибки возникали раньше, а не только что активно сейчас.');
    });

    task.querySelector('[data-task="operator"]')?.addEventListener('click',async()=>{
      const b=document.getElementById('operatorNext2');
      if(!b)return markDone(idx,'Запомни порядок действий оператора.');
      b.click(); await delay(220); b.click(); await delay(220); b.click();
      markDone(idx,'Оператор не ремонтирует наугад: сначала информация HMI, затем сброс, потом механик при повторе ошибки.');
    });

    task.querySelector('[data-task="mechanic"]')?.addEventListener('click',async()=>{
      const b=document.getElementById('simpleMechNext');
      if(!b)return markDone(idx,'Посмотреть → проверить → контрольный цикл.');
      b.click(); await delay(260); b.click();
      markDone(idx,'Три шага: понять, где проблема → проверить нужный узел → проверить работу после ремонта.');
    });

    if(idx===10) buildFinalMini();

    const hmiToggle=document.getElementById('hmiCoachToggle');
    if(hmiToggle){
      hmiToggle.addEventListener('click',()=>{
        const stage=document.getElementById('stage');
        const clean=stage?.classList.toggle('test-clean-hmi');
        hmiToggle.textContent=clean?'ВЕРНУТЬ ПОДСКАЗКИ':'УБРАТЬ ПОДСКАЗКИ';
      });
    }
  }

  function delay(ms){return new Promise(r=>setTimeout(r,ms))}

  const finalQuestions=[
    {q:'Где находятся четыре вязальные головы?',a:['На пресс-плите №1 слева','Под подъёмным столом','На пресс-плите №2 справа'],ok:0},
    {q:'Что делает подъёмный стол?',a:['Поднимает и центрирует бунт','Скручивает проволоку','Возвращает пресс-плиты домой'],ok:0},
    {q:'Где смотреть текущие и прошлые ошибки?',a:['В журнале аварий HMI','Только на датчике B58','На табличке PP1'],ok:0},
    {q:'Ошибка вернулась после сброса. Что дальше?',a:['Вызвать механика и искать причину','Нажимать сброс до бесконечности','Отключить B24'],ok:0}
  ];
  let fq=0,score=0;
  function buildFinalMini(){
    const box=document.getElementById('finalMini'); if(!box)return;
    if(fq>=finalQuestions.length){
      box.innerHTML=`<div class="final-result"><b>${score}/${finalQuestions.length}</b><span>${score===4?'Отлично — базовая логика компактора понятна.':'Хорошо. Можно ещё раз пройти нужные слайды и повторить.'}</span><div class="final-actions"><a href="./training.html">СРАВНИТЬ С ОБЫЧНЫМ</a><a class="primary" href="./game.html#start">ПЕРЕЙТИ В ТРЕНАЖЁР</a></div></div>`;
      if(score>=3)markDone(10,'Финальная проверка пройдена.');
      return;
    }
    const q=finalQuestions[fq];
    box.innerHTML=`<div class="fq-count">БЫСТРАЯ ПРОВЕРКА ${fq+1}/${finalQuestions.length}</div><h3>${q.q}</h3><div class="fq-options">${q.a.map((x,k)=>`<button data-fq="${k}">${x}</button>`).join('')}</div><div class="fq-feedback">Выбери один ответ.</div>`;
    box.querySelectorAll('[data-fq]').forEach(btn=>btn.onclick=()=>{
      const k=+btn.dataset.fq,ok=k===q.ok;
      box.querySelectorAll('[data-fq]').forEach(x=>x.disabled=true);
      btn.classList.add(ok?'right':'wrong');
      if(ok)score++;
      const fb=box.querySelector('.fq-feedback');
      fb.textContent=ok?'Верно.':'Не совсем. Правильный ответ: '+q.a[q.ok]+'.';
      setTimeout(()=>{fq++;buildFinalMini()},650);
    });
  }

  // Replace render only in experimental page. Stable training.html never loads this file.
  const stableRender=render;
  render=function(){
    document.querySelectorAll('.test-orientation,.test-flow,.test-task,.hmi-modebar').forEach(x=>x.remove());
    stableRender();
    decorateTest();
  };

  // Add experimental controls and chapter navigation.
  const top=document.querySelector('.top');
  if(top){
    const tools=document.createElement('div');
    tools.className='test-tools';
    tools.innerHTML='<span class="test-badge">TEST MODE</span><span id="testChapter">1 · УСТРОЙСТВО</span><span id="testProgressText">ИНТЕРАКТИВ: 0/11</span><a href="./training.html">ОБЫЧНОЕ ОБУЧЕНИЕ</a>';
    top.insertAdjacentElement('afterend',tools);
  }
  const text=document.getElementById('text');
  if(text){
    const remember=document.createElement('div');
    remember.id='testRemember'; remember.className='test-remember';
    text.insertAdjacentElement('beforebegin',remember);
  }
  const card=document.querySelector('.card');
  if(card){
    const tabs=document.createElement('div');
    tabs.className='test-chapters';
    tabs.innerHTML=chapters.map((c,k)=>`<button data-chapter="${k}">${c.name}</button>`).join('');
    card.querySelector('.progress')?.insertAdjacentElement('afterend',tabs);
    tabs.querySelectorAll('[data-chapter]').forEach(b=>b.onclick=()=>{i=chapters[+b.dataset.chapter].from;render()});
  }

  const stableBack=document.getElementById('back');
  if(stableBack)stableBack.title='В главное меню';

  // Keep chapter buttons in sync.
  const renderWithChapter=render;
  render=function(){
    renderWithChapter();
    const ch=chapterFor(i);
    document.querySelectorAll('[data-chapter]').forEach((b,k)=>b.classList.toggle('active',chapters[k]===ch));
  };

  // Reset final mini state on a fresh visit to final slide from earlier slide.
  const prevBtn=document.getElementById('prev'),nextBtn=document.getElementById('next');
  prevBtn?.addEventListener('click',()=>{ if(i<10){fq=0;score=0} },true);
  nextBtn?.addEventListener('click',()=>{ if(i<10){fq=0;score=0} },true);

  render();
})();
