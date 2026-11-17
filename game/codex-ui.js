import {createArtworkScreen,paintArtworkSelection} from './artwork-screen.js';
import {artworkShell,featuredGenerals} from './ui-shell.js';
import {placeArtwork,uiComponentsReady} from './art-controls.js';
import {paintArtworkLayout} from './art-layout.js';
import {nineSlice,disposeNineSlices} from './nine-slice.js';
import {generalPortrait} from './general-portraits.js';
import {generalArtwork} from './general-art.js';
import {heroes} from './heroes.js';
import {specs} from './progression.js';
import {heroSources,factionRoster,codexReward,factionTitles} from './collection.js';
import {codexTemplate} from './codex-template.js';
import {prepareServices,serviceCommand} from './services.js';
import {treasureCodex,treasureCategories} from './treasure-codex.js';
export function initCodex({host,store,navigate,toast,onWallet,showSources}){
const game=createArtworkScreen({host,className:'gate-lobby codex-runtime',label:'장수 도감',template:codexTemplate,navigate,onWallet});const $=s=>game.querySelector(s);let owned=new Set(),busy=false,revision=0;
const ordered=[...featuredGenerals.map(id=>heroes.find(h=>h.id===id)),...heroes.filter(h=>!featuredGenerals.includes(h.id))];
let faction='전체',page=0,selected='1';
// 도감 has two lists: generals and treasures. Each keeps its own filter, page and selection.
let mode='hero',category='전체',treasurePage=0,treasureSelected=treasureCodex[0].id;
function note(message){toast(message||'장수를 선택해 정보를 확인하세요.');}

['전체','위','촉','오','군웅'].forEach((name,i)=>{const b=document.createElement('button');b.dataset.faction=name;b.textContent=name;placeArtwork(b,[20+i*184,394,165,64]);b.onclick=()=>{faction=name;page=0;render();};$('.section-tabs').append(b);});
[['hero','장수'],['treasure','보물']].forEach(([id,name],i)=>{const b=document.createElement('button');b.dataset.mode=id;b.textContent=name;placeArtwork(b,[571+i*164,287,150,62]);b.onclick=()=>{if(mode===id)return;mode=id;render();};$('.section-tabs').append(b);});
['전체',...Object.keys(treasureCategories)].forEach((id,i)=>{const b=document.createElement('button');b.dataset.category=id;b.textContent=treasureCategories[id]??id;b.hidden=true;placeArtwork(b,[20+i*130.33,394,119,64]);b.onclick=()=>{category=id;treasurePage=0;render();};$('.section-tabs').append(b);});
const ready=Promise.all([uiComponentsReady,paintArtworkLayout(game)]);
async function render(){
 const token=++revision;await ready;if(game.hidden||token!==revision)return;const state=store.get();prepareServices(state);owned=new Set(Object.keys(state.heroes).filter(id=>state.heroes[id].owned));const treasure=mode==='treasure';artworkShell(game,{screen:'home',title:treasure?'보물 도감':'장수 도감',progress:state,controlsRoot:game});game.inert=true;game.setAttribute('aria-busy','true');game.dataset.mode=mode;const painting=[];
 for(const b of game.querySelectorAll('[data-mode]'))painting.push(paintArtworkSelection(b,b.dataset.mode===mode));
 for(const b of game.querySelectorAll('[data-faction]'))b.hidden=treasure;for(const b of game.querySelectorAll('[data-category]'))b.hidden=!treasure;
 $('.scroll-heading').textContent=treasure?'보물 목록':'장수 목록';$('.summary-title').firstChild.nodeValue=treasure?'보물 수집 ':'장수 수집 ';
 $('.summary-copy').textContent=treasure?'이름난 무기·명마·병서·기물을 모았습니다.':'미등용 장수도 전법과 등용처를 확인할 수 있습니다.';$('.source-button').textContent=treasure?'보물함 열기':'등용처 보기';
 if(treasure){await renderTreasures(token,painting);return;}
 const filtered=ordered.filter(h=>faction==='전체'||h.faction===faction),pages=Math.ceil(filtered.length/6),visible=filtered.slice(page*6,page*6+6);
 if(!visible.some(h=>h.id===selected))selected=visible[0].id;
 $('.summary-title b').textContent=owned.size+' / '+heroes.length;
 for(const b of game.querySelectorAll('[data-faction]')){painting.push(paintArtworkSelection(b,b.dataset.faction===faction));}
 const cards=$('.hero-cards');disposeNineSlices(cards);cards.replaceChildren();
 visible.forEach((h,i)=>{const b=document.createElement('button');b.className='codex-entry'+(owned.has(h.id)?' owned':'');b.dataset.hero=h.id;b.setAttribute('aria-pressed',String(h.id===selected));b.setAttribute('aria-label',h.name+' · '+(owned.has(h.id)?'등용 완료':'미등용'));
 if(featuredGenerals.includes(h.id))b.append(generalPortrait(h.id));else{const img=new Image();img.src=h.portrait;img.alt=h.name;img.className='legacy-portrait';b.append(img);}
 for(const [tag,cls,text] of [['span','grade-label',specs[h.id].grade+' · '+h.faction],['strong','',h.name],['small','',owned.has(h.id)?'등용 완료':'미등용']]){const e=document.createElement(tag);e.className=cls;e.textContent=text;if(tag==='strong')e.style.fontSize=Math.min(3.5,11.2/h.name.length)+'cqw';b.append(e);}
 placeArtwork(b,[[20,326,632][i%3],478+Math.floor(i/3)*218,289,204]);b.onclick=()=>{selected=h.id;render();};cards.append(b);painting.push(nineSlice(b,h.id===selected?'green':'blue'));
 });
 $('.page-count').textContent=(page+1)+' / '+pages+' · '+filtered.length+'명';$('.page-prev').disabled=page===0;$('.page-next').disabled=page===pages-1;
 const h=heroes.find(h=>h.id===selected),spec=specs[selected];$('.detail-title').textContent=h.name+' · '+spec.grade+'등급';$('.detail-role').textContent=h.faction+' · '+h.role+' · '+(owned.has(h.id)?'등용 완료':'미등용');$('.detail-skill').textContent='전법 · '+spec.skill;$('.detail-source').textContent='등용처\n'+heroSources(h.id).join(' / ');
 const image=await generalArtwork(h.id,{center:159,height:224,feet:1243,maxWidth:230});if(game.hidden||token!==revision)return;$('.detail-art').replaceChildren(image);
 const all=factionRoster(h.faction),count=all.filter(id=>owned.has(id)).length;$('.reward-title').textContent=h.faction+' 세력 수집 '+count+' / '+all.length;$('.reward-copy').textContent='전체 등용 보상 · 칭호 「'+factionTitles[h.faction]+'」';$('.reward-amount b').textContent=state.services.codex[h.faction]?'수령 완료':count===all.length?'보상 받기':'+'+codexReward.freeDiamonds;const reward=$('.reward-amount');reward.setAttribute('aria-label',h.faction+' 수집 보상');reward.disabled=count!==all.length||!!state.services.codex[h.faction];reward.onclick=async()=>{if(busy||reward.disabled)return;busy=true;game.inert=true;try{await store.transact(s=>serviceCommand(s,{type:'codex',faction:h.faction}));toast('수집 보상 수령 완료');}catch(e){toast(e.message);}finally{busy=false;await render();}};painting.push(nineSlice(reward,reward.disabled?'blue':'green'));
 await finish(token,painting);
}
async function finish(token,painting){
 await Promise.all([...painting,document.fonts.ready,...[...game.querySelectorAll('img')].map(img=>img.decode())]);if(token===revision){game.inert=false;game.setAttribute('aria-busy','false');}
}
// Treasure list. Nothing is marked collected: the catalogue is not yet tied to the treasures a player owns.
async function renderTreasures(token,painting){
 const filtered=treasureCodex.filter(t=>category==='전체'||t.category===category),pages=Math.ceil(filtered.length/6);treasurePage=Math.min(treasurePage,pages-1);const visible=filtered.slice(treasurePage*6,treasurePage*6+6);
 if(!visible.some(t=>t.id===treasureSelected))treasureSelected=visible[0].id;
 $('.summary-title b').textContent='0 / '+treasureCodex.length;
 for(const b of game.querySelectorAll('[data-category]'))painting.push(paintArtworkSelection(b,b.dataset.category===category));
 const cards=$('.hero-cards');disposeNineSlices(cards);cards.replaceChildren();
 visible.forEach((t,i)=>{const b=document.createElement('button');b.className='codex-entry treasure-entry';b.dataset.treasure=t.id;b.setAttribute('aria-pressed',String(t.id===treasureSelected));b.setAttribute('aria-label',t.name+' · 미획득');
  const img=new Image();img.src=t.image;img.alt=t.name;img.className='legacy-portrait';b.append(img);
  for(const [tag,cls,text] of [['span','grade-label',treasureCategories[t.category]],['strong','',t.name],['small','','미획득']]){const e=document.createElement(tag);e.className=cls;e.textContent=text;if(tag==='strong')e.style.fontSize=Math.min(3.5,11.2/t.name.length)+'cqw';b.append(e);}
  placeArtwork(b,[[20,326,632][i%3],478+Math.floor(i/3)*218,289,204]);b.onclick=()=>{treasureSelected=t.id;render();};cards.append(b);painting.push(nineSlice(b,t.id===treasureSelected?'green':'blue'));
 });
 $('.page-count').textContent=(treasurePage+1)+' / '+pages+' · '+filtered.length+'종';$('.page-prev').disabled=treasurePage===0;$('.page-next').disabled=treasurePage===pages-1;
 const t=treasureCodex.find(t=>t.id===treasureSelected),name=treasureCategories[t.category];$('.detail-title').textContent=t.name;$('.detail-role').textContent='분류 · '+name;$('.detail-skill').textContent='수집 · 미획득';$('.detail-source').textContent='획득처\n준비 중입니다.';
 const art=new Image();art.src=t.image;art.alt=t.name;art.className='treasure-detail';placeArtwork(art,[47,1024,224,224]);$('.detail-art').replaceChildren(art);
 const all=treasureCodex.filter(x=>x.category===t.category);$('.reward-title').textContent=name+' 수집 0 / '+all.length;$('.reward-copy').textContent='수집 보상은 준비 중입니다.';$('.reward-amount b').textContent='준비 중';
 const reward=$('.reward-amount');reward.setAttribute('aria-label',name+' 수집 보상');reward.disabled=true;reward.onclick=null;painting.push(nineSlice(reward,'blue'));
 await finish(token,painting);
}
$('.page-prev').onclick=()=>{if(mode==='treasure')treasurePage--;else page--;render();};$('.page-next').onclick=()=>{if(mode==='treasure')treasurePage++;else page++;render();};
$('.source-button').onclick=()=>mode==='treasure'?navigate('treasure'):showSources(heroes.find(h=>h.id===selected),heroSources(selected));

store.subscribe(()=>{if(!game.hidden&&!busy)render();});
return {show(visible){revision++;game.hidden=!visible;host.classList.toggle('codex-art',visible);if(visible)render().catch(e=>{game.inert=false;toast(e.message);});}};
}
