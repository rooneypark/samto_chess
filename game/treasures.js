import {treasureTraits} from './treasure-traits.js';

const icons={atk:'swords',speed:'banner',skill:'scroll',move:'banner',hp:'helmet',def:'gate',mdef:'scroll',heal:'gem',shield:'helmet'};
export const treasureDefs=Object.entries(treasureTraits).map(([id,{name,grade,stat,percent,label}])=>({
 id,name,grade,stat,value:percent/100,icon:icons[stat],effect:label+' +'+percent+'%',
 artwork:new URL('../art-source/treasures/v1/'+id+'.png',import.meta.url).href
}));
const byId=new Map(treasureDefs.map(def=>[def.id,def]));
const oldIds={
 iron:'tr-090',horse:'tr-034',book:'tr-085',bronze:'tr-002',guard:'tr-011',wisdom:'tr-048',
 jade:'tr-046',haste:'tr-089',barrier:'tr-042',dragon:'tr-004',tiger:'tr-083',strategy:'tr-003'
};
export function migrateTreasures(state){
 for(const item of state.treasures??[]){
  if(item&&Object.hasOwn(oldIds,item.defId))item.defId=oldIds[item.defId];
 }
 const pending=state.shop?.pending;
 if(pending?.pool==='treasure')for(const result of pending.results??[]){
  if(Object.hasOwn(oldIds,result.id)){
   result.id=oldIds[result.id];
   result.grade=byId.get(result.id).grade;
  }
 }
 return state;
}
export function equippedTreasure(state,heroId){
 const item=state.treasures.find(t=>t.id===state.heroes[heroId]?.treasure);
 if(!item)return null;
 // Existing run snapshots retain the movement bonus they started with.
 const def=byId.get(item.defId)??byId.get(oldIds[item.defId]);
 return def?{...def,...item,value:item.defId==='horse'?.05:def.value}:null;
}
export function treasureQuote(state,id){const item=state.treasures.find(t=>t.id===id);if(!item)throw Error('보물을 찾지 못했습니다.');const def=treasureDefs.find(d=>d.id===item.defId);return {item,def,copies:[2,4,8,16][item.star-1]??0,gold:Math.ceil(([50,150,400,1000][item.star-1]??0)*({C:1,B:1.5,A:2,S:3}[def.grade])),value:def.value*(1+.25*(item.star-1))};}
export function manageTreasure(state,c){
 const s=structuredClone(state),{item,def,copies,gold}=treasureQuote(s,c.id),equipped=id=>Object.values(s.heroes).some(h=>h.treasure===id);
 if(s.battleRun)throw Error('출정을 마친 뒤 보물을 변경할 수 있습니다.');
 if(c.type==='equip'){
  // One treasure per hero. Equipping the worn treasure again takes it off.
  const h=s.heroes[c.hero];if(!h?.owned)throw Error('보유한 장수만 보물을 장착할 수 있습니다.');
  if(h.treasure===item.id)h.treasure=null;else{if(equipped(item.id))throw Error('다른 장수가 장착 중인 보물입니다.');h.treasure=item.id;}
 }else if(c.type==='lock')item.locked=!item.locked;
 else if(c.type==='favorite')item.favorite=!item.favorite;
 else if(c.type==='dismantle'){
  if(item.locked||item.favorite||equipped(item.id))throw Error('잠금·즐겨찾기·장착을 먼저 해제하세요.');
  s.treasures=s.treasures.filter(t=>t.id!==item.id);s.treasureTokens+=({C:1,B:2,A:4,S:8}[def.grade]);
 }else if(c.type==='upgrade'){
  if(item.star>=5)throw Error('최대 성급입니다.');if(s.gold<gold)throw Error('골드가 부족합니다.');
  const ids=c.materials;if(!Array.isArray(ids)||ids.length!==copies||new Set(ids).size!==copies)throw Error('승급 재료 수가 맞지 않습니다.');
  for(const id of ids){const m=s.treasures.find(t=>t.id===id);if(!m||id===item.id||m.defId!==item.defId||m.star!==1||m.locked||m.favorite||equipped(id))throw Error('재료는 미장착·잠금 해제된 동일 보물 1성만 선택하세요.');}
  s.gold-=gold;item.star++;s.treasures=s.treasures.filter(t=>!ids.includes(t.id));
 }else throw Error('보물 요청 오류');return s;
}
