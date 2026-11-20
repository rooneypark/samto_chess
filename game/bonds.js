// Bonds (docs/삼국체스_종합기획서_v1.0.md §4). Numbers are balance proposals.
// A bond is judged on the distinct heroes deployed on one side when the battle is created;
// copies of a hero count once, and the bond stays active even if a member falls.
import {generalRosterIds,basicUnitIds} from './heroes.js';
const activeIds=new Set([...generalRosterIds,...basicUnitIds]);
const commons=basicUnitIds;
export const bonds=[
 // 촉
 {id:'peach',name:'도원결의',faction:'촉',members:['0','1','2'],need:3,text:'전투 시작 시 최대 HP 10% 보호막 5초'},
 {id:'tigers',name:'오호대장군',faction:'촉',members:['1','2','15','machao','16'],need:3,text:'해당 장수 공격 +8%, 5명이면 +15%'},
 {id:'wolong',name:'와룡봉추',faction:'촉',members:['35','pangtong'],need:2,text:'두 장수 시작 마나 +20'},
 {id:'visits',name:'삼고초려',faction:'촉',members:['0','35'],need:2,text:'유비 회복량 +20%, 제갈량 최대 HP +10%'},
 {id:'northern',name:'북벌의 뜻',faction:'촉',members:['35','jiangwei'],need:2,text:'강유 전법 피해 +20%'},
 // 위
 {id:'wei',name:'위의 결속',faction:'위',members:['32','33'],need:2,text:'하후돈 생존 중 조조 전법 지속시간 +1초'},
 {id:'xiahou',name:'하후 형제',faction:'위',members:['33','xiahouyuan'],need:2,text:'두 장수 공격속도 +10%'},
 {id:'guards',name:'호위 쌍벽',faction:'위',members:['dianwei','xuchu'],need:2,text:'두 장수 방어 +15%. 조조가 있으면 조조가 받는 피해 −15%'},
 {id:'advisors',name:'위의 책사진',faction:'위',members:['simayi','guojia','xunyu'],need:2,text:'모든 적 마법방어 −10%'},
 {id:'generals',name:'오자양장',faction:'위',members:['34','xuhuang','yuejin'],need:3,text:'셋의 첫 평타 피해 +50%'},
 // 오
 {id:'sworn',name:'단금지교',faction:'오',members:['sunce','77'],need:2,text:'두 장수 공격 +10%'},
 {id:'tigerofwu',name:'강동의 호랑이',faction:'오',members:['sunce','sunquan','sunshangxiang'],need:2,text:'해당 장수 최대 HP +8%'},
 {id:'fireheirs',name:'화공의 계승',faction:'오',members:['77','luxun','huanggai'],need:2,text:'해당 장수의 화염 피해 +20%'},
 {id:'admirals',name:'대도독',faction:'오',members:['77','lusu','lumeng','luxun'],need:2,text:'해당 장수 마나 획득 +15%'},
 {id:'wubraves',name:'강동 맹장',faction:'오',members:['ganning','taishici','dingfeng'],need:3,text:'셋의 공격속도 +8%'},
 // 군웅
 {id:'beauty',name:'경국지색',faction:'군웅',members:['119','diaochan'],need:2,text:'초선의 전법이 여포에게 걸리면 여포의 다음 평타 +30%'},
 {id:'hebei',name:'하북쌍벽',faction:'군웅',members:['yanliang','wenchou'],need:2,text:'두 장수 공격 +12%'},
 {id:'tyranny',name:'동탁군',faction:'군웅',members:['dongzhuo','119','huaxiong'],need:2,text:'해당 장수가 적을 처치하면 최대 HP 8% 회복'},
 {id:'taiping',name:'태평도',faction:'군웅',members:['zhangjue',...commons],need:3,requires:['zhangjue'],text:'장각과 의용병 2종: 의용병 최대 HP +20%, 장각 시작 마나 +20'},
 // 세력을 넘는 인연
 {id:'chibi',name:'적벽의 동맹',faction:null,members:['35','77'],need:2,text:'두 장수의 전법 피해 +10%'}
];
const launchBonds=bonds.map(bond=>({...bond,members:bond.members.filter(id=>activeIds.has(id))})).filter(bond=>bond.members.length>=bond.need);
// units: anything with {hero}. Returns [{bond, present:[heroId]}] for bonds whose requirement is met.
export function activeBonds(units){
 const deployed=new Set(units.map(u=>u.hero));
 return launchBonds.map(bond=>({bond,present:bond.members.filter(id=>deployed.has(id))}))
  .filter(({bond,present})=>present.length>=bond.need&&(bond.requires??[]).every(id=>present.includes(id)));
}
export const bondsOf=heroId=>launchBonds.filter(bond=>bond.members.includes(heroId));

const scaleHp=(u,ratio)=>{u.maxHp=u.hp=Math.floor(u.maxHp*ratio);};
const faster=(u,ratio)=>{u.interval=Math.max(1,Math.ceil(u.interval/ratio));};
const mana=(u,n)=>{u.mana=Math.min(u.maxMana,u.mana+n);};
// Effects that are plain start-of-battle changes. 위의 결속 and 경국지색 act inside their tactics (battle-engine.js).
const effects={
 peach:(m)=>{for(const u of m){u.shield=Math.max(u.shield,u.maxHp*.1);u.shieldEnd=Math.max(u.shieldEnd,100);}},
 tigers:(m,present)=>{const ratio=present.length>=5?1.15:1.08;for(const u of m)u.atk=Math.floor(u.atk*ratio);},
 wolong:(m)=>{for(const u of m)mana(u,20);},
 visits:(m)=>{for(const u of m){if(u.hero==='0')u.healBonus+=.2;else scaleHp(u,1.1);}},
 northern:(m)=>{for(const u of m)if(u.hero==='jiangwei')u.skillBonus+=.2;},
 xiahou:(m)=>{for(const u of m)faster(u,1.1);},
 guards:(m,present,allies)=>{for(const u of m)u.def=Math.floor(u.def*1.15);for(const u of allies)if(u.hero==='32')u.guard=.15;},
 advisors:(m,present,allies,enemies)=>{for(const u of enemies)u.mdef=Math.floor(u.mdef*.9);},
 generals:(m)=>{for(const u of m)u.firstHit=1.5;},
 sworn:(m)=>{for(const u of m)u.atk=Math.floor(u.atk*1.1);},
 tigerofwu:(m)=>{for(const u of m)scaleHp(u,1.08);},
 fireheirs:(m)=>{for(const u of m)u.fireBonus=(u.fireBonus??0)+.2;},
 admirals:(m)=>{for(const u of m)u.manaGain=1.15;},
 wubraves:(m)=>{for(const u of m)faster(u,1.08);},
 hebei:(m)=>{for(const u of m)u.atk=Math.floor(u.atk*1.12);},
 tyranny:(m)=>{for(const u of m)u.killHeal=(u.killHeal??0)+.08;},
 taiping:(m)=>{for(const u of m){if(u.hero==='zhangjue')mana(u,20);else scaleHp(u,1.2);}},
 chibi:(m)=>{for(const u of m)u.skillBonus+=.1;}
};
// Applied once when a battle is created, after faction synergy.
export function applyBonds(units){
 for(const side of [0,1]){
  const allies=units.filter(u=>u.side===side),enemies=units.filter(u=>u.side!==side);
  for(const {bond,present} of activeBonds(allies)){
   const members=allies.filter(u=>present.includes(u.hero));
   for(const u of members)(u.bonds??=[]).push(bond.id);
   effects[bond.id]?.(members,present,allies,enemies);
  }
 }
}
