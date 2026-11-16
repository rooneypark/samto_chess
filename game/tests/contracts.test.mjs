// Contracts fixed by docs/삼국체스_최종기획결정_개발전달_v1.0.txt:
// stage data as the single source, per-side arena strategy, lean run profile,
// retention without duplicate payouts, treasure lock during a run, target rules.
import test from 'node:test';
import assert from 'node:assert/strict';
import {stage} from '../stage-data.js';
import {heroes} from '../heroes.js';
import {createGameStore} from '../store.js';
import {applyShopCommand} from '../economy.js';
import {manageTreasure} from '../treasures.js';
import {awakeningSkill} from '../progression.js';
import {escapeHtml} from '../dialog-content.js';
import {combatant,enemies,enemySpec,roundRule,arenaRules} from '../battle-data.js';
import {newRun,startRound,nextRound,settle,simulate} from '../battle-run.js';
import {createBattle,stepBattle} from '../battle-engine.js';
import {compactSave,capCommandReceipts,runProfile,RETENTION} from '../retention.js';

const DAY=86400000;
const profile=(extra={})=>({gold:500,order:['15','0','16','infantry','archer','tactician'],heroes:Object.fromEntries(heroes.map(h=>[h.id,{level:1,star:1,owned:true,treasure:null}])),treasures:[],...extra});
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),size:()=>[...data.values()].reduce((n,v)=>n+v.length,0)};};
// Every stage edit is undone so the tests stay independent.
function withStage(change,body){const backup=structuredClone(stage);try{change(stage);return body();}finally{for(const k of Object.keys(stage))delete stage[k];Object.assign(stage,backup);}}
const wonRound=(round,units=[{id:1,hero:'119',rank:5,x:3,y:3,cost:48}])=>{const r=newRun(profile(),2,'stage-'+round);r.units=units;r.round=round;r.phase='result';r.outcome='win';return r;};
function cast(caster,others,center){caster.action={start:0,at:1,skill:true,target:others[0].id,center};for(const u of [caster,...others])u.ready=9999;const b=createBattle([caster,...others]);stepBattle(b);return b;}

test('enemy numbers and positions come from stage data on every read',()=>{
 assert.deepEqual(enemies(5)[0],{id:100,hero:'boss',rank:1,x:3,y:7});
 const mage=combatant({id:100,hero:'taoist',rank:1,x:3,y:7},1,profile());
 assert.equal(mage.maxMana,0);assert.equal(mage.skill,null);assert.deepEqual([mage.hp,mage.atk,mage.def,mage.mdef,mage.range,mage.interval],[220,50,5,20,4,28]);
 assert.deepEqual(enemySpec('raider').stats,[300,40,10,5,1,1.2,0]);
 withStage(s=>{s.enemyDefs.melee.hp=777;s.enemyDefs.melee.attackIntervalTicks=30;s.rounds[0].enemies[0].x=6;},()=>{
  const u=combatant(enemies(1)[0],1,profile());assert.equal(u.hp,777);assert.equal(u.interval,30);assert.equal(u.x,6);
 });
 assert.equal(combatant(enemies(1)[0],1,profile()).hp,300);
 withStage(s=>{s.enemyDefs.melee.skillId='unregistered';},()=>assert.throws(()=>enemySpec('raider'),/등록되지 않은 적 전법/));
});

