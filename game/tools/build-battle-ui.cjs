// Preserve approved UI pixels and build the independently redrawn character sprites.
const sharp=require('../../design-delivery/v1/a-production/tools/node_modules/sharp');
const fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'game/assets/battle-v2');
const source=path.join(root,'design-delivery/v2/05-mockups/battle-preparation-v1.png');
const clean=path.join(root,'design-delivery/v2/05-mockups/battle-clean-plate.png');
(async()=>{
 await fs.mkdir(out,{recursive:true});await fs.copyFile(source,path.join(out,'reference.png'));
 const meta=await sharp(source).metadata(),W=meta.width,H=meta.height;
 const patches=[];
 const crop=async(input,x,y,w,h)=>sharp(input).extract({left:x,top:y,width:w,height:h}).png().toBuffer();
 // Shared source-edge extraction; runtime masks and future screens use the same pipeline.
 const {frameCutout}=require('./ui-cutout.cjs');
 const framedButton=async(id,box)=>fs.writeFile(path.join(out,id+'.png'),await frameCutout(source,box,{rim:2}));
 // Only board and occupied inventory interiors use the clean plate. Frame pixels stay original.
 for(const [x,y,w,h] of [[119,329,706,729],[31,1256,229,130],[534,1166,362,76]])patches.push({input:await crop(clean,x,y,w,h),left:x,top:y});
 // Dynamic text gets a local sample of its own original paper / slate material.
 const blanks={title:[346,26,252,63,141,30,140,55],round:[265,139,435,51,180,141,74,42],silver:[121,232,155,44,237,239,32,23],capacity:[637,230,173,46,793,240,16,28],hint:[258,1100,431,44,82,1103,165,34],bench:[79,1182,182,41,268,1182,40,41],bonds:[154,1585,568,51,75,1589,75,40]};
 for(const [id,[x,y,w,h,sx,sy,sw,sh]] of Object.entries(blanks)){
  const input=await sharp(await crop(source,sx,sy,sw,sh)).resize(w,h,{kernel:'nearest'}).png().toBuffer();
  await fs.writeFile(path.join(out,id+'-blank.png'),input);if(!['title','round'].includes(id))patches.push({input,left:x,top:y});
 }
 await sharp(source).composite(patches).png().toFile(path.join(out,'scene.png'));
 for(const [id,box] of Object.entries({summon:[21,1407,301,139],start:[340,1407,576,139],sword:[534,1166,113,76],armor:[658,1166,115,76],bow:[782,1166,114,76],scroll:[22,1564,895,90],navy:[351,1166,156,76],jade:[339,1407,578,139],bench:[263,1256,108,130]}))await fs.writeFile(path.join(out,id+'.png'),await crop(source,...box));
 await framedButton('help',[812,14,95,85]);
 await framedButton('capacity',[813,216,89,74]);
 await fs.writeFile(path.join(out,'scroll-empty.png'),await crop(path.join(out,'scene.png'),22,1564,895,90));
 const records=await require('./build-battle-sprites.cjs')();
 await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify({source:'design-delivery/v2/05-mockups/battle-preparation-v1.png',width:W,height:H,board:[119,329,706,729],sprites:records,method:'Original UI pixels and clean board; runtime text; independently redrawn transparent character assets.'},null,2));
 console.log('Battle UI and',Object.keys(records).length,'independent sprites exported.');
})();
