
export function warriorEffects(battle) {
 const effects=[];
 for(const event of battle.log){
  const age=battle.tick-event.tick,source=battle.units.find(unit=>unit.id===event.source);
  let row,life=12,cells=1;
  if(event.type==='skill'){row={'15':1,'16':1,archer:1,'34':2,bandit:2,xuhuang:1,yuejin:1,jiangwei:1,liaohua:1,dingfeng:1,panzhang:1,wenchou:1,huaxiong:1,yanliang:1,taishici:1,sunshangxiang:1,weiyan:2,machao:2,ganning:2,lumeng:2,gongsunzan:2}[source?.hero];cells=1.25;}
  else if(event.type==='attack'&&source?.range===1){row=source.hero==='bandit'?2:0;life=8;cells=.8;}
  else if(event.type==='damage'){row=1;life=6;cells=.45;}
  if(row===undefined||age>=life)continue;
  const frame=event.type==='damage'?3:Math.min(3,Math.floor(age/life*4));
  effects.push(`<span class="warrior-effect" data-effect-row="${row}" style="left:${(event.x+.5)*12.5}%;top:${(7-event.y+.35)*12.5}%;width:${cells*12.5}%;height:${cells*12.5}%;background-position:${frame*100/3}% ${row*100/3}%"></span>`);
 }
 return effects.join('');
}
