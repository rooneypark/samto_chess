import {generalPortraitHolder} from '../../general-portrait-holder.js';
import {sSelectTemplate} from '../../s-select-template.js';
import {artworkScreenTemplate} from '../../artwork-screen-template.js';
import {artworkShell} from '../../ui-shell.js';
import {paintArtworkLayout} from '../../art-layout.js';
import {placeArtwork} from '../../art-controls.js';
import {nineSlice,disposeNineSlices} from '../../nine-slice.js';
import {generalArtwork} from '../../general-art.js';
import {poolEntries} from '../../economy.js';
import {specs} from '../../progression.js';
import {S_SELECT_COST} from '../../collection.js';
const root=document.querySelector('.game'),$=s=>root.querySelector(s);
root.innerHTML=sSelectTemplate;
$('#barracks-back').id='shop-back';await paintArtworkLayout(root,{stablePixels:true});artworkShell(root,{screen:'shop',title:'S 장수 선택',progress:{gold:12450,diamonds:320},controlsRoot:root});
const list=poolEntries('hero').filter(h=>h.grade==='S'),owned=new Set(['1','32']);let page=0,selected=list[0].id;
async function render(){root.inert=true;root.setAttribute('aria-busy','true');disposeNineSlices($('.roster'));$('.roster').replaceChildren();const jobs=[];for(const [i,h]of list.slice(page*6,page*6+6).entries()){const b=document.createElement('button');b.className='hero-card';b.dataset.heroChoice=h.id;b.setAttribute('aria-pressed',String(h.id===selected));const portrait=generalPortraitHolder(h);b.append(portrait);const info=document.createElement('span');info.className='info';info.innerHTML=`<span class="number">S · ${h.faction}</span><b>${h.name}</b><small>${owned.has(h.id)?'보유':'미등용'}</small>`;b.append(info);placeArtwork(b,[50+i%3*286,494+Math.floor(i/3)*150,269,134]);$('.roster').append(b);jobs.push(nineSlice(b,h.id===selected?'green':'blue',{stablePixels:true}));b.onclick=()=>{selected=h.id;render()};}
$('.previous').disabled=page===0;$('.next').disabled=(page+1)*6>=list.length;$('.page-label').textContent=`${page+1} / ${Math.ceil(list.length/6)} · 총 ${list.length}명`;const h=list.find(h=>h.id===selected),spec=specs[selected];$('.detail-title').textContent=h.name+' · '+h.faction+' · S';$('.ownership').textContent=owned.has(selected)?'보유 · 각성 1성 → 중복 카드 1장':'미등용 · 선택 시 신규 합류';$('.skill').textContent='전법 · '+spec.skill;$('.skill-text').textContent=spec.description;$('.full-art').replaceChildren(await generalArtwork(selected,{center:190,height:330,feet:1295,maxWidth:270}));$('.save').textContent=h.name+' 선택 · 조각 '+S_SELECT_COST+'개';await Promise.all([...jobs,document.fonts.ready]);root.inert=false;root.setAttribute('aria-busy','false');}
$('.previous').onclick=()=>{if(page){page--;render()}};$('.next').onclick=()=>{if((page+1)*6<list.length){page++;render()}};
const notify=()=>{let e=document.querySelector('.preview-status');if(!e){e=document.createElement('div');e.className='preview-status';document.body.append(e)}e.textContent='검토용 시안입니다. 실제 조각과 보유 장수는 변경하지 않습니다.';setTimeout(()=>e.remove(),2200)};root.querySelectorAll('.save,.home-back,#shop-back,.bottom-nav button,.wallet button').forEach(b=>b.onclick=notify);await render();
