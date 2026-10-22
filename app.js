const DAY=86400000, FOCUS=25*60, BREAK=5*60, GOAL=120;
const todayKey=()=>new Date().toLocaleDateString('sv-SE');
const saved=JSON.parse(localStorage.getItem('yohaku-study')||'{}');
const records=saved.records||{};
let remaining=FOCUS, running=false, mode='focus', tick=null;
let audioContext;
const timerEl=document.querySelector('#timer'), startBtn=document.querySelector('#start-button');
const circumference=2*Math.PI*108;
document.querySelector('#ring-progress').style.strokeDasharray=circumference;

function prepareAudio(){
 const AudioContextClass=window.AudioContext||window.webkitAudioContext;
 if(!AudioContextClass)return;
 if(!audioContext)audioContext=new AudioContextClass();
 if(audioContext.state==='suspended')audioContext.resume();
}
function playCompletionSound(){
 if(!audioContext||audioContext.state!=='running')return;
 const oscillator=audioContext.createOscillator();
 const volume=audioContext.createGain();
 const now=audioContext.currentTime;
 oscillator.type='sine';
 oscillator.frequency.setValueAtTime(720,now);
 oscillator.frequency.exponentialRampToValueAtTime(430,now+0.18);
 volume.gain.setValueAtTime(0.0001,now);
 volume.gain.exponentialRampToValueAtTime(0.22,now+0.015);
 volume.gain.exponentialRampToValueAtTime(0.0001,now+0.24);
 oscillator.connect(volume);volume.connect(audioContext.destination);
 oscillator.start(now);oscillator.stop(now+0.25);
}
function persist(){localStorage.setItem('yohaku-study',JSON.stringify({records}));}
function minutesFor(date){return records[date]||0;}
function renderDay(){
 const mins=minutesFor(todayKey());
 document.querySelector('#hours').textContent=Math.floor(mins/60);
 document.querySelector('#minutes').textContent=String(mins%60).padStart(2,'0');
 document.querySelector('#goal-status').textContent=(mins/60).toFixed(1);
 document.querySelector('#goal-progress').style.width=`${Math.min(100,mins/GOAL*100)}%`;
 document.querySelector('#daily-note').textContent=mins>=GOAL?'今日の目標を達成。よく積み重ねました。':mins>0?'いい調子。その集中が未来につながっています。':'まずは5分から。始めることがいちばん大切。';
 const tip=mins<10?['小さな一歩','勉強を始める、その決断が未来を変える最初の1ページ。']:mins<30?['一駅ぶんの読書','通勤電車で本を読む時間を、もうひとつ積み重ねたくらい。']:mins<60?['お気に入りの映画','映画を一本楽しむ時間。今日はその時間を未来の自分に使いました。']:mins<120?['新しい街を散歩','知らない街をゆっくり歩いて巡るくらいの時間を、学びに使いました。']:['じっくり旅する時間','日帰り旅行に出かけるような時間。今日の自分に、拍手を。'];
 document.querySelector('#tip-title').textContent=tip[0];document.querySelector('#tip-copy').textContent=tip[1];
 renderWeek();
}
function renderTimer(){timerEl.textContent=`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;document.querySelector('#timer-mode').textContent=mode==='focus'?'FOCUS TIME':'SHORT BREAK';document.querySelector('#timer-caption').textContent=mode==='focus'?'25分の集中を始めよう':'少しひと息つきましょう';document.querySelector('#ring-progress').style.strokeDashoffset=circumference*(1-remaining/(mode==='focus'?FOCUS:BREAK));startBtn.innerHTML=running?'一時停止 <span aria-hidden="true">Ⅱ</span>':(remaining===(mode==='focus'?FOCUS:BREAK)?'集中をはじめる <span aria-hidden="true">→</span>':'再開する <span aria-hidden="true">→</span>');}
function finish(){running=false;clearInterval(tick);playCompletionSound();if(mode==='focus'){records[todayKey()]=(records[todayKey()]||0)+25;persist();renderDay();mode='break';remaining=BREAK;}else{mode='focus';remaining=FOCUS;}renderTimer();}
startBtn.addEventListener('click',()=>{if(running){running=false;clearInterval(tick);}else{prepareAudio();running=true;tick=setInterval(()=>{remaining--;if(remaining<=0)finish();else renderTimer();},1000);}renderTimer();});
document.querySelector('#reset-button').addEventListener('click',()=>{running=false;clearInterval(tick);mode='focus';remaining=FOCUS;renderTimer();});
document.querySelector('#skip-button').addEventListener('click',()=>{running=false;clearInterval(tick);mode=mode==='focus'?'break':'focus';remaining=mode==='focus'?FOCUS:BREAK;renderTimer();});
function renderWeek(){const chart=document.querySelector('#week-chart');chart.innerHTML='';let total=0;const today=new Date();const mondayOffset=(today.getDay()+6)%7;const monday=new Date(today);monday.setDate(today.getDate()-mondayOffset);const labels=['月','火','水','木','金','土','日'];const vals=[];for(let i=0;i<7;i++){const d=new Date(monday);d.setDate(monday.getDate()+i);const key=d.toLocaleDateString('sv-SE'),mins=minutesFor(key);vals.push(mins);total+=mins;}const max=Math.max(...vals,60);for(let i=0;i<7;i++){const d=new Date(monday);d.setDate(monday.getDate()+i);const key=d.toLocaleDateString('sv-SE'),isToday=key===todayKey(),col=document.createElement('div');col.className='day-column';col.innerHTML=`<div class="bar-area"><span class="bar ${isToday?'today':''}" style="height:${Math.max(4,vals[i]/max*100)}%" title="${Math.floor(vals[i]/60)}時間${vals[i]%60}分"></span></div><span class="day-label ${isToday?'today':''}">${labels[i]}</span>`;chart.append(col);}document.querySelector('#week-total').textContent=`合計 ${Math.floor(total/60)}時間${total%60?` ${total%60}分`:''}`;}
const now=new Date();document.querySelector('#today-label').textContent=new Intl.DateTimeFormat('ja-JP',{year:'numeric',month:'long',day:'numeric',weekday:'short'}).format(now);renderDay();renderTimer();
