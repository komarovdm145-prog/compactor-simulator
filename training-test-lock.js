// TEST MODE v2 — strict step-by-step progression lock
(function(){
  const KEY='compactorTrainingTestV1';
  const CHAPTER_STARTS=[0,4,6];

  function currentIndex(){
    const n=parseInt(document.body.dataset.testSlide||'1',10);
    return Number.isFinite(n)?Math.max(0,n-1):0;
  }

  function loadState(){
    try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){return{}}
  }

  function isDone(idx){
    const s=loadState();
    return !!(s.done&&s.done[idx]);
  }

  function canReach(target){
    if(target<=0)return true;
    for(let k=0;k<target;k++) if(!isDone(k)) return false;
    return true;
  }

  function ensureLockHint(){
    const nav=document.querySelector('.nav');
    if(!nav)return null;
    let hint=document.getElementById('testNextLockHint');
    if(!hint){
      hint=document.createElement('div');
      hint.id='testNextLockHint';
      hint.className='test-next-lock-hint';
      nav.insertAdjacentElement('beforebegin',hint);
    }
    return hint;
  }

  function syncLock(){
    const idx=currentIndex();
    const next=document.getElementById('next');
    const done=isDone(idx);
    const hint=ensureLockHint();

    if(next){
      next.disabled=!done;
      next.classList.toggle('test-locked',!done);
      next.setAttribute('aria-disabled',String(!done));
      next.title=done?'Можно перейти дальше':'Сначала выполни правильное действие на этом слайде';
    }

    if(hint){
      hint.classList.toggle('open',!done);
      hint.innerHTML=done
        ? '<span class="ok">✓ Задание выполнено — можно идти дальше</span>'
        : '<span class="lock">🔒 Сначала выполни действие в блоке «ТВОЁ ДЕЙСТВИЕ»</span>';
    }

    document.querySelectorAll('[data-chapter]').forEach(btn=>{
      const k=+btn.dataset.chapter;
      const target=CHAPTER_STARTS[k]??0;
      const locked=target>idx&&!canReach(target);
      btn.classList.toggle('test-chapter-locked',locked);
      btn.setAttribute('aria-disabled',String(locked));
      btn.title=locked?'Сначала пройди предыдущие задания':'';
    });
  }

  function showBlockedMessage(text){
    const feedback=document.querySelector('#testTask .task-feedback');
    if(feedback){
      feedback.textContent=text||'Сначала выполни правильное действие этого слайда.';
      feedback.dataset.kind='bad';
      feedback.classList.add('test-lock-flash');
      setTimeout(()=>feedback.classList.remove('test-lock-flash'),500);
    }
    const task=document.getElementById('testTask');
    if(task){
      task.classList.add('test-attention');
      setTimeout(()=>task.classList.remove('test-attention'),600);
      task.scrollIntoView({behavior:'smooth',block:'nearest'});
    }
    if(navigator.vibrate)navigator.vibrate([20,35,20]);
  }

  // Block NEXT before the stable training handler can change slides.
  document.getElementById('next')?.addEventListener('click',e=>{
    const idx=currentIndex();
    if(!isDone(idx)){
      e.preventDefault();
      e.stopImmediatePropagation();
      showBlockedMessage('Переход закрыт. Выполни правильное действие — после этого кнопка «Далее» откроется.');
    }
  },true);

  // Chapter tabs cannot be used to skip unfinished slides.
  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('[data-chapter]');
    if(!btn)return;
    const target=CHAPTER_STARTS[+btn.dataset.chapter]??0;
    const idx=currentIndex();
    if(target>idx&&!canReach(target)){
      e.preventDefault();
      e.stopImmediatePropagation();
      showBlockedMessage('Эта глава пока закрыта. Сначала пройди задания по порядку.');
    }
  },true);

  // Every render must immediately restore the correct lock state.
  if(typeof render==='function'){
    const previousRender=render;
    render=function(){
      previousRender();
      setTimeout(syncLock,0);
    };
  }

  // markDone() changes the task class and localStorage; observe both visual rerenders
  // and completion changes so NEXT opens immediately after the correct action.
  const observer=new MutationObserver(()=>syncLock());
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-test-slide']});

  const style=document.createElement('style');
  style.textContent=`
    #next.test-locked{opacity:.38;filter:saturate(.35);cursor:not-allowed;box-shadow:none!important}
    .test-next-lock-hint{margin:8px 0 2px;text-align:center;font-size:9px;font-weight:900;letter-spacing:.035em;min-height:18px;transition:.2s}
    .test-next-lock-hint .lock{display:inline-block;padding:6px 10px;border-radius:10px;border:1px solid #91515d;background:#34141dcc;color:#ffc3cb}
    .test-next-lock-hint .ok{display:inline-block;padding:6px 10px;border-radius:10px;border:1px solid #3d8068;background:#103428cc;color:#a9f2d5}
    [data-chapter].test-chapter-locked{opacity:.35;filter:saturate(.25);cursor:not-allowed}
    .test-task.test-attention{animation:testAttention .58s ease}
    .task-feedback.test-lock-flash{font-weight:900}
    @keyframes testAttention{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}50%{transform:translateX(4px)}75%{transform:translateX(-2px)}}
    @media(max-width:520px){.test-next-lock-hint{font-size:8px}.test-next-lock-hint .lock,.test-next-lock-hint .ok{padding:5px 8px}}
  `;
  document.head.appendChild(style);

  syncLock();
})();
