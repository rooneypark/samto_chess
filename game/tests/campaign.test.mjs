// Campaign structure (stage registry, unlock chain, blocked cells, enemy generals) and the
// economy additions that came with it (first-clear diamonds, achievements, building levels).
import test from 'node:test';
import assert from 'node:assert/strict';
import {heroes} from '../heroes.js';
import {createGameStore,validateSave} from '../store.js';
import {stages,stageOrder,defaultStageId,stageUnlocked,stageStatus,currentStage,isBlocked} from '../stages.js';
import {combatant,enemies,roundCount} from '../battle-data.js';
import {newRun,prepareCommand,startRound,settle} from '../battle-run.js';
import {createBattle,stepBattle} from '../battle-engine.js';
import {serviceCommand,prepareServices,trackServices,achievementDefs,achievementProgress,periodBonus} from '../services.js';
import {government,production,collectProduction,upgradeBuilding,buildingLevel,upgradeCosts,governmentUnlocked} from '../government.js';
import {applyShopCommand,remaining,products} from '../economy.js';

const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
const fresh=()=>createGameStore(memory()).get();
const clear=(state,ids)=>{const s=structuredClone(state);s.campaign={cleared:ids.includes(defaultStageId),day:null,count:0,stages:Object.fromEntries(ids.filter(id=>id!==defaultStageId).map(id=>[id,{cleared:true}]))};prepareServices(s).lord.xp=4000;return s;};
const wonRun=(state,stageId,id)=>{const r=newRun(state,3,id,null,Date.now(),stageId);r.round=roundCount(stageId);r.phase='result';r.outcome='win';return r;};

test('nine battles are defined, valid and chained by unlocks',()=>{
 assert.equal(stageOrder.length,24);assert.deepEqual(stageOrder.slice(0,9),['yellow_turban_01','yellow_02','yellow_03','sishui_01','sishui_02','sishui_03','hulao_01','hulao_02','hulao_03']);
 const p={heroes:Object.fromEntries(heroes.map(h=>[h.id,{level:1,star:1,owned:true,treasure:null}])),treasures:[],order:[]};
 for(const id of stageOrder){const s=stages[id];assert.equal(s.rounds.length,5,id);assert.ok(s.reward.firstClearGold>0&&s.reward.dailyRepeatLimit===10,id);
  for(const r of s.rounds){const seen=new Set();for(const u of enemies(r.round,id)){const c=combatant(u,1,p);assert.ok(c.hp>0&&c.atk>0&&c.name,id);assert.ok(u.y>=4&&u.y<8&&u.x>=0&&u.x<8&&!isBlocked(id,u.x,u.y),`${id} r${r.round} position`);assert.ok(!seen.has(u.x+','+u.y),`${id} r${r.round} overlap`);seen.add(u.x+','+u.y);}
   // Early rounds must stay small: every battle restarts with seven silver.
   if(r.round===1)assert.ok(r.enemies.length<=3,id);}
  for(const need of s.requires??[])assert.ok(stageOrder.indexOf(need)<stageOrder.indexOf(id),id);}
 let s=fresh();
 assert.deepEqual(stageOrder.map(id=>stageStatus(s,id)),['open',...Array(stageOrder.length-1).fill('locked')]);assert.equal(currentStage(s),'yellow_turban_01');
 assert.throws(()=>newRun(s,1,'x',null,undefined,'yellow_02'),/열리지 않은/);
 s=clear(s,['yellow_turban_01','yellow_02']);
 assert.deepEqual(stageOrder.slice(0,4).map(id=>stageStatus(s,id)),['cleared','cleared','open','locked']);assert.equal(currentStage(s),'yellow_03');
 assert.equal(currentStage({...s,selectedStage:'yellow_turban_01'}),'yellow_turban_01');assert.equal(currentStage({...s,selectedStage:'hulao_03'}),'yellow_03');
 assert.equal(newRun(s,1,'x',null,undefined,'yellow_03').stageId,'yellow_03');
});

