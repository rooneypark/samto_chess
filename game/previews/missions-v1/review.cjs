const {launch,artifact}=require('../../tests/browser-env.cjs');
const sharp=require('../../../design-delivery/v1/a-production/tools/node_modules/sharp');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),read=buffer=>sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:941,height:1672},deviceScaleFactor:1}),errors=[],report={pressed:[],frames:[],viewports:[],states:[]};
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 const ready=()=>page.locator('.game[aria-busy=false]').waitFor();
 await page.goto('http://127.0.0.1:8780/game/previews/missions-v1/index.html');await ready();await page.waitForTimeout(150);await page.mouse.move(939,1400);
 const shot=await page.screenshot({path:path.join(root,'design-delivery/v2/05-mockups/missions-v1.png')}),actual=await read(shot),reference=await read(await fs.readFile(path.join(root,'design-delivery/v2/05-mockups/approved-runtime/shop-941.png')));
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
 const before=await page.locator('[data-tab]').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));
 for(const tab of ['day','week','achievement']){
  await page.locator('[data-tab='+tab+']').click();await ready();await page.mouse.move(939,1400);await page.locator(':focus').evaluateAll(es=>es.forEach(e=>e.blur()));
  assert.deepEqual(await page.locator('[data-tab]').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON())),before,'Selected geometry unchanged');
  assert.equal(await page.locator('.mission').count(),tab==='week'?5:tab==='day'?4:3);
  await page.screenshot({path:artifact('missions-v1',tab+'.png')});await pressChecks(tab);report.states.push(tab);
 }
 const frames=await page.evaluate(async()=>{const {renderNineSlice}=await import('./nine-slice.js'),out=[];for(const tone of ['blue','green'])for(const [w,h] of [[901,254],[120,110],[289,74],[901,116],[901,90],[901,146],[239,74],[901,64]])out.push({tone,w,h,url:await renderNineSlice(tone,w,h)});return out;});
 const corners={};for(const f of frames){const png=Buffer.from(f.url.split(',')[1],'base64'),parts=[];
  for(const [left,top] of [[0,0],[f.w-28,0],[0,f.h-28],[f.w-28,f.h-28]])parts.push(await sharp(png).extract({left,top,width:28,height:28}).raw().toBuffer());
  if(!corners[f.tone])corners[f.tone]=parts;else parts.forEach((part,i)=>assert.ok(part.equals(corners[f.tone][i]),'Fixed corner ornament'));report.frames.push({tone:f.tone,width:f.w,height:f.h,identicalCorners:true});
 }
 for(const size of [{width:320,height:568},{width:390,height:844},{width:1440,height:900}]){
  await page.setViewportSize(size);
  for(const tab of ['day','week','achievement']){
   await page.locator('[data-tab='+tab+']').click();await ready();await page.mouse.move(0,0);await page.locator(':focus').evaluateAll(es=>es.forEach(e=>e.blur()));
   const boundary=await page.locator('.attendance-panel').boundingBox();
   const scene=await page.locator('.game').boundingBox(),home=await page.locator('.home-back').boundingBox(),note=await page.locator('.mail-note').boundingBox(),panel=await page.locator('.bonus-panel').boundingBox(),scale=scene.width/941;
   assert.ok(Math.abs((scene.y+1498*scale-home.y-home.height)/scale-20)<.1,'Footer gap 20');
   assert.ok(Math.abs((home.y-note.y-note.height)/scale-12)<.1,'Above button gap 12');
   assert.ok(Math.abs((note.y-panel.y-panel.height)/scale-12)<.1,'Above note gap 12');
   const last=await page.locator('.mission').last().boundingBox(),bonus=await page.locator('.bonus-panel').boundingBox();assert.ok(last.y+last.height<bonus.y,'Rows clear bonus panel');
   for(const el of await page.locator('.mission,.bonus-panel,.home-back').all()){const b=await el.boundingBox();assert.ok(Math.abs(b.x-boundary.x)<.1&&Math.abs(b.x+b.width-boundary.x-boundary.width)<.1,'Common outside alignment');}
   const clipped=await page.locator('.attendance-title,.attendance-copy,.day,.mission h3,.mission .reward,.progress-label,.mission button,.bonus-title,.bonus-rewards,.bonus-copy,.bonus-claim,.section-tabs button,.mail-note,.home-back').evaluateAll(es=>es.flatMap(e=>{const b=e.getBoundingClientRect(),w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),bad=[];while(w.nextNode()){if(!w.currentNode.textContent.trim())continue;const r=document.createRange();r.selectNodeContents(w.currentNode);const t=r.getBoundingClientRect();if(t.left<b.left-.5||t.right>b.right+.5||t.top<b.top-.5||t.bottom>b.bottom+.5)bad.push(w.currentNode.textContent);}return bad;}));assert.deepEqual(clipped,[],tab+' text containment');
   assert.equal(await page.locator('.game').evaluate(e=>e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1),false);
   await page.screenshot({path:artifact('missions-v1',tab+'-'+size.width+'.png')});if(size.width===390&&tab==='day')await page.locator('.game').screenshot({path:path.join(root,'design-delivery/v2/05-mockups/missions-v1-mobile.png')});
  }report.viewports.push(size);
 }
 await page.locator('[data-tab=day]').click();await ready();await page.locator('.attendance-claim').click();await ready();assert.equal(await page.locator('[data-field=diamonds]').innerText(),'340');assert.ok(await page.locator('.attendance-claim').isDisabled());
 await page.locator('[data-quest=daily_run] button').click();await ready();assert.equal(await page.locator('[data-field=gold]').innerText(),'12,500');assert.ok(await page.locator('[data-quest=daily_run] button').isDisabled());assert.equal(await page.locator('.bonus-claim').innerText(),'2 / 4 수령');
 await page.locator('[data-tab=achievement]').click();await ready();await page.locator('[data-quest=ach_first_clear] button').click();await ready();assert.equal(await page.locator('[data-field=gold]').innerText(),'12,600');
 await page.reload();await ready();assert.equal(await page.locator('[data-field=gold]').innerText(),'12,450');assert.equal(await page.locator('[data-field=diamonds]').innerText(),'320');
 assert.equal(await page.evaluate(async()=> (await indexedDB.databases()).length),0);assert.equal(await page.evaluate(()=>localStorage.length),0);assert.deepEqual(errors,[]);
 report.memoryOnlyClaims=true;await fs.writeFile(path.join(__dirname,'qa.json'),JSON.stringify(report,null,2));console.log('PASS shared shell '+common+' pixels; '+report.pressed.length+' pressed states; '+report.frames.length+' nine-slice sizes; 3 tabs × 3 viewports; memory-only claims');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
