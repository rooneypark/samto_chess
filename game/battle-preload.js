import {spellFrames} from './battle-spell-frames.js';
import {heroes} from './heroes.js';
import {generals} from './character-art.js';
const loadedUnits=new Map();let effectsReady;
export async function preloadBattleSprites(units) {
 effectsReady??=Promise.all([...new Set(Object.values(spellFrames).flatMap(c=>c.frames.map(f=>'assets/battle/spells/'+f[0]))),'assets/battle/warrior-effects.png'].map(src=>new Promise(resolve=>{const image=new Image();image.onload=()=>image.decode().then(resolve,resolve);image.onerror=resolve;image.src=src;})));
 await effectsReady;
 await Promise.all([...new Set(units.map(u=>String(u.hero??u.id)).filter(id=>generals[id]))].flatMap(id=>Object.values(generals[id].views).map(v=>{const image=new Image();image.src=v.url;return image.decode();})));
 await Promise.all([...new Set(units.filter(u=>!generals[u.hero??u.id]).map(unit=>unit.unit??unit.sourceUnit??heroes.find(hero=>hero.id===unit.hero)?.sourceUnit).filter(unit=>unit!==undefined))].map(unit=>{
  if(!loadedUnits.has(unit)){
   const names=[...Array.from({length:11},(_,i)=>'MOV-'+(i+1)),...Array.from({length:12},(_,i)=>'ATK-'+(i+1)),...Array.from({length:5},(_,i)=>'SPC-'+(i+1))];
   loadedUnits.set(unit,Promise.all(names.map(name=>new Promise(resolve=>{
    const image=new Image();image.onload=()=>image.decode().then(resolve,resolve);image.onerror=resolve;image.src='assets/battle/unit'+unit+'/'+name+'.png';
   }))));
  }
  return loadedUnits.get(unit);
 }));
}

