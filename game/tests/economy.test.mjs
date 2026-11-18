import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameStore,validateSave} from '../store.js';
import {applyShopCommand,poolEntries,remaining,products,periods} from '../economy.js';
import {combatant} from '../battle-data.js';
import {manageTreasure} from '../treasures.js';
const memory=()=>{const d=new Map();return {getItem:k=>d.get(k)??null,setItem:(k,v)=>d.set(k,v)}};
const fresh=()=>{const s=createGameStore(memory()).get();s.gold=100000;s.diamonds=2000;s.freeDiamonds=1200;s.paidDiamonds=800;return s};
const recruit=(extras={})=>({id:'draw1',type:'recruit',pool:'hero',currency:'gold',count:1,seed:123,time:Date.UTC(2026,10,13),...extras});
test('ten draws debit once, replay is idempotent, deterministic results',()=>{const s=fresh(),cmd=recruit({count:10}),n=applyShopCommand(s,cmd);assert.equal(n.gold,s.gold-3000);assert.equal(n.shop.pending.results.length,10);assert.deepEqual(applyShopCommand(n,cmd),n);assert.deepEqual(applyShopCommand(s,cmd),n);assert.equal(s.shop.pending,null);});
test('diamonds consume free first and never go negative',()=>{const s=fresh();s.freeDiamonds=50;s.paidDiamonds=100;s.diamonds=150;const n=applyShopCommand(s,recruit({currency:'diamonds'}));assert.equal(n.freeDiamonds,0);assert.equal(n.paidDiamonds,50);assert.equal(n.diamonds,50);assert.throws(()=>applyShopCommand(n,recruit({id:'next',currency:'diamonds'})),/부족/);});
test('30/100 pity, precedence, separate pools and shared currency counters',()=>{const s=fresh();s.shop.pity.hero={a:29,s:99};const n=applyShopCommand(s,recruit());assert.equal(n.shop.pending.results[0].grade,'S');assert.deepEqual(n.shop.pity.hero,{a:0,s:0});assert.deepEqual(n.shop.pity.treasure,{a:0,s:0});s.shop.pity.hero={a:29,s:30};assert.ok(['A','S'].includes(applyShopCommand(s,recruit({currency:'diamonds'})).shop.pending.results[0].grade));});
test('new hero unlocks, duplicate increments cards, max star converts',()=>{const s=fresh();s.shop.pity.hero.s=99;const n=applyShopCommand(s,recruit()),id=n.shop.pending.results[0].id;assert.equal(n.heroes[id].owned,true);assert.equal(n.shop.pending.results[0].status,'new');n.shop.pity.hero.s=99;const dup=applyShopCommand(n,recruit({id:'dup'}));assert.equal(dup.heroes[id].cards,1);dup.heroes[id].star=5;dup.shop.pity.hero.s=99;const max=applyShopCommand(dup,recruit({id:'max'}));assert.equal(max.heroTokens,8);});
test('treasure draws create separate instances, not hero duplicates',()=>{const s=fresh(),n=applyShopCommand(s,recruit({pool:'treasure',count:10}));assert.equal(n.treasures.length,10);assert.equal(new Set(n.treasures.map(t=>t.id)).size,10);assert.deepEqual(n.heroes,s.heroes);});
test('all 32 treasures can be drawn, equipped and affect PvE combat',()=>{
 const entries=poolEntries('treasure');
 assert.equal(entries.length,32);
 const start=fresh(),drawn=new Map(),hero=start.order[0],unit={id:1,hero,rank:1,x:3,y:3};
 const plain=combatant(unit,0,start);
 const fields={atk:'atk',hp:'maxHp',def:'def',mdef:'mdef',speed:'interval',skill:'skillBonus',move:'moveBonus',heal:'healBonus',shield:'shieldBonus'};
 for(let seed=0;seed<2000&&drawn.size<entries.length;seed++){
  const result=applyShopCommand(start,recruit({pool:'treasure',count:10,seed}));
  for(const item of result.treasures)drawn.set(item.defId,[item,result]);
 }
 assert.equal(drawn.size,entries.length);
 for(const def of entries){
  const [item,result]=drawn.get(def.id);
  const equipped=manageTreasure(result,{type:'equip',id:item.id,hero});
  const field=fields[def.stat],unitWithTreasure=combatant(unit,0,equipped);
  assert.ok(def.stat==='speed'?unitWithTreasure[field]<plain[field]:unitWithTreasure[field]>plain[field],def.name);
 }
});
test('legacy treasures and unread rewards migrate without losing item state or in-progress combat power',()=>{
 const s=fresh(),hero=s.order[0],unit={id:1,hero,rank:1,x:3,y:3};
 s.treasures=[{id:'old-horse',defId:'horse',star:4,locked:true,favorite:true},{id:'old-dragon',defId:'dragon',star:5}];
 s.heroes[hero].treasure='old-horse';
 s.battleRun={profile:structuredClone(s)};
 s.shop.pending={pool:'treasure',results:[{id:'horse',instanceId:'old-horse',grade:'C'}]};
 const next=validateSave(s);
 assert.deepEqual(next.treasures,[{...s.treasures[0],defId:'tr-034'},{...s.treasures[1],defId:'tr-004'}]);
 assert.equal(next.heroes[hero].treasure,'old-horse');
 assert.deepEqual(next.shop.pending.results,[{id:'tr-034',instanceId:'old-horse',grade:'B'}]);
 assert.equal(combatant(unit,0,next.battleRun.profile).moveBonus,.05*1.75);
 assert.equal(combatant(unit,0,next).moveBonus,.12*1.75);
 assert.deepEqual(validateSave(next),next);
});
test('gold product free-only and daily cap at KST 05, rollback does not reset',()=>{let s=fresh();const time=Date.UTC(2026,10,12,19,59);for(let i=0;i<3;i++)s=applyShopCommand(s,{type:'purchase',product:'gold',id:'buy'+i,time});assert.equal(remaining(s,products[0],time),0);assert.throws(()=>applyShopCommand(s,{type:'purchase',product:'gold',id:'over',time}),/한도/);assert.equal(remaining(s,products[0],time+60000),3);assert.equal(remaining(s,products[0],time-86400000),0);s.freeDiamonds=0;s.diamonds=s.paidDiamonds;assert.throws(()=>applyShopCommand(s,{type:'purchase',product:'gold',id:'paid',time:time+60000}),/부족/);});
test('choice purchase validates before debit and applies only selected reward',()=>{const s=fresh();s.heroTokens=20;assert.throws(()=>applyShopCommand(s,{id:'bad',type:'purchase',product:'hero',choice:'1'}),/선택/);assert.equal(s.heroTokens,20);const n=applyShopCommand(s,{id:'ok',type:'purchase',product:'hero',choice:'32'});assert.equal(n.heroTokens,0);assert.equal(n.heroes['32'].owned,true);assert.equal(n.shop.pending.results[0].id,'32');});
test('week rolls over Monday 05 KST',()=>{assert.notEqual(periods(Date.UTC(2026,10,15,19,59)).week,periods(Date.UTC(2026,10,15,20)).week);});
test('stale browser cannot overwrite newer save',()=>{const disk=memory(),a=createGameStore(disk),b=createGameStore(disk);a.update({gold:400});assert.throws(()=>b.update({gold:0}),/다른 창/);assert.equal(createGameStore(disk).get().gold,400);});
test('pending results restore without paying twice',()=>{const disk=memory(),s=createGameStore(disk);s.update(v=>applyShopCommand(v,recruit()));const restored=createGameStore(disk).get();assert.equal(restored.gold,200);assert.ok(restored.shop.pending);});

