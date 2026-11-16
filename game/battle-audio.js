import {effectSounds} from './battle-sound-data.js';
let unlocked=false;document.addEventListener('pointerdown',()=>{unlocked=true;},{once:true});document.addEventListener('keydown',()=>{unlocked=true;},{once:true});
export function createBattleAudio(getPreferences){
 const seen=new Set(),voices=[];let last=0;
 return {play(battle){
  const volume=(getPreferences()?.volume??50)/100;
  for(const e of battle.log){if(seen.has(e.id))continue;seen.add(e.id);if(!unlocked||!volume||battle.tick-e.tick>3)continue;
   const clip=e.type==='skill'?({35:'Meff4',77:'Meff1',boss:'Meff7',zhangjue:'Meff7',32:'Meff15',yuanshao:'Meff15',2:'Meff23',dianwei:'Meff23',1:'Meff34',119:'Meff15',dongzhuo:'Meff15'})[e.skill]:e.type==='heal'?'Meff9':e.type==='shield'?'Meff16':null;
   const file=effectSounds[clip];if(!file||performance.now()-last<90)continue;last=performance.now();
   while(voices.length>=4){const old=voices.shift();old.pause();}
   const audio=new Audio('assets/battle/sfx/'+file);audio.volume=volume*.55;voices.push(audio);audio.play().catch(()=>{});
  }
 },stop(){for(const a of voices)a.pause();voices.length=0;}};
}
