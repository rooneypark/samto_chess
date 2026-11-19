import {placeArtwork,uiComponentsReady} from '../../art-controls.js';
import {artworkShell} from '../../ui-shell.js';
import {nineSlice} from '../../nine-slice.js';
import {generals} from '../../character-art.js';
import {characterHeight} from '../../character-scale.js';
import {landmarkArtwork} from '../../campaign-landmarks.js';
import {stages} from '../../stages.js';
const game=document.querySelector('.game');
artworkShell(game,{screen:'home',title:'전투 결과',progress:{gold:12450,diamonds:320}});
game.querySelector('.art-header-title').style.fontSize='4.7cqw';
game.querySelectorAll('[data-box]').forEach(el=>placeArtwork(el,el.dataset.box.split(',').map(Number)));
const painting=[...game.querySelectorAll('[data-tone]')].map(el=>nineSlice(el,el.dataset.tone));
game.querySelectorAll('[data-frame]').forEach(el=>painting.push(nineSlice(el,el.dataset.frame,{button:false,center:!el.closest('.victory-scene')})));
// Existing independent originals; the mounted/standing proportions are shared.
['xuchu','35','1','119','32','diaochan'].forEach((id,i)=>{
 const original=generals[id].views.front,height=characterHeight(id,174),w=height*original.width/original.height,img=document.createElement('img');img.className='general-original';img.alt=generals[id].name;img.dataset.hero=id;img.src=original.url;placeArtwork(img,[112+i*143-w/2,747-height*original.foot[1]/original.height,w,height]);game.querySelector('.victory-generals').append(img);
});
// Values use the real stage reward definition, but this page never opens a store.
const reward=stages.yellow_03.reward;game.querySelector('#gold-reward').textContent='+'+reward.firstClearGold;game.querySelector('#gem-reward').textContent='+'+reward.firstClearDiamonds;game.querySelector('#material-reward').textContent='+'+reward.extra.heroTokens;
game.querySelector('.next-landmark').src=await landmarkArtwork('sishui-wall');
const toast=document.querySelector('.preview-status');let timer;
game.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{clearTimeout(timer);toast.textContent=b.dataset.note??'전투 결과 디자인 시안입니다. 실제 저장은 변경하지 않습니다.';toast.hidden=false;timer=setTimeout(()=>toast.hidden=true,3300);}));
const background=new Image();background.src='assets/arena-v2/courtyard.png';await Promise.all([uiComponentsReady,...painting,background.decode(),...Array.from(document.images,img=>img.decode()),document.fonts.ready]);game.inert=false;game.setAttribute('aria-busy','false');