test('first clear is paid per battle, the repeat limit is shared, and a campaign finale can add its general',()=>{
 const store=createGameStore(memory());
 const play=(stageId,id)=>{const r=wonRun(store.get(),stageId,id);store.update(s=>({...s,battleRun:r}));store.update(s=>settle(s,r,Date.now()));const receipt=store.get().battleReceipts[id];store.update(s=>({...s,battleRun:null}));return receipt;};
 assert.deepEqual([play('yellow_turban_01','a').gold,store.get().freeDiamonds],[100,30]);
 assert.equal(play('yellow_turban_01','b').gold,20);
 assert.equal(play('yellow_02','c').gold,100);assert.equal(store.get().freeDiamonds,60);
 assert.ok(store.get().campaign.stages.yellow_02.cleared&&store.get().campaign.cleared);
 // Nine more repeats use up the shared daily counter of ten; the next one pays nothing.
 for(let i=0;i<9;i++)assert.equal(play(i%2?'yellow_turban_01':'yellow_02','r'+i).gold,20);
 assert.equal(play('yellow_02','over').gold,0);
 // A first clear still pays after the repeat limit is used up.
 assert.equal(play('yellow_03','d').gold,100);
 // 사수관 3전투: 화웅 joins once.
 store.update(s=>clear(s,stageOrder.slice(0,5)));assert.equal(store.get().heroes.huaxiong.owned,false);
 const finale=play('sishui_03','e');assert.equal(finale.hero,'huaxiong');assert.ok(store.get().heroes.huaxiong.owned);
 assert.equal(play('sishui_03','f').hero,undefined);validateSave(store.get());
});

test('blocked cells cannot be entered, crossed or deployed on',()=>{
 assert.deepEqual(stages.sishui_01.board.blocked.map(c=>c.x).sort(),[0,1,5,6,7]);assert.ok(isBlocked('sishui_01',0,4)&&!isBlocked('sishui_01',3,4)&&!isBlocked(defaultStageId,0,4));
 const s=clear(fresh(),stageOrder.slice(0,3)),p=s;
 // A melee unit on the far left must walk around the wall through the three-cell gate.
 const walker=combatant({id:1,hero:'infantry',rank:1,x:0,y:3},0,p),target=combatant(enemies(1,'sishui_01')[0],1,p);target.x=0;target.y=6;target.ready=99999;
 const b=createBattle([walker,target],'campaign','wall',stages.sishui_01.board.blocked);const visited=[];
 for(let i=0;i<400&&!b.result;i++){stepBattle(b);visited.push(b.units[0].x+','+b.units[0].y);}
 assert.ok(!visited.some(c=>b.blocked.includes(c)),'walked through a wall');assert.ok(visited.some(c=>['2,4','3,4','4,4'].includes(c)),'did not use the gate');
 assert.ok(b.log.some(e=>e.type==='attack'&&e.source===1),'never reached the target');
 // Without the wall the same unit walks straight up.
 const open=createBattle([walker,target]);for(let i=0;i<40;i++)stepBattle(open);assert.ok(open.units[0].y>=4&&open.units[0].x===0);
 // Deployment rows are never blocked in the authored stages, but the command still refuses blocked cells.
 let r=newRun(s,1,'deploy',null,undefined,'sishui_01');r.units=[{id:1,hero:'15',rank:1,x:0,y:-1,cost:3}];
 stages.sishui_01.board.blocked.push({x:2,y:2});
 try{assert.throws(()=>prepareCommand(r,{type:'move',id:1,x:2,y:2}),/지나갈 수 없는/);assert.equal(prepareCommand(r,{type:'move',id:1,x:3,y:2}).units[0].y,2);}
 finally{stages.sishui_01.board.blocked.pop();}
 const started=startRound(prepareCommand(r,{type:'move',id:1,x:3,y:3}));assert.equal(started.battle.blocked.length,5);
});

test('an enemy general uses stage-defined growth, never the player profile or strategy',()=>{
 const boss=enemies(5,'hulao_03')[0];assert.deepEqual([boss.hero,boss.fixed,boss.title],['119',{level:15,star:3},'동탁군 여포']);
 const weak={heroes:Object.fromEntries(heroes.map(h=>[h.id,{level:1,star:1,owned:true,treasure:null}])),treasures:[],order:[],strategy:'vanguard'};
 const strong=structuredClone(weak);strong.heroes['119']={level:20,star:5,owned:true,treasure:'t'};strong.treasures=[{id:'t',defId:'dragon',star:5}];strong.strategy='strategist';
 const a=combatant(boss,1,weak),b=combatant(boss,1,strong),mine=combatant({id:1,hero:'119',rank:1,x:3,y:3},0,strong);
 assert.deepEqual([a.hp,a.atk,a.star,a.skillPower],[b.hp,b.atk,b.star,b.skillPower]);assert.equal(a.name,'동탁군 여포');assert.equal(a.star,3);
 assert.equal(a.hp,Math.floor(1200*(1+.03*14+.08*2)*2.6*1.05));assert.ok(mine.atk>a.atk&&mine.name==='여포');
 // The same hero may stand on both sides of one battle.
 const fight=createBattle([mine,a]);while(!fight.result)stepBattle(fight);assert.ok(['win','loss'].includes(fight.result));
});

