// Faction choice and faction synergy (docs/삼국체스_종합기획서_v1.0.md §2).
// Numbers are balance proposals.
import {factionColors} from './roster-data.js';

const commons=['infantry','archer','tactician'];
export const factions={
 '위':{id:'위',title:'위나라',lord:'32',color:factionColors['위'],trait:'정공법 · 강한 공격과 약화',starter:['32','33','xuhuang',...commons]},
 '촉':{id:'촉',title:'촉나라',lord:'0',color:factionColors['촉'],trait:'버티며 싸운다 · 체력과 회복',starter:['15','0','weiyan',...commons]},
 '오':{id:'오',title:'오나라',lord:'sunquan',color:factionColors['오'],trait:'전법 중심 · 화공과 보호막',starter:['sunquan','huanggai','sunshangxiang',...commons]},
 '군웅':{id:'군웅',title:'군웅',lord:'yuanshao',color:factionColors['군웅'],trait:'변칙 · 빠른 공격과 흡혈',starter:['yuanshao','huaxiong','gongsunzan',...commons]}
};
// The starter set of a profile that has not chosen a faction yet (and of saves from before the choice existed).
export const defaultStarter=['15','0','16',...commons];

// Synergy by distinct deployed heroes of one faction: tiers at 2 / 4 / 6.
export const synergies={
 '위':{name:'패도',text:'위 장수 공격',tiers:[.06,.12,.20]},
 '촉':{name:'인덕',text:'촉 장수 최대 HP',tiers:[.06,.12,.20],top:'전투 시작 시 최대 HP 5% 보호막'},
 '오':{name:'강동',text:'오 장수 전법 피해·회복·보호막',tiers:[.08,.16,.25]},
 '군웅':{name:'난세',text:'군웅 장수 공격속도',tiers:[.05,.10,.18],top:'처치 시 HP 5% 회복'}
};
const tierOf=count=>count>=6?3:count>=4?2:count>=2?1:0;
// units: anything with {hero, faction}. Copies of one hero count once.
export function synergyTiers(units){
 const seen={};
 for(const u of units)if(synergies[u.faction])(seen[u.faction]??=new Set()).add(u.hero);
 return Object.fromEntries(Object.entries(seen).map(([faction,heroes])=>[faction,{count:heroes.size,tier:tierOf(heroes.size)}]).filter(([,v])=>v.tier));
}
export function synergyLabel(faction,tier){const s=synergies[faction];return `${s.name} ${[2,4,6][tier-1]} · ${s.text} +${Math.round(s.tiers[tier-1]*100)}%${tier===3&&s.top?' · '+s.top:''}`;}
// Applied once when a battle is created, after growth, treasure and strategy are already in the unit stats.
export function applySynergies(units){
 for(const side of [0,1]){
  const group=units.filter(u=>u.side===side);
  for(const [faction,{tier}] of Object.entries(synergyTiers(group))){
   const bonus=synergies[faction].tiers[tier-1];
   for(const u of group.filter(u=>u.faction===faction)){
    (u.synergy??=[]).push(faction+tier);
    if(faction==='위')u.atk=Math.floor(u.atk*(1+bonus));
    else if(faction==='촉'){u.maxHp=u.hp=Math.floor(u.maxHp*(1+bonus));if(tier===3){u.shield=Math.max(u.shield,u.maxHp*.05);u.shieldEnd=Math.max(u.shieldEnd,100);}}
    else if(faction==='오'){u.skillBonus+=bonus;u.healBonus+=bonus;u.shieldBonus+=bonus;}
    else if(faction==='군웅'){u.interval=Math.max(1,Math.ceil(u.interval/(1+bonus)));if(tier===3)u.killHeal=(u.killHeal??0)+.05;}
   }
  }
 }
}

const untouched=h=>h.level===1&&h.star===1&&h.cards===0&&h.treasure===null;
// A profile that has only its default starter and has not spent, earned or grown anything.
export function isFreshProfile(s){
 const owned=Object.entries(s.heroes).filter(([,h])=>h.owned).map(([id])=>id).sort();
 return s.gold===500&&s.diamonds===0&&s.heroTokens===0&&s.treasureTokens===0&&s.treasures.length===0&&!s.campaign&&!s.tutorial&&!s.battleRun&&!s.arena&&!s.alliance
  &&Object.keys(s.shop.receipts).length===0&&Object.values(s.heroes).every(untouched)&&owned.join()===[...defaultStarter].sort().join();
}
// First choice: grants the faction starter. A fresh profile gets exactly that six; an existing one keeps
// everything it has and only receives the starter heroes it lacks. Changing later is allowed once and grants nothing.
export function chooseFaction(state,id){
 const f=factions[id];if(!f)throw Error('없는 세력입니다.');
 const s=structuredClone(state);
 if(s.faction){
  if(s.faction===id)return s;
  if(s.factionChanged)throw Error('세력은 한 번만 변경할 수 있습니다.');
  if(s.battleRun)throw Error('출정을 마친 뒤 세력을 변경할 수 있습니다.');
  s.faction=id;s.factionChanged=true;return s;
 }
 const fresh=isFreshProfile(s);
 if(fresh){for(const hero of defaultStarter)if(!f.starter.includes(hero))s.heroes[hero].owned=false;s.order=[...f.starter];}
 for(const hero of f.starter){if(!s.heroes[hero])throw Error('장수 데이터 오류: '+hero);s.heroes[hero].owned=true;}
 s.faction=id;return s;
}
