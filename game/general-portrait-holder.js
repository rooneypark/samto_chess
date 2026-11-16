import {generalPortrait,portraitCrops} from './general-portraits.js';
// Same transparent approved crop or existing fallback, in the caller's fixed slot.
export function generalPortraitHolder(hero){
 const holder=document.createElement('span');holder.className='portrait-holder';
 if(portraitCrops[hero.id])holder.append(generalPortrait(hero.id));
 else{const image=new Image();image.src=hero.portrait;image.alt=hero.name;holder.append(image);}
 return holder;
}
