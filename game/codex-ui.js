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
export function initCodex({host,store,navigate,toast,onWallet,showSources}){
const game=createArtworkScreen({host,className:'gate-lobby codex-runtime',label:'도감',template:codexTemplate,navigate,onWallet});const $=s=>game.querySelector(s);let owned=new Set(),busy=false,revision=0;
const ordered=[...featuredGenerals.map(id=>heroes.find(h=>h.id===id)),...heroes.filter(h=>!featuredGenerals.includes(h.id))];
let faction='전체',page=0,selected='1',kind='heroes';
const treasureGroups=['전체','무기','군마','서책','기타'];
const treasureCategory={weapon:'무기',horse:'군마',book:'서책',armor:'방어구',object:'소품',jewel:'장신구'};
const treasureRoot=new URL('../art-source/treasures/v1/',import.meta.url);
let treasureCatalog;
function loadTreasureCatalog(){
 return treasureCatalog??=fetch(new URL('catalog.json',treasureRoot)).then(async response=>{
  if(!response.ok)throw Error('보물 원화 목록을 불러오지 못했습니다.');
  return (await response.json()).items;
 }).catch(error=>{treasureCatalog=undefined;throw error;});
}
function treasureImage(item){
 const image=new Image();image.className='codex-treasure-art';image.src=new URL(item.file,treasureRoot);image.alt=item.name;
 return image;
}
for(const b of game.querySelectorAll('[data-kind]'))b.onclick=()=>{kind=b.dataset.kind;faction='전체';page=0;render();};

function note(message){toast(message||'장수를 선택해 정보를 확인하세요.');}

['전체','위','촉','오','군웅'].forEach((name,i)=>{const b=document.createElement('button');b.dataset.faction=name;b.textContent=name;placeArtwork(b,[20+i*184,394,165,64]);b.onclick=()=>{faction=name;page=0;render();};$('.section-tabs').append(b);});
const ready=Promise.all([uiComponentsReady,paintArtworkLayout(game)]);
async function render(){
 const token=++revision;await ready;if(game.hidden||token!==revision)return;const state=store.get();prepareServices(state);owned=new Set(Object.keys(state.heroes).filter(id=>state.heroes[id].owned));artworkShell(game,{screen:'home',title:'도감',progress:state,controlsRoot:game});game.inert=true;game.setAttribute('aria-busy','true');
 const treasure=kind==='treasures';game.classList.toggle('treasure-tab',treasure);
 await Promise.all([...game.querySelectorAll('[data-kind]')].map(b=>{b.setAttribute('aria-pressed',String(b.dataset.kind===kind));return nineSlice(b,b.dataset.kind===kind?'green':'blue');}));
 if(token!==revision||game.hidden)return;
 for(const [i,b] of [...game.querySelectorAll('[data-faction]')].entries()){const name=(treasure?treasureGroups:['전체','위','촉','오','군웅'])[i];b.dataset.faction=name;b.textContent=name;b.onclick=()=>{faction=name;page=0;render();};}
 $('.summary-title').firstChild.textContent=treasure?'보물 원화 ':'장수 수집 ';
 $('.summary-copy').textContent=treasure?'보물의 원화와 종류를 확인할 수 있습니다.':'미등용 장수도 전법과 등용처를 확인할 수 있습니다.';
 $('.summary-right').textContent=treasure?'무기 · 군마 · 서책 · 기타':'위 · 촉 · 오 · 군웅';
 $('.source-button').textContent=treasure?'획득처 보기':'등용처 보기';
 $('.reward-amount').hidden=treasure;
 $('.source-button').hidden=treasure;
 if(treasure){
  try{await renderTreasures(token);}catch(error){
   if(token===revision&&!game.hidden){game.inert=false;game.setAttribute('aria-busy','false');toast(error.message);}
  }
  return;
 }

 const painting=[],filtered=ordered.filter(h=>faction==='전체'||h.faction===faction),pages=Math.ceil(filtered.length/6),visible=filtered.slice(page*6,page*6+6);
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
 await Promise.all([...painting,document.fonts.ready,...[...game.querySelectorAll('img')].map(img=>img.decode())]);if(token===revision){game.inert=false;game.setAttribute('aria-busy','false');}
}
async function renderTreasures(token){
 const catalog=await loadTreasureCatalog();if(token!==revision||game.hidden)return;
 const filtered=catalog.filter(item=>faction==='전체'||treasureCategory[item.category]===faction||
  (faction==='기타'&&['armor','object','jewel'].includes(item.category)));
 const pages=Math.ceil(filtered.length/6),visible=filtered.slice(page*6,page*6+6),jobs=[];
 if(!visible.some(item=>item.catalogId===selected))selected=visible[0].catalogId;
 $('.summary-title b').textContent=catalog.length+'종';
 for(const button of game.querySelectorAll('[data-faction]'))jobs.push(paintArtworkSelection(button,button.dataset.faction===faction));
 const cards=$('.hero-cards');disposeNineSlices(cards);cards.replaceChildren();
 visible.forEach((item,i)=>{
  const button=document.createElement('button');button.className='codex-entry';button.dataset.treasure=item.catalogId;
  button.setAttribute('aria-pressed',String(item.catalogId===selected));
  const name=document.createElement('strong');name.textContent=item.name;
  const type=document.createElement('small');type.textContent=treasureCategory[item.category];
  const image=treasureImage(item);button.append(image,name,type);
  placeArtwork(button,[[20,326,632][i%3],478+Math.floor(i/3)*218,289,204]);button.onclick=()=>{selected=item.catalogId;render();};
  cards.append(button);jobs.push(nineSlice(button,item.catalogId===selected?'green':'blue'),image.decode());
 });
 $('.page-count').textContent=(page+1)+' / '+pages+' · '+filtered.length+'종';
 $('.page-prev').disabled=page===0;$('.page-next').disabled=page===pages-1;
 const item=visible.find(entry=>entry.catalogId===selected),image=treasureImage(item);
 $('.detail-art').replaceChildren(image);
 $('.detail-title').textContent=item.name;
 $('.detail-role').textContent=treasureCategory[item.category];
 $('.detail-skill').textContent='';
 $('.detail-source').textContent='';
 $('.reward-title').textContent='보물함';
 $('.reward-copy').textContent='보유한 보물의 장착과 강화는 병영의 보물함에서 할 수 있습니다.';
 await Promise.all([...jobs,image.decode(),document.fonts.ready]);
 if(token===revision&&!game.hidden){game.inert=false;game.setAttribute('aria-busy','false');}
}
$('.page-prev').onclick=()=>{page--;render();};$('.page-next').onclick=()=>{page++;render();};
$('.source-button').onclick=()=>showSources(heroes.find(h=>h.id===selected),heroSources(selected));

store.subscribe(()=>{if(!game.hidden&&!busy)render();});
return {show(visible){revision++;game.hidden=!visible;host.classList.toggle('codex-art',visible);if(visible)render().catch(e=>{game.inert=false;toast(e.message);});}};
}
