const {launch,artifact}=require('../../tests/browser-env.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const sharp=require('../../../design-delivery/v1/a-production/tools/node_modules/sharp');
(async()=>{
 const entries=JSON.parse(fs.readFileSync(path.join(__dirname,'data.json'),'utf8'));
 for(const e of entries){
  const [a,b]=await Promise.all([sharp(e.source).ensureAlpha().raw().toBuffer(),sharp(path.join(__dirname,e.file)).ensureAlpha().raw().toBuffer()]);assert.equal(a.length,b.length);
  for(let i=0;i<a.length;i+=4){assert.equal(a[i+3],b[i+3],`${e.id} alpha`);if(a[i+3])for(let c=0;c<3;c++)assert.equal(a[i+c],b[i+c],`${e.id} visible RGB`);}
 }
 const browser=await launch();try{
  const page=await browser.newPage({viewport:{width:1280,height:960}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto('http://127.0.0.1:8780/game/previews/critical-cutins-v1/');await page.waitForFunction(()=>document.querySelectorAll('.card').length===49);
  await page.evaluate(async()=>{await Promise.all([...document.querySelectorAll('.card img')].map(im=>{im.loading='eager';return im.decode();}));});
  for(const width of [1280,390,320]){
   await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.locator('[data-id="32"]').click();await page.locator('dialog img').evaluate(im=>im.decode());
   assert.equal(await page.locator('dialog h2').textContent(),'조조');
   const button=page.locator('#play'),box=await button.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();assert.ok(await button.evaluate(e=>e.classList.contains('is-pressed')));assert.deepEqual(await button.boundingBox(),box);await page.mouse.up();
   await page.waitForFunction(()=>!document.querySelector('dialog img').classList.contains('playing'));
   await page.screenshot({path:artifact(`cutin-caocao-${width}.png`)});await page.keyboard.press('Escape');assert.equal(await page.locator('dialog').evaluate(e=>e.open),false);
  }
  for(const faction of ['촉','위','오','군웅']){await page.selectOption('#faction',faction);assert.equal(await page.locator('.card').count(),entries.filter(e=>e.faction===faction).length);}
  await page.selectOption('#faction','');
  for(const bg of ['light','contrast','checker','dark']){await page.selectOption('#background',bg);assert.equal(await page.locator('body').getAttribute('data-background'),bg);}
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-id="0"]').click();await page.locator('#play').click();assert.equal(await page.locator('dialog img').evaluate(e=>getComputedStyle(e).animationName),'none');await page.locator('#close').click();
  assert.deepEqual(await page.evaluate(async()=>({local:localStorage.length,db:(await indexedDB.databases()).length})),{local:0,db:0});assert.deepEqual(errors,[]);
  await page.setViewportSize({width:1280,height:960});await page.screenshot({path:artifact('cutin-gallery.png'),fullPage:true});
  console.log('PASS: 49 lossless RGBA pairs, gallery decode/filter, 3 widths, dialog/replay/pressed, 4 backgrounds, reduced motion, zero save access');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
