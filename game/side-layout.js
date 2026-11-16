// Shop body edges. Vertical layout is deliberately untouched.
import {artboard,contentBounds} from './ui-spec.js';
export {contentBounds};
export const barracksBodySource=Object.freeze({left:11,width:916,edge:40});
export function fitBodyBox([x,y,w,h],{left=0,width=artboard.width,edge=0}={}){
 const map=v=>v<=left+edge?contentBounds.left+v-left:v>=left+width-edge?contentBounds.right-(left+width-v):contentBounds.left+edge+(v-left-edge)*(contentBounds.width-2*edge)/(width-2*edge);
 return [map(x),y,map(x+w)-map(x),h];
}
