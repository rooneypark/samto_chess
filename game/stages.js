// Stage registry: every playable battle, in campaign order.
// yellow_turban_01 is the adopted v0.10 proposal (stage-data.js). The others are authored here as
// balance PROPOSALS: playable and unlock-gated, but not yet tuned by play-testing.
import {stage as yellowTurban01} from './stage-data.js';
import {unlocked} from './unlocks.js';

export const defaultStageId=yellowTurban01.stageId;
const board=(blocked=[])=>({width:8,height:8,blocked,friendlyRows:[0,1,2,3]});
const def=(hp,atk,def,mdef,range,attackIntervalTicks,extra={})=>({hp,atk,def,mdef,range,attackIntervalTicks,manaMax:0,skillId:null,moveTicks:10,damageType:'physical',...extra});
const thunder=(coefficient,radius=1.5,telegraphTicks=20)=>({id:'boss_thunder',telegraphTicks,radius,radiusMetric:'euclidean',coefficient,damageType:'magic',targetRule:'highest_density_then_lowest_id'});
const loot='choice_of_sword_armor_bow_rank1';
// round(enemies, silver, equipment): enemies are [enemyDefId, x, y] or {hero, x, y, ...} for an enemy general.
const round=(n,list,victorySilver,equipmentReward=null)=>({round:n,enemies:list.map((e,i)=>Array.isArray(e)?{id:`r${n}_${i}`,enemyDefId:e[0],x:e[1],y:e[2]}:{id:`r${n}_${i}`,...e}),victorySilver,equipmentReward});
const reward=(firstClearGold,firstClearDiamonds,repeatGold)=>({firstClearGold,firstClearDiamonds,repeatGold,dailyRepeatLimit:10});

// Enemy troop families. Numbers scale by battle; names and sprites are bound in battle-data.js.
const turban=k=>({melee:def(300*k,40*k,10,5,1,24),archer:def(220*k,45*k,5,5,4,26),shield:def(550*k,30*k,35,10,1,28),mage:def(220*k,50*k,5,20,4,28)});
const dong=k=>({dong_infantry:def(380*k,46*k,18,8,1,24),dong_archer:def(260*k,50*k,8,8,4,26),dong_guard:def(680*k,34*k,38,12,1,28),xiliang_rider:def(440*k,54*k,14,8,1,22,{moveTicks:7})});
const scale=defs=>Object.fromEntries(Object.entries(defs).map(([id,d])=>[id,{...d,hp:Math.round(d.hp),atk:Math.round(d.atk)}]));

const army=(p,k)=>({[p+'_infantry']:def(380*k,46*k,18,8,1,24),[p+'_archer']:def(260*k,50*k,8,8,4,26),[p+'_guard']:def(680*k,34*k,38,12,1,28),[p+'_rider']:def(440*k,54*k,14,8,1,22,{moveTicks:7})});
const waves=(p,boss)=>{const I=p+'_infantry',A=p+'_archer',G=p+'_guard',R=p+'_rider';return [
 round(1,[[I,3,5],[I,4,5]],4),
 round(2,[[G,3,5],[I,2,5],[I,5,5],[A,4,7]],5,loot),
 round(3,[[G,2,5],[G,4,5],[R,3,6],[A,2,7],[A,5,7],[A,6,7]],6),
 round(4,[[R,1,5],[R,6,5],[G,3,5],[G,4,5],[I,3,6],[A,2,7],[A,5,7]],7,loot),
 round(5,boss?[boss,[G,2,5],[G,5,5],[I,3,5],[A,1,7],[A,6,7]]:[[G,2,5],[G,3,5],[G,4,5],[G,5,5],[R,3,6],[R,4,6],[A,2,7],[A,5,7]],8)];};
