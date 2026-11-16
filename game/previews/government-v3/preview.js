import {districtButton} from './districts.js';
import {decorateStatic} from '../../ui-polish.js';
{const polishRoot=document.querySelector('.game');let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorateStatic(polishRoot);});}).observe(polishRoot,{childList:true,subtree:true,characterData:true});}
import {artworkShell} from '../../ui-shell.js';
import {placeArtwork,uiComponentsReady} from '../../art-controls.js';
import {paintArtworkLayout} from '../../art-layout.js';
import {paintArtworkSelection} from '../../artwork-screen.js';
import {nineSlice,disposeNineSlices} from '../../nine-slice.js';
import {buildings,buildingLevel,production,collectProduction,upgradeBuilding,upgradeCosts,maxLevel,marketExchangeLimit} from '../../government.js';
import {questPeriods} from '../../services.js';
// Preview memory only: never access the profile or storage.
const game=document.querySelector('.game'),$=s=>game.querySelector(s),now=Date.now();
const initial=()=>({gold:12450,diamonds:320,provisions:80,treasureTokens:12,trainingTickets:1,government:{started:now-10800000,clock:now,farmClaim:now-10800000,levels:{farm:3,barracks:2,forge:3,market:2},claims:{barracks:questPeriods(now).day}}});
let state=initial(),selected='farm';
function note(text='내정 시안입니다. 실제 게임 저장은 변경하지 않습니다.'){const e=document.querySelector('.preview-status');e.textContent=text;e.hidden=false;clearTimeout(note.timer);note.timer=setTimeout(()=>e.hidden=true,2200);}
await Promise.all([uiComponentsReady,paintArtworkLayout(game,{stablePixels:true})]);
const quantity=(id,n)=>id==='farm'?'골드 '+n+' · 군량 '+Math.floor(n/10):id==='barracks'?'무료 훈련권 '+n+'개':'보물 재료 '+n+'개';
async function render(){game.inert=true;game.setAttribute('aria-busy','true');artworkShell(game,{screen:'home',title:'내정',progress:state});const painting=[];
$('.summary-side').textContent='수령 가능 · '+buildings.filter(b=>b.id!=='market'&&production(state,b.id,now)>0).length+'곳';
const list=$('.facility-list');disposeNineSlices(list);list.replaceChildren();
// Coordinates follow the approved whole-town painting; no cutout/repaint of buildings.
const places={farm:{hit:[205,556,195,96],label:[245,652,140,44]},barracks:{hit:[575,535,195,115],label:[550,652,140,44]},forge:{hit:[158,699,197,121],label:[187,820,140,44]},market:{hit:[535,700,175,111],label:[563,812,140,44]}};
for(const b of buildings){const p=places[b.id],level=buildingLevel(state,b.id),n=production(state,b.id,now),market=b.id==='market';
const hit=document.createElement('button');hit.className='facility-hit art-control';hit.dataset.building=b.id;hit.setAttribute('aria-label',b.name+' 건물 선택');hit.setAttribute('aria-pressed',String(selected===b.id));placeArtwork(hit,districtButton(hit,b.id));hit.onclick=()=>{selected=b.id;render();};list.append(hit);
const button=document.createElement('button');button.className='facility-name';button.id='facility-name-'+b.id;button.dataset.facility=b.id;button.setAttribute('aria-label',b.name+' Lv.'+level+' · '+(market?'교환 가능':n?'수령 가능':'수령 완료'));button.textContent=b.name;placeArtwork(button,p.label);button.onclick=()=>{selected=b.id;render();};list.append(button);button.setAttribute('aria-pressed',String(b.id===selected));painting.push(nineSlice(button,b.id===selected?'green':'blue',{corner:18,stablePixels:true}));
}
const b=buildings.find(b=>b.id===selected),level=buildingLevel(state,selected),n=production(state,selected,now),market=selected==='market',cost=upgradeCosts[level-1];
$('.detail-title').textContent=b.name+' · Lv.'+level+' / '+maxLevel;$('.detail-status').textContent=market?'교환 시설':n?'수령 가능':selected==='farm'?'생산 중':'오늘 수령 완료';$('.detail-effect').textContent='현재 효과 · '+b.effect(level);$('.detail-stock').textContent=market?'이번 주 교환 · 0 / '+marketExchangeLimit(state)+'회':n?'수령 예정 · '+quantity(selected,n):'수령 예정 · '+quantity(selected,0);$('.detail-next').textContent=level===maxLevel?'최대 레벨에 도달했습니다.':'다음 Lv.'+(level+1)+' · '+b.effect(level+1);$('.detail-cost').textContent=level===maxLevel?'강화 완료 · 추가 비용 없음':'강화 비용 · 골드 '+cost.toLocaleString()+' / 보유 '+state.gold.toLocaleString();$('.detail-note').textContent=selected==='farm'?'최대 8시간 생산량 보관 · 수확 시 군량도 획득\n강화하면 쌓인 생산물을 먼저 수령합니다.':market?'장터는 생산물을 지급하지 않습니다.\n교환 상점에서 재료를 사용해 선택상자를 교환합니다.':'매일 05시에 수령 가능 횟수가 갱신됩니다.\n오늘 받은 생산물은 강화해도 다시 지급되지 않습니다.';
$('.collect').disabled=!market&&!n;$('.collect').textContent=market?'교환 상점':n?'생산물 수령':selected==='farm'?'생산 중':'오늘 수령 완료';$('.upgrade').disabled=level===maxLevel||state.gold<cost;$('.upgrade').textContent=level===maxLevel?'최대 레벨':state.gold<cost?'골드 부족':'강화 · '+cost.toLocaleString()+' 골드';painting.push(nineSlice($('.collect'),$('.collect').disabled?'blue':'green',{stablePixels:true}));await Promise.all([...painting,document.fonts.ready]);game.inert=false;game.setAttribute('aria-busy','false');}
$('.collect').onclick=()=>{if(selected==='market'){note('교환 상점으로 연결할 버튼입니다. 현재는 시안입니다.');return;}state=collectProduction(state,selected,now);render();};$('.upgrade').onclick=()=>{state=upgradeBuilding(state,selected,now);render();};$('.reset').onclick=()=>{state=initial();selected='farm';render();};game.querySelectorAll('.home-back,.bottom-nav button,.wallet button,#barracks-back').forEach(b=>b.onclick=()=>note());await render();
