// 종합기획서 보강 구현: 픽업·도감·인연 임무·7일 임무, 역할 특성·군략·난도, 군주 레벨 해금,
// 연무탑, 군웅대전 시즌·군공, 동맹 토벌·상점, 토벌 파견.
import test from 'node:test';
import assert from 'node:assert/strict';
import {heroes} from '../heroes.js';
import {specs} from '../progression.js';
import {createGameStore} from '../store.js';
import {applyShopCommand} from '../economy.js';
import {pickupOf,poolGates,poolLocked,S_SELECT_COST,codexComplete,factionRoster,startMissions,BOND_MISSION_WINS} from '../collection.js';
import {serviceCommand,prepareServices,trackServices,lordLevel} from '../services.js';
import {combatant,enemies,roleTrait,roleTraits,strategyNames,arenaUnits} from '../battle-data.js';
import {createBattle,stepBattle} from '../battle-engine.js';
import {newRun,prepareCommand,startRound,settle} from '../battle-run.js';
import {stages,stageOrder,stageUnlocked,hardUnlocked,isBlocked,towerStages,TOWER_FLOORS,hardRules} from '../stages.js';
import {unlocked,unlockLevels} from '../unlocks.js';
import {towerDeck,allowed} from '../tower.js';
import {opponentPool,opponentsFor,tierOf,rollSeason,arenaCommand,meritShop,seasonOf,SEASON_DAYS,meritRules} from '../arena-state.js';
import {allianceCommand,raidStatus,raidRules,allianceShop,raidAttempt} from '../alliance-state.js';
import {expeditionCommand,expeditionRules,sites,teamBonus,heroPower} from '../expedition.js';
import {collectProduction,government,provisionRatio} from '../government.js';

const DAY=86400000,T0=Date.UTC(2026,10,16,3);
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
const fresh=()=>createGameStore(memory()).get();
const level=(state,n)=>{const s=structuredClone(state);prepareServices(s,T0).lord.xp=Array.from({length:n-1},(_,i)=>70*(i+1)).reduce((a,b)=>a+b,0);return s;};
const ownAll=state=>{const s=structuredClone(state);for(const h of Object.values(s.heroes))h.owned=true;return s;};
const clearAll=state=>{const s=structuredClone(state);s.campaign={cleared:true,day:null,count:0,stages:Object.fromEntries(stageOrder.slice(1).map(id=>[id,{cleared:true}]))};return s;};
const rich=state=>({...structuredClone(state),gold:1e7,diamonds:1e6,freeDiamonds:1e6});

test('pickup recruit: diamonds only, half of S is the pickup S, a miss guarantees the next',()=>{
 const p=pickupOf(T0);assert.equal(specs[p.s].grade,'S');assert.ok(p.a.every(id=>specs[id].grade==='A')&&!poolGates[p.s]);
 assert.equal(pickupOf(T0+13*DAY).period-pickupOf(T0-DAY).period<=1,true);assert.notEqual(pickupOf(T0).s,pickupOf(T0+14*DAY).s);
 let s=rich(fresh());
 assert.throws(()=>applyShopCommand(s,{id:'g',type:'recruit',pool:'hero',currency:'gold',count:1,seed:1,banner:'pickup',time:T0}),/다이아/);
 let total=0,hit=0,previousMiss=false,aTotal=0,aHit=0;
 for(let i=0;i<400;i++){s=applyShopCommand(s,{id:'p'+i,type:'recruit',pool:'hero',currency:'diamonds',count:10,seed:900+i,banner:'pickup',time:T0});
  for(const r of s.shop.pending.results){if(r.grade==='S'){total++;const isPickup=r.id===p.s;if(previousMiss)assert.ok(isPickup,'guarantee after a miss');previousMiss=!isPickup;if(isPickup)hit++;}if(r.grade==='A'){aTotal++;if(p.a.includes(r.id))aHit++;}}
  s.shop.pending=null;s.diamonds=s.freeDiamonds=1e6;}
 assert.ok(total>40&&hit/total>.6&&hit/total<.75,`pickup S share ${hit}/${total}`);   // 50% + guarantee = two thirds
 assert.ok(aHit/aTotal>.38&&aHit/aTotal<.62,`pickup A share ${aHit}/${aTotal}`);
});

