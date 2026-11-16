const {launch,artifact}=require('../../tests/browser-env.cjs');
const sharp=require('../../../design-delivery/v1/a-production/tools/node_modules/sharp');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),read=buffer=>sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:941,height:1672},deviceScaleFactor:1}),errors=[],report={pressed:[],frames:[],viewports:[]};
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 await page.goto('http://127.0.0.1:8780/game/previews/arena-v1/index.html');await page.locator('.game[aria-busy=false]').waitFor();
 await page.waitForTimeout(200);await page.mouse.move(939,1480);
 const shot=await page.screenshot({path:path.join(root,'design-delivery/v2/05-mockups/arena-versus-v1.png')}),actual=await read(shot),reference=await read(await fs.readFile(path.join(root,'design-delivery/v2/05-mockups/approved-runtime/shop-941.png')));
 let common=0;
 for(let y=0;y<1672;y++)for(let x=0;x<941;x++){
  if(y<150){if(x>=333&&x<608&&y>=19&&y<125)continue;}
  else if(y>=1498){if(y>=1512&&y<1656&&(x>=18&&x<196||x>=750&&x<928))continue;}
  else continue;
  const i=(y*941+x)*4;assert.ok(actual.data.subarray(i,i+4).equals(reference.data.subarray(i,i+4)),'Approved shell drift '+x+','+y);common++;
 }
 report.identicalShellPixels=common;
 for(const button of await page.locator('button.art-control').all()){
  const box=await button.boundingBox(),clip=Object.fromEntries(Object.entries(box).map(([k,v])=>[k,Math.round(v)]));
  await page.mouse.move(939,1480);await button.evaluate(e=>e.blur());const before=await read(await page.screenshot({clip}));
  const url=await button.evaluate(e=>getComputedStyle(e).getPropertyValue('--art-image').trim().slice(4,-1).replaceAll('"',''));
  const mask=await read(url.startsWith('data:')?Buffer.from(url.split(',')[1],'base64'):await fs.readFile(path.join(root,'game',url)));
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();assert.ok(await button.evaluate(e=>e.classList.contains('is-pressed')));assert.deepEqual(await button.boundingBox(),box);
  const after=await read(await page.screenshot({clip}));let outside=0,frame=0,missed=0;
  for(let y=0;y<clip.height;y++)for(let x=0;x<clip.width;x++){
   const i=(y*clip.width+x)*4,a=before.data[i]+before.data[i+1]+before.data[i+2],b=after.data[i]+after.data[i+1]+after.data[i+2],delta=Math.abs(before.data[i]-after.data[i])+Math.abs(before.data[i+1]-after.data[i+1])+Math.abs(before.data[i+2]-after.data[i+2]);
   if(!mask.data[i+3]&&delta>3)outside++;
   if(mask.data[i+3]===255&&(x<clip.width*.12||x>clip.width*.88||y<clip.height*.12||y>clip.height*.88)&&Math.max(mask.data[i],mask.data[i+1],mask.data[i+2])>100&&a>30){frame++;if(b>a*.92)missed++;}
  }
  const label=await button.getAttribute('aria-label')||await button.innerText();assert.equal(outside,0,label+' alpha exterior');assert.ok(frame>25);assert.equal(missed,0,label+' full border');report.pressed.push({label,outside,frame,missed});await page.mouse.move(939,1480);await page.mouse.up();
 }
 const frames=await page.evaluate(async()=>{const {renderNineSlice}=await import('./nine-slice.js'),out=[];for(const tone of ['blue','green'])for(const [w,h] of [[281,74],[901,500],[901,130],[207,64],[430,88],[570,136],[290,136]])out.push({tone,w,h,url:await renderNineSlice(tone,w,h)});return out;});
 const corners={};for(const f of frames){const png=Buffer.from(f.url.split(',')[1],'base64'),parts=[];
  for(const [left,top] of [[0,0],[f.w-28,0],[0,f.h-28],[f.w-28,f.h-28]])parts.push(await sharp(png).extract({left,top,width:28,height:28}).raw().toBuffer());
  if(!corners[f.tone])corners[f.tone]=parts;else parts.forEach((part,i)=>assert.ok(part.equals(corners[f.tone][i]),'Fixed corner ornament'));report.frames.push({tone:f.tone,width:f.w,height:f.h,identicalCorners:true});
 }
 for(const size of [{width:320,height:568},{width:390,height:844},{width:1440,height:900}]){
  await page.setViewportSize(size);await page.waitForTimeout(100);await page.screenshot({path:artifact('arena-concept','preview-'+size.width+'.png')});
  for(const [panelSelector,images] of [['.duel-stage','.duel-generals .general-original'],['.formation','.formation-generals .general-original']]){const panel=await page.locator(panelSelector).boundingBox();for(const img of await page.locator(images).all()){const b=await img.boundingBox();assert.ok(b.x>=panel.x&&b.x+b.width<=panel.x+panel.width&&b.y>=panel.y&&b.y+b.height<=panel.y+panel.height,'Full independent original');}}
  assert.equal(await page.locator('.game').evaluate(e=>e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1),false);
  const clipped=await page.locator('.section-tabs button,.compact,.secondary-actions button,.primary-actions button').evaluateAll(es=>es.flatMap(e=>{const b=e.getBoundingClientRect(),w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),bad=[];while(w.nextNode()){if(!w.currentNode.textContent.trim())continue;const r=document.createRange();r.selectNodeContents(w.currentNode);const t=r.getBoundingClientRect();if(t.left<b.left||t.right>b.right||t.top<b.top||t.bottom>b.bottom)bad.push(w.currentNode.textContent);}return bad;}));assert.deepEqual(clipped,[]);report.viewports.push(size);
 }
 assert.equal(await page.evaluate(async()=> (await indexedDB.databases()).length),0,'Preview does not access player saves');assert.deepEqual(errors,[]);
 await fs.writeFile(path.join(__dirname,'qa.json'),JSON.stringify(report,null,2));console.log('PASS shared shell '+common+' pixels; '+report.pressed.length+' full pressed masks; 14 nine-slice sizes; 3 responsive views; no player save access');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
