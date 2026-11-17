import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {approvedMotionFrame} from '../approved-motion.js';
const data=JSON.parse(fs.readFileSync(new URL('../../art-source/motions/v1/2/manifest.json',import.meta.url),'utf8'));
const unit={id:1,hero:'2',side:0,x:3,y:3,hp:100,status:{}};
function run(tick,target={id:2,x:3,y:4}){return {phase:'fighting',profile:{},battle:{tick,units:[unit,target]}};}
test('all directions map the engine hit/release tick to the approved event frame',()=>{
 for(const [view,target] of [['back',{id:2,x:3,y:4}],['front',{id:2,x:3,y:2}],['side',{id:2,x:2,y:3}]])for(const state of ['attack','skill']){
  const clip=data.clips.find(c=>c.clipId===`${view}-${state}`),marker=clip.markers.contact??clip.markers.release;
  const u={...unit,action:{start:100,at:110,target:2,skill:state==='skill'}};
  assert.equal(approvedMotionFrame(u,run(100,target),data).file,clip.frames[0].file);
  assert.ok(clip.frames.slice(0,marker).some(f=>f.file===approvedMotionFrame(u,run(109,target),data).file));
  delete u.action;Object.assign(u,{poseStart:110,poseUntil:117,poseTarget:2,poseSkill:state==='skill'});
  assert.equal(approvedMotionFrame(u,run(110,target),data).file,clip.frames[marker].file);
  assert.equal(approvedMotionFrame(u,run(117,target),data).state,'idle');
 }
});
test('side attack preserves authored pivot on either facing; movement follows destination',()=>{
 for(const dx of [-1,1]){
  const u={...unit,action:{start:0,at:10,target:2}},p=approvedMotionFrame(u,run(5,{id:2,x:3+dx,y:3}),data);
  assert.deepEqual(p.anchor,[168,224]);assert.equal(p.flip,dx>0);
  const m=approvedMotionFrame({...unit,move:{x:3+dx,y:3,start:0,at:10}},run(5),data);
  assert.equal(m.state,'move');assert.equal(m.view,'side');assert.equal(m.flip,dx>0);
 }
});
test('reduced motion, death, stun and preparation show static approved art without mutating combat',()=>{
 for(const mode of ['reduced','dead','stun','prepare']){
  const u={...structuredClone(unit),action:{start:0,at:10,target:2}},r=run(5);
  if(mode==='reduced')r.profile.reducedMotion=true;if(mode==='dead')u.hp=0;if(mode==='stun')u.status.stun={until:20};if(mode==='prepare')r.phase='prepare';
  const before=JSON.stringify([u,r]);assert.equal(approvedMotionFrame(u,r,data).state,'idle');assert.equal(JSON.stringify([u,r]),before);
 }
 assert.equal(approvedMotionFrame({...unit,hero:'15'},run(5),data),null);
});