const general=(hero,title,level,star,hp,atk)=>({hero,title,x:4,y:6,rank:1,level,star,scale:{hp,atk}});
const later=[
 {id:'puyang',title:'복양',after:'hulao_03',army:'lubu',k:1.7,names:['복양 진입','매복 돌파','여포 격퇴'],pay:[250,40,35],extra:{heroTokens:10},blocked:[{x:3,y:4},{x:4,y:4}],
  rule:'가운데가 막혀 좌우로 돌아야 합니다. 3라운드부터 10초 뒤 아군 뒤쪽에 매복병이 나타납니다.',reinforce:{from:3,at:200,enemies:[['ambusher',0,0],['ambusher',7,0]]},boss:{3:general('119','복양의 여포',16,3,2.8,.85)}},
 {id:'xiapi',title:'하비',after:'puyang_03',army:'xiapi',k:1.8,names:['수로 건너기','다리 사수','여포 최후'],pay:[300,50,40],grants:'diaochan',blocked:[0,1,2,5,6,7].map(x=>({x,y:4})),
  rule:'다리 두 칸으로만 건널 수 있습니다. 다리 앞 네 칸은 5초마다 물이 넘쳐 최대 HP의 6% 피해를 줍니다.',hazard:{cells:[2,3,4,5].map(x=>({x,y:3})),period:100,ratio:.06,name:'범람'},boss:{3:general('119','하비의 여포',18,3,3,.9)}},
 {id:'guandu',title:'관도',after:'xiapi_03',army:'yuan',k:1.9,names:['관도 대치','안량 토벌','문추 토벌'],pay:[350,50,45],extra:{treasureTokens:20},
  rule:'장기전입니다. 2라운드부터 15초 뒤 적 증원이 도착합니다.',reinforce:{from:2,at:300,enemies:[['yuan_infantry',2,7],['yuan_infantry',5,7]]},boss:{2:general('yanliang','원소군 안량',18,3,2.8,.9),3:general('wenchou','원소군 문추',19,3,3,.9)}},
 {id:'chibi',title:'적벽',after:'guandu_03',army:'cao',k:2,names:['연환선 접근','화공 개시','조조 추격'],pay:[400,60,50],extra:{heroTokens:10},blocked:[{x:2,y:4},{x:5,y:4},{x:0,y:2},{x:7,y:2}],
  rule:'동남풍이 붑니다. 양쪽 모두 화염 피해가 25% 커집니다. 배 사이 네 칸은 건널 수 없습니다.',fireScale:1.25,boss:{3:general('32','승상 조조',20,3,3,.9)}},
 {id:'yiling',title:'이릉',after:'chibi_03',army:'wu',k:2.1,names:['숲길 진군','연영 방어','육손 토벌'],pay:[500,60,60],extra:{sShards:20},
  rule:'숲에 불이 붙어 4초마다 한 칸씩 번집니다. 불타는 칸에 서 있으면 최대 HP의 4% 피해를 입습니다.',hazard:{cells:[{x:0,y:4},{x:7,y:4}],period:80,ratio:.04,spread:true,max:14,name:'산불'},boss:{3:general('luxun','오군 육손',20,4,2.6,.9)}}
];
const authored=[
 {stageId:'yellow_02',chapterId:'camp_yellow',name:'황건 잔당 소탕',requires:['yellow_turban_01'],board:board(),
  enemyDefs:scale({...turban(1.1),zhangbao_illusion:def(3900,115,30,30,3,28,{manaMax:100,skillId:'boss_thunder'})}),bossSkill:thunder(1.9),
  rounds:[round(1,[['melee',3,5],['melee',4,5]],4),
   round(2,[['melee',2,5],['melee',5,5],['shield',3,5],['archer',4,7]],5,loot),
   round(3,[['shield',2,5],['shield',3,5],['shield',4,5],['mage',2,7],['mage',5,7]],6),
   round(4,[['melee',1,5],['melee',2,5],['melee',5,5],['melee',6,5],['archer',1,7],['archer',6,7],['mage',3,7]],7,loot),
   round(5,[['zhangbao_illusion',4,7],['shield',3,5],['shield',4,5],['shield',5,5],['archer',1,7],['archer',6,7]],8)],
  reward:reward(100,30,20)},
 {stageId:'yellow_03',chapterId:'camp_yellow',name:'광종 결전',requires:['yellow_02'],board:board(),
  enemyDefs:scale(turban(1.2)),bossSkill:thunder(2),
  rounds:[round(1,[['melee',3,5],['melee',4,5],['archer',3,7]],4),
   round(2,[['shield',3,5],['melee',2,5],['melee',4,5],['mage',3,7]],5,loot),
   round(3,[['melee',1,5],['melee',2,5],['melee',5,5],['melee',6,5],['archer',2,7],['archer',5,7]],6),
   round(4,[['shield',2,5],['shield',3,5],['shield',4,5],['shield',5,5],['mage',2,7],['mage',5,7],['archer',3,7]],7,loot),
   // 장각 본인. An enemy general uses the hero's own tactic with fixed growth and a boss HP scale.
   round(5,[{hero:'zhangjue',title:'황건 교주 장각',x:3,y:7,rank:1,level:5,star:1,scale:{hp:5.5}},['shield',2,5],['shield',4,5],['mage',1,7],['mage',6,7],['archer',5,7]],8)],
  reward:{...reward(100,30,20),extra:{heroTokens:5}},completes:'황건'},
 // 반동탁연합 전반: 사수관. 관문 양옆이 막혀 통로가 3칸이다.
 ...[1,2,3].map(n=>({stageId:'sishui_0'+n,chapterId:'camp_sishui',name:['사수관 접근','관문 돌파','화웅 토벌'][n-1],requires:[n===1?'yellow_03':'sishui_0'+(n-1)],lordLevel:10,
  board:board([0,1,5,6,7].map(x=>({x,y:4}))),enemyDefs:scale(dong(1.15+.1*(n-1))),bossSkill:thunder(2),
  rounds:[round(1,[['dong_infantry',3,5],['dong_infantry',4,5]],4),
   round(2,[['dong_guard',3,5],['dong_infantry',2,5],['dong_infantry',4,5],['dong_archer',3,7]],5,loot),
   round(3,[['dong_guard',3,5],['dong_guard',4,5],['dong_guard',5,5],['dong_archer',2,7],['dong_archer',4,7],['dong_archer',6,7]],6),
   round(4,[['xiliang_rider',3,5],['xiliang_rider',5,5],['dong_infantry',4,5],['dong_infantry',4,6],['dong_archer',2,7],['dong_archer',6,7]],7,loot),
   round(5,n<3?[['dong_guard',3,5],['dong_guard',4,5],['dong_guard',5,5],['xiliang_rider',4,6],['dong_archer',2,7],['dong_archer',4,7],['dong_archer',6,7]]
    :[{hero:'huaxiong',title:'동탁군 화웅',x:4,y:5,rank:1,level:10,star:2,scale:{hp:3.2,atk:1.15}},['dong_guard',3,5],['dong_guard',5,5],['dong_archer',2,7],['dong_archer',4,7],['dong_archer',6,7]],8)],
  reward:reward(150,30,25),...(n===3?{completes:'사수관',grantsHero:'huaxiong'}:{})})),
 // 반동탁연합 후반: 호뢰관. 넓은 성문 앞, 철기와 여포.
 ...[1,2,3].map(n=>({stageId:'hulao_0'+n,chapterId:'camp_hulao',name:['호뢰관 전초','철기 격파','삼영전여포'][n-1],requires:[n===1?'sishui_03':'hulao_0'+(n-1)],lordLevel:10,
  board:board(),enemyDefs:scale(dong(1.45+.1*(n-1))),bossSkill:thunder(2.1),
  rounds:[round(1,[['xiliang_rider',3,5],['dong_infantry',4,5]],4),
   round(2,[['dong_guard',3,5],['xiliang_rider',2,6],['xiliang_rider',5,6],['dong_archer',4,7]],5,loot),
   round(3,[['xiliang_rider',1,5],['xiliang_rider',3,5],['xiliang_rider',4,5],['xiliang_rider',6,5],['dong_archer',2,7],['dong_archer',5,7]],6),
   round(4,[['dong_guard',2,5],['dong_guard',3,5],['dong_guard',4,5],['dong_guard',5,5],['dong_archer',1,7],['dong_archer',3,7],['dong_archer',4,7],['dong_archer',6,7]],7,loot),
   round(5,n<3?[['xiliang_rider',2,5],['xiliang_rider',3,5],['xiliang_rider',4,5],['xiliang_rider',5,5],['dong_guard',3,6],['dong_guard',4,6],['dong_archer',2,7],['dong_archer',5,7]]
    :[{hero:'119',title:'동탁군 여포',x:3,y:6,rank:1,level:15,star:3,scale:{hp:2.6,atk:.8}},['xiliang_rider',2,5],['xiliang_rider',5,5],['dong_guard',3,5],['dong_guard',4,5],['dong_archer',1,7],['dong_archer',6,7]],8)],
  reward:{...reward(200,40,30),...(n===3?{extra:{treasureTokens:20}}:{})},...(n===3?{completes:'호뢰관',grantsHero:'dongzhuo'}:{})})),
 // 복양 이후 다섯 전역. 같은 다섯 라운드 골격에 전역마다 규칙 하나를 얹는다. 수치는 검증 전 제안값.
 ...later.flatMap(c=>[1,2,3].map(n=>({stageId:c.id+'_0'+n,chapterId:'camp_'+c.id,name:c.names[n-1],requires:[n===1?c.after:c.id+'_0'+(n-1)],
  board:board(c.blocked??[]),enemyDefs:scale({...army(c.army,c.k+.06*(n-1)),ambusher:def(300*c.k,60*c.k,8,8,1,20,{moveTicks:7})}),bossSkill:thunder(2.1),
  ...(c.hazard?{hazard:c.hazard}:{}),...(c.fireScale?{fireScale:c.fireScale}:{}),ruleText:c.rule,
  rounds:waves(c.army,c.boss?.[n]).map(r=>c.reinforce&&r.round>=c.reinforce.from?{...r,reinforcements:[{at:c.reinforce.at,enemies:c.reinforce.enemies}]}:r),
  reward:{...reward(c.pay[0],c.pay[1],c.pay[2]),...(n===3&&c.extra?{extra:c.extra}:{})},...(n===3?{completes:c.title,...(c.grants?{grantsHero:c.grants}:{})}:{})})))
].map(s=>({proposal:true,version:'0.12-authored',winCondition:'all_enemies_dead',attemptCost:0,...s}));

