// Original RGB + alpha traced from each source frame. Never a generic CSS clip.
const sharp=require('../../design-delivery/v1/a-production/tools/node_modules/sharp');
async function frameCutout(source,box,{rim=2,tone='both',include=[],outline,paperBackground=false,includeGreen=false,darkOutline=false,slateFrame=false}={}){
 const [left,top,w,h]=box;
 const raw=await sharp(source).extract({left,top,width:w,height:h}).ensureAlpha().raw().toBuffer();
 if(darkOutline){
  const mask=new Uint8Array(w*h);
  for(let y=0;y<h;y++){let l=w,r=-1;for(let x=0;x<w;x++){const i=(y*w+x)*4;if(raw[i]<45&&raw[i+1]<65&&raw[i+2]<95){l=Math.min(l,x);r=Math.max(r,x);}}if(r>=l)for(let x=l;x<=r;x++)mask[y*w+x]=1;}
  const expanded=new Uint8Array(mask);for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++)if(mask[y*w+x])for(const j of [y*w+x-1,y*w+x+1,(y-1)*w+x,(y+1)*w+x])expanded[j]=1;
  for(let i=0;i<w*h;i++)raw[i*4+3]=expanded[i]?255:0;
  return sharp(raw,{raw:{width:w,height:h,channels:4}}).png().toBuffer();
 }
 if(paperBackground){
  // Parchment outside the closed dark outline must not be mistaken for gold.
  const outside=new Uint8Array(w*h),queue=[];const paper=i=>raw[i*4]>110&&raw[i*4+1]>90&&raw[i*4]>raw[i*4+2]*1.15;
  for(let i=0;i<w*h;i++)if((i<w||i>=w*(h-1)||i%w===0||i%w===w-1)&&paper(i)){outside[i]=1;queue.push(i);}
  for(let n=0;n<queue.length;n++){const i=queue[n];for(const j of [i-w,i+w,...(i%w?[i-1]:[]),...(i%w<w-1?[i+1]:[])])if(j>=0&&j<w*h&&!outside[j]&&paper(j)){outside[j]=1;queue.push(j);}}
  for(let i=0;i<w*h;i++)raw[i*4+3]=outside[i]?0:255;
  return sharp(raw,{raw:{width:w,height:h,channels:4}}).png().toBuffer();
 }
 if(outline){const alpha=await sharp(Buffer.from(`<svg width="${w}" height="${h}"><polygon points="${outline}" fill="white"/></svg>`)).ensureAlpha().raw().toBuffer();for(let i=0;i<w*h;i++)raw[i*4+3]=alpha[i*4+3]>=128?255:0;return sharp(raw,{raw:{width:w,height:h,channels:4}}).png().toBuffer();}
 const bright=new Uint8Array(w*h),seen=new Uint8Array(w*h);
 for(let i=0;i<w*h;i++){const [r,g,b]=raw.subarray(i*4,i*4+3);const gold=r>85&&g>60&&r>g*1.025&&g>b*1.10;const silver=r>(tone==='slate'?60:105)&&g>(tone==='slate'?75:115)&&b>(tone==='slate'?95:125)&&Math.max(r,g,b)-Math.min(r,g,b)<85;bright[i]=(tone!=='silver'&&gold||tone!=='gold'&&silver||includeGreen&&g>90&&g>r*1.15&&g>b*1.1)?1:0;}
 let frame;const segments=[];
 for(let i=0;i<w*h;i++)if(bright[i]&&!seen[i]){
  const q=[i];seen[i]=1;let l=w,r=0,t=h,b=0;
  for(let n=0;n<q.length;n++){const at=q[n],x=at%w,y=Math.floor(at/w);l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy,j=ny*w+nx;if(nx>=0&&nx<w&&ny>=0&&ny<h&&bright[j]&&!seen[j]){seen[j]=1;q.push(j);}}
  }
  if(r-l>w*.45||b-t>h*.45)segments.push(...q);
  if(r-l>w*.62&&b-t>h*.62&&(!frame||q.length>frame.length))frame=q;
 }
 if(!frame){frame=[];for(let i=0;i<w*h;i++){const x=i%w,y=Math.floor(i/w);if(bright[i]&&(x<w*.1||x>w*.9||y<h*.08||y>h*.92))frame.push(i);}if(frame.length<30)throw Error('No outer frame: '+source+' '+box);}
 if(includeGreen)for(let i=0;i<w*h;i++)if(i%w<60&&bright[i])segments.push(i);
 frame=[...new Set([...frame,...segments])];
 if(slateFrame){frame=[];for(let i=0;i<w*h;i++){const x=i%w,y=Math.floor(i/w),r=raw[i*4],g=raw[i*4+1],b=raw[i*4+2];if((x<w*.2||x>w*.8||y<h*.2||y>h*.8)&&r>35&&g>55&&b>80&&b>r+5&&g>r+3)frame.push(i);}if(frame.length<40)throw Error('No slate perimeter');}
 const rows=Array.from({length:h},()=>[w,-1]);for(const at of frame){const y=Math.floor(at/w),x=at%w;rows[y][0]=Math.min(rows[y][0],x);rows[y][1]=Math.max(rows[y][1],x);}
 // Fill between the actual left/right frame on each row, retaining stepped corners.
 const mask=new Uint8Array(w*h);for(let y=0;y<h;y++){const [l,r]=rows[y];if(r<l)continue;for(let x=l;x<=r;x++)for(let dy=-rim;dy<=rim;dy++)for(let dx=-rim;dx<=rim;dx++){if(dx*dx+dy*dy>rim*rim)continue;const nx=x+dx,ny=y+dy;if(nx>=0&&nx<w&&ny>=0&&ny<h)mask[ny*w+nx]=1;}}
 // Optional source-specific attached ornaments (e.g. notification seal), not a
 // substitute for tracing the underlying button frame.
 for(const [cx,cy,r] of include)for(let y=0;y<h;y++)for(let x=0;x<w;x++)if((x-cx)**2+(y-cy)**2<=r*r)mask[y*w+x]=1;
 // Frame highlights can have disconnected shaded segments. Close those gaps
 // using the frame's measured hull, never the element's generic corner ratio.
 const pts=[];for(let i=0;i<w*h;i++)if(mask[i]){const x=i%w,y=Math.floor(i/w);pts.push([x,y],[x+1,y],[x+1,y+1],[x,y+1]);}
 pts.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),lo=[],hi=[];
 for(const p of pts){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),p)<=0)lo.pop();lo.push(p);}for(const p of [...pts].reverse()){while(hi.length>1&&cross(hi.at(-2),hi.at(-1),p)<=0)hi.pop();hi.push(p);}
 const hull=[...lo.slice(0,-1),...hi.slice(0,-1)];const alpha=await sharp(Buffer.from(`<svg width="${w}" height="${h}"><polygon points="${hull.map(p=>p.join(',')).join(' ')}" fill="white"/></svg>`)).ensureAlpha().raw().toBuffer();
 for(let i=0;i<w*h;i++)mask[i]=alpha[i*4+3]>=128?1:0;
 for(let i=0;i<w*h;i++)raw[i*4+3]=mask[i]?255:0;
 return sharp(raw,{raw:{width:w,height:h,channels:4}}).png().toBuffer();
}
// All generated pressed assets share the runtime overlay's 28% darkening.
// Alpha is never recalculated from color: the full original silhouette stays.
async function pressedPNG(input){
 const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let i=0;i<data.length;i+=4)for(let c=0;c<3;c++)data[i+c]=Math.round(data[i+c]*.72);
 return sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();
}
module.exports={frameCutout,pressedPNG,sharp};
