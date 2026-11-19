// Faction choice, the 49-hero roster, new tactic rules, faction synergy and bonds
// (docs/삼국체스_종합기획서_v1.0.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import {heroes} from '../heroes.js';
import {specs,awakening5} from '../progression.js';
import {createGameStore,validateSave} from '../store.js';
import {applyShopCommand,poolEntries} from '../economy.js';
import {combatant} from '../battle-data.js';
import {createBattle,stepBattle} from '../battle-engine.js';
import {factions,defaultStarter,chooseFaction,synergyTiers,synergies} from '../factions.js';
import {bonds,activeBonds} from '../bonds.js';
import {newTutorial,prepareCommand} from '../battle-run.js';

const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
const profile=(star=1)=>({gold:500,order:[...defaultStarter],heroes:Object.fromEntries(heroes.map(h=>[h.id,{level:1,star,owned:true,treasure:null}])),treasures:[]});
const unit=(id,hero,x,y,side=0,p=profile())=>combatant({id,hero,rank:1,x,y},side,p);
const foe=(id,x,y,edit={})=>Object.assign(unit(id,'infantry',x,y,1),edit);
function cast(caster,others,center){caster.action={start:0,at:1,skill:true,target:others.find(u=>u.side!==caster.side)?.id??others[0].id,center};for(const u of [caster,...others])u.ready=9999;const b=createBattle([caster,...others]);stepBattle(b);return b;}
const damageTo=(b,id)=>b.log.filter(e=>e.type==='damage'&&e.target===id).map(e=>e.value);

test('roster has 49 heroes with the planned faction and grade spread, specs and awakening text',()=>{
 assert.equal(heroes.length,49);assert.equal(new Set(heroes.map(h=>h.id)).size,49);
 const count=key=>heroes.reduce((m,h)=>{const k=key(h);m[k]=(m[k]??0)+1;return m;},{});
 assert.deepEqual(count(h=>h.faction),{'촉':12,'위':12,'오':12,'군웅':13});
 assert.deepEqual(count(h=>specs[h.id].grade),{S:12,A:16,B:12,C:9});
 for(const h of heroes){assert.equal(specs[h.id].stats.length,7,h.name);assert.ok(specs[h.id].skill&&specs[h.id].description&&awakening5[h.id],h.name);assert.ok(h.sprite&&h.portrait,h.name);}
 // Every hero now has approved full-body art and an independent portrait.
 assert.ok(heroes.every(h=>h.artworkStatus==='user-approved'&&h.sprite===`../art-source/characters/v1/${h.id}/front.png`));
 for(const f of Object.values(factions)){assert.equal(f.starter.length,6);assert.ok(f.starter.every(id=>specs[id]),f.id);assert.equal(heroes.find(h=>h.id===f.lord).faction,f.id);
  assert.deepEqual(f.starter.slice(0,3).map(id=>specs[id].grade),['A','B','B']);}
});

test('every hero casts and the battle ends, at awakening 1 and 5',()=>{
 for(const star of [1,5])for(const h of heroes){
  const p=profile(star),units=[unit(1,h.id,3,3,0,p),unit(2,'infantry',2,3,0,p),combatant({id:100,hero:'boss',rank:1,x:3,y:5},1,p),combatant({id:101,hero:'raider',rank:1,x:4,y:5},1,p)];
  units[0].mana=units[0].maxMana;const b=createBattle(units);while(!b.result)stepBattle(b);
  assert.ok(b.units[0].casts>=1,`${h.name} ${star}성`);assert.ok(b.units.every(u=>Number.isFinite(u.hp)&&u.hp>=0&&Number.isFinite(u.mana)),`${h.name} ${star}성`);assert.ok(b.tick<=1800);
 }
});

