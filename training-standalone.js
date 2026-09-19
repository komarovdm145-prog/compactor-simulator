const slides=[
{t:'Что делает компактор?',x:'С линии приходит большой рыхлый бунт катанки. Компактор нужен, чтобы сжать его и закрепить металлической проволокой.',v:'loose'},
{t:'Бунт заходит в компактор',x:'Бунт оказывается между двумя пресс-плитами. До прессования его размеры такие же, как на предыдущем шаге.',v:'arrive'},
{t:'Компактор прессует бунт',x:'Две пресс-плиты сходятся слева и справа. Наружный диаметр бунта остаётся тем же — уменьшается только его осевая высота между плитами.',v:'press'},
{t:'Четыре головы делают вязки',x:'Каждая голова подаёт проволоку вокруг бунта, натягивает её, делает скрутку и отрезает. После этого бунт держит форму.',v:'bound'},
{t:'Попробуй полный цикл',x:'Нажми «Запустить». Сначала плиты сожмут бунт, затем четыре головы выполнят обвязку.',v:'cycle'},
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
function graphic(v){
 if(v==='loose')return base('loose')+'<div class="note">Большой рыхлый бунт</div>';
 if(v==='arrive')return base('')+'<div class="arrow">↓ БУНТ В РАБОЧЕЙ ЗОНЕ</div>';
 if(v==='press')return pressGraphic();
 if(v==='bound')return base('compressed',bands(4))+'<div class="heads"><b>1</b><b>2</b><b>3</b><b>4</b></div><div class="note">Сжат и обвязан</div>';
 if(v==='cycle')return base('',bands(4))+'<div class="status" id="status">Готов к запуску</div><div class="actions"><button id="runCycle" class="primary">▶ ЗАПУСТИТЬ</button></div>';
 if(v==='ties')return base('compressed',bands(8))+'<div class="note" id="tieInfo">Двойная: 4 + 4 = 8 вязок</div><div class="actions"><button id="four">4 ВЯЗКИ</button><button id="eight" class="primary">8 ВЯЗОК</button></div>';
 if(v==='fault')return base('compressed',bands(4).replace('class="band on"','class="band on weak"'))+'<div class="actions"><button id="faultBtn" class="danger">⚠ ПОКАЗАТЬ НЕИСПРАВНОСТЬ</button></div><div id="alarmBox"></div>';
 if(v==='operator')return `<div class="stage"><div class="grid"></div><div class="alarm">АВАРИЯ · ЦИКЛ ОСТАНОВЛЕН</div><div class="note" id="opText">1. Оператор увидел сообщение.</div><div class="actions"><button id="ack">✓ КВИТ.</button><button id="reset">↻ СБРОС</button><button id="call" class="danger">🔧 МЕХАНИК</button></div></div>`;
 if(v==='mechanic')return `<div class="stage"><div class="grid"></div><div class="steps"><div id="m1" class="active"><b>1</b>Смотрим HMI / PLC</div><div id="m2"><b>2</b>Проверяем датчик или механизм</div><div id="m3"><b>3</b>Устраняем причину и делаем контрольный цикл</div></div><div class="actions"><button id="mechNext" class="primary">ДАЛЬШЕ →</button></div></div>`;
 return `<div class="stage"><div class="ready">ГОТОВ К РАБОТЕ<small>Можно переходить в игру</small></div></div>`;
}
function render(){const s=slides[i];$('#title').textContent=s.t;$('#text').textContent=s.x;$('#count').textContent=`${i+1} / ${slides.length}`;$('#bar').style.width=`${(i+1)/slides.length*100}%`;$('#visual').innerHTML=graphic(s.v);$('#prev').disabled=i===0;$('#next').textContent=i===slides.length-1?'Начать игру →':'Далее →';bind(s.v)}
function bind(v){
 if(v==='press'){
   const st=$('#stage'),btn=$('#pressDemoBtn'),cap=$('#pressCaption');
   const demo=async()=>{if(!st||!document.body.contains(st))return;btn.disabled=true;st.classList.remove('squeezed');cap.textContent='До прессования';btn.textContent='ПЛИТЫ СХОДЯТСЯ…';await wait(250);st.classList.add('squeezed');cap.textContent='Осевая высота уменьшилась';await wait(850);btn.disabled=false;btn.textContent='↻ ПОВТОРИТЬ'};
   btn.onclick=demo;
   setTimeout(()=>{if(document.body.contains(st))demo()},300);
 }
 if(v==='cycle'){$('#runCycle').onclick=async()=>{const st=$('#stage'),tx=$('#status'),b=$('#runCycle');b.disabled=true;tx.textContent='Бунт в рабочей зоне';await wait(450);tx.textContent='Сжатие';st.classList.add('compressed');await wait(900);tx.textContent='Обвязка четырьмя головами';[...st.querySelectorAll('.band')].forEach((x,k)=>setTimeout(()=>x.style.opacity='1',k*160));await wait(1000);tx.textContent='Готовый бунт';b.disabled=false}}
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