test('achievements pay once from counted events; weekly bonus and first clears add free diamonds',()=>{
 let s=fresh();prepareServices(s,1000);
 assert.deepEqual(achievementDefs.map(d=>achievementProgress(s,d)),[0,0,0]);
 assert.throws(()=>serviceCommand(s,{type:'achievement',id:'ach_10_runs'},1000),/달성하지/);
 // Ten settled campaign runs and 100 merges, each counted once even if the save is replayed.
 for(let i=0;i<10;i++){const before=structuredClone(s),after=structuredClone(s);after.battleRun={id:'run'+i,merges:10,units:[]};after.battleReceipts={...after.battleReceipts,['run'+i]:{outcome:'win'}};
  trackServices({...before,battleRun:{id:'run'+i,merges:0,units:[]}},after,1000);trackServices({...before,battleRun:{id:'run'+i,merges:0,units:[]}},after,1000);after.battleRun=null;s=after;}
 assert.deepEqual([s.services.lifetime.runs,s.services.lifetime.merges],[10,100]);
 s=serviceCommand(s,{type:'achievement',id:'ach_10_runs'},1000);assert.equal(s.gold,700);
 s=serviceCommand(s,{type:'achievement',id:'ach_100_merges'},1000);assert.deepEqual([s.freeDiamonds,s.diamonds],[50,50]);
 assert.equal(serviceCommand(s,{type:'achievement',id:'ach_100_merges'},1000).freeDiamonds,50);
 assert.throws(()=>serviceCommand(s,{type:'achievement',id:'ach_first_clear'},1000),/달성하지/);
 s.campaign={cleared:true,day:null,count:0};assert.equal(serviceCommand(s,{type:'achievement',id:'ach_first_clear'},1000).gold,800);
 // Weekly completion bonus: 500 gold and 50 free diamonds, once.
 for(const q of Object.values(s.services.quests))q.claimed=true;
 const bonus=serviceCommand(s,{type:'bonus',period:'week'},1000);assert.deepEqual([bonus.gold-s.gold,bonus.freeDiamonds-s.freeDiamonds],[periodBonus.week.gold,50]);
 assert.equal(serviceCommand(bonus,{type:'bonus',period:'week'},1000).freeDiamonds,bonus.freeDiamonds);validateSave(bonus);
});

test('buildings unlock with the first victory, level up to five and scale their output',()=>{
 let s=fresh();assert.equal(governmentUnlocked(s),false);s.campaign={cleared:true,day:null,count:0};assert.equal(governmentUnlocked(s),true);
 const t0=1_000_000;s=government(s,t0);s.gold=10000;
 assert.equal(production(s,'farm',t0+3600000),30);assert.equal(production(s,'farm',t0+20*3600000),240);
 // Upgrading the farm pays out what was stored at the old rate, then produces at the new one.
 s=upgradeBuilding(s,'farm',t0+3600000);assert.equal(buildingLevel(s,'farm'),2);assert.equal(s.gold,10000+30-upgradeCosts[0]);
 assert.equal(production(s,'farm',t0+2*3600000),36);
 for(const cost of upgradeCosts.slice(1)){const gold=s.gold;s=upgradeBuilding(s,'forge',t0+3600000);assert.ok(s.gold<gold);}
 assert.equal(buildingLevel(s,'forge'),4);s=upgradeBuilding(s,'forge',t0+3600000);assert.equal(buildingLevel(s,'forge'),5);assert.throws(()=>upgradeBuilding(s,'forge',t0+3600000),/최대/);
 const tokens=s.treasureTokens;s=collectProduction(s,'forge',t0+3600000);assert.equal(s.treasureTokens,tokens+3);assert.throws(()=>collectProduction(s,'forge',t0+3600000));
 assert.throws(()=>upgradeBuilding({...s,gold:0},'barracks',t0+3600000),/골드/);assert.throws(()=>upgradeBuilding(s,'palace',t0),/없는 건물/);
 // The market level raises the weekly exchange limit of the choice boxes; the daily gold exchange is unchanged.
 const box=products.find(p=>p.id==='hero'),gold=products.find(p=>p.id==='gold');assert.equal(remaining(s,box,t0),1);
 for(let i=0;i<2;i++)s=upgradeBuilding(s,'market',t0);assert.equal(remaining(s,box,t0),2);assert.equal(remaining(s,gold,t0),3);
 s.heroTokens=60;s=applyShopCommand(s,{id:'b1',type:'purchase',product:'hero',choice:'32',time:t0});s.shop.pending=null;s=applyShopCommand(s,{id:'b2',type:'purchase',product:'hero',choice:'34',time:t0});
 assert.throws(()=>applyShopCommand({...s,shop:{...s.shop,pending:null}},{id:'b3',type:'purchase',product:'hero',choice:'15',time:t0}),/한도/);
 validateSave(s);
});

