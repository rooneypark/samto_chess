import {placeArtwork} from './art-controls.js';
import {nineSlice} from './nine-slice.js';

// Approved 941 × 1672 artwork coordinates. Outside edges are shared;
// padding inside a panel must not change this content boundary.
export {contentBounds} from './side-layout.js';
export function paintArtworkLayout(root,{hollow='.duel-stage,.victory-scene',stablePixels=false}={}){
 root.querySelectorAll('[data-box]').forEach(el=>placeArtwork(el,el.dataset.box.split(',').map(Number)));
 const panels=[...root.querySelectorAll('[data-frame]')].filter(el=>!el.matches('button'));
 panels.forEach(el=>{el.classList.add('angular-panel-frame');el.classList.toggle('angular-panel-hollow',!!el.closest(hollow));});
 return Promise.all(Array.from(root.querySelectorAll('[data-tone]'),el=>nineSlice(el,el.dataset.tone,{stablePixels})));
}
