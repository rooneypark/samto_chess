import {designPortrait} from './art.js';
import {portraitIds} from './assets/portraits-v4/index.js';

export const portraitCrops=Object.fromEntries(portraitIds.map(id=>[id,{width:96,height:120}]));
export function portraitWindow(){return {left:0,top:0,width:96,height:120};}

export function generalPortrait(id,image=new Image()){
 const slot=document.createElement('span');
 slot.className='portrait-viewport';
 image.src=designPortrait(id);
 if(!image.alt)image.alt='장수 초상화';
 Object.assign(image.style,{width:'100%',height:'100%',left:'0',top:'0',objectFit:'contain'});
 slot.append(image);
 return slot;
}
