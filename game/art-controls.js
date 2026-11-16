import {sharedScroll,scrollSelector} from './scroll-ui.js';
import {uiComponents} from './assets/ui-common/components.js';
import {artboard} from './ui-spec.js';

export const preloadArtwork=files=>typeof Image==='undefined'?Promise.resolve():Promise.all(files.map(src=>{const image=new Image();image.src=src;return image.decode().catch(()=>{});}));
export const uiComponentsReady=preloadArtwork([...new Set(Object.values(uiComponents).map(a=>'assets/ui-common/'+a.file)),...['scroll-paper','header-frame','header-title','header-xp-frame','nav-frame','battle-header-content'].map(id=>'assets/ui-common/'+id+'.png')]);

// Geometry, normal artwork and alpha mask have one source of truth.
export function placeArtwork(el,box){
 if(el.matches(scrollSelector))sharedScroll(el);
 const [x,y,w,h]=box;Object.assign(el.style,{left:x/artboard.width*100+'%',top:y/artboard.height*100+'%',width:w/artboard.width*100+'%',height:h/artboard.height*100+'%'});
}
export function artButton(el,id,{position=true,paint=false}={}){
 if(!el)return;const art=uiComponents[id];if(!art)throw Error('Unknown UI component '+id);
 el.dataset.artButton=id;el.classList.add('art-control');
 el.style.setProperty('--art-image','url("assets/ui-common/'+art.file+'")');
 if(position)placeArtwork(el,art.box);
 el.classList.toggle('art-painted',paint);if(id==='battle-bonds'||el.matches(scrollSelector))sharedScroll(el);
}
export function artworkNavigation(game,screen){
 const active=screen==='gate'?'home':screen;
 game.querySelectorAll(':scope > .bottom-nav [data-action]').forEach(el=>{
  const selected=el.dataset.action===active;
  artButton(el,'nav-'+el.dataset.action+(selected?'-selected':''),{paint:true});
  if(selected)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
  if(el.getAttribute('role')==='tab'){
   el.setAttribute('aria-selected',String(selected));
   el.tabIndex=selected?0:-1;
  }
 });
}

const instances=new WeakMap();
export function initArtPress(root){
 if(instances.has(root))return instances.get(root);
 let active=null,canceled=null;
 const buttonOf=e=>e.target?.closest?.('.art-control');
 const available=b=>b?.isConnected&&root.contains(b)&&!root.inert&&!b.disabled&&!b.closest('[hidden],[inert]')&&(!document.querySelector('dialog[open]')||root.matches('dialog[open]'))&&b.getClientRects().length>0;
 const inside=e=>{if(active.button.dataset.artHitShape==='path')return buttonOf({target:document.elementFromPoint(e.clientX,e.clientY)})===active.button;const r=active.button.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<r.right&&e.clientY>=r.top&&e.clientY<r.bottom;};
 const pressed=(button,value)=>{button.classList.toggle('is-pressed',value);const target=button.dataset.artPressTarget&&document.getElementById(button.dataset.artPressTarget);if(target&&root.contains(target))target.classList.toggle('is-pressed',value);};
 const reset=()=>{if(active)pressed(active.button,false);active=null;};
 root.addEventListener('pointerdown',e=>{const button=buttonOf(e);if(e.button!==0||!e.isPrimary||!available(button))return;reset();canceled=null;active={button,pointerId:e.pointerId};pressed(button,true);});
 root.addEventListener('keydown',e=>{const button=buttonOf(e);if(![' ','Enter'].includes(e.key)||e.repeat||!available(button))return;reset();canceled=null;active={button,key:e.key};pressed(button,true);});
 window.addEventListener('pointermove',e=>{if(active?.pointerId===e.pointerId)pressed(active.button,available(active.button)&&inside(e));},{passive:true});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])window.addEventListener(type,e=>{if(active?.pointerId!==e.pointerId)return;if(type==='pointercancel'||type==='pointerup'&&!inside(e))canceled=active.button;reset();},true);
 window.addEventListener('keyup',e=>{if(active?.key===e.key)reset();},true);
 window.addEventListener('keydown',e=>{if(e.key==='Escape')reset();},true);
 window.addEventListener('blur',reset);window.addEventListener('resize',reset);document.addEventListener('visibilitychange',reset);
 root.addEventListener('focusout',e=>{if(active?.button===e.target)reset();});
 root.addEventListener('click',e=>{const blocked=canceled;canceled=null;reset();if(blocked&&e.detail>0&&buttonOf(e)===blocked){e.preventDefault();e.stopImmediatePropagation();}},true);
 new MutationObserver(()=>{if(active&&!available(active.button))reset();}).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','disabled','class','inert']});
 const api={reset};instances.set(root,api);return api;
}