test('new status rules: stun, chain, armour break, lifesteal, mana, silence, root',()=>{
 // 서황: 230% and a one-second stun that cancels and blocks actions.
 let t=foe(10,3,4);let b=cast(unit(1,'xuhuang',3,3),[t]);
 assert.deepEqual(damageTo(b,10),[Math.floor(90*2.3*100/130)]);assert.equal(b.units[1].status.stun.until,21);
 // 사마의: three different targets with falling strength; a fourth at awakening 5.
 const line=()=>[foe(10,3,5),foe(11,3,6),foe(12,3,7),foe(13,4,7)];
 b=cast(unit(1,'simayi',3,1),line());
 assert.deepEqual([10,11,12,13].map(id=>damageTo(b,id).length),[1,1,1,0]);assert.ok(damageTo(b,10)[0]>damageTo(b,11)[0]&&damageTo(b,11)[0]>damageTo(b,12)[0]);
 b=cast(unit(1,'simayi',3,1,0,profile(5)),line());assert.deepEqual([10,11,12,13].map(id=>damageTo(b,id).length),[1,1,1,1]);
 // 곽가: all enemies lose 20% defence and magic defence; the highest-HP enemy is struck.
 b=cast(unit(1,'guojia',3,1),[foe(10,3,5),foe(11,4,5,{hp:5000,maxHp:5000})]);
 assert.deepEqual(b.units.slice(1).map(u=>u.status.defDown.def),[.2,.2]);assert.equal(damageTo(b,11).length,1);assert.equal(damageTo(b,10).length,0);
 assert.equal(damageTo(b,11)[0],Math.floor(120*2.2*100/(100+15*.8)));
 // 위연: heals 30% of the damage dealt.
 const wei=unit(1,'weiyan',3,3);wei.hp=400;b=cast(wei,[foe(10,3,4)]);
 const dealt=damageTo(b,10)[0];assert.equal(dealt,Math.floor(95*2.5*1.3*100/130));assert.ok(Math.abs(b.units[0].hp-(400+dealt*.3))<1e-6);
 // 순욱: every ally gains 20 mana.
 b=cast(unit(1,'xunyu',3,1),[unit(2,'infantry',2,1),foe(10,3,5)]);assert.equal(b.units[1].mana,20);
 // 여몽: the silenced target gains no mana while silenced.
 t=foe(10,3,7);b=cast(unit(1,'lumeng',3,1),[t]);assert.ok(b.units[1].status.silence);assert.equal(b.units[1].mana,0);
 // 방통: bound targets cannot move.
 t=foe(10,3,7);b=cast(unit(1,'pangtong',3,0),[t],{x:3,y:7});b.units[1].ready=0;for(let i=0;i<30;i++)stepBattle(b);assert.deepEqual([b.units[1].x,b.units[1].y],[3,7]);
 for(let i=0;i<40;i++)stepBattle(b);assert.notDeepEqual([b.units[1].x,b.units[1].y,b.units[1].move],[3,7,undefined]);
});

test('movement tactics, row fire, kill effects and cleansing',()=>{
 // 마초: charges to the farthest enemy, hits what he passes and stuns around the landing cell.
 let b=cast(unit(1,'machao',3,0),[foe(10,3,2),foe(11,3,6)]);
 assert.deepEqual([b.units[0].x,b.units[0].y],[3,5]);assert.equal(damageTo(b,10).length,1);assert.equal(damageTo(b,11).length,1);assert.ok(b.units[2].status.stun&&!b.units[1].status.stun);
 // 육손: the fullest enemy row burns three times; at awakening 5 the fire spreads one row up and down once.
 const rows=()=>[foe(10,2,5),foe(11,5,5),foe(12,3,6)];
 b=cast(unit(1,'luxun',3,0),rows());assert.deepEqual(b.events.filter(e=>e.type==='fire').map(e=>[e.at,e.row]),[[21,5],[41,5],[61,5]]);
 while(b.tick<21)stepBattle(b);assert.deepEqual([10,11,12].map(id=>damageTo(b,id).length),[1,1,0]);
 b=cast(unit(1,'luxun',3,0,0,profile(5)),rows());assert.deepEqual(b.events.filter(e=>e.type==='fire').map(e=>[e.at,e.row]),[[21,5],[41,5],[61,5],[81,4],[81,6]]);
 // 감녕: a kill with the tactic triggers one more strike on the next weakest enemy.
 b=cast(unit(1,'ganning',3,0),[foe(10,3,6,{hp:5}),foe(11,5,6,{hp:900,maxHp:900})]);
 assert.equal(b.units[1].hp,0);stepBattle(b);assert.equal(damageTo(b,11).length,1);stepBattle(b);assert.equal(damageTo(b,11).length,1);
 // 손책: a kill during the stance extends it by one second.
 const sunce=unit(1,'sunce',3,3);b=cast(sunce,[foe(10,3,4,{hp:1})]);const until=b.units[0].status.rage.until;
 b.units[0].action={start:b.tick,at:b.tick+1,target:10};stepBattle(b);assert.equal(b.units[1].hp,0);assert.equal(b.units[0].status.rage.until,until+20);
 // 화타: heals everyone and removes weakening effects.
 const hurt=unit(2,'infantry',2,1);hurt.hp=100;hurt.status={slow:{until:999},defDown:{until:999,def:.2,mdef:.2},silence:{until:999},buff:{until:999}};
 b=cast(unit(1,'huatuo',3,1),[hurt,foe(10,3,6)]);assert.deepEqual(Object.keys(b.units[1].status),['buff']);assert.ok(b.units[1].hp>100);
 // 장각: one-second warning like the boss tactic.
 const jue=unit(1,'zhangjue',3,1),enemy=foe(10,3,4);jue.mana=jue.maxMana;enemy.ready=9999;b=createBattle([jue,enemy]);stepBattle(b);assert.equal(b.units[0].action.at-b.units[0].action.start,20);
});