// 연무탑 (종합기획서 7.6): thirty one-round floors with a constraint each. First-clear rewards only.
// Enemy numbers are untested PROPOSALS; the constraint list repeats every ten floors.
const towerConstraints=[null,{factions:['촉']},{banGrades:['S']},{maxUnits:4},{factions:['위']},{banGrades:['S','A']},{factions:['오']},{maxUnits:5},{factions:['군웅']},{banGrades:['S']}];
const towerLineups=[
 [['melee',3,5],['melee',4,5],['archer',3,7],['archer',4,7]],
 [['shield',2,5],['shield',3,5],['shield',4,5],['mage',3,7],['archer',5,7]],
 [['melee',1,5],['melee',3,5],['melee',5,5],['archer',2,7],['archer',4,7],['mage',6,7]],
 [['shield',3,5],['shield',4,5],['melee',2,5],['melee',5,5],['mage',2,7],['mage',5,7],['archer',3,7]]];
const dongNames={melee:'dong_infantry',archer:'dong_archer',shield:'dong_guard',mage:'dong_archer'};
const towerGenerals=['huaxiong','yanliang','wenchou','33','34','119'];
export const TOWER_FLOORS=30;
export const towerStages=Object.fromEntries(Array.from({length:TOWER_FLOORS},(_,i)=>{
 const n=i+1,late=n>10,stageId='tower_'+String(n).padStart(2,'0'),boss=n%5===0;
 const troops=towerLineups[i%towerLineups.length].map(([id,x,y])=>[late?dongNames[id]:id,x,y]).filter(([,x,y])=>!(boss&&x===4&&y===6));
 const list=boss?[{hero:towerGenerals[n/5-1],x:4,y:6,rank:1,level:Math.min(20,4+n),star:Math.min(5,1+Math.floor(n/8)),scale:{hp:1.8+n*.06,atk:.9+n*.01}},...troops]:troops;
 return [stageId,{stageId,chapterId:'tower',tower:true,floor:n,name:'연무탑 '+n+'층',requires:n>1?['tower_'+String(n-1).padStart(2,'0')]:[],board:board(),constraint:towerConstraints[i%towerConstraints.length],
  startSilver:Math.min(40,18+n),enemyDefs:scale(late?dong(.75+.09*n):turban(.9+.14*n)),bossSkill:thunder(2),
  rounds:[round(1,list,0)],reward:{firstClearGold:60+20*n,firstClearDiamonds:boss?50:0,repeatGold:0,dailyRepeatLimit:0,...(n%10===0?{extra:{sShards:5}}:boss?{extra:{heroTokens:5}}:{})},
  proposal:true,version:'0.12-authored',winCondition:'all_enemies_dead',attemptCost:0}];
}));
export const stages=Object.fromEntries([yellowTurban01,...authored].map(s=>[s.stageId,s]));
export const stageOrder=Object.keys(stages);
export const stageOf=id=>stages[id??defaultStageId]??towerStages[id]??stages[defaultStageId];
export const stageName=id=>({yellow_turban_01:'황건 토벌'})[id]??stageOf(id).name;
export const chapters={camp_yellow:'황건의 난',camp_sishui:'사수관 (반동탁연합)',camp_hulao:'호뢰관 (반동탁연합)',camp_puyang:'복양',camp_xiapi:'하비',camp_guandu:'관도',camp_chibi:'적벽',camp_yiling:'이릉'};
const cleared=(state,id)=>id===defaultStageId?!!state.campaign?.cleared:!!state.campaign?.stages?.[id]?.cleared;
export const stageCleared=cleared;
// A battle opens when every battle it requires has been cleared.
// 반동탁연합 also needs lord Lv.10 and the tower lord Lv.15 (unlocks.js).
export function stageUnlocked(state,id){const s=stages[id]??towerStages[id];return !!s&&(s.requires??[]).every(r=>cleared(state,r))&&(!s.lordLevel||unlocked(state,'antiDong'))&&(!s.tower||unlocked(state,'tower'));}
// 어려움 (종합기획서 6.3): stronger enemies, a harsher board rule, better pay. Opens per chapter.
export const hardRules={hp:1.5,atk:1.25,gold:1.3,telegraph:.75};
const hardBlocked={camp_sishui:[{x:2,y:4}]};
export const blockedCells=(stageId,difficulty)=>{const s=stageOf(stageId);return difficulty==='hard'?[...s.board.blocked,...(hardBlocked[s.chapterId]??[])]:s.board.blocked;};
export const hardCleared=(state,id)=>!!state.campaign?.hard?.[id]?.cleared;
export function hardUnlocked(state,id){const s=stages[id];return !!s&&unlocked(state,'hard')&&stageOrder.filter(o=>stages[o].chapterId===s.chapterId).every(o=>cleared(state,o));}
export function stageStatus(state,id){return cleared(state,id)?'cleared':stageUnlocked(state,id)?'open':'locked';}
// The battle the 출정 button starts: the chosen one if it is open, otherwise the first open battle not yet cleared.
export function currentStage(state){
 if(state.selectedStage&&stageUnlocked(state,state.selectedStage))return state.selectedStage;
 return stageOrder.find(id=>stageUnlocked(state,id)&&!cleared(state,id))??stageOrder.findLast(id=>stageUnlocked(state,id))??defaultStageId;
}
export const isBlocked=(stageId,x,y,difficulty)=>blockedCells(stageId,difficulty).some(c=>c.x===x&&c.y===y);