test('boss tactic radius, coefficient, damage type and telegraph are read from stage data',()=>{
 const p=profile(),fight=(x,y)=>{const boss=combatant({id:100,hero:'boss',rank:1,x:3,y:7},1,p),t=combatant({id:1,hero:'infantry',rank:1,x,y},0,p);return {b:cast(boss,[t],{x:3,y:3}),t};};
 const damage=b=>b.log.filter(e=>e.type==='damage').map(e=>e.value);
 assert.deepEqual(damage(fight(3,3).b),[Math.floor(110*1.8*100/115)]);
 assert.deepEqual(damage(fight(3,1).b),[]);
 withStage(s=>{s.bossSkill.coefficient=3;s.bossSkill.radius=2;},()=>{
  assert.deepEqual(damage(fight(3,3).b),[Math.floor(110*3*100/115)]);
  assert.deepEqual(damage(fight(3,1).b),[Math.floor(110*3*100/115)]);
 });
 withStage(s=>{s.bossSkill.damageType='physical';},()=>assert.deepEqual(damage(fight(3,3).b),[Math.floor(110*1.8*100/130)]));
 const telegraph=()=>{const boss=combatant({id:100,hero:'boss',rank:1,x:3,y:5},1,p),t=combatant({id:1,hero:'infantry',rank:1,x:3,y:3},0,p);boss.mana=boss.maxMana;t.ready=9999;const b=createBattle([boss,t]);stepBattle(b);const a=b.units[0].action;return a.at-a.start;};
 assert.equal(telegraph(),20);
 withStage(s=>{s.bossSkill.telegraphTicks=35;},()=>assert.equal(telegraph(),35));
});

test('round silver, equipment drops and campaign gold follow stage data',()=>{
 assert.equal(nextRound(wonRound(1)).silver,7+4);
 assert.equal(nextRound(wonRound(1)).gear.length,0);
 assert.deepEqual(nextRound(wonRound(2),'bow').gear,[{type:'bow',rank:1}]);
 withStage(s=>{s.rounds[0].victorySilver=11;s.rounds[0].equipmentReward='choice_of_sword_armor_bow_rank1';s.rounds[1].equipmentReward=null;},()=>{
  const r=nextRound(wonRound(1),'armor');assert.equal(r.silver,7+11);assert.deepEqual(r.gear,[{type:'armor',rank:1}]);
  assert.equal(nextRound(wonRound(2),'bow').gear.length,0);
 });
 withStage(s=>{s.rounds[0].equipmentReward='mystery_box';},()=>assert.throws(()=>roundRule(1),/등록되지 않은 장비 보상/));
 withStage(s=>{s.reward={firstClearGold:333,repeatGold:7,dailyRepeatLimit:1};},()=>{
  const clear=id=>{const r=wonRound(5);r.id=id;return r;};
  let s=settle(profile(),clear('a'),1000);assert.equal(s.gold,833);
  s=settle(s,clear('b'),1000);assert.equal(s.gold,840);
  s=settle(s,clear('c'),1000);assert.equal(s.gold,840);
 });
 withStage(s=>{s.rounds.length=3;},()=>{
  assert.throws(()=>nextRound(wonRound(3)),/다음 라운드/);
  assert.equal(settle(profile(),wonRound(3),1000).gold,600);
 });
});

test('arena sides use their own strategy and the opponent snapshot is fixed',()=>{
 const order=['35','77','tactician','15','0','16'],match=strategy=>({id:'m',playerOrder:order,opponent:{id:'cloud',name:'청운',score:1000,order,...(strategy?{strategy}:{})}});
 const units=(playerStrategy,foeStrategy)=>startRound(newRun(profile({strategy:playerStrategy}),3,'m',match(foeStrategy))).battle.units;
 const side=(list,n)=>list.filter(u=>u.side===n).map(({hp,mana,hero})=>({hero,hp,mana}));
 const vanguard=units('vanguard','strategist'),strategist=units('strategist','strategist');
 assert.deepEqual(side(vanguard,1),side(strategist,1));
 assert.notDeepEqual(side(vanguard,0),side(strategist,0));
 // 책략: only tacticians start with 10 mana. 선봉: only the front row gets +5% HP.
 assert.deepEqual(side(vanguard,1).map(u=>u.mana),[10,10,10,0,0,0]);
 assert.deepEqual(side(vanguard,0).map(u=>u.mana),[0,0,0,0,0,0]);
 const plain=side(units('strategist','strategist'),0),front=side(vanguard,0);
 assert.ok(front.slice(0,3).every((u,i)=>u.hp>plain[i].hp));
 assert.deepEqual(front.slice(3).map(u=>u.hp),plain.slice(3).map(u=>u.hp));
 // A match prepared before strategies were stored fights as 선봉, never as a copy of the player.
 assert.deepEqual(side(units('strategist',undefined),1).map(u=>u.mana),[0,0,0,0,0,0]);
 // The player strategy is pinned when the match is prepared.
 const pinned=newRun(profile({strategy:'strategist'}),3,'m',{...match('vanguard'),playerStrategy:'vanguard'});
 assert.equal(pinned.profile.strategy,'vanguard');
 assert.deepEqual([arenaRules.level,arenaRules.star,arenaRules.rank],[10,3,3]);
});

