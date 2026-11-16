import {placeArtwork,uiComponentsReady} from '../../art-controls.js';
import {artworkShell} from '../../ui-shell.js';
import {generals} from '../../assets/generals-v2/generals.js';
import {nineSlice} from '../../nine-slice.js';
const game=document.querySelector('.game');
artworkShell(game,{screen:'arena',title:'군웅대전',progress:{gold:12450,diamonds:320}});
game.querySelectorAll('[data-box]').forEach(el=>placeArtwork(el,el.dataset.box.split(',').map(Number)));
const painting=[...game.querySelectorAll('[data-tone]')].map(el=>nineSlice(el,el.dataset.tone));
game.querySelectorAll('[data-frame]').forEach(el=>painting.push(nineSlice(el,el.dataset.frame,{button:false,center:!el.closest('.duel-stage')})));
function hero(id,center,height,feet,container){const art=generals[id].views.front,w=height*art.width/art.height,img=document.createElement('img');img.className='general-original';img.alt=generals[id].name;img.src='assets/generals-v2/'+art.file;placeArtwork(img,[center-w/2,feet-height*art.foot[1]/art.height,w,height]);game.querySelector(container).append(img);}
hero('1',264,317,932,'.duel-generals');hero('119',677,317,932,'.duel-generals');
['1','xuchu','32','35','diaochan','119'].forEach((id,i)=>hero(id,112+i*137,68,1163,'.formation-generals'));
const toast=document.querySelector('.preview-status');let timer;
game.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{clearTimeout(timer);toast.textContent=b.dataset.note??'군웅대전 디자인 시안입니다. 실제 저장은 변경하지 않습니다.';toast.hidden=false;timer=setTimeout(()=>toast.hidden=true,3300);}));
const background=new Image();background.src='previews/arena-v1/courtyard.png';
await Promise.all([uiComponentsReady,...painting,background.decode(),...Array.from(document.images,i=>i.decode()),document.fonts.ready]);game.inert=false;game.setAttribute('aria-busy','false');
