// A design art set (backgrounds, icons, portraits): default on, every image loads, and the settings switch
// returns to the original images. Screenshots go to test-artifacts/art/.
const {launch,start,artifact,waitForSave}=require('./browser-env.cjs');
const assert=require('node:assert/strict');
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 const click=selector=>page.locator(selector).first().click();
 const background=selector=>page.locator(selector).first().evaluate(e=>getComputedStyle(e).backgroundImage);
 const shot=name=>page.screenshot({path:artifact('art',name+'.png')});

 await start(page);
 assert.equal(await page.evaluate(()=>document.documentElement.dataset.art),'a');
 assert.match(await background('.castle'),/gate-lobby\/scene\.png/);
 assert.match(await background('.icon-gold'),/design-a\/icons-24\.png/);
 assert.match(await page.locator('.profile img').getAttribute('src'),/design-a\/portraits\/0\.png/);
 await shot('gate');
 await click('[data-action=barracks]');assert.match(await background('.barracks-screen'),/barracks-v2\/scene\.png/);
 assert.match(await page.locator('.barracks-screen img[src*="design-a/portraits/"]').first().getAttribute('src'),/portraits/);await shot('barracks');
 await click('[data-action=shop]');assert.match(await background('.shop-v2 .hall'),/shop-v2\/recruitment-hall\.png/);await shot('shop');
 await click('[data-action=alliance]');await page.locator('.alliance-v2[aria-busy=false]').waitFor();assert.match(await background('.alliance-v2 .environment'),/alliance-v2\/headquarters\.png/);await shot('alliance');
 await click('[data-action=arena]');assert.match(await background('.arena-v2 .environment'),/arena-v2\/courtyard\.png/);await shot('arena');
 await click('[data-action=home]');
 await page.evaluate(()=>{crypto.getRandomValues=a=>{a[0]=7;return a;};});
 await click('[data-action=depart]');
 for(const [x,y] of [[2,3],[4,3]]){await click('#battle-summon');await click('.bench-cell [data-unit]');await click(`.battle-cell[data-x="${x}"][data-y="${y}"]`);}
 await waitForSave(page,s=>s.battleRun?.units.filter(u=>u.y>=0).length===2);
 assert.equal(await page.locator('.battle-screen').getAttribute('data-scene'),'yellow');
 assert.match(await background('.battle-screen'),/battle-v2\/scene\.png/);await shot('battle-prepare');
 await click('#battle-start');await waitForSave(page,s=>s.battleRun.battle?.tick>=30);await shot('battle-live');
 // Every image on the page decoded (a missing portrait or background would show as a broken image).
 assert.deepEqual(await page.evaluate(()=>[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src)),[]);

 // Old style preferences resolve to the approved runtime.
 await page.evaluate(()=>localStorage.setItem('samguk.artSet','classic'));await page.reload();await page.locator('.battle-v2').waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.dataset.art),'a');
 assert.deepEqual(errors,[]);console.log('PASS design art set: backgrounds, icons, portraits, battle scene, legacy style preference');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
