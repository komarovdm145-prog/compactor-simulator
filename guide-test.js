// GUIDE TEST 1 — isolated PP2 guide geometry/motion sandbox.
(function(){
  let pos=0,moving=false;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  function el(id){return document.getElementById(id)}
  function stateName(){return moving?'MOVING':pos===0?'HOME':pos===100?'WORK / CLOSED':'50%'}
  function decorate(){
    const p2=el('press2'),scene=el('machineScene');
    if(!p2||!scene)return;
    if(!el('pp2GuideTest')){
      p2.insertAdjacentHTML('beforeend','<div id="pp2GuideTest" class="home"><div class="gt-rail"></div><div class="gt-carriage"><i class="gt-cross c1"></i><i class="gt-cross c2"></i><i class="gt-finger f1"></i><i class="gt-finger f2"></i><i class="gt-finger f3"></i><i class="gt-finger f4"></i></div><span class="gt-label">PP2 · GUIDE CARRIAGE</span><span class="gt-state">HOME · B64</span></div>');
    }
    if(!el('guideTestBadge'))scene.insertAdjacentHTML('beforeend','<div id="guideTestBadge">GUIDE TEST · НЕ ОСНОВНАЯ ИГРА</div>');
    const op=document.querySelector('.operator-panel');
    if(op&&!el('guideTestPanel')){
      const actions=op.querySelector('.action-grid');
      const html='<div id="guideTestPanel"><div class="guide-test-head"><b>ЭКСПЕРИМЕНТ · НАПРАВЛЯЮЩА PP2</b><span>STABLE НЕ ИЗМЕНЕНА</span></div><div class="guide-test-buttons"><button data-gtest="0">← HOME</button><button data-gtest="50">50%</button><button data-gtest="100">WORK →</button><button id="guideAutoDemo" class="primary-test">▶ АВТО-ДЕМО</button></div><div id="guideTestRead" class="guide-test-read"></div><div class="guide-test-warning">Сейчас проверяем только форму, расположение и ход каретки. После твоего подтверждения привяжем её к реальному циклу, B64/B69/B49 и подаче проволоки.</div></div>';
      if(actions)actions.insertAdjacentHTML('beforebegin',html);else op.insertAdjacentHTML('beforeend',html);
      document.querySelectorAll('[data-gtest]').forEach(b=>b.onclick=()=>moveTo(+b.dataset.gtest));
      el('guideAutoDemo').onclick=demo;
    }
    paint();
  }
  function paint(){
    const g=el('pp2GuideTest');if(!g)return;
    g.classList.toggle('home',pos===0&&!moving);g.classList.toggle('half',pos===50&&!moving);g.classList.toggle('work',pos===100&&!moving);g.classList.toggle('moving',moving);
    const s=g.querySelector('.gt-state');if(s)s.textContent=moving?'Y68 · MOVING':pos===0?'B64 · HOME':pos===100?'B49 · CLOSED':'B69 · 50%';
    const r=el('guideTestRead');if(r){const cls=moving?'move':pos===100?'ok':'';r.innerHTML='<b>Положение:</b> <span class="'+cls+'">'+stateName()+'</span> · <b>B64</b> '+(pos===0&&!moving?'ON':'OFF')+' · <b>B69</b> '+(!moving&&pos>0?'POSITION':'—')+' · <b>B49</b> '+(pos===100&&!moving?'CLOSED':'OPEN')+' · <b>Y68</b> '+(moving?'ON':'OFF')}
    if(typeof machine!=='undefined'){
      machine.guide=pos;machine.B64=pos===0&&!moving;machine.B69=!moving&&pos>0;machine.B49=pos===100&&!moving;machine.Y68=moving;
    }
  }
  async function moveTo(target){
    if(moving)return; target=Math.max(0,Math.min(100,target));
    if(target===pos){paint();return}
    moving=true;paint();
    await sleep(180);
    const g=el('pp2GuideTest');
    if(g){g.classList.remove('home','half','work');g.classList.add(target===0?'home':target===50?'half':'work')}
    await sleep(650);
    pos=target;moving=false;paint();
    if(typeof log==='function')log('GUIDE TEST: каретка PP2 → '+stateName()+'.');
    if(typeof renderAll==='function')renderAll();
  }
  async function demo(){
    if(moving)return;
    const b=el('guideAutoDemo');if(b)b.disabled=true;
    await moveTo(50);await sleep(350);await moveTo(100);await sleep(650);await moveTo(50);await sleep(300);await moveTo(0);
    if(b)b.disabled=false;
  }
  const timer=setInterval(decorate,400);
  window.addEventListener('pagehide',()=>clearInterval(timer));
  setTimeout(decorate,150);
})();
