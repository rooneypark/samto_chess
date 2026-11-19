import {generals} from './character-art.js';
const lineups=new WeakMap();
const shuffle=(values,random)=>{const out=[...values];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;};
// Decorative displays only: no ownership, formation, recruitment or combat changes.
export function mixedLineup(count,random=Math.random){
 const groups=new Map();
 for(const [id,hero]of Object.entries(generals)){const family=hero.family;if(!groups.has(family))groups.set(family,[]);groups.get(family).push(id);}
 const families=shuffle([...groups.keys()],random),result=[];
 for(const family of families){const members=groups.get(family);result.push(members[Math.floor(random()*members.length)]);if(result.length===count)return result;}
 return result;
}
export function decorativeLineup(root,count){
 if(!lineups.has(root))lineups.set(root,mixedLineup(count));
 return lineups.get(root);
}
export const clearDecorativeLineup=root=>lineups.delete(root);