test('a run copies only the profile fields it reads',()=>{
 const state=profile({strategy:'logistics',reducedMotion:true,ledger:Array.from({length:300},(_,i)=>({i})),services:{seen:{a:1}},shop:{receipts:{x:{}}},battleReceipts:{old:{}},archivedRuns:[{id:'z'}],battleRun:{id:'previous'},treasures:[{id:'t1',defId:'iron',star:2,locked:true},{id:'t2',defId:'book',star:1}]});
 state.heroes['15'].treasure='t1';
 const run=newRun(state,1,'lean');
 assert.deepEqual(Object.keys(run.profile).sort(),['heroes','order','reducedMotion','strategy','treasures']);
 assert.deepEqual(run.profile.treasures,[{id:'t1',defId:'iron',star:2}]);
 assert.equal(run.silver,8);assert.ok(JSON.stringify(run).length<6000);
 // Equipped treasure still reaches combat through the lean profile.
 assert.equal(combatant({id:1,hero:'15',rank:1,x:3,y:2},0,run.profile).hp,Math.floor(950*(1+.08*1.25)));
 // Runs saved with a full profile copy are slimmed the next time the save is written.
 const legacy={battleRun:{id:'r',profile:structuredClone(state)}};compactSave(legacy,0);
 assert.deepEqual(legacy.battleRun.profile,runProfile(state));
});

test('ledger keeps recent detail and folds the rest into a total',()=>{
 const disk=memory(),store=createGameStore(disk),start=store.get().gold;
 for(let i=0;i<RETENTION.ledgerEntries+50;i++)store.update(s=>{s.gold+=3;return s;});
 const s=store.get(),recent=s.ledger.reduce((n,e)=>n+e.deltas.gold,0);
 assert.equal(s.ledger.length,RETENTION.ledgerEntries);assert.equal(s.ledgerSummary.entries,50);
 assert.equal(s.ledgerSummary.deltas.gold+recent,s.gold-start);
 assert.equal(s.ledgerSummary.throughRevision+1,s.ledger[0].afterRevision);
});

