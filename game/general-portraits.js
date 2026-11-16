import {generals} from './assets/generals-v2/generals.js';
// Approved roster portraits. Source pixels are not repainted or modified.
// Face widths are normalized independently of full-body/mounted stature.
export const portraitCrops={
 '1':{center:216,eyes:266,faceWidth:140},
 'xuchu':{center:270,eyes:156,faceWidth:156},
 '32':{center:240,eyes:239,faceWidth:176},
 '35':{center:178,eyes:250,faceWidth:168},
 'diaochan':{center:194,eyes:250,faceWidth:150},
 '119':{center:224,eyes:286,faceWidth:106}
};
export function portraitWindow(id){
 const a=portraitCrops[id],width=a.faceWidth/.45,height=width*1.25;
 return {left:a.center-width/2,top:a.eyes-height*.56,width,height};
}
export function generalPortrait(id,image=new Image()){
 const crop=portraitWindow(id),source=generals[id].views.front,slot=document.createElement('span');
 slot.className='portrait-viewport';slot.dataset.crop=JSON.stringify(crop);
 image.src='assets/generals-v2/'+source.file;image.alt=generals[id].name+' 초상화';
 Object.assign(image.style,{width:source.width/crop.width*100+'%',height:source.height/crop.height*100+'%',left:-crop.left/crop.width*100+'%',top:-crop.top/crop.height*100+'%'});
 slot.append(image);return slot;
}
