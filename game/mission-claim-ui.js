import {nineSlice} from './nine-slice.js';
import {placeArtwork} from './art-controls.js';

// Keep a stable action column as a reward changes state.
export function paintClaim(button,available,label,box){
 let status=button.nextElementSibling;
 if(!status?.classList.contains('mission-claim-status')){
  status=document.createElement('span');
  status.className='mission-claim-status';
  button.after(status);
 }
 if(box)Object.assign(status.style,box);
 else placeArtwork(status,button.dataset.box.split(',').map(Number));
 button.hidden=button.disabled=!available;
 status.hidden=available;
 status.textContent=available?'':label;
 button.textContent=label;
 if(available)return nineSlice(button,'green');
}
