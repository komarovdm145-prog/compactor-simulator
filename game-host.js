const frame=document.getElementById('gameFrame');
function inject(doc,tag,attrs){const e=doc.createElement(tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));(tag==='script'?doc.body:doc.head).appendChild(e);return e;}
frame.addEventListener('load',()=>{
  const d=frame.contentDocument,w=frame.contentWindow;
  if(!d||!w)return;
  if(!d.querySelector('link[href*="menu-modern.css"]'))inject(d,'link',{rel:'stylesheet',href:'./menu-modern.css?v=8.6.14'});
  if(!d.querySelector('link[href*="v8-training.css"]'))inject(d,'link',{rel:'stylesheet',href:'./v8-training.css?v=8.6.14'});
  if(!d.querySelector('link[href*="v8-lift-table.css"]'))inject(d,'link',{rel:'stylesheet',href:'./v8-lift-table.css?v=8.6.14'});
  if(!d.querySelector('link[href*="v8-guide-carriage.css"]'))inject(d,'link',{rel:'stylesheet',href:'./v8-guide-carriage.css?v=8.6.14'});
  const shell=inject(d,'script',{src:'./v8-shell.js?v=8.6.14'});
  shell.onload=()=>{
    const ext=inject(d,'script',{src:'./v8-training.js?v=8.6.14'});
    ext.onload=()=>{
      const lift=inject(d,'script',{src:'./v8-lift-table.js?v=8.6.14'});
      lift.onload=()=>{
        const guide=inject(d,'script',{src:'./v8-guide-carriage.js?v=8.6.14'});
        guide.onload=()=>{
          setTimeout(()=>{
            const action=location.hash.replace('#','');
            if(action==='start')d.getElementById('menuStart')?.click();
            if(action==='exam')d.getElementById('menuExam')?.click();
          },120);
        };
      };
    };
  };
});