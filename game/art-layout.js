import {placeArtwork} from './art-controls.js';
import {nineSlice} from './nine-slice.js';

// Approved 941 × 1672 artwork coordinates. Outside edges are shared;
// padding inside a panel must not change this content boundary.
export {contentBounds} from './side-layout.js';
export function paintArtworkLayout(root,{hollow='.duel-stage,.victory-scene',stablePixels=false}={}){
 root.querySelectorAll('[data-box]').forEach(el=>placeArtwork(el,el.dataset.box.split(',').map(Number)));
 return Promise.all([
  ...Array.from(root.querySelectorAll('[data-tone]'),el=>nineSlice(el,el.dataset.tone,{stablePixels})),
  ...Array.from(root.querySelectorAll('[data-frame]'),el=>nineSlice(el,el.dataset.frame,{button:false,center:!el.closest(hollow),stablePixels}))
 ]);
}
