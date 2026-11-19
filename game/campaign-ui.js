import {artSet} from './art.js';
import {paintArtworkLayout} from './art-layout.js';
import {campaignTemplate} from './campaign-ui-template.js';
import {artworkShell} from './ui-shell.js';
import {artButton,placeArtwork,preloadArtwork} from './art-controls.js';
import {nineSlice,disposeNineSlices} from './nine-slice.js';
import {landmarkArtwork} from './campaign-landmarks.js';
import {stages,stageOrder,stageName,stageStatus,stageCleared,hardCleared,hardUnlocked,hardRules} from './stages.js';
import {lordLevel} from './services.js';
import {periods} from './economy.js';
import {playCampaignUnlocks} from './scene-motion-controller.js';
export const campaignArtwork=artSet==='a';
export const campaignReady=campaignArtwork?preloadArtwork(['assets/campaign-v4/map.png']):Promise.resolve();
export const campaignMapIds=stageOrder.slice(0,9);
const assets=['yellow-camp','sishui-wall','hulao-gate'],positions=[[52,419],[350,419],[648,419],[648,624],[350,624],[52,624],[52,829],[350,829],[648,829]];
const locks='<svg class="lock-badge" viewBox="0 0 32 38" aria-hidden="true"><path d="M8 16V10a8 8 0 0 1 16 0v6" fill="none" stroke="#fff0c6" stroke-width="4"/><rect x="3" y="15" width="26" height="20" rx="2" fill="#26374b" stroke="#e7c88b" stroke-width="2"/><path d="M16 22v6" stroke="#ffe7b4" stroke-width="3"/></svg>';
let revision=0;
export async function renderCampaignArtwork(root,{state,selected,difficulty,busy,onSelect,onDepart,onDifficulty,onCatalog,onHome}){
 const token=++revision;disposeNineSlices(root);root.inert=true;root.setAttribute('aria-busy','true');root.innerHTML=campaignTemplate;
 const $=s=>root.querySelector(s),hard=difficulty==='hard';
 artworkShell(root,{screen:'home',title:'전역',progress:state});
 $('#barracks-back').id='campaign-back';
 artButton($('#campaign-catalog'),'battle-bonds',{position:false,paint:true});
 const painting=[paintArtworkLayout(root,{hollow:'.campaign-map'})];
 const cleared=id=>hard?hardCleared(state,id):stageCleared(state,id);
 for(const [i,id] of campaignMapIds.entries()){
  const normalStatus=stageStatus(state,id),isLocked=normalStatus==='locked'||hard&&!hardUnlocked(state,id),status=isLocked?'locked':cleared(id)?'cleared':'open',active=id===selected,asset=assets[Math.floor(i/3)];
  const card=document.createElement('article');card.className='stage-card';Object.assign(card.dataset,{stageCard:id,status,asset,selected:String(active)});
  const icon=document.createElement('button');icon.className='landmark-art art-control art-painted';icon.setAttribute('aria-label',stageName(id)+' 전투지 · '+({cleared:'클리어',open:'도전 가능',locked:'잠김'})[status]);icon.dataset.artButton='landmark-'+asset;icon.dataset.artState=status==='cleared'?'cleared':'standing';
  Object.assign(icon.dataset,{stage:id,status});icon.setAttribute('aria-pressed',String(active));icon.title=stageName(id);
  card.append(icon);if(isLocked)card.insertAdjacentHTML('beforeend',locks);$('.stage-nodes').append(card);placeArtwork(card,[...positions[i],240,160]);
  painting.push(landmarkArtwork(asset,status==='cleared').then(url=>{if(token===revision)icon.style.setProperty('--art-image',`url("${url}")`);}));
  icon.onclick=()=>onSelect(id);
 }
 for(const tab of root.querySelectorAll('[data-chapter]')){
  const yellow=tab.dataset.chapter==='yellow',ids=campaignMapIds.slice(yellow?0:3,yellow?3:9),active=yellow===selected.startsWith('yellow');
  tab.querySelector('small').textContent=ids.filter(cleared).length+' / '+ids.length;tab.setAttribute('aria-pressed',String(active));painting.push(nineSlice(tab,active?'green':'blue'));
  tab.onclick=()=>onSelect(ids.find(id=>stageStatus(state,id)!=='locked'&&!cleared(id))??ids[0]);
 }
 $('.chapter-label span').textContent='황건 진압 · '+campaignMapIds.slice(0,3).filter(cleared).length+' / 3';
 const points=[[172,490],[470,490],[768,490],[768,695],[470,695],[172,695],[172,900],[470,900],[768,900]];let last=0;while(last<8&&cleared(campaignMapIds[last]))last++;
 $('.clear-route').setAttribute('d',last?points.slice(0,last+1).map(([x,y],i)=>(i?'L':'M')+x+' '+y).join(' '):'');
 const stage=stages[selected],reward=stage.reward,status=stageStatus(state,selected),locked=status==='locked'||hard&&!hardUnlocked(state,selected),done=cleared(selected),mult=hard?hardRules.gold:1;
 $('#campaign-stage-title').textContent=stageName(selected);$('.rounds').textContent=stage.rounds.length+' 라운드';
 const condition=$('#stage-condition');condition.classList.toggle('locked',locked);
 condition.textContent=locked?(status==='locked'?'해금: '+(stage.requires??[]).map(stageName).join(' · ')+' 클리어'+(stage.lordLevel?' · 군주 Lv.'+stage.lordLevel:''):'해금: 해당 장 전체 클리어 · 군주 Lv.12'):done?'✓ 클리어 완료 · 반복 도전 가능':'◆ 도전 가능 · 최초 승리 보상을 획득하세요';
 $('#reward-label').textContent=done?'최초 보상 · 수령 완료':'최초 클리어';
 $('#first-reward').innerHTML=`<img src="assets/shop-v2/coin.png" alt="골드">${Math.round(reward.firstClearGold*mult)}<img class="gem" src="assets/shop-v2/gem.png" alt="다이아">${reward.firstClearDiamonds??0}`;
 const extras=[];if(!hard){if(reward.extra?.heroTokens)extras.push('등용패 '+reward.extra.heroTokens);if(reward.extra?.treasureTokens)extras.push('보물 토큰 '+reward.extra.treasureTokens);if(stage.grantsHero)extras.push((stage.grantsHero==='huaxiong'?'화웅':'동탁')+' 등용');}
 $('#extra-reward').textContent=extras.length?'추가 보상 · '+extras.join(' / '):'최초 보상은 1회 지급';
 const used=state.campaign?.day===periods(Math.max(Date.now(),state.battleClock??0)).day?state.campaign.count??0:0,left=Math.max(0,reward.dailyRepeatLimit-used);
 $('#repeat-reward').textContent='반복 골드 '+Math.round(reward.repeatGold*mult)+' · '+(left===reward.dailyRepeatLimit?'하루 '+left+'회':'오늘 '+left+'회 남음');
 const depart=$('#campaign-depart');depart.disabled=locked||busy;depart.querySelector('strong').textContent=locked?'전역 잠김':state.battleRun?'진행 중 출정':'출정 준비';depart.querySelector('small').textContent=locked?'위 해금 조건을 달성하세요':state.battleRun?'저장된 전투를 이어갑니다':'도전 비용 없음';painting.push(nineSlice(depart,locked?'blue':'green'));depart.onclick=onDepart;
 $('#campaign-difficulty strong').textContent=hard?'어려움':'일반';$('#campaign-difficulty small').textContent=hard?'일반으로 변경':hardUnlocked(state,selected)?'어려움 · 도전 가능':'어려움 · 잠김';$('#campaign-difficulty').onclick=onDifficulty;
 $('#campaign-catalog').onclick=onCatalog;$('#campaign-back').onclick=onHome;
 $('.reset-note').textContent='진군 경로에서 전투를 선택하세요 · 군주 Lv.'+lordLevel(state).level;
 await Promise.all([campaignReady,...painting,...Array.from(root.querySelectorAll('img'),img=>img.decode())]);if(token===revision&&!root.hidden){root.inert=false;root.setAttribute('aria-busy','false');playCampaignUnlocks(root);}
}
