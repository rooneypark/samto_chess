import {designPortrait} from './art.js';
import {stageOf,defaultStageId,hardRules} from './stages.js';
import {tokenImage} from './roster-data.js';
import {heroes} from './heroes.js';
import {specs,awakeningSkill} from './progression.js';
import {equippedTreasure} from './treasures.js';
export const ranks=['','Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ'];
export const gearNames={sword:'철검',armor:'갑옷',bow:'장궁'};
// Fair-arena rules shared by matchmaking UI, unit construction and settlement.
export const arenaRules={level:10,star:3,rank:3,winGold:20,otherGold:5,dailyLimit:10,eloK:24};
export const strategyNames={vanguard:'선봉',strategist:'책략',logistics:'병참',ambush:'기습',fire:'화공',defend:'수성'};
// The first three are open from the start; the rest open with the lord level (unlocks.js 'strategies').
export const baseStrategies=['vanguard','strategist','logistics'];
// 역할 특성 (종합기획서 4.2): a small built-in effect per role. Enemy troops have none; enemy generals do.
export const roleTraits={front:{name:'전열 공격',roles:['전열 공격','근접','반격','광전사','창술'],text:'적을 처치하면 마나 +10'},tank:{name:'방어',roles:['방어'],text:'HP가 50% 아래면 받는 피해 −10%'},archer:{name:'궁수',roles:['궁수','원거리'],text:'3칸 이상 떨어진 적에게 피해 +10%'},tactician:{name:'책사',roles:['책사','화공'],text:'전투 시작 3초 뒤 마나 +10'},support:{name:'지원·지휘',roles:['지원','지휘','의원','방해'],text:'자신의 회복·보호막 효과 +10%'},mobile:{name:'기동',roles:['기동','기동 전사'],text:'전투의 첫 이동이 2배 빠름'}};
export const roleTrait=role=>Object.keys(roleTraits).find(key=>roleTraits[key].roles.includes(role));
export const strategyEffects={vanguard:'전열 HP +5%',strategist:'책사 시작 마나 +10',logistics:'시작 은화 +1',ambush:'기동 장수의 첫 전법 피해 +20%',fire:'아군의 화염 피해 +10%',defend:'3라운드부터 방어 장수 방어 +10%'};

// Source-asset mapping only: display name and original sprite unit. Combat numbers are
// never declared here; stage enemies read them from the stage definition on every call.
// Entries without a unit have no artwork yet and are drawn as a marked placeholder token.
const enemyVisuals={raider:{name:'황건군',unit:120},bow:{name:'황건 궁병',unit:18},shield:{name:'황건 방패병',unit:0},taoist:{name:'황건 도사',unit:81},boss:{name:'장각의 환영',unit:227},bandit:{name:'도적병',unit:45},
 zhangbao_illusion:{name:'장보의 환영'},dong_infantry:{name:'동탁군 보병'},dong_archer:{name:'동탁군 궁병'},dong_guard:{name:'동탁군 중보병'},xiliang_rider:{name:'서량 철기'},ambusher:{name:'매복병'},
 ...Object.fromEntries([['lubu','여포군'],['xiapi','하비 수비군'],['yuan','원소군'],['cao','조조군'],['wu','오군']].flatMap(([p,army])=>[['infantry','보병'],['archer','궁병'],['guard','중보병'],['rider','기병']].map(([k,label])=>[p+'_'+k,{name:army+' '+label}])))};
// Stage enemyDefId -> combat key. The keys are persisted inside saved runs, so they stay stable.
// Definitions without an entry here use their own id as the key.
const stageKeys={melee:'raider',archer:'bow',shield:'shield',mage:'taoist',zhangjue_illusion:'boss'};
const enemyDefIds=Object.fromEntries(Object.entries(stageKeys).map(([defId,key])=>[key,defId]));
// Enemies that are not part of any stage definition (review battles).
const extraEnemyDefs={bandit:{stats:[1500,105,20,15,1,.9,70],skill:'34'}};
// Explicit skill registry: stage skill id -> engine skill id and where its parameters live.
const stageSkills={boss_thunder:stage=>{const s=stage.bossSkill;if(s.radiusMetric!=='euclidean')throw Error('지원하지 않는 범위 기준: '+s.radiusMetric);return {skill:'boss',params:{telegraphTicks:s.telegraphTicks,radius:s.radius,coefficient:s.coefficient,magic:s.damageType==='magic'}};}};
// Equipment reward ids used by stage rounds.
const equipmentRewards={choice_of_sword_armor_bow_rank1:{choices:['sword','armor','bow'],rank:1}};