test('aged-out shop receipts refuse the old request instead of paying again',()=>{
 const store=createGameStore(memory()),t0=Date.now();
 const pull={id:'pull-1',type:'recruit',pool:'hero',currency:'gold',count:1,seed:7,issuedAt:t0,time:t0};
 store.update(s=>applyShopCommand(s,pull));
 const paid=store.get();assert.equal(paid.gold,200);
 // Unseen result: the receipt is pinned however old it gets.
 store.update(s=>{s.shop.lastTime=t0+40*DAY;return s;});
 assert.ok(store.get().shop.receipts['pull-1']);
 assert.equal(store.update(s=>applyShopCommand(s,pull)).gold,200);
 store.update(s=>{s.shop.pending=null;return s;});
 const after=store.get();
 assert.equal(after.shop.receipts['pull-1'],undefined);assert.equal(after.shop.receiptFloor,t0);
 assert.throws(()=>store.update(s=>applyShopCommand(s,pull)),/보관 기간/);
 assert.throws(()=>store.update(s=>applyShopCommand(s,{...pull,time:t0+41*DAY})),/보관 기간/);
 assert.equal(store.get().gold,200);
 assert.deepEqual(Object.values(store.get().heroes).map(h=>[h.owned,h.cards]),Object.values(after.heroes).map(h=>[h.owned,h.cards]));
 // A new request issued after the boundary works normally.
 store.update(s=>{s.gold+=300;return s;});
 assert.equal(store.update(s=>applyShopCommand(s,{...pull,id:'pull-2',issuedAt:t0+41*DAY,time:t0+41*DAY})).gold,200);
 // Requests without any time stamp keep their receipt forever.
 const bare=createGameStore(memory());bare.update(s=>applyShopCommand(s,{id:'bare',type:'recruit',pool:'hero',currency:'gold',count:1,seed:7}));
 bare.update(s=>{s.shop.pending=null;s.shop.lastTime=Date.now()+400*DAY;return s;});
 assert.ok(bare.get().shop.receipts.bare);assert.equal(bare.update(s=>applyShopCommand(s,{id:'bare',type:'recruit',pool:'hero',currency:'gold',count:1,seed:7})).gold,200);
});

test('aged-out battle receipts never reopen a settled run; the active run survives',()=>{
 const store=createGameStore(memory()),t0=Date.now();
 const clear=(id,startedAt)=>{const r=newRun(store.get(),2,id,null,startedAt);r.round=stage.rounds.length;r.phase='result';r.outcome='win';return r;};
 const first=clear('run-1',t0);
 store.update(s=>({...s,battleRun:first}));store.update(s=>settle(s,first,t0+1000));
 assert.equal(store.get().gold,600);
 // Still on the result screen 40 days later: receipt pinned, re-settle pays nothing.
 store.update(s=>{s.battleClock=t0+40*DAY;return s;});
 assert.ok(store.get().battleReceipts['run-1']);assert.equal(store.update(s=>settle(s,first)).gold,600);
 store.update(s=>({...s,battleRun:null}));
 assert.equal(store.get().battleReceipts['run-1'],undefined);assert.equal(store.get().battleReceiptFloor,t0+1000);
 assert.throws(()=>store.update(s=>settle(s,first)),/보관 기간/);
 assert.throws(()=>store.update(s=>settle(s,{...first,startedAt:undefined})),/보관 기간/);
 assert.equal(store.get().gold,600);
 // An active run started long ago can still be finished and paid exactly once.
 const old=clear('run-old',t0-90*DAY);
 store.update(s=>({...s,battleRun:old}));
 assert.equal(store.update(s=>settle(s,old)).gold,620);assert.equal(store.update(s=>settle(s,old)).gold,620);
 // A fresh run after the boundary settles as usual.
 store.update(s=>({...s,battleRun:null}));
 const fresh=clear('run-new',t0+41*DAY);
 assert.equal(settle(store.get(),fresh).gold,640);
});

