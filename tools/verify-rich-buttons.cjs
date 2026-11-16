const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {launch}=require('../game/tests/browser-env.cjs');
const sharp=require('../design-delivery/v1/a-production/tools/node_modules/sharp');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const file=path.join(root,decodeURIComponent(req.url.split('?')[0]));
 fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html');res.end(data);});
});
async function main(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await launch();
 try{
  const page=await browser.newPage({viewport:{width:1020,height:1000}});
  await page.goto(`http://127.0.0.1:${server.address().port}/game/previews/rich-buttons-v2/index.html`);
  await page.waitForFunction(()=>window.ready);
  const result=await page.evaluate(async()=>{
   const {renderNineSlice}=await import('../../nine-slice.js');
   const sizes=[[170,60],[170,140],[240,64],[280,72],[320,80],[360,90],[420,100],[500,110],[579,143],[600,60],[700,120],[800,130],[900,60],[900,140]];
   const read=async url=>{const image=new Image();image.src=url;await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);return {data:ctx.getImageData(0,0,c.width,c.height).data,w:c.width,h:c.height};};
   const reports=[];
   for(const tone of ['green-button','blue-button'])for(const scale of [1,390/941,320/941]){
    const corner=Math.round(28*scale),base=await read(await renderNineSlice(tone,200*scale,100*scale,{corner}));
    for(const [w,h] of sizes){
     const im=await read(await renderNineSlice(tone,w*scale,h*scale,{corner}));let mismatches=0,holes=0;
     for(const right of [false,true])for(const bottom of [false,true])for(let y=0;y<corner;y++)for(let x=0;x<corner;x++){
      const a=((bottom?im.h-corner+y:y)*im.w+(right?im.w-corner+x:x))*4;
      const b=((bottom?base.h-corner+y:y)*base.w+(right?base.w-corner+x:x))*4;
      for(let c=0;c<4;c++)if(im.data[a+c]!==base.data[b+c])mismatches++;
     }
     for(let y=corner;y<im.h-corner;y++)for(let x=corner;x<im.w-corner;x++)if(im.data[(y*im.w+x)*4+3]!==255)holes++;
     reports.push({tone,w:im.w,h:im.h,corner,mismatches,holes});
    }
   }
   return reports;
  });
  for(const r of result){assert.equal(r.mismatches,0);assert.equal(r.holes,0);}
  const pressed=[];
  for(const bg of ['light','dark','contrast'])for(const tone of ['green','blue']){
   const button=page.locator('.'+bg+' button').filter({hasText:tone+' 320'});
   await button.scrollIntoViewIfNeeded();await page.mouse.move(0,0);
   const before=await sharp(await button.screenshot()).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   const maskUrl=await button.evaluate(e=>e.style.getPropertyValue('--art-image').slice(5,-2));
   const mask=await sharp(Buffer.from(maskUrl.split(',')[1],'base64')).ensureAlpha().raw().toBuffer();
   const box=await button.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
   assert.equal(await button.evaluate(e=>e.classList.contains('is-pressed')),true);
   const after=await sharp(await button.screenshot()).ensureAlpha().raw().toBuffer();
   let outside=0,missed=0;
   for(let i=0;i<mask.length;i+=4){const delta=before.data[i]+before.data[i+1]+before.data[i+2]-after[i]-after[i+1]-after[i+2];if(!mask[i+3]&&Math.abs(delta)>3)outside++;if(mask[i+3]===255&&before.data[i]+before.data[i+1]+before.data[i+2]>30&&delta<3)missed++;}
   await page.mouse.up();assert.equal(outside,0);assert.equal(missed,0);pressed.push({bg,tone,outside,missed});
  }
  await page.screenshot({path:path.join(root,'test-artifacts/rich-buttons-review.png'),fullPage:true});
  fs.writeFileSync(path.join(root,'test-artifacts/rich-buttons-validation.json'),JSON.stringify({renders:result,pressed},null,2));
  console.log('PASS',result.length,'renders, 4 corners identical, opaque centers;',pressed.length,'actual pointer pressed checks');
 }finally{await browser.close();server.close();}
}
main().catch(error=>{console.error(error);server.close();process.exitCode=1;});




