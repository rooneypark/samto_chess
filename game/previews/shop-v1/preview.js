import {artButton,placeArtwork,initArtPress,uiComponentsReady,preloadArtwork} from '../../art-controls.js';
import {artworkHeader,artworkWallet} from '../../ui-shell.js';
import {generals} from '../../assets/generals-v2/generals.js';
import {nineSlice} from '../../nine-slice.js';
const game=document.querySelector('.game'),base='previews/shop-v1/';
game.inert=true;game.setAttribute('aria-busy','true');
artworkHeader(game,'barracks','상점');game.querySelector('.art-header-content').remove();game.querySelector('.barracks-scroll-heading').remove();
artworkWallet(game,{gold:12450,diamonds:320});
const pending=[];
const skin=(el,id)=>{el.dataset.skin=id;if(id==='nav-shop-selected'){el.dataset.artButton='preview-'+id;el.classList.add('art-control','art-painted');el.style.setProperty('--art-image',`url("${base+id}.png")`);return;}
 const task=nineSlice(el,id.includes('green')?'green':'blue');if(game.inert)pending.push(task);return task;};
document.querySelectorAll('[data-box]').forEach(el=>placeArtwork(el,el.dataset.box.split(',').map(Number)));
document.querySelectorAll('[data-skin]').forEach(el=>skin(el,el.dataset.skin));
pending.push(nineSlice(game.querySelector('.stage-frame'),'blue',{button:false,center:false}));
game.querySelectorAll('.bottom-nav button').forEach(el=>{artButton(el,'nav-'+el.dataset.action,{paint:true});if(el.dataset.action==='shop')skin(el,'nav-shop-selected');});
const heroes=[['xuchu',115,240],['1',278,360],['32',427,265],['35',558,280],['diaochan',683,260],['119',817,330]];
for(const [id,center,height] of heroes){
 const art=generals[id].views.front,w=height*art.width/art.height,top=810-height*art.foot[1]/art.height;
 const img=document.createElement('img');img.className='general-original';img.dataset.hero=id;img.alt=generals[id].name;img.src='assets/generals-v2/'+art.file;
 placeArtwork(img,[center-w/2,top,w,height]);game.querySelector('.general-lineup').append(img);
}
initArtPress(game);
const status=document.querySelector('.preview-status');let timer;
const note=()=>{clearTimeout(timer);status.textContent='디자인 시안입니다. 실제 등용·구매는 실행하지 않습니다.';status.hidden=false;timer=setTimeout(()=>status.hidden=true,2600);};
game.querySelectorAll('button:not([data-currency])').forEach(b=>b.addEventListener('click',note));
game.querySelectorAll('[data-currency]').forEach(b=>b.addEventListener('click',()=>{
 const gold=b.dataset.currency==='gold';
 game.querySelectorAll('[data-currency]').forEach(el=>{const selected=el===b;skin(el,'currency-'+(selected?'green':'blue'));el.setAttribute('aria-pressed',String(selected));});
 game.querySelectorAll('[data-count]').forEach(el=>el.querySelector('span').textContent=((gold?300:100)*Number(el.dataset.count)).toLocaleString()+' '+(gold?'골드':'다이아'));
}));
await Promise.all([uiComponentsReady,preloadArtwork(['recruitment-hall','nav-shop-selected','coin','gem'].map(id=>base+id+'.png')),Promise.all([...document.images].map(i=>i.decode())),document.fonts.ready,...pending]);
game.inert=false;game.setAttribute('aria-busy','false');
