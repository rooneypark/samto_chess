import {artworkShell,artworkWallet} from '../../ui-shell.js';
import {placeArtwork,uiComponentsReady} from '../../art-controls.js';
import {paintArtworkLayout} from '../../art-layout.js';
import {nineSlice,disposeNineSlices} from '../../nine-slice.js';
import {createGameStore} from '../../store.js';
import {questDefs,prepareServices,serviceCommand,periodBonus,attendanceRewards,achievementDefs,achievementProgress} from '../../services.js';

// This is a memory-only design example; never read or write the player's profile.
const now=Date.UTC(2026,10,14,3),game=document.querySelector('.game'),$=s=>game.querySelector(s);
let state=createGameStore({getItem:()=>null,setItem(){}}).get(),tab='day',revision=0;
const q=prepareServices(state,now);state.gold=12450;state.diamonds=320;state.freeDiamonds=320;
q.attendance={day:String(Number(q.periods.day)-1),index:2};
for(const [id,n] of Object.entries({daily_run:2,daily_merge:5,daily_skill:12,daily_train:0,weekly_run:6,weekly_win:3,weekly_merge:25,weekly_skill:74,weekly_draw:3}))q.quests[id].progress=n;
q.quests.daily_merge.claimed=true;q.lifetime.runs=6;q.lifetime.merges=74;state.campaign={cleared:true};
artworkShell(game,{screen:'home',title:'임무 · 보상',progress:state});
await Promise.all([uiComponentsReady,paintArtworkLayout(game)]);
const coin='<img src="assets/shop-v2/coin.png" alt="골드">',gem='<img src="assets/shop-v2/gem.png" alt="무료 다이아">';
function rewards(r){return (r.gold?coin+'<b>'+r.gold+'</b>':'')+(r.gold&&r.freeDiamonds?'<span class="reward-space"></span>':'')+(r.freeDiamonds?gem+'<b>'+r.freeDiamonds+'</b>':'')+(r.trainingTickets?'<span class="ticket">훈련권</span><b>1</b>':'');}
function note(message='임무·보상 시안입니다. 실제 저장은 변경하지 않습니다.') {const e=document.querySelector('.preview-status');e.textContent=message;e.hidden=false;clearTimeout(note.timer);note.timer=setTimeout(()=>e.hidden=true,2400);}
async function claim(command){try{state=serviceCommand(state,command,now);await render();note('보상 수령 상태를 미리 보았습니다. 실제 재화는 변경되지 않습니다.');}catch(e){note(e.message);}}
async function render(){
 const token=++revision;game.inert=true;game.setAttribute('aria-busy','true');const q=state.services,painting=[];
 artworkWallet(game,state);
 const attended=q.attendance.day===q.periods.day,day=(attended?q.attendance.index-1:q.attendance.index)%7;
 $('.attendance-copy').textContent=attended?'오늘 출석 완료 · 내일 또 만나요':'오늘은 3일차 · 무료 다이아 20';
 $('.attendance-claim').textContent=attended?'수령 완료':'출석 받기';$('.attendance-claim').disabled=attended;painting.push(nineSlice($('.attendance-claim'),attended?'blue':'green'));
 const days=$('.attendance-days');disposeNineSlices(days);days.replaceChildren();
 attendanceRewards.forEach((r,i)=>{const el=document.createElement('div');el.className='day'+(i===day?' today':'')+(i<day||i===day&&attended?' done':'');el.setAttribute('role','listitem');el.setAttribute('aria-label',(i+1)+'일차 '+(r.gold?'골드 '+r.gold:r.freeDiamonds?'무료 다이아 '+r.freeDiamonds:'훈련권 1'));el.innerHTML='<div class="panel-frame"></div><span>'+(i+1)+'일</span><div class="day-reward">'+rewards(r)+'</div><small>'+(i<day||i===day&&attended?'✓ 완료':i===day?'오늘':'예정')+'</small>';placeArtwork(el,[44+i*122,384,120,110]);days.append(el);painting.push(nineSlice(el.firstElementChild,i===day?'green':'blue',{button:false}));});
 for(const b of game.querySelectorAll('[data-tab]')){b.setAttribute('aria-pressed',String(b.dataset.tab===tab));painting.push(nineSlice(b,b.dataset.tab===tab?'green':'blue'));}
 const isAchievement=tab==='achievement',defs=isAchievement?achievementDefs:questDefs.filter(d=>d.period===tab);
 $('.list-title').textContent=isAchievement?'쌓아가는 전공':tab==='day'?'오늘의 임무':'이번 주의 임무';$('.reset-time').textContent=isAchievement?'누적 달성 보상':tab==='day'?'매일 05:00 갱신':'월요일 05:00 갱신';
 const rows=$('.mission-rows');disposeNineSlices(rows);rows.replaceChildren();
 defs.forEach((d,i)=>{const p=isAchievement?{progress:achievementProgress(state,d),target:d.target,claimed:!!q.achievements[d.id]}:q.quests[d.id],complete=p.progress>=p.target;
  const row=document.createElement('section');row.className='mission'+(complete?' complete':'')+(isAchievement?' achievement':'');row.dataset.quest=d.id;
  row.innerHTML='<div class="panel-frame"></div><h3>'+d.name+'</h3><p class="reward">'+rewards(isAchievement?d.reward:{gold:d.gold})+'</p><p class="progress-label">'+p.progress+' / '+p.target+'</p><div class="progress-bar"><i style="width:'+Math.min(100,p.progress/p.target*100)+'%"></i></div><button>'+ (p.claimed?'수령 완료':complete?'보상 받기':'진행 중')+'</button>';
  const h=tab==='week'?90:116;placeArtwork(row,[20,686+i*(h+14),901,h]);rows.append(row);const b=row.querySelector('button');Object.assign(b.style,{left:632/901*100+'%',width:239/901*100+'%',top:(h-74)/2/h*100+'%',height:74/h*100+'%'});b.disabled=p.claimed||!complete;b.onclick=()=>claim({type:isAchievement?'achievement':'quest',id:d.id});painting.push(nineSlice(row.firstElementChild,'blue',{button:false}),nineSlice(b,complete&&!p.claimed?'green':'blue'));
 });
 const claimed=defs.filter(d=>isAchievement?q.achievements[d.id]:q.quests[d.id].claimed).length,done=isAchievement||!!q.claims[`bonus:${tab}:${q.periods[tab]}`];
 $('.bonus-title').textContent=isAchievement?'업적 달성 안내':(tab==='day'?'일일':'주간')+' 완료 보너스';
 $('.bonus-rewards').innerHTML=isAchievement?'<span class="achievement-description">첫 승전 · 황건 토벌 최초 승리</span>':rewards(periodBonus[tab]);
 $('.bonus-copy').textContent=isAchievement?'달성한 업적은 각 보상을 한 번씩 받습니다.':'모든 임무 보상을 받은 뒤 수령할 수 있습니다.';
 const bonus=$('.bonus-claim');bonus.disabled=done||claimed<defs.length;bonus.textContent=isAchievement?claimed+' / '+defs.length+' 수령':done?'수령 완료':claimed===defs.length?'보너스 받기':claimed+' / '+defs.length+' 수령';painting.push(nineSlice(bonus,bonus.disabled?'blue':'green'));
 await Promise.all([...painting,document.fonts.ready,...Array.from(game.querySelectorAll('img'),img=>img.decode())]);if(token===revision){game.inert=false;game.setAttribute('aria-busy','false');}
}
game.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render();});
$('.attendance-claim').onclick=()=>claim({type:'attendance'});$('.bonus-claim').onclick=()=>claim({type:'bonus',period:tab});
game.querySelectorAll('.bottom-nav button,.wallet button,.home-back,#barracks-back').forEach(b=>b.onclick=()=>note());
await render();
