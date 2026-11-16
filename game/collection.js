// 장수 획득 보강 (종합기획서 8장): 픽업 모집, 모집 풀 해금, S 선택 조각, 도감, 인연 임무, 시작 7일 임무.
// Pure data and rules; the commands live in economy.js (shop) and services.js (claims).
import {heroes} from './heroes.js';
import {specs} from './progression.js';
import {bonds} from './bonds.js';
import {defaultStarter} from './factions.js';

const DAY=86400000,RESET=4*3600000;
// 모든 세력의 장수는 첫 접속부터 모집 가능. 이전 API는 저장 데이터 호환용으로 유지.
export const poolGates={};
export const poolLocked=(_state,_heroId)=>false;

// 픽업 (8.3): one S and two A heroes for two weeks, in a fixed rotation. All heroes participate.
const rotation=grade=>heroes.filter(h=>specs[h.id].grade===grade&&!poolGates[h.id]).map(h=>h.id);
const pickupS=rotation('S'),pickupA=rotation('A');
export const PICKUP_DAYS=14;
export function pickupOf(time=Date.now()){
 const period=Math.floor((time+RESET)/DAY/PICKUP_DAYS);
 return {period,s:pickupS[period%pickupS.length],a:[pickupA[(period*2)%pickupA.length],pickupA[(period*2+1)%pickupA.length]],endsAt:(period+1)*PICKUP_DAYS*DAY-RESET};
}
export const pickupRules={chance:.5,currency:'diamonds'};

// S 선택 조각 (8.4)
export const S_SELECT_COST=60;

// 도감 (8.5): where each hero comes from, and the reward for completing a faction.
export const codexReward={freeDiamonds:500};
export const factionTitles={'위':'패도의 계승자','촉':'인덕의 계승자','오':'강동의 계승자','군웅':'난세의 패자'};
export const factionRoster=faction=>heroes.filter(h=>h.faction===faction).map(h=>h.id);
export const codexComplete=(state,faction)=>factionRoster(faction).every(id=>state.heroes[id]?.owned);
export function heroSources(id){
 const sources=[];
 if(defaultStarter.includes(id))sources.push('기본 시작 장수');
 const grade=specs[id].grade;
 sources.push('장수 모집 '+grade+'등급');
 if(grade==='A')sources.push('A등급 선택상자');
 if(grade==='S')sources.push('S 선택 조각 '+S_SELECT_COST+'개');
 if(bonds.some(b=>b.members.includes(id)))sources.push('인연 임무');
 return sources;
}

// 인연 임무 (8.6): opens when exactly one member of a bond is missing; five campaign wins earn that hero's card.
export const BOND_MISSION_WINS=5;
export function bondMissionCandidates(state){
 return bonds.map(bond=>{const missing=bond.members.filter(id=>!state.heroes[id]?.owned);return missing.length===1&&bond.members.length>1?{bond:bond.id,hero:missing[0]}:null;}).filter(Boolean);
}

// 시작 7일 임무 (8.1): one goal a day, opened by days since the first start; nothing expires.
const life=(s,key)=>s.services?.lifetime?.[key]??0;
export const startMissions=[
 {day:1,name:'황건 토벌 승리',done:s=>!!s.campaign?.cleared,reward:{gold:200}},
 {day:2,name:'장수 한 명을 훈련 Lv.3까지',done:s=>Object.values(s.heroes).some(h=>h.owned&&h.level>=3),reward:{trainingTickets:2}},
 {day:3,name:'장수·보물 모집 10회',done:s=>life(s,'draws')>=10,reward:{freeDiamonds:100}},
 {day:4,name:'내정 시설 한 번 승급',done:s=>Object.values(s.government?.levels??{}).some(level=>level>=2),reward:{gold:300}},
 {day:5,name:'군웅대전 3판',done:s=>life(s,'arena')>=3,reward:{freeDiamonds:100}},
 {day:6,name:'장수 합성 30회',done:s=>life(s,'merges')>=30,reward:{treasureTokens:10}},
 {day:7,name:'광종 결전 승리',done:s=>!!s.campaign?.stages?.yellow_03?.cleared,reward:{freeDiamonds:200}}
];
// Completing all seven pays one A 선택상자's worth of hero tokens.
export const startFinalReward={heroTokens:20};
