// No nation onboarding. Recruitment spans all nations; legacy saves and combat synergies survive.
const {launch,start,artifact,savedState,seed}=require('./browser-env.cjs');
const assert=require('node:assert/strict');
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await start(page,{lord:1});assert.equal(await page.locator('.faction-screen').count(),0);
 await page.screenshot({path:artifact('faction','direct-entry.png')});
 await page.locator('[data-action=profile]').click();assert.equal(await page.locator('#faction-change').count(),0);assert.match(await page.locator('#modal-body').innerText(),/모든 장수/);await page.keyboard.press('Escape');
 await page.locator('[data-action=shop]').click();await page.locator('#probabilities').click();
 assert.match(await page.locator('#modal-body').innerText(),/장수 49종/);assert.match(await page.locator('#modal-body').innerText(),/국가별 우대가 없습니다/);await page.keyboard.press('Escape');
 await seed(page,s=>{s.faction='오';s.factionChanged=true;s.gold=12345;s.heroes.sunquan.owned=true;s.heroes.sunquan.level=7;return s;});
 await page.locator('.game[aria-busy=false]').waitFor();const kept=await savedState(page);assert.equal(kept.gold,12345);assert.equal(kept.heroes.sunquan.level,7);assert.equal(await page.locator('.faction-screen').count(),0);
 await page.locator('[data-action=home]').click();await page.locator('[data-action=profile]').click();assert.equal(await page.locator('#faction-change').count(),0);await page.keyboard.press('Escape');
 assert.deepEqual(errors,[]);console.log('PASS direct entry, all-nation recruitment, no faction change, legacy save preservation');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
