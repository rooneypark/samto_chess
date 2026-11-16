const {launch,start,baseUrl,artifact,savedState,waitForSave,seed}=require('./browser-env.cjs');
const assert=require('node:assert/strict');
(async()=>{const b=await launch();try{
 const p=await b.newPage({viewport:{width:1000,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 const click=s=>p.locator(s).click(),saved=()=>savedState(p);
 const confirm=async()=>{await click('#purchase-confirm');await p.locator('.result-card').first().waitFor();};
 const ack=async(go=false)=>{await click(go?'#result-barracks':'#result-confirm');await p.waitForFunction(()=>!document.querySelector('#modal').open);if(go)await p.locator('.barracks-screen').waitFor();};
 await start(p,{hash:'#shop'});await click('[data-currency=gold][data-count="1"]');await click('#purchase-cancel');assert.equal((await saved()).gold,500);
 await click('[data-currency=gold][data-count="1"]');await confirm();assert.equal((await saved()).gold,200);await p.reload();await p.locator('.result-card').waitFor();await ack(true);await click('[data-action=shop]');assert.ok(await p.locator('[data-currency=gold][data-count="1"]').isDisabled());
 await seed(p,s=>{Object.assign(s,{gold:12450,diamonds:320,freeDiamonds:320,paidDiamonds:0,heroTokens:20,treasureTokens:20});s.shop.pity.hero.s=99;return s;});
 await click('[data-select-currency=diamonds]');await click('[data-currency=diamonds][data-count="1"]');await confirm();await ack(true);assert.match(await p.locator('.hero-stage .grade').innerText(),/S/);
 await click('[data-action=shop]');await click('#shop-exchange');await click('[data-buy=gold]');await confirm();await ack();assert.equal((await saved()).gold,12750);assert.equal((await saved()).diamonds,120);
 await click('#shop-exchange');await click('[data-buy=hero]');await click('[data-choice="32"]');await confirm();await ack(true);assert.match(await p.locator('.hero-info h3').innerText(),/조조/);
 await click('#barracks-formation');await p.locator('#replace-hero').selectOption('32');await click('#replace-party');await click('#save-party');await click('[data-action=home]');assert.match(await p.locator('.hero').first().getAttribute('aria-label'),/조조/);
 await click('[data-action=shop]');await click('[data-pool=treasure]');await click('[data-select-currency=gold]');await click('[data-currency=gold][data-count="10"]');await confirm();assert.equal(await p.locator('.result-card').count(),10);await ack();
 await click('#shop-exchange');await click('[data-buy=treasure]');await p.locator('[data-choice]').first().click();await confirm();await ack();await click('[data-action=barracks]');await click('#treasure-open');assert.equal(await p.locator('.treasure-card').count(),11);await p.locator('[data-equip]').first().click();await waitForSave(p,s=>Object.values(s.heroes).some(h=>h.treasure));await p.waitForFunction(()=>document.querySelector('#modal').getAttribute('aria-busy')==='false');await p.keyboard.press('Escape');await click('[data-action=shop]');await click('[data-pool=hero]');
 await p.evaluate(()=>document.fonts.ready);
 for(const [width,height] of [[320,568],[390,844],[844,390],[1000,1000]]){await p.setViewportSize({width,height});assert.equal(await p.locator('.shop-screen').evaluate(e=>e.scrollWidth>e.clientWidth+1),false);if(width===390)await p.screenshot({path:artifact('shop','mobile.png')});if(width===1000)await p.screenshot({path:artifact('shop','desktop.png')});}
 assert.deepEqual(errors,[]);console.log('PASS shop purchase/recruit, currency, reload recovery, new hero in barracks/formation, treasure inventory/equip, four viewports');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
