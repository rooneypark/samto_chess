// Quest progress and mail are saved in the same profile transaction as their cause.
export const questDefs=[
 ['daily_run','day','출정 완료','run',2,50],['daily_merge','day','장수 합성','merge',5,50],['daily_skill','day','전법 사용','skill',20,50],['daily_train','day','장수 훈련','train',1,50],
 ['weekly_run','week','출정 완료','run',10,100],['weekly_win','week','출정 승리','win',5,100],['weekly_merge','week','장수 합성','merge',25,100],['weekly_skill','week','전법 사용','skill',100,100],['weekly_draw','week','장수·보물 모집','draw',3,100]
].map(([id,period,name,event,target,gold])=>({id,period,name,event,target,gold}));
import {bondMissionCandidates,BOND_MISSION_WINS,codexComplete,codexReward,factionTitles,startMissions,startFinalReward} from './collection.js';
import {factions} from './factions.js';
const DAY=86400000;
// Completion bonuses. The weekly bonus is one of the few sources of free diamonds (기획 공백 E1의 제안).
export const periodBonus={day:{gold:100,freeDiamonds:20},week:{gold:500,freeDiamonds:50}};
// 군주 레벨 (종합기획서 7.1): earned by playing, never sold, gives no combat stats.
export const lordMaxLevel=30;
export const lordXpForNext=level=>70*level;
export const lordXp={campaignWin:100,otherRun:20,arenaRun:15,quest:20,tutorial:50};
export function lordLevel(state){let xp=state.services?.lord?.xp??0,level=1;while(level<lordMaxLevel&&xp>=lordXpForNext(level)){xp-=lordXpForNext(level);level++;}return {level,xp,next:level<lordMaxLevel?lordXpForNext(level):0};}
export const lordReward=level=>({gold:50*level,...(level%5===0?{freeDiamonds:100}:{})});
export const unclaimedLordRewards=state=>{const {level}=lordLevel(state),claimed=state.services?.lord?.claimed??{};return Array.from({length:level-1},(_,i)=>i+2).filter(l=>!claimed[l]);};
// 출석: one claim per quest day, a seven-day cycle.
export const attendanceRewards=[{gold:100},{gold:150},{freeDiamonds:20},{gold:200},{trainingTickets:1},{gold:300},{freeDiamonds:50}];
// First achievements (통합명세 P1 제안). Counted from verifiable events only; nothing is back-filled by guess.
export const achievementDefs=[
 {id:'ach_first_clear',name:'첫 승전',text:'황건 토벌 최초 승리',counter:'clears',target:1,reward:{gold:100}},
 {id:'ach_10_runs',name:'백전의 시작',text:'출정 10회 완료',counter:'runs',target:10,reward:{gold:200}},
 {id:'ach_100_merges',name:'합성의 달인',text:'장수 합성 100회',counter:'merges',target:100,reward:{freeDiamonds:50}}
];
const rewardKeys=['gold','freeDiamonds','heroTokens','treasureTokens','trainingTickets','sShards','merit'];
export const grantReward=(s,reward)=>grant(s,reward);
function grant(s,reward){for(const [currency,amount] of Object.entries(reward)){if(!rewardKeys.includes(currency)||!Number.isSafeInteger(amount)||amount<0)throw Error('보상 정보 오류');s[currency]=(s[currency]??0)+amount;if(currency==='freeDiamonds')s.diamonds+=amount;}}
export function achievementProgress(state,def){const n=def.counter==='clears'?(state.campaign?.cleared?1:0):(state.services?.lifetime?.[def.counter]??0);return Math.min(def.target,n);}
export function questPeriods(t){const d=Math.floor((t+14400000)/DAY);return {day:String(d),week:String(Math.floor((d+3)/7))};}
export function prepareServices(s,time=Date.now()){
 s.services??={clock:0,periods:{},quests:{},seen:{},mail:[],claims:{}};
 const q=s.services;q.lifetime??={runs:0,wins:0,merges:0};q.lifetime.draws??=0;q.lifetime.arena??=0;q.bondMissions??={};q.codex??={};q.titles??=[];q.start??={day0:Number(questPeriods(time).day),claimed:{}};q.achievements??={};q.lord??={xp:0,claimed:{}};q.attendance??={day:null,index:0};q.clock=Math.max(q.clock,time);const periods=questPeriods(q.clock);
 for(const kind of ['day','week'])if(q.periods[kind]!==periods[kind]){
  const defs=questDefs.filter(d=>d.period===kind),oldPeriod=q.periods[kind];
  if(oldPeriod!==undefined){
   const boundary=kind==='day'?(Number(oldPeriod)+1)*DAY-14400000:((Number(oldPeriod)+1)*7-3)*DAY-14400000;
   for(const d of defs){const p=q.quests[d.id];if(p&&!p.claimed&&p.progress>=p.target)q.mail.push({id:`quest:${oldPeriod}:${d.id}`,title:d.name+' 미수령 보상',body:'지난 기간에 완료한 임무 보상입니다.',createdAt:boundary,expireAt:boundary+7*DAY,attachments:{gold:d.gold},claimedAt:null});}
   if(defs.every(d=>q.quests[d.id]?.claimed)&&!q.claims[`bonus:${kind}:${oldPeriod}`])q.mail.push({id:`bonus:${kind}:${oldPeriod}`,title:'임무 완료 보너스',body:'지난 기간 완료 보너스입니다.',createdAt:boundary,expireAt:boundary+7*DAY,attachments:{...periodBonus[kind]},claimedAt:null});
  }
  q.periods[kind]=periods[kind];
  for(const d of defs){const alternate=d.id==='daily_train'&&Object.values(s.heroes).filter(h=>h.owned).every(h=>h.level>=20);q.quests[d.id]={progress:0,claimed:false,target:alternate?3:d.target,event:alternate?'run':d.event};}
 }
 return q;
}
// The mark stores the quest week it was made in so retention.js can age it out safely.
function count(q,id,type,amount){if(q.seen[id]!==undefined)return false;q.seen[id]=Number(q.periods.week);for(const d of questDefs){const p=q.quests[d.id];if(p.event===type)p.progress=Math.min(p.target,p.progress+amount);}const life={run:'runs',win:'wins',merge:'merges',draw:'draws'}[type];if(life)q.lifetime[life]+=amount;return true;}
export function trackServices(before,after,time=Date.now()){
 const q=prepareServices(after,time);
 if(after.tutorial?.step===15&&Object.entries(after.heroes).some(([id,h])=>h.level>(before.heroes[id]?.level??h.level))){after.tutorial.completed=true;after.tutorial.step=16;}
 for(const [id,h] of Object.entries(after.heroes))if(h.level>(before.heroes[id]?.level??h.level))count(q,`train:${before.revision}:${id}`,'train',h.level-before.heroes[id].level);
 for(const [id,r] of Object.entries(after.shop.receipts))if(!before.shop.receipts[id]&&r.type==='recruit')count(q,'draw:'+id,'draw',r.count);
 const run=after.battleRun,prev=before.battleRun;
 if(run&&!run.tutorial){
  if(prev?.id===run.id&&(run.merges??0)>(prev.merges??0))count(q,`${run.id}:merge:${run.merges}`,'merge',run.merges-(prev.merges??0));
  for(const e of run.battle?.log??[])if(e.type==='skill'&&run.battle.units.some(u=>u.id===e.source&&u.side===0))count(q,'skill:'+e.id,'skill',1);
 }
 for(const [id,r] of Object.entries(after.battleReceipts??{}))if(!before.battleReceipts?.[id]&&run?.id===id&&!run.tutorial&&!run.abandoned){if(count(q,'run:'+id,'run',1))q.lord.xp+=run.mode==='arena'?lordXp.arenaRun:r.outcome==='win'&&!String(run.stageId).startsWith('tower_')?lordXp.campaignWin:lordXp.otherRun;if(run.mode==='arena')q.lifetime.arena++;if(r.outcome==='win'&&count(q,'win:'+id,'win',1)&&run.mode!=='arena')for(const m of Object.values(q.bondMissions))if(!m.claimed)m.wins=Math.min(BOND_MISSION_WINS,m.wins+1);}
 // 인연 임무 opens the moment exactly one member of a bond is missing; it then stays until claimed.
 for(const c of bondMissionCandidates(after))q.bondMissions[c.bond]??={hero:c.hero,wins:0,claimed:false};
 if(after.tutorial?.rewarded&&!before.tutorial?.rewarded)q.lord.xp+=lordXp.tutorial;
 return after;
}
export function serviceCommand(state,c,time=Date.now()){
 const s=structuredClone(state),q=prepareServices(s,time);
 if(c.type==='quest'){
  const d=questDefs.find(d=>d.id===c.id),p=q.quests[c.id];if(!d||!p||p.progress<p.target)throw Error('아직 완료하지 않은 임무입니다.');if(p.claimed)return s;
  p.claimed=true;s.gold+=d.gold;q.lord.xp+=lordXp.quest;
 }else if(c.type==='bonus'){
  const defs=questDefs.filter(d=>d.period===c.period),key=`bonus:${c.period}:${q.periods[c.period]}`;
  if(!defs.length||!defs.every(d=>q.quests[d.id].claimed))throw Error('해당 기간의 임무 보상을 모두 받으세요.');
  if(!q.claims[key]){grant(s,periodBonus[c.period]);q.claims[key]=true;}
 }else if(c.type==='lord-reward'){
  // Claims every level reward reached so far in one command.
  const levels=unclaimedLordRewards(s);if(!levels.length)throw Error('받을 군주 레벨 보상이 없습니다.');
  for(const level of levels){grant(s,lordReward(level));q.lord.claimed[level]=true;}
 }else if(c.type==='attendance'){
  if(q.attendance.day===q.periods.day)throw Error('오늘은 이미 출석했습니다.');
  grant(s,attendanceRewards[q.attendance.index%attendanceRewards.length]);q.attendance={day:q.periods.day,index:q.attendance.index+1};
 }else if(c.type==='bond-mission'){
  const m=q.bondMissions[c.id];if(!m)throw Error('열리지 않은 인연 임무입니다.');if(m.wins<BOND_MISSION_WINS)throw Error('아직 완료하지 않은 인연 임무입니다.');
  if(!m.claimed){const h=s.heroes[m.hero];if(!h)throw Error('장수 데이터 오류');if(h.owned)h.cards++;else h.owned=true;m.claimed=true;}
 }else if(c.type==='codex'){
  if(!factions[c.faction])throw Error('없는 세력입니다.');if(!codexComplete(s,c.faction))throw Error('아직 모으지 못한 장수가 있습니다.');
  if(!q.codex[c.faction]){grant(s,codexReward);q.codex[c.faction]=true;q.titles.push(factionTitles[c.faction]);}
 }else if(c.type==='start-mission'){
  const today=Number(q.periods.day)-q.start.day0+1;
  if(c.day==='final'){if(!startMissions.every(m=>q.start.claimed[m.day]))throw Error('7일 임무를 모두 완료하세요.');if(!q.start.claimed.final){grant(s,startFinalReward);q.start.claimed.final=true;}}
  else{const m=startMissions.find(m=>m.day===c.day);if(!m)throw Error('없는 임무입니다.');if(m.day>today)throw Error(m.day+'일차에 열립니다.');if(!m.done(s))throw Error('아직 완료하지 않은 임무입니다.');if(!q.start.claimed[m.day]){grant(s,m.reward);q.start.claimed[m.day]=true;}}
 }else if(c.type==='achievement'){
  const d=achievementDefs.find(d=>d.id===c.id);if(!d)throw Error('없는 업적입니다.');
  if(achievementProgress(s,d)<d.target)throw Error('아직 달성하지 않은 업적입니다.');
  if(!q.achievements[d.id]){grant(s,d.reward);q.achievements[d.id]=true;}
 }else if(c.type==='mail'||c.type==='delete-mail'){
  const m=q.mail.find(m=>m.id===c.id);if(!m)throw Error('우편을 찾지 못했습니다.');
  if(c.type==='delete-mail'){if(!m.claimedAt&&m.expireAt>q.clock&&!c.confirm)throw Error('첨부 보상이 남아 있습니다. 삭제하면 받을 수 없습니다.');q.mail=q.mail.filter(m=>m.id!==c.id);}
  else if(!m.claimedAt){if(m.expireAt<=q.clock)throw Error('수령 기간이 지난 우편입니다.');grant(s,m.attachments);m.claimedAt=q.clock;}
 }else throw Error('지원하지 않는 보상 요청입니다.');
 return s;
}
