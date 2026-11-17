import {treasureDefs} from '../../treasures.js';
import {artworkShell,featuredGenerals} from '../../ui-shell.js';
import {placeArtwork,uiComponentsReady} from '../../art-controls.js';
import {paintArtworkLayout} from '../../art-layout.js';
import {nineSlice,disposeNineSlices} from '../../nine-slice.js';
import {generalPortrait} from '../../general-portraits.js';
import {generalArtwork} from '../../general-art.js';
import {heroes} from '../../heroes.js';
import {specs} from '../../progression.js';
import {heroSources,factionRoster,codexReward,factionTitles} from '../../collection.js';
// Memory-only ownership examples. Never read or write the player's profile.
const owned=new Set(['1','32','35']),game=document.querySelector('.game'),$=s=>game.querySelector(s);
const ordered=[...featuredGenerals.map(id=>heroes.find(h=>h.id===id)),...heroes.filter(h=>!featuredGenerals.includes(h.id))];
let faction='전체',page=0,selected='1',kind='heroes';
const treasureOwned=new Set(['iron','book','jade']);
const positions={gold:'33.333% 100%',scroll:'66.667% 50%',helmet:'33.333% 0',gem:'66.667% 100%',banner:'100% 0',swords:'0 50%',gate:'66.667% 0'};
function symbol(d){const el=document.createElement('i');el.className='symbol';el.style.backgroundPosition=positions[d.icon];return el;}
for(const b of game.querySelectorAll('[data-kind]'))b.onclick=()=>{kind=b.dataset.kind;faction='전체';page=0;render();};
function note(message='장수 도감 시안입니다. 실제 저장은 변경하지 않습니다.'){const el=document.querySelector('.preview-status');el.textContent=message;el.hidden=false;clearTimeout(note.timer);note.timer=setTimeout(()=>el.hidden=true,2600);}
artworkShell(game,{screen:'home',title:'도감',progress:{gold:12450,diamonds:320}});
['전체','위','촉','오','군웅'].forEach((name,i)=>{const b=document.createElement('button');b.dataset.faction=name;b.textContent=name;placeArtwork(b,[20+i*184,394,165,64]);b.onclick=()=>{faction=name;page=0;render();};$('.section-tabs').append(b);});
await Promise.all([uiComponentsReady,paintArtworkLayout(game)]);
async function render(){
 const treasure=kind==='treasures';game.classList.toggle('treasure-tab',treasure);
 await Promise.all([...game.querySelectorAll('[data-kind]')].map(b=>{b.setAttribute('aria-pressed',String(b.dataset.kind===kind));return nineSlice(b,b.dataset.kind===kind?'green':'blue');}));
 for(const [i,b] of [...game.querySelectorAll('[data-faction]')].entries()){const name=(treasure?['전체','C','B','A','S']:['전체','위','촉','오','군웅'])[i];b.dataset.faction=name;b.textContent=name;b.onclick=()=>{faction=name;page=0;render();};}
 $('.summary-title').firstChild.textContent=treasure?'보물 보유 ':'장수 수집 ';
 $('.summary-copy').textContent=treasure?'미보유 보물도 효과와 획득처를 확인할 수 있습니다.':'미등용 장수도 전법과 등용처를 확인할 수 있습니다.';
 $('.summary-right').textContent=treasure?'C · B · A · S':'위 · 촉 · 오 · 군웅';
 $('.source-button').textContent=treasure?'획득처 보기':'등용처 보기';
 $('.reward-amount').hidden=treasure;
 if(treasure)return renderTreasures();

 game.inert=true;game.setAttribute('aria-busy','true');const painting=[],filtered=ordered.filter(h=>faction==='전체'||h.faction===faction),pages=Math.ceil(filtered.length/6),visible=filtered.slice(page*6,page*6+6);
 if(!visible.some(h=>h.id===selected))selected=visible[0].id;
 $('.summary-title b').textContent=owned.size+' / '+heroes.length;
 for(const b of game.querySelectorAll('[data-faction]')){b.setAttribute('aria-pressed',String(b.dataset.faction===faction));painting.push(nineSlice(b,b.dataset.faction===faction?'green':'blue'));}
 const cards=$('.hero-cards');disposeNineSlices(cards);cards.replaceChildren();
 visible.forEach((h,i)=>{const b=document.createElement('button');b.className='codex-card'+(owned.has(h.id)?' owned':'');b.dataset.hero=h.id;b.setAttribute('aria-pressed',String(h.id===selected));b.setAttribute('aria-label',h.name+' · '+(owned.has(h.id)?'등용 완료':'미등용'));
 if(featuredGenerals.includes(h.id))b.append(generalPortrait(h.id));else{const img=new Image();img.src=h.portrait;img.alt=h.name;img.className='legacy-portrait';b.append(img);}
 for(const [tag,cls,text] of [['span','grade-label',specs[h.id].grade+' · '+h.faction],['strong','',h.name],['small','',owned.has(h.id)?'등용 완료':'미등용']]){const e=document.createElement(tag);e.className=cls;e.textContent=text;if(tag==='strong')e.style.fontSize=Math.min(3.5,11.2/h.name.length)+'cqw';b.append(e);}
 placeArtwork(b,[[20,326,632][i%3],478+Math.floor(i/3)*218,289,204]);b.onclick=()=>{selected=h.id;render();};cards.append(b);painting.push(nineSlice(b,h.id===selected?'green':'blue'));
 });
 $('.page-count').textContent=(page+1)+' / '+pages+' · '+filtered.length+'명';$('.page-prev').disabled=page===0;$('.page-next').disabled=page===pages-1;
 const h=heroes.find(h=>h.id===selected),spec=specs[selected];$('.detail-title').textContent=h.name+' · '+spec.grade+'등급';$('.detail-role').textContent=h.faction+' · '+h.role+' · '+(owned.has(h.id)?'등용 완료':'미등용');$('.detail-skill').textContent='전법 · '+spec.skill;$('.detail-source').textContent='등용처\n'+heroSources(h.id).join(' / ');
 const image=await generalArtwork(h.id,{center:159,height:224,feet:1243,maxWidth:230});$('.detail-art').replaceChildren(image);
 const all=factionRoster(h.faction),count=all.filter(id=>owned.has(id)).length;$('.reward-title').textContent=h.faction+' 세력 수집 '+count+' / '+all.length;$('.reward-copy').textContent='전체 등용 보상 · 칭호 「'+factionTitles[h.faction]+'」';$('.reward-amount b').textContent='+'+codexReward.freeDiamonds;
 await Promise.all([...painting,document.fonts.ready,...[...game.querySelectorAll('img')].map(img=>img.decode())]);game.inert=false;game.setAttribute('aria-busy','false');
}
$('.page-prev').onclick=()=>{page--;render();};$('.page-next').onclick=()=>{page++;render();};
$('.source-button').onclick=()=>note(kind==='treasures'?'상점 → 보물 모집에서 획득할 수 있습니다.':heroes.find(h=>h.id===selected).name+' 등용처: '+heroSources(selected).join(' · '));
game.querySelectorAll('.bottom-nav button,.wallet button,.home-back,#barracks-back').forEach(b=>b.onclick=()=>note());
async function renderTreasures(){
 game.inert=true;game.setAttribute('aria-busy','true');
 const filtered=treasureDefs.filter(d=>faction==='전체'||d.grade===faction),pages=Math.ceil(filtered.length/6),visible=filtered.slice(page*6,page*6+6),jobs=[];
 if(!visible.some(d=>d.id===selected))selected=visible[0].id;
 $('.summary-title b').textContent=treasureOwned.size+' / '+treasureDefs.length;
 for(const b of game.querySelectorAll('[data-faction]')){b.setAttribute('aria-pressed',String(b.dataset.faction===faction));jobs.push(nineSlice(b,b.dataset.faction===faction?'green':'blue'));}
 const cards=$('.hero-cards');disposeNineSlices(cards);cards.replaceChildren();
 visible.forEach((d,i)=>{const b=document.createElement('button');b.className='codex-card'+(treasureOwned.has(d.id)?' owned':'');b.dataset.treasure=d.id;b.setAttribute('aria-pressed',String(d.id===selected));b.append(symbol(d));
 for(const [tag,cls,text] of [['span','grade-label',d.grade+'등급'],['strong','',d.name],['small','',treasureOwned.has(d.id)?'보유 중':'미보유']]){const el=document.createElement(tag);el.className=cls;el.textContent=text;if(tag==='strong')el.style.fontSize='2.7cqw';b.append(el);}
 placeArtwork(b,[[20,326,632][i%3],478+Math.floor(i/3)*218,289,204]);b.onclick=()=>{selected=d.id;render();};cards.append(b);jobs.push(nineSlice(b,d.id===selected?'green':'blue'));});
 $('.page-count').textContent=(page+1)+' / '+pages+' · '+filtered.length+'종';$('.page-prev').disabled=page===0;$('.page-next').disabled=page===pages-1;
 const d=treasureDefs.find(d=>d.id===selected);$('.detail-art').replaceChildren(symbol(d));$('.detail-title').textContent=d.name+' · '+d.grade+'등급';$('.detail-role').textContent=treasureOwned.has(d.id)?'보유 중 · 예시 1개':'미보유';$('.detail-skill').textContent='1성 효과 · '+d.effect;$('.detail-source').textContent='획득처\n상점 · 보물 모집';$('.reward-title').textContent='보물 장착 · 강화';$('.reward-copy').textContent='보유 보물의 관리는 병영의 보물함에서 진행합니다.';
 await Promise.all([...jobs,document.fonts.ready]);game.inert=false;game.setAttribute('aria-busy','false');
}
await render();
