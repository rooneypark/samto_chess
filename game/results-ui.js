import {stageOf} from './stages.js';
import {resultsTemplate} from './results-ui-template.js';
import {resultView} from './results-model.js';
import {artworkShell} from './ui-shell.js';
import {contentBounds,paintArtworkLayout} from './art-layout.js';
import {generalArtwork,appendGeneralArtwork} from './general-art.js';
import {landmarkArtwork} from './campaign-landmarks.js';
import {disposeNineSlices} from './nine-slice.js';
import {roundCount} from './battle-data.js';

const revisions=new WeakMap();
export function clearResultsArtwork(root){revisions.set(root,(revisions.get(root)??0)+1);disposeNineSlices(root);root.classList.remove('results-v1','battle-result');root.inert=false;}
export async function renderResultsArtwork(root,{run,state,error,onNext,onRetry,onReturn,onNavigate,onStats,onSettle,onWallet}){
 const token=(revisions.get(root)??0)+1;revisions.set(root,token);disposeNineSlices(root);
 root.classList.remove('battle-v2','is-preparing','is-fighting');root.classList.add('results-v1','battle-result','is-result');
 root.dataset.phase='result';root.dataset.outcome=run.outcome;root.inert=true;root.setAttribute('aria-busy','true');root.innerHTML=resultsTemplate;
 const $=s=>root.querySelector(s),view=resultView(run,state);
 $('.scroll-heading').textContent=view.heading;$('.clear-badge span').textContent=view.badge;
 $('.victory-title').textContent={win:'전투 승리',loss:'패배',draw:'무승부'}[run.outcome];
 $('.round-summary').textContent=run.mode==='arena'?'대전 종료':run.round+' / '+roundCount(run.stageId)+' 라운드 '+(run.outcome==='win'?'완료':'종료');
 $('.section-title').textContent=view.interim?'라운드 보상':'획득 보상';
 $('.paid-label').textContent=view.receipt?'✓ 지급 완료':view.interim?'다음 준비에 반영':view.pending?'저장 대기':'추가 지급 없음';
 const prototype=$('.reward-item');root.querySelectorAll('.reward-item').forEach(el=>el.remove());
 // Normally three cards; unusual combined rewards remain visible and inspectable.
 const count=Math.max(3,view.cards.length),width=count>3?(837-(count-1)*18)/count:240;
 for(let i=0;i<count;i++){
  const card=prototype.cloneNode(true),item=view.cards[i];
  card.classList.toggle('compact',count>3);
  card.dataset.box=[52+i*(count>3?width+18:298),890,width,140].join(',');
  card.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  const img=card.querySelector('img');if(item?.icon)img.src='assets/shop-v2/'+item.icon+'.png';else img.remove();
  const strong=card.querySelector('strong');strong.textContent=item?.value??'—';strong.classList.toggle('long-value',(item?.value.length??0)>5||count>3);
  card.querySelector('small').textContent=item?.label??'추가 보상 없음';root.append(card);
 }
 $('.next-title').textContent=view.title;$('.next-condition').textContent=view.condition;
 if(!view.title&&!view.condition){
  for(const selector of ['.next-stage','.next-title','.next-condition'])$(selector).hidden=true;
  $('#battle-stats').dataset.box=`${contentBounds.left},1076,${contentBounds.width},78`;
 }
 if(!view.title&&view.condition)$('.next-condition').dataset.box='52,1111,837,48';
 const landmark=$('.next-landmark');if(!view.landmark){landmark.remove();$('.next-title').dataset.box='52,1093,837,42';if(view.title)$('.next-condition').dataset.box='52,1149,837,32';}
 const primary=$('#result-primary');primary.id=view.primaryId;primary.textContent=view.primaryLabel;primary.onclick=view.interim?onNext:view.retry?onRetry:onReturn;
 $('#result-home').onclick=()=>onNavigate('home');$('#battle-stats').onclick=onStats;
 artworkShell(root,{screen:run.mode==='arena'?'arena':'home',title:'전투 결과',progress:state,controlsRoot:root});
 const back=$('#barracks-back');back.id='battle-exit';back.onclick=()=>onNavigate(run.tutorial?'home':run.mode==='arena'?'arena':stageOf(run.stageId).tower?'tower':'campaign');
 root.querySelectorAll('.bottom-nav button').forEach(b=>{b.setAttribute('aria-current',b.dataset.action===(run.mode==='arena'?'arena':'home')?'page':'false');b.onclick=()=>onNavigate(b.dataset.action);});
 root.querySelectorAll('.wallet button').forEach((b,i)=>{b.setAttribute('aria-label',(i?'다이아 ':'골드 ')+state[i?'diamonds':'gold'].toLocaleString());b.onclick=onWallet;});
 const note=$('.reset-note');note.textContent=error?'저장 실패 · 여기를 눌러 다시 저장합니다.':view.pending?'보상 저장 대기 · 여기를 눌러 다시 저장합니다.':view.interim?'라운드 보상은 다음 준비에 반영됩니다.':'보상은 전투 종료 시 자동으로 지급됩니다.';
 if(error||view.pending){note.classList.add('result-error');note.setAttribute('role','button');note.tabIndex=0;note.onclick=onSettle;note.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSettle();}};}
 const painting=paintArtworkLayout(root);
 const order=run.deck.slice(0,6);$('.victory-generals').setAttribute('aria-label','실제 출전 편성');
 const images=order.map(async(id,i)=>{const img=await generalArtwork(id,{center:112+i*143,height:174,feet:747,maxWidth:143});if(img&&revisions.get(root)===token)appendGeneralArtwork($('.victory-generals'),img);});
 const background=new Image();background.src='assets/arena-v2/courtyard.png';
 try{
  await Promise.all([painting,background.decode(),...images,...Array.from(root.querySelectorAll('img:not(.next-landmark)'),img=>img.decode()),...(view.landmark?[landmarkArtwork(view.landmark).then(async url=>{landmark.src=url;landmark.alt=view.title;await landmark.decode();})]:[])]);
 }finally{if(revisions.get(root)===token){root.inert=false;root.setAttribute('aria-busy','false');}}
}
