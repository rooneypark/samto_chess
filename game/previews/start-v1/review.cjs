const {launch,artifact}=require('../../tests/browser-env.cjs');
const sharp=require('../../../design-delivery/v1/a-production/tools/node_modules/sharp');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),read=buffer=>sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:941,height:1672},deviceScaleFactor:1}),errors=[],report={pressed:[],frames:[],viewports:[],states:[]};
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 const ready=()=>page.locator('.game[aria-busy=false]').waitFor();
 await page.goto('http://127.0.0.1:8780/game/previews/start-v1/index.html');await ready();await page.waitForTimeout(150);await page.mouse.move(939,1400);
 const shot=await page.screenshot({path:path.join(root,'design-delivery/v2/05-mockups/start-v1.png')}),actual=await read(shot),reference=await read(await fs.readFile(path.join(root,'design-delivery/v2/05-mockups/approved-runtime/shop-941.png')));
 let common=0;
 for(let y=0;y<1672;y++)for(let x=0;x<941;x++){
  if(y<150){if(x>=333&&x<608&&y>=19&&y<125)continue;}
  else if(y>=1498){if(y>=1512&&y<1656&&(x>=18&&x<196||x>=384&&x<562))continue;}
  else continue;
  const i=(y*941+x)*4;assert.ok(actual.data.subarray(i,i+4).equals(reference.data.subarray(i,i+4)),'Approved shell drift '+x+','+y);common++;
 }report.identicalShellPixels=common;
 async function pressChecks(tab){
  for(const button of await page.locator('button.art-control:not(:disabled)').all()){
   const box=await button.boundingBox(),clip=Object.fromEntries(Object.entries(box).map(([k,v])=>[k,Math.round(v)]));
   await page.mouse.move(939,1400);await button.evaluate(e=>e.blur());const before=await read(await page.screenshot({clip}));
   const url=await button.evaluate(e=>getComputedStyle(e).getPropertyValue('--art-image').trim().slice(4,-1).replaceAll('"',''));
   const mask=await read(url.startsWith('data:')?Buffer.from(url.split(',')[1],'base64'):await fs.readFile(path.join(root,'game',url)));
   await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();assert.ok(await button.evaluate(e=>e.classList.contains('is-pressed')));assert.deepEqual(await button.boundingBox(),box);
   const after=await read(await page.screenshot({clip}));let outside=0,frame=0,missed=0;
   for(let y=0;y<clip.height;y++)for(let x=0;x<clip.width;x++){
    const i=(y*clip.width+x)*4,a=before.data[i]+before.data[i+1]+before.data[i+2],b=after.data[i]+after.data[i+1]+after.data[i+2],delta=Math.abs(before.data[i]-after.data[i])+Math.abs(before.data[i+1]-after.data[i+1])+Math.abs(before.data[i+2]-after.data[i+2]);
    if(!mask.data[i+3]&&delta>3)outside++;
    if(mask.data[i+3]===255&&(x<clip.width*.12||x>clip.width*.88||y<clip.height*.12||y>clip.height*.88)&&Math.max(mask.data[i],mask.data[i+1],mask.data[i+2])>100&&a>30){frame++;if(b>a*.92)missed++;}
   }
   const label=await button.getAttribute('aria-label')||await button.innerText();assert.equal(outside,0,label+' alpha exterior');assert.ok(frame>25);assert.equal(missed,0,label+' full border');report.pressed.push({tab,label,outside,frame,missed});await page.mouse.move(939,1400);await page.mouse.up();
  }
 }


 await pressChecks('available');await page.locator('[data-day="1"]').click();await ready();await pressChecks('claimed');await page.locator('[data-day="7"]').click();await ready();await pressChecks('locked');
 const frames=await page.evaluate(async()=>{const {renderNineSlice}=await import('./nine-slice.js'),out=[];for(const tone of ['blue','green'])for(const [w,h] of [[901,136],[211,166],[287,166],[901,340],[410,60],[413,60],[901,242],[239,82],[901,64]])out.push({tone,w,h,url:await renderNineSlice(tone,w,h)});return out;});
 const corners={};for(const f of frames){const png=Buffer.from(f.url.split(',')[1],'base64'),parts=[];for(const [left,top] of [[0,0],[f.w-28,0],[0,f.h-28],[f.w-28,f.h-28]])parts.push(await sharp(png).extract({left,top,width:28,height:28}).raw().toBuffer());if(!corners[f.tone])corners[f.tone]=parts;else parts.forEach((p,i)=>assert.ok(p.equals(corners[f.tone][i])));report.frames.push({tone:f.tone,w:f.w,h:f.h});}
 for(const size of [{width:320,height:568},{width:390,height:844},{width:1440,height:900}]){await page.setViewportSize(size);const boxes=await page.locator('[data-day]').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));for(let day=1;day<=7;day++){await page.locator('[data-day="'+day+'"]').click();await ready();assert.deepEqual(await page.locator('[data-day]').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON())),boxes);const bad=await page.locator('.summary-title,.today,.summary-copy,.day-button strong,.day-button small,.day-reward,.detail-title,.detail-copy,.detail-reward,.detail-day,.bonus-title,.bonus-reward,.bonus-progress,.claim,.go-mission,.bonus-claim,.home-back').evaluateAll(es=>es.flatMap(e=>{const r=document.createRange();r.selectNodeContents(e);const a=r.getBoundingClientRect(),b=e.getBoundingClientRect();return a.left<b.left-.5||a.right>b.right+.5||a.top<b.top-.5||a.bottom>b.bottom+.5?[e.textContent]:[];}));assert.deepEqual(bad,[],'day '+day+' text');}
 const scene=await page.locator('.game').boundingBox(),scale=scene.width/941,home=await page.locator('.home-back').boundingBox(),bonus=await page.locator('.bonus-panel').boundingBox();assert.ok(Math.abs((scene.y+1498*scale-home.y-home.height)/scale-20)<.1);assert.ok(Math.abs((home.y-bonus.y-bonus.height)/scale-20)<.1);for(const sel of ['.summary-panel','.detail-panel','.bonus-panel','.home-back']){const r=await page.locator(sel).boundingBox();assert.ok(Math.abs((r.x-scene.x)/scale-20)<.1&&Math.abs(r.width/scale-901)<.1);}
 await page.locator('[data-day="2"]').click();await ready();await page.mouse.move(0,0);await page.locator(':focus').evaluateAll(es=>es.forEach(e=>e.blur()));if(size.width===390)await page.locator('.game').screenshot({path:path.join(root,'design-delivery/v2/05-mockups/start-v1-mobile.png')});report.viewports.push(size);}
 await page.locator('.claim').click();await ready();assert.ok(await page.locator('.claim').isDisabled());assert.equal(await page.locator('.bonus-progress').innerText(),'2 / 7 임무 보상 수령');await page.reload();await ready();assert.equal(await page.locator('.bonus-progress').innerText(),'1 / 7 임무 보상 수령');assert.equal(await page.evaluate(async()=>(await indexedDB.databases()).length),0);assert.equal(await page.evaluate(()=>localStorage.length),0);assert.deepEqual(errors,[]);await fs.writeFile(path.join(__dirname,'qa.json'),JSON.stringify(report,null,2));console.log('PASS shell '+common+'; '+report.pressed.length+' pressed; '+report.frames.length+' frames; 7 days × 3 sizes; memory only');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
