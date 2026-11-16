import {tutorialGate,tutorialAdvance} from './tutorial.js';
import {RULESET,CONTENT_VERSION} from './versions.js';
import {combatant,enemies,reinforcements,roundCount,roundRule,stageReward,arenaRules,arenaUnits,opponentStrategy} from './battle-data.js';
import {runProfile} from './retention.js';
import {stageOf,defaultStageId,stageUnlocked,isBlocked,blockedCells,hardUnlocked,hardRules} from './stages.js';
import {towerDeck} from './tower.js';
import {grantReward} from './services.js';
import {rollSeason,meritRules,HISTORY} from './arena-state.js';
import {createBattle,stepBattle} from './battle-engine.js';
import {seededRandom,periods} from './economy.js';
// startedAt is optional so seeded tests stay reproducible; the UI always supplies it.
export function newRun(state,seed,id,match=null,startedAt,stageId=defaultStageId,difficulty='normal'){
 const stage=stageOf(stageId),hard=!match&&difficulty==='hard';
 must(match||stageUnlocked(state,stage.stageId),'아직 열리지 않은 전투입니다.');
 must(!hard||(!stage.tower&&hardUnlocked(state,stage.stageId)),'어려움 난도가 아직 열리지 않았습니다.');
 const deck=match?[...match.playerOrder]:stage.tower?towerDeck(state,stage):[...state.order];
 must(deck.length>0,'이 층의 조건에 맞는 장수가 없습니다.');
 return {id,seed,...(match?{}:{stageId:stage.stageId}),...(hard?{difficulty:'hard'}:{}),...(startedAt===undefined?{}:{startedAt}),rulesetId:RULESET,contentVersion:CONTENT_VERSION,rngAlgorithm:"mulberry32",fixedDelta:50,draw:0,nextId:1,mode:match?'arena':'campaign',match,profile:{...runProfile(state),...(match?.playerStrategy?{strategy:match.playerStrategy}:{})},deck,round:1,silver:(match?7:stage.startSilver??7)+(state.strategy==='logistics'?1:0),capacity:match?6:3,units:match?arenaUnits(match.playerOrder,0,match.playerLayout):[],gear:[],retries:0,phase:'prepare'};
}
function must(ok,message){if(!ok)throw Error(message);}
export function prepareCommand(run,c){
 tutorialGate(run,c.type);const r=structuredClone(run);must(r.phase==='prepare','전투 준비 중에만 변경할 수 있습니다.');
 const u=r.units.find(v=>v.id===c.id),at=p=>r.units.find(v=>v.x===p.x&&v.y===p.y);
 if(c.type==='summon'){must(r.mode!=='arena','공정 대전에서는 소환할 수 없습니다.');must(r.silver>=3,'은화가 부족합니다.');const slot=Array.from({length:8},(_,x)=>x).find(x=>!at({x,y:-1}));must(slot!==undefined,'대기칸이 가득 찼습니다.');const random=seededRandom(r.seed);let n;for(let i=0;i<=r.draw;i++)n=random();r.draw++;r.silver-=3;r.units.push({id:r.nextId++,hero:r.tutorial&&r.draw<=3?[r.deck[0],r.deck[0],r.deck[2]][r.draw-1]:r.deck[Math.floor(n*r.deck.length)],rank:1,x:slot,y:-1,cost:3});}
 if(c.type==='capacity'){const cost=[4,6,8][r.capacity-3];must(r.mode==='arena'||r.capacity<(stageOf(r.stageId).constraint?.maxUnits??6),'이 층은 출전 인원이 제한됩니다.');must(r.mode!=='arena'&&cost&&r.silver>=cost,'편성 확장에 필요한 은화가 부족하거나 최대 인원입니다.');r.silver-=cost;r.capacity++;}
 if(c.type==='move'){must(u,'선택한 장수가 없습니다.');must(Number.isInteger(c.x)&&c.x>=0&&c.x<8&&Number.isInteger(c.y)&&c.y>=-1&&c.y<=3,'아군 지역에 배치하세요.');must(c.y<0||!isBlocked(r.stageId,c.x,c.y,r.difficulty),'지나갈 수 없는 칸에는 배치할 수 없습니다.');const t=at(c);if(t?.id===u.id)return r;
 if(t&&t.hero===u.hero&&t.rank===u.rank&&t.rank<5&&r.mode!=='arena'){must(!u.gear||r.gear.length<8,'장비 대기칸을 비워주세요.');if(u.gear)r.gear.push(u.gear);t.rank++;r.merges=(r.merges??0)+1;t.cost+=u.cost;r.units=r.units.filter(v=>v.id!==u.id);}
 else{const count=r.units.filter(v=>v.y>=0).length+(u.y<0&&c.y>=0?1:0)-(t&&t.y>=0&&u.y<0?1:0);must(count<=r.capacity,'출전 인원이 가득 찼습니다.');if(t){t.x=u.x;t.y=u.y;}u.x=c.x;u.y=c.y;}}
 if(c.type==='sell'){must(r.mode!=='arena'&&u,'판매할 장수를 선택하세요.');must(u.y<0||r.units.filter(v=>v.y>=0).length>1,'마지막 출전 장수는 판매할 수 없습니다.');must(!u.gear||r.gear.length<8,'장비 대기칸을 비워주세요.');if(u.gear)r.gear.push(u.gear);r.lastSold=u.id;r.silver+=u.trainingSale?0:Math.max(1,Math.floor(u.cost*.5));r.units=r.units.filter(v=>v.id!==u.id);}
 if(c.type==='equip'){must(u&&r.gear[c.index],'장수와 장비를 선택하세요.');const g=r.gear.splice(c.index,1)[0];if(u.gear&&u.gear.type===g.type&&u.gear.rank===g.rank&&g.rank<3)u.gear.rank++;else{if(u.gear)r.gear.push(u.gear);u.gear=g;}}
 tutorialAdvance(r,c.type,run);return r;
}
export function startRound(run){tutorialGate(run,'start');const r=structuredClone(run);must(r.phase==='prepare'&&r.units.some(u=>u.y>=0),'장수를 전장에 배치하세요.');r.snapshot={units:structuredClone(r.units),silver:r.silver,capacity:r.capacity,gear:structuredClone(r.gear)};const arena=r.mode==='arena',enemy=arena?arenaUnits(r.match.opponent.order,1,r.match.opponent.layout):enemies(r.round,r.stageId,r.difficulty),foe=arena?opponentStrategy(r.match):undefined;r.battle=createBattle([...r.units.filter(u=>u.y>=0).map(u=>{const c=combatant(u,0,r.profile,arena);if(r.profile.strategy==='defend'&&r.round>=3&&c.trait==='tank')c.def=Math.floor(c.def*1.1);return c;}),...enemy.map(u=>combatant(u,1,r.profile,arena,foe))],r.mode,r.id+':'+r.round,arena?[]:blockedCells(r.stageId,r.difficulty),arena?{}:{reinforcements:reinforcements(r.round,r.stageId,r.difficulty).map(w=>({at:w.at,units:w.units.map(u=>combatant(u,1,r.profile))})),hazard:stageOf(r.stageId).hazard,fire:stageOf(r.stageId).fireScale});if(r.difficulty==='hard')for(const u of r.battle.units)if(u.side===1&&u.skillParams?.telegraphTicks)u.skillParams={...u.skillParams,telegraphTicks:Math.round(u.skillParams.telegraphTicks*hardRules.telegraph)};if(r.tutorial){if(r.tutorial.step===4)r.tutorial.step=5;for(const u of r.battle.units){if(u.side===1){if(r.round===1){u.hp=u.maxHp=650;u.atk=8;u.def=u.mdef=0;}else if(r.round===roundCount(r.stageId)&&u.hero==='boss'){u.hp=u.maxHp=900;u.atk=20;u.def=u.mdef=0;}else{u.hp=Math.floor(u.hp*.5);u.maxHp=u.hp;u.atk=Math.floor(u.atk*.3);}}else if(r.round===1&&u.hero===r.deck[0])u.mana=Math.min(u.maxMana,Math.max(u.mana,u.maxMana-15));}if(r.round===1)r.battle.units=r.battle.units.filter(u=>u.side===0||u.id===100);}
 r.checkpointTick=0;r.phase='fighting';return r;}
