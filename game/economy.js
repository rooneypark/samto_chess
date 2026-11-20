import {generalRoster} from './heroes.js';
import {specs} from './progression.js';
import {treasureDefs} from './treasures.js';
import {marketExchangeLimit} from './government.js';
import {pickupOf,pickupRules,poolLocked,S_SELECT_COST} from './collection.js';
// Weekly choice boxes follow the market level (1/1/2/2/3); the daily gold exchange keeps its own limit.
export const productLimit=(state,p)=>p.period==='week'?Math.max(p.limit,marketExchangeLimit(state)):p.limit;
export const rates={C:.60,B:.30,A:.08,S:.02};
// The named general pool has no C-grade generals, so its B/A/S rates are normalized.
export const generalRates={B:.75,A:.20,S:.05};
export const ratesFor=pool=>pool==='hero'?generalRates:rates;
export const products=[
 {id:'gold',name:'골드 300',currency:'freeDiamonds',price:100,limit:3,period:'day',icon:'gold'},
 {id:'hero',name:'A등급 장수 선택상자',currency:'heroTokens',price:20,limit:1,period:'week',icon:'helmet'},
 {id:'treasure',name:'A등급 보물 선택상자',currency:'treasureTokens',price:20,limit:1,period:'week',icon:'chest'}
];
export const currencyNames={sShards:'S 선택 조각',gold:'골드',diamonds:'다이아',freeDiamonds:'무료 다이아',heroTokens:'장수 교환재료',treasureTokens:'보물 교환재료'};
export const poolEntries=pool=>pool==='hero'?generalRoster.map(h=>({...h,grade:specs[h.id].grade})):pool==='treasure'?treasureDefs:[];
export function periods(time){const day=Math.floor((time+4*3600000)/86400000);return {day:String(day),week:String(Math.floor((day+3)/7))};}
export function remaining(state,p,time=Date.now()){const period=periods(Math.max(time,state.shop.lastTime))[p.period],count=state.shop.limits[p.id];return productLimit(state,p)-(count?.period===period?count.count:0);}
export function seededRandom(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
function spend(s,cost,currency){if(!Number.isSafeInteger(cost)||cost<0||(s[currency]??0)<cost)throw Error(`${currencyNames[currency]}가 부족합니다.`);if(currency==='diamonds'){const free=Math.min(s.freeDiamonds,cost);s.freeDiamonds-=free;s.paidDiamonds-=cost-free;}s[currency]-=cost;}
function award(s,pool,id,drawId){
 if(pool==='treasure'){s.treasures.push({id:drawId,defId:id,star:1});return {id,instanceId:drawId,status:'new'};}
 const h=s.heroes[id];if(!h.owned){h.owned=true;return {id,status:'new'};}if(h.star===5){const amount={C:1,B:2,A:4,S:8}[specs[id].grade];s.heroTokens+=amount;return {id,status:'converted',amount};}h.cards++;return {id,status:'duplicate'};
}
export function applyShopCommand(state,command){
 if(!command.id||typeof command.id!=='string')throw Error('요청 ID가 필요합니다.');
 if(state.shop.receipts[command.id])return state;
 // Receipts older than the retention window are gone; a request issued before that boundary is refused, never re-run.
 const issued=command.issuedAt??command.time;if(issued!==undefined&&Number(issued)<=(state.shop.receiptFloor??-1))throw Error('보관 기간이 지난 요청입니다. 새로 요청해 주세요.');
 const s=structuredClone(state),now=Number(command.time??Date.now());if(!Number.isFinite(now))throw Error('시간 정보 오류');s.shop.lastTime=Math.max(now,s.shop.lastTime);
 let results=[];
 if(command.type==='recruit'){
  const {pool,currency,count}=command,pickup=command.banner==='pickup'?pickupOf(now):null;if(!['hero','treasure'].includes(pool)||!['gold','diamonds'].includes(currency)||![1,10].includes(count))throw Error('잘못된 모집 요청입니다.');
  if(command.banner!==undefined&&command.banner!=='pickup')throw Error('없는 모집입니다.');
  if(pickup&&(pool!=='hero'||currency!==pickupRules.currency))throw Error('픽업 모집은 다이아로만 할 수 있습니다.');
  // Heroes gated behind a campaign chapter are not in the pool until that chapter is cleared.
  const weights=ratesFor(pool),entries=poolEntries(pool).filter(e=>pool!=='hero'||!poolLocked(s,e.id));let lowOnly=true;if(Object.keys(weights).some(g=>!entries.some(e=>e.grade===g)))throw Error('모집 목록을 불러오지 못했습니다.');
  if(!Number.isInteger(command.seed))throw Error('모집 seed가 필요합니다.');
  spend(s,(currency==='gold'?300:100)*count,currency);const random=seededRandom(command.seed),pity=s.shop.pity[pool];
  for(let i=0;i<count;i++){
   const r=random();let grade=pity.s>=99?'S':pity.a>=29?(r<.8?'A':'S'):(()=>{let edge=0;for(const [key,weight] of Object.entries(weights)){edge+=weight;if(r<edge)return key;}return Object.keys(weights).at(-1);})();
   // 10회 모집은 B 이상 1명 확정: if the first nine were all C, the tenth is at least B.
   if(count===10&&i===9&&lowOnly&&grade==='C')grade='B';if(grade!=='C')lowOnly=false;
   // All nations share the same pool; historical account faction never changes the odds.
   const options=entries.filter(e=>e.grade===grade);let entry;
   // 픽업: an S is the pickup S half the time, and always after one miss; an A is one of the two pickup A half the time.
   if(pickup&&grade==='S'){const state=s.shop.pickup??={guaranteed:false};if(state.guaranteed||random()<pickupRules.chance){entry=entries.find(e=>e.id===pickup.s);state.guaranteed=false;}else{const rest=options.filter(e=>e.id!==pickup.s);entry=rest[Math.floor(random()*rest.length)];state.guaranteed=true;}}
   else if(pickup&&grade==='A'&&random()<pickupRules.chance)entry=entries.find(e=>e.id===pickup.a[Math.floor(random()*2)]);
   entry??=options[Math.floor(random()*options.length)];
   pity.s=grade==='S'?0:pity.s+1;pity.a=['A','S'].includes(grade)?0:pity.a+1;
   results.push({...award(s,pool,entry.id,`${command.id}:${i}`),grade});
  }
 }else if(command.type==='s-select'){
  const entry=poolEntries('hero').find(e=>e.id===command.choice&&e.grade==='S');if(!entry||poolLocked(s,entry.id))throw Error('고를 수 없는 장수입니다.');
  spend(s,S_SELECT_COST,'sShards');results=[{...award(s,'hero',entry.id,`${command.id}:0`),grade:'S'}];
 }else if(command.type==='purchase'){
  const p=products.find(p=>p.id===command.product);if(!p)throw Error('없는 상품입니다.');
  if(remaining(s,p,now)<=0)throw Error('구매 한도를 모두 사용했습니다.');
  if(p.id!=='gold'&&!poolEntries(p.id).some(e=>e.grade==='A'&&e.id===command.choice))throw Error('받을 항목을 선택해 주세요.');
  spend(s,p.price,p.currency);if(p.currency==='freeDiamonds')s.diamonds-=p.price;
  if(p.id==='gold'){s.gold+=300;results=[{id:'gold',amount:300,status:'currency'}];}else results=[{...award(s,p.id,command.choice,`${command.id}:0`),grade:'A'}];
  const period=periods(s.shop.lastTime)[p.period];s.shop.limits[p.id]={period,count:productLimit(s,p)-remaining(s,p,now)+1};
 }else throw Error('지원하지 않는 상점 요청입니다.');
 const result={commandId:command.id,pool:command.type==='s-select'?'hero':command.pool??command.product,results,time:now,type:command.type};
 s.shop.receipts[command.id]={...command,time:now,...(issued===undefined?{untimed:true}:{}),results};s.shop.pending=result;return s;
}
