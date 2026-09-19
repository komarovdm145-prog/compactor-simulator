// TEST MODE v3 — strict step-by-step progression lock without MutationObserver loops
(function(){
  const KEY='compactorTrainingTestV1';
  const CHAPTER_STARTS=[0,4,6];
  let syncing=false;

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

  function setClass(el,name,on){
    if(!el)return;
    if(el.classList.contains(name)!==on)el.classList.toggle(name,on);
  }

  function setAttr(el,name,value){
    if(!el)return;
    const v=String(value);
    if(el.getAttribute(name)!==v)el.setAttribute(name,v);
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
    if(syncing)return;
    syncing=true;
    try{
      const idx=currentIndex();
      const next=document.getElementById('next');
      const done=isDone(idx);
      const hint=ensureLockHint();

      if(next){
        if(next.disabled===done)next.disabled=!done;
        setClass(next,'test-locked',!done);
        setAttr(next,'aria-disabled',!done);
        const title=done?'Можно перейти дальше':'Сначала выполни правильное действие на этом слайде';
        if(next.title!==title)next.title=title;
      }

      if(hint){
        setClass(hint,'open',!done);
        const html=done
          ? '<span class="ok">✓ Задание выполнено — можно идти дальше</span>'
          : '<span class="lock">🔒 Сначала выполни действие в блоке «ТВОЁ ДЕЙСТВИЕ»</span>';
        if(hint.innerHTML!==html)hint.innerHTML=html;
      }

      document.querySelectorAll('[data-chapter]').forEach(btn=>{
        const k=+btn.dataset.chapter;
        const target=CHAPTER_STARTS[k]??0;
        const locked=target>idx&&!canReach(target);
        setClass(btn,'test-chapter-locked',locked);
        setAttr(btn,'aria-disabled',locked);
        const title=locked?'Сначала пройди предыдущие задания':'';
        if(btn.title!==title)btn.title=title;
      });
    }finally{
      syncing=false;
    }
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
      try{task.scrollIntoView({behavior:'smooth',block:'nearest'})}catch(e){}
    }
    if(navigator.vibrate)navigator.vibrate([20,35,20]);
  }

  document.getElementById('next')?.addEventListener('click',e=>{
    const idx=currentIndex();
    if(!isDone(idx)){
      e.preventDefault();
      e.stopImmediatePropagation();
      showBlockedMessage('Переход закрыт. Выполни правильное действие — после этого кнопка «Далее» откроется.');
    }
  },true);

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

  if(typeof render==='function'){
    const previousRender=render;
    render=function(){
      previousRender();
      requestAnimationFrame(syncLock);
    };
  }

  // Polling is intentionally lightweight and avoids the self-triggering DOM mutation loop
  // that caused iPhone browsers to stay on a black loading screen.
  const timer=setInterval(syncLock,180);
  window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
  window.addEventListener('pageshow',syncLock);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncLock()});

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