test('ten-pull holds at least one B and all 49 heroes are recruitable before any campaign clear',()=>{
 let s=rich(fresh());const seen=new Set();
 for(let i=0;i<300;i++){s=applyShopCommand(s,{id:'t'+i,type:'recruit',pool:'hero',currency:'gold',count:10,seed:i*31+7,time:T0});assert.ok(s.shop.pending.results.some(r=>r.grade!=='C'),'ten-pull '+i);for(const r of s.shop.pending.results)seen.add(r.id);s.shop.pending=null;}
 assert.equal(heroes.length,49);for(const hero of heroes){assert.equal(poolLocked(fresh(),hero.id),false);assert.ok(seen.has(hero.id),hero.name+' must be recruitable from the start');}
 let open=rich(clearAll(fresh()));assert.ok(Object.keys(poolGates).every(id=>!poolLocked(open,id)));const later=new Set();
 for(let i=0;i<400;i++){open=applyShopCommand(open,{id:'o'+i,type:'recruit',pool:'hero',currency:'gold',count:10,seed:i*17+3,time:T0});for(const r of open.shop.pending.results)later.add(r.id);open.shop.pending=null;}
 assert.ok(later.has('huaxiong'));
});

test('S select shards, codex reward, bond mission and seven-day missions',()=>{
 let s=fresh();
 assert.throws(()=>applyShopCommand(s,{id:'s1',type:'s-select',choice:'35',time:T0}),/부족/);
 s.sShards=S_SELECT_COST;
 assert.throws(()=>applyShopCommand(s,{id:'s2',type:'s-select',choice:'16',time:T0}),/고를 수 없는/);        // not S
 assert.equal(applyShopCommand(s,{id:'s3',type:'s-select',choice:'zhangjue',time:T0}).heroes.zhangjue.owned,true); // all nations, no chapter gate
 const picked=applyShopCommand(s,{id:'s4',type:'s-select',choice:'35',time:T0});assert.equal(picked.sShards,0);assert.equal(picked.heroes['35'].owned,true);
 assert.equal(applyShopCommand(picked,{id:'s4',type:'s-select',choice:'35',time:T0}),picked);                // same request: no second charge

 // Codex: a faction pays once when every hero of it is owned.
 assert.throws(()=>serviceCommand(fresh(),{type:'codex',faction:'위'},T0),/아직 모으지/);
 let all=ownAll(fresh());assert.ok(codexComplete(all,'위')&&factionRoster('위').length>=9);
 all=serviceCommand(all,{type:'codex',faction:'위'},T0);assert.equal(all.freeDiamonds,500);assert.equal(all.services.titles.length,1);
 assert.equal(serviceCommand(all,{type:'codex',faction:'위'},T0).freeDiamonds,500);

 // Bond mission: 유비·관우 owned, 장비 missing -> five campaign wins -> 장비 joins.
 let b=fresh();b.heroes['1'].owned=true;b.heroes['2'].owned=false;b.order=b.order.map(id=>id==='2'?'1':id);
 let tracked=trackServices(b,structuredClone(b),T0);assert.deepEqual(tracked.services.bondMissions.peach,{hero:'2',wins:0,claimed:false});
 assert.throws(()=>serviceCommand(tracked,{type:'bond-mission',id:'peach'},T0),/아직 완료/);
 for(let i=0;i<BOND_MISSION_WINS;i++){const before=tracked,after=structuredClone(before);after.battleRun={id:'run'+i,mode:'campaign',stageId:'yellow_turban_01'};after.battleReceipts={...(before.battleReceipts??{}),['run'+i]:{outcome:'win'}};tracked=trackServices(before,after,T0);}
 assert.equal(tracked.services.bondMissions.peach.wins,BOND_MISSION_WINS);
 const joined=serviceCommand(tracked,{type:'bond-mission',id:'peach'},T0);assert.equal(joined.heroes['2'].owned,true);
 assert.equal(serviceCommand(joined,{type:'bond-mission',id:'peach'},T0).heroes['2'].cards,0);

 // Seven-day missions open one a day and pay once; the final reward needs all seven.
 let m=fresh();prepareServices(m,T0);
 assert.throws(()=>serviceCommand(m,{type:'start-mission',day:1},T0),/아직 완료/);
 m.campaign={cleared:true,day:null,count:0};m=serviceCommand(m,{type:'start-mission',day:1},T0);assert.equal(m.gold,700);
 assert.equal(serviceCommand(m,{type:'start-mission',day:1},T0).gold,700);
 m.heroes['0'].level=3;assert.throws(()=>serviceCommand(m,{type:'start-mission',day:2},T0),/2일차/);
 assert.equal(serviceCommand(m,{type:'start-mission',day:2},T0+DAY).trainingTickets,2);
 assert.throws(()=>serviceCommand(m,{type:'start-mission',day:'final'},T0+9*DAY),/모두 완료/);
 assert.equal(startMissions.length,7);
});