import {lordLevel,lordReward,lordXpForNext,unclaimedLordRewards,attendanceRewards} from '../services.js';
test('lord level grows from play; level rewards and attendance are claimed once',()=>{
 let time=Date.UTC(2026,10,13,12);const store=createGameStore(memory(),()=>time);
 assert.deepEqual(lordLevel(store.get()),{level:1,xp:0,next:70});
 const win=id=>{const r=wonRun(store.get(),defaultStageId,id);store.update(s=>({...s,battleRun:r}));store.update(s=>settle(s,r,time));store.update(s=>({...s,battleRun:null}));};
 win('a');assert.deepEqual(lordLevel(store.get()),{level:2,xp:30,next:140});
 // Replaying the same settlement adds nothing.
 const again=wonRun(store.get(),defaultStageId,'a');store.update(s=>settle(s,again,time));assert.equal(store.get().services.lord.xp,100);
 // Level reward: once, all reached levels together; level 5 adds free diamonds.
 assert.deepEqual(unclaimedLordRewards(store.get()),[2]);
 const gold=store.get().gold;store.update(s=>serviceCommand(s,{type:'lord-reward'},time));assert.equal(store.get().gold,gold+lordReward(2).gold);
 assert.throws(()=>store.update(s=>serviceCommand(s,{type:'lord-reward'},time)),/받을 군주 레벨 보상/);
 for(let i=0;i<7;i++)win('b'+i);
 assert.equal(lordLevel(store.get()).level,5);assert.equal(800,100*8);assert.equal(lordXpForNext(1)+lordXpForNext(2)+lordXpForNext(3)+lordXpForNext(4),700);
 const before=store.get();store.update(s=>serviceCommand(s,{type:'lord-reward'},time));
 assert.equal(store.get().gold-before.gold,[3,4,5].reduce((n,l)=>n+lordReward(l).gold,0));assert.equal(store.get().freeDiamonds-before.freeDiamonds,100);
 // A claimed quest gives lord experience too.
 const xp=store.get().services.lord.xp;store.update(s=>{s.services.quests.daily_run.progress=s.services.quests.daily_run.target;return s;});
 store.update(s=>serviceCommand(s,{type:'quest',id:'daily_run'},time));assert.equal(store.get().services.lord.xp,xp+20);
 // Attendance: one claim per quest day, seven-day cycle.
 const day=86400000;let s=store.get();
 store.update(s=>serviceCommand(s,{type:'attendance'},time));assert.equal(store.get().gold-s.gold,attendanceRewards[0].gold);
 assert.throws(()=>store.update(s=>serviceCommand(s,{type:'attendance'},time)),/이미 출석/);
 for(let i=1;i<8;i++){time+=day;s=store.get();store.update(s=>serviceCommand(s,{type:'attendance'},time));const reward=attendanceRewards[i%7];
  assert.equal(store.get().gold-s.gold,reward.gold??0,'day '+i);assert.equal(store.get().freeDiamonds-s.freeDiamonds,reward.freeDiamonds??0);assert.equal((store.get().trainingTickets??0)-(s.trainingTickets??0),reward.trainingTickets??0);}
 validateSave(store.get());
});
