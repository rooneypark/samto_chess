import {artworkShell} from './ui-shell.js';
import {placeArtwork,uiComponentsReady} from './art-controls.js';
import {paintArtworkLayout} from './art-layout.js';
import {createArtworkScreen,paintArtworkSelection} from './artwork-screen.js';
import {nineSlice,disposeNineSlices} from './nine-slice.js';
import {towerStages,TOWER_FLOORS,stageUnlocked,stageCleared} from './stages.js';
import {towerFloorIds,constraintText,towerDeck} from './tower.js';
import {towerTemplate} from './tower-template.js';
export function initTower({host,store,navigate,toast,onWallet,startBattle}){
const game=createArtworkScreen({host,className:'tower-runtime',label:'연무탑',template:towerTemplate,navigate,onWallet}),$=s=>game.querySelector(s);
let range=0,selected=1,revision=0,busy=false;
const ready=Promise.all([uiComponentsReady,paintArtworkLayout(game)]);
const floor=n=>towerStages[towerFloorIds[n-1]];
function position(i){const row=Math.floor(i/2),col=row%2?1-i%2:i%2;return [col?490:50,926-row*104,401,88];}
const rewardText=r=>'골드 '+r.firstClearGold+(r.firstClearDiamonds?' · 다이아 '+r.firstClearDiamonds:'')+(r.extra?.heroTokens?' · 장수 재료 '+r.extra.heroTokens:'')+(r.extra?.sShards?' · S 선택 조각 '+r.extra.sShards:'');
async function render(){const token=++revision;await ready;if(game.hidden||token!==revision)return;const state=store.get(),cleared=towerFloorIds.filter(id=>stageCleared(state,id)).length;
artworkShell(game,{screen:'home',title:'연무탑',progress:state,controlsRoot:game});const progress=document.createElement('b');progress.textContent=cleared+' / 30층';$('.summary-title').replaceChildren('최고 기록 ',progress);$('.summary-side').textContent=cleared===30?'모든 층 클리어':'다음 도전 · '+(cleared+1)+'층';game.inert=true;game.setAttribute('aria-busy','true');const painting=[];
for(const b of game.querySelectorAll('[data-range]'))painting.push(paintArtworkSelection(b,Number(b.dataset.range)===range));
const list=$('.floor-list');disposeNineSlices(list);list.replaceChildren();const points=[];
for(let i=0;i<10;i++){const n=range*10+i+1,[x,y,w,h]=position(i),b=document.createElement('button');b.className='floor-button'+(stageCleared(state,towerFloorIds[n-1])?' cleared':!stageUnlocked(state,towerFloorIds[n-1])?' locked':'')+(n%5===0?' boss':'');b.dataset.floor=n;b.setAttribute('aria-label',n+'층 · '+(stageCleared(state,towerFloorIds[n-1])?'클리어':stageUnlocked(state,towerFloorIds[n-1])?'도전 가능':'잠금'));const title=document.createElement('strong');title.textContent=String(n).padStart(2,'0')+'층'+(n%5===0?' · 장수':'');const status=document.createElement('small');status.textContent=stageCleared(state,towerFloorIds[n-1])?'✓ 클리어':stageUnlocked(state,towerFloorIds[n-1])?'◆ 도전 가능':'잠금';b.append(title,status);placeArtwork(b,[x,y,w,h]);b.onclick=()=>{selected=n;draw();};list.append(b);points.push([x+w/2,y+h/2]);painting.push(paintArtworkSelection(b,n===selected));}
const path=ps=>ps.map(([x,y],i)=>(i?'L':'M')+x+' '+y).join(' ');$('.future-route').setAttribute('d',path(points));$('.cleared-route').setAttribute('d',path(points.slice(0,Math.max(0,cleared-range*10))));
const f=floor(selected),locked=!stageUnlocked(state,towerFloorIds[selected-1]),done=stageCleared(state,towerFloorIds[selected-1]),deck=towerDeck(state,f);$('.detail-title').textContent=f.name+(selected%5===0?' · 장수 전투':'');$('.detail-status').textContent=done?'클리어':locked?'잠금':'도전 가능';$('.detail-condition').textContent='도전 조건 · '+constraintText(f.constraint);$('.detail-preparation').textContent=f.rounds.length+'라운드 · 시작 은화 '+f.startSilver+' · 조건에 맞는 장수 '+deck.length+'명';$('.detail-reward').textContent=(done?'지급 완료 · ':'최초 보상 · ')+rewardText(f.reward);
const milestone=floor(Math.min(TOWER_FLOORS,Math.ceil(selected/5)*5));$('.milestone').textContent=milestone.floor+'층 장수 관문 · '+rewardText(milestone.reward);$('.challenge').disabled=locked||!deck.length;$('.challenge').textContent=locked?'이전 층 클리어 필요':!deck.length?'조건에 맞는 장수 없음':selected+'층 '+(done?'재도전':'도전 시작');painting.push(nineSlice($('.challenge'),$('.challenge').disabled?'blue':'green'));await Promise.all([...painting,document.fonts.ready]);if(token===revision&&!game.hidden){game.inert=false;game.setAttribute('aria-busy','false');}}
async function draw(){try{await render();}catch(e){game.inert=false;game.setAttribute('aria-busy','false');toast('연무탑을 표시하지 못했습니다. '+e.message);}}
game.querySelectorAll('[data-range]').forEach(b=>b.onclick=()=>{range=Number(b.dataset.range);selected=range*10+1;draw();});
$('.challenge').onclick=async()=>{if(busy||game.hidden)return;const s=store.get(),id=towerFloorIds[selected-1];if(!stageUnlocked(s,id)||!towerDeck(s,towerStages[id]).length){await draw();return;}busy=true;game.inert=true;try{await startBattle(id);}catch(e){toast(e.message);}finally{busy=false;if(!game.hidden)await draw();}};
store.subscribe(()=>{if(!game.hidden&&!busy)draw();});
return {show(visible){revision++;game.hidden=!visible;host.classList.toggle('tower-art',visible);if(visible){const s=store.get(),next=towerFloorIds.findIndex(id=>!stageCleared(s,id));selected=next<0?30:next+1;range=Math.floor((selected-1)/10);draw();}}};
}