test('role traits: every hero has one and each effect applies in battle',()=>{
 for(const h of heroes)assert.ok(roleTrait(h.role),h.name+' '+h.role);
 assert.equal(Object.keys(roleTraits).length,6);
 const p={heroes:Object.fromEntries(heroes.map(h=>[h.id,{level:1,star:1,owned:true,treasure:null}])),treasures:[],order:[],strategy:'vanguard'};
 const unit=(id,hero,x,y,side=0)=>({...combatant({id,hero,rank:1,x,y},side,p),ready:99999});
 assert.equal(unit(1,'1',0,0).trait,'front');assert.equal(unit(1,'2',0,0).trait,'tank');assert.equal(unit(1,'16',0,0).trait,'archer');
 assert.equal(unit(1,'35',0,0).trait,'tactician');assert.equal(unit(1,'0',0,0).trait,'support');assert.equal(unit(1,'15',0,0).trait,'mobile');
 assert.equal(combatant(enemies(1,'yellow_turban_01')[0],1,p).trait,undefined);
 assert.ok(Math.abs(unit(1,'0',0,0).healBonus-.1)<1e-9);
 // archer: +10% at three cells or more
 const shot=d=>{const a=unit(1,'16',0,0),t=unit(10,'2',0,d,1);t.def=0;const b=createBattle([a,t]);b.units[0].action={start:0,at:1,target:10};for(let i=0;i<80;i++)stepBattle(b);return b.units[1].maxHp-b.units[1].hp;};
 assert.ok(shot(3)>shot(2)&&Math.abs(shot(3)/shot(2)-1.1)<.02,`${shot(3)} vs ${shot(2)}`);
 // tactician: +10 mana three seconds in
 {const a=unit(1,'35',0,0),t=unit(10,'2',7,7,1),b=createBattle([a,t]);for(let i=0;i<59;i++)stepBattle(b);assert.equal(b.units[0].mana,0);stepBattle(b);assert.equal(b.units[0].mana,10);}
 // tank: 10% less damage below half HP
 {const hitFor=hp=>{const a=unit(1,'1',0,0),t=unit(10,'2',0,1,1);t.hp=hp(t.maxHp);const before=t.hp,b=createBattle([a,t]);b.units[0].action={start:0,at:1,target:10};stepBattle(b);return before-b.units[1].hp;};
  const high=hitFor(m=>m),low=hitFor(m=>Math.floor(m*.4));assert.ok(low<high&&Math.abs(low/high-.9)<.03,`${low} vs ${high}`);}
 // front: +10 mana on a kill
 {const a=unit(1,'1',0,0),t=unit(10,'16',0,1,1);t.hp=1;const b=createBattle([a,t]);b.units[0].action={start:0,at:1,target:10};stepBattle(b);assert.equal(b.units[0].mana,25);}
 // mobile: the first move takes half the time
 {const moveTicks=hero=>{const a={...unit(1,hero,0,0),ready:0},t=unit(10,'2',0,6,1),b=createBattle([a,t]);stepBattle(b);return b.units[0].move.at-b.units[0].move.start;};
  assert.equal(moveTicks('15'),Math.max(2,Math.ceil(moveTicks('1')/2)));}
});

