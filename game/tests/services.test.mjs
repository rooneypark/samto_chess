import test from 'node:test';import assert from 'node:assert/strict';
import {createGameStore} from '../store.js';
import {prepareServices,trackServices,serviceCommand,questDefs} from '../services.js';
import {manageTreasure} from '../treasures.js';
import {newTutorial,prepareCommand,startRound,finishRound,nextRound,settle} from '../battle-run.js';
import {stepBattle} from '../battle-engine.js';
const fresh=()=>createGameStore({getItem:()=>null,setItem(){}}).get();
test('quest claims are idempotent and completed expired quests become seven-day mail',()=>{
 let s=fresh();const now=Date.UTC(2026,10,13);prepareServices(s,now);s.services.quests.daily_train.progress=1;
 let n=serviceCommand(s,{type:'quest',id:'daily_train'},now);assert.equal(n.gold,s.gold+50);assert.equal(serviceCommand(n,{type:'quest',id:'daily_train'},now).gold,n.gold);
 s.services.quests.daily_merge.progress=5;prepareServices(s,now+86400000);assert.equal(s.services.mail.length,2);
 const id=s.services.mail[0].id;n=serviceCommand(s,{type:'mail',id},now+86400000);assert.equal(serviceCommand(n,{type:'mail',id},now+86400000).gold,n.gold);
 assert.throws(()=>serviceCommand(s,{type:'mail',id},now+9*86400000),/기간/);
});
test('quest event replay does not duplicate progress and tutorial battle events are excluded',()=>{
 let a=fresh(),b=structuredClone(a);b.battleRun={id:'r',battle:{units:[{id:1,side:0}],log:[{type:'skill',id:'r:1',source:1}]}};trackServices(a,b,1000);assert.equal(b.services.quests.daily_skill.progress,1);let c=structuredClone(b);trackServices(b,c,1000);assert.equal(c.services.quests.daily_skill.progress,1);
 c.battleRun.tutorial={step:5};c.battleRun.battle.log.push({type:'skill',id:'r:2',source:1});trackServices(b,c,1000);assert.equal(c.services.quests.daily_skill.progress,1);
});
test('treasure materials cannot consume protected or equipped instances; upgrading is atomic',()=>{
 let s=fresh();s.treasures=[{id:'a',defId:'iron',star:1},{id:'b',defId:'iron',star:1,locked:true},{id:'c',defId:'iron',star:1}];
 assert.throws(()=>manageTreasure(s,{type:'upgrade',id:'a',materials:['b','c']}));assert.equal(s.gold,500);
 s=manageTreasure(s,{type:'lock',id:'b'});s=manageTreasure(s,{type:'upgrade',id:'a',materials:['b','c']});assert.equal(s.gold,450);assert.equal(s.treasures.length,1);assert.equal(s.treasures[0].star,2);
 s.heroes['15'].treasure='a';assert.throws(()=>manageTreasure(s,{type:'dismantle',id:'a'}));
});
test('tutorial fixed summons, grants and allowed actions reach the normal rounds',()=>{
 const s=fresh();let r=newTutorial(s,1,'tutorial-test');assert.throws(()=>prepareCommand(r,{type:'summon'}));r.tutorial.step=2;
 r=prepareCommand(r,{type:'summon'});assert.equal(r.units[0].hero,'15');r=prepareCommand(r,{type:'move',id:1,x:3,y:3});r=startRound(r);while(!r.battle.result)stepBattle(r.battle);r=finishRound(r);assert.equal(r.outcome,'win');r=nextRound(r);
 r=prepareCommand(r,{type:'summon'});r=prepareCommand(r,{type:'move',id:2,x:3,y:3});assert.equal(r.tutorial.step,8);
 r=prepareCommand(r,{type:'summon'});r=prepareCommand(r,{type:'move',id:3,x:4,y:1});r=prepareCommand(r,{type:'capacity'});r=prepareCommand(r,{type:'equip',id:1,index:0});
 const infantry=r.units.find(u=>u.trainingSale);r=prepareCommand(r,{type:'sell',id:infantry.id});assert.equal(r.tutorial.step,12);
 r.tutorial.step=13;while(r.round<=5){r=startRound(r);while(!r.battle.result)stepBattle(r.battle);r=finishRound(r);assert.equal(r.outcome,'win');if(r.round===5)break;r=nextRound(r);}
 const paid=settle(s,r);assert.equal(paid.gold,600);assert.equal(settle(paid,r).gold,600);assert.equal(paid.tutorial.step,15);
});
import {government,production,collectProduction} from '../government.js';
import {grow} from '../progression.js';
test('government caps eight-hour production, prevents duplicate daily claims and consumes a free training ticket',()=>{
 let s=government(fresh(),100000);assert.equal(production(s,'farm',100000+10*3600000),240);s=collectProduction(s,'farm',100000+10*3600000);assert.equal(s.gold,740);assert.throws(()=>collectProduction(s,'farm',100000+10*3600000));s=collectProduction(s,'barracks',100000+10*3600000);assert.throws(()=>collectProduction(s,'barracks',100000+10*3600000));const n=grow(s,'15','train');assert.equal(n.gold,740);assert.equal(n.trainingTickets,0);assert.equal(n.heroes['15'].level,2);
});
