const fs=require('node:fs/promises'),path=require('node:path'),{sharp}=require('./ui-cutout.cjs');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'game/assets/barracks-v2'),source=path.join(root,'design-delivery/v2/05-mockups/barracks-v1.png'),clean=path.join(root,'design-delivery/v2/05-mockups/barracks-clean-plate.png');
const crop=async(input,[left,top,width,height])=>sharp(input).extract({left,top,width,height}).png().toBuffer();
(async()=>{
 await fs.mkdir(out,{recursive:true});const patches=[];
 patches.push({input:await crop(clean,[27,268,444,493]),left:27,top:268});
 // Keep original UI frames; only live-value areas receive sampled source material.
 const blanks=[
 [500,274,141,61],[653,284,40,37],[739,282,140,32],[505,342,102,34],
 [641,389,246,43],[787,445,99,30],[787,485,99,30],[787,525,99,30],[787,565,99,30],
 [594,622,285,45],[572,706,192,39],[63,922,322,58],
 [777,22,121,46],[777,75,121,46]
 ];
 const navy=await crop(source,[611,447,82,24]);
 for(const [x,y,w,h] of blanks){const paper=y>900;const material=paper?await crop(source,[353,934,38,33]):y<150?await crop(source,[755,y<60?28:81,21,33]):navy;const input=await sharp(material).resize(w,h,{kernel:'nearest'}).png().toBuffer();patches.push({input,left:x,top:y});}
 // The list is now real scrollable cards, not baked example portraits.
 patches.push({input:await sharp(await crop(source,[33,1460,867,29])).resize(915,454,{kernel:'nearest'}).png().toBuffer(),left:13,top:1006});
 patches.push({input:await sharp(await crop(source,[353,934,38,33])).resize(514,60,{kernel:'nearest'}).png().toBuffer(),left:399,top:920});
 await sharp(source).composite(patches).png().toFile(path.join(out,'scene.png'));
 for(const [id,box] of Object.entries({'star-filled':[642,391,41,42],'star-empty':[766,391,41,42],'skill-icon':[508,615,68,61]}))await fs.writeFile(path.join(out,id+'.png'),await crop(source,box));
 for(const [name,id,box,sample] of [['filter-face','barracks-filter-wei',[514,920,101,59],[530,933,8,26]],['filter-active','barracks-filter-all',[399,920,115,59],[416,934,8,26]]]){
  const input=path.join(root,'game/assets/ui-common/'+id+'.png');const patch=await sharp(await crop(source,sample)).resize(box[2]-26,41,{kernel:'nearest'}).png().toBuffer();await sharp(input).composite([{input:patch,left:13,top:8}]).png().toFile(path.join(out,name+'.png'));
 }
 await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify({source:'design-delivery/v2/05-mockups/barracks-v1.png',clean:'design-delivery/v2/05-mockups/barracks-clean-plate.png',method:'Original UI with empty armory patch, live fields and separately drawn characters',runtimeApplied:true},null,2));
 console.log('Built barracks artwork');
})().catch(e=>{console.error(e);process.exitCode=1;});

