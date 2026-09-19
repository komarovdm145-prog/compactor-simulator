const frame=document.getElementById('gameFrame');
function inject(doc,tag,attrs){const e=doc.createElement(tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));(tag==='script'?doc.body:doc.head).appendChild(e);return e}
frame.addEventListener('load',()=>{
  const d=frame.contentDocument;if(!d)return;
  inject(d,'link',{rel:'stylesheet',href:'./menu-modern.css?v=8.6.16'});
  inject(d,'link',{rel:'stylesheet',href:'./v8-training.css?v=8.6.16'});
  inject(d,'link',{rel:'stylesheet',href:'./v8-lift-table.css?v=8.6.16'});
  inject(d,'link',{rel:'stylesheet',href:'./guide-test.css?v=1'});
  const shell=inject(d,'script',{src:'./v8-shell.js?v=8.6.16'});
  shell.onload=()=>{
    const train=inject(d,'script',{src:'./v8-training.js?v=8.6.16'});
    train.onload=()=>{
      const lift=inject(d,'script',{src:'./v8-lift-table.js?v=8.6.16'});
      lift.onload=()=>{
        const guide=inject(d,'script',{src:'./guide-test.js?v=1'});
        guide.onload=()=>setTimeout(()=>d.getElementById('menuStart')?.click(),120)
      }
    }
  }
});