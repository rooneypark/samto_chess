// 내정: four fixed buildings, levels 1-5 (통합명세 "미완료 범위의 명시적 등록"의 P1 제안값).
// Local production on the device clock; a server would own lastCollectedAt.
import {questPeriods} from './services.js';

const HOUR=3600000,STORE_HOURS=8;
export const maxLevel=5;
// Harvesting the farm also yields provisions for 토벌 파견: one per this much gold.
export const provisionRatio=10;
const farmBonus=state=>state.alliance?.guild?(state.alliance.research?.farm??0)*.05:0;
export const upgradeCosts=[100,300,700,1500];
const farmRates=[30,36,42,48,54],dailyAmounts=[1,1,2,2,3];
export const buildings=[
 {id:'farm',name:'농지',effect:level=>`시간당 골드 ${farmRates[level-1]} · 최대 ${STORE_HOURS}시간 보관`},
 {id:'barracks',name:'병영',effect:level=>`매일 무료 훈련권 ${dailyAmounts[level-1]}개`},
 {id:'forge',name:'대장간',effect:level=>`매일 보물 교환재료 ${dailyAmounts[level-1]}개`},
 {id:'market',name:'장터',effect:level=>`주간 선택상자 교환 한도 ${dailyAmounts[level-1]}회`}
];
const ids=buildings.map(b=>b.id);
export const buildingLevel=(state,id)=>Math.min(maxLevel,Math.max(1,state.government?.levels?.[id]??1));
export const marketExchangeLimit=state=>dailyAmounts[buildingLevel(state,'market')-1];
// 황건 토벌 최초 승리로 네 시설이 모두 열린다.
export const governmentUnlocked=state=>!!state.campaign?.cleared;

export function government(state,time=Date.now()){
 const s=structuredClone(state);
 s.government??={started:time,farmClaim:time,clock:time,claims:{}};
 s.government.levels??=Object.fromEntries(ids.map(id=>[id,1]));
 s.government.clock=Math.max(s.government.clock,time);
 return s;
}
// bonus: 동맹 연구 둔전 개간 (0.05 per level).
function farmYield(g,level,bonus=0){const elapsed=Math.min(g.clock-g.farmClaim,STORE_HOURS*HOUR),rate=farmRates[level-1]*(1+bonus),amount=Math.floor(elapsed*rate/HOUR);return {amount,leftover:elapsed-amount*HOUR/rate};}
export function production(state,id,time=Date.now()){
 const s=government(state,time),g=s.government,level=buildingLevel(s,id);
 if(id==='farm')return farmYield(g,level,farmBonus(s)).amount;
 return g.claims[id]===questPeriods(g.clock).day?0:dailyAmounts[level-1];
}
export function collectProduction(state,id,time=Date.now()){
 const s=government(state,time),g=s.government;
 if(!['farm','barracks','forge'].includes(id))throw Error('생산 건물이 아닙니다.');
 const amount=production(s,id,time);if(!amount)throw Error('아직 받을 생산물이 없습니다.');
 if(id==='farm'){s.gold+=amount;s.provisions=(s.provisions??0)+Math.floor(amount/provisionRatio);g.farmClaim=g.clock-farmYield(g,buildingLevel(s,id),farmBonus(s)).leftover;}
 else{g.claims[id]=questPeriods(g.clock).day;if(id==='barracks')s.trainingTickets=(s.trainingTickets??0)+amount;else s.treasureTokens+=amount;}
 return s;
}
// Upgrading is instant. Farm output at the old rate is paid out first so no stored time is re-priced.
export function upgradeBuilding(state,id,time=Date.now()){
 let s=government(state,time);
 if(!ids.includes(id))throw Error('없는 건물입니다.');
 const level=buildingLevel(s,id);if(level>=maxLevel)throw Error('최대 레벨입니다.');
 const cost=upgradeCosts[level-1];if(s.gold<cost)throw Error('골드가 부족합니다.');
 if(id==='farm'&&production(s,'farm',time))s=collectProduction(s,'farm',time);
 s.gold-=cost;s.government.levels[id]=level+1;return s;
}
export function initGovernment({store,dialog,toast,navigate,onArtwork}){
 async function show(){
  if(!governmentUnlocked(store.get())){dialog.open('내정 · 성내 시설','<p>황건 토벌을 처음 승리하면 농지·병영·대장간·장터가 열립니다.</p>');return;}
  if(onArtwork){onArtwork();return;}
  try{if(!store.get().government?.levels)await store.transact(s=>government(s));}catch(e){toast(e.message);return;}
  const s=store.get();
  dialog.open('내정 · 성내 시설','<p>로컬 생산 · 매일 05시 갱신 · 기기 시각 기준</p>'+buildings.map(b=>{const level=buildingLevel(s,b.id),ready=b.id==='market'?0:production(s,b.id),cost=upgradeCosts[level-1];
   return `<section class="service-row"><div><strong>${b.name} Lv.${level}</strong><small>${b.effect(level)}</small>${level<maxLevel?`<small>다음 레벨 · ${b.effect(level+1)}</small>`:'<small>최대 레벨</small>'}</div><button class="action" data-building="${b.id}" ${b.id!=='market'&&!ready?'disabled':''}>${b.id==='market'?'교환 상점':'수령 '+ready}</button><button class="action secondary" data-upgrade="${b.id}" ${level>=maxLevel||s.gold<cost?'disabled':''}>${level>=maxLevel?'최대':'승급 '+cost+'골드'}</button></section>`;}).join('')+`<p>보유 골드 ${s.gold.toLocaleString()}</p><p id="government-error" role="alert"></p>`);
  const fail=e=>{const el=document.querySelector('#government-error');if(el)el.textContent=e.message;else toast(e.message);};
  document.querySelectorAll('[data-building]').forEach(b=>b.onclick=async()=>{if(b.dataset.building==='market'){dialog.dismiss();navigate('shop');return;}b.disabled=true;try{await store.transact(s=>collectProduction(s,b.dataset.building));await show();}catch(e){fail(e);b.disabled=false;}});
  document.querySelectorAll('[data-upgrade]').forEach(b=>b.onclick=async()=>{if(b.disabled)return;b.disabled=true;try{await store.transact(s=>upgradeBuilding(s,b.dataset.upgrade));toast('승급했습니다.');await show();}catch(e){fail(e);b.disabled=false;}});
 }
 return {show};
}
