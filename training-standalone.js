const slides=[
{t:'Что делает компактор?',x:'С линии приходит большой рыхлый бунт катанки. Компактор нужен, чтобы сжать его и закрепить металлической проволокой.',v:'loose'},
{t:'Бунт заходит в компактор',x:'Бунт оказывается между двумя пресс-плитами. До прессования его размеры такие же, как на предыдущем шаге.',v:'arrive'},
{t:'Компактор прессует бунт',x:'Две пресс-плиты сходятся слева и справа. Наружный диаметр бунта остаётся тем же — уменьшается только его осевая высота между плитами.',v:'press'},
{t:'Четыре вязальные головы KNB',x:'Четыре головы расположены вокруг торца бунта на диагональных направляющих. Они входят в рабочее положение, подают проволоку, натягивают её, делают скрутку и отрезают.',v:'heads'},
{t:'Попробуй полный цикл',x:'Нажми «Запустить цикл». Сначала компактор сожмёт бунт, затем четыре головы войдут в рабочее положение и выполнят один проход обвязки.',v:'cycle'},
{t:'Одинарная и двойная вязка',x:'Одинарная — один проход четырёх голов: 4 вязки. Двойная — два прохода по 4: всего 8 вязок.',v:'ties'},
{t:'Иногда появляется неисправность',x:'Может пропасть сигнал датчика, остановиться проволока, закусить направляющую или не завершиться вязка. Тогда цикл останавливается и появляется сообщение.',v:'fault'},
{t:'Что делает оператор',x:'Оператор видит ошибку, квитирует её и может выполнить сброс. Если причина осталась и ошибка возвращается — нужен механик.',v:'operator'},
{t:'Что делает механик',x:'Механик смотрит HMI и PLC, находит подозрительный сигнал, проверяет датчик или механизм, устраняет причину и делает контрольный цикл.',v:'mechanic'},
{t:'Готово',x:'Теперь можно запускать игру. Попробуй 4 и 8 вязок, затем переходи к HMI и неисправностям.',v:'ready'}
];
let i=0,opStep=0,mechStep=0;
const $=s=>document.querySelector(s);
function bands(n){return Array.from({length:n},(_,k)=>`<i class="band on" style="top:${n===4?22+k*18:12+k*10}%"></i>`).join('')}
function base(extra='',content=''){return `<div class="stage ${extra}" id="stage"><div class="grid"></div><div class="floor"></div><div class="press left"></div><div class="press right"></div><div class="coil ${extra==='loose'?'loose':''}" id="coil">${content}</div></div>`}
function pressGraphic(){return `<div class="stage press-demo" id="stage"><div class="grid"></div><div class="floor"></div><div class="press demo left"><span>PRESS<br>PLATE 1</span></div><div class="press demo right"><span>PRESS<br>PLATE 2</span></div><div class="press-arrows"><i>→</i><b>СЖАТИЕ</b><i>←</i></div><div class="coil demo" id="coil"></div><div class="press-caption" id="pressCaption">До прессования</div><div class="actions"><button id="pressDemoBtn" class="primary">▶ ПОКАЗАТЬ СЖАТИЕ</button></div></div>`}
function knbAssembly(){
 const angles=[-135,-45,45,135];
 return `<div class="knb-machine"><div class="knb-blue-frame"></div><div class="knb-plate"><div class="plate-seam s1"></div><div class="plate-seam s2"></div><div class="plate-slot"></div><div class="plate-hub"></div></div><div class="coil-face"><i></i></div>${angles.map((a,k)=>`<div class="knb-arm" style="--angle:${a}deg"><span class="knb-rail"></span><div class="knb-head"><i></i><b>KNB</b></div><em class="wire-ray"></em><strong class="head-ok">✓</strong></div>`).join('')}<div class="twist-core">✦</div></div>`
}
function headsGraphic(){return `<div class="stage heads-demo" id="stage"><div class="grid"></div>${knbAssembly()}<div class="head-caption" id="headCaption">4 головы в исходном положении</div><div class="actions"><button id="headsDemoBtn" class="primary">▶ ПОКАЗАТЬ РАБОТУ ГОЛОВ</button></div></div>`}
function cycleGraphic(){return `<div class="stage cycle-demo" id="stage"><div class="grid"></div><div id="cycleSide" class="cycle-layer cycle-side active"><div class="floor"></div><div class="cycle-press left"></div><div class="cycle-press right"></div><div class="cycle-coil"></div><div class="cycle-arrows">→ <b>ПРЕСС</b> ←</div></div><div id="cycleFront" class="cycle-layer cycle-front">${knbAssembly()}</div><div class="cycle-caption" id="cycleCaption">Готов к запуску</div><div class="cycle-steps"><i data-c="1">1</i><i data-c="2">2</i><i data-c="3">3</i><i data-c="4">4</i><i data-c="5">5</i><i data-c="6">6</i></div><div class="actions"><button id="runCycle" class="primary">▶ ЗАПУСТИТЬ ЦИКЛ</button></div></div>`}
function graphic(v){
 if(v==='loose')return base('loose')+'<div class="note">Большой рыхлый бунт</div>';
 if(v==='arrive')return base('')+'<div class="arrow">↓ БУНТ В РАБОЧЕЙ ЗОНЕ</div>';
 if(v==='press')return pressGraphic();
 if(v==='heads')return headsGraphic();
 if(v==='cycle')return cycleGraphic();
 if(v==='ties')return base('compressed',bands(8))+'<div class="note" id="tieInfo">Двойная: 4 + 4 = 8 вязок</div><div class="actions"><button id="four">4 ВЯЗКИ</button><button id="eight" class="primary">8 ВЯЗОК</button></div>';
 if(v==='fault')return base('compressed',bands(4).replace('class="band on"','class="band on weak"'))+'<div class="actions"><button id="faultBtn" class="danger">⚠ ПОКАЗАТЬ НЕИСПРАВНОСТЬ</button></div><div id="alarmBox"></div>';
 if(v==='operator')return `<div class="stage"><div class="grid"></div><div class="alarm">АВАРИЯ · ЦИКЛ ОСТАНОВЛЕН</div><div class="note" id="opText">1. Оператор увидел сообщение.</div><div class="actions"><button id="ack">✓ КВИТ.</button><button id="reset">↻ СБРОС</button><button id="call" class="danger">🔧 МЕХАНИК</button></div></div>`;
 if(v==='mechanic')return `<div class="stage"><div class="grid"></div><div class="steps"><div id="m1" class="active"><b>1</b>Смотрим HMI / PLC</div><div id="m2"><b>2</b>Проверяем датчик или механизм</div><div id="m3"><b>3</b>Устраняем причину и делаем контрольный цикл</div></div><div class="actions"><button id="mechNext" class="primary">ДАЛЬШЕ →</button></div></div>`;
 return `<div class="stage"><div class="ready">ГОТОВ К РАБОТЕ<small>Можно переходить в игру</small></div></div>`;
}
function render(){const s=slides[i];$('#title').textContent=s.t;$('#text').textContent=s.x;$('#count').textContent=`${i+1} / ${slides.length}`;$('#bar').style.width=`${(i+1)/slides.length*100}%`;$('#visual').innerHTML=graphic(s.v);$('#prev').disabled=i===0;$('#next').textContent=i===slides.length-1?'Начать игру →':'Далее →';bind(s.v)}
function resetHeadClasses(st){['heads-in','wire-feed','tension','twist','done'].forEach(c=>st.classList.remove(c))}
function setCycleStep(st,n){st.querySelectorAll('.cycle-steps i').forEach((x,k)=>x.classList.toggle('on',k<n))}
function bind(v){
 if(v==='press'){
   const st=$('#stage'),btn=$('#pressDemoBtn'),cap=$('#pressCaption');
   const demo=async()=>{if(!st||!document.body.contains(st))return;btn.disabled=true;st.classList.remove('squeezed');cap.textContent='До прессования';btn.textContent='ПЛИТЫ СХОДЯТСЯ…';await wait(250);st.classList.add('squeezed');cap.textContent='Осевая высота уменьшилась';await wait(850);btn.disabled=false;btn.textContent='↻ ПОВТОРИТЬ'};
   btn.onclick=demo;setTimeout(()=>{if(document.body.contains(st))demo()},300);
 }
 if(v==='heads'){
   const st=$('#stage'),btn=$('#headsDemoBtn'),cap=$('#headCaption');
   const demo=async()=>{if(!st||!document.body.contains(st))return;btn.disabled=true;resetHeadClasses(st);cap.textContent='4 головы в исходном положении';btn.textContent='ГОЛОВЫ ВХОДЯТ…';await wait(280);st.classList.add('heads-in');cap.textContent='Головы входят к зоне обвязки';await wait(650);st.classList.add('wire-feed');cap.textContent='Подача проволоки';await wait(650);st.classList.add('tension');cap.textContent='Натяжение проволоки';await wait(650);st.classList.add('twist');cap.textContent='Скрутка и резка';await wait(650);st.classList.add('done');cap.textContent='Один проход: 4 вязки готовы';await wait(500);btn.disabled=false;btn.textContent='↻ ПОВТОРИТЬ'};
   btn.onclick=demo;setTimeout(()=>{if(document.body.contains(st))demo()},350);
 }
 if(v==='cycle'){
   const st=$('#stage'),btn=$('#runCycle'),cap=$('#cycleCaption'),side=$('#cycleSide'),front=$('#cycleFront');
   const demo=async()=>{if(!st||!document.body.contains(st))return;btn.disabled=true;st.className='stage cycle-demo';resetHeadClasses(front);side.classList.add('active');front.classList.remove('active');setCycleStep(st,0);cap.textContent='Бунт в рабочей зоне';await wait(400);setCycleStep(st,1);st.classList.add('pressed');cap.textContent='Пресс-плиты сжимают бунт';await wait(850);setCycleStep(st,2);side.classList.remove('active');front.classList.add('active');await wait(300);front.classList.add('heads-in');cap.textContent='4 головы входят в рабочее положение';await wait(650);setCycleStep(st,3);front.classList.add('wire-feed');cap.textContent='Подача проволоки';await wait(620);setCycleStep(st,4);front.classList.add('tension');cap.textContent='Натяжение';await wait(580);setCycleStep(st,5);front.classList.add('twist');cap.textContent='Скрутка и резка';await wait(650);front.classList.add('done');setCycleStep(st,6);cap.textContent='4 вязки готовы · головы возвращаются';await wait(650);btn.disabled=false;btn.textContent='↻ ПОВТОРИТЬ ЦИКЛ'};
   btn.onclick=demo;
 }
 if(v==='ties'){const draw=n=>{$('#coil').innerHTML=bands(n);$('#tieInfo').textContent=n===4?'Одинарная: 1 × 4 = 4 вязки':'Двойная: 2 × 4 = 8 вязок';$('#four').classList.toggle('primary',n===4);$('#eight').classList.toggle('primary',n===8)};$('#four').onclick=()=>draw(4);$('#eight').onclick=()=>draw(8)}
 if(v==='fault'){$('#faultBtn').onclick=()=>{$('#alarmBox').innerHTML='<div class="alarm">⚠ НЕИСПРАВНОСТЬ · ЦИКЛ ОСТАНОВЛЕН</div>';$('#faultBtn').textContent='ОШИБКА ПОЯВИЛАСЬ'}}
 if(v==='operator'){opStep=0;const tx=$('#opText');$('#ack').onclick=()=>{opStep=1;tx.textContent='2. Квитирование подтверждает сообщение, но не чинит поломку.'};$('#reset').onclick=()=>{opStep=2;tx.textContent='3. После сброса ошибка вернулась — причина осталась.'};$('#call').onclick=()=>{opStep=3;tx.textContent='4. Вызываем механика.'}}
 if(v==='mechanic'){mechStep=1;$('#mechNext').onclick=()=>{mechStep=Math.min(3,mechStep+1);['#m1','#m2','#m3'].forEach((id,k)=>$(id).classList.toggle('active',k<mechStep));$('#mechNext').textContent=mechStep===3?'КОНТРОЛЬНЫЙ ЦИКЛ ✓':'ДАЛЬШЕ →'}}
}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
$('#prev').onclick=()=>{if(i>0){i--;render()}};
$('#next').onclick=()=>{if(i<slides.length-1){i++;render()}else location.href='./game.html#start'};
$('#back').onclick=()=>location.href='./';
render();