test('ten-draw S guarantee triggers in the middle, then counts subsequent draws',()=>{const s=fresh();s.shop.pity.hero.s=98;const n=applyShopCommand(s,recruit({count:10,seed:1}));assert.equal(n.shop.pending.results[1].grade,'S');const lastS=n.shop.pending.results.map(r=>r.grade).lastIndexOf('S');assert.equal(n.shop.pity.hero.s,9-lastS);});
test('v2 save migrates without losing existing currency, heroes or equipment',()=>{const disk=memory();const ids=['1','2','15','16','35','0'];const hs=Object.fromEntries(ids.map(id=>[id,{level:3,star:1,cards:2,treasure:id==='1'?'iron':null}]));disk.setItem('samguk-chess-save-v2',JSON.stringify({version:2,gold:1234,diamonds:321,heroes:hs,order:ids,reducedMotion:true}));const s=createGameStore(disk);assert.equal(s.get().gold,1234);assert.equal(s.get().freeDiamonds,321);assert.equal(s.get().heroes['1'].level,3);assert.equal(s.get().heroes['1'].treasure,'legacy-iron');assert.equal(s.get().heroes['32'].owned,false);});
test('failed shop persistence grants nothing and charges nothing',async()=>{const disk=memory(),store=createGameStore(disk),before=store.get();disk.setItem=()=>{throw Error('quota')};await assert.rejects(store.transact(s=>applyShopCommand(s,recruit())),/quota/);assert.deepEqual(store.get(),before);});
