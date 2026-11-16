// Reusable polygon hit-area + identical alpha mask. Original scene stays intact.
export function regionArtwork(button,{points,sourceSize,mapBox,feedbackId}){
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),left=Math.min(...xs),top=Math.min(...ys),w=Math.max(...xs)-left,h=Math.max(...ys)-top;
 const path=points.map(([x,y],i)=>(i?'L':'M')+(x-left)+' '+(y-top)).join(' ')+'Z';
 const mask='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'"><path fill="white" d="'+path+'"/></svg>';
 button.style.setProperty('--art-image','url("data:image/svg+xml,'+encodeURIComponent(mask)+'")');button.dataset.artHitShape='path';button.classList.add('art-region-button');if(feedbackId)button.dataset.artPressTarget=feedbackId;
 button.innerHTML='<svg aria-hidden="true" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none"><path fill="transparent" d="'+path+'"/></svg>';
 return [mapBox[0]+left/sourceSize[0]*mapBox[2],mapBox[1]+top/sourceSize[1]*mapBox[3],w/sourceSize[0]*mapBox[2],h/sourceSize[1]*mapBox[3]];
}
