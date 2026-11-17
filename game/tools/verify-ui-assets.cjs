const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{sharp}=require('./ui-cutout.cjs');
(async()=>{
 const root=path.resolve(__dirname,'../..'),out=path.join(root,'game/assets/ui-common'),{records}=JSON.parse(fs.readFileSync(path.join(out,'manifest.json')));
 const report=[];
 for(const [id,c] of Object.entries(records)){
  const n=await sharp(path.join(out,c.file)).ensureAlpha().raw().toBuffer({resolveWithObject:true}),pressed=await sharp(path.join(out,c.pressedFile)).ensureAlpha().raw().toBuffer();
  const [left,top,width,height]=c.box;assert.equal(n.info.width,width);assert.equal(n.info.height,height);
  const src=sharp(path.join(root,c.source)),meta=await src.metadata();const source=await (c.resize?src.resize(width,height,{kernel:c.resize}):meta.width===width&&meta.height===height?src:src.extract({left,top,width,height})).ensureAlpha().raw().toBuffer();
  let visible=0,transparent=0,sourceRGBChanges=0;for(let i=0;i<n.data.length;i+=4){
   assert.equal(pressed[i+3],n.data[i+3],id+' pressed alpha');
   if(n.data[i+3]===0){transparent++;continue;}visible++;
   const x=i/4%width,y=Math.floor(i/4/width);
   const goldEdge=id==='gate-formation'&&y>=52&&y<=55&&x>=10&&x<150&&source[i+2]-source[i]>=18;
   const liveLabelArea=id==='gate-formation'&&y>=8&&y<50&&x>=43&&x<121;
   if(goldEdge)assert.ok(n.data[i]>n.data[i+1]&&n.data[i+1]>n.data[i+2],id+' lower edge gold');
   for(let k=0;k<3;k++){
    if(!goldEdge&&!liveLabelArea)assert.equal(n.data[i+k],source[i+k],id+' source RGB');
    if(n.data[i+k]!==source[i+k])sourceRGBChanges++;
    assert.equal(pressed[i+k],Math.round(n.data[i+k]*.72),id+' pressed RGB');
   }
  }
  const row=Math.floor(height/2),col=Math.floor(width/2),xs=[],ys=[];
  for(let x=0;x<width;x++)if(n.data[(row*width+x)*4+3])xs.push(x);
  for(let y=0;y<height;y++)if(n.data[(y*width+col)*4+3])ys.push(y);
  assert.ok(xs.at(-1)-xs[0]>width*.83,id+' complete central width');
  assert.ok(ys.at(-1)-ys[0]>height*.75,id+' complete central height');
  assert.ok(transparent>0,id+' actual transparent background');
  report.push({id,width,height,visible,transparent,sourceRGBChanges,pressedAlphaChanges:0});
 }
 fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({checks:'original visible RGB, complete center spans, matching normal/pressed alpha and 72% RGB',components:report},null,2));
 console.log('PASS '+report.length+' component sources, complete silhouettes and shared normal/pressed alpha');
})().catch(e=>{console.error(e);process.exitCode=1;});

