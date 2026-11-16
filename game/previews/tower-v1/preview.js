import {artworkShell,featuredGenerals} from '../../ui-shell.js';
import {placeArtwork,uiComponentsReady} from '../../art-controls.js';
import {paintArtworkLayout} from '../../art-layout.js';
import {paintArtworkSelection} from '../../artwork-screen.js';
import {nineSlice,disposeNineSlices} from '../../nine-slice.js';
import {towerStages,TOWER_FLOORS} from '../../stages.js';
import {towerFloorIds,constraintText,towerDeck} from '../../tower.js';
// Design-only progress. No profile reads, writes, combat, or rewards.
const game=document.querySelector('.game'),$=s=>game.querySelector(s),cleared=3;
const state={order:featuredGenerals,heroes:Object.fromEntries(featuredGenerals.map(id=>[id,{owned:true}]))};
let range=0,selected=4;
function note(text='연무탑 시안입니다. 실제 전투와 저장은 변경하지 않습니다.'){const e=document.querySelector('.preview-status');e.textContent=text;e.hidden=false;clearTimeout(note.timer);note.timer=setTimeout(()=>e.hidden=true,2400);}
artworkShell(game,{screen:'home',title:'연무탑',progress:{gold:12450,diamonds:320}});await Promise.all([uiComponentsReady,paintArtworkLayout(game)]);
const floor=n=>towerStages[towerFloorIds[n-1]];
function position(i){const row=Math.floor(i/2),col=row%2?1-i%2:i%2;return [col?490:50,926-row*104,401,88];}
const rewardText=r=>'골드 '+r.firstClearGold+(r.firstClearDiamonds?' · 다이아 '+r.firstClearDiamonds:'')+(r.extra?.heroTokens?' · 장수 재료 '+r.extra.heroTokens:'')+(r.extra?.sShards?' · S 선택 조각 '+r.extra.sShards:'');
async function render(){game.inert=true;game.setAttribute('aria-busy','true');const painting=[];
for(const b of game.querySelectorAll('[data-range]'))painting.push(paintArtworkSelection(b,Number(b.dataset.range)===range));
const list=$('.floor-list');disposeNineSlices(list);list.replaceChildren();const points=[];
for(let i=0;i<10;i++){const n=range*10+i+1,[x,y,w,h]=position(i),b=document.createElement('button');b.className='floor-button'+(n<=cleared?' cleared':n>cleared+1?' locked':'')+(n%5===0?' boss':'');b.dataset.floor=n;b.setAttribute('aria-label',n+'층 · '+(n<=cleared?'클리어':n===cleared+1?'도전 가능':'잠금'));const title=document.createElement('strong');title.textContent=String(n).padStart(2,'0')+'층'+(n%5===0?' · 장수':'');const status=document.createElement('small');status.textContent=n<=cleared?'✓ 클리어':n===cleared+1?'◆ 도전 가능':'잠금';b.append(title,status);placeArtwork(b,[x,y,w,h]);b.onclick=()=>{selected=n;render();};list.append(b);points.push([x+w/2,y+h/2]);painting.push(paintArtworkSelection(b,n===selected));}
const path=ps=>ps.map(([x,y],i)=>(i?'L':'M')+x+' '+y).join(' ');$('.future-route').setAttribute('d',path(points));$('.cleared-route').setAttribute('d',path(points.slice(0,Math.max(0,cleared-range*10))));
const f=floor(selected),locked=selected>cleared+1,done=selected<=cleared,deck=towerDeck(state,f);$('.detail-title').textContent=f.name+(selected%5===0?' · 장수 전투':'');$('.detail-status').textContent=done?'클리어':locked?'잠금':'도전 가능';$('.detail-condition').textContent='도전 조건 · '+constraintText(f.constraint);$('.detail-preparation').textContent=f.rounds.length+'라운드 · 시작 은화 '+f.startSilver+' · 조건에 맞는 장수 '+deck.length+'명';$('.detail-reward').textContent=(done?'지급 완료 · ':'최초 보상 · ')+rewardText(f.reward);
const milestone=floor(Math.min(TOWER_FLOORS,Math.ceil(selected/5)*5));$('.milestone').textContent=milestone.floor+'층 장수 관문 · '+rewardText(milestone.reward);$('.challenge').disabled=locked||!deck.length;$('.challenge').textContent=locked?'이전 층 클리어 필요':!deck.length?'조건에 맞는 장수 없음':selected+'층 '+(done?'재도전':'도전 시작');painting.push(nineSlice($('.challenge'),$('.challenge').disabled?'blue':'green'));await Promise.all([...painting,document.fonts.ready]);game.inert=false;game.setAttribute('aria-busy','false');}
game.querySelectorAll('[data-range]').forEach(b=>b.onclick=()=>{range=Number(b.dataset.range);selected=range===0?4:range*10+1;render();});$('.challenge').onclick=()=>note(selected+'층 도전 화면으로 연결할 예정입니다. 시안에서는 전투를 시작하지 않습니다.');game.querySelectorAll('.home-back,.bottom-nav button,.wallet button,#barracks-back').forEach(b=>b.onclick=()=>note());await render();
