import {spellFrames} from './battle-spell-frames.js';

// Every clip uses a fixed scale across frames and is contained inside one tile.
export const spellCells=Object.fromEntries(Object.keys(spellFrames).map(id=>[id,.9]));
export function areaCells(center,radius=1.5){
 if(!center)return [];
 const cells=[];
 for(let y=0;y<8;y++)for(let x=0;x<8;x++)
  if(Math.hypot(x-center.x,y-center.y)<=radius)cells.push({x,y});
 return cells;
}
export function originalSpell(id,center,elapsedMs,windowMs,cells=spellCells[id]??.9) {
 if(!center||elapsedMs<0)return '';
 const clip=spellFrames[id];if(!clip)return '';
 const duration=clip.frames.length*clip.interval;
 const index=Math.floor(elapsedMs*(windowMs?duration/windowMs:1)/clip.interval),frame=clip.frames[index];
 if(!frame)return '';
 const tile={x:Math.max(0,Math.min(7,Math.round(center.x))),y:Math.max(0,Math.min(7,Math.round(center.y)))};
 const [file,width,height,offsetX,offsetY]=frame,[left,top,right,bottom]=clip.bounds;
 const scale=100*Math.min(.9,Math.max(0,cells))/Math.max(right-left,bottom-top);
 const x=50+(2*offsetX-width/2-(left+right)/2)*scale;
 const y=50+(2*offsetY-height/2-(top+bottom)/2)*scale;
 return `<span class="spell-tile" data-x="${tile.x}" data-y="${tile.y}" style="left:${tile.x*12.5}%;top:${(7-tile.y)*12.5}%"><img class="original-spell" data-clip="${id}" data-frame="${index}" aria-hidden="true" alt="" src="assets/battle/spells/${file}" style="left:${x}%;top:${y}%;width:${width*scale}%;height:${height*scale}%;transform:none"></span>`;
}
function areaSpell(id,center,age,windowMs,radius){
 return areaCells(center,radius).map(cell=>originalSpell(id,cell,age,windowMs)).join('');
}

export function originalSpellEffects(battle) {
 const effects=[];
 for(const unit of battle.units)if(unit.action?.skill&&['boss','zhangjue'].includes(unit.skill)){
  const start=unit.action.start??unit.action.at-20;
  effects.push(areaSpell('Mcall3',unit.action.center,(battle.tick-start)*50,(unit.action.at-start)*50,unit.skillParams?.radius));
 }
 for(const event of battle.log){
  const age=(battle.tick-event.tick)*50;
  if(age>=3000)continue;
  const target={x:event.x,y:event.y},source={x:event.sourceX,y:event.sourceY};
  if(event.type==='shield')effects.push(originalSpell('Meff16',target,age,750));
  if(event.type==='heal'&&event.value>0)effects.push(originalSpell(event.hero==='0'?'Meff10':'Meff9',target,age,850));
  if(event.type==='skill'){
   const clip={35:'Meff4',77:'Meff1',boss:'Meff7',zhangjue:'Meff7',32:'Meff15',yuanshao:'Meff15',2:'Meff23',dianwei:'Meff23',119:'Meff15',dongzhuo:'Meff15'}[event.skill];
   if(clip)effects.push(['35','77','boss','zhangjue'].includes(String(event.skill))
    ?areaSpell(clip,event.center??target,age,undefined,event.radius)
    :originalSpell(clip,['32','2','119','yuanshao','dianwei','dongzhuo'].includes(event.skill)?source:event.center??target,age));
  }
  if(event.type==='fire-pulse'&&age<950&&!battle.log.some(cast=>cast.type==='skill'&&cast.source===event.source&&cast.tick===event.tick))
   effects.push(event.row!==undefined?Array.from({length:8},(_,x)=>originalSpell('Meff0',{x,y:event.row},age,950)).join(''):areaSpell('Meff0',event.center,age,950));
 }
 return effects.join('');
}
