const {launch}=require('../../tests/browser-env.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'../../..');
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:941,height:650}}),errors=[],report={buttons:[],viewports:[]};page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 await page.goto('http://127.0.0.1:8780/game/previews/campaign-v3/index.html');await page.locator('.game[aria-busy=false]').waitFor();await page.locator('.game').screenshot({path:path.join(root,'design-delivery/v2/05-mockups/campaign-landmarks-v3.png')});
 for(const article of await page.locator('article').all()){
  const button=article.locator('button'),sprite=article.locator('canvas'),box=await button.boundingBox(),spriteBefore=await sprite.evaluate(e=>e.toDataURL());
  await button.click();await page.waitForTimeout(70);assert.equal(await button.getAttribute('aria-pressed'),'true');assert.deepEqual(await button.boundingBox(),box);assert.equal(await sprite.evaluate(e=>e.toDataURL()),spriteBefore,'Selected preserves identical sprite pixels');
  const art=await button.evaluate(e=>e.style.getPropertyValue('--art-image'));await page.mouse.down();assert.equal(await button.evaluate(e=>e.classList.contains('is-pressed')),true);assert.deepEqual(await button.boundingBox(),box);
  assert.equal(await button.evaluate(e=>e.style.getPropertyValue('--art-image')),art);assert.equal(await button.evaluate(e=>getComputedStyle(e,'::after').maskImage),art.trim());await page.mouse.move(940,640);await page.mouse.up();
  report.buttons.push({name:await button.innerText(),selectedSpriteUnchanged:true,pressedMaskMatches:true,geometryUnchanged:true});
 }
 await page.locator('article').first().locator('button').click();
 for(const width of [320,390,941]){await page.setViewportSize({width,height:650});await page.waitForTimeout(100);const clipped=await page.locator('button').evaluateAll(es=>es.filter(e=>{const r=document.createRange();r.selectNodeContents(e);const t=r.getBoundingClientRect(),b=e.getBoundingClientRect();return t.left<b.left||t.right>b.right||t.top<b.top||t.bottom>b.bottom;}).map(e=>e.innerText));assert.deepEqual(clipped,[]);report.viewports.push(width);}
 assert.deepEqual(errors,[]);assert.equal(await page.evaluate(async()=>(await indexedDB.databases()).length),0);await fs.writeFile(path.join(__dirname,'qa.json'),JSON.stringify(report,null,2));console.log('PASS: 3 selected/pressed controls, unchanged sprite pixels, 3 widths, no player save access');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
