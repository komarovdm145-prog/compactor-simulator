const frame=document.getElementById('gameFrame');
function inject(doc,tag,attrs){const e=doc.createElement(tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));(tag==='script'?doc.body:doc.head).appendChild(e);return e;}
function restoreMenuLinks(d){
  const menu=d.querySelector('.menu-actions');
  if(menu&&!d.getElementById('menuTrainingTest')){
    const training=d.getElementById('menuTraining');
    const b=d.createElement('button');
    b.id='menuTrainingTest';
    b.textContent='🧪 ОБУЧЕНИЕ TEST';
    b.style.borderColor='#8b6a2f';
    b.style.background='linear-gradient(145deg,#322817,#1b1a16)';
    b.style.color='#ffe4a3';
    b.onclick=()=>{window.location.href='./test.html?v=9';};
    if(training)training.after(b);else menu.appendChild(b);
  }
  const home=d.getElementById('homeBtn');
  if(home)home.onclick=()=>{window.location.href='./index.html?v=8.6.18';};
}
frame.addEventListener('load',()=>{
  const d=frame.contentDocument,w=frame.contentWindow;
  if(!d||!w)return;
  if(!d.querySelector('link[href*="menu-modern.css"]'))inject(d,'link',{rel:'stylesheet',href:'./menu-modern.css?v=8.6.18'});
  if(!d.querySelector('link[href*="v8-training.css"]'))inject(d,'link',{rel:'stylesheet',href:'./v8-training.css?v=8.6.18'});
  if(!d.querySelector('link[href*="v8-lift-table.css"]'))inject(d,'link',{rel:'stylesheet',href:'./v8-lift-table.css?v=8.6.18'});
  if(!d.querySelector('link[href*="v8-guide-cinematic-v3.css"]'))inject(d,'link',{rel:'stylesheet',href:'./v8-guide-cinematic-v3.css?v=8.6.18'});
  const shell=inject(d,'script',{src:'./v8-shell.js?v=8.6.18'});
  shell.onload=()=>{
    const ext=inject(d,'script',{src:'./v8-training.js?v=8.6.18'});
    ext.onload=()=>{
      const lift=inject(d,'script',{src:'./v8-lift-table.js?v=8.6.18'});
      lift.onload=()=>{
        const guide=inject(d,'script',{src:'./v8-guide-cinematic-v4.js?v=8.6.18'});
        guide.onload=()=>{
          restoreMenuLinks(d);
          setTimeout(()=>{
            restoreMenuLinks(d);
            const action=location.hash.replace('#','');
            if(action==='start')d.getElementById('menuStart')?.click();
            if(action==='exam')d.getElementById('menuExam')?.click();
          },120);
        };
      };
    };
  };
});