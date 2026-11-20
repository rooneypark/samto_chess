// Approved battle motions for every hero and troop that has art-source/motions/v1/<id>/game.json
// (bone-motion/engine/make_game_motions.py). A hero's pictures are loaded the first time that hero is on the board;
// until they are in, and for heroes without a file, the caller falls back to the still artwork.
const loaded=new Map(),loading=new Map(),assets=new Map(),lastAttack=new Map();
let index,ready;
const url=path=>new URL('../'+path,import.meta.url).href;
export function preloadApprovedMotions(){
 return ready??=(async()=>{
  const response=await fetch(url('art-source/motions/v1/game-index.json'));
  if(!response.ok)throw Error('모션 목록을 불러오지 못했습니다.');
  index=await response.json();
 })().catch(error=>{ready=null;throw error;});
}
function load(hero){
 if(!index?.[hero]||loaded.has(hero)||loading.has(hero))return;
 loading.set(hero,(async()=>{
  const response=await fetch(url(index[hero]));if(!response.ok)throw Error(hero);
  const data=await response.json(),paths=new Set(data.clips.flatMap(c=>c.frames.map(f=>f.file)));
  await Promise.all([...paths].map(async path=>{const im=new Image();im.src=url(path);await im.decode();assets.set(path,im);}));
  loaded.set(hero,data);
 })().catch(()=>{}).finally(()=>loading.delete(hero)));
}
function sample(frames,time){
 for(const frame of frames){if(time<frame.durationMs)return frame;time-=frame.durationMs;}
 return frames.at(-1);
}
// Read-only presentation: match the contact/release frame to the existing engine tick.
export function approvedMotionFrame(unit,run,data){
 const battle=run.battle,tick=battle?.tick??0,bench=unit.y<0;
 const target=battle?.units.find(u=>u.id===(unit.action?.target??unit.poseTarget));
 const dx=unit.move?unit.move.x-unit.x:target?target.x-unit.x:0;
 const dy=unit.move?unit.move.y-unit.y:target?target.y-unit.y:unit.side===1?-1:1;
 const view=bench?'front':Math.abs(dx)>Math.abs(dy)?'side':dy>0?'back':'front';
 const flip=!bench&&view==='side'&&dx>0;
 let state='idle',clip,frame;
 const active=run.phase==='fighting'&&unit.hp!==0&&!run.profile?.reducedMotion&&!unit.status?.stun;
 if(active){
  const action=unit.action,recover=!action&&unit.poseUntil>tick;
  state=action?(action.skill?'skill':'attack'):unit.move?'move':recover?(unit.poseSkill?'skill':'attack'):'idle';
  if(state==='attack'){
   // three attacks in turn; the swing and its recovery must be the same clip, so the choice is kept per unit
   if(action)lastAttack.set(unit.id,Math.floor(action.start)%3);
   const n=lastAttack.get(unit.id)??0;if(n)state='attack'+(n+1);
  }
  clip=data.clips.find(c=>c.clipId===`${view}-${state}`)??(state.startsWith('attack')?data.clips.find(c=>c.clipId===`${view}-attack`):undefined);
  if(clip){
   const marker=clip.markers?.contact??clip.markers?.release??clip.markers?.cast??clip.markers?.activate??0;
   let frames=clip.frames,progress;
   if(action){frames=frames.slice(0,Math.max(1,marker));progress=(tick-action.start)/Math.max(1,action.at-action.start);}
   else if(state==='move')progress=(tick-unit.move.start)/Math.max(1,unit.move.at-unit.move.start);
   else if(state==='idle')progress=(tick%60)/60;
   else {frames=frames.slice(marker);progress=(tick-unit.poseStart)/Math.max(1,unit.poseUntil-unit.poseStart);}
   const duration=frames.reduce((n,f)=>n+f.durationMs,0);
   frame=sample(frames,Math.max(0,Math.min(.999999,progress))*duration);
  }
 }
 const still=data.stills[view];
 return {file:frame?.file??still.file,anchor:frame?clip.anchor:still.anchor,view,flip,state:frame?state:'idle',bench,name:data.name};
}
export function approvedMotionSprite(unit,run){
 const hero=String(unit.hero),data=loaded.get(hero);
 if(!data){load(hero);return '';}
 const p=approvedMotionFrame(unit,run,data);if(!p)return '';
 // 1 logical pixel = tile width / 100, shared with all approved static artwork.
 const scale=p.bench?95/256:1,[x,y]=p.anchor;
 return `<canvas class="unit-sprite" width="256" height="256" data-approved-motion="${p.view}-${p.state}" data-motion-frame="${p.file}" role="img" aria-label="${p.name}" style="left:${50-x*scale}%;top:${p.bench?88:70}%;width:${256*scale}%;height:auto;max-width:none;transform:translateY(-${y/256*100}%) scaleX(${p.flip?-1:1});transform-origin:${x/256*100}% ${y/256*100}%"></canvas>`;
}
export function paintApprovedMotions(root){
 for(const canvas of root.querySelectorAll('canvas[data-approved-motion]')){
  const path=canvas.dataset.motionFrame;if(canvas.dataset.paintedFrame===path)continue;
  const image=assets.get(path);if(!image)continue;
  const context=canvas.getContext('2d');context.clearRect(0,0,256,256);context.drawImage(image,0,0,256,256);canvas.dataset.paintedFrame=path;
 }
}
