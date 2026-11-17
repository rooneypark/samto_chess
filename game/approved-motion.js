const hero='2',assets=new Map();
let manifest,ready;
const url=path=>new URL('../'+path,import.meta.url).href;
export function preloadApprovedMotions(){
 return ready??=(async()=>{
  const response=await fetch(url('art-source/motions/v1/2/manifest.json'));
  if(!response.ok)throw Error('장비 모션 목록을 불러오지 못했습니다.');
  const data=await response.json(),paths=new Set(data.clips.flatMap(c=>c.frames.map(f=>f.file)));
  for(const view of ['front','side','back'])paths.add(`art-source/characters/v1/2/${view}.png`);
  await Promise.all([...paths].map(async path=>{const im=new Image();im.src=url(path);await im.decode();assets.set(path,im);}));
  manifest=data;
 })().catch(error=>{ready=null;throw error;});
}
function sample(frames,time){
 for(const frame of frames){if(time<frame.durationMs)return frame;time-=frame.durationMs;}
 return frames.at(-1);
}
// Read-only presentation: match the contact/release frame to the existing engine tick.
export function approvedMotionFrame(unit,run,data){
 if(String(unit.hero)!==hero)return null;
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
  clip=data.clips.find(c=>c.clipId===`${view}-${state}`);
  if(clip){
   const marker=clip.markers?.contact??clip.markers?.release??clip.markers?.cast??clip.markers?.activate??0;
   let frames=clip.frames,progress;
   if(action){frames=frames.slice(0,Math.max(1,marker));progress=(tick-action.start)/Math.max(1,action.at-action.start);}
   else if(state==='move')progress=(tick-unit.move.start)/Math.max(1,unit.move.at-unit.move.start);
   else {frames=frames.slice(marker);progress=(tick-unit.poseStart)/Math.max(1,unit.poseUntil-unit.poseStart);}
   const duration=frames.reduce((n,f)=>n+f.durationMs,0);
   frame=sample(frames,Math.max(0,Math.min(.999999,progress))*duration);
  }
 }
 return {file:frame?.file??`art-source/characters/v1/2/${view}.png`,anchor:frame?clip.anchor:[128,224],view,flip,state:frame?state:'idle',bench};
}
export function approvedMotionSprite(unit,run){
 if(!manifest)return '';
 const p=approvedMotionFrame(unit,run,manifest);if(!p)return '';
 // 1 source pixel = tile width / 100 * 0.80. Flip around the actual foot pivot.
 const scale=p.bench?95/256:.80,[x,y]=p.anchor;
 return `<canvas class="unit-sprite" width="256" height="256" data-approved-motion="${p.view}-${p.state}" data-motion-frame="${p.file}" role="img" aria-label="장비" style="left:${50-x*scale}%;top:${p.bench?88:70}%;width:${256*scale}%;height:auto;max-width:none;transform:translateY(-${y/256*100}%) scaleX(${p.flip?-1:1});transform-origin:${x/256*100}% ${y/256*100}%"></canvas>`;
}
export function paintApprovedMotions(root){
 for(const canvas of root.querySelectorAll('canvas[data-approved-motion]')){
  const path=canvas.dataset.motionFrame;if(canvas.dataset.paintedFrame===path)continue;
  const image=assets.get(path);if(!image)continue;
  const context=canvas.getContext('2d');context.clearRect(0,0,256,256);context.drawImage(image,0,0);canvas.dataset.paintedFrame=path;
 }
}
