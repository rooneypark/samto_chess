// Balance probe: a simple scripted player runs every battle many times and reports the clear rate.
//   node game/tools/simulate-campaign.mjs [--seeds 40] [--stage sishui_03] [--faction 촉]
// The player is deliberately plain (summon, merge, deploy, expand, equip the strongest), so the
// numbers are a floor: a human who positions and picks bonds does better. Use it to compare
// stage definitions and growth levels, not as a prediction of real clear rates.
import {heroes} from '../heroes.js';
import {specs} from '../progression.js';
import {factions,defaultStarter} from '../factions.js';
import {stages,stageOrder} from '../stages.js';
import {newRun,prepareCommand,startRound,finishRound,nextRound} from '../battle-run.js';
import {stepBattle} from '../battle-engine.js';

const arg=name=>{const i=process.argv.indexOf('--'+name);return i<0?undefined:process.argv[i+1];};
const seeds=Number(arg('seeds')??40),only=arg('stage'),factionArg=arg('faction');
const front=[3,4,2,5,1,6].map(x=>({x,y:3})),back=[3,4,2,5,1,6].map(x=>({x,y:1}));

function profile(order,level,star){
 return {heroes:Object.fromEntries(heroes.map(h=>[h.id,{owned:true,level,star,cards:0,treasure:null}])),order,treasures:[],strategy:'vanguard',
  campaign:{cleared:true,stages:Object.fromEntries(stageOrder.map(id=>[id,{cleared:true}]))}};
}
function prepare(run){
 let r=run;
 const tryCommand=c=>{try{r=prepareCommand(r,c);return true;}catch{return false;}};
 for(let guard=0;guard<60;guard++){
  const board=r.units.filter(u=>u.y>=0),bench=r.units.filter(u=>u.y<0);
  // 1. merge: move a bench copy onto its twin (or two board twins together)
  const pair=r.units.flatMap(a=>r.units.filter(b=>b.id!==a.id&&b.hero===a.hero&&b.rank===a.rank&&a.rank<5).map(b=>[a,b])).sort((p,q)=>(q[1].y>=0)-(p[1].y>=0)||(p[0].y>=0)-(q[0].y>=0))[0];
  if(pair&&tryCommand({type:'move',id:pair[0].id,x:pair[1].x,y:pair[1].y}))continue;
  // 2. deploy from the bench: melee in the front row, ranged behind
  if(bench.length&&board.length<r.capacity){const u=bench[0],cells=(specs[u.hero].stats[4]<=1?front:back).concat(front,back),cell=cells.find(c=>!r.units.some(v=>v.x===c.x&&v.y===c.y));if(cell&&tryCommand({type:'move',id:u.id,...cell}))continue;}
  // 3. expand when the board is full and someone is waiting
  if(bench.length&&board.length>=r.capacity&&r.capacity<6&&tryCommand({type:'capacity'}))continue;
  // 4. summon while the bench has room to hold a merge candidate
  if(r.silver>=3&&bench.length<3&&tryCommand({type:'summon'}))continue;
  break;
 }
 while(r.gear.length){const strongest=r.units.filter(u=>u.y>=0).sort((a,b)=>b.rank-a.rank||specs[b.hero].stats[1]-specs[a.hero].stats[1])[0];if(!strongest||!tryCommand({type:'equip',id:strongest.id,index:0}))break;}
 return r;
}
function playStage(stageId,order,level,star,seed){
 let r=newRun(profile(order,level,star),seed,'sim',null,undefined,stageId);
 for(;;){
  r=prepare(r);if(!r.units.some(u=>u.y>=0))return {win:false,round:r.round};
  r=startRound(r);while(!r.battle.result)stepBattle(r.battle);r=finishRound(r);
  if(r.outcome!=='win')return {win:false,round:r.round};
  if(r.round===stages[stageId].rounds.length)return {win:true,round:r.round};
  r=nextRound(r,'sword');
 }
}
const growth=[[1,1],[5,1],[8,2],[12,2],[15,3],[20,3],[20,5]];
const decks=Object.entries(factionArg?{[factionArg]:factions[factionArg].starter}:{기본:defaultStarter,...Object.fromEntries(Object.values(factions).map(f=>[f.id,f.starter]))});
console.log(`seeds ${seeds} per cell · rows: battle · columns: hero level/awakening · value: clear rate % (average round reached on a loss)`);
for(const [name,order] of decks){
 console.log(`\n[${name}] ${order.map(id=>heroes.find(h=>h.id===id).name).join(' ')}`);
 console.log('battle'.padEnd(18)+growth.map(([l,s])=>`Lv${l}★${s}`.padStart(11)).join(''));
 for(const stageId of stageOrder.filter(id=>!only||id===only)){
  const cells=growth.map(([level,star])=>{let wins=0,lostAt=0,losses=0;for(let seed=1;seed<=seeds;seed++){const result=playStage(stageId,order,level,star,seed*7919);if(result.win)wins++;else{losses++;lostAt+=result.round;}}
   return `${Math.round(wins/seeds*100)}%${losses?`(${(lostAt/losses).toFixed(1)})`:''}`.padStart(11);});
  console.log(stageId.padEnd(18)+cells.join(''));
 }
}
