import {generals} from './assets/generals-v2/generals.js';
import {heroes} from './heroes.js';
import {characterHeight} from './character-scale.js';
import {placeArtwork} from './art-controls.js';

// The complete independent source is always preserved, including wide weapons.
export async function generalArtwork(id,{center,height,feet,maxWidth=Infinity}){
 const original=generals[id]?.views.front,hero=heroes.find(h=>h.id===id);if(!hero)return null;
 const img=document.createElement('img');img.className='general-original';img.alt=hero.name;img.dataset.hero=id;
 img.src=original?'assets/generals-v2/'+original.file:hero.sprite;await img.decode();
 const w0=original?.width??img.naturalWidth,h0=original?.height??img.naturalHeight,foot=original?.foot[1]??h0;
 const h=Math.min(characterHeight(id,height),maxWidth*h0/w0),w=h*w0/h0;
 img.dataset.artCenter=center;placeArtwork(img,[center-w/2,feet-h*foot/h0,w,h]);return img;
}
// Decoding can finish in any order. Keep DOM/reading order left to right too.
export function appendGeneralArtwork(container,img){
 container.insertBefore(img,[...container.children].find(el=>Number(el.dataset.artCenter)>Number(img.dataset.artCenter))??null);
}
