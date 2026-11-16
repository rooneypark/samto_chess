import test from 'node:test';
import assert from 'node:assert/strict';
import {combatRecordPage} from '../combat-record-model.js';

test('record pagination includes fallen and reinforced units without changing engine data',()=>{
 const battle={tick:300,units:Array.from({length:9},(_,i)=>({id:100+i,side:1,hp:i===0?0:100,damage:90-i*10,healing:0,casts:i%2}))};
 const before=structuredClone(battle),first=combatRecordPage(battle,{side:1}),last=combatRecordPage(battle,{side:1,page:1});
 assert.equal(first.total,450);assert.equal(first.pages,2);assert.deepEqual(first.visible.map(u=>u.id),[100,101,102,103,104,105]);
 assert.deepEqual(last.visible.map(u=>u.id),[106,107,108]);assert.equal(last.total,450);assert.deepEqual(battle,before);
});
test('record metrics use real integer display values, stable ties and unit identity',()=>{
 const battle={units:[{id:2,hero:'0',side:0,damage:10,healing:336.96,casts:2},{id:1,hero:'0',side:0,damage:10,healing:40.5,casts:2}]};
 const view=combatRecordPage(battle,{metric:'healing',selected:'1'});assert.equal(view.total,376);assert.equal(view.chosen.id,1);
 assert.deepEqual(combatRecordPage(battle,{metric:'casts'}).visible.map(u=>u.id),[1,2]);assert.equal(battle.units[0].healing,336.96);
});
test('empty records and zero metrics stay valid after switching sides or pages',()=>{
 const empty=combatRecordPage(null,{side:1,page:99});assert.equal(empty.pages,1);assert.equal(empty.page,0);assert.equal(empty.total,0);assert.equal(empty.chosen,null);
 const zero=combatRecordPage({units:[{id:4,side:0,damage:0}]},{metric:'healing',page:2,selected:'missing'});assert.equal(zero.total,0);assert.equal(zero.chosen.id,4);assert.equal(zero.visible[0].value,0);
});
