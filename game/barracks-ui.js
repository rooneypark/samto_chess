import {compactAction} from './compact-action.js';
import {fitBodyBox,barracksBodySource} from './side-layout.js';
import {artSet} from './art.js';
import {artButton,placeArtwork,preloadArtwork} from './art-controls.js';
import {generals} from './assets/generals-v2/generals.js';
import {artworkShell} from './ui-shell.js';
import {characterHeight} from './character-scale.js';
import {generalPortrait} from './general-portraits.js';
export const barracksReady=preloadArtwork(['detail-body','train-body','star-filled','star-empty','filter-face','filter-active'].map(id=>'assets/barracks-v2/'+id+'.png').concat(Object.keys(generals).map(id=>'assets/generals-v2/'+id+'-front.png')));
export const generalFront=id=>generals[id]?'assets/generals-v2/'+id+'-front.png':null;
// Full-body stature applies only to the detail; roster portraits use face framing.
// Keep the existing Guan Yu foot baseline and each source's complete canvas.
function sizeOriginal(image,id){
 const original=generals[id]?.views.front;if(!original)return;
 const ratio=characterHeight(id,1),mounted=generals['1'].views.front;
 image.style.setProperty('--general-ratio',ratio);
 image.style.setProperty('--general-foot-offset',(mounted.foot[1]/mounted.height-ratio*original.foot[1]/original.height)*100+'%');
 image.dataset.artHeightRatio=ratio;
}
export function skinBarracks(root,{hero,h,stats,progress,spec,equipped,owned}){
 if(artSet!=='a')return;
 root.classList.add('barracks-v2');const game=root.closest('.game');game.classList.add('barracks-art');
 const field=(cls,text,box)=>{const e=document.createElement('div');e.className='barracks-value '+cls;e.textContent=text;placeArtwork(e,box[1]>=250&&box[1]<782?fitBodyBox(box,barracksBodySource):box);root.append(e);return e;};
 for(const [sel,id] of Object.entries({'#barracks-back':'back','#train':'train','#awaken':'awaken','#barracks-formation':'formation','#treasure-open':'treasure','#hero-skill':'skill'}))artButton(root.querySelector(sel),'barracks-'+id);
 root.querySelectorAll('[data-faction]').forEach((el,i)=>{artButton(el,'barracks-filter-'+['all','wei','shu','wu','qun'][i]);placeArtwork(el,[399+i*92,920,88,59]);});
 artworkShell(root,{screen:'barracks',title:'병영',progress});
 const detailArt=document.createElement('div');detailArt.className='barracks-detail-art';placeArtwork(detailArt,[20,250,901,532]);root.append(detailArt);
 for(const id of ['awaken','barracks-formation'])root.querySelector('#'+id).classList.add('art-painted');
 for(const [id,box] of [['hero-skill',[488,606,420,77]],['treasure-open',[769,695,134,56]]])placeArtwork(root.querySelector('#'+id),fitBodyBox(box,barracksBodySource));
 const stage=root.querySelector('.hero-stage');placeArtwork(stage,fitBodyBox([941*.03,1672*.16,941*.465,1672*.295],barracksBodySource));
 const train=root.querySelector('#train');placeArtwork(train,[20,794,315,94]);train.classList.add('art-painted');train.style.setProperty('--art-image','url("assets/barracks-v2/train-body.png")');
 const scroll=document.createElement('div');scroll.className='shared-scroll barracks-owned-scroll';placeArtwork(scroll,[22,906,895,90]);root.append(scroll);
 field('hero-name',hero.name,[501,272,146,65]).style.fontSize=Math.min(6,14.6/hero.name.length)+'cqw';field('hero-grade',spec.grade,[654,282,38,38]);field('hero-role',hero.faction+' · '+hero.role,[739,282,139,36]);
 field('hero-level'+(h.owned?'':' hero-unowned'),h.owned?'Lv.'+h.level:'미등용',[505,339,103,41]);
 const bar=field('hero-level-bar','',[619,348,271,19]);bar.setAttribute('aria-label','훈련 레벨 '+h.level+' / 20');const fill=document.createElement('i');fill.style.width=h.level/20*100+'%';bar.append(fill);
 const stars=field('hero-stars','',[642,391,246,42]);stars.setAttribute('aria-label','각성 '+h.star+'성');stars.innerHTML=Array.from({length:5},(_,i)=>'<i class="'+(i<h.star?'lit':'')+'" aria-hidden="true"></i>').join('');
 stats.slice(0,4).forEach((value,i)=>field('hero-stat',value.toLocaleString(),[782,443+i*40,105,35]));
 field('hero-treasure',equipped?equipped.name:'보물 미장착',[574,703,190,42]);
 field('owned-count scroll-label','보유 장수 '+owned+'/'+Object.keys(progress.heroes).length,[66,928,302,48]);
 for(const id of ['train','awaken','barracks-formation','treasure-open','hero-skill'])compactAction(root.querySelector('#'+id),id==='train'?'green':'blue');
 const image=root.querySelector('.hero-stage img');image.src=generalFront(hero.id)??hero.sprite;
 image.classList.toggle('general-original',!!generalFront(hero.id));
 sizeOriginal(image,hero.id);
 root.querySelectorAll('.roster-card').forEach(card=>{const src=generalFront(card.dataset.hero);if(src){const img=card.querySelector('img');card.classList.add('general-card');const slot=document.createElement('span');slot.className='general-card-art';img.before(slot);slot.append(generalPortrait(card.dataset.hero,img));}artButton(card,'barracks-'+(card.classList.contains('selected')?'card-selected':'card'),{position:false});});
}

