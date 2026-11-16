// 군웅대전 보강 (종합기획서 12.3~12.4): 상대 풀, 티어, 시즌, 군공과 군공 상점, 방어 편성.
// Local simulator: every opponent is an NPC with a fixed formation. Numbers are proposals.
import {heroes} from './heroes.js';
import {specs} from './progression.js';
import {periods} from './economy.js';
import {prepareServices} from './services.js';

const DAY=86400000;
export const tiers=[{min:0,name:'병졸'},{min:950,name:'백부장'},{min:1050,name:'교위'},{min:1150,name:'장군'},{min:1300,name:'대장군'},{min:1500,name:'천하무쌍'}];
export const tierOf=score=>tiers.findLast(t=>score>=t.min);
export const tierIndex=score=>tiers.indexOf(tierOf(score));
export const seasonRewards=[{freeDiamonds:100,sShards:5},{freeDiamonds:200,sShards:5},{freeDiamonds:300,sShards:10},{freeDiamonds:500,sShards:10},{freeDiamonds:700,sShards:15},{freeDiamonds:1000,sShards:20}];
export const SEASON_DAYS=28;
export const seasonOf=time=>Math.floor(Number(periods(time).day)/SEASON_DAYS);
export const seasonEndsAt=time=>(seasonOf(time)+1)*SEASON_DAYS*DAY-4*3600000;
export const meritRules={win:10,other:4,dailyMatches:3,dailyBonus:{freeDiamonds:10}};

// Twenty NPC opponents across the score range, each a single-faction or mixed line-up with its own strategy.
const byFaction=f=>heroes.filter(h=>h.faction===f).sort((a,b)=>'SABC'.indexOf(specs[a.id].grade)-'SABC'.indexOf(specs[b.id].grade)).map(h=>h.id);
const names=['청운','솔바람','백운','한빛','강바람','물안개','새벽달','먹구름','산울림','여울','단풍','서리','노을','바위','파도','번개','솔개','은하','불꽃','용오름'];
const strategies=['vanguard','strategist','vanguard','logistics'];
export const opponentPool=names.map((name,i)=>{
 const faction=['위','촉','오','군웅'][i%4],roster=byFaction(faction),other=byFaction(['촉','오','군웅','위'][i%4]);
 // Stronger opponents field higher grades: weaker ones start further down the faction list.
 const start=Math.max(0,Math.min(roster.length-6,Math.floor((19-i)/4))),order=i%5===4?[...roster.slice(start,start+4),...other.slice(0,2)]:roster.slice(start,start+6);
 return {id:'npc'+(i+1),name,score:820+i*38,strategy:strategies[i%4],order};
});
// The three opponents nearest to the player's score; `offset` pages through the rest.
export function opponentsFor(score,offset=0){
 const sorted=[...opponentPool].sort((a,b)=>Math.abs(a.score-score)-Math.abs(b.score-score)||a.score-b.score);
 return [0,1,2].map(i=>sorted[(offset*3+i)%sorted.length]);
}
// 금지 장수 주간: two S or A heroes sit out each week, for both sides. A banned hero in an NPC line-up is
// replaced by a common soldier that is not already in it.
const banPool=heroes.filter(h=>['S','A'].includes(specs[h.id].grade)).map(h=>h.id);
export const bannedHeroes=time=>{const week=Number(periods(time).week);return [banPool[(week*7)%banPool.length],banPool[(week*7+11)%banPool.length]];};
export function applyBans(order,time){const banned=bannedHeroes(time),spare=['infantry','archer','tactician'].filter(id=>!order.includes(id));return order.map(id=>banned.includes(id)?spare.shift()??id:id);}
export const HISTORY=10;
export const emptyArena=()=>({score:1000,match:null,rewardDay:null,rewards:0});

// Season rollover: the old season's tier reward goes to the mail, the score is pulled halfway back to 1000.
export function rollSeason(s,time){
 const a=s.arena??=emptyArena(),season=seasonOf(time);
 if(a.season===season)return a;
 if(a.season!==undefined&&(a.seasonMatches??0)>0){
  const q=prepareServices(s,time),tier=tierIndex(a.score),boundary=(a.season+1)*SEASON_DAYS*DAY-4*3600000,id='arena-season:'+a.season;
  if(!q.mail.some(m=>m.id===id))q.mail.push({id,title:'군웅대전 시즌 보상',body:tiers[tier].name+' 등급으로 시즌을 마쳤습니다.',createdAt:boundary,expireAt:boundary+30*DAY,attachments:{...seasonRewards[tier]},claimedAt:null});
  a.score=Math.round((a.score-1000)/2+1000);
 }
 a.season=season;a.seasonMatches=0;return a;
}

// 군공 상점: weekly limits. The hero card rotates through the A grade by week.
const aHeroes=heroes.filter(h=>specs[h.id].grade==='A').map(h=>h.id);
export function meritShop(time){
 const week=Number(periods(time).week);
 return [{id:'card',name:heroes.find(h=>h.id===aHeroes[week%aHeroes.length]).name+' 카드 1장',hero:aHeroes[week%aHeroes.length],price:80,limit:1},
  {id:'treasure',name:'보물 교환재료 5개',reward:{treasureTokens:5},price:30,limit:3},
  {id:'hero',name:'장수 교환재료 5개',reward:{heroTokens:5},price:40,limit:2}];
}
export const meritBought=(state,item,time)=>{const b=state.arena?.shop;return b?.week===periods(time).week?b.counts?.[item]??0:0;};
export function arenaCommand(state,c,time=Date.now()){
 const s=structuredClone(state),a=rollSeason(s,time);
 if(c.type==='season')return s;
 if(c.type==='defense'){
  // The formation other players would fight while this player is away. Stored now, used once matches are online.
  a.defense={order:[...s.order],layout:a.layout??null,strategy:s.strategy??'vanguard',savedAt:time};return s;
 }
 if(c.type==='buy'){
  const item=meritShop(time).find(i=>i.id===c.item);if(!item)throw Error('없는 상품입니다.');
  const week=periods(time).week;if(a.shop?.week!==week)a.shop={week,counts:{}};
  if((a.shop.counts[item.id]??0)>=item.limit)throw Error('이번 주 구매 한도를 모두 사용했습니다.');
  if((s.merit??0)<item.price)throw Error('군공이 부족합니다.');
  s.merit-=item.price;a.shop.counts[item.id]=(a.shop.counts[item.id]??0)+1;
  if(item.hero){const h=s.heroes[item.hero];if(h.owned)h.cards++;else h.owned=true;}
  else for(const [k,n] of Object.entries(item.reward))s[k]+=n;
  return s;
 }
 throw Error('지원하지 않는 대전 요청입니다.');
}
