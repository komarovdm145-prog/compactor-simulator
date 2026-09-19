// Stable external bootloader for Compactor Trainer v8.4
(async function(){
  const boot=document.getElementById('boot');
  try{
    const r=await fetch('./v8.html?v=8.4',{cache:'no-store'});
    if(!r.ok) throw new Error('v8.html '+r.status);
    let h=await r.text();
    h=h.replace('</head>','<link rel="stylesheet" href="menu-modern.css?v=8.2"><link rel="stylesheet" href="v8-training.css?v=8.3"></head>');
    h=h.replace('🧪 ЭКЗАМЕН','📝 ЭКЗАМЕН');
    h=h.replace('</body>','<script src="v8-training.js?v=8.3"></script></body>');
    document.open();
    document.write(h);
    document.close();
  }catch(e){
    console.error('Compactor boot error',e);
    if(boot){
      boot.innerHTML='<div style="text-align:center;padding:24px"><b style="display:block;color:#dcefff;margin-bottom:10px">Не удалось загрузить тренажёр</b><span style="display:block;color:#7fa2b8;margin-bottom:16px">Обнови страницу или открой рабочую версию напрямую.</span><a href="./v8.html?v=8.4" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#119ed6;color:white;text-decoration:none;font-weight:700">ОТКРЫТЬ ИГРУ</a></div>';
    }
  }
})();