test('faction synergy counts distinct deployed heroes and only changes that faction',()=>{
 assert.deepEqual(synergyTiers([{hero:'1',faction:'촉'},{hero:'1',faction:'촉'},{hero:'32',faction:'위'}]),{});
 assert.deepEqual(synergyTiers(['1','2','15','16'].map(hero=>({hero,faction:'촉'}))),{'촉':{count:4,tier:2}});
 const side=ids=>createBattle([...ids.map((hero,i)=>unit(i+1,hero,i,2)),foe(100,3,6)]).units;
 const base=id=>unit(1,id,0,2);
 // 촉 2: HP +6%. 위 2: attack +6%. 군웅 2: faster attacks. 오 2: tactic strength +8%.
 let u=side(['1','2']);assert.equal(u[0].maxHp,Math.floor(base('1').maxHp*1.06));assert.equal(u[0].atk,base('1').atk);
 u=side(['32','33']);assert.equal(u[0].atk,Math.floor(base('32').atk*1.06));assert.equal(u[2].atk,foe(100,3,6).atk);
 u=side(['119','yanliang','infantry']);assert.equal(u[0].interval,Math.ceil(base('119').interval/1.05));
 u=side(['77','luxun']);assert.ok(Math.abs(u[0].skillBonus-.08)<1e-9);
 // Six of one faction reach the top tier with its extra effect.
 u=side(['1','2','15','16','35','0']);assert.equal(u[3].maxHp,Math.floor(base('16').maxHp*1.2));assert.ok(u[3].shield>=u[3].maxHp*.05);
 u=side(['119','yanliang','wenchou','huaxiong','infantry','archer']);assert.ok(u[1].killHeal>=.05);
 assert.deepEqual(Object.keys(synergies).sort(),Object.keys(factions).sort());
});

test('twenty bonds activate on their members and apply their start-of-battle effects',()=>{
 assert.equal(bonds.length,20);assert.ok(bonds.every(bond=>bond.members.every(id=>specs[id])));
 const active=ids=>activeBonds(ids.map(hero=>({hero}))).map(a=>a.bond.id);
 assert.deepEqual(active(['0','1','2']),['peach']);assert.deepEqual(active(['1','2','15']),['tigers']);assert.deepEqual(active(['1','1','2']),[]);
 assert.deepEqual(active(['zhangjue','infantry']),[]);assert.deepEqual(active(['infantry','archer','tactician']),[]);assert.deepEqual(active(['zhangjue','infantry','archer']),['taiping']);
 assert.deepEqual(active(['35','77','pangtong']).sort(),['chibi','wolong']);
 const battle=(ids,enemy=foe(100,3,6))=>createBattle([...ids.map((hero,i)=>unit(i+1,hero,i,2)),enemy]).units;
 const solo=id=>unit(1,id,0,2);
 // 오호대장군: 3 members +8%, all 5 +15% (on top of the 촉 synergy, which does not touch attack).
 assert.equal(battle(['1','2','15'])[0].atk,Math.floor(solo('1').atk*1.08));
 assert.equal(battle(['1','2','15','machao','16'])[0].atk,Math.floor(solo('1').atk*1.15));
 // 도원결의 shield, 와룡봉추 mana, 오자양장 first hit, 호위 쌍벽 with 조조, 위의 책사진 on enemies.
 assert.ok(battle(['0','1','2']).slice(0,3).every(u=>u.shield>0));
 assert.deepEqual(battle(['35','pangtong']).slice(0,2).map(u=>u.mana),[20,20]);
 assert.deepEqual(battle(['34','xuhuang','yuejin']).slice(0,3).map(u=>u.firstHit),[1.5,1.5,1.5]);
 const guards=battle(['dianwei','xuchu','32']);assert.equal(guards[2].guard,.15);assert.equal(guards[0].def,Math.floor(solo('dianwei').def*1.15));
 const enemy=foe(100,3,6);assert.equal(battle(['simayi','guojia'],enemy).at(-1).mdef,Math.floor(enemy.mdef*.9));
 assert.deepEqual(battle(['34','xuhuang']).slice(0,2).map(u=>u.firstHit),[undefined,undefined]);
 // 오자양장: only the first basic attack is stronger.
 const b=createBattle([unit(1,'34',3,3),unit(2,'xuhuang',2,3),unit(3,'yuejin',4,3),foe(100,3,4,{hp:9000,maxHp:9000})]);
 b.units.forEach(u=>{u.ready=9999;});b.units[0].action={start:0,at:1,target:100};stepBattle(b);b.units[0].action={start:1,at:2,target:100};stepBattle(b);
 const hits=damageTo(b,100);assert.ok(hits[0]>hits[1]*1.4&&hits[0]<hits[1]*1.6);
});

