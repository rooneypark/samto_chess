import {nineSlice} from './nine-slice.js';
// Convert legacy text controls without changing their labels, geometry or handlers.
export function compactAction(button,tone='blue'){
 if(!button)return;
 button.classList.add('compact-action');
 return nineSlice(button,tone,{stablePixels:true}).catch(console.error);
}
