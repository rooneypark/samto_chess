// 군주 레벨 해금 (종합기획서 7.1). A feature opens at its lord level. A profile that already used a
// feature before the gates existed keeps it, except alliance and arena: their
// entry requirements also apply to saves created during temporary UI reviews.
import {lordLevel} from './services.js';

export const unlockLevels={shop:1,growth:4,arena:6,alliance:8,expedition:10,antiDong:10,hard:12,tower:15,strategies:20};
export const unlockNames={shop:'장수·보물 모집',growth:'각성과 보물함',arena:'군웅대전',alliance:'동맹',expedition:'토벌 파견',antiDong:'반동탁연합 전역',hard:'어려움 난도',tower:'연무탑',strategies:'군략 기습·화공·수성'};
const used={
 shop:s=>Object.keys(s.shop?.receipts??{}).length>0||Object.values(s.shop?.pity??{}).some(p=>p.a>0||p.s>0),
 growth:s=>(s.treasures?.length??0)>0||Object.values(s.heroes??{}).some(h=>h.star>1),
 antiDong:s=>Object.keys(s.campaign?.stages??{}).some(id=>/^(sishui|hulao)_/.test(id))
};
export const unlocked=(state,feature)=>lordLevel(state).level>=unlockLevels[feature]||!!used[feature]?.(state);
export const lockText=feature=>unlockNames[feature]+'은(는) 군주 Lv.'+unlockLevels[feature]+'에 열립니다.';
export const nextUnlocks=state=>{const level=lordLevel(state).level;return Object.entries(unlockLevels).filter(([,n])=>n>level).sort((a,b)=>a[1]-b[1]).map(([feature,n])=>({feature,level:n,name:unlockNames[feature]}));};