test('six strategies: ambush, fire and defend take effect',()=>{
 assert.deepEqual(Object.keys(strategyNames),['vanguard','strategist','logistics','ambush','fire','defend']);
 const p=strategy=>({heroes:Object.fromEntries(heroes.map(h=>[h.id,{level:1,star:1,owned:true,treasure:null}])),treasures:[],order:[],strategy});
 assert.equal(combatant({id:1,hero:'15',rank:1,x:0,y:0},0,p('ambush')).ambush,.2);assert.equal(combatant({id:1,hero:'1',rank:1,x:0,y:0},0,p('ambush')).ambush,undefined);
 assert.equal(combatant({id:1,hero:'77',rank:1,x:0,y:0},0,p('fire')).fireBonus,.1);assert.equal(combatant(enemies(1,'yellow_turban_01')[0],1,p('fire')).fireBonus,undefined);
 // defend: tanks gain 10% defence from round three
 const s={...clearAll(ownAll(fresh())),strategy:'defend'};let r=newRun(s,5,'d',null,T0,'yellow_turban_01');
 r.units=[{id:1,hero:'2',rank:1,x:3,y:3,cost:3}];const base=combatant(r.units[0],0,r.profile).def;
 assert.equal(startRound(r).battle.units[0].def,base);r.round=3;assert.equal(startRound(r).battle.units[0].def,Math.floor(base*1.1));
});

test('lord level gates: features, anti-Dong chapters, hard mode and legacy access',()=>{
 const s=fresh();
 for(const f of Object.keys(unlockLevels))assert.equal(unlocked(s,f),f==='shop',f);
 assert.ok(unlocked(level(s,3),'shop')&&!unlocked(level(s,3),'arena')&&unlocked(level(s,20),'strategies'));
 assert.equal(lordLevel(level(s,10)).level,10);
 // A profile that already used a feature keeps it.
 assert.equal(unlocked({...s,arena:{score:1000}},'arena'),false,'Test matches must not permanently bypass Lv.6');assert.equal(unlocked({...s,alliance:{guild:{}}},'alliance'),false,'Test membership must not bypass the restored Lv.8 gate');
 const yellow={...s,campaign:{cleared:true,stages:{yellow_02:{cleared:true},yellow_03:{cleared:true}}}};
 assert.equal(stageUnlocked(yellow,'sishui_01'),false);assert.equal(stageUnlocked(level(yellow,10),'sishui_01'),true);
 assert.equal(hardUnlocked(level(yellow,10),'yellow_02'),false);assert.equal(hardUnlocked(level(yellow,12),'yellow_02'),true);
 assert.equal(hardUnlocked(level(yellow,12),'sishui_01'),false);
});

test('hard mode: stronger enemies, narrower gate, faster telegraph, separate first clear and better pay',()=>{
 const p={heroes:Object.fromEntries(heroes.map(h=>[h.id,{level:1,star:1,owned:true,treasure:null}])),treasures:[],order:[]};
 const normal=combatant(enemies(1,'yellow_02')[0],1,p),hard=combatant(enemies(1,'yellow_02','hard')[0],1,p);
 assert.equal(hard.hp,Math.floor(normal.hp*hardRules.hp));assert.equal(hard.atk,Math.floor(normal.atk*hardRules.atk));
 assert.ok(!isBlocked('sishui_01',2,4)&&isBlocked('sishui_01',2,4,'hard')&&!isBlocked('sishui_01',3,4,'hard'));
 let s=level(clearAll(fresh()),12);s.campaign.day=null;
 assert.throws(()=>newRun(fresh(),1,'h0',null,T0,'yellow_02','hard'),/열리지 않은|어려움/);
 let r=newRun(s,1,'h1',null,T0,'yellow_02','hard');assert.equal(r.difficulty,'hard');
 r.units=[{id:1,hero:'1',rank:1,x:3,y:3,cost:3}];r.round=5;const b=startRound(r).battle,boss=b.units.find(u=>u.skillParams);
 assert.equal(boss.skillParams.telegraphTicks,Math.round(stages.yellow_02.bossSkill.telegraphTicks*hardRules.telegraph));
 r.phase='result';r.outcome='win';
 const paid=settle(s,r,T0);assert.equal(paid.gold-s.gold,Math.round(stages.yellow_02.reward.firstClearGold*hardRules.gold));assert.ok(paid.campaign.hard.yellow_02.cleared);
 const again=newRun(paid,1,'h2',null,T0,'yellow_02','hard');again.round=5;again.phase='result';again.outcome='win';
 assert.equal(settle({...paid,battleRun:null},again,T0).gold-paid.gold,Math.round(stages.yellow_02.reward.repeatGold*hardRules.gold));
});

