import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {heroes} from '../heroes.js';
import {generals,characterSource} from '../character-art.js';
import {preparationSprite} from '../battle-ui.js';
import {mixedLineup,decorativeLineup,clearDecorativeLineup} from '../decorative-lineup.js';
test('all 147 runtime views match the approved source hashes and logical pivot',()=>{
 assert.equal(Object.keys(generals).length,49);
 for(const hero of heroes){
  assert.equal(hero.sprite,characterSource(hero.id));
  assert.equal(hero.portrait,`assets/portraits-v4/${hero.id}.png`);
  for(const [view,art]of Object.entries(generals[hero.id].views)){
   const png=fs.readFileSync(new URL('../'+art.url,import.meta.url));
   assert.equal(crypto.createHash('sha256').update(png).digest('hex'),art.sha256,`${hero.id}/${view}`);
   assert.deepEqual(art.foot,[128,224]);assert.equal(art.width,256);
   assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],art.nativeCanvas);
  }
 }
});
test('decorative lineups mix six distinct combat classes and stay fixed during screen actions',()=>{
 for(const random of [()=>0,()=>.5,()=>.99999]){
  const ids=mixedLineup(6,random);assert.equal(ids.length,6);assert.equal(new Set(ids).size,6);
  assert.equal(new Set(ids.map(id=>generals[id].family)).size,6);
 }
 const screen={};const first=decorativeLineup(screen,6);assert.equal(decorativeLineup(screen,6),first);
 clearDecorativeLineup(screen);assert.notEqual(decorativeLineup(screen,6),first);
});
test('all heroes use approved directions on the board and bench at common scale',()=>{
 for(const hero of heroes)for(const [side,view]of [[0,'back'],[1,'front']]){
  const unit={id:1,hero:hero.id,side,x:3,y:3};
  const html=preparationSprite(unit,'prepare');
  assert.ok(html.includes(characterSource(hero.id,view)));
  assert.ok(html.includes('width:256%'));
  assert.ok(preparationSprite({...unit,y:-1},'prepare').includes(characterSource(hero.id,'front')));
  assert.ok(preparationSprite({...unit,move:{x:2,y:3}},'fighting').includes(characterSource(hero.id,'side')));
 }
});
