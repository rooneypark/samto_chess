import {treasureDefs} from './treasures.js';
import {placeArtwork} from './art-controls.js';
import {generalPortraitHolder} from './general-portrait-holder.js';
import {createArtworkResultCard,paintArtworkResultSelection} from './artwork-result-cards.js';
import {recruitResultsTemplate} from './recruit-results-template.js';
import {artworkScreenTemplate} from './artwork-screen-template.js';
import {artworkShell} from './ui-shell.js';
import {paintArtworkLayout} from './art-layout.js';
import {disposeNineSlices} from './nine-slice.js';
import {generalArtwork} from './general-art.js';
import {heroes} from './heroes.js';
import {specs} from './progression.js';
import {createArtworkScreen} from './artwork-screen.js';
export function initRecruitResultsScreen({host,store,navigate,toast,onWallet}){
const root=createArtworkScreen({host,sharedShell:true,className:'recruit-results-runtime',label:'장수 등용 결과',template:recruitResultsTemplate,navigate,onWallet}),$=s=>root.querySelector(s);
$('#barracks-back').id='shop-back';const ready=paintArtworkLayout(root,{stablePixels:true});let selected=0,revision=0,receipt=null,busy=false,cardsKey='';const revealed=new Set();

const treasurePositions={gold:'33.333% 100%',scroll:'66.667% 50%',helmet:'33.333% 0',gem:'66.667% 100%',banner:'100% 0',swords:'0 50%',gate:'66.667% 0'};
function treasureSymbol(def){const icon=document.createElement('i');icon.className='symbol';icon.style.backgroundPosition=treasurePositions[def.icon];return icon;}
function paintTreasureDetail(pending,index){const result=pending.results[index],def=treasureDefs.find(t=>t.id===result.id),count=pending.results.filter(r=>r.id===result.id).length;
 root.querySelector('[data-box="50,286,841,44"]').textContent=pending.results.length+(pending.type==='recruit'?'회 보물 모집 결과':'개 보물 획득 결과');$('.receipt-note').textContent='총 '+pending.results.length+'개 획득 · 같은 보물도 각각 보관됩니다.';
 $('.detail-title').textContent=def.name+' · '+def.grade;$('.result-status').textContent='1성 · 획득 당시 미장착 · 이번 모집 '+count+'개';$('.skill').textContent='능력치 · '+def.effect;$('.skill-text').textContent='보물함에서 장수에게 장착할 수 있습니다. 같은 보물은 별도 개체로 보관되며, 조건에 맞으면 강화 재료로 사용할 수 있습니다.';
 const emblem=document.createElement('div');emblem.className='treasure-emblem';emblem.append(treasureSymbol(def));$('.full-art').replaceChildren(emblem);placeArtwork(emblem,[50,944,270,270]);
}

async function render(){const token=++revision;await ready;if(root.hidden||busy||token!==revision)return;const pending=store.get().shop.pending;if(!pending||!['hero','treasure'].includes(pending.pool)){queueMicrotask(()=>navigate('shop'));return;}const treasure=pending.pool==='treasure';root.setAttribute('aria-label',treasure?'보물 획득 결과':'장수 등용 결과');root.classList.toggle('treasure-result',treasure);$('.home-back').textContent=treasure?'보물함으로':'병영으로';selected=Math.min(selected,pending.results.length-1);receipt=pending.commandId;root.inert=true;root.setAttribute('aria-busy','true');artworkShell(root,{screen:'shop',title:treasure?'보물 획득':'등용 결과',progress:store.get(),controlsRoot:root});const nextCardsKey=JSON.stringify([pending.commandId,pending.results]);if(cardsKey!==nextCardsKey){disposeNineSlices($('.results'));$('.results').replaceChildren();
for(const [i,r]of pending.results.entries()){const id=r.id,h=treasure?treasureDefs.find(t=>t.id===id):heroes.find(h=>h.id===id);const b=createArtworkResultCard({index:i,gradeLabel:treasure?h.grade+' · 1성':specs[id].grade+' · '+h.faction,visual:treasure?treasureSymbol(h):generalPortraitHolder(h),name:h.name,status:treasure?'획득 +1':r.status==='new'?'신규 획득':r.status==='duplicate'?'카드 +1':'재료 +'+r.amount,statusClass:!treasure&&r.status==='new'?'new':''});$('.results').append(b);b.onclick=()=>{selected=i;draw()};}cardsKey=nextCardsKey;}

if(treasure){paintTreasureDetail(pending,selected);}else{root.querySelector('[data-box="50,286,841,44"]').textContent=pending.results.length+'명 획득 결과';$('.receipt-note').textContent='신규 획득 '+pending.results.filter(r=>r.status==='new').length+'명 · 중복 카드 '+pending.results.filter(r=>r.status==='duplicate').length+'장 · 장수 재료 '+pending.results.reduce((n,r)=>n+(r.status==='converted'?r.amount:0),0)+'개';const r=pending.results[selected],id=r.id,h=heroes.find(h=>h.id===id),spec=specs[id];$('.detail-title').textContent=h.name+' · '+h.faction+' · '+spec.grade;$('.result-status').textContent=r.status==='new'?'신규 획득 · 병영에서 편성할 수 있습니다.':r.status==='duplicate'?'보유 장수 · 각성 카드 1장 획득':'최대 각성 장수 · 장수 교환재료 '+r.amount+'개 획득';$('.skill').textContent='전법 · '+spec.skill;$('.skill-text').textContent=spec.description;$('.full-art').replaceChildren(await generalArtwork(id,{center:190,height:370,feet:1255,maxWidth:270}));}await paintArtworkResultSelection(root,selected);if(!treasure&&!revealed.has(pending.commandId)){revealed.add(pending.commandId);if(!store.get().reducedMotion){root.querySelectorAll('[data-result]').forEach((card,i)=>{card.style.setProperty('--reveal-delay',Math.min(i*70,560)+'ms');card.classList.add('recruit-reveal');card.addEventListener('animationend',()=>card.classList.remove('recruit-reveal'),{once:true});});}}await document.fonts.ready;if(token===revision&&!root.hidden){root.inert=false;root.setAttribute('aria-busy','false');}}

const draw=()=>render().catch(e=>{root.inert=false;root.setAttribute('aria-busy','false');toast('획득 결과를 표시하지 못했습니다. '+e.message)});
async function acknowledge(go){if(busy)return;busy=true;revision++;root.inert=true;root.setAttribute('aria-busy','true');const pending=store.get().shop.pending,item=pending?.results[selected],treasure=pending?.pool==='treasure',id=item?.id;try{await store.transact(s=>{if(s.shop.pending?.commandId!==receipt)throw Error('획득 결과가 변경되었습니다. 다시 확인해 주세요.');s.shop.pending=null;return s;});navigate(go?(treasure?'treasure':'barracks'):'shop',go?(treasure?{treasureId:item.instanceId}:id):undefined);}catch(e){toast('결과 확인을 저장하지 못했습니다. '+e.message);}finally{busy=false;if(!root.hidden)draw();}}
$('.save').onclick=()=>acknowledge(false);$('.home-back').onclick=()=>acknowledge(true);$('#shop-back').onclick=()=>acknowledge(false);
root.addEventListener('keydown',e=>{if(e.key==='Escape'&&!root.inert&&!document.querySelector('dialog[open]')){e.stopImmediatePropagation();acknowledge(false)}},true);
store.subscribe(()=>{if(!root.hidden&&!busy)draw()});return {show(visible){revision++;root.hidden=!visible;host.classList.toggle('recruit-results-art',visible);if(visible){selected=0;draw();}}};
}
