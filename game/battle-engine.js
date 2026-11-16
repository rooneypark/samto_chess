// Fixed 50 ms simulation. Rendering and playback speed never affect these rules.
import {applySynergies} from './factions.js';
import {applyBonds} from './bonds.js';
const md=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const near=(a,arr)=>[...arr].sort((b,c)=>md(a,b)-md(a,c)||b.id-c.id);
// Tactic strength and boss parameters travel on the unit (set from progression/stage data).
// The literal fallbacks only serve battles checkpointed before those fields existed.
const power=u=>u.skillPower??(u.star>=5?1.2:u.star>=3?1.1:1);
const bossRule=u=>u.skillParams??{telegraphTicks:20,radius:1.5,coefficient:1.8,magic:true};
const castTicks=u=>u.skill==='boss'?bossRule(u).telegraphTicks:u.skill==='zhangjue'?20:10;
const weakest=arr=>[...arr].sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp||a.hp-b.hp||a.id-b.id);
// Hero-specific strengthening at permanent awakening 5 (roster-data.js awakening5).
const five=u=>u.star>=5;
// Tactics that may start without the current target in basic-attack range.
const anywhere=new Set(['16','35','77','32','34','0','tactician','boss','diaochan','guojia','xunyu','machao','pangtong','zhoucang','luxun','sunquan','ganning','taishici','lumeng','lusu','zhangjue','yuanshao','huatuo','gongsunzan']);
// blocked: impassable cells of the stage board ([{x,y}]). Nobody can stand on or path through them.
// rules: stage rules for this round. reinforcements [{at,units}] join mid-battle; hazard {cells,period,ratio,spread,max}
// hurts whoever stands on its cells every period; fire scales all fire damage (wind).
export function createBattle(units,mode='campaign',id='run',blocked=[],rules={}){
 const b={id,mode,tick:0,units:structuredClone(units),events:[],log:[],serial:0,result:null};
 if(blocked.length)b.blocked=blocked.map(c=>c.x+','+c.y);
 if(rules.reinforcements?.length)b.pending=structuredClone(rules.reinforcements);
 if(rules.hazard)b.hazard={...rules.hazard,cells:rules.hazard.cells.map(c=>({x:c.x,y:c.y}))};
 if(rules.fire)b.fireScale=rules.fire;
 applySynergies(b.units);applyBonds(b.units);
 return b;
}
function log(b,type,s,t,value=0,extra={}){const visual=u=>{if(!u)return {};const p=u.move?Math.max(0,Math.min(1,(b.tick-u.move.start)/(u.move.at-u.move.start))):0;return {x:u.x+(u.move?u.move.x-u.x:0)*p,y:u.y+(u.move?u.move.y-u.y:0)*p};};const at=visual(t??s),from=visual(s);b.log.push({x:at.x,y:at.y,sourceX:from.x,sourceY:from.y,hero:s?.hero,...extra,id:`${b.id}:${++b.serial}`,tick:b.tick,type,source:s?.id??null,target:t?.id??null,value});}
function event(b,e){b.events.push({...e,seq:++b.serial});}
function targets(b,u){return b.units.filter(v=>v.hp>0&&v.side!==u.side);}
function friends(b,u){return b.units.filter(v=>v.hp>0&&v.side===u.side);}
function target(b,u){const arr=targets(b,u),taunt=arr.find(v=>v.id===u.status.taunt?.source);return taunt??near(u,arr)[0];}
// Mana: silence blocks all gain; bonds may scale it.
function gain(u,n){if(u.status.silence)return;u.mana=Math.min(u.maxMana,u.mana+n*(u.manaGain??1));}
// Stun cancels the pending action at once (spent mana is not refunded) and blocks new ones until it ends.
function stun(b,t,ticks){if(!t||t.hp<=0||(t.skill==='xuchu'&&five(t)&&t.shield>0))return;t.status.stun={until:Math.max(t.status.stun?.until??0,b.tick+ticks)};t.action=null;}
function shield(b,u,t,n,d=60){t.shield+=n*(1+u.shieldBonus)*(u.status.buff?1.2:1);t.shieldEnd=b.tick+d;log(b,'shield',u,t,n);}
function hit(b,u,t,c,magic=false,delay=0,skill=true,extra={}){
 if(!t)return;
 let p=u.atk*(u.status.buff?1.2:1)*c*(skill?1+u.skillBonus:1);
 if(u.status.rage)p*=1+u.status.rage.atk;
 if(u.status.atkDown)p*=1-u.status.atkDown.value;
 // Role traits (battle-data.js roleTraits) and the 기습 strategy.
 if(u.trait==='archer'&&dist(u,t)>=3)p*=1.1;
 if(skill&&u.ambush)p*=1+u.ambush;
 event(b,{at:b.tick+(delay?60:0),born:b.tick,fromX:u.x,fromY:u.y,px:u.x,py:u.y,projectile:delay>0,type:'hit',source:u.id,target:t.id,power:p,magic,skill,...extra});
}
function heal(b,u,t,c){event(b,{at:b.tick,type:'heal',source:u.id,target:t.id,power:u.atk*c*(1+u.healBonus)*(u.status.buff?1.2:1)});}
function cluster(b,u,r=u.skill==='boss'?bossRule(u).radius:1.5){return targets(b,u).sort((a,c)=>targets(b,u).filter(v=>dist(v,c)<=r).length-targets(b,u).filter(v=>dist(v,a)<=r).length||a.id-c.id)[0];}
const flight=(u,v)=>Math.min(60,Math.ceil(dist(u,v)/8*20));
// The enemy standing just behind the target as seen from the attacker.
function behind(b,u,t){return targets(b,u).filter(v=>v.id!==t.id&&dist(t,v)<=1.5&&md(u,v)>md(u,t)).sort((a,c)=>dist(t,a)-dist(t,c)||a.id-c.id)[0];}
// A burning zone: `pulses` hits at one-second steps. Shape is a circle around `center` or a whole row.
function fireZone(b,u,shape,pulses,coefficient,mult){
 b.events=b.events.filter(e=>!(e.type==='fire'&&e.source===u.id));
 for(let i=1;i<=pulses;i++)event(b,{at:b.tick+i*20,type:'fire',source:u.id,side:u.side,...shape,power:u.atk*coefficient*mult*(1+u.skillBonus)*(u.status.buff?1.2:1)*(1+(u.fireBonus??0))});
 const zones=new Map();
 for(const e of b.events.filter(e=>e.type==='fire')){const z=zones.get(e.source);zones.set(e.source,{end:Math.max(z?.end??0,e.at),seq:Math.min(z?.seq??Infinity,e.seq)});}
 if(zones.size>5){const expired=[...zones].sort((a,c)=>a[1].end-c[1].end||a[1].seq-c[1].seq)[0][0];b.events=b.events.filter(e=>e.type!=='fire'||e.source!==expired);}
}
// Jump next to `v` (free neighbour nearest to the caster, then y, then x). Returns false when no cell is free.
function leapTo(b,u,v){const spot=neighbors(b,v).filter(p=>free(b,p,u)).sort((a,c)=>md(a,u)-md(c,u)||a.y-c.y||a.x-c.x)[0];if(!spot)return false;Object.assign(u,spot);return true;}
function ganningStrike(b,u){const v=[...targets(b,u)].sort((a,c)=>a.hp-c.hp||a.id-c.id)[0];if(!v)return;leapTo(b,u,v);hit(b,u,v,2.2*power(u),false,0,true,{tag:'ganning'});}
function skill(b,u,a){
 const es=targets(b,u),fs=friends(b,u),t=b.units.find(v=>v.id===a.target&&v.hp>0)??target(b,u),mult=power(u);
 const strike=(v,c,m=false,d=0,extra)=>hit(b,u,v,c*mult,m,d,true,extra),area=(p,r,c,m=false,extra)=>es.filter(v=>dist(p,v)<=r).forEach(v=>strike(v,c,m,0,extra));
 const duration=60+(u.skillDuration??((u.star>=3?10:0)+(u.star>=5?10:0)));
 const others=fs.filter(v=>v.id!==u.id),until=ticks=>b.tick+ticks;
 u.casts++;log(b,'skill',u,t,0,{center:a.center,skill:u.skill,...(u.skill==='boss'?{radius:bossRule(u).radius}:{})});
 switch(u.skill){
 case '0':for(const v of weakest(fs).slice(0,five(u)?3:2)){heal(b,u,v,1.8*mult);shield(b,u,v,u.atk*mult);}break;
 case 'diaochan':{const enemy=[...es].sort((a,b)=>b.atk-a.atk||a.id-b.id)[0],ally=[...fs].sort((a,b)=>b.atk-a.atk||a.id-b.id)[0];if(enemy){enemy.status.attackSlow={until:b.tick+60};if(five(u))stun(b,enemy,20);}if(ally){shield(b,u,ally,u.atk*2*mult);if(ally.hero==='119')ally.status.love={until:b.tick+100};}}break;
 case 'tactician':if(fs.length)heal(b,u,weakest(fs)[0],(five(u)?3.2:2.5)*mult);break;
 case 'infantry':shield(b,u,u,u.atk*(five(u)?2.6:2)*mult);break;
 case '2':u.status.reduce={until:b.tick+duration};for(const v of es.filter(v=>dist(u,v)<=2)){v.status.taunt={until:b.tick+duration-20,source:u.id};if(five(u))v.status.atkDown={until:b.tick+duration-20,value:.15};}break;
 case '32':for(const v of [u,...near(u,others).slice(0,five(u)?4:2)])v.status.buff={until:b.tick+duration+20+(fs.some(v=>v.hero==='33')?20:0)};break;
 case '33':shield(b,u,u,u.atk*3*mult);u.burst=true;break;
 case '16':{const v=[...es].sort((v,w)=>md(u,w)-md(u,v)||v.hp/v.maxHp-w.hp/w.maxHp||v.id-w.id)[0];if(v)strike(v,2.8,false,flight(u,v),five(u)?{ignoreDef:.3}:undefined);break;}
 case 'archer':if(t)strike(t,five(u)?2.2:1.8,false,flight(u,t));break;
 case '35':if(a.center){const r=five(u)?2:1.5;area(a.center,r,2,true);for(const v of es.filter(v=>dist(v,a.center)<=r))v.status.slow={until:b.tick+60};}break;
 case 'boss':if(a.center){const p=bossRule(u);area(a.center,p.radius,p.coefficient,p.magic);}break;
 case '77':fireZone(b,u,{center:a.center},five(u)?5:4,.7,mult);break;
 case '119':{u.hp=Math.max(1,u.hp-Math.floor(u.hp*.1));const struck=es.filter(v=>dist(u,v)<=2);area(u,2,2.5);if(five(u)&&struck.length)event(b,{at:b.tick,type:'heal',source:u.id,target:u.id,power:u.maxHp*.03*struck.length});break;}
 case '34':{const v=[...es].sort((v,w)=>(u.side===0?w.y-v.y:v.y-w.y)||v.def-w.def||v.id-w.id)[0];if(v){if(leapTo(b,u,v))strike(v,2);else if(t)strike(t,2);}break;}
 case '1':if(t){const dx=t.x-u.x,dy=t.y-u.y,l=Math.hypot(dx,dy),low=five(u)?.35:.25;for(const v of es){const d=dist(u,v);if(d<=2&&((v.x-u.x)*dx+(v.y-u.y)*dy)/Math.max(.001,d*l)>=Math.SQRT1_2)strike(v,2.2*(v.hp/v.maxHp<low?1.3:1));}}break;
 case '15':if(t){strike(t,1.8);const dx=t.x-u.x,dy=t.y-u.y,l=Math.hypot(dx,dy);es.filter(v=>v.id!==t.id).filter(v=>{const x=v.x-u.x,y=v.y-u.y,p=(x*dx+y*dy)/l;return p>=0&&p<=3&&Math.abs(x*dy-y*dx)/l<=.5;}).slice(0,3).forEach(v=>strike(v,1));if(five(u))u.status.reduce={until:until(40),value:.3};}break;
 // ---- 위
 case 'simayi':{let from=t;const struck=[];for(const c of five(u)?[1.8,1.45,1.15,.9]:[1.8,1.45,1.15]){const v=struck.length?[...es].filter(v=>!struck.includes(v)&&dist(from,v)<=3).sort((x,y)=>dist(from,x)-dist(from,y)||x.id-y.id)[0]:t;if(!v)break;strike(v,c,true,0,{stun:10});struck.push(v);from=v;}break;}
 case 'dianwei':u.status.reduce={until:until(duration),value:five(u)?.35:.2};u.status.rage={until:until(duration),atk:.4};for(const v of es.filter(v=>dist(u,v)<=2))v.status.taunt={until:until(duration),source:u.id};break;
 case 'guojia':{const cut=five(u)?.3:.2;for(const v of es)v.status.defDown={until:until(duration+20),def:cut,mdef:cut};const v=[...es].sort((x,y)=>y.hp-x.hp||x.id-y.id)[0];if(v)strike(v,2.2,true);break;}
 case 'xuchu':shield(b,u,u,u.atk*2.5*mult);u.empower={count:3,bonus:.5};break;
 case 'xiahouyuan':u.status.haste={until:until(duration+20),value:.6,...(five(u)?{pierce:true}:{})};break;
 case 'xuhuang':if(t)strike(t,2.3,false,0,{stun:five(u)?30:20});break;
 case 'xunyu':for(const v of fs)gain(v,five(u)?30:20);if(fs.length)heal(b,u,weakest(fs)[0],2*mult);break;
 case 'yuejin':if(t)strike(t,1.8);break;
 case 'caohong':{shield(b,u,u,u.atk*2.2*mult);const v=near(u,others)[0];if(five(u)&&v)shield(b,u,v,u.atk*1.1*mult);break;}
 // ---- 촉
 case 'machao':{const v=[...es].sort((x,y)=>md(u,y)-md(u,x)||x.id-y.id)[0];if(!v)break;const start={x:u.x,y:u.y};if(!leapTo(b,u,v)){if(t)strike(t,1.6);break;}
  const dx=u.x-start.x,dy=u.y-start.y,l=Math.max(.001,Math.hypot(dx,dy));
  for(const w of es){const x=w.x-start.x,y=w.y-start.y,p=(x*dx+y*dy)/l;if(w.id===v.id||(p>=0&&p<=l&&Math.abs(x*dy-y*dx)/l<=.6))strike(w,1.6);}
  for(const w of es.filter(w=>dist(u,w)<=1.5))stun(b,w,15);if(five(u))u.status.haste={until:until(60),value:.3};break;}
 case 'pangtong':{const c=a.center??t;if(!c)break;for(const v of [...es].sort((x,y)=>dist(c,x)-dist(c,y)||x.id-y.id).slice(0,3)){strike(v,1.5,true);v.status.root={until:until(duration-20),...(five(u)?{fireTaken:.3}:{})};}break;}
 case 'jiangwei':if(t){strike(t,2);t.status.defDown={until:until(duration+20),def:five(u)?.2:0,mdef:.3};}break;
 case 'weiyan':if(t)strike(t,2.5*(u.hp/u.maxHp<.5?1.3:1),false,0,{lifesteal:five(u)?.5:.3});break;
 case 'liaohua':if(t)strike(t,1.5);u.status.reduce={until:until(duration),value:five(u)?.3:.2};break;
 case 'zhoucang':{const v=near(u,others)[0]??u;shield(b,u,v,u.atk*2*mult);if(five(u)&&v.id!==u.id)shield(b,u,u,u.atk*2*mult);break;}
 // ---- 오
 case 'sunce':u.status.rage={until:until(duration),atk:.4,extend:true};u.status.haste={until:until(duration),value:.3};if(five(u))shield(b,u,u,u.maxHp*.15/Math.max(.001,(1+u.shieldBonus)*(u.status.buff?1.2:1)));break;
 case 'luxun':{const rows=[...new Set(es.map(v=>v.y))].sort((x,y)=>es.filter(v=>v.y===y).length-es.filter(v=>v.y===x).length||x-y);if(!rows.length)break;const row=rows[0];fireZone(b,u,{row},3,.8,mult);
  if(five(u))for(const next of [row-1,row+1])if(next>=0&&next<8)event(b,{at:b.tick+80,type:'fire',source:u.id,side:u.side,row:next,power:u.atk*.8*mult*(1+u.skillBonus)*(u.status.buff?1.2:1)*(1+(u.fireBonus??0))});break;}
 case 'sunquan':for(const v of fs){shield(b,u,v,u.atk*1.2*mult,duration+20);v.status.defUp={until:until(duration+20),value:.15};if(five(u))v.status.rage={until:until(duration+20),atk:.1};}break;
 case 'ganning':u.rekill=five(u)?2:1;ganningStrike(b,u);break;
 case 'taishici':for(const v of near(u,es).slice(0,five(u)?4:3))strike(v,1.4,false,flight(u,v));break;
 case 'lumeng':{const v=[...es].sort((v,w)=>(u.side===0?w.y-v.y:v.y-w.y)||v.hp-w.hp||v.id-w.id)[0];if(!v)break;leapTo(b,u,v);strike(v,2.4);v.status.silence={until:until(five(u)?60:40)};break;}
 case 'huanggai':if(!five(u))u.hp=Math.max(1,u.hp-Math.floor(u.hp*.15));fireZone(b,u,{center:{x:u.x,y:u.y}},3,.6,mult);u.status.reduce={until:until(duration),value:.3};break;
 case 'lusu':for(const v of weakest(fs).slice(0,five(u)?3:2)){heal(b,u,v,1.6*mult);gain(v,15);}break;
 case 'sunshangxiang':if(t){strike(t,2,false,flight(u,t),{stun:15});const v=five(u)&&behind(b,u,t);if(v)strike(v,1,false,flight(u,v));}break;
 case 'dingfeng':if(t)strike(t,1.8*(five(u)&&t.hp/t.maxHp<.5?1.3:1));break;
 case 'panzhang':if(t){strike(t,1.5);t.status.slow={until:until(60)};}break;
 // ---- 군웅
 case 'zhangjue':if(a.center)area(a.center,1.5,1.9,true,five(u)?{stun:10}:undefined);break;
 case 'dongzhuo':area(u,2,1.7,false,{lifesteal:five(u)?.8:.5});break;
 case 'yuanshao':for(const v of [u,...near(u,others).slice(0,2)]){v.status.buff={until:until(duration+20)};if(five(u))v.status.haste={until:until(duration+20),value:.15};}break;
 case 'huatuo':for(const v of fs){heal(b,u,v,1.5*mult);for(const key of ['slow','attackSlow','defDown','atkDown','root','silence','stun','taunt'])delete v.status[key];if(five(u))v.status.regen={until:until(60),start:b.tick,source:u.id,ratio:.02};}break;
 case 'yanliang':if(t){const dx=t.x-u.x,dy=t.y-u.y,l=Math.max(.001,Math.hypot(dx,dy));const line=es.map(v=>{const x=v.x-u.x,y=v.y-u.y;return {v,p:(x*dx+y*dy)/l,off:Math.abs(x*dy-y*dx)/l};}).filter(e=>e.p>0&&e.p<=3&&e.off<=.5).sort((x,y)=>x.p-y.p||x.v.id-y.v.id);line.forEach((e,i)=>strike(e.v,2,false,0,five(u)&&i===0?{stun:20}:undefined));}break;
 case 'wenchou':if(t){strike(t,1.9);if(t.hp/t.maxHp<(five(u)?.65:.5))strike(t,1.9);}break;
 case 'huaxiong':if(t)strike(t,2.3);u.status.haste={until:until(duration),value:five(u)?.35:.2};break;
 case 'gongsunzan':{const v=[...es].sort((x,y)=>md(u,y)-md(u,x)||x.id-y.id)[0];if(!v)break;leapTo(b,u,v);strike(v,1.8);if(five(u))u.status.reduce={until:until(40),value:.3};break;}
 }
}
function neighbors(b,u){return [{x:u.x,y:u.y+1},{x:u.x+1,y:u.y},{x:u.x,y:u.y-1},{x:u.x-1,y:u.y}].filter(p=>p.x>=0&&p.x<8&&p.y>=0&&p.y<8&&!b.blocked?.includes(p.x+','+p.y));}
function free(b,p,u){return !b.units.some(v=>v.hp>0&&v.id!==u.id&&((v.x===p.x&&v.y===p.y)||(v.move?.x===p.x&&v.move?.y===p.y)));}
function path(b,u,t){t=t.move?{x:t.move.x,y:t.move.y}:t;const q=[{x:u.x,y:u.y,first:null}],seen=new Set([`${u.x},${u.y}`]);for(let i=0;i<q.length;i++){const p=q[i];if(p.first&&md(p,t)<=u.range)return p.first;for(const n of neighbors(b,p)){const k=`${n.x},${n.y}`;if(!seen.has(k)&&free(b,n,u)){seen.add(k);q.push({...n,first:p.first??n});}}}return null;}
// Effects of a kill for the unit that landed the last hit.
function onKill(b,k,e){
 if(k.trait==='front')gain(k,10);
 if(k.killHeal)k.hp=Math.min(k.maxHp,k.hp+k.maxHp*k.killHeal);
 if(k.status.rage?.extend){k.status.rage.until+=20;if(k.status.haste)k.status.haste.until+=20;}
 if(!e.skill)return;
 if(k.skill==='34'&&five(k))k.mana=Math.min(k.maxMana,k.mana+50);
 if(k.skill==='yuejin'&&five(k))k.status.haste={until:b.tick+40,value:.3};
 if(k.skill==='ganning'&&e.tag==='ganning'&&k.rekill>0){k.rekill--;ganningStrike(b,k);}
}
export function stepBattle(b){
 if(b.result)return b;b.tick++;
 // Reinforcements arrive on their tick, on their cell or the nearest free one.
 if(b.pending?.length){for(const wave of b.pending.filter(w=>w.at<=b.tick))for(const u of wave.units){const taken=p=>b.units.some(v=>v.hp>0&&v.x===p.x&&v.y===p.y)||b.blocked?.includes(p.x+','+p.y);
   const spot=[...Array(64)].map((_,i)=>({x:i%8,y:Math.floor(i/8)})).filter(p=>!taken(p)).sort((p,q)=>md(p,u)-md(q,u)||p.y-q.y||p.x-q.x)[0];if(!spot)continue;const joined={...u,...spot};b.units.push(joined);log(b,'spawn',joined,joined);}
  b.pending=b.pending.filter(w=>w.at>b.tick);}
 // Hazard cells: a pulse every period; a spreading hazard then grows by one neighbouring cell.
 if(b.hazard&&b.tick%b.hazard.period===0){const h=b.hazard;log(b,'hazard',undefined,undefined,0,{cells:h.cells.map(c=>({...c}))});
  for(const u of b.units.filter(v=>v.hp>0&&!v.move&&h.cells.some(c=>c.x===v.x&&c.y===v.y)))event(b,{at:b.tick,type:'hit',source:u.id,target:u.id,power:u.maxHp*h.ratio,magic:true,pure:true,skill:false});
  if(h.spread&&h.cells.length<(h.max??12)){const has=p=>h.cells.some(c=>c.x===p.x&&c.y===p.y),next=h.cells.flatMap(c=>neighbors(b,c)).filter(p=>!has(p)).sort((p,q)=>p.y-q.y||p.x-q.x)[(b.tick/h.period)%3|0];if(next)h.cells.push(next);}}
 for(const u of b.units.filter(v=>v.hp>0)){if(b.tick===60&&u.trait==='tactician')gain(u,10);for(const [key,s] of Object.entries(u.status))if(s.until<=b.tick)delete u.status[key];if(u.shieldEnd<=b.tick)u.shield=0;if(u.move?.at<=b.tick){u.x=u.move.x;u.y=u.move.y;u.move=null;}if(u.burst&&!u.shield){u.burst=false;for(const v of targets(b,u).filter(v=>dist(u,v)<=1.5))hit(b,u,v,1.8*power(u),false,0,true,five(u)?{stun:20}:undefined);}
  if(u.status.regen&&(b.tick-u.status.regen.start)%20===0)event(b,{at:b.tick,type:'heal',source:u.status.regen.source,target:u.id,power:u.maxHp*u.status.regen.ratio});}
 const alive=b.units.filter(u=>u.hp>0),byId=new Map(alive.map(u=>[u.id,u]));
 for(const u of alive){if(u.action?.at<=b.tick){const a=u.action;u.action=null;u.poseTarget=a.target;u.poseUntil=b.tick+7;u.poseStart=b.tick;u.poseSkill=Boolean(a.skill);if(u.status.stun)continue;if(a.skill){skill(b,u,a);delete u.ambush;}else{const t=byId.get(a.target);if(t&&(u.range>1||md(u,t)<=u.range)){
  let c=u.status.love?1.3:1;
  if(u.empower){c*=1+u.empower.bonus;if(--u.empower.count<=0)delete u.empower;}
  if(u.firstHit){c*=u.firstHit;delete u.firstHit;}
  if(u.skill==='panzhang'&&five(u)&&t.status.slow)c*=1.2;
  const delay=u.range>1?flight(u,t):0;
  hit(b,u,t,c,false,delay,false);delete u.status.love;gain(u,15);log(b,'attack',u,t);
  if(u.status.haste?.pierce){const v=behind(b,u,t);if(v)hit(b,u,v,1,false,u.range>1?flight(u,v):0,false);}
 }}}}
 for(const e of b.events.filter(e=>e.projectile)){const t=byId.get(e.target);if(!t||b.tick-e.born>60){e.expired=true;continue;}const dx=t.x-e.px,dy=t.y-e.py,d=Math.hypot(dx,dy);if(d<=.4){e.at=b.tick;e.projectile=false;}else{e.px+=dx/d*.4;e.py+=dy/d*.4;if(b.tick-e.born>=60)e.expired=true;}}
 b.events=b.events.filter(e=>!e.expired);
 const due=b.events.filter(e=>e.at<=b.tick).sort((a,c)=>a.at-c.at||a.seq-c.seq);b.events=b.events.filter(e=>e.at>b.tick);
 for(const e of due.filter(event=>event.type==='fire'&&(event.center||event.row!==undefined))){
  const source=b.units.find(u=>u.id===e.source);
  log(b,'fire-pulse',source,undefined,0,e.row!==undefined?{row:e.row}:{center:e.center});
  for(const v of alive.filter(v=>v.side!==e.side&&(e.row!==undefined?v.y===e.row:dist(v,e.center)<=1.5)))due.push({...e,type:'hit',target:v.id,magic:true,fire:true,power:e.power*(b.fireScale??1)});
 }
 const delta=new Map(),damaged=new Set(),lastHit=new Map(),stuns=[];
 for(const e of due){const t=byId.get(e.target),s=b.units.find(u=>u.id===e.source);if(!t)continue;if(e.type==='heal'){const n=Math.min(t.maxHp-t.hp,e.power);delta.set(t.id,(delta.get(t.id)??0)+n);if(s)s.healing+=n;log(b,'heal',s,t,Math.floor(n));}else if(e.type==='hit'){
  let armor=e.pure?0:e.magic?t.mdef:t.def,taken=t.status.reduce?.until>b.tick?(t.status.reduce.value===undefined?.7:1-t.status.reduce.value):1,raw=e.power;
  const down=t.status.defDown,cut=down?(e.magic?down.mdef:down.def):0;
  if(cut)armor*=1-cut;
  if(t.status.defUp&&!e.magic)armor*=1+t.status.defUp.value;
  if(e.ignoreDef)armor*=1-e.ignoreDef;
  if(t.guard)taken*=1-t.guard;
  if(t.trait==='tank'&&t.hp<t.maxHp*.5)taken*=.9;
  if(e.fire&&t.status.root?.fireTaken)raw*=1+t.status.root.fireTaken;
  let n=Math.max(1,Math.floor(raw*100/(100+armor)*taken));const total=n,abs=Math.min(t.shield,n);t.shield-=abs;n-=abs;delta.set(t.id,(delta.get(t.id)??0)-n);damaged.add(t.id);lastHit.set(t.id,e);if(s&&!e.pure)s.damage+=total;log(b,'damage',s,t,total,{magic:!!e.magic,skill:!!e.skill,shielded:abs,...(s?.hero==='1'&&e.skill?{tileX:t.x,tileY:t.y}:{})});
  if(e.lifesteal&&s?.hp>0){const back=total*e.lifesteal;delta.set(s.id,(delta.get(s.id)??0)+back);s.healing+=back;log(b,'heal',s,s,Math.floor(back));}
  if(e.stun)stuns.push([t,e.stun]);
 }}
 const fallen=[];
 for(const u of alive){u.hp=Math.max(0,Math.min(u.maxHp,u.hp+(delta.get(u.id)??0)));if(damaged.has(u.id))gain(u,5);if(!u.hp){u.action=null;u.move=null;log(b,'death',u,u);fallen.push(u);}}
 for(const [t,ticks] of stuns)stun(b,t,ticks);
 for(const u of fallen){const e=lastHit.get(u.id),k=e&&b.units.find(v=>v.id===e.source&&v.hp>0);if(k)onKill(b,k,e);}
 const a=b.units.filter(u=>u.side===0&&u.hp>0),e=b.units.filter(u=>u.side===1&&u.hp>0);
 if(!a.length||!(e.length+(b.pending?.length??0)))b.result=!a.length?(!e.length&&b.mode==='arena'?'draw':'loss'):'win';
 if(!b.result&&b.tick>=1800){const ratio=side=>b.units.filter(u=>u.side===side).reduce((n,u)=>n+u.hp,0)/b.units.filter(u=>u.side===side).reduce((n,u)=>n+u.maxHp,0),d=ratio(0)-ratio(1);b.result=b.mode==='campaign'?'loss':Math.abs(d)<1e-9?'draw':d>0?'win':'loss';}
 if(b.result){b.events=[];return b;}
 for(const u of b.units.filter(u=>u.hp>0)){if(u.ready>b.tick||u.move||u.action||u.status.stun)continue;const t=target(b,u);if(!t)continue;if(u.skill&&u.maxMana>0&&u.mana>=u.maxMana&&(md(u,t)<=u.range||anywhere.has(u.skill))){u.mana=0;u.action={start:b.tick,skill:true,target:t.id,center:{x:(cluster(b,u)??t).x,y:(cluster(b,u)??t).y},at:b.tick+castTicks(u)};u.ready=b.tick+castTicks(u)+10;}else if(md(u,t)<=u.range){const interval=Math.ceil(u.interval/Math.max(.5,Math.min(2,1+(u.status.buff?.15:0)-(u.status.attackSlow?.3:0)+(u.status.haste?.value??0))));u.action={start:b.tick,target:t.id,at:b.tick+Math.ceil(interval*.35)};u.ready=b.tick+interval;}else if(!u.status.root){const p=path(b,u,t);if(p){let ticks=Math.max(2,Math.ceil(10/(1+u.moveBonus)/(u.status.slow?.until>b.tick?.7:1)));if(u.trait==='mobile'&&!u.moved){ticks=Math.max(2,Math.ceil(ticks/2));u.moved=true;}u.move={...p,fromX:u.x,fromY:u.y,start:b.tick,at:b.tick+ticks};}}}
 return b;
}
