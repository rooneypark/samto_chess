import {placeArtwork} from './art-controls.js';
import {nineSlice} from './nine-slice.js';
// Approved five-column result layout. The caller supplies the original visual;
// this component never crops or scales its contents independently.
export function createArtworkResultCard({index,gradeLabel,visual,name,status,statusClass=''}){
 const button=document.createElement('button');button.className='recruit-award-card';button.dataset.result=index;
 const grade=document.createElement('span');grade.className='grade';grade.textContent=gradeLabel;button.append(grade,visual);
 const title=document.createElement('strong');title.textContent=name;button.append(title);
 const detail=document.createElement('small');detail.className=statusClass;detail.textContent=status;button.append(detail);
 placeArtwork(button,[50+index%5*172,350+Math.floor(index/5)*226,153,210]);return button;
}
export function paintArtworkResultSelection(root,selected){
 return Promise.all([...root.querySelectorAll('[data-result]')].map(button=>{
  const active=Number(button.dataset.result)===selected;button.setAttribute('aria-pressed',String(active));
  // nineSlice retains its per-element raster and ResizeObserver; no shared cache
  // changes the approved corner pixels or alpha mask.
  return nineSlice(button,active?'green':'blue',{stablePixels:true});
 }));
}
