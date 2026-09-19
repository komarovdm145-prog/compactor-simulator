// v8.6.8 — realistic I/O + alarm history + operator/mechanic workflow
(function(){
  if(typeof slides==='undefined'||typeof graphic!=='function'||typeof bind!=='function')return;

  slides.splice(6,slides.length-6,
    {t:'Если что-то работает не так',x:'У компактора много датчиков, положений и клапанов. Поэтому при остановке сначала смотрят HMI: страница I/O показывает, какой вход B сейчас видит PLC и какой выход Y он включает. Это помогает понять, на каком шаге остановился механизм.',v:'io'},
    {t:'Журнал аварий',x:'Отдельный экран хранит актуальные аварии и историю событий. Там видно номер сообщения, время, дату и текст. Оператор может квитировать сообщение и выполнить сброс, но если причина осталась, авария появится снова.',v:'alarms'},
    {t:'Что делает оператор',x:'Оператор не угадывает поломку. Он читает текст аварии, смотрит нужную страницу I/O, квитирует сообщение, пробует сброс и проверяет, вернулась ли ошибка. Если неисправность остаётся — вызывает механика.',v:'operator2'},
    {t:'Что делает механик',x:'Механик связывает текст аварии с I/O и реальным узлом. Например: «голова 3 — нет импульсов энкодера» → смотрим U3 → проверяем B28, кодировщик, муфту и проводку. После ремонта обязательно выполняется контрольный цикл.',v:'mechanic2'},
    {t:'Теперь картина целиком',x:'Бунт пришёл → подъёмный стол выставил его → пресс-плиты сжали → KNB-головы обвязали → PLC контролировал датчики и клапаны → при отклонении HMI показал аварию → оператор и механик действуют по информации, а не наугад.',v:'ready2'}
  );

  const oldGraphic=graphic, oldBind=bind;
  const alarmHistory=[
    ['103','12:17:27','01.02.2023','Гидравлика. Низкий уровень масла.'],
    ['52','09:37:51','01.02.2023','Вязальная головка 3 отсутствуют импульсы с энкодера'],
    ['52','08:40:53','01.02.2023','Вязальная головка 3 отсутствуют импульсы с энкодера'],
    ['34','07:26:46','01.02.2023','Вязальная головка 2 тайм-аут ввода скручивающего устройства'],
    ['34','07:22:29','01.02.2023','Вязальная головка 2 тайм-аут ввода скручивающего устройства'],
    ['7','20:30:37','31.01.2023','Пресс-плита 2 застревание бунта.'],
    ['19','15:28:20','31.01.2023','Вязальная головка 1 тайм-аут вывода головки'],
    ['20','10:24:08','31.01.2023','Вязальная головка 1 отсутствуют импульсы с энкодера']
  ];
  let op2Step=1,mech2Step=1;

  function ioLamp(on){return `<i class="io-lamp ${on?'on':''}"></i>`}
  function ioRows(){
    const ins=[['B2','Подача пров.'],['B24','Наличие проволоки'],['B20','Вязальная головка выведена'],['B5','Скруч. устройство выведено'],['B1','Скруч. устройство введено'],['B3','Скрутка завершена'],['B30','Проволочный магазин']];
    const outs=[['Y20A','Головка выведена'],['Y20B','Головка введена'],['Y3B','Скруч. устройство выведено'],['Y3A','Скруч. устройство введено'],['Y4B','Скрутка'],['Y4A','Сброс скрутки'],['Y1','Зажим позиции подачи'],['Y2','Зажатие'],['Y22A','Прижимной ролик выкл.'],['Y22B','Прижимной ролик вкл.'],['Y30','Тормоз проволоки']];
    const vals=(r,side)=>[1,2,3,4].map(()=>ioLamp(side==='in'?(r[0]==='B1'?false:r[0]==='B30'?false:true):(r[0]==='Y20A'||r[0]==='Y3B'||r[0]==='Y4A'||r[0]==='Y1'||r[0]==='Y22B'))).join('');
    return `<div class="io-col"><div class="io-title">Входа</div>${ins.map(r=>`<div class="io-row"><b>${r[0]}</b><span>${vals(r,'in')}</span><em>${r[1]}</em></div>`).join('')}<div class="pos-block"><b>Позиция проволоки</b><span>U1&nbsp;-188</span><span>U2&nbsp;-167</span><span>U3&nbsp;-229</span><span>U4&nbsp;-96</span></div></div><div class="io-col"><div class="io-title">Выхода</div>${outs.map(r=>`<div class="io-row"><b>${r[0]}</b><span>${vals(r,'out')}</span><em>${r[1]}</em></div>`).join('')}</div>`
  }
  function ioGraphic(){return `<div class="stage io-demo" id="stage"><div class="hmi-replica"><div class="hmi-replica-top"><span>ВОЗДУХ OK</span><b>SUND / BIRSTA</b><small>СТАТУС I/O</small></div><div class="u-head"><span></span><b>U1</b><b>U2</b><b>U3</b><b>U4</b></div><div class="io-columns">${ioRows()}</div><div class="io-help" id="ioHelp">Зелёная лампа = сигнал сейчас активен. Нажми U3, чтобы разобрать пример головы 3.</div><div class="io-actions"><button data-u="1">U1 / R1</button><button data-u="2">U2 / R2</button><button data-u="3" class="primary">U3 / R3</button><button data-u="4">U4 / R4</button></div></div></div>`}
  function alarmRows(mode){const a=mode==='active'?alarmHistory.slice(0,2):alarmHistory;return a.map((r,k)=>`<div class="alarm-row ${mode==='active'&&k===0?'selected':''}"><b>${r[0]}</b><span>${r[1]}</span><span>${r[2]}</span><em>${r[3]}</em></div>`).join('')}
  function alarmsGraphic(){return `<div class="stage alarms-demo" id="stage"><div class="alarm-screen"><div class="alarm-columns"><b>№</b><b>Время</b><b>Дата</b><b>Текст</b></div><div id="alarmList">${alarmRows('active')}</div><div class="alarm-explain" id="alarmExplain">Актуальные — то, что требует внимания сейчас. История — что происходило раньше.</div><div class="alarm-actions"><button id="activeAlarms" class="selected">АКТУАЛЬНЫЕ</button><button id="historyAlarms">ИСТОРИЯ</button><button id="alarmAck">✓ КВИТ.</button><button id="alarmReset" class="danger">↻ СБРОС</button></div></div></div>`}
  function operatorGraphic2(){return `<div class="stage operator-demo" id="stage"><div class="operator-path"><div id="op21" class="active"><b>1</b><span>Читаем аварию</span><small>52 · Голова 3 · нет импульсов энкодера</small></div><div id="op22"><b>2</b><span>Открываем I/O</span><small>U3 / R3 · что видит PLC</small></div><div id="op23"><b>3</b><span>Квитируем и сбрасываем</span><small>если причина исчезла — цикл продолжится</small></div><div id="op24"><b>4</b><span>Ошибка вернулась</span><small>вызываем механика</small></div></div><div class="operator-mini-status"><span>B24 проволока <b class="ok">ON</b></span><span>B28 импульсы <b class="bad">0</b></span></div><div class="actions"><button id="operatorNext2" class="primary">ДАЛЬШЕ →</button></div></div>`}
  function mechanicGraphic2(){return `<div class="stage mechanic-real" id="stage"><div class="mech-case"><div class="case-head"><span>ПРИМЕР ДИАГНОСТИКИ</span><b>ALARM 52 · R3 / HEAD 3</b></div><div class="case-chain"><div id="mm1" class="active"><b>1</b><span>Текст аварии</span><small>«отсутствуют импульсы с энкодера»</small></div><i>→</i><div id="mm2"><b>2</b><span>I/O / U3</span><small>B24 есть, движение не подтверждается</small></div><i>→</i><div id="mm3"><b>3</b><span>Физическая проверка</span><small>B28 · кодировщик · муфта · проводка</small></div><i>→</i><div id="mm4"><b>4</b><span>После ремонта</span><small>сброс + контрольный цикл</small></div></div><div class="other-cases"><button data-case="head2">34 · HEAD 2 timeout</button><button data-case="pp2">7 · PRESS PLATE 2 jam</button><button data-case="enc1">20 · HEAD 1 encoder</button></div><div class="mech-note" id="mechNote2">Не меняем детали наугад: сначала связываем текст аварии, I/O и реальное движение механизма.</div></div><div class="actions"><button id="mechNext2" class="primary">ДАЛЬШЕ →</button></div></div>`}
  function readyGraphic2(){return `<div class="stage ready-real"><div class="flow-summary"><div>БУНТ</div><i>→</i><div>СТОЛ<br><small>B58/B59</small></div><i>→</i><div>ПРЕСС</div><i>→</i><div>KNB<br><small>R1–R4</small></div><i>→</i><div>PLC I/O</div><i>→</i><div>HMI<br><small>АВАРИИ</small></div></div><div class="ready-checks"><span>✓ понимаем физический цикл</span><span>✓ знаем, где смотреть I/O</span><span>✓ умеем читать журнал аварий</span><span>✓ отличаем сброс от ремонта</span></div><div class="ready-title">ГОТОВ К ТРЕНАЖЁРУ</div></div>`}

  graphic=function(v){
    if(v==='io')return ioGraphic();
    if(v==='alarms')return alarmsGraphic();
    if(v==='operator2')return operatorGraphic2();
    if(v==='mechanic2')return mechanicGraphic2();
    if(v==='ready2')return readyGraphic2();
    return oldGraphic(v)
  };

  bind=function(v){
    oldBind(v);
    if(v==='io'){
      const help=$('#ioHelp'),rep=document.querySelector('.hmi-replica');
      document.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-u]').forEach(x=>x.classList.remove('primary'));b.classList.add('primary');const u=+b.dataset.u;if(u===3){help.innerHTML='<b>Пример U3 / R3:</b> B24 подтверждает наличие проволоки. Дальше смотрим, меняются ли позиция/скорость и приходят ли подтверждения нужных положений.';rep.classList.add('u3-focus')}else{help.textContent=`U${u}: те же входы B и выходы Y, но для своей вязальной головы.`;rep.classList.remove('u3-focus')}})
    }
    if(v==='alarms'){
      const list=$('#alarmList'),ex=$('#alarmExplain'),act=$('#activeAlarms'),hist=$('#historyAlarms'),ack=$('#alarmAck'),reset=$('#alarmReset');
      const draw=mode=>{list.innerHTML=alarmRows(mode);act.classList.toggle('selected',mode==='active');hist.classList.toggle('selected',mode==='history');ex.textContent=mode==='active'?'Актуальные: сообщения, которые требуют внимания сейчас.':'История: журнал того, что происходило на компакторе раньше.'};
      act.onclick=()=>draw('active');hist.onclick=()=>draw('history');ack.onclick=()=>{ex.textContent='КВИТ.: оператор подтвердил, что увидел сообщение. Причина неисправности от этого не исчезает.'};reset.onclick=async()=>{draw('active');reset.disabled=true;ex.textContent='СБРОС: PLC пробует снять аварию и продолжить работу…';list.innerHTML='<div class="alarm-clear">Аварии временно сняты</div>';await wait(900);list.innerHTML=alarmRows('active');ex.textContent='Причина осталась → авария вернулась. Значит нужен поиск неисправности, а не повторные сбросы.';reset.disabled=false}
    }
    if(v==='operator2'){
      op2Step=1;const btn=$('#operatorNext2');btn.onclick=()=>{op2Step=Math.min(4,op2Step+1);['#op21','#op22','#op23','#op24'].forEach((id,k)=>$(id).classList.toggle('active',k<op2Step));btn.textContent=op2Step===4?'МЕХАНИК ВЫЗВАН ✓':'ДАЛЬШЕ →'}
    }
    if(v==='mechanic2'){
      mech2Step=1;const btn=$('#mechNext2'),note=$('#mechNote2');btn.onclick=()=>{mech2Step=Math.min(4,mech2Step+1);['#mm1','#mm2','#mm3','#mm4'].forEach((id,k)=>$(id).classList.toggle('active',k<mech2Step));btn.textContent=mech2Step===4?'КОНТРОЛЬНЫЙ ЦИКЛ ✓':'ДАЛЬШЕ →'};
      document.querySelectorAll('[data-case]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-case]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');note.textContent=b.dataset.case==='head2'?'34: голова 2 не ввела скручивающее устройство вовремя → проверяем команду Y3A/Y3B и подтверждающие положения B1/B5, затем механику головы.':b.dataset.case==='pp2'?'7: пресс-плита 2 / застревание бунта → смотрим положение PP2, B58, B56/B52 и состояние направляющей/бунта.':'20: голова 1 — нет импульсов энкодера → аналогично связываем канал головы 1 с энкодером, передачей вращения и проводкой.'})
    }
  };

  render();
})();