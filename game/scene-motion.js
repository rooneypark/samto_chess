// Short, non-blocking presentation only. Never writes profile or combat state.
let preferences=()=>({});
const active=new Set(),onElement=new WeakMap();
export const motionAllowed=(state=preferences())=>!state?.reducedMotion&&!state?.preferences?.reducedFx&&!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
export function configureSceneMotion(getPreferences){preferences=getPreferences;}
export function cancelSceneMotions(){for(const a of active)a.cancel();active.clear();document.querySelectorAll('[data-motion-overlay]').forEach(e=>e.remove());}
const frames={
 select:[{translate:'0 0'},{translate:'0 -3px',offset:.4},{translate:'0 0'}],
 number:[{color:'#fff0c6'},{color:'#fff8d6',textShadow:'0 0 5px #e4bd6866',offset:.35},{color:'#fff0c6'}],
 star:[{scale:'.72',opacity:.4},{scale:'1.12',opacity:1,offset:.6},{scale:'1',opacity:1}],
 enter:[{translate:'0 7px',opacity:0},{translate:'0 0',opacity:1}],
 hit:[{translate:'2px 0'},{translate:'-1px 0',offset:.55},{translate:'0 0'}],
 pulse:[{opacity:.65},{opacity:1,offset:.45},{opacity:1}],
};
export function playSceneMotion(el,kind,{duration=180,delay=0}={}){
 if(!el?.isConnected||!el.getClientRects().length||!motionAllowed()||!el.animate)return null;
 onElement.get(el)?.cancel();
 const animation=el.animate(frames[kind]??frames.pulse,{duration,delay,easing:'cubic-bezier(.2,.7,.25,1)',fill:kind==='enter'?'backwards':'none'});
 active.add(animation);onElement.set(el,animation);el.dataset.sceneMotion=kind;
 const done=()=>{active.delete(animation);if(onElement.get(el)===animation){onElement.delete(el);delete el.dataset.sceneMotion;}};
 animation.finished.then(done,done);return animation;
}
function point(host,rect){const r=host.getBoundingClientRect(),scale=host.offsetWidth/r.width;return {x:(rect.left+rect.width/2-r.left)*scale,y:(rect.top+rect.height/2-r.top)*scale,scale};}
function overlay(host,className){if(!motionAllowed()||!host?.isConnected||!host.getClientRects().length)return null;const node=document.createElement('span');node.className=className;node.dataset.motionOverlay='';node.setAttribute('aria-hidden','true');host.append(node);return node;}
function animateOverlay(node,keyframes,options){if(!node)return;const a=node.animate(keyframes,{easing:'cubic-bezier(.2,.7,.25,1)',...options});active.add(a);const done=()=>{active.delete(a);node.remove();};a.finished.then(done,done);return a;}
export function growthScene(root,type,star=1){
 if(type==='train')root.querySelectorAll('.hero-level,.hero-stat').forEach((e,i)=>playSceneMotion(e,'number',{duration:360,delay:i*25}));
 else{const mark=root.querySelectorAll('.hero-stars i')[star-1];playSceneMotion(mark,'star',{duration:380});}
}
export function rewardScene(host,targets){
 if(!motionAllowed())return;
 for(const {target,kind,origin}of targets){if(!target?.getClientRects().length)continue;const to=point(host,target.getBoundingClientRect()),from=origin?point(host,origin):to;
  for(let i=0;i<3;i++){const node=overlay(host,'scene-reward');if(!node)continue;node.style.left=from.x+'px';node.style.top=from.y+'px';const image=new Image();image.src=new URL(`./assets/shop-v2/${kind==='diamonds'?'gem':'coin'}.png`,import.meta.url).href;image.alt='';node.append(image);
   animateOverlay(node,[{opacity:0,transform:'translate(-50%,-50%) scale(.7)'},{opacity:1,offset:.15,transform:`translate(calc(-50% + ${i*6-6}px),calc(-50% - 12px)) scale(1)`},{opacity:.95,offset:.8},{opacity:0,transform:`translate(calc(-50% + ${to.x-from.x}px),calc(-50% + ${to.y-from.y}px)) scale(.55)`}],{duration:460,delay:i*35});
  }
  const glint=overlay(host,'scene-reward-glint '+kind);
  if(glint){
   glint.style.left=to.x+'px';glint.style.top=to.y+'px';
   const poses=['0%','33.333%','66.667%','100%','100%'];
   animateOverlay(glint,poses.map((x,i)=>({backgroundPosition:x+' 50%',opacity:i===4?0:1,easing:'steps(1,end)'})),{duration:240,delay:390,easing:'linear'});
  }
  playSceneMotion(target.querySelector('.shell-wallet-value')??target,'number',{duration:280,delay:350});
 }
}
export function departScene(host,target){
 playSceneMotion(target,'pulse',{duration:260});
 const veil=overlay(host,'scene-depart-veil');animateOverlay(veil,[{opacity:0},{opacity:.16,offset:.45},{opacity:0}],{duration:280});
}
export function unlockScene(host,target){playSceneMotion(target,'pulse',{duration:360});}
export function mergeScene(rank){rank?.querySelectorAll('.rank-diamond.filled').forEach((d,i)=>playSceneMotion(d,'star',{duration:260,delay:i*45}));}
export function impactScene(target){playSceneMotion(target,'hit',{duration:140});}
const resultSeen=new WeakMap();
export function resultScene(root,{key,paid=false}){
 if(!motionAllowed())return;let seen=resultSeen.get(root);if(!seen){seen=new Set();resultSeen.set(root,seen);}if(seen.size>40)seen.clear();
 if(!seen.has(key)){seen.add(key);playSceneMotion(root.querySelector('.victory-title'),'enter',{duration:260,delay:70});playSceneMotion(root.querySelector('.clear-badge'),'enter',{duration:230});}
 if(paid&&!seen.has(key+':paid')){seen.add(key+':paid');root.querySelectorAll('.reward-item').forEach((e,i)=>playSceneMotion(e,'enter',{duration:240,delay:140+i*45}));}
}
// Tick-derived hit reaction survives DOM refreshes and freezes exactly when paused.
export function battleImpact(unit,battle,state){
 if(!battle||!motionAllowed(state)||unit.hp===0)return {offset:0,shield:false,opacity:0};
 const event=battle.log.findLast(e=>e.type==='damage'&&e.target===unit.id&&battle.tick-e.tick>=0&&battle.tick-e.tick<4&&(e.value>=unit.maxHp*.14||e.skill&&e.value>=unit.maxHp*.08||e.shielded>0&&unit.shield===0));
 if(!event)return {offset:0,shield:false,opacity:0};const age=battle.tick-event.tick,direction=event.sourceX>unit.x?-1:1;
 return {offset:([2,-1,0,0][age]??0)*direction,shield:event.shielded>0&&unit.shield===0,opacity:1-age/4};
}
