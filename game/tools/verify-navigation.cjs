const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {sharp}=require('./ui-cutout.cjs');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'game/assets/ui-common'),out=path.join(root,'test-artifacts/navigation');
const read=async file=>sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const plate=(await read(path.join(root,'game/assets/navigation/selected-frame.png'))).data,report=[],layers=[];
 const {records}=JSON.parse(await fs.readFile(path.join(dir,'manifest.json')));
 for(const [index,action] of ['shop','barracks','home','alliance','arena'].entries()){
  const normal=await read(path.join(dir,'nav-'+action+'.png')),selected=await read(path.join(dir,'nav-'+action+'-selected.png')),pressed=await read(path.join(dir,'nav-'+action+'-selected-pressed.png'));
  assert.equal(selected.info.width,178);assert.equal(selected.info.height,144);
  const content=(await read(path.join(root,'game/assets/navigation',action+'-content.png'))).data;
  const normalPressed=(await read(path.join(dir,'nav-'+action+'-pressed.png'))).data;
  const fit=records['nav-'+action].contentFit;
  assert.equal(fit.width,fit.source.width,action+' original width');assert.equal(fit.height,fit.source.height,action+' original height');
  const sourceId=action==='home'?'barracks-nav-home':'gate-nav-'+action;
  const source=await sharp(path.join(dir,records[sourceId].file)).resize(178,144,{kernel:'nearest'}).ensureAlpha().raw().toBuffer();
  let frame=0,letters=0,identicalContent=0;
  for(let y=0;y<144;y++)for(let x=0;x<178;x++){
   const i=(y*178+x)*4,a=selected.data,p=pressed.data;
   assert.equal(a[i+3],plate[i+3],action+' selected silhouette');assert.equal(p[i+3],a[i+3],action+' pressed silhouette');
   assert.equal(normal.data[i+3],a[i+3],action+' normal/selected silhouette');assert.equal(normalPressed[i+3],a[i+3],action+' normal pressed silhouette');
   if(x<18||x>=160||y<16||y>=134){assert.ok(a.subarray(i,i+4).equals(plate.subarray(i,i+4)),action+' entire common frame');frame++;}
   if(content[i+3]){const j=((y-fit.top+fit.source.top)*178+x)*4;assert.ok(content.subarray(i,i+4).equals(source.subarray(j,j+4)),action+' original 1:1 pixels');assert.equal(content[i+3],255);assert.ok(normal.data.subarray(i,i+4).equals(content.subarray(i,i+4)),action+' normal content');assert.ok(a.subarray(i,i+4).equals(content.subarray(i,i+4)),action+' selected content');assert.ok(p.subarray(i,i+4).equals(normalPressed.subarray(i,i+4)),action+' pressed content');identicalContent++;}
   for(let k=0;k<3;k++)assert.equal(p[i+k],Math.round(a[i+k]*.72),action+' pressed color');
   if(y>=88&&y<130&&x>=18&&x<160&&normal.data[i]>125&&normal.data[i+1]>125&&normal.data[i+2]>90){assert.ok(a.subarray(i,i+4).equals(normal.data.subarray(i,i+4)),action+' complete lettering');letters++;}
  }
  assert.ok(letters>300);assert.ok(identicalContent>3000);report.push({action,width:178,height:144,identicalFramePixels:frame,preservedLetterPixels:letters,identicalContentPixels:identicalContent,alphaIdentical:true});
  for(const [row,suffix] of ['','-selected','-pressed','-selected-pressed'].entries())layers.push({input:await sharp(path.join(dir,'nav-'+action+suffix+'.png')).resize(356,288,{kernel:'nearest'}).png().toBuffer(),left:20+index*376,top:40+row*318});
 }
 for(const [theme,background] of [['dark','#182b40'],['light','#f5e6cb'],['contrast','#4fb9ad']])await sharp({create:{width:1900,height:1312,channels:4,background}}).composite(layers).png().toFile(path.join(out,'selected-pressed-'+theme+'.png'));
 await fs.writeFile(path.join(out,'verification.json'),JSON.stringify(report,null,2));
 console.log('PASS 5 tabs: identical normal/selected content and silhouette, common frame, matching pressed content/alpha');
})().catch(e=>{console.error(e);process.exitCode=1;});
