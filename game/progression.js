import {equippedTreasure} from './treasures.js';
import {LEGACY_PROGRESS_KEY} from './versions.js';
import {extraSpecs,awakening5} from './roster-data.js';
export {awakening5};
export const specs = {
 '15': {grade:'A', stats:[950,100,30,20,1,1,80], skill:'용맹돌진', description:'적 1명에게 180% 물리 피해, 직선상 최대 3명에게 100% 추가 피해'},
 '1': {grade:'S', stats:[1100,130,35,20,1,1.2,100], skill:'청룡참', description:'전방 90도 반경 2에 220% 물리 피해. 적 HP 25% 미만이면 1.3배'},
 '2': {grade:'A', stats:[1500,70,50,20,1,1.3,90], skill:'장판의 함성', description:'반경 2 적을 2초 도발하고 자신이 받는 피해를 3초간 30% 감소'},
 '0': {grade:'B', stats:[1000,60,25,35,2,1.2,80], skill:'인의', description:'HP 비율이 가장 낮은 아군 2명에게 공격력 180% 회복, 100% 보호막 3초'},
 '16': {grade:'A', stats:[700,120,15,15,4,1.1,80], skill:'백발백중', description:'가장 먼 적에게 280% 물리 피해. 비관통 추적 화살'},
 '35': {grade:'S', stats:[650,115,10,40,4,1.3,100], skill:'팔진의 책략', description:'적 밀집 중심 반경 1.5에 200% 마법 피해, 이동속도 30% 감소 3초'},
"32":{"grade": "A", "stats": [950, 80, 25, 30, 3, 1.1, 90], "skill": "위무지세", "description": "근처 아군 3명 공격력 +20%, 공격속도 +15%, 4초"},
"33":{"grade": "B", "stats": [1350, 80, 45, 20, 1, 1.2, 90], "skill": "불굴", "description": "공격력 300% 보호막 3초, 종료 시 반경 1.5에 180% 물리 피해"},
"34":{"grade": "A", "stats": [850, 110, 25, 20, 1, 0.9, 80], "skill": "급습", "description": "후열 최저 방어 적에게 돌진, 200% 물리 피해"},
"77":{"grade": "S", "stats": [650, 110, 15, 40, 4, 1.2, 100], "skill": "화공", "description": "반경 1.5에 1초마다 70% 마법 피해, 4회"},
"119":{"grade": "S", "stats": [1200, 145, 25, 15, 1, 1.3, 100], "skill": "무쌍", "description": "반경 2에 250% 물리 피해, 현재 HP 10% 소모"},
"infantry":{"grade": "C", "stats": [900, 65, 30, 15, 1, 1.2, 80], "skill": "굳건한 방어", "description": "자신에게 공격력 200% 보호막 3초"},
"archer":{"grade": "C", "stats": [550, 80, 10, 10, 4, 1.2, 80], "skill": "집중 사격", "description": "현재 적에게 180% 물리 추적 화살"},
"tactician":{"grade": "C", "stats": [650, 55, 15, 25, 3, 1.3, 90], "skill": "응급 처치", "description": "HP 비율 최저 아군에게 공격력 250% 회복"}
};
Object.assign(specs,extraSpecs);
// Decision D4: one signature tactic per hero, strengthened by permanent awakening.
export const awakeningSkillBonus=[{star:3,coefficient:1.1,durationTicks:10},{star:5,coefficient:1.2,durationTicks:20}];
export function awakeningSkill(star){const b=awakeningSkillBonus.filter(b=>star>=b.star).at(-1);return {coefficient:b?.coefficient??1,durationTicks:b?.durationTicks??0};}
// The three treasures that existed in v1 saves. Only the save import path reads this.
export const legacyTreasureIds=['iron','horse','book'];
const key=LEGACY_PROGRESS_KEY;
export function loadProgress(ids, storage=localStorage){
 const fresh={gold:12450, heroes:Object.fromEntries(ids.map(id=>[id,{level:1,star:1,cards:0,treasure:null}]))};
 try{const s=JSON.parse(storage.getItem(key));if(!s||!Number.isSafeInteger(s.gold)||s.gold<0)return fresh;
 const used=new Set();for(const id of ids){const h=s.heroes?.[id];if(!h||!Number.isInteger(h.level)||h.level<1||h.level>20||!Number.isInteger(h.star)||h.star<1||h.star>5||!Number.isSafeInteger(h.cards)||h.cards<0)return fresh;if(h.treasure!==null&&(!legacyTreasureIds.includes(h.treasure)||used.has(h.treasure)))return fresh;if(h.treasure)used.add(h.treasure);}return {gold:s.gold,heroes:Object.fromEntries(ids.map(id=>[id,s.heroes[id]]))};
 }catch{return fresh;}
}
export function statsFor(id,h,state){
 const t=state?equippedTreasure(state,id):null;
 return specs[id].stats.map((n,i)=>{const bonus=t?t.value*(1+.25*(t.star-1)):0;
 if(i<4)return Math.floor(n*(1+.03*(h.level-1)+.08*(h.star-1))*(1+(i===0?(h.star>=4?.10:h.star>=2?.05:0):0)+(t?.stat===['hp','atk','def','mdef'][i]?bonus:0)));
 return i===5&&t?.stat==='speed'?Math.round(n/(1+bonus)*100)/100:n;
 });
}
export function growthCost(id,h,type){return type==='train'?20*h.level:Math.ceil([100,250,600,1500][h.star-1]*({C:1,B:1.5,A:2,S:3}[specs[id].grade]));}
export function cardsNeeded(id,h){return ({C:[2,4,8,16],B:[3,6,12,24],A:[4,8,16,32],S:[6,12,24,48]}[specs[id].grade])[h.star-1]??0;}
export function grow(state,id,type){
 const next=structuredClone(state),h=next.heroes[id];if(!h||h.owned===false||!['train','awaken'].includes(type))throw Error('잘못된 성장 요청입니다.');
 if(type==='train'&&h.level>=20||type==='awaken'&&h.star>=5)throw Error('최대 성장 단계입니다.');
 const ticket=type==='train'&&(next.trainingTickets??0)>0;const cost=ticket?0:growthCost(id,h,type),cards=type==='awaken'?cardsNeeded(id,h):0;
 if(next.gold<cost)throw Error('골드가 부족합니다.');if(h.cards<cards)throw Error('중복 카드가 부족합니다.');
 next.gold-=cost;if(ticket)next.trainingTickets--;h.cards-=cards;if(type==='train')h.level++;else h.star++;return next;
}