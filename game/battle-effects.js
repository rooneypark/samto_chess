import {warriorEffects} from './battle-warrior-effects.js';
import {originalSpellEffects} from './battle-spells.js';
import {spellFrames} from './battle-spell-frames.js';
import {specs} from './progression.js';

export function battleEffects(battle) {
 if(!battle)return '';
 const labels=[],numbers=new Map();
 for(const event of battle.log){
  const age=battle.tick-event.tick;
  if(age>=16)continue;
  if(['damage','heal'].includes(event.type)&&event.value>0){
   const key=event.target+':'+event.type,previous=numbers.get(key);
   numbers.set(key,{...event,value:event.value+(previous?.tick===event.tick?previous.value:0)});
  }
  if(event.type==='skill'){
   const source=battle.units.find(unit=>unit.id===event.source);
   labels.push(`<span class="skill-callout" style="left:${(event.sourceX+.5)*12.5}%;top:${(7-event.sourceY-.03)*12.5}%;opacity:${Math.min(1,(16-age)/5)}">${specs[source?.hero]?.skill??'황건 전법'}</span>`);
  }
 }
 for(const event of numbers.values()){
  const age=battle.tick-event.tick;
  labels.push(`<span class="combat-number ${event.type}" style="left:${(event.x+.72)*12.5}%;top:${(7-event.y+.1-age*.025)*12.5}%;opacity:${Math.min(1,(16-age)/5)}">${event.type==='heal'?'+':''}${event.value}</span>`);
 }
 return labels.join('')+originalSpellEffects(battle)+warriorEffects(battle);
}
export function skillIcon(id) {
 const clip={35:'Meff4',77:'Meff1',boss:'Meff7',tactician:'Meff9',0:'Meff10',32:'Meff15',2:'Meff23',119:'Meff15',infantry:'Meff16',33:'Meff16'}[id];
 if(clip){const frames=spellFrames[clip].frames;return '<img alt="" src="assets/battle/spells/'+frames[Math.floor(frames.length/2)][0]+'">';}
 return '<span class="generated-skill-icon" aria-hidden="true"></span>';
}
