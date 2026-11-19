import {compactAction} from './compact-action.js';
import {artButton,initArtPress} from './art-controls.js';
import {artSet} from './art.js';
import {renderSynergy} from './synergy-chips.js';
import {artworkHeader} from './ui-shell.js';
import {battleSprites} from './assets/battle-v2/sprites.js';
import {characterFacing,characterView} from './character-art.js';
import {designPortrait} from './art.js';
import {chapters,stageOf,stageName} from './stages.js';
import {roundCount} from './battle-data.js';

export const battleV2=artSet==='a';
const silverCoin='<img class="battle-silver-coin" src="assets/battle-v2/silver-coin.svg" alt="">';
export function rankIndicator(rank){
 return battleV2?Array.from({length:5},(_,i)=>`<i class="rank-diamond ${i<rank?'filled':''}" style="--diamond-index:${i}" aria-hidden="true"></i>`).join(''):['','Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ'][rank];
}
export const battleUIReady=battleV2&&typeof Image!=='undefined'?Promise.all(['scene','summon','start','help','capacity','scroll-empty','sword','armor','bow','bench',...Object.keys(battleSprites).filter(id=>!characterView(id.replace(/-(front|back)$/,'')))].map(id=>{const image=new Image();image.src='assets/battle-v2/'+id+'.png';return image.decode().catch(()=>{});})):Promise.resolve();
// Source silhouettes stay consistent through preparation, combat and results.
// Engine positions drive movement; native motion sheets remain the fallback for other heroes.
export function preparationSprite(u,phase,battle,reduced=false){
 if(!battleV2)return '';
 const facing=characterFacing(u,battle),original=characterView(u.hero,facing.view);
 if(original){
  const bench=u.y<0,slotWidth=bench?[114,108,105,105,105,105,105,102][u.x]:88,slotHeight=bench?130:91;
  const scale=bench?95/256:1,w=256*scale,h=w*slotWidth/slotHeight;
  const x=50-128*scale,y=(bench?88:70)-224*scale*slotWidth/slotHeight;
  return `<img class="unit-sprite approved-unit" data-character-art="${u.hero}-${facing.view}" draggable="false" src="${original.url}" alt="" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%;max-width:none;transform:scaleX(${facing.flip?-1:1});transform-origin:50% 87.5%">`;
 }
 const id=u.y<0?(u.hero==='32'?'32-front':u.hero==='archer'?'archer-front':u.hero+'-back'):u.side===1?(u.hero==='raider'?'raider-front':u.hero==='bow'?'bow-front':null):u.hero+'-back';
 const s=battleSprites[id];if(!s)return '';
 const slotWidth=u.y<0?[114,108,105,105,105,105,105,102][u.x]:88;
 const slotHeight=u.y<0?130:91;
 const scale=u.y<0?Math.min(1,110/(s.visible?.[3]??s.height)):1;
 const w=s.width/slotWidth*100*scale,h=s.height/slotHeight*100*scale;
 const x=50-s.foot[0]/slotWidth*100*scale,y=(u.y<0?88:70)-s.foot[1]/slotHeight*100*scale;
 const tick=battle?.tick??0,target=battle?.units.find(v=>v.id===(u.action?.target??u.poseTarget));
 const active=phase==='fighting'&&!reduced;
 const strike=active&&u.action?Math.sin(Math.min(1,(tick-u.action.start)/Math.max(1,u.action.at-u.action.start))*Math.PI)*5:0;
 const dx=target?Math.sign(target.x-u.x)*strike:0,dy=target?-Math.sign(target.y-u.y)*strike:0;
 const lift=active&&u.move?Math.sin((tick-u.move.start)*Math.PI/5)*1.5:0;
 return `<img class="unit-sprite approved-unit" draggable="false" src="assets/battle-v2/${id}.png" alt="" style="left:${x+dx}%;top:${y+dy-lift}%;width:${w}%;height:${h}%">`;
}
const geometry={
 '#battle-header-pause':[718,20,76,74],
 '.battle-title h2':[335,24,275,69], '.battle-title>span':[264,172,441,46],
 '.battle-status>span:first-child':[124,251,151,45], '.battle-status>span:nth-child(2)':[643,251,164,45],
 '.battle-hint':[63,1100,816,43],
 '.bench-heading>span':[78,1181,184,45], '.battle-equipment':[534,1166,362,76],

};
const place=(el,[x,y,w,h])=>{el.style.left=x/941*100+'%';el.style.top=y/1672*100+'%';el.style.width=w/941*100+'%';el.style.height=h/1672*100+'%';};
export function skinBattle(root,run,bonds,selected=null){
 if(!battleV2)return;
 root.classList.add('battle-v2');initArtPress(root.closest('.game'));
 const stage=stageOf(run.stageId),title=(run.mode==='arena'?'군웅대전':run.tutorial?'기초 훈련':stage.tower?stageName(run.stageId):(chapters[stage.chapterId]??'전역').replace(/ \(.*/,''))+(run.difficulty==='hard'?' · 어려움':'');
 root.querySelector('.battle-title h2').textContent=title;
 root.querySelector('.battle-title h2').classList.toggle('long-title',title.length>7);
 root.querySelector('.battle-title h2').classList.toggle('source-lettering',title==='황건의 난');
 root.querySelector('.battle-title>span').textContent=(run.phase==='prepare'?'전투 준비':run.phase==='fighting'?'전투 진행':'전투 결과')+' · '+run.round+'/'+roundCount(run.stageId)+' 라운드';
 root.querySelector('.battle-title>span').classList.toggle('source-lettering',run.phase==='prepare'&&run.round===1&&roundCount(run.stageId)===5);
 if(run.phase!=='fighting'){
  const silver=root.querySelector('.battle-status>span:first-child');
  silver.classList.add('battle-silver-balance');
  silver.setAttribute('aria-label','은화 '+run.silver);
  silver.innerHTML=silverCoin+'<b>'+run.silver+'</b>';
  const capacity=root.querySelector('.battle-status>span:nth-child(2)');
  // Keep the expansion button out of the text box's coordinate space.
  const plus=capacity?.querySelector('#battle-capacity');if(plus)root.append(plus);
  if(capacity)capacity.textContent='출전 '+run.units.filter(u=>u.y>=0).length+'/'+run.capacity;
 }
 if(!root.querySelector('#battle-bonds')){const bar=document.createElement('button');bar.type='button';bar.id='battle-bonds';bar.className='battle-bonds';bar.setAttribute('role','button');bar.tabIndex=0;root.append(bar);}
 const synergy=root.querySelector('#battle-bonds');renderSynergy(synergy,bonds);synergy.setAttribute('aria-label','세력 시너지와 인연 상세');synergy.classList.add('battle-press-control');
 // Selection belongs to the board layer, below every character (including neighbours).
 const units=run.phase==='prepare'?run.units:(run.battle?.units??run.units),chosen=units.find(u=>u.id===selected);
 root.querySelectorAll('.battle-cell').forEach(cell=>{
  const unit=units.find(u=>u.x===Number(cell.dataset.x)&&u.y===Number(cell.dataset.y));
  cell.classList.toggle('tile-selected',!!unit&&unit.id===selected);
  cell.classList.toggle('tile-mergeable',run.phase==='prepare'&&!!chosen&&!!unit&&unit.id!==selected&&unit.hero===chosen.hero&&unit.rank===chosen.rank&&unit.rank<5);
 });
 const count=root.querySelector('.bench-heading>span');if(count)count.textContent='대기 '+run.units.filter(u=>u.y<0).length+'/8';
 for(const [selector,box] of Object.entries(geometry)){const el=root.querySelector(selector);if(el)place(el,box);}
 const silverBalance=root.querySelector('.battle-silver-balance');
 if(silverBalance&&run.phase!=='fighting')place(silverBalance,[58,246,223,53]);
 root.querySelectorAll('.bench-cell').forEach((cell,i)=>place(cell,[31+[0,120,232,341,450,559,668,777][i],1256,[114,108,105,105,105,105,105,102][i],130]));
 for(const selector of ['#battle-exit','#battle-help','#battle-capacity','#battle-sell','#battle-summon','#battle-start'])root.querySelector(selector)?.classList.add('battle-art-button');
 for(const [selector,id] of Object.entries({'#battle-exit':'back','#battle-help':'help','#battle-capacity':'capacity','#battle-sell':'sell','#battle-summon':'summon','#battle-start':'start','#battle-bonds':'bonds'}))artButton(root.querySelector(selector),'battle-'+id);
 for(const id of ['battle-summon','battle-sell'])compactAction(root.querySelector('#'+id));
 const summon=root.querySelector('#battle-summon');
 if(summon){
  summon.setAttribute('aria-label','소환, 은화 3');
  summon.innerHTML='<img class="battle-summon-lettering" src="assets/battle-v2/summon-lettering.png" alt="소환"><small class="battle-summon-cost">'+silverCoin+'<b>3</b></small>';
 }
 artworkHeader(root,'battle',title);
 const capacityButton=root.querySelector('#battle-capacity');if(capacityButton){artButton(capacityButton,'battle-capacity',{paint:true});place(capacityButton,[813,236,89,74]);}
 root.querySelectorAll('[data-gear]').forEach((button,i)=>{const gear=run.gear[i];artButton(button,'battle-'+gear.type,{position:false});button.style.backgroundImage=`url('assets/battle-v2/${gear.type}.png')`;button.innerHTML='<small>'+['','Ⅰ','Ⅱ','Ⅲ'][gear.rank]+'</small>';button.setAttribute('aria-label',button.title);});
 if(run.phase==='fighting'){
  const portrait=root.querySelector('.combat-portrait'),chosen=run.battle?.units.find(u=>u.hero===portrait?.dataset.hero);
  if(portrait&&chosen&&designPortrait(chosen.hero)){portrait.src=designPortrait(chosen.hero);portrait.style.objectFit='contain';}
  const timer=root.querySelector('.battle-timer');root.querySelector('.battle-status>span').replaceChildren(timer);
  timer.setAttribute('aria-label','남은 시간 '+timer.textContent);
  const counter=root.querySelector('.battle-status>strong');place(counter,[640,251,245,45]);counter.classList.add('battle-live-count');
 }
}
