const frame=document.getElementById('gameFrame');
function inject(doc,tag,attrs){const e=doc.createElement(tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));(tag==='script'?doc.body:doc.head).appendChild(e);return e}
function badge(doc,text,state='load'){
  let b=doc.getElementById('guideBuildBadge');
  if(!b){b=doc.createElement('div');b.id='guideBuildBadge';Object.assign(b.style,{position:'fixed',right:'10px',top:'10px',zIndex:'9999',padding:'7px 10px',borderRadius:'999px',font:'800 9px/1 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',letterSpacing:'.06em',boxShadow:'0 5px 16px #0008'});doc.body.appendChild(b)}
  const map={load:['#2a260f','#e9c85c','#5d4d14'],ok:['#103427','#a9f0d3','#3e8068'],bad:['#3a1218','#ffd0d6','#9a4652']};const c=map[state]||map.load;b.style.background=c[0];b.style.color=c[1];b.style.border='1px solid '+c[2];b.textContent=text
}
frame.addEventListener('load',()=>{
  const d=frame.contentDocument;if(!d)return;
  badge(d,'v8.6.15 · PP2 GUIDE · LOADING');
  if(!d.querySelector('link[href*="menu-modern.css"]'))inject(d,'link',{rel:'stylesheet',href:'./menu-modern.css?v=8.6.15'});
  if(!d.querySelector('link[href*="v8-training.css"]'))inject(d,'link',{rel:'stylesheet',href:'./v8-training.css?v=8.6.15'});
  if(!d.querySelector('link[href*="v8-lift-table.css"]'))inject(d,'link',{rel:'stylesheet',href:'./v8-lift-table.css?v=8.6.15'});
  if(!d.querySelector('link[href*="v8-guide-carriage.css"]'))inject(d,'link',{rel:'stylesheet',href:'./v8-guide-carriage.css?v=8.6.15'});
  const shell=inject(d,'script',{src:'./v8-shell.js?v=8.6.15'});
  shell.onerror=()=>badge(d,'v8.6.15 · SHELL ERROR','bad');
  shell.onload=()=>{
    const ext=inject(d,'script',{src:'./v8-training.js?v=8.6.15'});
    ext.onerror=()=>badge(d,'v8.6.15 · TRAINING ERROR','bad');
    ext.onload=()=>{
      const lift=inject(d,'script',{src:'./v8-lift-table.js?v=8.6.15'});
      lift.onerror=()=>badge(d,'v8.6.15 · LIFT ERROR','bad');
      lift.onload=()=>{
        const guide=inject(d,'script',{src:'./v8-guide-carriage.js?v=8.6.15'});
        guide.onerror=()=>badge(d,'v8.6.15 · GUIDE ERROR','bad');
        guide.onload=()=>{
          badge(d,'v8.6.15 · PP2 GUIDE ACTIVE','ok');
          setTimeout(()=>{
            const action=location.hash.replace('#','');
            if(action==='start')d.getElementById('menuStart')?.click();
            if(action==='exam')d.getElementById('menuExam')?.click();
          },140)
        }
      }
    }
  }
});