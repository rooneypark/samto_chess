// Export complete independent drawings from transparent turnaround sheets.
// This never extracts characters from a UI screenshot, and never stretches them.
const fs=require('node:fs/promises'),path=require('node:path'),{sharp}=require('./ui-cutout.cjs');
const root=path.resolve(__dirname,'../..'),source=path.join(root,'art-source/ui-build/v1/general-turnarounds'),out=path.join(root,'game/assets/generals-v2');
(async()=>{
 const generation=JSON.parse(await fs.readFile(path.join(source,'generation.json'),'utf8'));await fs.mkdir(out,{recursive:true});const records={};
 for(const e of generation.entries){
  const file=path.join(source,e.file),{data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const columns=new Uint8Array(info.width);for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>8)columns[x]=1;
  const spans=[];let start=-1,last=-1;for(let x=0;x<info.width;x++){if(columns[x]){if(start<0)start=x;last=x;}if(start>=0&&(x-last>=12||x===info.width-1)){spans.push([start,last]);start=-1;}}
  if(spans.length!==3)throw Error(e.name+' needs three separated complete silhouettes: '+JSON.stringify(spans));
  records[e.id]={name:e.name,views:{},source:'art-source/ui-build/v1/general-turnarounds/'+e.file};
  for(const [n,[l,r]] of spans.entries()){let t=info.height,b=-1;for(let y=0;y<info.height;y++)for(let x=l;x<=r;x++)if(data[(y*info.width+x)*4+3]>8){t=Math.min(t,y);b=Math.max(b,y);}
   const margin=16,left=l-margin,top=t-margin,width=r-l+1+margin*2,height=b-t+1+margin*2;if(left<0||top<0||left+width>info.width||top+height>info.height)throw Error('Missing safety margin');
   const view=['front','back','side'][n],name=e.id+'-'+view+'.png';
   await sharp(file).extract({left,top,width,height}).png().toFile(path.join(out,name));
   records[e.id].views[view]={file:name,width,height,visible:[margin,margin,r-l+1,b-t+1],foot:[width/2,height-margin],sourceBounds:[left,top,width,height]};
  }
 }
 await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(records,null,2));
 await fs.writeFile(path.join(out,'generals.js'),'// Independent full silhouettes; preserve aspect ratio and ground anchor.\nexport const generals='+JSON.stringify(records)+';\n');
 console.log('Exported 18 complete directional originals, no resampling');
})().catch(e=>{console.error(e);process.exitCode=1;});

