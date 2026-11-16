// The approved selected SHOP plate is the sole selected-state frame reference.
const fs=require('node:fs/promises'),path=require('node:path');
const {sharp,pressedPNG}=require('./ui-cutout.cjs');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'game/assets/ui-common');
const actions=['shop','barracks','home','alliance','arena'];
async function buildNavigation(records){
 const assetDir=path.join(root,'game/assets/navigation');await fs.mkdir(assetDir,{recursive:true});
 // This is exactly the source + clearing rectangle used by the approved shop.
 const reference=await sharp(path.join(dir,records['gate-nav-home'].file)).resize(178,144,{kernel:'nearest'}).png().toBuffer();
 const texture=await sharp(path.join(dir,'barracks-card-selected.png')).extract({left:35,top:35,width:220,height:125}).resize(142,114,{kernel:'nearest'}).png().toBuffer();
 const plate=await sharp(reference).composite([{input:texture,left:18,top:16}]).png().toBuffer();
 await fs.writeFile(path.join(assetDir,'selected-frame.png'),plate);
 // State changes tint the SAME plate. Geometry, alpha and corner ornaments
 // cannot change when a tab becomes selected.
 const normalRaw=await sharp(plate).ensureAlpha().raw().toBuffer();
 for(let i=0;i<normalRaw.length;i+=4){const r=normalRaw[i],g=normalRaw[i+1],b=normalRaw[i+2];
  if(r>60&&r>g*1.04&&g>b*1.1){normalRaw[i]=Math.round(r*.70);normalRaw[i+1]=Math.round(r*.83);normalRaw[i+2]=Math.round(r*.96);}
  else if(g>r*1.05&&g>b*.95){normalRaw[i]=Math.round(g*.55);normalRaw[i+1]=Math.round(g*.75);normalRaw[i+2]=Math.round(g*.96);}
 }
 const normalPlate=await sharp(normalRaw,{raw:{width:178,height:144,channels:4}}).png().toBuffer();
 await fs.writeFile(path.join(assetDir,'normal-frame.png'),normalPlate);
 for(const [index,action] of actions.entries()){
  const id='nav-'+action,sourceId=action==='home'?'barracks-nav-home':'gate-nav-'+action;
  const source=await sharp(path.join(dir,records[sourceId].file)).resize(178,144,{kernel:'nearest'}).png().toBuffer();
  const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const outside=new Uint8Array(178*144),queue=[],pixels=Buffer.alloc(data.length);
  // Navy background is flood-filled outside the closed black icon outlines.
  // Keep enclosed interior pixels (including blue/dark details), not just colors.
  const barrier=(x,y)=>{const i=(y*178+x)*4,r=data[i],g=data[i+1],b=data[i+2];return Math.max(r,g,b)<43||r>65&&r>b*1.08&&g>35||r>125&&g>125&&b>90;};
  const visit=(x,y)=>{if(x<18||x>159||y<9||y>133)return;const i=y*178+x;if(outside[i]||barrier(x,y))return;outside[i]=1;queue.push([x,y]);};
  for(let x=18;x<=159;x++){visit(x,9);visit(x,133);}for(let y=9;y<=133;y++){visit(18,y);visit(159,y);}
  for(let i=0;i<queue.length;i++){const [x,y]=queue[i];visit(x-1,y);visit(x+1,y);visit(x,y-1);visit(x,y+1);}
  for(let y=9;y<=133;y++)for(let x=18;x<=159;x++)if(!outside[y*178+x]){const i=(y*178+x)*4;data.copy(pixels,i,i,i+4);}
  // Discard isolated dark background texture, keeping every connected icon or
  // letter (including its full black outline and enclosed interior).
  const seen=new Uint8Array(178*144);
  for(let at=0;at<seen.length;at++)if(pixels[at*4+3]&&!seen[at]){
   const component=[at];seen[at]=1;let bright=0;
   for(let n=0;n<component.length;n++){const i=component[n],x=i%178,y=Math.floor(i/178);if(Math.max(pixels[i*4],pixels[i*4+1],pixels[i*4+2])>100)bright++;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy,j=ny*178+nx;if(nx>=0&&nx<178&&ny>=0&&ny<144&&!seen[j]&&pixels[j*4+3]){seen[j]=1;component.push(j);}}
   }
   if(!bright)for(const i of component)pixels.fill(0,i*4,i*4+4);
  }
  // The castle doorway is a dark interior, not surrounding navy background.
  // Its lower opening connects to the exterior, so retain this measured inset.
  if(action==='home')for(let y=55;y<=79;y++)for(let x=78;x<=99;x++){const i=(y*178+x)*4;data.copy(pixels,i,i,i+4);}
  // Retain the original icon AND lettering pixels at 1:1 scale. Position once
  // inside the common frame, then reuse this exact layer in BOTH states.
  const xs=[],ys=[];for(let y=0;y<144;y++)for(let x=0;x<178;x++)if(pixels[(y*178+x)*4+3]){xs.push(x);ys.push(y);}
  const bounds={left:Math.min(...xs),top:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs)+1,height:Math.max(...ys)-Math.min(...ys)+1};
  const top=Math.max(16,bounds.top);
  if(top+bounds.height>134)throw Error(action+' content exceeds the common frame');
  const original=await sharp(pixels,{raw:info}).extract(bounds).png().toBuffer();
  const content=await sharp({create:{width:178,height:144,channels:4,background:'#00000000'}}).composite([{input:original,left:bounds.left,top}]).png().toBuffer();
  await fs.writeFile(path.join(assetDir,action+'-content.png'),content);
  for(const active of [false,true]){
   const name=id+(active?'-selected':''),png=await sharp(active?plate:normalPlate).composite([{input:content,left:0,top:0}]).png().toBuffer();
   await fs.writeFile(path.join(assetDir,name+'.png'),png);await fs.writeFile(path.join(dir,name+'.png'),png);
   await fs.writeFile(path.join(dir,name+'-pressed.png'),await pressedPNG(png));
   records[name]={file:name+'.png',pressedFile:name+'-pressed.png',screen:'shared',box:[18+index*183,1512,178,144],source:'game/assets/navigation/'+name+'.png',method:'same shop frame silhouette and original 1:1 content in both states; only frame/background palette changes',contentFit:{source:bounds,left:bounds.left,top,width:bounds.width,height:bounds.height}};
  }
 }
 // Compatibility exports for the approved shop preview and its asset directory.
 for(const target of ['game/assets/shop-v2','game/previews/shop-v1'])for(const suffix of ['', '-pressed'])await fs.copyFile(path.join(dir,'nav-shop-selected'+suffix+'.png'),path.join(root,target,'nav-shop-selected'+suffix+'.png'));
}
module.exports={buildNavigation};
