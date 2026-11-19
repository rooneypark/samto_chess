import test from 'node:test';
import assert from 'node:assert/strict';
import {battleImpact,motionAllowed} from '../scene-motion.js';
test('strong-hit reactions are tick-derived, target-only and never change combat data',()=>{
 const unit={id:1,x:2,hp:800,maxHp:1000,shield:0},battle={tick:10,log:[{id:'hit',type:'damage',target:1,tick:10,value:220,sourceX:1,shielded:40}]};
 const before=JSON.stringify([unit,battle]);assert.equal(battleImpact(unit,battle).offset,2);assert.equal(battleImpact(unit,battle).shield,true);
 assert.deepEqual(battleImpact(unit,battle),battleImpact(unit,battle),'Pause holds the exact reaction');
 assert.equal(JSON.stringify([unit,battle]),before);
 assert.equal(battleImpact(unit,{...battle,tick:14}).offset,0);
 assert.equal(battleImpact({...unit,id:2},battle).offset,0);
 assert.equal(battleImpact(unit,{tick:10,log:[{...battle.log[0],shielded:0,value:30}]}).offset,0);
});
test('reduced motion and effects suppress every new reaction without changing the result',()=>{
 for(const state of [{reducedMotion:true},{preferences:{reducedFx:true}}]){
  assert.equal(motionAllowed(state),false);
  assert.deepEqual(battleImpact({id:1,hp:10,maxHp:100},{tick:1,log:[{type:'damage',target:1,tick:1,value:50,skill:true}]},state),{offset:0,shield:false,opacity:0});
 }
});
