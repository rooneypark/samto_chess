const {launch,artifact}=require('../../tests/browser-env.cjs'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../..'),ids=['1','xuchu','32','35','diaochan','119'];
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:941,height:1672}}),errors=[],report={sources:{},viewports:[]};page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 for(const id of ids)report.sources[id]=crypto.createHash('sha256').update(await fs.readFile(path.join(root,'game/assets/generals-v2/'+id+'-front.png'))).digest('hex');
 await page.goto('http://127.0.0.1:8780/game/previews/portraits-v1/index.html');const ready=()=>page.locator('.game[aria-busy=false]').waitFor();await ready();
 await page.screenshot({path:path.join(root,'design-delivery/v2/05-mockups/portraits-v1.png')});
 for(const size of [{width:941,height:1672},{width:390,height:844},{width:320,height:568}]){
  await page.setViewportSize(size);const original=await page.locator('.portrait-viewport').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));
  for(const id of ids){await page.locator('.portrait-card[data-hero="'+id+'"]').click();await ready();assert.deepEqual(await page.locator('.portrait-viewport').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON())),original,'Selection preserves portrait geometry');}
  const geometry=await page.evaluate(async()=>{const {portraitCrops}=await import('./previews/portraits-v1/crops.js');return [...document.querySelectorAll('.portrait-viewport')].map(slot=>{const id=slot.parentElement.dataset.hero,a=portraitCrops[id],img=slot.querySelector('img'),b=slot.getBoundingClientRect(),r=img.getBoundingClientRect(),s=r.width/img.naturalWidth;return {id,eye:(r.y+a.eyes*s-b.y)/b.height,face:a.faceWidth*s/b.width,aspectError:Math.abs(r.width/r.height-img.naturalWidth/img.naturalHeight),source:img.getAttribute('src')};});});
  for(const g of geometry){assert.ok(Math.abs(g.eye-.56)<.002,g.id+' eye baseline');assert.ok(Math.abs(g.face-.45)<.002,g.id+' face width');assert.ok(g.aspectError<.001,g.id+' source aspect');assert.equal(g.source,'assets/generals-v2/'+g.id+'-front.png');}
  const clipped=await page.locator('.art-header-title,.scroll-heading,.portrait-card strong,.roster-example strong,.roster-example small,.roster-heading,.portrait-note').evaluateAll(es=>es.flatMap(e=>{const b=e.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(e);const r=range.getBoundingClientRect();return r.left<b.left-.5||r.right>b.right+.5||r.top<b.top-.5||r.bottom>b.bottom+.5?[e.textContent]:[];}));assert.deepEqual(clipped,[]);
  await page.locator('.portrait-card[data-hero="1"]').click();await ready();await page.locator(':focus').evaluateAll(es=>es.forEach(e=>e.blur()));await page.mouse.move(0,0);
  await page.screenshot({path:artifact('portraits-v1','preview-'+size.width+'.png')});if(size.width===390)await page.locator('.game').screenshot({path:path.join(root,'design-delivery/v2/05-mockups/portraits-v1-mobile.png')});report.viewports.push(size);
 }
 assert.equal(await page.evaluate(async()=>(await indexedDB.databases()).length),0);assert.equal(await page.evaluate(()=>localStorage.length),0);assert.deepEqual(errors,[]);
 for(const id of ids)assert.equal(crypto.createHash('sha256').update(await fs.readFile(path.join(root,'game/assets/generals-v2/'+id+'-front.png'))).digest('hex'),report.sources[id]);
 await fs.writeFile(path.join(__dirname,'qa.json'),JSON.stringify(report,null,2));console.log('PASS 6 unchanged front sources; 12 portrait viewports with aligned eyes/face width; selected geometry; 3 sizes; no player storage');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