test('choosing a faction: starter for a fresh profile, nothing lost for an existing one, one change',()=>{
 const fresh=()=>createGameStore(memory()).get();
 for(const f of Object.values(factions)){
  const s=validateSave(chooseFaction(fresh(),f.id));
  assert.equal(s.faction,f.id);assert.deepEqual(s.order,f.starter);
  assert.deepEqual(Object.entries(s.heroes).filter(([,h])=>h.owned).map(([id])=>id).sort(),[...f.starter].sort());
 }
 // A profile with progress keeps everything and only receives the starter heroes it lacks.
 const played=fresh();played.gold=1234;played.heroes['16'].level=7;played.heroes['1'].owned=true;
 const kept=validateSave(chooseFaction(played,'오'));
 assert.equal(kept.gold,1234);assert.equal(kept.heroes['16'].level,7);assert.ok(kept.heroes['16'].owned&&kept.heroes['1'].owned&&kept.heroes.sunquan.owned&&kept.heroes.huanggai.owned);
 assert.deepEqual(kept.order,defaultStarter);
 // One later change: lord and recruit preference move, heroes stay, no second starter.
 const changed=chooseFaction(kept,'위');assert.equal(changed.faction,'위');assert.ok(!changed.heroes.xuhuang.owned);
 assert.throws(()=>chooseFaction(changed,'촉'),/한 번만/);assert.equal(chooseFaction(changed,'위').faction,'위');
 assert.throws(()=>chooseFaction(fresh(),'없는나라'),/없는 세력/);
 assert.throws(()=>validateSave({...fresh(),faction:'없는나라'}),/세력/);
});

test('old saves still load; historical nation has no effect on recruitment odds',()=>{
 const old=createGameStore(memory()).get();for(const h of heroes.filter(h=>h.art==='pending'))delete old.heroes[h.id];
 const loaded=validateSave(old);assert.equal(Object.keys(loaded.heroes).length,49);assert.equal(loaded.heroes.simayi.owned,false);assert.equal(loaded.gold,old.gold);
 const disk=memory();disk.setItem('samguk-chess-save-v2',JSON.stringify(old));assert.equal(Object.keys(createGameStore(disk).get().heroes).length,49);
 // 2,000 A-or-better-free pulls: count how often a 촉 hero appears among B results.
 const share=faction=>{let s=createGameStore(memory()).get();s.gold=10**9;if(faction)s=chooseFaction(s,faction);let mine=0,total=0;
  for(let i=0;i<200;i++){s=applyShopCommand(s,{id:'p'+i,type:'recruit',pool:'hero',currency:'gold',count:10,seed:1000+i});for(const r of s.shop.pending.results)if(r.grade==='B'){total++;if(heroes.find(h=>h.id===r.id).faction==='촉')mine++;}s.shop.pending=null;}
  return mine/total;};
 const neutral=share(null),favoured=share('촉'),b=poolEntries('hero').filter(e=>e.grade==='B'),shu=b.filter(e=>e.faction==='촉').length;
 assert.ok(Math.abs(neutral-shu/b.length)<.06,`neutral ${neutral}`);assert.equal(favoured,neutral,'same seeds produce the same recruitment regardless of historical nation');
 // Grade odds themselves do not move.
 let s=chooseFaction(createGameStore(memory()).get(),'촉');s.gold=10**9;const grades={C:0,B:0,A:0,S:0};
 for(let i=0;i<300;i++){s=applyShopCommand(s,{id:'g'+i,type:'recruit',pool:'hero',currency:'gold',count:10,seed:5000+i});for(const r of s.shop.pending.results)grades[r.grade]++;s.shop.pending=null;}
 assert.ok(Math.abs(grades.C/3000-.6)<.04&&Math.abs(grades.B/3000-.3)<.04);
});

test('tutorial summons follow the formation instead of fixed heroes',()=>{
 const s=chooseFaction(createGameStore(memory()).get(),'위');let r=newTutorial(s,1,'t');r.tutorial.step=2;
 r=prepareCommand(r,{type:'summon'});assert.equal(r.units[0].hero,'32');
 const legacy=createGameStore(memory()).get();r=newTutorial(legacy,1,'t');r.tutorial.step=2;r=prepareCommand(r,{type:'summon'});assert.equal(r.units[0].hero,'15');
});
