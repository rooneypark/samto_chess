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
let faction='전체',page=0,selected='1';
function note(message='장수 도감 시안입니다. 실제 저장은 변경하지 않습니다.'){const el=document.querySelector('.preview-status');el.textContent=message;el.hidden=false;clearTimeout(note.timer);note.timer=setTimeout(()=>el.hidden=true,2600);}
artworkShell(game,{screen:'home',title:'장수 도감',progress:{gold:12450,diamonds:320}});
['전체','위','촉','오','군웅'].forEach((name,i)=>{const b=document.createElement('button');b.dataset.faction=name;b.textContent=name;placeArtwork(b,[20+i*184,394,165,64]);b.onclick=()=>{faction=name;page=0;render();};$('.section-tabs').append(b);});
await Promise.all([uiComponentsReady,paintArtworkLayout(game)]);
async function render(){
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
$('.source-button').onclick=()=>note(heroes.find(h=>h.id===selected).name+' 등용처: '+heroSources(selected).join(' · '));
game.querySelectorAll('.bottom-nav button,.wallet button,.home-back,#barracks-back').forEach(b=>b.onclick=()=>note());
await render();