test('tower: thirty valid floors, constraints on the deck and capacity, first-clear rewards only',()=>{
 assert.equal(Object.keys(towerStages).length,TOWER_FLOORS);
 const p={heroes:Object.fromEntries(heroes.map(h=>[h.id,{level:1,star:1,owned:true,treasure:null}])),treasures:[],order:[]};
 for(const [id,f] of Object.entries(towerStages)){assert.equal(f.rounds.length,1,id);const seen=new Set();
  for(const u of enemies(1,id)){const c=combatant(u,1,p);assert.ok(c.hp>0&&c.atk>0&&u.y>=4,id);assert.ok(!seen.has(u.x+','+u.y),id+' overlap');seen.add(u.x+','+u.y);}
  assert.equal(f.reward.repeatGold,0);}
 let s=ownAll(fresh());
 assert.throws(()=>newRun(s,1,'t0',null,T0,'tower_01'),/열리지 않은/);
 s=level(s,15);
 let r=newRun(s,1,'t1',null,T0,'tower_01');assert.equal(r.silver,towerStages.tower_01.startSilver);assert.equal(r.deck.length,6);
 assert.throws(()=>newRun(s,1,'t2',null,T0,'tower_02'),/열리지 않은/);
 s.campaign={cleared:false,day:null,count:0,stages:Object.fromEntries(['tower_01','tower_02','tower_03'].map(id=>[id,{cleared:true}]))};
 const shu=newRun(s,1,'t3',null,T0,'tower_02');assert.ok(shu.deck.every(id=>heroes.find(h=>h.id===id).faction==='촉'));
 assert.ok(newRun(s,1,'t4',null,T0,'tower_03').deck.every(id=>specs[id].grade!=='S'));assert.ok(!allowed({banGrades:['S']},'35'));
 // floor 4 allows four units: capacity stops there
 let four=newRun(s,1,'t5',null,T0,'tower_04');four.silver=99;four=prepareCommand(four,{type:'capacity'});assert.equal(four.capacity,4);assert.throws(()=>prepareCommand(four,{type:'capacity'}),/제한/);
 // a profile with no hero of the faction cannot enter
 const none=structuredClone(s);for(const h of heroes.filter(h=>h.faction==='촉'))none.heroes[h.id].owned=false;none.order=heroes.filter(h=>h.faction==='위').slice(0,6).map(h=>h.id);
 assert.throws(()=>newRun(none,1,'t6',null,T0,'tower_02'),/조건에 맞는/);assert.equal(towerDeck(none,towerStages.tower_02).length,0);
 // settlement: first clear pays, a repeat pays nothing; floor 10 pays S shards
 s.campaign.stages=Object.fromEntries(Array.from({length:9},(_,i)=>['tower_0'+(i+1),{cleared:true}]));
 const ten=newRun(s,1,'t7',null,T0,'tower_10');ten.phase='result';ten.outcome='win';
 const paid=settle(s,ten,T0);assert.equal(paid.sShards,5);assert.equal(paid.gold-s.gold,towerStages.tower_10.reward.firstClearGold);
 const repeat=newRun(paid,1,'t8',null,T0,'tower_10');repeat.phase='result';repeat.outcome='win';assert.equal(settle({...paid,battleRun:null},repeat,T0).gold,paid.gold);
});

