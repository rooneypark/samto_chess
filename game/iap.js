// 상품과 시험 결제 (기획서 수익화). LOCAL SIMULATOR: no payment provider is called and nothing is charged.
// Every order is recorded with test:true so a real billing integration can tell them apart later.
// Prices and contents are proposals.
import {periods} from './economy.js';
import {lordLevel} from './services.js';

const DAY=86400000;
export const diamondPacks=[
 {id:'d60',name:'한 줌',price:1200,diamonds:60},{id:'d320',name:'한 자루',price:5900,diamonds:320},{id:'d700',name:'한 상자',price:12000,diamonds:700},
 {id:'d2300',name:'한 수레',price:37000,diamonds:2300},{id:'d4300',name:'한 창고',price:65000,diamonds:4300},{id:'d8400',name:'국고',price:119000,diamonds:8400}
];
export const firstGift={id:'first',name:'첫 결제 선물',price:1100,diamonds:100,grant:{heroTokens:20,gold:1000}};
export const monthly={id:'monthly',name:'군량 보급 (30일)',price:5900,days:30,diamonds:300,daily:80};
export const fund={id:'fund',name:'군주 성장 기금',price:12000,levels:{5:500,10:800,15:1000,20:1200,25:1200,30:1300}};
export const products=[firstGift,monthly,fund,...diamondPacks];
export const emptyIap=()=>({orders:{},doubled:{},spent:0});
export function iapStatus(state,time=Date.now()){
 const i=state.iap??emptyIap(),day=periods(time).day,level=lordLevel(state).level;
 return {...i,firstBought:!!i.first,monthlyActive:(i.monthly?.until??0)>time,monthlyDays:Math.max(0,Math.ceil(((i.monthly?.until??0)-time)/DAY)),monthlyClaimable:(i.monthly?.until??0)>time&&i.monthly.claimDay!==day,
  fundBought:!!i.fund,fundClaimable:i.fund?Object.keys(fund.levels).map(Number).filter(l=>l<=level&&!i.fund.claimed[l]):[]};
}
const paid=(s,n)=>{s.paidDiamonds+=n;s.diamonds+=n;},free=(s,n)=>{s.freeDiamonds+=n;s.diamonds+=n;};
export function iapCommand(state,c,time=Date.now()){
 const s=structuredClone(state),i=s.iap??=emptyIap();
 if(c.type==='purchase'){
  if(typeof c.id!=='string'||!c.id)throw Error('주문 ID가 필요합니다.');
  if(i.orders[c.id])return state;                       // the same order is never applied twice
  const p=products.find(p=>p.id===c.product);if(!p)throw Error('없는 상품입니다.');
  if(p===firstGift){if(i.first)throw Error('이미 받은 상품입니다.');i.first=true;paid(s,p.diamonds);s.heroTokens+=p.grant.heroTokens;s.gold+=p.grant.gold;}
  else if(p===monthly){const from=Math.max(time,i.monthly?.until??0);i.monthly={until:from+p.days*DAY,claimDay:i.monthly?.claimDay??null};paid(s,p.diamonds);}
  else if(p===fund){if(i.fund)throw Error('이미 구매한 상품입니다.');i.fund={claimed:{}};}
  else{const double=!i.doubled[p.id];i.doubled[p.id]=true;paid(s,p.diamonds*(double?2:1));}
  i.orders[c.id]={product:p.id,price:p.price,time,test:true};i.spent+=p.price;return s;
 }
 if(c.type==='monthly-claim'){
  const day=periods(time).day;if(!((i.monthly?.until??0)>time))throw Error('군량 보급 기간이 아닙니다.');
  if(i.monthly.claimDay===day)throw Error('오늘은 이미 받았습니다.');i.monthly.claimDay=day;free(s,monthly.daily);return s;
 }
 if(c.type==='fund-claim'){
  if(!i.fund)throw Error('군주 성장 기금을 구매해야 합니다.');
  const levels=iapStatus(s,time).fundClaimable;if(!levels.length)throw Error('받을 기금 보상이 없습니다.');
  for(const l of levels){free(s,fund.levels[l]);i.fund.claimed[l]=true;}return s;
 }
 throw Error('지원하지 않는 상품 요청입니다.');
}
