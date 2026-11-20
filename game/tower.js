// 연무탑 (종합기획서 7.6): the deck a floor allows. Floors themselves are stage definitions in stages.js.
import {heroes,activeRoster} from './heroes.js';
import {specs} from './progression.js';
import {towerStages} from './stages.js';

export const towerFloorIds=Object.keys(towerStages);
export function constraintText(c){
 if(!c)return '제약 없음';
 return [c.factions?c.factions.join('·')+' 장수만':'',c.banGrades?c.banGrades.join('·')+'등급 금지':'',c.maxUnits?'출전 '+c.maxUnits+'명까지':''].filter(Boolean).join(' · ');
}
export const allowed=(c,heroId)=>{const hero=heroes.find(h=>h.id===heroId);return !!hero&&(!c?.factions||c.factions.includes(hero.faction))&&(!c?.banGrades||!c.banGrades.includes(specs[heroId].grade));};
// Up to six owned heroes the floor allows: the saved formation first, then the rest of the roster.
export function towerDeck(state,stage){
 const owned=id=>state.heroes[id]?.owned,c=stage.constraint;
 return [...state.order,...activeRoster.map(h=>h.id).filter(id=>!state.order.includes(id))].filter(id=>owned(id)&&allowed(c,id)).slice(0,6);
}
export const towerProgress=state=>towerFloorIds.filter(id=>state.campaign?.stages?.[id]?.cleared).length;
