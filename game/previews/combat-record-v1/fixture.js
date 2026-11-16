import {createGameStore} from '../../store.js';
import {newRun,startRound} from '../../battle-run.js';
import {stepBattle} from '../../battle-engine.js';

// In-memory example only: no localStorage, IndexedDB, receipts or payouts.
export function recordExample(){
 const state=createGameStore({getItem:()=>null,setItem(){}}).get();
 state.order=['1','119','32','35','xuchu','diaochan'];state.campaign={cleared:true,stages:{yellow_02:{cleared:true}}};
 for(const id of state.order)Object.assign(state.heroes[id],{owned:true,level:10,star:3});
 let run=newRun(state,11,'record-preview',null,0,'yellow_03');run.round=5;run.capacity=6;
 run.units=state.order.map((hero,i)=>({id:i+1,hero,rank:2,x:i+1,y:3}));run=startRound(run);
 while(!run.battle.result)stepBattle(run.battle);
 return run.battle;
}
