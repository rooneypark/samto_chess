const cached=new Map();
async function source(name,cleared){
 const key=name+(cleared?'-cleared':'');if(!cached.has(key))cached.set(key,(async()=>{
  const img=new Image();img.src=cleared?'previews/campaign-v4/assets/'+key+'.png':'previews/campaign-v3/assets/'+key+'.png';await img.decode();
  const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);let left=canvas.width,top=canvas.height,right=0,bottom=0;
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const i=(y*canvas.width+x)*4+3;if(pixels.data[i]<=1)pixels.data[i]=0;if(pixels.data[i]){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}}
  ctx.putImageData(pixels,0,0);return {canvas,left,top,w:right-left+1,h:bottom-top+1};
 })());return cached.get(key);
}
export async function landmarkArtwork(name,cleared=false){
 const [original,image]=await Promise.all([source(name,false),source(name,cleared)]);
 const scale=Math.min(104/original.w,84/original.h),originalWidth=Math.round(original.w*scale);
 // Preserve the approved standing size. Ruins retain that footprint but become
 // lower instead of being enlarged to the standing height.
 const factor=cleared?Math.min(originalWidth/image.w,60/image.h):scale;
 const w=Math.round(image.w*factor),h=Math.round(image.h*factor),canvas=document.createElement('canvas');canvas.width=120;canvas.height=100;
 const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(image.canvas,image.left,image.top,image.w,image.h,Math.round((120-w)/2),90-h,w,h);
 return canvas.toDataURL();
}
