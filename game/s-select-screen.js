import {generalPortraitHolder} from './general-portrait-holder.js';
import {createArtworkScreen} from './artwork-screen.js';
import {sSelectTemplate} from './s-select-template.js';
import {artworkScreenTemplate} from './artwork-screen-template.js';
import {artworkShell} from './ui-shell.js';
import {paintArtworkLayout} from './art-layout.js';
import {placeArtwork} from './art-controls.js';
import {nineSlice,disposeNineSlices} from './nine-slice.js';
import {generalArtwork} from './general-art.js';
import {poolEntries} from './economy.js';
import {specs} from './progression.js';
import {S_SELECT_COST,poolLocked} from './collection.js';
export function initSSelectScreen({host,store,navigate,onWallet,onSelect,toast}){
const root=createArtworkScreen({host,sharedShell:true,className:'s-select-runtime',label:'S 장수 선택',template:sSelectTemplate,navigate,onWallet}),$=s=>root.querySelector(s);let revision=0;
$('#barracks-back').id='shop-back';const ready=paintArtworkLayout(root,{stablePixels:true});
let list=poolEntries('hero').filter(h=>h.grade==='S'),page=0,selected=list[0].id;
async function render(){const token=++revision;await ready;if(root.hidden||token!==revision)return;const state=store.get(),owned=new Set(Object.keys(state.heroes).filter(id=>state.heroes[id].owned));list=poolEntries('hero').filter(h=>h.grade==='S'&&!poolLocked(state,h.id));if(!list.some(h=>h.id===selected))selected=list[0]?.id;page=Math.min(page,Math.max(0,Math.ceil(list.length/6)-1));artworkShell(root,{screen:'shop',title:'S 장수 선택',progress:state,controlsRoot:root});root.querySelector('[data-box="50,286,540,44"]').textContent='S 선택 조각 · '+(state.sShards??0)+' / '+S_SELECT_COST;root.inert=true;root.setAttribute('aria-busy','true');disposeNineSlices($('.roster'));$('.roster').replaceChildren();const jobs=[];for(const [i,h]of list.slice(page*6,page*6+6).entries()){const b=document.createElement('button');b.className='hero-card';b.dataset.heroChoice=h.id;b.setAttribute('aria-pressed',String(h.id===selected));const portrait=generalPortraitHolder(h);b.append(portrait);const info=document.createElement('span');info.className='info';info.innerHTML=`<span class="number">S · ${h.faction}</span><b>${h.name}</b><small>${owned.has(h.id)?'보유':'미등용'}</small>`;b.append(info);placeArtwork(b,[50+i%3*286,494+Math.floor(i/3)*150,269,134]);$('.roster').append(b);jobs.push(nineSlice(b,h.id===selected?'green':'blue',{stablePixels:true}));b.onclick=()=>{selected=h.id;draw()};}
$('.previous').disabled=page===0;$('.next').disabled=(page+1)*6>=list.length;$('.page-label').textContent=`${page+1} / ${Math.ceil(list.length/6)} · 총 ${list.length}명`;const h=list.find(h=>h.id===selected),spec=specs[selected];$('.detail-title').textContent=h.name+' · '+h.faction+' · S';$('.ownership').textContent=owned.has(selected)?(state.heroes[selected].star===5?'보유 · 최대 각성 → 장수 재료 8개':'보유 · 각성 '+state.heroes[selected].star+'성 → 중복 카드 1장'):'미등용 · 선택 시 신규 합류';$('.skill').textContent='전법 · '+spec.skill;$('.skill-text').textContent=spec.description;$('.full-art').replaceChildren(await generalArtwork(selected,{center:190,height:330,feet:1295,maxWidth:270}));$('.save').disabled=(state.sShards??0)<S_SELECT_COST;$('.save').textContent=$('.save').disabled?'S 선택 조각 부족':h.name+' 선택 · 조각 '+S_SELECT_COST+'개';await Promise.all([...jobs,document.fonts.ready]);if(token===revision&&!root.hidden){root.inert=false;root.setAttribute('aria-busy','false');}}
$('.previous').onclick=()=>{if(page){page--;draw()}};$('.next').onclick=()=>{if((page+1)*6<list.length){page++;draw()}};
const draw=()=>render().catch(e=>{root.inert=false;root.setAttribute('aria-busy','false');toast('장수 목록을 표시하지 못했습니다. '+e.message)});
$('.save').onclick=()=>{if(!$('.save').disabled)onSelect(selected)};root.querySelectorAll('.home-back,#shop-back').forEach(b=>b.onclick=()=>navigate('shop'));root.addEventListener('keydown',e=>{if(e.key==='Escape'&&!root.inert&&!document.querySelector('dialog[open]')){e.stopImmediatePropagation();navigate('shop')}},true);
store.subscribe(()=>{if(!root.hidden)draw()});return {show(visible){revision++;root.hidden=!visible;host.classList.toggle('s-select-art',visible);if(visible){page=0;selected=list[0].id;draw();}}};
}
