import {nineSliceFrames} from './assets/ui-scalable/frames.js';
import {placeArtwork} from './art-controls.js';
import {artboard} from './ui-spec.js';

const sources=new Map(),instances=new WeakMap();
function disposeInstance(el,entry){
 if(!entry)return;
 entry.revision++;entry.observer.disconnect();
 if(instances.get(el)===entry)instances.delete(el);
}
export function disposeNineSlices(root){
 for(const el of [root,...root.querySelectorAll('*')])disposeInstance(el,instances.get(el));
}
async function sourceFor(tone){
 if(!nineSliceFrames[tone])throw Error('Unknown nine-slice frame '+tone);
 if(!sources.has(tone))sources.set(tone,(async()=>{const image=new Image();image.src=new URL('./assets/ui-scalable/'+nineSliceFrames[tone].file,import.meta.url).href;await image.decode();return image;})());
 return sources.get(tone);
}
export function preloadNineSliceFrames(){
 return Promise.all(Object.keys(nineSliceFrames).map(tone=>sourceFor(tone).catch(()=>sources.delete(tone))));
}
export async function renderNineSlice(tone,width,height,{corner=nineSliceFrames[tone]?.corner??28,center=true,stablePixels=false}={}){
 const image=await sourceFor(tone),s=nineSliceFrames[tone].slice;
 width=Math.round(width);height=Math.round(height);corner=Math.round(corner);
 if(width<corner*2||height<corner*2)throw Error('Nine-slice dimensions must leave both corners intact');
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 // Compact new artwork can request stable CPU readback; preserve the raster
 // used by already-approved controls unless their caller explicitly opts in.
 const ctx=canvas.getContext('2d',{willReadFrequently:stablePixels});ctx.imageSmoothingEnabled=false;
 const sx=[0,s,image.width-s,image.width],sy=[0,s,image.height-s,image.height],dx=[0,corner,width-corner,width],dy=[0,corner,height-corner,height];
 for(let y=0;y<3;y++)for(let x=0;x<3;x++){
  if(!center&&x===1&&y===1)continue;
  if(dx[x+1]===dx[x]||dy[y+1]===dy[y])continue;
  ctx.drawImage(image,sx[x],sy[y],sx[x+1]-sx[x],sy[y+1]-sy[y],dx[x],dy[y],dx[x+1]-dx[x],dy[y+1]-dy[y]);
 }
 return canvas.toDataURL('image/png');
}
// Resizes both the artwork AND the exact pressed alpha mask together.
// All callers keep the shared art-controls pointer/keyboard behavior.
export async function nineSlice(el,tone,{box,button=true,center=true,corner,stablePixels=false,fitCorner=false}={}){
 if(box)placeArtwork(el,box);
 // Compact plates are shared by ordinary buttons; departure actions keep their original frame.
 const keepDeparture=el.matches('#battle-start,[data-action=depart]');
 const source=button&&nineSliceFrames[tone+(keepDeparture?'-hero-button':'-button')]?tone+(keepDeparture?'-hero-button':'-button'):tone;
 corner??=nineSliceFrames[source]?.corner??28;
 let entry=instances.get(el);
 if(!entry){
  entry={revision:0};instances.set(el,entry);
  entry.observer=new ResizeObserver(()=>{if(el.isConnected)entry.paint();});entry.observer.observe(el);
 }
 entry.paint=async()=>{
  const game=el.closest('.game'),scale=game?game.getBoundingClientRect().width/artboard.width:1,dpr=window.devicePixelRatio||1,r=el.getBoundingClientRect();
  if(!r.width||!r.height){entry.revision++;entry.pending=null;return;}
  // Reuse this element's exact raster when neither its source nor rendered
  // dimensions changed. No shared bitmap cache or altered slicing rules.
  const radius=Math.round(corner*scale*dpr);
  const actualCorner=fitCorner?Math.min(radius,Math.floor(Math.min(r.width,r.height)*dpr/2)):radius;
  const key=[source,Math.round(r.width*dpr),Math.round(r.height*dpr),actualCorner,center,stablePixels].join(':');
  if(entry.pending?.key===key)return entry.pending.promise;
  const revision=++entry.revision;
  entry.pending=null;
  if(entry.lastKey===key)return;
  const promise=(async()=>{
    const image=await renderNineSlice(source,r.width*dpr,r.height*dpr,{corner:actualCorner,center,stablePixels});
    if(revision!==entry.revision||!el.isConnected||instances.get(el)!==entry)return;
    el.style.setProperty('--art-image',`url("${image}")`);el.style.backgroundImage=`url("${image}")`;el.style.backgroundSize='100% 100%';el.dataset.nineSlice=tone;el.dataset.nineSliceSource=source;
    entry.lastKey=key;
  })().finally(()=>{if(entry.pending?.promise===promise)entry.pending=null;});
  entry.pending={key,promise};
  return promise;
 };
 el.classList.toggle('art-control',button);el.classList.toggle('art-painted',button);
 if(button)el.dataset.artButton='nine-slice-'+tone;
 await entry.paint();
 return ()=>disposeInstance(el,entry);
}
