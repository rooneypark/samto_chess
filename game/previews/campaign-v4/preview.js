import {landmarkArtwork} from './landmarks.js';
import {placeArtwork,uiComponentsReady} from '../../art-controls.js';
import {artworkShell} from '../../ui-shell.js';
import {nineSlice} from '../../nine-slice.js';
import {stages,stageOrder,stageName,stageStatus} from '../../stages.js';
const game=document.querySelector('.game');
// Fixture belongs only to this standalone design preview. No player store is imported.
const fixture={services:{lord:{xp:2520}},campaign:{cleared:true,stages:{yellow_02:{cleared:true}}}};
const ids=stageOrder.slice(0,9),positions=[[52,419],[350,419],[648,419],[648,624],[350,624],[52,624],[52,829],[350,829],[648,829]];
const previewChapter=Math.max(1,Math.min(3,Number(new URLSearchParams(location.search).get('chapter'))||1));
if(previewChapter>1){fixture.services.lord.xp=3150;for(const id of ids.slice(1,(previewChapter-1)*3+2))fixture.campaign.stages[id]={cleared:true};}
artworkShell(game,{screen:'home',title:'전역',progress:{gold:12450,diamonds:320}});
game.querySelectorAll('[data-box]').forEach(el=>placeArtwork(el,el.dataset.box.split(',').map(Number)));
const painting=[...game.querySelectorAll('[data-tone]')].map(el=>nineSlice(el,el.dataset.tone));
game.querySelectorAll('[data-frame]').forEach(el=>painting.push(nineSlice(el,el.dataset.frame,{button:false,center:!el.closest('.campaign-map')})));
const chapterAssets=['yellow-camp','sishui-wall','hulao-gate'];
for(const [i,id] of ids.entries()){
 const status=stageStatus(fixture,id),asset=chapterAssets[Math.floor(i/3)],card=document.createElement('article');card.className='stage-card';card.dataset.stageCard=id;card.dataset.status=status;card.dataset.asset=asset;
 const button=document.createElement('button');button.className='stage-node';button.dataset.stage=id;button.dataset.status=status;button.setAttribute('aria-pressed','false');button.textContent=stageName(id);button.setAttribute('aria-label',stageName(id)+' · '+({cleared:'클리어',open:'도전 가능',locked:'잠김'})[status]);
 const icon=document.createElement('button');icon.className='landmark-art art-control art-painted';icon.setAttribute('aria-label',stageName(id)+' 전투지 · '+({cleared:'클리어',open:'도전 가능',locked:'잠김'})[status]);icon.dataset.artButton='landmark-'+asset;icon.dataset.artState=status==='cleared'?'cleared':'standing';
 card.append(icon,button);if(status==='locked')card.insertAdjacentHTML('beforeend','<svg class="lock-badge" viewBox="0 0 32 38" aria-hidden="true"><path d="M8 16V10a8 8 0 0 1 16 0v6" fill="none" stroke="#fff0c6" stroke-width="4"/><rect x="3" y="15" width="26" height="20" rx="2" fill="#26374b" stroke="#e7c88b" stroke-width="2"/><path d="M16 22v6" stroke="#ffe7b4" stroke-width="3"/></svg>');
 game.querySelector('.stage-nodes').append(card);placeArtwork(card,[...positions[i],240,160]);painting.push(nineSlice(button,'blue'),landmarkArtwork(asset,status==='cleared').then(url=>icon.style.setProperty('--art-image',`url("${url}")`)));button.addEventListener('click',()=>selectStage(id));icon.addEventListener('click',()=>selectStage(id));
}
let selected=ids[(previewChapter-1)*3+2];
async function selectStage(id){
 selected=id;const stage=stages[id],status=stageStatus(fixture,id),reward=stage.reward,locked=status==='locked';
 const paints=[];
 for(const b of game.querySelectorAll('[data-stage]')){const active=b.dataset.stage===id;b.setAttribute('aria-pressed',String(active));b.closest('.stage-card').dataset.selected=String(active);paints.push(nineSlice(b,active?'green':'blue'));}
 for(const b of game.querySelectorAll('[data-chapter]')){const active=(id.startsWith('yellow')?'yellow':'dong')===b.dataset.chapter;b.setAttribute('aria-pressed',String(active));paints.push(nineSlice(b,active?'green':'blue'));}
 game.querySelector('#stage-title').textContent=stageName(id);
 game.querySelector('.rounds').textContent=stage.rounds.length+' 라운드';
 const condition=game.querySelector('#stage-condition');condition.classList.toggle('locked',locked);
 condition.textContent=locked?'해금: '+(stage.requires??[]).map(stageName).join(' · ')+' 클리어'+(stage.lordLevel?' · 군주 Lv.'+stage.lordLevel:''):status==='cleared'?'✓ 클리어 완료 · 반복 도전 가능':'◆ 도전 가능 · 최초 승리 보상을 획득하세요';
 game.querySelector('#reward-label').textContent=status==='cleared'?'최초 보상 · 수령 완료':'최초 클리어';
 game.querySelector('#first-reward').innerHTML=`<img src="assets/shop-v2/coin.png" alt="골드">${reward.firstClearGold}<img class="gem" src="assets/shop-v2/gem.png" alt="다이아">${reward.firstClearDiamonds}`;
 const extras=[];if(reward.extra?.heroTokens)extras.push('등용패 '+reward.extra.heroTokens);if(reward.extra?.treasureTokens)extras.push('보물 토큰 '+reward.extra.treasureTokens);if(stage.grantsHero)extras.push((stage.grantsHero==='huaxiong'?'화웅':'동탁')+' 등용');
 game.querySelector('#extra-reward').textContent=extras.length?'추가 보상 · '+extras.join(' / '):'최초 보상은 1회 지급';
 game.querySelector('#repeat-reward').textContent='반복 골드 '+reward.repeatGold+' · 하루 '+reward.dailyRepeatLimit+'회';
 const depart=game.querySelector('#depart');depart.disabled=locked;depart.querySelector('strong').textContent=locked?'전역 잠김':'출정 준비';depart.querySelector('small').textContent=locked?'위 해금 조건을 달성하세요':'도전 비용 없음';paints.push(nineSlice(depart,locked?'blue':'green'));
 await Promise.all(paints);
}
game.querySelectorAll('[data-chapter]').forEach(b=>b.addEventListener('click',()=>selectStage(b.dataset.chapter==='yellow'?'yellow_03':'sishui_01')));
const toast=document.querySelector('.preview-status');let timer;
function message(text){clearTimeout(timer);toast.textContent=text;toast.hidden=false;timer=setTimeout(()=>toast.hidden=true,3300);}
game.querySelectorAll('button:not([data-stage]):not([data-chapter]):not(.landmark-art)').forEach(b=>b.addEventListener('click',()=>message(b.dataset.note??(b.id==='depart'?stageName(selected)+' 출정 준비 시안입니다. 실제 전투는 시작하지 않습니다.':'전역 선택 디자인 시안입니다. 실제 저장은 변경하지 않습니다.'))));
if(previewChapter>1){
 game.querySelector('[data-chapter=yellow] small').textContent='3 / 3';game.querySelector('[data-chapter=dong] small').textContent=((previewChapter-2)*3+2)+' / 6';
 game.querySelector('.chapter-label span').textContent='황건 진압 · 3 / 3';game.querySelector('.reset-note').textContent='진군 경로에서 전투를 선택하세요 · 군주 Lv.10 예시';
 game.querySelector('.clear-route').setAttribute('d',previewChapter===2?'M172 490 H768 V695 H172':'M172 490 H768 V695 H172 V900 H768');
}
const background=new Image();background.src='assets/campaign-v4/map.png';
await Promise.all([uiComponentsReady,...painting]);await selectStage(selected);
await Promise.all([background.decode(),...Array.from(document.images,i=>i.decode()),document.fonts.ready]);game.inert=false;game.setAttribute('aria-busy','false');
