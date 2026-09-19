const slides=[
{t:'Что делает компактор?',x:'С линии приходит большой рыхлый бунт катанки. Компактор нужен, чтобы сжать его и закрепить металлической проволокой.',v:'loose'},
{t:'Бунт заходит в компактор',x:'Бунт оказывается между двумя пресс-плитами. До прессования его размеры такие же, как на предыдущем шаге.',v:'arrive'},
{t:'Компактор прессует бунт',x:'Две пресс-плиты сходятся слева и справа. Наружный диаметр бунта остаётся тем же — уменьшается только его осевая высота между плитами.',v:'press'},
{t:'Четыре вязальные головы KNB',x:'Четыре головы расположены вокруг торца бунта на диагональных направляющих. Они входят в рабочее положение, подают проволоку, натягивают её, делают скрутку и отрезают.',v:'heads'},
{t:'Попробуй полный цикл',x:'Нажми «Запустить цикл». Сначала компактор сожмёт бунт, затем четыре головы войдут в рабочее положение и выполнят один проход обвязки.',v:'cycle'},
{t:'Одинарная и двойная обвязка',x:'Одинарная — один проход четырёх голов: 4 вязки. Двойная — два последовательных прохода тех же четырёх голов: 4 + 4 = 8 вязок.',v:'ties'},
{t:'Что происходит при неисправности',x:'Неисправность сначала проявляется как симптом. В этом учебном примере на голове 3 проволока есть, но при натяжении пропадают импульсы B28 — PLC останавливает цикл.',v:'fault'},
{t:'Что делает оператор',x:'Оператор квитирует сообщение и пробует сброс. Если причина не исчезла и ошибка возвращается, оператор не ремонтирует машину — он вызывает механика.',v:'operator'},
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
 return `<div class="knb-machine"><div class="knb-blue-frame"></div><div class="knb-plate"><div class="plate-seam s1"></div><div class="plate-seam s2"></div><div class="plate-slot"></div><div class="plate-hub"></div></div><div class="coil-face"><i></i></div>${angles.map((a,k)=>`<div class="knb-arm" data-head="${k+1}" style="--angle:${a}deg"><span class="knb-rail"></span><div class="knb-head"><i></i><b>KNB</b></div><em class="wire-ray"></em><strong class="head-ok">✓</strong></div>`).join('')}<div class="twist-core">✦</div></div>`
}
function headsGraphic(){return `<div class="stage heads-demo" id="stage"><div class="grid"></div>${knbAssembly()}<div class="head-caption" id="headCaption">4 головы в исходном положении</div><div class="actions"><button id="headsDemoBtn" class="primary">▶ ПОКАЗАТЬ РАБОТУ ГОЛОВ</button></div></div>`}
function cycleGraphic(){return `<div class="stage cycle-demo" id="stage"><div class="grid"></div><div id="cycleSide" class="cycle-layer cycle-side active"><div class="floor"></div><div class="cycle-press left"></div><div class="cycle-press right"></div><div class="cycle-coil"></div><div class="cycle-arrows">→ <b>ПРЕСС</b> ←</div></div><div id="cycleFront" class="cycle-layer cycle-front">${knbAssembly()}</div><div class="cycle-caption" id="cycleCaption">Готов к запуску</div><div class="cycle-steps"><i data-c="1">1</i><i data-c="2">2</i><i data-c="3">3</i><i data-c="4">4</i><i data-c="5">5</i><i data-c="6">6</i></div><div class="actions"><button id="runCycle" class="primary">▶ ЗАПУСТИТЬ ЦИКЛ</button></div></div>`}
function tiesGraphic(){return `<div class="stage ties-demo" id="stage"><div class="grid"></div>${knbAssembly()}<div class="training-panel"><div><strong id="tieModeText">Выбери режим</strong><br><span id="tieState">Головы готовы</span></div><div class="pass-badges"><i id="pass1">1</i><i id="pass2">2</i></div><div><b id="tieTotal">0</b><br>вязок</div></div><div class="actions"><button id="four">4 ВЯЗКИ</button><button id="eight" class="primary">8 ВЯЗОК</button></div></div>`}
function faultGraphic(){return `<div class="stage fault-demo" id="stage"><div class="grid"></div>${knbAssembly()}<div class="fault-label">Учебный пример<br><b>ГОЛОВА 3 · НАТЯЖЕНИЕ</b></div><div class="hmi-mini"><div class="hmi-title">KNB HEAD 3 · STATUS</div><div class="hmi-row"><span>B24 WIRE</span><b id="fB24" class="on">ON</b></div><div class="hmi-row"><span>B28 PULSES</span><b id="fB28" class="on">184</b></div><div class="hmi-row"><span>TENSION</span><b id="fTension" class="hold">WAIT</b></div></div><div class="fault-stop">ЦИКЛ ОСТАНОВЛЕН · НАТЯЖЕНИЕ НЕ ПОДТВЕРЖДЕНО</div><div class="actions"><button id="faultBtn" class="danger">▶ ПРОИГРАТЬ НЕИСПРАВНОСТЬ</button></div></div>`}
function operatorGraphic(){return `<div class="stage operator-demo" id="stage"><div class="operator-screen"><div class="op-head"><span>COMPactor · OPERATOR HMI</span><span id="opState">ALARM</span></div><div class="op-alarm" id="opAlarm">ГОЛОВА 3 · НАТЯЖЕНИЕ НЕ ПОДТВЕРЖДЕНО</div><div class="op-data"><div class="good">B24 · ПРОВОЛОКА<b>ON</b></div><div class="bad">B28 · ИМПУЛЬСЫ<b id="opPulse">0</b></div></div><div class="op-tip" id="opText">1. Сначала оператор подтверждает, что увидел сообщение: нажми «КВИТ.»</div></div><div class="op-step-dots"><i id="od1" class="on"></i><i id="od2"></i><i id="od3"></i><i id="od4"></i></div><div class="actions"><button id="ack" class="primary">✓ КВИТ.</button><button id="reset" disabled>↻ СБРОС</button><button id="call" class="call-mech" disabled>🔧 МЕХАНИК</button></div></div>`}
function graphic(v){
 if(v==='loose')return base('loose')+'<div class="note">Большой рыхлый бунт</div>';
 if(v==='arrive')return base('')+'<div class="arrow">↓ БУНТ В РАБОЧЕЙ ЗОНЕ</div>';
 if(v==='press')return pressGraphic();
 if(v==='heads')return headsGraphic();
 if(v==='cycle')return cycleGraphic();
 if(v==='ties')return tiesGraphic();
 if(v==='fault')return faultGraphic();
 if(v==='operator')return operatorGraphic();
 if(v==='mechanic')return `<div class="stage"><div class="grid"></div><div class="steps"><div id="m1" class="active"><b>1</b>Смотрим HMI / PLC</div><div id="m2"><b>2</b>Проверяем датчик или механизм</div><div id="m3"><b>3</b>Устраняем причину и делаем контрольный цикл</div></div><div class="actions"><button id="mechNext" class="primary">ДАЛЬШЕ →</button></div></div>`;
 return `<div class="stage"><div class="ready">ГОТОВ К РАБОТЕ<small>Можно переходить в игру</small></div></div>`;
}
function render(){const s=slides[i];$('#title').textContent=s.t;$('#text').textContent=s.x;$('#count').textContent=`${i+1} / ${slides.length}`;$('#bar').style.width=`${(i+1)/slides.length*100}%`;$('#visual').innerHTML=graphic(s.v);$('#prev').disabled=i===0;$('#next').textContent=i===slides.length-1?'Начать игру →':'Далее →';bind(s.v)}
function resetHeadClasses(st){['heads-in','wire-feed','tension','twist','done','fault3'].forEach(c=>st.classList.remove(c))}
function setCycleStep(st,n){st.querySelectorAll('.cycle-steps i').forEach((x,k)=>x.classList.toggle('on',k<n))}
async function runHeadPass(st,cap,label){
 resetHeadClasses(st);cap.textContent=label||'Головы входят в рабочее положение';st.classList.add('heads-in');await wait(520);st.classList.add('wire-feed');cap.textContent='Подача проволоки';await wait(520);st.classList.add('tension');cap.textContent='Натяжение';await wait(500);st.classList.add('twist');cap.textContent='Скрутка и резка';await wait(520);st.classList.add('done');cap.textContent='4 вязки готовы';await wait(520);cap.textContent='Головы возвращаются в исходное положение';st.classList.remove('done','twist','tension','wire-feed','heads-in');await wait(620);cap.textContent='Головы в исходном положении';
}
function bind(v){
 if(v==='press'){
   const st=$('#stage'),btn=$('#pressDemoBtn'),cap=$('#pressCaption');
   const demo=async()=>{if(!st||!document.body.contains(st))return;btn.disabled=true;st.classList.remove('squeezed');cap.textContent='До прессования';btn.textContent='ПЛИТЫ СХОДЯТСЯ…';await wait(250);st.classList.add('squeezed');cap.textContent='Осевая высота уменьшилась';await wait(850);btn.disabled=false;btn.textContent='↻ ПОВТОРИТЬ'};
   btn.onclick=demo;setTimeout(()=>{if(document.body.contains(st))demo()},300);
 }
 if(v==='heads'){
   const st=$('#stage'),btn=$('#headsDemoBtn'),cap=$('#headCaption');
   const demo=async()=>{if(!st||!document.body.contains(st))return;btn.disabled=true;btn.textContent='ЦИКЛ ГОЛОВ…';await runHeadPass(st,cap,'4 головы входят к зоне обвязки');btn.disabled=false;btn.textContent='↻ ПОВТОРИТЬ'};
   btn.onclick=demo;setTimeout(()=>{if(document.body.contains(st))demo()},350);
 }
 if(v==='cycle'){
   const st=$('#stage'),btn=$('#runCycle'),cap=$('#cycleCaption'),side=$('#cycleSide'),front=$('#cycleFront');
   const demo=async()=>{if(!st||!document.body.contains(st))return;btn.disabled=true;st.className='stage cycle-demo';resetHeadClasses(front);side.classList.add('active');front.classList.remove('active');setCycleStep(st,0);cap.textContent='Бунт в рабочей зоне';await wait(400);setCycleStep(st,1);st.classList.add('pressed');cap.textContent='Пресс-плиты сжимают бунт';await wait(850);setCycleStep(st,2);side.classList.remove('active');front.classList.add('active');await wait(260);front.classList.add('heads-in');cap.textContent='4 головы входят в рабочее положение';await wait(520);setCycleStep(st,3);front.classList.add('wire-feed');cap.textContent='Подача проволоки';await wait(500);setCycleStep(st,4);front.classList.add('tension');cap.textContent='Натяжение';await wait(480);setCycleStep(st,5);front.classList.add('twist');cap.textContent='Скрутка и резка';await wait(520);front.classList.add('done');setCycleStep(st,6);cap.textContent='4 вязки готовы';await wait(500);cap.textContent='Головы возвращаются в исходное положение';front.classList.remove('done','twist','tension','wire-feed','heads-in');await wait(650);cap.textContent='Цикл завершён · головы в исходном положении';btn.disabled=false;btn.textContent='↻ ПОВТОРИТЬ ЦИКЛ'};
   btn.onclick=demo;
 }
 if(v==='ties'){
   const st=$('#stage'),four=$('#four'),eight=$('#eight'),state=$('#tieState'),mode=$('#tieModeText'),total=$('#tieTotal'),p1=$('#pass1'),p2=$('#pass2');
   const run=async passes=>{if(st.classList.contains('running'))return;st.classList.add('running');four.disabled=true;eight.disabled=true;four.classList.toggle('selected',passes===1);eight.classList.toggle('selected',passes===2);mode.textContent=passes===1?'ОДИНАРНАЯ · 1 ПРОХОД':'ДВОЙНАЯ · 2 ПРОХОДА';total.textContent='0';p1.classList.remove('on');p2.classList.remove('on');for(let n=1;n<=passes;n++){state.textContent=`Проход ${n}: головы входят`;st.classList.add('heads-in');await wait(430);st.classList.add('wire-feed');state.textContent=`Проход ${n}: подача проволоки`;await wait(420);st.classList.add('tension');state.textContent=`Проход ${n}: натяжение`;await wait(400);st.classList.add('twist');state.textContent=`Проход ${n}: скрутка и резка`;await wait(430);st.classList.add('done');state.textContent=`Проход ${n}: 4 вязки готовы`;total.textContent=String(n*4);(n===1?p1:p2).classList.add('on');await wait(430);state.textContent=`Проход ${n}: головы возвращаются`;st.classList.remove('done','twist','tension','wire-feed','heads-in');await wait(520)}state.textContent=passes===1?'Готово: 4 вязки':'Готово: 8 вязок (4 + 4)';st.classList.remove('running');four.disabled=false;eight.disabled=false};
   four.onclick=()=>run(1);eight.onclick=()=>run(2);
 }
 if(v==='fault'){
   const st=$('#stage'),btn=$('#faultBtn'),b28=$('#fB28'),tension=$('#fTension');
   const demo=async()=>{btn.disabled=true;resetHeadClasses(st);b28.textContent='184';b28.className='on';tension.textContent='WAIT';tension.className='hold';st.classList.add('heads-in');await wait(500);st.classList.add('wire-feed');await wait(520);st.classList.add('tension');tension.textContent='ACTIVE';await wait(420);b28.textContent='0';b28.className='off';tension.textContent='NOT CONF.';tension.className='off';st.classList.add('fault3');await wait(800);btn.disabled=false;btn.textContent='↻ ПОВТОРИТЬ НЕИСПРАВНОСТЬ'};
   btn.onclick=demo;setTimeout(()=>{if(document.body.contains(st))demo()},400);
 }
 if(v==='operator'){
   opStep=0;const ack=$('#ack'),reset=$('#reset'),call=$('#call'),tx=$('#opText'),state=$('#opState'),alarm=$('#opAlarm'),pulse=$('#opPulse');
   const dots=n=>['#od1','#od2','#od3','#od4'].forEach((id,k)=>$(id).classList.toggle('on',k<n));
   ack.onclick=()=>{if(opStep!==0)return;opStep=1;state.textContent='ACK';tx.textContent='2. Сообщение квитировано. Квитирование только подтверждает, что оператор его увидел. Теперь попробуй «СБРОС».';ack.disabled=true;reset.disabled=false;dots(2)};
   reset.onclick=async()=>{if(opStep!==1)return;opStep=2;reset.disabled=true;state.textContent='RESET';alarm.textContent='ПОПЫТКА СБРОСА...';tx.textContent='PLC пробует продолжить цикл.';pulse.textContent='0';await wait(800);alarm.textContent='ГОЛОВА 3 · НАТЯЖЕНИЕ НЕ ПОДТВЕРЖДЕНО';state.textContent='ALARM';tx.textContent='3. Ошибка вернулась: причина осталась. Повторными сбросами поломку не исправить — вызываем механика.';call.disabled=false;dots(3)};
   call.onclick=()=>{if(opStep!==2)return;opStep=3;call.disabled=true;state.textContent='SERVICE';tx.textContent='4. Механик вызван. Дальше он будет искать причину по HMI, PLC, датчикам и механике.';dots(4)};
 }
 if(v==='mechanic'){mechStep=1;$('#mechNext').onclick=()=>{mechStep=Math.min(3,mechStep+1);['#m1','#m2','#m3'].forEach((id,k)=>$(id).classList.toggle('active',k<mechStep));$('#mechNext').textContent=mechStep===3?'КОНТРОЛЬНЫЙ ЦИКЛ ✓':'ДАЛЬШЕ →'}}
}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
$('#prev').onclick=()=>{if(i>0){i--;render()}};
$('#next').onclick=()=>{if(i<slides.length-1){i++;render()}else location.href='./game.html#start'};
$('#back').onclick=()=>location.href='./';
render();