test('quest marks, mail and command receipts are bounded without losing live records',()=>{
 const week=3000,now=(week*7-3)*DAY-14400000+DAY;
 const s={battleRun:{id:'live'},services:{clock:now,periods:{day:String(week*7-3),week:String(week)},quests:{},claims:{['bonus:day:'+(week*7-3)]:true,'bonus:day:100':true,['bonus:week:'+week]:true,'bonus:week:5':true},
  seen:{legacy:true,'skill:live:1:4':week-9,'live:merge:2':week-9,'run:live':week-9,'skill:gone:1:4':week-2,'draw:recent':week-1},
  mail:[{id:'open',expireAt:now+DAY,claimedAt:null},{id:'claimed-old',expireAt:now-50*DAY,claimedAt:now-60*DAY},{id:'expired-old',expireAt:now-40*DAY,claimedAt:null},{id:'claimed-recent',expireAt:now+DAY,claimedAt:now-DAY}]}};
 compactSave(s,now);
 assert.deepEqual(Object.keys(s.services.seen).sort(),['draw:recent','legacy','live:merge:2','run:live','skill:live:1:4']);
 assert.equal(s.services.seen.legacy,week);
 assert.deepEqual(s.services.mail.map(m=>m.id),['open','claimed-recent']);
 assert.deepEqual(Object.keys(s.services.claims).sort(),['bonus:day:'+(week*7-3),'bonus:week:'+week].sort());
 const receipts={commandReceipts:Object.fromEntries(Array.from({length:RETENTION.commandReceipts+25},(_,i)=>['c'+i,{revision:i,date:1000+i}]))};
 capCommandReceipts(receipts);
 assert.equal(Object.keys(receipts.commandReceipts).length,RETENTION.commandReceipts);
 assert.equal(receipts.commandReceiptFloor,1024);assert.ok(receipts.commandReceipts.c25&&!receipts.commandReceipts.c24);
 const archive={archivedRuns:Array.from({length:8},(_,i)=>({id:'a'+i,mode:'campaign',round:2,phase:'prepare',battle:{log:Array(500).fill({})},profile:{ledger:Array(500).fill({})}}))};
 compactSave(archive,0);
 assert.equal(archive.archivedRuns.length,RETENTION.archivedRuns);assert.ok(archive.archivedRuns.every(r=>r.archived&&!r.battle&&!r.profile));
});

test('save size stops growing under long play',()=>{
 let time=Date.UTC(2026,10,13);const disk=memory(),store=createGameStore(disk,()=>time),t0=time;
 // Six-hour steps: the 30-day receipt window and the ledger cap are both passed well inside the first half.
 const play=(from,to)=>{for(let i=from;i<to;i++){time=t0+i*6*3600000;
  store.update(s=>{s.gold+=400;s.shop.pending=null;return s;});
  store.update(s=>applyShopCommand(s,{id:'cmd-'+i,type:'recruit',pool:'treasure',currency:'gold',count:1,seed:i,issuedAt:time,time}));
  store.update(s=>{const t=s.treasures.pop();s.shop.pending=null;return s;});
  const run=newRun(store.get(),i,'run-'+i,null,time);run.round=stage.rounds.length;run.phase='result';run.outcome='win';
  store.update(s=>({...s,battleRun:run}));store.update(s=>settle(s,run,time));store.update(s=>({...s,battleRun:null}));
 }return disk.size();};
 const half=play(0,200),full=play(200,400);
 assert.ok(full<half*1.05,`save grew from ${half} to ${full} bytes`);
 assert.ok(full<200000,`save is ${full} bytes`);
 const s=store.get();
 assert.ok(Object.keys(s.shop.receipts).length<=30*4+2);assert.ok(Object.keys(s.battleReceipts).length<=30*4+2);assert.equal(s.ledger.length,RETENTION.ledgerEntries);
});

test('treasures cannot be equipped, removed or changed during a run',()=>{
 let s=createGameStore(memory()).get();s.treasures=[{id:'a',defId:'iron',star:1},{id:'b',defId:'book',star:1}];
 s=manageTreasure(s,{type:'equip',id:'a',hero:'15'});assert.equal(s.heroes['15'].treasure,'a');
 assert.throws(()=>manageTreasure(s,{type:'equip',id:'a',hero:'0'}),/다른 장수/);
 assert.throws(()=>manageTreasure(s,{type:'equip',id:'b',hero:'1'}),/보유한 장수/);
 const onRun={...s,battleRun:{id:'r'}};
 for(const c of [{type:'equip',id:'a',hero:'15'},{type:'equip',id:'b',hero:'15'},{type:'lock',id:'b'},{type:'dismantle',id:'b'}])assert.throws(()=>manageTreasure(onRun,c),/출정을 마친 뒤/);
 assert.equal(onRun.heroes['15'].treasure,'a');
 s=manageTreasure(s,{type:'equip',id:'b',hero:'15'});assert.equal(s.heroes['15'].treasure,'b');
 s=manageTreasure(s,{type:'equip',id:'b',hero:'15'});assert.equal(s.heroes['15'].treasure,null);
});