test('arena: opponent pool, tiers, saved layout, merit, daily bonus, season rollover and merit shop',()=>{
 assert.equal(opponentPool.length,20);
 for(const o of opponentPool){assert.equal(new Set(o.order).size,6,o.name);assert.ok(o.order.every(id=>specs[id])&&strategyNames[o.strategy]);}
 assert.deepEqual(opponentsFor(1000).map(o=>Math.abs(o.score-1000)<60),[true,true,true]);assert.notDeepEqual(opponentsFor(1000,1),opponentsFor(1000));
 assert.equal(tierOf(1000).name,'백부장');assert.equal(tierOf(1600).name,'천하무쌍');assert.equal(tierOf(10).name,'병졸');
 // layout: valid one is used and mirrored for the opponent; an invalid one falls back
 const order=['1','2','15','16','35','0'],layout=Object.fromEntries(order.map((h,i)=>[h,[i,i<3?0:2]]));
 assert.deepEqual(arenaUnits(order,0,layout).map(u=>[u.x,u.y]),order.map((h,i)=>[i,i<3?0:2]));
 assert.deepEqual(arenaUnits(order,1,layout)[0],{id:100,hero:'1',rank:3,x:7,y:7});
 assert.deepEqual(arenaUnits(order,0,{...layout,'1':[9,9]}),arenaUnits(order,0));
 // settle three matches in a day
 let s=level(fresh(),6);const play=(state,i,outcome,time=T0)=>{const match={id:'m'+i,playerOrder:[...state.order],playerStrategy:'vanguard',opponent:opponentPool[5]};let r=newRun(state,1,'m'+i,match,time);r=startRound(r);r.phase='result';r.outcome=outcome;return settle({...state,battleRun:null},r,time);};
 s=play(s,1,'win');assert.equal(s.merit,meritRules.win);assert.equal(Object.keys(s.arena.layout).length,6);
 s=play(s,2,'loss');assert.equal(s.merit,meritRules.win+meritRules.other);assert.equal(s.freeDiamonds,0);
 s=play(s,3,'win');assert.equal(s.freeDiamonds,meritRules.dailyBonus.freeDiamonds);assert.equal(s.arena.dayMatches,3);
 // season rollover: reward by mail, score pulled halfway to 1000
 s.arena.score=1200;const next=T0+SEASON_DAYS*DAY;assert.equal(seasonOf(next),seasonOf(T0)+1);
 const rolled=arenaCommand(s,{type:'season'},next);assert.equal(rolled.arena.score,1100);
 const mail=rolled.services.mail.find(m=>m.id.startsWith('arena-season:'));assert.deepEqual(mail.attachments,{freeDiamonds:500,sShards:10});
 assert.equal(arenaCommand(rolled,{type:'season'},next).services.mail.length,rolled.services.mail.length);
 const claimed=serviceCommand(rolled,{type:'mail',id:mail.id},next);assert.equal(claimed.sShards,10);
 // merit shop and defence formation
 let shop={...s,merit:200};const card=meritShop(T0)[0];shop=arenaCommand(shop,{type:'buy',item:'card'},T0);assert.equal(shop.merit,200-card.price);
 assert.ok(shop.heroes[card.hero].owned);assert.throws(()=>arenaCommand(shop,{type:'buy',item:'card'},T0),/한도/);
 assert.throws(()=>arenaCommand({...s,merit:0},{type:'buy',item:'treasure'},T0),/군공/);
 assert.deepEqual(arenaCommand(s,{type:'defense'},T0).arena.defense.order,s.order);
});

test('alliance: attendance, raid attempts with a cap, NPC share, chests and the contribution shop',()=>{
 let s=allianceCommand({...fresh(),gold:5000},'join','cloud',T0);
 s=allianceCommand(s,'attend',null,T0);assert.equal(s.gold,5050);assert.equal(s.alliance.contribution,5);
 assert.throws(()=>allianceCommand(s,'attend',null,T0),/이미 출석/);
 assert.throws(()=>allianceCommand(s,'raid',null,T0),/준비도/);
 const t=T0+DAY+3600000;                               // a day later: donations open
 for(let i=0;i<3;i++)s=allianceCommand(s,'donate',null,t);s=allianceCommand(s,'supply',null,t);assert.equal(s.alliance.preparation,100);
 assert.equal(raidStatus(s,t).open,true);
 const attempt=raidAttempt(s,s.alliance.week);assert.ok(attempt.damage>0&&attempt.damage<=raidRules.hp*raidRules.attemptCap);
 s=allianceCommand(s,'raid',null,t);s=allianceCommand(s,'raid',null,t);assert.throws(()=>allianceCommand(s,'raid',null,t),/도전 횟수/);
 const st=raidStatus(s,t);assert.equal(st.mine,attempt.damage*2);assert.equal(st.npc,Math.round(raidRules.hp*raidRules.npcDailyShare));assert.equal(st.total,st.mine+st.npc);
 if(st.step>0){const before=s.gold;s=allianceCommand(s,'raid-claim',null,t);assert.equal(s.gold-before,raidRules.chest.gold*st.step);assert.throws(()=>allianceCommand(s,'raid-claim',null,t),/받을 토벌 상자/);}
 else assert.throws(()=>allianceCommand(s,'raid-claim',null,t),/받을 토벌 상자/);
 // shop
 const item=allianceShop(t)[1];s.alliance.contribution=item.price*item.limit;const tokens=s.treasureTokens;
 for(let i=0;i<item.limit;i++)s=allianceCommand(s,'buy','treasure',t);assert.equal(s.treasureTokens,tokens+5*item.limit);assert.equal(s.alliance.contribution,0);
 s.alliance.contribution=999;assert.throws(()=>allianceCommand(s,'buy','treasure',t),/한도/);
 // leaving keeps the contribution
 const solo=allianceCommand({...fresh(),gold:2000},'create','우리동맹',T0);solo.alliance.contribution=40;assert.equal(allianceCommand(solo,'leave',null,T0).alliance.contribution,40);
});

