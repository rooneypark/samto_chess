import {artworkShell} from './ui-shell.js';
import {placeArtwork,uiComponentsReady,preloadArtwork} from './art-controls.js';
import {paintArtworkLayout} from './art-layout.js';
import {createArtworkScreen} from './artwork-screen.js';
import {nineSlice,disposeNineSlices} from './nine-slice.js';
import {districtButton} from './government-districts.js';
import {governmentTemplate} from './government-template.js';
import {government,governmentUnlocked,buildings,buildingLevel,production,collectProduction,upgradeBuilding,upgradeCosts,maxLevel,provisionRatio} from './government.js';
import {products,remaining,productLimit} from './economy.js';

const labelBoxes={farm:[245,652,140,44],barracks:[550,652,140,44],forge:[187,820,140,44],market:[563,812,140,44]};
const quantity=(id,n)=>id==='farm'?'골드 '+n+' · 군량 '+Math.floor(n/provisionRatio):id==='barracks'?'무료 훈련권 '+n+'개':'보물 재료 '+n+'개';

export function initGovernmentArtwork({host,store,navigate,toast,onWallet,onExchange}){
 const root=createArtworkScreen({host,sharedShell:true,className:'government-runtime',label:'내정 · 성내 시설',template:governmentTemplate,navigate,onWallet});
 const $=selector=>root.querySelector(selector);
 const ready=Promise.all([uiComponentsReady,paintArtworkLayout(root,{stablePixels:true}),preloadArtwork(['assets/government-v1/town.png'])]);
 let selected='farm',busy=false,revision=0,timer;

 function schedule(){
  clearTimeout(timer);
  // Farm output and the 05:00 reset are refreshed on minute boundaries,
  // plus immediately on store changes or when the window regains focus.
  if(!root.hidden)timer=setTimeout(()=>{if(!busy)draw();else schedule();},60025-Date.now()%60000);
 }
 async function render(){
  const token=++revision;await ready;
  if(root.hidden||token!==revision||busy)return;
  const state=store.get(),now=Date.now();
  if(!governmentUnlocked(state)){navigate('home');toast('황건 토벌을 처음 승리하면 성내 시설이 열립니다.');return;}
  root.inert=true;root.setAttribute('aria-busy','true');
  artworkShell(root,{screen:'home',title:'내정',progress:state,controlsRoot:root});
  $('.summary-side').textContent='수령 가능 · '+buildings.filter(b=>b.id!=='market'&&production(state,b.id,now)>0).length+'곳';
  const painting=[],list=$('.facility-list');disposeNineSlices(list);list.replaceChildren();
  for(const b of buildings){
   const level=buildingLevel(state,b.id),n=b.id==='market'?0:production(state,b.id,now);
   const select=()=>{if(busy)return;selected=b.id;draw();};
   const hit=document.createElement('button');hit.type='button';hit.className='facility-hit art-control';hit.dataset.building=b.id;
   hit.setAttribute('aria-label',b.name+' 건물 선택');hit.setAttribute('aria-pressed',String(selected===b.id));
   placeArtwork(hit,districtButton(hit,b.id));hit.onclick=select;list.append(hit);
   const label=document.createElement('button');label.type='button';label.className='facility-name';label.id='facility-name-'+b.id;label.dataset.facility=b.id;
   label.setAttribute('aria-label',b.name+' Lv.'+level+' · '+(b.id==='market'?'교환 시설':n?'수령 가능':'수령 완료'));
   label.setAttribute('aria-pressed',String(selected===b.id));label.textContent=b.name;placeArtwork(label,labelBoxes[b.id]);label.onclick=select;list.append(label);
   painting.push(nineSlice(label,selected===b.id?'green':'blue',{corner:18,stablePixels:true}));
  }
  const building=buildings.find(b=>b.id===selected),level=buildingLevel(state,selected),market=selected==='market',n=market?0:production(state,selected,now),cost=upgradeCosts[level-1];
  $('.detail-title').textContent=building.name+' · Lv.'+level+' / '+maxLevel;
  $('.detail-status').textContent=market?'교환 시설':n?'수령 가능':selected==='farm'?'생산 중':'오늘 수령 완료';
  const farmBonus=state.alliance?.guild?(state.alliance.research?.farm??0)*5:0;
  $('.detail-effect').textContent='현재 효과 · '+building.effect(level);
  $('.detail-stock').textContent=market?'이번 주 남은 교환 · '+products.filter(p=>p.period==='week').map(p=>(p.id==='hero'?'장수':'보물')+' '+remaining(state,p,now)+'/'+productLimit(state,p)+'회').join(' · '):'수령 예정 · '+quantity(selected,n);
  $('.detail-next').textContent=level===maxLevel?'최대 레벨에 도달했습니다.':'다음 Lv.'+(level+1)+' · '+building.effect(level+1);
  $('.detail-cost').textContent=level===maxLevel?'강화 완료 · 추가 비용 없음':'강화 비용 · 골드 '+cost.toLocaleString()+' / 보유 '+state.gold.toLocaleString();
  $('.detail-note').textContent=selected==='farm'?(farmBonus?'동맹 생산 보너스 +'+farmBonus+'% · 최대 8시간 보관':'최대 8시간 생산량 보관 · 수확 시 군량도 획득')+'\n강화하면 쌓인 생산물을 먼저 수령합니다.':market?'장터는 생산물을 지급하지 않습니다.\n재료로 선택상자 교환 · 매주 월요일 05시 갱신':'매일 05시에 수령 가능 횟수가 갱신됩니다.\n오늘 받은 생산물은 강화해도 다시 지급되지 않습니다.';
  $('.collect').disabled=!market&&!n;
  $('.collect').textContent=market?'교환 상점':n?'생산물 수령':selected==='farm'?'생산 중':'오늘 수령 완료';
  $('.upgrade').disabled=level===maxLevel||state.gold<cost;
  $('.upgrade').textContent=level===maxLevel?'최대 레벨':state.gold<cost?'골드 부족':'강화 · '+cost.toLocaleString()+' 골드';
  painting.push(nineSlice($('.collect'),$('.collect').disabled?'blue':'green',{stablePixels:true}));
  await Promise.all([...painting,document.fonts.ready]);
  if(token===revision&&!root.hidden&&!busy){root.inert=false;root.setAttribute('aria-busy','false');schedule();}
 }
 async function draw(){
  try{await render();}catch(e){if(!root.hidden){root.inert=false;root.setAttribute('aria-busy','false');toast('내정 화면을 표시하지 못했습니다. '+e.message);schedule();}}
 }
 async function execute(kind){
  if(busy||root.hidden)return;
  const id=selected;busy=true;revision++;root.inert=true;root.setAttribute('aria-busy','true');clearTimeout(timer);
  try{
   await store.transact(state=>{
    if(!governmentUnlocked(state))throw Error('성내 시설이 아직 열리지 않았습니다.');
    if(kind==='initialize')return state.government?.levels?state:government(state);
    return kind==='collect'?collectProduction(state,id):upgradeBuilding(state,id);
   });
   if(kind!=='initialize')toast(kind==='collect'?'생산물 수령 완료':'시설 강화 완료');
  }catch(e){toast(e.message,'error');}
  finally{busy=false;if(!root.hidden)await draw();}
 }
 $('.collect').onclick=()=>{if(selected==='market'){if(!busy)onExchange();}else execute('collect');};
 $('.upgrade').onclick=()=>execute('upgrade');
 store.subscribe(()=>{if(!root.hidden&&!busy)draw();});
 window.addEventListener('focus',()=>{if(!root.hidden&&!busy)draw();});
 return {show(visible){
  clearTimeout(timer);revision++;root.hidden=!visible;host.classList.toggle('government-art',visible);
  if(visible){if(store.get().government?.levels)draw();else execute('initialize');}
 }};
}