test('stun cancels a pending action and blocks new ones until it ends',()=>{
 const p=profile(),a=combatant({id:1,hero:'infantry',rank:1,x:3,y:3},0,p),t=combatant({id:2,hero:'infantry',rank:1,x:3,y:4},1,p);
 a.action={start:0,at:2,target:2};a.status.stun={until:12};t.ready=9999;
 const b=createBattle([a,t]);for(let i=0;i<11;i++)stepBattle(b);
 assert.equal(b.log.filter(e=>e.source===1).length,0);assert.equal(b.units[0].action,null);assert.equal(b.units[1].hp,t.hp);
 for(let i=0;i<30;i++)stepBattle(b);
 assert.ok(b.log.some(e=>e.type==='attack'&&e.source===1));
});

test('Huang Zhong and Zhang Liao follow the decided target order',()=>{
 const p=profile(),enemy=(id,x,y,edit={})=>Object.assign(combatant({id,hero:'infantry',rank:1,x,y},1,p),edit);
 // 황충: farthest Manhattan distance, then lowest HP ratio, then lowest id.
 const archer=combatant({id:1,hero:'16',rank:1,x:3,y:0},0,p);
 let b=cast(archer,[enemy(10,3,2),enemy(12,3,6),enemy(11,3,6,{hp:100})]);
 assert.equal(b.events.find(e=>e.type==='hit').target,11);
 b=cast(combatant({id:1,hero:'16',rank:1,x:3,y:0},0,p),[enemy(10,3,2),enemy(12,3,6),enemy(11,3,6)]);
 assert.equal(b.events.find(e=>e.type==='hit').target,11);
 // 장료: enemy back row, then lowest DEF, then lowest id; lands on the free neighbour nearest to himself.
 const liao=combatant({id:1,hero:'34',rank:1,x:3,y:3},0,p);
 b=cast(liao,[enemy(10,3,4),enemy(12,2,7),enemy(11,5,7,{def:1})]);
 assert.deepEqual([b.units[0].x,b.units[0].y],[5,6]);assert.equal(b.log.find(e=>e.type==='damage').target,11);
 // From the enemy side the "back row" is the low rows.
 const foe=combatant({id:100,hero:'bandit',rank:1,x:3,y:5},1,p),ally=(id,x,y)=>combatant({id,hero:'infantry',rank:1,x,y},0,p);
 b=cast(foe,[ally(1,3,3),ally(2,4,0)]);
 assert.equal(b.log.find(e=>e.type==='damage').target,2);
});

test('awakening strengthens the single signature tactic and output escaping is shared',()=>{
 assert.deepEqual([1,2,3,4,5].map(star=>awakeningSkill(star)),[{coefficient:1,durationTicks:0},{coefficient:1,durationTicks:0},{coefficient:1.1,durationTicks:10},{coefficient:1.1,durationTicks:10},{coefficient:1.2,durationTicks:20}]);
 const p=profile();p.heroes['2'].star=5;
 const fei=combatant({id:1,hero:'2',rank:1,x:3,y:3},0,p),t=combatant({id:2,hero:'infantry',rank:1,x:3,y:4},1,p);
 assert.equal(fei.skillPower,1.2);
 const b=cast(fei,[t]);assert.equal(b.units[0].status.reduce.until,1+60+20);
 assert.equal(escapeHtml('<img src=x onerror="a()">&\''),'&lt;img src=x onerror=&quot;a()&quot;&gt;&amp;&#39;');
 assert.equal(escapeHtml(undefined),'');
});