test('expedition: unlock, provisions from the farm, limits, bonuses and a claim that cannot be re-rolled',()=>{
 let s=clearAll(fresh());
 assert.throws(()=>expeditionCommand(s,{type:'send',id:'e1',site:'yellow',heroes:['0','15','16']},T0),/군주 Lv\.10/);
 s=level(s,10);for(const id of ['0','15','16','infantry','archer','tactician'])s.heroes[id].level=8;
 assert.throws(()=>expeditionCommand(s,{type:'send',id:'e1',site:'yellow',heroes:['0','15','16']},T0),/군량/);
 // the farm yields provisions with its gold
 let g=government(s,T0);g.campaign.cleared=true;g=collectProduction(g,'farm',T0+8*3600000);assert.equal(g.provisions,Math.floor((g.gold-s.gold)/provisionRatio));assert.ok(g.provisions>=expeditionRules.provisions);
 s={...g,provisions:200};const t=T0+9*3600000;
 assert.throws(()=>expeditionCommand(s,{type:'send',id:'e1',site:'yellow',heroes:['0','15']},t),/3명/);
 assert.throws(()=>expeditionCommand({...s,heroes:{...s.heroes,'0':{...s.heroes['0'],level:1},'15':{...s.heroes['15'],level:1},'16':{...s.heroes['16'],level:1}}},{type:'send',id:'e1',site:'hulao',heroes:['0','15','16']},t),/전투력/);
 assert.equal(heroPower(s,'0'),8*10+30+{C:0,B:20,A:40,S:70}[specs['0'].grade]);
 s=expeditionCommand(s,{type:'send',id:'e1',site:'yellow',heroes:['0','15','16']},t);assert.equal(s.provisions,180);
 assert.throws(()=>expeditionCommand(s,{type:'send',id:'e2',site:'yellow',heroes:['0','infantry','archer']},t),/이미 파견/);
 s=expeditionCommand(s,{type:'send',id:'e2',site:'yellow',heroes:['infantry','archer','tactician']},t);
 assert.throws(()=>expeditionCommand(s,{type:'send',id:'e3',site:'yellow',heroes:['0','15','16']},t),/2부대/);
 assert.throws(()=>expeditionCommand(s,{type:'claim',id:'e1'},t+3600000),/돌아오지/);
 const bonus=teamBonus(sites[0],['0','15','16']);assert.equal(bonus.sameFaction,3);assert.ok(Math.abs(bonus.rate-.3)<1e-9);
 const done=t+expeditionRules.duration,before=s.gold;
 const claimed=expeditionCommand(s,{type:'claim',id:'e1'},done);assert.equal(claimed.gold-before,Math.round(sites[0].reward.gold*1.3));assert.equal(claimed.expedition.slots.length,1);
 assert.throws(()=>expeditionCommand(claimed,{type:'claim',id:'e1'},done),/찾지 못했/);
 assert.deepEqual(expeditionCommand(s,{type:'claim',id:'e1'},done),claimed);                                  // same claim, same result
 // daily limit of four
 let d=expeditionCommand(claimed,{type:'claim',id:'e2'},done);
 d=expeditionCommand(d,{type:'send',id:'e3',site:'yellow',heroes:['0','15','16']},done);d=expeditionCommand(d,{type:'send',id:'e4',site:'yellow',heroes:['infantry','archer','tactician']},done);
 d=expeditionCommand(d,{type:'claim',id:'e3'},done+expeditionRules.duration);
 assert.throws(()=>expeditionCommand(d,{type:'send',id:'e5',site:'yellow',heroes:['0','15','16']},done+expeditionRules.duration),/파견 횟수/);
});
