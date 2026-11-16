// Preview-only composition of approved UI components; no game assets are overwritten.
const fs=require('node:fs/promises'),path=require('node:path');
const {sharp,pressedPNG}=require('../../tools/ui-cutout.cjs');
const shared=path.resolve(__dirname,'../../assets/ui-common');
const read=(name)=>sharp(path.join(shared,name+'.png'));
(async()=>{
 const records={};
 // Production owns the shared selected frame. Preview never recomposes it.
 await fs.copyFile(path.join(shared,'nav-shop-selected.png'),path.join(__dirname,'nav-shop-selected.png'));
 await fs.copyFile(path.join(shared,'nav-shop-selected-pressed.png'),path.join(__dirname,'nav-shop-selected-pressed.png'));
 await fs.copyFile(path.resolve(__dirname,'../../assets/navigation/shop-content.png'),path.join(__dirname,'shop-content.png'));
 records['nav-shop-selected']={source:'assets/ui-common/nav-shop-selected.png',width:178,height:144,method:'exact shared selected tab; built by build-navigation.cjs'};
 for(const [id,source] of [['coin','gate-gold'],['gem','gate-diamonds']]){
  const {data,info}=await read(source).ensureAlpha().raw().toBuffer({resolveWithObject:true}),width=64,height=info.height,raw=Buffer.alloc(width*height*4),mask=new Uint8Array(width*height);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*info.width+x)*4,r=data[i],g=data[i+1],b=data[i+2];mask[y*width+x]=id==='coin'?(r>80&&g>50&&r>b*1.5):(g>r*1.1&&g>b*1.07||r>180&&g>200&&b>180);}
  for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
   let keep=mask[y*width+x];for(let dy=-1;dy<=1&&!keep;dy++)for(let dx=-1;dx<=1&&!keep;dx++)keep=mask[(y+dy)*width+x+dx];
   if(keep){const i=(y*info.width+x)*4,j=(y*width+x)*4;data.copy(raw,j,i,i+4);}
  }
  await sharp(raw,{raw:{width,height,channels:4}}).png().toFile(path.join(__dirname,id+'.png'));
  records[id]={source:'assets/ui-common/'+source+'.png',width,height,method:'original currency icon colors and adjacent one-pixel outline'};
 }
 for(const id of [...Object.keys(records),'shop-content']){
  await fs.writeFile(path.join(__dirname,id+'-pressed.png'),await pressedPNG(path.join(__dirname,id+'.png')));
 }
 await fs.writeFile(path.join(__dirname,'assets.json'),JSON.stringify(records,null,2));
 console.log('Prepared fixed-size selected shop tab and currency icons; scalable buttons use ui-scalable instead');
})().catch(e=>{console.error(e);process.exitCode=1});
