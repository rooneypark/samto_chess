import {placeArtwork,uiComponentsReady} from '../../art-controls.js';
import {artworkShell} from '../../ui-shell.js';
import {generals} from '../../assets/generals-v2/generals.js';
import {nineSlice} from '../../nine-slice.js';
const game=document.querySelector('.game');
artworkShell(game,{screen:'alliance',title:'동맹',progress:{gold:12450,diamonds:320}});
game.querySelectorAll('[data-box]').forEach(el=>placeArtwork(el,el.dataset.box.split(',').map(Number)));
const painting=[...game.querySelectorAll('[data-tone]')].map(el=>nineSlice(el,el.dataset.tone));
game.querySelectorAll('[data-frame]').forEach(el=>painting.push(nineSlice(el,el.dataset.frame,{button:false,center:!el.closest('.headquarters')})));
for(const [id,center,height] of [['1',142,232],['35',798,195]]){
 const art=generals[id].views.front,w=height*art.width/art.height,top=691-height*art.foot[1]/art.height,img=document.createElement('img');
 img.className='general-original';img.alt=generals[id].name;img.src='assets/generals-v2/'+art.file;placeArtwork(img,[center-w/2,top,w,height]);game.querySelector('.general-lineup').append(img);
}
const toast=document.querySelector('.preview-status');let timer;
function note(text){clearTimeout(timer);toast.textContent=text;toast.hidden=false;timer=setTimeout(()=>toast.hidden=true,3300);}
game.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>note(b.dataset.note??'동맹 화면 디자인 시안입니다. 실제 게임 상태는 변경하지 않습니다.')));
const background=new Image();background.src='previews/alliance-v1/headquarters.png';
await Promise.all([uiComponentsReady,...painting,background.decode(),...Array.from(document.images,i=>i.decode()),document.fonts.ready]);
game.inert=false;game.setAttribute('aria-busy','false');