// Tutorial acceptance: start -> five rounds -> reward -> permanent training, with reload, abandon and loss paths.
import {newTutorial,prepareCommand,finishRound,retryRound} from '../battle-run.js';
import {grow} from '../progression.js';
function playTutorial(state,id,{reloadEachStep=false}={}){
 const reload=r=>reloadEachStep?JSON.parse(JSON.stringify(r)):r;
 const fight=r=>{r=startRound(r);let ticks=0;while(!r.battle.result){stepBattle(r.battle);if(reloadEachStep&&++ticks%40===0)r=JSON.parse(JSON.stringify(r));}return finishRound(r);};
 let r=newTutorial(state,1,id,Date.now());r.tutorial.step=2;
 r=reload(prepareCommand(r,{type:'summon'}));r=reload(prepareCommand(r,{type:'move',id:1,x:3,y:3}));r=reload(fight(r));r=reload(nextRound(r));
 r=reload(prepareCommand(r,{type:'summon'}));r=reload(prepareCommand(r,{type:'move',id:2,x:3,y:3}));
 r=reload(prepareCommand(r,{type:'summon'}));r=reload(prepareCommand(r,{type:'move',id:3,x:4,y:1}));r=reload(prepareCommand(r,{type:'capacity'}));r=reload(prepareCommand(r,{type:'equip',id:1,index:0}));
 r=reload(prepareCommand(r,{type:'sell',id:r.units.find(u=>u.trainingSale).id}));r.tutorial.step=13;
 for(;;){r=reload(fight(r));assert.equal(r.outcome,'win');if(r.round===stage.rounds.length)return r;r=reload(nextRound(r));}
}
test('tutorial pays once, finishes on the first permanent training and survives reloads, abandon and loss',()=>{
 const store=createGameStore(memory());
 // Reloading after every command and every two seconds of combat gives the same run as playing straight through.
 const straight=playTutorial(store.get(),'t-1'),reloaded=playTutorial(store.get(),'t-1',{reloadEachStep:true});
 assert.deepEqual({...reloaded,startedAt:0},{...straight,startedAt:0});
 // Abandoning before the end pays nothing and leaves the tutorial open.
 store.update(s=>({...s,battleRun:newTutorial(s,1,'t-abandon',Date.now())}));store.update(s=>({...s,battleRun:null}));
 assert.equal(store.get().gold,500);assert.equal(store.get().tutorial,undefined);
 // A lost tutorial round pays nothing, can be retried, and does not mark the reward as taken.
 const lost={...newTutorial(store.get(),1,'t-loss',Date.now()),phase:'result',outcome:'loss',snapshot:{units:[],silver:7,capacity:3,gear:[]}};
 assert.equal(retryRound(lost).phase,'prepare');
 store.update(s=>({...s,battleRun:lost}));store.update(s=>settle(s,lost));store.update(s=>({...s,battleRun:null}));
 assert.equal(store.get().gold,500);assert.ok(!store.get().tutorial?.rewarded);
 // Winning pays 100 gold exactly once, also after a reload of the result screen.
 store.update(s=>({...s,battleRun:straight}));store.update(s=>settle(s,straight));
 const resumed=createGameStore({getItem:()=>JSON.stringify(store.get()),setItem(){}}).get();
 assert.equal(resumed.gold,600);assert.equal(settle(resumed,resumed.battleRun).gold,600);
 assert.deepEqual(store.get().tutorial,{step:15,rewarded:true,completed:false});
 store.update(s=>({...s,battleRun:null}));
 // The first permanent training afterwards completes the tutorial; tutorial events never count for quests.
 store.update(s=>grow(s,'15','train'));
 assert.deepEqual(store.get().tutorial,{step:16,rewarded:true,completed:true});
 assert.equal(store.get().services.quests.daily_run.progress,0);assert.equal(store.get().services.quests.daily_train.progress,1);
 // Playing the tutorial again is allowed but pays nothing more.
 const again=playTutorial(store.get(),'t-2');const before=store.get().gold;
 store.update(s=>({...s,battleRun:again}));store.update(s=>settle(s,again));
 assert.equal(store.get().gold,before);assert.equal(store.get().tutorial.completed,true);
});
