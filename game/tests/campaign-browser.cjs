// Campaign list with locks, a walled battle with an enemy general, buildings and achievements.
const {launch,start,artifact,savedState,waitForSave,seed}=require('./browser-env.cjs');
const assert=require('node:assert/strict');
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 const click=selector=>page.locator(selector).first().click();
 await start(page);

 // Fresh profile: only the first battle is open; buildings are locked until the first victory.
 await click('[data-action=campaign]');
 await page.locator('.campaign-v4[aria-busy=false]').waitFor();assert.equal(await page.locator('.campaign-v4 [data-stage]').count(),9);
 assert.equal(await page.locator('.stage-card[data-status=open]').count(),1);
 await click('[data-stage=yellow_02]');await page.locator('.campaign-v4[aria-busy=false]').waitFor();assert.ok(await page.locator('#campaign-depart').isDisabled());
 await page.locator('.campaign-v4').screenshot({path:artifact('campaign','list-fresh.png')});await click('#campaign-back');
 await click('[data-action=profile]');await click('#government-open');
 await page.locator('#toast').filter({hasText:'황건 토벌'}).waitFor();await page.locator('.profile-runtime .home-back').click();

 // After clearing up to 사수관 2전투: 화웅 토벌 is open, with five wall cells and 화웅 as the round-5 general.
 await seed(page,s=>{s.gold=5000;s.campaign={cleared:true,day:null,count:0,stages:Object.fromEntries(['yellow_02','yellow_03','sishui_01','sishui_02'].map(id=>[id,{cleared:true}]))};return s;});
 await page.locator('.game[aria-busy="false"]').waitFor();
 assert.match(await page.locator('.campaign').innerText(),/사수관 · 화웅 토벌/);
 await click('[data-action=campaign]');
 await page.locator('.campaign-v4[aria-busy=false]').waitFor();assert.equal(await page.locator('.stage-card:not([data-status=locked])').count(),6);
 await page.locator('.campaign-v4').screenshot({path:artifact('campaign','list-progress.png')});
 await click('[data-stage="sishui_03"]');await page.locator('.campaign-v4[aria-busy=false]').waitFor();await click('#campaign-difficulty');await click('#campaign-details');
 assert.match(await page.locator('#modal-body').innerText(),/지나갈 수 없는 칸 5곳[\s\S]*동탁군 화웅[\s\S]*화웅 합류/);
 await page.locator('#modal').screenshot({path:artifact('campaign','detail-sishui.png')});
 await page.evaluate(()=>{crypto.getRandomValues=a=>{a[0]=11;return a;};});
 await click('#stage-depart');await page.locator('#battle-summon').waitFor();
 assert.equal((await waitForSave(page,s=>s.battleRun)).battleRun.stageId,'sishui_03');
 assert.equal(await page.locator('.battle-cell.blocked').count(),5);
 assert.match(await page.locator('.battle-title').innerText(),/사수관/);
 for(const [x,y] of [[3,3],[4,3]]){await click('#battle-summon');await click('.bench-cell [data-unit]');await click(`.battle-cell[data-x="${x}"][data-y="${y}"]`);}
 await waitForSave(page,s=>s.battleRun.units.filter(u=>u.y>=0).length===2);
 await page.screenshot({path:artifact('campaign','prepare-sishui.png')});
 await click('#battle-start');await click('[data-speed="3"]');
 const fought=await waitForSave(page,s=>s.battleRun.battle?.tick>=40||s.battleRun.phase==='result',{timeout:30000});
 assert.equal(fought.battleRun.battle.blocked.length,5);
 assert.ok(fought.battleRun.battle.units.every(u=>!fought.battleRun.battle.blocked.includes(u.x+','+u.y)));
 await page.screenshot({path:artifact('campaign','battle-sishui.png')});
 await page.locator('.battle-result').waitFor({timeout:60000});
 await click('#battle-exit');await click('[data-dialog-confirm]');await waitForSave(page,s=>s.battleRun===null);

 await click('#campaign-back');
 // Buildings: unlocked now; upgrade the farm and see the new rate.
 await click('[data-action=profile]');await click('#government-open');await page.locator('.government-runtime[aria-busy=false]').waitFor();
 assert.match(await page.locator('.government-runtime .detail-effect').innerText(),/시간당 골드 30/);
 await click('.government-runtime .upgrade');
 const upgraded=await waitForSave(page,s=>s.government?.levels?.farm===2);assert.equal(upgraded.gold,4900);
 await page.locator('.government-runtime .detail-title').filter({hasText:'Lv.2'}).waitFor();
 await page.locator('.government-runtime').screenshot({path:artifact('campaign','government.png')});await click('.government-runtime .home-back');

 // Achievements: the first-clear achievement is claimable once.
 await click('[data-action=quests]');
 await page.locator('.missions-v1[aria-busy=false]').waitFor();await click('.missions-v1 [data-tab=achievement]');await page.locator('.missions-v1[aria-busy=false]').waitFor();await click('[data-quest="ach_first_clear"] button');
 assert.equal((await waitForSave(page,s=>s.services?.achievements?.ach_first_clear)).gold,5000);
 await page.locator('[data-quest="ach_first_clear"] button[disabled]').waitFor();
 await page.locator('.missions-v1').screenshot({path:artifact('campaign','achievements.png')});
 assert.deepEqual(errors,[]);console.log('PASS campaign locks and progress, walled battle with an enemy general, building upgrade, achievement claim');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
