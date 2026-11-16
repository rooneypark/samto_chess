export const treasureDefs = [
 ['iron','흑철 호심경','C','HP +8%','helmet','hp',.08],
 ['horse','백마 인장','C','이동속도 +5%','banner','move',.05],
 ['book','청룡 병서','C','스킬 피해 +5%','scroll','skill',.05],
 ['bronze','청동 검장식','B','공격 +10%','swords','atk',.10],
 ['guard','수비 인장','B','방어 +12%','gate','def',.12],
 ['wisdom','지략 두루마리','B','마법방어 +12%','scroll','mdef',.12],
 ['jade','회춘옥','A','주는 회복 +12%','gem','heal',.12],
 ['haste','신속부','A','공격속도 +10%','banner','speed',.10],
 ['barrier','수호부','A','주는 보호막 +12%','helmet','shield',.12],
 ['dragon','용문 인장','S','공격 +15%','gold','atk',.15],
 ['tiger','호문 호심경','S','HP +18%','helmet','hp',.18],
 ['strategy','군략 비전','S','스킬 피해 +15%','scroll','skill',.15]
].map(([id,name,grade,effect,icon,stat,value])=>({id,name,grade,effect,icon,stat,value}));
export function equippedTreasure(state,heroId){const item=state.treasures.find(t=>t.id===state.heroes[heroId]?.treasure);return item?{...treasureDefs.find(d=>d.id===item.defId),...item}:null;}
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
