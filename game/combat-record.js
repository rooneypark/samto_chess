import {combatRecordTemplate} from './combat-record-template.js';
import {combatRecordPage,recordMetrics,recordNumber} from './combat-record-model.js';
import {artworkShell} from './ui-shell.js';
import {placeArtwork,uiComponentsReady} from './art-controls.js';
import {paintArtworkLayout} from './art-layout.js';
import {generalArtwork} from './general-art.js';
import {nineSlice,disposeNineSlices} from './nine-slice.js';
import {heroes} from './heroes.js';
import {enemyImage,roundCount} from './battle-data.js';
import {stageName,stageOf} from './stages.js';

export function createCombatRecord({game,onError}){
 const root=document.createElement('section');root.className='combat-record-v1';root.hidden=true;root.setAttribute('aria-label','전투 기록');game.append(root);
 const $=s=>root.querySelector(s);
 let context=null,battle=null,side=0,metric='damage',selected=null,page=0,revision=0;
 function close({notify=true}={}){
  if(root.hidden)return;const previous=context;context=null;revision++;disposeNineSlices(root);root.hidden=true;root.inert=false;root.replaceChildren();
  if(notify)previous?.onClose();
 }
 async function draw(focusSelector){
  const token=++revision;root.inert=true;root.setAttribute('aria-busy','true');
  try{
   const rows=$('.record-rows');disposeNineSlices(rows);rows.replaceChildren();
   const view=combatRecordPage(battle,{side,metric,page,selected});page=view.page;selected=view.chosen?.key??null;
   $('.summary-copy').textContent=(Number.isFinite(battle?.tick)?'전투 시간 '+(battle.tick/20).toFixed(1)+'초 · ':'')+(side?'적군':'아군')+' '+recordMetrics[metric]+' '+recordNumber(view.total)+(metric==='casts'?'회':'');
   $('.metric-heading').textContent=recordMetrics[metric]+' · '+(view.total?'기여 비중':'기록 없음');$('.metric-heading').hidden=view.pages>1;
   $('.record-pagination').hidden=view.pages<=1;$('.page-number').textContent=(page+1)+' / '+view.pages;
   $('#record-prev').disabled=page===0;$('#record-next').disabled=page===view.pages-1;
   $('.record-empty').hidden=view.units.length>0;
   const painting=[];
   root.querySelectorAll('[data-side]').forEach(b=>{const value=Number(b.dataset.side),active=value===side;b.querySelector('small').textContent=(battle?.units??[]).filter(u=>u.side===value).length+'명';b.setAttribute('aria-pressed',String(active));painting.push(nineSlice(b,active?'green':'blue'));});
   root.querySelectorAll('[data-metric]').forEach(b=>{const active=b.dataset.metric===metric;b.setAttribute('aria-pressed',String(active));painting.push(nineSlice(b,active?'green':'blue'));});
   if(view.pages>1)painting.push(nineSlice($('#record-prev'),'blue'),nineSlice($('#record-next'),'blue'));
   const images=view.visible.map(async(u,i)=>{
    const b=document.createElement('button');b.className='unit-record';b.dataset.unit=u.key;b.setAttribute('aria-pressed',String(u.key===selected));b.setAttribute('aria-label',u.name+' · '+recordMetrics[metric]+' '+recordNumber(u.value));
    placeArtwork(b,[40,675+i*102,861,98]);
    b.innerHTML='<span class="row-art"></span><span class="row-number"></span><strong class="row-name"></strong><small class="row-affiliation"></small><strong class="row-value"></strong><span class="row-share"></span><span class="record-bar"><i></i></span>';
    b.querySelector('.row-number').textContent=page*6+i+1;b.querySelector('.row-name').textContent=u.name;b.querySelector('.row-name').classList.toggle('long-name',u.name.length>4);
    const hero=heroes.find(h=>h.id===u.hero);b.querySelector('.row-affiliation').textContent=hero?(hero.faction+' · '+hero.role):context.run.mode!=='arena'&&stageOf(context.run.stageId).chapterId==='camp_yellow'?'황건군':'적군';
    const value=b.querySelector('.row-value');value.textContent=recordNumber(u.value)+(metric==='casts'?'회':'');value.classList.toggle('long-value',value.textContent.length>9);
    b.querySelector('.row-share').textContent=(view.total?u.value/view.total*100:0).toFixed(1)+'%';b.querySelector('.record-bar i').style.width=(view.total?u.value/view.total*100:0)+'%';
    b.onclick=()=>{selected=u.key;draw('.unit-record[aria-pressed=true]');};rows.append(b);painting.push(nineSlice(b,u.key===selected?'green':'blue'));
    let img=await generalArtwork(u.hero,{center:106,height:86,feet:90,maxWidth:90});
    if(img){img.style.left=parseFloat(img.style.left)*941/861+'%';img.style.width=parseFloat(img.style.width)*941/861+'%';img.style.top=parseFloat(img.style.top)*1672/98+'%';img.style.height=parseFloat(img.style.height)*1672/98+'%';}
    else{img=new Image();img.className='general-original';img.alt=u.name;const source=enemyImage(u.hero);if(!source)return;img.src=source;Object.assign(img.style,{left:'7%',top:'15%',width:'11%',height:'72%',objectFit:'contain'});await img.decode();}
    if(token===revision)b.querySelector('.row-art').append(img);
   });
   const u=view.chosen,detail=$('.selection-detail');detail.textContent=u?u.name+' · 피해 '+recordNumber(u.damage)+' · 치유 '+recordNumber(u.healing)+' · 전법 '+recordNumber(u.casts)+'회':'기록된 전투가 없습니다.';detail.classList.toggle('long-detail',detail.textContent.length>42);
   await Promise.all([...painting,...images,document.fonts.ready]);
   if(token===revision){root.inert=false;root.setAttribute('aria-busy','false');if(focusSelector)$(focusSelector)?.focus({preventScroll:true});}
  }catch(error){if(token===revision){close();onError(error);}}
 }
 async function open(options){
  close({notify:false});context=options;battle=options.previousRound?{units:structuredClone(options.run.lastStatistics??[]),tick:options.run.lastStatisticsTick}:structuredClone(options.run.battle);side=0;metric='damage';page=0;selected=null;
  root.hidden=false;root.inert=true;root.setAttribute('aria-busy','true');root.innerHTML=combatRecordTemplate;
  const {run,state,onNavigate,onWallet}=options,arena=run.mode==='arena',fighting=run.phase==='fighting';
  $('.scroll-heading').textContent=run.tutorial?'기초 훈련':arena?'군웅대전 · '+(run.match?.opponent.name??'상대'):stageName(run.stageId)+' · '+(run.difficulty==='hard'?'어려움':'일반');
  const outcome=$('.outcome');outcome.textContent=fighting?'전투 중':({win:'승리',loss:'패배',draw:'무승부'}[run.outcome]??'기록');outcome.dataset.outcome=run.outcome??'';outcome.classList.toggle('long-outcome',outcome.textContent.length>2);
  $('.summary-title').textContent=options.previousRound?'지난 라운드 · '+(run.round-1):arena?'공정 대전 · 1 / 1':(run.round===roundCount(run.stageId)?'최종 라운드':'라운드')+' · '+run.round+' / '+roundCount(run.stageId);
  artworkShell(root,{screen:arena?'arena':'home',title:'전투 기록',progress:state,controlsRoot:root});
  const back=$('#barracks-back');back.id='record-back';back.onclick=()=>close();$('#record-return').textContent=options.previousRound?'훈련으로 돌아가기':fighting?'전투로 돌아가기':'결과로 돌아가기';$('#record-return').onclick=()=>close();
  root.querySelectorAll('.bottom-nav button').forEach(b=>{b.setAttribute('aria-current',b.dataset.action===(arena?'arena':'home')?'page':'false');b.onclick=()=>onNavigate(b.dataset.action);});
  root.querySelectorAll('.wallet button').forEach((b,i)=>{b.setAttribute('aria-label',(i?'다이아 ':'골드 ')+state[i?'diamonds':'gold'].toLocaleString());b.onclick=onWallet;});
  root.querySelectorAll('[data-side]').forEach(b=>b.onclick=()=>{side=Number(b.dataset.side);selected=null;page=0;draw('[data-side="'+side+'"]');});
  root.querySelectorAll('[data-metric]').forEach(b=>b.onclick=()=>{metric=b.dataset.metric;selected=null;page=0;draw('[data-metric="'+metric+'"]');});
  $('#record-prev').onclick=()=>{page--;selected=null;draw('#record-next');};$('#record-next').onclick=()=>{page++;selected=null;draw('#record-prev');};
  const token=revision;try{await Promise.all([uiComponentsReady,paintArtworkLayout(root)]);if(context===options&&revision===token)await draw('#record-back');}catch(error){if(context===options){close();onError(error);}}
 }
 root.addEventListener('keydown',event=>{
  if(document.querySelector('dialog[open]'))return;
  if(event.key==='Escape'){event.preventDefault();close();}
  if(event.key==='Tab'){
   const buttons=[...root.querySelectorAll('button:not(:disabled)')].filter(b=>b.getClientRects().length),first=buttons[0],last=buttons.at(-1);
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }
 });
 return {open,close,get isOpen(){return !root.hidden;}};
}