export function finishRound(run){const r=structuredClone(run);must(r.phase==='fighting'&&r.battle?.result,'아직 전투가 끝나지 않았습니다.');r.phase='result';r.outcome=r.battle.result;if(r.tutorial&&r.outcome==='win')r.tutorial.step=r.round===1?6:r.round===roundCount(r.stageId)?14:13;return r;}
export function nextRound(run,gearType=null){const r=structuredClone(run);must(r.mode==='campaign'&&r.phase==='result'&&r.outcome==='win'&&r.round<roundCount(r.stageId),'다음 라운드가 없습니다.');const rule=roundRule(r.round,r.stageId);r.silver+=rule.victorySilver;if(!r.tutorial&&rule.equipment){const {choices,rank}=rule.equipment;r.gear.push({type:choices.includes(gearType)?gearType:choices[Math.floor(r.round/2-1)%choices.length]??choices[0],rank});}if(r.tutorial?.step===6)r.tutorial.step=7;r.lastStatistics=r.battle?.units.map(u=>({id:u.id,hero:u.hero,name:u.name,side:u.side,damage:u.damage,healing:u.healing,casts:u.casts}));r.lastStatisticsTick=r.battle?.tick;r.round++;r.phase='prepare';r.battle=null;return r;}
export function retryRound(run){const r=structuredClone(run);must(r.mode==='campaign'&&r.phase==='result'&&r.outcome==='loss'&&r.retries<2,'재도전할 수 없습니다.');Object.assign(r,structuredClone(r.snapshot));r.retries++;r.phase='prepare';r.battle=null;return r;}
export function settle(state,run,time=Date.now()){
 const s=structuredClone(state);must(run.phase==='result','결과가 확정되지 않았습니다.');if(s.battleReceipts?.[run.id])return s;
 // An old receipt may have been aged out; a run from before that boundary is refused instead of being paid twice.
 must(s.battleRun?.id===run.id||!(s.battleReceiptFloor>0)||(run.startedAt??0)>s.battleReceiptFloor,'보관 기간이 지난 출정은 정산할 수 없습니다.');
 must(run.mode==='arena'||run.outcome!=='win'||run.round===roundCount(run.stageId),'전역을 완료해야 정산할 수 있습니다.');
 s.battleReceipts??={};time=Math.max(time,s.battleClock??0);s.battleClock=time;const day=periods(time).day;let gold=0,score=0,diamonds=0,granted=null,extra=null,merit=0,firstClear=false;
 if(run.tutorial){if(run.outcome==='win'&&!s.tutorial?.rewarded){gold=100;s.tutorial={step:15,rewarded:true,completed:false};}}
 else if(run.mode==='arena'){const a=rollSeason(s,time),expected=1/(1+10**((run.match.opponent.score-a.score)/400));score=Math.round(arenaRules.eloK*((run.outcome==='win'?1:run.outcome==='draw'?.5:0)-expected));a.score=Math.max(0,a.score+score);if(a.rewardDay!==day){a.rewardDay=day;a.rewards=0;}if(a.rewards<arenaRules.dailyLimit&&!run.abandoned){gold=run.outcome==='win'?arenaRules.winGold:arenaRules.otherGold;merit=run.outcome==='win'?meritRules.win:meritRules.other;s.merit=(s.merit??0)+merit;a.rewards++;}
  // Matches played today (abandoned ones do not count); the third pays the daily bonus once.
  if(a.matchDay!==day){a.matchDay=day;a.dayMatches=0;}if(!run.abandoned){a.dayMatches++;a.seasonMatches=(a.seasonMatches??0)+1;if(a.dayMatches===meritRules.dailyMatches)diamonds=meritRules.dailyBonus.freeDiamonds;}
  // The placement used in this match becomes the saved layout for the next one.
  const placed=(run.snapshot?.units??[]).filter(u=>u.y>=0);if(placed.length===run.deck.length)a.layout=Object.fromEntries(placed.map(u=>[u.hero,[u.x,u.y]]));
  a.history=[{opponent:run.match.opponent.name,outcome:run.abandoned?'abandoned':run.outcome,score,time},...(a.history??[])].slice(0,HISTORY);
  a.match=null;s.arena=a;}
 else if(run.outcome==='win'){s.campaign??={cleared:false,day:null,count:0};if(s.campaign.day!==day){s.campaign.day=day;s.campaign.count=0;}
  // First clear is tracked per battle (and separately for 어려움); the daily repeat limit is one shared counter.
  const stage=stageOf(run.stageId),sid=stage.stageId,reward=stageReward(sid),hard=run.difficulty==='hard',mult=hard?hardRules.gold:1;
  const first=hard?!s.campaign.hard?.[sid]?.cleared:sid===defaultStageId?!s.campaign.cleared:!s.campaign.stages?.[sid]?.cleared;
  if(first){firstClear=true;gold=Math.round(reward.firstClearGold*mult);diamonds=reward.firstClearDiamonds??0;
   if(hard)(s.campaign.hard??={})[sid]={cleared:true};
   else{if(sid===defaultStageId)s.campaign.cleared=true;else(s.campaign.stages??={})[sid]={cleared:true};const hero=stage.grantsHero;if(hero&&s.heroes[hero]&&!s.heroes[hero].owned){s.heroes[hero].owned=true;granted=hero;}if(reward.extra){grantReward(s,reward.extra);extra=reward.extra;}}}
  else if(s.campaign.count<reward.dailyRepeatLimit){gold=Math.round(reward.repeatGold*mult);s.campaign.count++;}}
 s.gold+=gold;if(diamonds){s.freeDiamonds+=diamonds;s.diamonds+=diamonds;}s.battleReceipts[run.id]={gold,score,outcome:run.outcome,time,...(firstClear?{firstClear:true}:{}),...(diamonds?{diamonds}:{}),...(granted?{hero:granted}:{}),...(extra?{extra}:{}),...(merit?{merit}:{})};s.battleRun={...run,receipt:s.battleReceipts[run.id]};return s;
}
export function simulate(run){const r=startRound(run);while(!r.battle.result)stepBattle(r.battle);return finishRound(r);}

export function newTutorial(state,seed,id,startedAt){const r=newRun(state,seed,id,null,startedAt);r.tutorial={step:1};r.silver=7;return r;}
