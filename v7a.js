const $=id=>document.getElementById(id), wait=ms=>new Promise(r=>setTimeout(r,ms));
const heads=[1,2,3,4];
const lowSpeedTarget=220;
let settings={force:45,doublePrepress:true,tension:'LOW',mode:'REMOTE'};
let state=JSON.parse(localStorage.getItem('compactorTrainerV7')||'{"coils":0,"tiesCount":0,"faults":0,"score":0,"pressCycles":0,"headCycles":0,"health":{"head":100,"guide":100,"encoder":100,"io":100,"tension":100}}');
if(!state.health) state.health={head:100,guide:100,encoder:100,io:100,tension:100};
let role='operator',busy=false,soundOn=true,currentFault=null,alarmAck=false,called=false,currentPass=0,hmiPage='main',feedUnit=1,headUnit=1;
let pp={b53:true,b56:true,b58:false,b59:true,b64:true,b49:false,b52pos:0,b69pos:0,b51pos:0};
let enc=heads.map(()=>({pos:0,speed:0,moving:false}));
let hi=heads.map(()=>({B1:true,B2:false,B3:false,B5:false,B8:false,B30:false,B20:true,Y1:false,Y2:false,Y3A:false,Y3B:true,Y4A:false,Y4B:false,Y5:false,Y6:false,Y20A:false,Y20B:true,Y22A:false,Y22B:true,Y23A:false,Y23B:false}));
let ppOut={Y80:false,Y81:false,Y82:false,Y83:false,Y68:false,Y69:false,Y30:true};
const cycleNames=['Исходное','Подпрессовка фаза 1','Подпрессовка фаза 2','Направляющая вперёд','Проход 1: подача','Проход 1: натяжение','Проход 1: скрутка/резка','Переход 1→2','Проход 2: подача','Проход 2: натяжение','Проход 2: скрутка/резка','Возврат / исходное'];

const faults=[
 {id:'node26',code:'A401/N26',severity:'bad',sym:'После обвязки проволока остаётся без утяжки; следующая подача может уйти в направляющую пресс-плиты 2.',inspect:'node26',health:'io',node:'I/O Box -A401 / Node 26 ET200S',repair:'Перепроверить U010/U030, разъёмы ET200S и каналы Y68/Y69/1Y21–4Y21; восстановить стабильный контакт.'},
 {id:'b28',code:'B28 PULSE',severity:'bad',sym:'Импульсы одного канала перестали изменяться при подаче/натяжении; PLC теряет контроль длины и перехода скорости.',inspect:'encoder',health:'encoder',node:'B28 / импульсный кодировщик / муфта',repair:'Проверить B28, прижимное колесо, муфту кодировщика и оба канала импульсов; очистить от окалины и восстановить передачу.'},
 {id:'b24',code:'B24 WIRE',severity:'warn',sym:'Натяжение заканчивается преждевременно или повторная обвязка вытягивает проволоку слишком далеко.',inspect:'feeder',health:'tension',node:'B24 / детектор наличия проволоки',repair:'Проверить B24 с проволокой под колесом, очистить детекторное колесо и восстановить корректное переключение.'},
 {id:'guide',code:'WIRE GUIDE',severity:'bad',sym:'Проволока ударяется о кромку/люфт направляющей, загибается и образует петлю у пресс-плиты 2.',inspect:'guide',health:'guide',node:'Система направляющих / PP2',repair:'Удалить обрезки и окалину, проверить соосность переходов и свободное открытие/закрытие направляющих.'},
 {id:'clamp',code:'HEAD CLAMP',severity:'bad',sym:'Скрутка формируется, но после резки узел распускается или край проволоки выпадает.',inspect:'head',health:'head',node:'Неподвижный зажим KNB',repair:'Осмотреть и заменить повреждённый неподвижный зажим; проверить подвижный зажим и удержание края проволоки.'},
 {id:'b3',code:'B3 TWIST',severity:'bad',sym:'Скручивающий ролик не подтверждает завершение; возможны перекрут, обрыв или задержка цикла.',inspect:'head',health:'head',node:'B3 / скручивающий ролик',repair:'Проверить B3, очистить зону индексного колеса и шестерён, удалить обломки проволоки, проверить реверс скрутчика.'},
 {id:'slip',code:'TENSION SLIP',severity:'warn',sym:'Все головы завершают цикл, но петли неплотные; импульсы есть, фактическая утяжка слабая.',inspect:'tension',health:'tension',node:'Подающее колесо / прижимные ролики',repair:'Очистить пазы подающего колеса, убрать избыток масла/смазки, проверить износ пазов и усилие Y22 прижимных роликов.'},
 {id:'b2',code:'B2 FEED',severity:'bad',sym:'Подача прекращается до входа проволоки в скручивающую головку.',inspect:'head',health:'head',node:'B2 / детекция повторного входа',repair:'Проверить B2 и люфт 2–3 мм, затем проверить стоп-параметр 425 имп. и низкую скорость подачи.'}
];

