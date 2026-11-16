const {launch,start,baseUrl,artifact,savedState,waitForSave,seed}=require('./browser-env.cjs');
const assert=require('node:assert/strict');
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await start(page);await page.evaluate(()=>document.fonts.ready);
 // Fund the isolated fixture for training and the later guild creation fee.
 await seed(page,s=>{s.gold=5000;return s;});await page.locator('.game[aria-busy=false]').waitFor();
 const click=selector=>page.locator(selector).first().click();
 const close=()=>page.keyboard.press('Escape');
 async function capture(name){await page.locator('#modal').waitFor();assert.equal(await page.locator('#modal').evaluate(e=>e.scrollWidth>e.clientWidth+1),false,name);await page.locator('#modal').screenshot({path:artifact('dialogs',name+'.png')});}
 for(const key of ['profile','wallet','settings','campaign']){await click('[data-action='+key+']');if(key==='campaign'){await page.locator('.campaign-v4[aria-busy=false]').waitFor();await click('#campaign-catalog');}await capture(key);await close();if(key==='campaign')await click('#campaign-back');}
 await click('[data-action=barracks]');
 // The six original-art previews lead the roster; choose an actually owned hero for growth.
 await click('[data-hero="15"]');
 for(const [key,name] of [['train','training'],['awaken','awakening-shortage'],['hero-skill','skill'],['treasure-open','treasure-empty'],['barracks-formation','formation']]){await click('#'+key);await capture(name);await close();}
 await click('#train');await click('#growth-confirm');await page.locator('.hero-level').filter({hasText:'Lv.2'}).waitFor();await waitForSave(page,s=>s.heroes['15'].level===2);
 await click('#treasure-open');await click('#treasure-shop');assert.equal(new URL(page.url()).hash,'#shop');
 await click('[data-currency=gold][data-count="1"]');await capture('recruit');await click('#purchase-cancel');await click('#probabilities');await capture('probabilities');await close();
 await click('[data-action=alliance]');await click('#guild-search');await capture('guild-search');await page.locator('#guild-query').fill('존재하지않음');await capture('guild-search-empty');await click('#guild-search-reset');assert.equal(await page.locator('[data-join]').count(),3);await close();
 await click('#guild-create-button');await capture('guild-create');await page.locator('[name=name]').fill('청운동맹');await click('#guild-create button');await page.locator('#modal').waitFor({state:'hidden'});
 assert.equal(await page.locator('#guild-search,#guild-create-button').count(),0,'Created guild hides search/create');
 await click('#guild-manage');assert.equal(await page.locator('#guild-search,#guild-create-button').count(),0,'Leader management has no search/create');await capture('guild-manage');await page.locator('[name=notice]').fill('공지를 저장합니다');await click('#guild-notice button');await page.locator('#modal').waitFor({state:'hidden'});assert.match(await page.locator('.guild-notice').innerText(),/공지를 저장합니다/);
 await click('#guild-manage');await click('#guild-applications');await capture('guild-applications');await click('[data-approve=cloud]');await page.locator('#modal').waitFor({state:'hidden'});await click('#guild-members');await click('[data-member=cloud]');await capture('guild-member');await close();await click('#guild-log');await capture('guild-log');await close();
 await click('[data-action=arena]');for(const key of ['rules','rank','opponent']){if(key==='opponent')await click('#arena-rules');await click('#arena-'+key);await capture('arena-'+key);await close();}await click('#arena-start');await capture('arena-start');await click('[data-dialog-confirm]');await page.locator('#battle-start').waitFor();await click('#battle-exit');await capture('arena-cancel');await click('[data-dialog-confirm]');await page.locator('#modal').waitFor({state:'hidden'});
 assert.deepEqual(errors,[]);console.log('PASS dialog layouts/actions across all five tabs');
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exit(1)});
