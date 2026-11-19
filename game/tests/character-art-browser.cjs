const {launch,start,seed,savedState,artifact}=require('./browser-env.cjs');
const assert=require('node:assert/strict');
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:941,height:1672}}),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});page.on('request',r=>requests.push(r.url()));
 await start(page);await seed(page,s=>{for(const h of Object.values(s.heroes))h.owned=true;s.order=['1','2','15','xuchu','35','diaochan'];return s;});
 await page.locator('.game[aria-busy=false]').waitFor();const before=await savedState(page),base=page.url().split('#')[0];
 for(const width of [941,390,320]){
  await page.setViewportSize({width,height:width===941?1672:844});
  for(const route of ['home','barracks','shop','alliance','arena','codex','formation','expedition','profile','sSelect','campaign','missions','mail','start','tower','government','treasure','settings','strategy','exchange','rates','pickupRates','products','meritShop','arenaRanking','arenaHistory','arenaSeason','arenaOpponents']){
   await page.goto(base+'#'+route);await page.locator('.game[aria-busy=false]').waitFor();
   await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode()));});
   const bad=await page.locator('img:visible').evaluateAll(es=>es.filter(i=>/assets\/(generals-v2|heroes)\/|assets\/gate-lobby\/(1|119|32|35|xuchu|diaochan)\.png/.test(i.src)).map(i=>i.src));assert.deepEqual(bad,[],route);
   if(route==='home')assert.deepEqual(await page.locator('.party .hero').evaluateAll(es=>es.map(e=>e.dataset.gateHero)),before.order);
   if(route==='shop'||route==='alliance'){
    const types=await page.locator(`.${route}-v2 .general-lineup img`).evaluateAll(async es=>{const {generals}=await import('./character-art.js');return es.map(e=>generals[e.dataset.hero].family);});
    assert.equal(types.length,route==='shop'?6:2);assert.equal(new Set(types).size,types.length,'Decorative classes are mixed');
   }
   if(['home','barracks','shop','arena','codex'].includes(route))await page.screenshot({path:artifact('character-art',`${route}-${width}.png`)});
  }
 }
 await page.goto(base+'#barracks');await page.locator('.game[aria-busy=false]').waitFor();
 const ids=await page.locator('.roster-card').evaluateAll(es=>es.map(e=>e.dataset.hero));assert.equal(ids.length,49);
 for(const id of ids){await page.locator(`.roster-card[data-hero="${id}"]`).click();const image=page.locator('.hero-stage img');assert.equal(await image.getAttribute('src'),`../art-source/characters/v1/${id}/front.png`);await image.evaluate(i=>i.decode());}
 // Review every original together at the exact same logical canvas size.
 await page.evaluate(async()=>{const {generals}=await import('./character-art.js');const host=document.createElement('div');host.id='character-review';host.style='position:absolute;left:0;top:0;height:auto;background:#26384b;z-index:99999;display:grid;grid-template-columns:repeat(7,180px);width:1260px';for(const [id,g]of Object.entries(generals)){const box=document.createElement('div');box.style='height:200px;text-align:center;color:white';box.innerHTML=`<img src="${g.views.front.url}" style="width:180px;height:180px;image-rendering:pixelated"><br>${g.name}`;host.append(box);}document.body.append(host);await Promise.all([...host.querySelectorAll('img')].map(i=>i.decode()));});
 await page.locator('#character-review').screenshot({path:artifact('character-art','roster-49.png')});await page.locator('#character-review').evaluate(e=>e.remove());
 assert.deepEqual(await savedState(page),before,'Viewing every screen and selecting heroes does not alter the profile');assert.deepEqual(errors,[]);
 assert.ok(!requests.some(u=>/\/shop-v2\/recruit-hall-v3.png/.test(u)),'No baked legacy lineup');
 console.log('PASS 49 barracks originals, 84 screen/size combinations, mixed decorative lineups, actual formation, approved portraits, no failed assets or profile changes');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
