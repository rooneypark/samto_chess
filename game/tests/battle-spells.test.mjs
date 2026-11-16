import test from 'node:test';
import assert from 'node:assert/strict';
import {areaCells,originalSpell,originalSpellEffects} from '../battle-spells.js';
import {spellFrames} from '../battle-spell-frames.js';
test('area effects cover exactly damage tiles and remain inside board at corners',()=>{
 assert.equal(areaCells({x:3,y:3}).length,9);
 assert.deepEqual(areaCells({x:0,y:0}),[{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1}]);
});
test('every native clip is rendered inside a single tile with a fixed clip scale',()=>{
 for(const [id,c] of Object.entries(spellFrames))for(let i=0;i<c.frames.length;i++){
  const h=originalSpell(id,{x:2,y:4},i*c.interval);
  assert.ok(h.includes('class="spell-tile"'));assert.ok(h.includes('left:25%;top:37.5%'));
  assert.ok(!h.includes('NaN'));assert.ok(h.includes(`data-frame="${i}"`));
 }
});
test('fire wind and earth repeat the same frame simultaneously on each affected tile',()=>{
 for(const skill of ['35','77','boss']){
  const h=originalSpellEffects({tick:12,units:[],log:[{type:'skill',tick:10,skill,center:{x:3,y:3}}]});
  assert.equal((h.match(/class="spell-tile"/g)||[]).length,9);
  assert.equal(new Set([...h.matchAll(/data-frame="(\d+)"/g)].map(m=>m[1])).size,1);
 }
});
