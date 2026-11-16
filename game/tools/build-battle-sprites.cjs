// Export independently redrawn alpha sprites at the approved on-screen dimensions.
// Only transparent margins are trimmed. No screenshot masking or character extraction.
const sharp=require('../../design-delivery/v1/a-production/tools/node_modules/sharp');
const fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const sources=path.join(root,'art-source/ui-build/v1/battle-sprites');
const out=path.join(root,'game/assets/battle-v2');
const sizes={'xuchu-back':[114,126],'1-back':[90,182],'119-back':[105,163],'32-back':[89,139],'35-back':[90,134],'diaochan-back':[77,127],'raider-front':[85,80],'bow-front':[77,78],'32-front':[78,103],'archer-front':[79,91]};
async function build(){
 const generation=JSON.parse(await fs.readFile(path.join(sources,'generation.json'),'utf8'));
 const records={},report=[];
 await fs.mkdir(out,{recursive:true});
 for(const item of generation.images){
  const local=path.join(sources,item.id+'.png');
  try{await fs.access(local);}catch{await fs.copyFile(item.source,local);}
  const {data,info}=await sharp(local).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let left=info.width,top=info.height,right=-1,bottom=-1;
  // Ignore sub-4%-opacity generation dust when measuring the transparent margin.
  // Keep the generated alpha untouched inside the measured sprite bounds.
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>8){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  if(right<0)throw Error('Empty sprite '+item.id);
  if(!left||!top||right===info.width-1||bottom===info.height-1)throw Error('Clipped original sprite '+item.id);
  const [width,height]=sizes[item.id];
  const png=await sharp(local).extract({left,top,width:right-left+1,height:bottom-top+1}).resize(width,height,{kernel:'nearest',fit:'fill'}).png().toBuffer();
  // Body ground anchor excludes a weapon extending off-center.
  const feet=await sharp(png).ensureAlpha().raw().toBuffer();let sum=0,count=0;
  for(let y=height-5;y<height;y++)for(let x=Math.floor(width*.2);x<width*.8;x++)if(feet[(y*width+x)*4+3]>128){sum+=x;count++;}
  const footX=count?Math.round(sum/count):Math.round(width/2),placeX=80-footX,placeY=200-height;
  await sharp({create:{width:160,height:208,channels:4,background:'#00000000'}}).composite([{input:png,left:placeX,top:placeY}]).png().toFile(path.join(out,item.id+'.png'));
  records[item.id]={width:160,height:208,foot:[80,200],visible:[placeX,placeY,width,height]};
  report.push({id:item.id,source:path.relative(root,local).replaceAll('\\','/'),sourceAlphaBounds:[left,top,right-left+1,bottom-top+1],visibleSize:[width,height],canvas:[160,208],foot:[80,200]});
 }
 await fs.writeFile(path.join(out,'sprites.js'),'// Independently redrawn alpha sprites; one shared ground anchor.\nexport const battleSprites='+JSON.stringify(records)+';\n');
 await fs.writeFile(path.join(sources,'export.json'),JSON.stringify({method:'Independent built-in image_gen redraws, alpha-preserving nearest-neighbor size export. No screenshot cutouts.',sprites:report},null,2));
 console.log('Exported '+report.length+' independent sprites on 160x208 canvases.');
 return records;
}
module.exports=build;
if(require.main===module)build().catch(e=>{console.error(e);process.exitCode=1;});
