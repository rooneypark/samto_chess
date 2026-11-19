import {artworkShell,featuredGenerals} from '../../ui-shell.js';
import {artButton,placeArtwork,uiComponentsReady,artworkNavigation} from '../../art-controls.js';
import {paintArtworkLayout} from '../../art-layout.js';
import {nineSlice} from '../../nine-slice.js';
import {generals} from '../../character-art.js';
import {generalPortrait as portrait} from '../../general-portraits.js';
const game=document.querySelector('.game');let selected='1';
artworkShell(game,{screen:'home',title:'초상화',progress:{gold:12450,diamonds:320}});artworkNavigation(game,'barracks');
featuredGenerals.forEach((id,i)=>{
 const x=[20,326,632][i%3],row=Math.floor(i/3),name=generals[id].name;
 const card=document.createElement('button');card.className='portrait-card';card.dataset.hero=id;card.setAttribute('aria-label',name+' 초상화');card.append(portrait(id));const label=document.createElement('strong');label.textContent=name;card.append(label);placeArtwork(card,[x,264+row*320,289,300]);card.onclick=()=>{selected=id;render();};game.querySelector('.portrait-grid').append(card);
 const small=document.createElement('button');small.className='roster-example';small.dataset.hero=id;small.setAttribute('aria-label',name+' 병영 카드');small.append(portrait(id));const copy=document.createElement('strong');copy.textContent=name;const state=document.createElement('small');state.textContent='미등용';small.append(copy,state);placeArtwork(small,[x,974+row*222,289,204]);small.onclick=()=>{selected=id;render();};game.querySelector('.roster-examples').append(small);
});
async function render(){game.inert=true;game.setAttribute('aria-busy','true');const painting=[];for(const b of game.querySelectorAll('[data-hero]')){const active=b.dataset.hero===selected;b.setAttribute('aria-pressed',String(active));if(b.classList.contains('portrait-card'))painting.push(nineSlice(b,active?'green':'blue'));else artButton(b,active?'barracks-card-selected':'barracks-card',{position:false,paint:true});}
 await Promise.all([...painting,document.fonts.ready,...[...game.querySelectorAll('img')].map(i=>i.decode())]);game.inert=false;game.setAttribute('aria-busy','false');}
function note(){const el=document.querySelector('.preview-status');el.textContent='초상화 추출 시안입니다. 실제 병영과 저장은 변경하지 않습니다.';el.hidden=false;clearTimeout(note.timer);note.timer=setTimeout(()=>el.hidden=true,2200);}
game.querySelectorAll('.bottom-nav button,.wallet button,#barracks-back').forEach(b=>b.onclick=note);
await Promise.all([uiComponentsReady,paintArtworkLayout(game)]);await render();