function save(){localStorage.setItem('compactorTrainerV7',JSON.stringify(state))}
function log(t,type='info'){const e=document.createElement('div');e.className='log-entry '+type;e.textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+' · '+t;$('log').prepend(e)}
function renderStats(){$('coils').textContent=state.coils;$('tiesCount').textContent=state.tiesCount;$('faults').textContent=state.faults;$('score').textContent=state.score;$('headHealth').textContent=state.health.head+'%';$('guideHealth').textContent=state.health.guide+'%';$('encoderHealth').textContent=state.health.encoder+'%';$('ioHealth').textContent=state.health.io+'%';$('tensionHealth').textContent=state.health.tension+'%';$('cntCoils').textContent=state.coils;$('cntHeads').textContent=state.headCycles;$('cntPress').textContent=state.pressCycles}
function beep(f=480,d=70){if(!soundOn)return;const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const c=new A(),o=c.createOscillator(),g=c.createGain();o.frequency.value=f;o.connect(g);g.connect(c.destination);g.gain.value=.02;o.start();o.stop(c.currentTime+d/1000)}
function pill(id,t,type=''){$(id).textContent=t;$(id).className='pill '+type}
function machineState(t,type='ok'){$('machineState').textContent=t;$('machineState').className='pill '+type;$('hmiCycle').textContent=t}
function switchView(v){['operator','mechanic','hmi'].forEach(x=>{$(x+'View').classList.toggle('hidden',x!==v);$(x+'Tab').classList.toggle('active',x===v)})}
function setRole(r){role=r;$('roleGate').classList.add('hidden');$('roleBadge').textContent=r==='operator'?'ОПЕРАТОР':'МЕХАНИК';switchView(r);log(r==='operator'?'Машина передана оператору.':'Машина передана механику.','info')}
function setPage(p){hmiPage=p;document.querySelectorAll('#hmiTabs button').forEach(b=>b.classList.toggle('active',b.dataset.page===p));document.querySelectorAll('.hmi-page').forEach(x=>x.classList.add('hidden'));$('page-'+p).classList.remove('hidden');renderHmi()}
function showHmi(p='main'){switchView('hmi');setPage(p)}
function setPair(a,b,aOn){$(a).classList.toggle('active',aOn);$(b).classList.toggle('active',!aOn)}
function lampClass(on,bad=false){return bad?'lamp-dot bad-lamp':on?'lamp-dot on':'lamp-dot'}
function setHeadVisual(n,cls=''){const e=document.querySelector(`[data-head="${n}"]`);e.className=cls}
function step(i,status='active'){document.querySelectorAll('.step').forEach((e,j)=>e.className='step '+(j<i?'done':j===i?status:''));renderPrepressFlow(i)}
function buildStatic(){
 $('sensorStrip').innerHTML=['B53 PP1 HOME','B56 PP2 HOME','B58 COIL EDGE','B59 LIFT TABLE','B64 GUIDE HOME','B49 GUIDE CLOSED'].map(x=>`<div class="sensor" data-sensor="${x.split(' ')[0]}"><span>${x}</span><i class="lamp-dot"></i></div>`).join('');
 $('cycleSteps').innerHTML=cycleNames.map((n,i)=>`<div class="step">${i+1}. ${n}</div>`).join('');
 $('prepressFlow').innerHTML=['Исходное','Y80–Y83 вперёд','B58 → стол вверх','Предварительное усилие','>30 т: Y81/Y83 OFF','Двойная: −100 мм','Повторное сжатие','Гидроблокировка'].map((x,i)=>`<div class="flow-step" data-flow="${i}">${i+1}. ${x}</div>`).join('');
 buildPlc();buildStatus();buildNode26();buildUnits();buildInspection();renderHmi();
}
function buildPlc(){
 const inputs=[['B2','Повторный вход проволоки'],['B24','Наличие проволоки'],['B20','Головка в исходном'],['B5','Скруч. головка внутри'],['B1','Скруч. головка снаружи'],['B3','Скрутка окончена'],['B8','Датчик B8'],['B30','B30 (профиль HMI машины)']];
 const outputs=[['Y20A','Головка к бунту'],['Y20B','Головка от бунта'],['Y3A','Скруч. головка внутрь'],['Y3B','Скруч. головка наружу'],['Y4A','Скрутка'],['Y4B','Сброс/реверс скрутки'],['Y5','Обрезка'],['Y1','Зажим ВКЛ'],['Y2','Зажим ОТКЛ'],['Y6','Обдув/смазка'],['Y22A','Прижимные ролики ВКЛ'],['Y22B','Прижимные ролики ОТКЛ'],['Y23A','Подача'],['Y23B','Натяжение']];
 const table=(rows,kind)=>`<table class="plc-table"><tr><th>${kind==='in'?'Вход':'Выход'}</th>${heads.map(n=>`<th>U${n}</th>`).join('')}</tr>${rows.map(([id,name])=>`<tr><td>${id} ${name}</td>${heads.map(n=>`<td><i class="mini-lamp" data-${kind}="${id}" data-unit="${n}"></i></td>`).join('')}</tr>`).join('')}</table>`;
 $('plcInputs').innerHTML=table(inputs,'in');$('plcOutputs').innerHTML=table(outputs,'out');$('encoderGrid').innerHTML=heads.map(n=>`<div class="encoder-unit"><b>U${n}</b><strong id="encPos${n}">0</strong><small>скорость <span id="encSpeed${n}">0</span></small></div>`).join('');
}
function buildStatus(){const items=[['B53','PP1 в исходном'],['B56','PP2 в исходном'],['B58','Край бунта'],['B59','Подъёмный стол внизу'],['B64','Каретка направляющей в исходном'],['B49','Направляющие сомкнуты']];$('machineStatusGrid').innerHTML=items.map(([id,n])=>`<div class="io-bit"><span>${id} ${n}</span><i data-status="${id}" class="lamp-dot"></i></div>`).join('')}
function buildNode26(){const rows=[['U010:01','B56','Pressplate 2 in initial position'],['U010:01','B58','Pressplate 2 coil edge indication'],['U010:01','B64','Guide carriage in initial position'],['U010:02','B52','Pressplate 2 position'],['U010:03','B69','Guide carriage position'],['U030:01','1Y21','Guide flap head 1'],['U030:01','2Y21','Guide flap head 2'],['U030:01','3Y21','Guide flap head 3'],['U030:01','4Y21','Guide flap head 4'],['U030:02','Y68','Guide carriage forward/backward'],['U030:02','Y69','Guide carriage pressure']];$('node26Grid').innerHTML=rows.map(([m,id,n])=>`<div class="node-row" data-node="${id}"><span><b>${m}</b><br>${id} · ${n}</span><i class="lamp-dot"></i></div>`).join('')}
function buildUnits(){$('feederUnitSelect').innerHTML=heads.map(n=>`<button data-feedunit="${n}" class="${n===1?'active':''}">${n}</button>`).join('');$('headUnitSelect').innerHTML=heads.map(n=>`<button data-headunit="${n}" class="${n===1?'active':''}">${n}</button>`).join('')}
function buildInspection(){const opts=[['node26','A401 / Node 26'],['encoder','B28 / кодировщик / муфта'],['feeder','B24 / трайбаппарат'],['guide','Направляющая PP2'],['head','Вязальная головка KNB'],['tension','Подающее колесо / натяжение']];$('inspectionGrid').innerHTML='';opts.forEach(([id,n])=>{const b=document.createElement('button');b.textContent='Проверить: '+n;b.onclick=()=>inspect(id,b);$('inspectionGrid').appendChild(b)});$('repairPanel').classList.add('hidden')}