export function enemySpec(key,stageId){
 const visual=enemyVisuals[key];if(!visual)return undefined;
 if(extraEnemyDefs[key])return {...visual,...extraEnemyDefs[key]};
 const stage=stageOf(stageId),d=stage.enemyDefs[enemyDefIds[key]??key];if(!d)throw Error('전역 데이터에 없는 적: '+key);
 let skill=null,skillParams;
 if(d.skillId!==null){const entry=stageSkills[d.skillId];if(!entry||stage.bossSkill.id!==d.skillId)throw Error('등록되지 않은 적 전법: '+d.skillId);({skill,params:skillParams}=entry(stage));}
 return {...visual,stats:[d.hp,d.atk,d.def,d.mdef,d.range,d.attackIntervalTicks/20,d.manaMax],skill,skillParams,...(d.moveTicks&&d.moveTicks!==10?{moveBonus:10/d.moveTicks-1}:{})};
}
// Placeholder image for an enemy type whose artwork is pending.
export const enemyImage=(key,portrait=false)=>portrait&&designPortrait(key)?designPortrait(key):enemyVisuals[key]?tokenImage({name:enemyVisuals[key].name.replace(/^(황건|동탁군|여포군|하비 수비군|원소군|조조군|오군) /,''),faction:null},portrait):'';
export const roundCount=stageId=>stageOf(stageId).rounds.length;
export function roundRule(round,stageId){
 const r=stageOf(stageId).rounds[round-1];if(!r)throw Error('없는 라운드입니다: '+round);
 const equipment=r.equipmentReward===null?null:equipmentRewards[r.equipmentReward];
 if(r.equipmentReward!==null&&!equipment)throw Error('등록되지 않은 장비 보상: '+r.equipmentReward);
 return {victorySilver:r.victorySilver,equipment};
}
export const stageReward=stageId=>stageOf(stageId).reward;
// u.fixed marks an enemy general: stage-defined growth, no treasure, no strategy, optional boss scale.
export function combatant(u,side,profile,arena=false,strategy=profile.strategy??'vanguard'){
 const hero=heroes.find(h=>h.id===u.hero),e=enemySpec(u.hero,u.stage),h=arena?{level:arenaRules.level,star:arenaRules.star}:u.fixed??profile.heroes[u.hero];
 if(u.fixed)strategy=null;
 const a=e?e.stats:specs[u.hero].stats,factor=e?1:(1+.03*(h.level-1)+.08*(h.star-1))*Math.pow(1.6,u.rank-1),g=u.gear,gv=g?[1,1.6,2.3][g.rank-1]:0;
 const t=!e&&!arena&&!u.fixed?equippedTreasure(profile,u.hero):null,bonus=t?t.value*(1+.25*(t.star-1)):0,awakened=awakeningSkill(e?1:h.star);
 const stat=(i,extra=0)=>Math.max(i<2?1:0,Math.floor(a[i]*factor*(u.scale?.[['hp','atk'][i]]??1)*(1+extra+(t?.stat===['hp','atk','def','mdef'][i]?bonus:0))));
 const hp=stat(0,(g?.type==='armor'?.2*gv:0)+(!e?(h.star>=4?.10:h.star>=2?.05:0):0)+(!e&&strategy==='vanguard'&&u.y===(side?4:3)?.05:0));
 const tactician=!e&&(['77','tactician'].includes(u.hero)||hero?.role==='책사'),trait=!e&&hero?roleTrait(hero.role):undefined;
 return {...u,side,name:u.title??hero?.name??e.name,...((hero?hero.sourceUnit:e.unit)!==undefined?{unit:hero?hero.sourceUnit:e.unit}:{}),skill:e?e.skill:u.hero,...(e?.skillParams?{skillParams:e.skillParams}:{}),...(hero?.faction?{faction:hero.faction}:{}),skillPower:awakened.coefficient,skillDuration:awakened.durationTicks,star:h?.star??1,hp,maxHp:hp,atk:stat(1,g?.type==='sword'?.15*gv:0),def:stat(2),mdef:stat(3),range:a[4],interval:Math.ceil(a[5]*20/(1+(g?.type==='bow'?.12*gv:0)+(t?.stat==='speed'?bonus:0))),maxMana:a[6],mana:strategy==='strategist'&&tactician?10:0,shield:0,shieldEnd:0,ready:0,status:{},damage:0,healing:0,casts:0,...(trait?{trait}:{}),...(strategy==='ambush'&&trait==='mobile'?{ambush:.2}:{}),...(strategy==='fire'&&!e?{fireBonus:.1}:{}),skillBonus:t?.stat==='skill'?bonus:0,healBonus:(t?.stat==='heal'?bonus:0)+(trait==='support'?.1:0),shieldBonus:(t?.stat==='shield'?bonus:0)+(trait==='support'?.1:0),moveBonus:(t?.stat==='move'?bonus:0)+(e?.moveBonus??0)};
}
// Enemy line-up of a round. Units of the first battle keep their original shape so old saves compare equal.
export function enemies(round,stageId,difficulty){
 if(difficulty==='hard')return enemies(round,stageId).map(u=>({...u,scale:{hp:(u.scale?.hp??1)*hardRules.hp,atk:(u.scale?.atk??1)*hardRules.atk}}));
 const stage=stageOf(stageId),tag=stage.stageId===defaultStageId?{}:{stage:stage.stageId};
 return stage.rounds[round-1].enemies.map((u,i)=>u.hero
  ?{id:100+i,hero:u.hero,rank:u.rank??1,x:u.x,y:u.y,fixed:{level:u.level??1,star:u.star??1},...(u.scale?{scale:u.scale}:{}),...(u.title?{title:u.title}:{}),...tag}
  :{id:100+i,hero:stageKeys[u.enemyDefId]??u.enemyDefId,rank:1,x:u.x,y:u.y,...tag});
}
// Mid-battle reinforcements of a round: [{at,units}] with ids from 200 so they never collide with the opening line-up.
export function reinforcements(round,stageId,difficulty){
 const stage=stageOf(stageId),tag={stage:stage.stageId},scale=difficulty==='hard'?{scale:{hp:hardRules.hp,atk:hardRules.atk}}:{};
 return (stage.rounds[round-1].reinforcements??[]).map((wave,w)=>({at:wave.at,units:wave.enemies.map(([key,x,y],i)=>({id:200+w*10+i,hero:key,rank:1,x,y,...scale,...tag}))}));
}
// Fair arena: both sides use the saved six-hero order at combat rank Ⅲ, mirrored across the board.
// layout: optional saved positions {heroId:[x,y]} in the player's half; an opponent's layout is mirrored.
export function arenaUnits(order,side,layout){
 const valid=layout&&order.every(h=>Array.isArray(layout[h])&&layout[h][0]>=0&&layout[h][0]<8&&layout[h][1]>=0&&layout[h][1]<4)&&new Set(order.map(h=>layout[h].join())).size===order.length;
 return order.map((hero,i)=>{const [x,y]=valid?layout[hero]:[[2,3,4,2,3,4][i],i<3?3:1];return {id:(side?100:1)+i,hero,rank:arenaRules.rank,x:side?7-x:x,y:side?7-y:y,...(side?{}:{cost:0})};});
}
// Each side fights with its own strategy (decision D7). Matches saved before the snapshot carried one fall back to 선봉.
export const opponentStrategy=match=>strategyNames[match?.opponent?.strategy]?match.opponent.strategy:'vanguard';
