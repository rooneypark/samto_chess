import {battleImpact,departScene} from './scene-motion.js';
import {preloadApprovedMotions,approvedMotionSprite,paintApprovedMotions} from './approved-motion.js';
import {createSkillCutin} from './skill-cutin.js';
import {createCombatRecord} from './combat-record.js';
import {renderResultsArtwork,clearResultsArtwork} from './results-ui.js';
import {continuesRun,canRetry} from './results-model.js';
import {RULESET,CONTENT_VERSION} from './versions.js';
import {preparationSprite,skinBattle,battleUIReady,rankIndicator,battleV2} from './battle-ui.js';

import {createBattleAudio} from './battle-audio.js';
import {tutorialText} from './tutorial.js';
import {preloadBattleSprites} from './battle-preload.js';
import {motionPose,spritePlacement,screenPosition} from './battle-presentation.js';
import {battleEffects,skillIcon} from './battle-effects.js';
import {heroes} from './heroes.js';
import {specs} from './progression.js';
import {ranks,gearNames,enemies,enemyImage,combatant,roundCount,roundRule,stageReward,arenaRules,arenaUnits,opponentStrategy,strategyNames} from './battle-data.js';
import {escapeHtml} from './dialog-content.js';
import {archiveRun} from './retention.js';
import {stageOf,stageName,chapters,isBlocked} from './stages.js';
import {activeBonds} from './bonds.js';
import {synergyTiers,synergyLabel,synergies} from './factions.js';
import {newRun,newTutorial,prepareCommand,startRound,finishRound,nextRound,retryRound,settle} from './battle-run.js';
import {stepBattle} from './battle-engine.js';
// Status marks above a unit, most important first; at most four are shown.
const statusMarks=[['stun','기절','★'],['root','속박','⛓'],['silence','침묵','✕'],['taunt','도발','!'],['defDown','방어 감소','▽'],['atkDown','공격 감소','↓'],['slow','둔화','~'],['attackSlow','공격속도 감소','◷'],['rage','격앙','▲'],['buff','강화','↑'],['haste','가속','»'],['defUp','방어 증가','△'],['reduce','피해 감소','◆'],['regen','재생','+']];
const negative=new Set(['stun','root','silence','taunt','defDown','atkDown','slow','attackSlow']);
export function initBattle({store,dialog,navigate}){
 const audio=createBattleAudio(()=>store.get().preferences);
 const game=document.querySelector('.game'),root=document.createElement('section');root.className='battle-screen';root.hidden=true;root.setAttribute('aria-label','전투');game.append(root);
 const cutin=createSkillCutin(game,()=>store.get());
 const records=createCombatRecord({game,onError:e=>dialog.open('전투 기록 표시 오류','<p>'+escapeHtml(e.message)+'</p>')});

 let run=null,selected=null,speed=1,paused=false,last=0,acc=0,frame=0,error='',drag=null,mergeNotice=null,loading=false,committing=false;
 const save=()=>store.update(s=>({...s,battleRun:run}));
 async function persist(){try{await save();return true;}catch(e){paused=true;error='저장 실패: '+e.message;return false;}}
 async function act(fn){if(committing)return;committing=true;root.querySelectorAll('button').forEach(b=>b.disabled=true);const previous=run;try{run=fn(run);error='';if(!await persist())run=previous;else if(previous.phase==='prepare'&&run.units.length<previous.units.length){const upgraded=run.units.find(u=>u.rank>(previous.units.find(v=>v.id===u.id)?.rank??u.rank));if(upgraded){mergeNotice={id:upgraded.id,until:performance.now()+1400};setTimeout(()=>{if(run?.phase==='prepare')render();},1450);}}render();}catch(e){run=previous;error=e.message;render();}finally{committing=false;}}
 async function open(match=null,stageId,difficulty){const current=store.get().battleRun;if(current){if(current.rulesetId!==RULESET||current.contentVersion!==CONTENT_VERSION){dialog.confirm('이전 버전 출정 기록','이전 출정 기록을 보관하고 새 출정을 시작합니다.','기록 보관 후 새 출정',async()=>{await store.transact(s=>({...s,archivedRuns:[...(s.archivedRuns??[]),archiveRun(s.battleRun)],battleRun:null}));dialog.dismiss();await open(match,stageId,difficulty);});return;}run=current;}else{const s=store.get();run=newRun(s,crypto.getRandomValues(new Uint32Array(1))[0],match?.id??crypto.randomUUID(),match,Date.now(),stageId,difficulty);if(!await persist()){run=null;dialog.open('출정 저장 실패','<p>저장 공간을 사용할 수 없습니다. 다시 시도해 주세요.</p>');return false;}}await battleUIReady;dialog.dismiss();root.hidden=false;root.dataset.scene=run.mode==='arena'?'arena':String(run.stageId??'yellow').split('_')[0];game.classList.add('in-battle');selected=null;paused=false;last=0;loading=run.phase!=='result';render();if(!loading)return;root.setAttribute('aria-busy','true');const openingId=run.id;try{await preloadApprovedMotions();}catch(e){error=e.message;}await preloadBattleSprites(run.battle?.units??[...run.units,...heroes,...enemies(run.round,run.stageId,run.difficulty).map(u=>combatant(u,1,run.profile))]);if(!run||run.id!==openingId)return;loading=false;last=0;render();if(!root.classList.contains('results-v1')){root.setAttribute('aria-busy','false');if(run.phase==='prepare')departScene(game,root.querySelector('.battle-board'));}}
 function leave(destination){cutin.clear();records.close({notify:false});audio.stop();root.hidden=true;game.classList.remove('in-battle');if(frame)cancelAnimationFrame(frame);frame=0;const mode=run.mode,tutorial=!!run.tutorial,tower=stageOf(run.stageId).tower;run=null;clearResultsArtwork(root);root.replaceChildren();delete root.dataset.phase;navigate(destination??(mode==='arena'?'arena':tower?'tower':!tutorial&&location.hash==='#campaign'?'campaign':'home'));}
 async function closeRun(destination){try{await store.update(s=>({...s,battleRun:null}));leave(destination);}catch(e){error=e.message;render();}}
 function abandon(destination){
  const target=typeof destination==='string'?destination:undefined;paused=true;
  dialog.confirm('출정 포기','전투가 끝나며 추가 보상을 받을 수 없습니다.','포기',async()=>{
   if(committing)return;records.close();paused=true;committing=true;
   try{if(run.mode==='arena'&&!run.receipt){const ended={...run,phase:'result',outcome:'loss',abandoned:true,battle:null};await store.update(s=>settle(s,ended));run=store.get().battleRun;}
    await store.update(s=>({...s,battleRun:null}));dialog.dismiss();leave(target);
   }catch(e){error=e.message;render();dialog.open('출정 종료 실패','<p>'+escapeHtml(e.message)+'</p>');}finally{committing=false;}
  });
 }

 function advanceRound(){const loot=run.tutorial?null:roundRule(run.round,run.stageId).equipment;if(loot){dialog.open('전리품 선택','<p>이번 라운드의 장비를 하나 선택하세요.</p><div class="modal-actions">'+loot.choices.map(id=>'<button class="action" data-loot="'+id+'">'+gearNames[id]+'</button>').join('')+'</div>');document.querySelectorAll('[data-loot]').forEach(b=>b.onclick=()=>{act(r=>nextRound(r,b.dataset.loot));dialog.dismiss();});}else act(nextRound);}
 function showStats(previousRound=false){
  if(loading||records.isOpen||committing&&run.phase!=='fighting')return;
  if(!battleV2){paused=true;dialog.open('전투 기록',`<div class="combat-stats">${(run.battle?.units??[]).map(u=>`<p>${u.side?'적':'아군'} ${escapeHtml(u.name)} ${ranks[u.rank]}<br>피해 ${Math.floor(u.damage)} · 치유 ${Math.floor(u.healing)} · 전법 ${u.casts}회</p>`).join('')}</div>`);return;}
  const wasPaused=paused;paused=true;audio.stop();if(frame)cancelAnimationFrame(frame);frame=0;root.hidden=true;
  records.open({run,previousRound,state:store.get(),onClose:()=>{root.hidden=false;paused=wasPaused;last=0;if(run?.phase==='fighting'&&!frame)frame=requestAnimationFrame(loop);root.querySelector(previousRound?'#battle-start':'#battle-stats')?.focus({preventScroll:true});},
   onNavigate:destination=>{if(run.phase==='result')navigateResult(destination);else abandon(destination);},
   onWallet:()=>dialog.open('보유 재화','<p>골드 '+store.get().gold.toLocaleString()+' · 다이아 '+store.get().diamonds.toLocaleString()+'</p>')});
 }

 async function settleResult(){
  if(committing||!run)return;committing=true;root.inert=true;
  try{if(continuesRun(run))await save();else{await store.update(s=>settle(s,run));run=store.get().battleRun;}error='';}
  catch(e){error=e.message;}finally{committing=false;render();}
 }
 async function returnResult(destination){
  if(committing||!run)return;committing=true;root.inert=true;
  try{if(!continuesRun(run)&&!run.receipt){await store.update(s=>settle(s,run));run=store.get().battleRun;}await store.update(s=>({...s,battleRun:null}));leave(destination);}
  catch(e){error=e.message;render();}finally{committing=false;}
 }
 function navigateResult(destination){
  if(continuesRun(run)||canRetry(run))dialog.confirm('출정 종료','남은 라운드와 재도전을 종료하고 이동합니다.','이동',()=>{records.close();dialog.dismiss();returnResult(destination);});
  else {records.close();returnResult(destination);}
 }
 function sprite(u){
  const motion=approvedMotionSprite(u,run);if(motion)return motion;
  const approved=preparationSprite(u,run.phase,run.battle,run.profile.reducedMotion);if(approved)return approved;
  const actual=u.name!==undefined?u:combatant(u,0,run.profile,run.mode==='arena'),{pose,flip}=motionPose(u,run.battle),p=spritePlacement(pose);
  // Heroes whose artwork is still pending have no motion frames: show their marked placeholder token.
  if(actual.unit===undefined){const q=spritePlacement('MOV-7');return `<img class="unit-sprite unit-token" draggable="false" src="${heroes.find(h=>h.id===u.hero)?.sprite??enemyImage(u.hero)}" alt="${escapeHtml(actual.name)}" style="left:${q.left}%;top:${q.top}%;width:${q.width}%;height:${q.height}%">`;}
  return `<img class="unit-sprite" draggable="false" src="assets/battle/unit${Number(actual.unit)}/${pose}.png" alt="${escapeHtml(actual.name)}" data-pose="${pose}" data-ground-x="${p.anchorX}" data-ground-y="${p.anchorY}" style="left:${p.left}%;top:${p.top}%;width:${p.width}%;height:${p.height}%;${flip?'transform:scaleX(-1)':''}">`;
 }
 function tile(u){
  const reaction=battleImpact(u,run.battle),celebrate=mergeNotice?.id===u.id&&mergeNotice.until>performance.now(),mergeAge=celebrate?performance.now()-(mergeNotice.until-1400):1400;
  const dead=u.hp===0,merge=run.phase==='prepare'&&selected!==u.id&&run.units.some(v=>v.id===selected&&v.hero===u.hero&&v.rank===u.rank&&v.rank<5);
  return `<span class="battle-piece ${merge?'mergeable':''} ${u.side===1?'enemy':''} ${selected===u.id?'selected':''} ${dead?'fallen':''}" data-unit="${u.id}" style="translate:${reaction.offset}px 0"><span class="unit-ground" aria-hidden="true"></span>${sprite(u)}${reaction.shield?`<span class="motion-shield-break" aria-hidden="true" style="opacity:${reaction.opacity};rotate:${(1-reaction.opacity)*16}deg"></span>`:''}<b class="unit-rank ${celebrate?'motion-merge':''}" style="--merge-age:${mergeAge}ms" data-rank="${u.rank}" aria-label="합성 ${u.rank}단계">${rankIndicator(u.rank)}</b>${u.hp!==undefined?`<span class="life"><i style="width:${100*u.hp/u.maxHp}%"></i></span><span class="mana"><i style="width:${100*u.mana/(u.maxMana||1)}%"></i></span>${u.status&&u.hp>0?'<span class="unit-status">'+statusMarks.filter(([key])=>u.status[key]).slice(0,4).map(([key,label,mark])=>'<i class="'+(negative.has(key)?'bad':'good')+'" title="'+label+'">'+mark+'</i>').join('')+'</span>':''}`:''}${mergeNotice?.id===u.id&&mergeNotice.until>performance.now()?'<span class="merge-success">합성 성공 · '+u.rank+'단계</span>':''}${merge?'<label class="merge-label">합성 가능</label>':''}${u.gear?`<small class="unit-gear">${gearNames[u.gear.type]}${ranks[u.gear.rank]}</small>`:''}</span>`;
 }
 function render(){
  if(!run||records.isOpen)return;
  if(run.phase!=='fighting'){if(frame)cancelAnimationFrame(frame);frame=0;last=0;}else if(!frame)frame=requestAnimationFrame(loop);
  if(battleV2&&run.phase==='result'){
   audio.stop();renderResultsArtwork(root,{run,state:store.get(),error,onNext:advanceRound,onRetry:()=>{paused=false;act(retryRound);},onReturn:()=>returnResult(run.tutorial?'home':run.mode==='arena'?'arena':stageOf(run.stageId).tower?'tower':'campaign'),onNavigate:navigateResult,onStats:()=>showStats(),onSettle:settleResult,onWallet:()=>dialog.open('보유 재화','<p>골드 '+store.get().gold.toLocaleString()+' · 다이아 '+store.get().diamonds.toLocaleString()+'</p>')}).catch(e=>{if(run){root.inert=false;dialog.open('결과 화면 표시 오류','<p>'+escapeHtml(e.message)+'</p>');}});return;
  }
  if(root.classList.contains('results-v1'))clearResultsArtwork(root);

  if(run.tutorial?.step===5&&run.battle?.log.some(e=>e.type==='skill'&&e.hero===run.deck[0])&&!run.tutorial.skillSeen)paused=true;
  const fighting=run.phase==='fighting',result=run.phase==='result';
  const units=fighting||result&&run.battle?run.battle.units:[...run.units.map(u=>combatant(u,0,run.profile,run.mode==='arena')),...(run.mode==='arena'?arenaUnits(run.match.opponent.order,1).map(u=>combatant(u,1,run.profile,true,opponentStrategy(run.match))):enemies(run.round,run.stageId,run.difficulty).map(u=>combatant(u,1,run.profile)))];
  const living=units.filter(u=>u.hp===undefined||u.hp>0),time=Math.max(0,90-Math.floor((run.battle?.tick??0)/20)),timer=String(Math.floor(time/60)).padStart(2,'0')+':'+String(time%60).padStart(2,'0');
  const chosen=units.find(u=>u.id===selected)??(fighting?living.find(u=>u.side===0):null),name=chosen?.name??heroes.find(h=>h.id===chosen?.hero)?.name;
  const deployed=run.units.filter(u=>u.y>=0).map(u=>({hero:u.hero,faction:heroes.find(h=>h.id===u.hero)?.faction})),tiers=Object.entries(synergyTiers(deployed)),linked=activeBonds(deployed);
  const bonds=[...tiers.map(([f,v])=>synergies[f].name+' '+[2,4,6][v.tier-1]),...linked.map(a=>a.bond.name)].join(' · ')||'없음';
  root.classList.toggle('is-preparing',run.phase==='prepare');root.classList.toggle('is-fighting',fighting);root.classList.toggle('is-result',result);
  const markup=`
  ${run.tutorial?`<aside class="tutorial-guide" role="status"><strong>기초 훈련 ${run.tutorial.step} / 15</strong><span>${tutorialText(run)}</span>${[5,12].includes(run.tutorial.step)?`<button class="battle-button" id="tutorial-confirm">${run.tutorial.step===12?'기록 확인':'확인'}</button>`:''}</aside>`:''}
  <header class="battle-heading"><button id="battle-exit" aria-label="출정 포기">‹</button><div class="battle-title"><h2>${run.mode==='arena'?'군웅대전':run.tutorial?'기초 훈련':(stageOf(run.stageId).tower?stageName(run.stageId):(chapters[stageOf(run.stageId).chapterId]??'전역').replace(/ \(.*/,'')+' · '+stageName(run.stageId))+(run.difficulty==='hard'?' · 어려움':'')}</h2><span>${run.mode==='arena'?escapeHtml(run.match.opponent.name)+' · 상대 군략 '+strategyNames[opponentStrategy(run.match)]:`${run.round} / ${roundCount(run.stageId)} 라운드`}</span></div><div class="battle-header-tools">${fighting?`<button id="battle-header-pause" aria-label="${paused?'전투 계속':'일시 정지'}">${paused?'▶':'Ⅱ'}</button>`:''}<button id="battle-help" aria-label="전투 규칙">⚙</button></div></header>
  <div class="battle-status pixel-frame">${fighting?`<span>남은 시간 <b class="battle-timer">${timer}</b></span><strong>아군 ${living.filter(u=>u.side===0).length} / 적군 ${living.filter(u=>u.side===1).length}</strong>`:`<span>◈ 은화 <b>${run.silver}</b></span><span>출전 <b>${run.units.filter(u=>u.y>=0).length} / ${run.capacity}</b>${!result?`<button id="battle-capacity" aria-label="출전 인원 확장" title="은화 ${[4,6,8][run.capacity-3]??0}" ${run.mode==='arena'||run.capacity===6?'disabled':''}>＋</button>`:''}</span><strong class="battle-state">${result?({win:'승리',loss:'패배',draw:'무승부'}[run.outcome]):'전투 준비'}</strong>`}</div>
  <div class="battle-field"><div class="battle-board"><div class="battle-grid">${Array.from({length:64},(_,i)=>{const x=i%8,y=7-Math.floor(i/8);const wall=run.mode!=='arena'&&isBlocked(run.stageId,x,y,run.difficulty),hot=run.mode!=='arena'&&(run.battle?.hazard??stageOf(run.stageId).hazard)?.cells.some(c=>c.x===x&&c.y===y);return `<button class="battle-cell ${y<4?'friendly':''} ${wall?'blocked':''} ${hot?'hazard':''}" data-x="${x}" data-y="${y}" aria-label="${wall?'지나갈 수 없는 칸':y<4?'아군':'적'} ${x+1},${y+1}" ${wall?'disabled':''}></button>`;}).join('')}</div><div class="battle-units">${units.filter(u=>u.y>=0).filter(u=>{if(u.hp!==0)return true;const died=run.battle?.log.findLast(e=>e.type==='death'&&e.target===u.id);return fighting&&died&&run.battle.tick-died.tick<12;}).map(u=>{const p=screenPosition(u,run.battle,run.profile.reducedMotion),died=run.battle?.log.findLast(e=>e.type==='death'&&e.target===u.id);return `<div class="battle-position" data-entity="${u.id}" style="left:${p.left}%;top:${p.top}%;z-index:${Math.round((7-p.y)*10)+10};${u.hp===0?`opacity:${Math.max(0,1-(run.battle.tick-died.tick)/12)};`:''}">${tile(u)}</div>`;}).join('')}
  ${fighting?run.battle.units.filter(u=>u.action?.skill&&u.action.center&&['35','77','boss','zhangjue'].includes(u.skill)).map(u=>`<div class="skill-zone" style="width:${(u.skillParams?.radius??1.5)*25}%;height:${(u.skillParams?.radius??1.5)*25}%;left:${(u.action.center.x+.5)*12.5}%;top:${(7-u.action.center.y+.5)*12.5}%"></div>`).join(''):''}
  ${fighting?run.battle.events.filter(e=>e.projectile).map(e=>{const t=run.battle.units.find(u=>u.id===e.target);if(!t)return '';return `<span class="battle-projectile ${e.skill?'skill-arrow':''}" style="left:${(e.px+.5)*12.5}%;top:${(7-e.py+.38)*12.5}%;rotate:${Math.atan2(-(t.y-e.py),t.x-e.px)}rad"></span>`;}).join(''):''}${fighting?battleEffects(run.battle):''}</div></div></div>
  ${!fighting&&!result?`<div class="battle-hint pixel-frame" role="status">${error||'같은 장수 · 같은 등급 2명 → 합성'}</div><section class="bench-panel pixel-frame"><div class="bench-heading"><span>대기 ${run.units.filter(u=>u.y<0).length} / 8</span><div class="battle-equipment">${run.gear.map((g,i)=>`<button data-gear="${i}" title="선택 장수에게 ${gearNames[g.type]} 장착">${gearNames[g.type]}${ranks[g.rank]}</button>`).join('')}</div><button id="battle-sell" class="battle-button" ${run.mode==='arena'?'disabled':''}>◈ 판매</button></div><div class="battle-bench">${Array.from({length:8},(_,x)=>`<button class="bench-cell" data-x="${x}" data-y="-1" aria-label="대기칸 ${x+1}">${run.units.find(u=>u.y===-1&&u.x===x)?tile(run.units.find(u=>u.y===-1&&u.x===x)):''}</button>`).join('')}</div></section><div class="battle-controls prepare-actions"><button class="battle-button" id="battle-summon" ${run.mode==='arena'?'disabled':''}><strong>◈ 소환</strong><small>은화 3</small></button><button class="battle-button primary" id="battle-start">전투 시작</button></div><button type="button" class="battle-bonds pixel-frame" id="battle-bonds" aria-label="세력 시너지와 인연 상세">인연 <span>│</span> ${bonds}</button>`:''}
  ${fighting?`<div class="battle-hint live-hint" role="status">${error}</div><div class="battle-controls speed-panel pixel-frame"><span>배속</span><div class="battle-speed-options" aria-label="전투 배속">${[1,2,3].map(n=>`<button class="battle-button ${speed===n?'speed-active':''}" data-speed="${n}" aria-pressed="${speed===n}">${n}×</button>`).join('')}</div><button class="battle-button stats-button" id="battle-stats">▥ 통계</button></div><div class="battle-detail pixel-frame">${chosen?`<img class="combat-portrait" data-hero="${chosen.hero}" src="${heroes.find(h=>h.id===chosen.hero)?.portrait??(chosen.unit===undefined?enemyImage(chosen.hero,true):'assets/battle/unit'+Number(chosen.unit)+'/MOV-7.png')}" alt=""><div class="combat-vitals"><strong>${escapeHtml(name)} · 합성 ${chosen.rank}단계</strong><span class="combat-vital hp">체력 <i><b style="width:${chosen.hp/chosen.maxHp*100}%"></b></i><em>${Math.ceil(chosen.hp)} / ${chosen.maxHp}</em></span><span class="combat-vital mp">마나 <i><b style="width:${chosen.mana/(chosen.maxMana||1)*100}%"></b></i><em>${Math.floor(chosen.mana)} / ${chosen.maxMana}</em></span></div><div class="combat-skill"><span class="skill-emblem" aria-hidden="true">${skillIcon(chosen.hero)}</span><div><strong>${specs[chosen.hero]?.skill??'황건 전법'}</strong><small>자동 발동</small></div></div>`:''}</div><p class="battle-auto pixel-frame">${paused?'Ⅱ 일시 정지':'⚔ 자동 전투 중'}</p>`:''}
  ${result?`<section class="battle-result pixel-frame"><h3>${{win:'승리',loss:'패배',draw:'무승부'}[run.outcome]}</h3><p>${run.receipt?`골드 +${run.receipt.gold}${run.receipt.diamonds?` · 무료 다이아 +${run.receipt.diamonds}`:''}${run.receipt.hero?` · ${heroes.find(h=>h.id===run.receipt.hero)?.name} 합류`:''}${run.receipt.merit?` · 군공 +${run.receipt.merit}`:''}${run.receipt.extra?' · '+Object.entries(run.receipt.extra).map(([k,v])=>({heroTokens:'장수 재료',treasureTokens:'보물 재료',sShards:'S 선택 조각'}[k]??k)+' +'+v).join(' · '):''}${run.mode==='arena'?` · 점수 ${run.receipt.score>=0?'+':''}${run.receipt.score}`:''}`:run.outcome==='win'&&run.round<roundCount(run.stageId)?`다음 준비 은화 +${roundRule(run.round,run.stageId).victorySilver}${!run.tutorial&&roundRule(run.round,run.stageId).equipment?' · 장비 획득':''}`:'재도전 시 전투 직전 배치를 복구합니다.'}</p><div class="battle-controls">${run.mode==='campaign'&&run.outcome==='win'&&run.round<roundCount(run.stageId)?'<button class="battle-button primary" id="battle-next">다음 라운드</button>':`${run.mode==='campaign'&&run.outcome==='loss'&&run.retries<2?`<button class="battle-button primary" id="battle-retry">재도전 ${2-run.retries}회</button>`:''}<button class="battle-button" id="battle-return">돌아가기</button>`}<button class="battle-button" id="battle-stats">전투 기록</button></div></section>`:''}`;
  if(fighting&&root.dataset.phase==='fighting'){
   const draft=document.createElement('template');draft.innerHTML=markup;
   const liveUnits=root.querySelector('.battle-units'),nextUnits=draft.content.querySelector('.battle-units');
   for(const next of nextUnits.querySelectorAll('[data-approved-motion]')){
    const id=next.closest('[data-entity]').dataset.entity;
    const live=liveUnits.querySelector(`[data-entity="${id}"] [data-approved-motion]`);
    if(!live)continue;
    live.dataset.motionFrame=next.dataset.motionFrame;
    live.dataset.approvedMotion=next.dataset.approvedMotion;
    live.style.cssText=next.style.cssText;
    next.replaceWith(live);
   }
   liveUnits.replaceChildren(...nextUnits.children);
   for(const selector of ['.battle-status','.battle-detail','.battle-hint','.battle-auto'])root.querySelector(selector).innerHTML=draft.content.querySelector(selector).innerHTML;
   root.querySelector('#battle-header-pause').textContent=paused?'▶':'Ⅱ';root.querySelector('#battle-header-pause').setAttribute('aria-label',paused?'전투 계속':'일시 정지');
   root.querySelectorAll('[data-speed]').forEach(b=>{b.classList.toggle('speed-active',Number(b.dataset.speed)===speed);b.setAttribute('aria-pressed',String(Number(b.dataset.speed)===speed));});
  }else root.innerHTML=markup;
  root.dataset.phase=run.phase;
  paintApprovedMotions(root);
  skinBattle(root,run,[...tiers.map(([f,v])=>f+' '+[2,4,6][v.tier-1]),...linked.map(a=>a.bond.name)].join(' · ')||'없음',selected);
 const bind=(id,fn)=>{const el=root.querySelector('#'+id);if(el)el.onclick=fn;};
 const synergyButton=root.querySelector('#battle-bonds');if(synergyButton&&synergyButton.tagName!=='BUTTON')synergyButton.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();synergyButton.click();}};
 bind('tutorial-confirm',async()=>{if(run.tutorial.step===5){if(!run.battle.log.some(e=>e.type==='skill'&&e.hero===run.deck[0]))return;act(r=>({...r,tutorial:{...r.tutorial,skillSeen:true}}));paused=false;}else if(run.tutorial.step===12){await act(r=>({...r,tutorial:{...r.tutorial,step:13}}));if(run?.tutorial?.step===13)showStats(true);}});
 bind('battle-bonds',()=>dialog.open('세력 시너지와 인연',(tiers.map(([f,v])=>`<p><strong>${synergyLabel(f,v.tier)}</strong><br><small>배치한 ${f} 장수 ${v.count}명</small></p>`).join('')+linked.map(a=>`<p><strong>${a.bond.name}</strong><br><small>${a.present.map(id=>heroes.find(h=>h.id===id).name).join(' · ')} · ${a.bond.text}</small></p>`).join(''))||'<p>지금 배치로 발동하는 세력 시너지나 인연이 없습니다. 같은 세력 장수를 2명 이상 배치하면 시너지가 생깁니다.</p>'));
 bind('battle-exit',abandon);bind('battle-help',()=>{paused=true;dialog.open('전투 규칙','<p>장수를 소환하고 아래 네 줄에 배치하세요. 같은 장수와 등급을 겹치면 합성됩니다. 최대 합성 5단계입니다.</p><p>일반 공격 마나 +15, 피격 +5. 마나가 가득 차면 전법을 자동 사용합니다. 제한 시간은 90초입니다.</p><p>전역 첫 승리 '+stageReward(run.stageId).firstClearGold+'골드, 이후 하루 '+stageReward(run.stageId).dailyRepeatLimit+'회 '+stageReward(run.stageId).repeatGold+'골드. 공정 대전은 하루 '+arenaRules.dailyLimit+'회 승리 '+arenaRules.winGold+', 패배·무승부 '+arenaRules.otherGold+'골드.</p>');});
 bind('battle-summon',()=>act(r=>prepareCommand(r.tutorial?.step===1?{...r,tutorial:{...r.tutorial,step:2}}:r,{type:'summon'})));bind('battle-capacity',()=>dialog.confirm('출전 인원 확장',`은화 ${[4,6,8][run.capacity-3]}를 사용해 출전 인원을 ${run.capacity+1}명으로 늘립니다.`,'확장',()=>{act(r=>prepareCommand(r,{type:'capacity'}));dialog.dismiss();}));bind('battle-sell',()=>act(r=>prepareCommand(r,{type:'sell',id:selected})));bind('battle-start',()=>{paused=false;acc=0;act(startRound);});bind('battle-next',advanceRound);bind('battle-retry',()=>act(retryRound));bind('battle-return',async()=>{if(!run.receipt){try{await store.update(s=>settle(s,run));}catch(e){error=e.message;render();return;}}closeRun();});bind('battle-header-pause',()=>{paused=!paused;render();});root.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>{speed=Number(b.dataset.speed);render();});
 bind('battle-stats',()=>showStats());
 root.querySelectorAll('[data-gear]').forEach(el=>el.onclick=()=>act(r=>prepareCommand(r,{type:'equip',id:selected,index:Number(el.dataset.gear)})));
 root.querySelectorAll('[data-unit]').forEach(el=>{el.onpointerdown=e=>{if(run.phase==='fighting'){selected=Number(el.dataset.unit);return;}drag={id:Number(el.dataset.unit),x:e.clientX,y:e.clientY};};el.onclick=e=>{if(run.phase!=='prepare'){selected=Number(el.dataset.unit);render();}else if(el.closest('.battle-position')){e.stopPropagation();const u=units.find(u=>u.id===Number(el.dataset.unit));choose(u.x,u.y);}};});
 root.querySelectorAll('[data-x]').forEach(el=>el.onclick=()=>choose(Number(el.dataset.x),Number(el.dataset.y)));
 }
 async function choose(x,y){const u=run.units.find(u=>u.x===x&&u.y===y);if(run.phase!=='prepare')return;if(selected!==null&&selected!==u?.id){await act(r=>prepareCommand(r,{type:'move',id:selected,x,y}));selected=null;render();}else{selected=selected===u?.id?null:u?.id??null;render();}}
 root.addEventListener('pointerup',async e=>{if(!drag||run.phase!=='prepare')return;const d=drag;drag=null;if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<8)return;const rect=root.querySelector('.battle-grid').getBoundingClientRect();let x,y;if(e.clientY>=rect.top&&e.clientY<rect.bottom&&e.clientX>=rect.left&&e.clientX<rect.right){x=Math.floor((e.clientX-rect.left)/rect.width*8);y=7-Math.floor((e.clientY-rect.top)/rect.height*8);}else{const cell=document.elementFromPoint(e.clientX,e.clientY)?.closest('.bench-cell');if(!cell)return;x=Number(cell.dataset.x);y=-1;}selected=d.id;await act(r=>prepareCommand(r,{type:'move',id:d.id,x,y}));selected=null;e.preventDefault();});
 async function loop(now){frame=requestAnimationFrame(loop);if(!run||root.hidden){cutin.clear();return;}const dt=last?Math.min(now-last,250):0;last=now;if(loading||committing||run.phase!=='fighting'||paused||document.querySelector('#modal').open)return;acc+=dt*speed;let stepped=false;while(acc>=50&&!run.battle.result){if(cutin.beforeStep(run.battle,now)){acc=0;break;}stepBattle(run.battle);acc-=50;stepped=true;}audio.play(run.battle);if(run.battle.result){committing=true;run=finishRound(run);try{if(run.mode==='arena'||run.outcome==='win'&&run.round===roundCount(run.stageId)){await store.update(s=>settle(s,run));run=store.get().battleRun;}else await persist();}catch(e){paused=true;error=e.message;}finally{committing=false;}render();}else if(stepped){if(run.battle.tick-(run.checkpointTick??0)>=20){run.checkpointTick=run.battle.tick;committing=true;await persist();committing=false;}render();}}
 window.addEventListener('pagehide',()=>{if(run)persist();});
 return {open,async tutorial(){if(store.get().battleRun){dialog.open('진행 중인 출정','<p>현재 출정을 마친 뒤 기초 훈련을 시작하세요.</p>');return;}await store.update(s=>({...s,battleRun:newTutorial(s,1,crypto.randomUUID(),Date.now())}));await open();},resume(){if(store.get().battleRun)return open();}};
}

