import {heroes} from './heroes.js';
const known=new Set(heroes.map(h=>String(h.id)));
const images=new Map();
function imageFor(id){if(!images.has(id)){const im=new Image();im.src=new URL('./assets/skill-cutins/'+id+'.webp',import.meta.url).href;images.set(id,im);}return images.get(id);}
export function createSkillCutin(host,getPreferences){
 let battle=null,seen=new Set(),until=0,node=null;
 function clear(){node?.remove();node=null;until=0;}
 return {clear,beforeStep(b,now){
  if(b!==battle){clear();seen=new Set();battle=b;for(const u of b.units)if(known.has(String(u.hero)))imageFor(String(u.hero));}
  const p=getPreferences();if(p.reducedMotion||p.preferences?.reducedFx||matchMedia('(prefers-reduced-motion: reduce)').matches){clear();return false;}
  if(until>now)return true;clear();
  const units=b.units.filter(u=>u.hp>0&&!u.status.stun&&u.action?.skill&&u.action.at<=b.tick+1&&known.has(String(u.hero))&&!seen.has(u.id+':'+u.action.start));
  if(units[0])seen.add(units[0].id+':'+units[0].action.start);
  if(!units.length)return false;
  const im=imageFor(String(units[0].hero));if(!im.complete||!im.naturalWidth)return false;
  node=document.createElement('div');node.className='runtime-skill-cutin';node.setAttribute('aria-hidden','true');const pic=im.cloneNode();node.append(pic);host.append(node);const active=node;setTimeout(()=>active.remove(),600);until=now+600;return true;
 }};
}
