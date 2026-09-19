const KEY='compactorTrainerV8';
const defaults={difficulty:'easy',sound:true,hints:true,slow:false};
let opt={...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function save(){localStorage.setItem(KEY,JSON.stringify(opt));}
function sync(){
  $$('[data-difficulty]').forEach(b=>b.classList.toggle('active',b.dataset.difficulty===opt.difficulty));
  $('#difficultyText').textContent=opt.difficulty==='easy'?'ПРОСТОЙ':opt.difficulty==='advanced'?'ПРОДВИНУТЫЙ':'PRO PLC';
}
$$('[data-difficulty]').forEach(b=>b.onclick=()=>{opt.difficulty=b.dataset.difficulty;save();sync();});
$('#optionsBtn').onclick=()=>$('#optionsModal').classList.remove('hidden');
$('#aboutBtn').onclick=()=>$('#aboutModal').classList.remove('hidden');
$$('[data-close]').forEach(b=>b.onclick=()=>b.closest('.modal').classList.add('hidden'));
$('#startBtn').onclick=()=>location.href='./game.html?v=8.6.18#start';
$('#trainingBtn').onclick=()=>location.href='./training.html?v=8.6.11';
$('#trainingTestBtn').onclick=()=>location.href='./test.html?v=8';
$('#examBtn').onclick=()=>location.href='./game.html?v=8.6.18#exam';
sync();