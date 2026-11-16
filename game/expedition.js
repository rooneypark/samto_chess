// 토벌 파견 (종합기획서 7.5): send three heroes, collect two hours later. No battle is played.
// Sent heroes stay usable everywhere else. Provisions come from the farm (government.js). Numbers are proposals.
import {heroes} from './heroes.js';
import {specs} from './progression.js';
import {activeBonds} from './bonds.js';
import {treasureDefs} from './treasures.js';
import {periods,seededRandom} from './economy.js';
import {unlocked,lockText} from './unlocks.js';

const HOUR=3600000;
export const expeditionRules={duration:2*HOUR,slots:2,daily:4,team:3,provisions:20,factionBonus:.1,bondBonus:.2,treasureChance:.05};
export const sites=[
 {id:'yellow',name:'황건 잔당 소탕',requires:'yellow_03',faction:'촉',power:250,reward:{gold:120,treasureTokens:1}},
 {id:'sishui',name:'사수관 순찰',requires:'sishui_03',faction:'오',power:600,reward:{gold:200,treasureTokens:2,heroTokens:1}},
 {id:'hulao',name:'호뢰관 정찰',requires:'hulao_03',faction:'위',power:1000,reward:{gold:300,treasureTokens:3,heroTokens:2}},
 {id:'guandu',name:'관도 보급로 차단',requires:'guandu_03',faction:'군웅',power:1500,reward:{gold:420,treasureTokens:4,heroTokens:3}},
 {id:'yiling',name:'이릉 잔불 정리',requires:'yiling_03',faction:'촉',power:2000,reward:{gold:560,treasureTokens:5,heroTokens:4}}
];
const gradePower={C:0,B:20,A:40,S:70};
export const heroPower=(state,id)=>{const h=state.heroes[id];return h.level*10+h.star*30+gradePower[specs[id].grade];};
export const siteOpen=(state,site)=>!!state.campaign?.stages?.[site.requires]?.cleared;
export function teamBonus(site,ids){
 const sameFaction=ids.filter(id=>heroes.find(h=>h.id===id).faction===site.faction).length;
 const bond=activeBonds(ids.map(hero=>({hero}))).length>0;
 return {sameFaction,bond,rate:sameFaction*expeditionRules.factionBonus+(bond?expeditionRules.bondBonus:0)};
}
export function expeditionStatus(state,time=Date.now()){
 const e=state.expedition??{day:'',count:0,slots:[]},day=periods(time).day;
 return {slots:e.slots,count:e.day===day?e.count:0,day,busy:new Set(e.slots.flatMap(s=>s.heroes))};
}
const hash=text=>{let h=2166136261;for(const ch of text){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
export function expeditionCommand(state,c,time=Date.now()){
 if(!unlocked(state,'expedition'))throw Error(lockText('expedition'));
 const s=structuredClone(state),status=expeditionStatus(s,time),e=s.expedition={day:status.day,count:status.count,slots:status.slots};
 if(c.type==='send'){
  const site=sites.find(x=>x.id===c.site);if(!site||!siteOpen(s,site))throw Error('아직 열리지 않은 파견지입니다.');
  if(typeof c.id!=='string'||!c.id||e.slots.some(x=>x.id===c.id))throw Error('요청 ID 오류');
  if(e.slots.length>=expeditionRules.slots)throw Error('동시에 '+expeditionRules.slots+'부대까지 보낼 수 있습니다.');
  if(e.count>=expeditionRules.daily)throw Error('오늘의 파견 횟수를 모두 사용했습니다.');
  const ids=c.heroes;if(!Array.isArray(ids)||ids.length!==expeditionRules.team||new Set(ids).size!==ids.length||!ids.every(id=>s.heroes[id]?.owned))throw Error('보유 장수 '+expeditionRules.team+'명을 고르세요.');
  if(ids.some(id=>status.busy.has(id)))throw Error('이미 파견 중인 장수가 있습니다.');
  if(ids.reduce((n,id)=>n+heroPower(s,id),0)<site.power)throw Error('전투력이 부족합니다. 필요 '+site.power);
  if((s.provisions??0)<expeditionRules.provisions)throw Error('군량이 부족합니다. 내정 농지에서 수확하세요.');
  s.provisions-=expeditionRules.provisions;e.count++;e.slots.push({id:c.id,site:site.id,heroes:[...ids],startedAt:time,endsAt:time+Math.round(expeditionRules.duration*(1-(s.alliance?.guild?(s.alliance.research?.march??0)*.05:0)))});
  return s;
 }
 if(c.type==='claim'){
  const slot=e.slots.find(x=>x.id===c.id);if(!slot)throw Error('파견 기록을 찾지 못했습니다.');
  if(time<slot.endsAt)throw Error('아직 돌아오지 않았습니다.');
  const site=sites.find(x=>x.id===slot.site),{rate}=teamBonus(site,slot.heroes),got={};
  for(const [k,n] of Object.entries(site.reward)){got[k]=Math.round(n*(1+rate));s[k]+=got[k];}
  // A low chance of a C or B treasure, decided by the dispatch id so a retried claim cannot re-roll it.
  const random=seededRandom(hash(slot.id));
  if(random()<expeditionRules.treasureChance){const pool=treasureDefs.filter(d=>d.grade==='C'||d.grade==='B'),def=pool[Math.floor(random()*pool.length)];s.treasures.push({id:'exp-'+slot.id.replace(/[^A-Za-z0-9_-]/g,''),defId:def.id,star:1});got.treasure=def.name;}
  e.slots=e.slots.filter(x=>x.id!==slot.id);e.last={site:site.id,got};
  return s;
 }
 throw Error('지원하지 않는 파견 요청입니다.');
}
