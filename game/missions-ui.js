import {paintClaim} from './mission-claim-ui.js';
import {artSet} from './art.js';
import {missionsTemplate} from './missions-ui-template.js';
import {artworkShell} from './ui-shell.js';
import {placeArtwork,uiComponentsReady} from './art-controls.js';
import {paintArtworkLayout} from './art-layout.js';
import {nineSlice,disposeNineSlices} from './nine-slice.js';
import {questDefs,periodBonus,attendanceRewards,achievementDefs,achievementProgress} from './services.js';
export const missionsArtwork=artSet==='a';
const revisions=new WeakMap();
export function invalidateMissionsArtwork(root){revisions.set(root,(revisions.get(root)??0)+1);disposeNineSlices(root);}
const rewardLabel=r=>r.gold?'골드 '+r.gold:r.freeDiamonds?'무료 다이아 '+r.freeDiamonds:'훈련권 '+r.trainingTickets;
const coin='<img src="assets/shop-v2/coin.png" alt="골드">',gem='<img src="assets/shop-v2/gem.png" alt="무료 다이아">';
function rewards(r){return (r.gold?coin+'<b>'+r.gold+'</b>':'')+(r.gold&&r.freeDiamonds?'<span class="reward-space"></span>':'')+(r.freeDiamonds?gem+'<b>'+r.freeDiamonds+'</b>':'')+(r.trainingTickets?'<span class="ticket">훈련권</span><b>1</b>':'');}
export async function renderMissionsArtwork(game,{state,tab,actions}){
 const $=s=>game.querySelector(s);disposeNineSlices(game);game.innerHTML=missionsTemplate;
 artworkShell(game,{screen:"home",title:"임무",progress:state,controlsRoot:game});
 const token=(revisions.get(game)??0)+1;revisions.set(game,token);game.inert=true;game.setAttribute('aria-busy','true');const q=state.services,painting=[paintArtworkLayout(game),uiComponentsReady];
 const attended=q.attendance.day===q.periods.day,day=(attended?q.attendance.index-1:q.attendance.index)%7;
 $('.attendance-copy').textContent=attended?'오늘 출석 완료 · 내일 또 만나요':'오늘은 '+(day+1)+'일차 · '+rewardLabel(attendanceRewards[day]);
 $('.attendance-claim').textContent=attended?'수령 완료':'출석 받기';$('.attendance-claim').disabled=attended;painting.push(paintClaim($('.attendance-claim'),!attended,$('.attendance-claim').textContent));
 const days=$('.attendance-days');disposeNineSlices(days);days.replaceChildren();
 attendanceRewards.forEach((r,i)=>{const el=document.createElement('div');el.className='day'+(i===day?' today':'')+(i<day||i===day&&attended?' done':'');el.setAttribute('role','listitem');el.setAttribute('aria-label',(i+1)+'일차 '+(r.gold?'골드 '+r.gold:r.freeDiamonds?'무료 다이아 '+r.freeDiamonds:'훈련권 1'));el.innerHTML='<div class="panel-frame"></div><span>'+(i+1)+'일</span><div class="day-reward">'+rewards(r)+'</div><small>'+(i<day||i===day&&attended?'✓ 완료':i===day?'오늘':'예정')+'</small>';placeArtwork(el,[44+i*122,384,120,110]);days.append(el);painting.push(nineSlice(el.firstElementChild,i===day?'green':'blue',{button:false}));});
 for(const b of game.querySelectorAll('[data-tab]')){b.setAttribute('aria-pressed',String(b.dataset.tab===tab));painting.push(nineSlice(b,b.dataset.tab===tab?'green':'blue'));}
 const isAchievement=tab==='achievement',defs=isAchievement?achievementDefs:questDefs.filter(d=>d.period===tab);
 $('.list-title').textContent=isAchievement?'쌓아가는 전공':tab==='day'?'오늘의 임무':'이번 주의 임무';$('.reset-time').textContent=isAchievement?'누적 달성 보상':tab==='day'?'매일 05:00 갱신':'월요일 05:00 갱신';
 const rows=$('.mission-rows');disposeNineSlices(rows);rows.replaceChildren();
 defs.forEach((d,i)=>{const p=isAchievement?{progress:achievementProgress(state,d),target:d.target,claimed:!!q.achievements[d.id]}:q.quests[d.id],complete=p.progress>=p.target;
  const row=document.createElement('section');row.className='mission'+(complete?' complete':'')+(isAchievement?' achievement':'');row.dataset.quest=d.id;
  row.setAttribute('aria-label',isAchievement?d.name+' · '+d.text:d.name);row.title=isAchievement?d.text:'';
  row.innerHTML='<div class="panel-frame"></div><h3>'+d.name+'</h3><p class="reward">'+rewards(isAchievement?d.reward:{gold:d.gold})+'</p><p class="progress-label">'+p.progress+' / '+p.target+'</p><div class="progress-bar"><i style="width:'+Math.min(100,p.progress/p.target*100)+'%"></i></div><button>'+ (p.claimed?'수령 완료':complete?'보상 받기':'진행 중')+'</button>';
  const name=row.querySelector('h3');if(d.id==='daily_train'&&p.event==='run'){name.textContent='만렙 장수 대체 출정';name.classList.add('long-name');}
  if(isAchievement){row.tabIndex=0;const detail=()=>{const label=$('.achievement-description');if(label){label.textContent=d.name+' · '+d.text;label.classList.toggle('long-description',label.textContent.length>23);}};row.onfocus=detail;row.onpointerenter=detail;}
  const h=tab==='week'?90:116;placeArtwork(row,[20,686+i*(h+14),901,h]);rows.append(row);const b=row.querySelector('button');const box={left:632/901*100+'%',width:239/901*100+'%',top:(h-74)/2/h*100+'%',height:74/h*100+'%'};Object.assign(b.style,box);b.disabled=p.claimed||!complete;b.onclick=()=>actions.claim({type:isAchievement?'achievement':'quest',id:d.id});painting.push(nineSlice(row.firstElementChild,'blue',{button:false}),paintClaim(b,complete&&!p.claimed,b.textContent,box));
 });
 const claimed=defs.filter(d=>isAchievement?q.achievements[d.id]:q.quests[d.id].claimed).length,done=isAchievement||!!q.claims[`bonus:${tab}:${q.periods[tab]}`];
 $('.bonus-title').textContent=isAchievement?'업적 달성 안내':(tab==='day'?'일일':'주간')+' 완료 보너스';
 $('.bonus-rewards').innerHTML=isAchievement?'<span class="achievement-description">첫 승전 · 황건 토벌 최초 승리</span>':rewards(periodBonus[tab]);
 $('.bonus-copy').textContent=isAchievement?'달성한 업적은 각 보상을 한 번씩 받습니다.':'모든 임무 보상을 받은 뒤 수령할 수 있습니다.';
 const bonus=$('.bonus-claim');bonus.disabled=done||claimed<defs.length;bonus.textContent=isAchievement?claimed+' / '+defs.length+' 수령':done?'수령 완료':claimed===defs.length?'보너스 받기':claimed+' / '+defs.length+' 수령';painting.push(paintClaim(bonus,!bonus.disabled,bonus.textContent));
 $('#barracks-back').id='missions-back';$('#missions-back').onclick=()=>actions.navigate('home');
 game.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>actions.tab(b.dataset.tab));
 $('.attendance-claim').onclick=()=>actions.claim({type:'attendance'});$('.bonus-claim').onclick=()=>actions.claim({type:'bonus',period:tab});
 game.querySelectorAll('.bottom-nav button').forEach(b=>b.onclick=()=>actions.navigate(b.dataset.action));
 game.querySelectorAll('.wallet button').forEach((b,i)=>{b.setAttribute('aria-label',(i?'다이아 ':'골드 ')+state[i?'diamonds':'gold'].toLocaleString());b.onclick=actions.wallet;});
 await Promise.all([...painting,document.fonts.ready,...Array.from(game.querySelectorAll('img'),img=>img.decode())]);if(token===revisions.get(game)){game.querySelectorAll('.bottom-nav button').forEach(b=>b.tabIndex=0);game.inert=false;game.setAttribute('aria-busy','false');}
}
