const {launch,start,artifact,seed,waitForSave}=require('./browser-env.cjs');
const assert=require('node:assert/strict');
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:941,height:1672}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
 page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await start(page);
 await seed(page,(s,{battleRun})=>{
  s.order=['xuchu','1','119','32','35','diaochan'];for(const id of [...s.order,'archer'])s.heroes[id].owned=true;
  const r=battleRun.newRun(s,7,'battle-ui-review');r.capacity=6;r.silver=7;
  r.units=s.order.map((hero,i)=>({id:i+1,hero,rank:i<3?2:1,x:[1,3,6,1,3,6][i],y:i<3?2:0,cost:3}));
  r.units.push({id:7,hero:'32',rank:1,x:0,y:-1,cost:3},{id:8,hero:'archer',rank:1,x:1,y:-1,cost:3});r.nextId=9;
  r.gear=[{type:'sword',rank:1},{type:'armor',rank:1},{type:'bow',rank:1}];s.battleRun=r;return s;
 });
 await page.locator('.battle-v2').waitFor();await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('.battle-cell').count(),64);assert.equal(await page.locator('.bench-cell').count(),8);
 assert.match(await page.locator('#battle-bonds').innerText(),/위 2.*촉 2.*군웅 2|위 2.*군웅 2.*촉 2/);
 await page.locator('.battle-position [data-unit="4"]').click();
 await page.locator('.battle-screen').screenshot({path:artifact('battle-v2','prepare-native.png')});
 await page.locator('#battle-bonds').focus();await page.keyboard.press('Enter');await page.locator('#modal[open]').waitFor();assert.match(await page.locator('#modal-body').innerText(),/패도|인덕|난세/);await page.keyboard.press('Escape');
 // Equip the selected actual unit and consume the actual inventory item.
 await page.locator('[data-gear="0"]').click();await waitForSave(page,s=>s.battleRun.units.find(u=>u.id===4).gear?.type==='sword');
 // Merge the bench Cao Cao into deployed Cao Cao, preserving rank and equipment.
 await page.locator('.battle-position [data-unit="4"]').click();
 await page.locator('.bench-cell [data-unit="7"]').click();await page.locator('.battle-position [data-unit="4"]').click();
 await waitForSave(page,s=>s.battleRun.units.find(u=>u.id===4).rank===2);assert.equal(await page.locator('.bench-heading>span').innerText(),'대기 1/8');assert.ok(await page.locator('[data-unit="4"] .unit-rank').evaluate(e=>e.classList.contains('motion-merge')),'Committed merge lights the rank diamonds');
 await page.locator('.bench-cell [data-unit="8"]').click();await page.locator('#battle-sell').click();await waitForSave(page,s=>!s.battleRun.units.some(u=>u.id===8));
 await page.locator('#battle-summon').click();await waitForSave(page,s=>s.battleRun.units.some(u=>u.id===9));
 for(const viewport of [{width:360,height:640},{width:390,height:844},{width:1440,height:900}]){
  await page.setViewportSize(viewport);assert.equal(await page.locator('.battle-screen').evaluate(e=>e.scrollHeight>e.clientHeight+1),false);
  await page.screenshot({path:artifact('battle-v2',`prepare-${viewport.width}.png`)});
 }
 await page.locator('#battle-start').click();await page.locator('#battle-header-pause').click();
 // The approved heroes must retain their independent art when combat starts.
 for(const [index,id] of ['xuchu','1','119','32','35','diaochan'].entries())assert.match(await page.locator(`.battle-position [data-unit="${index+1}"] img`).getAttribute('src'),new RegExp('/characters/v1/'+id+'/(front|side|back)\\.png$'));
 await page.screenshot({path:artifact('battle-v2','live-paused.png')});
 assert.match(await page.locator('.battle-auto').innerText(),/일시 정지/);assert.equal(await page.locator('.battle-cell').count(),64);
 await page.locator('#battle-header-pause').click();await page.locator('[data-speed="3"]').click();await page.locator('.battle-result').waitFor({timeout:60000});
 await page.screenshot({path:artifact('battle-v2','result.png')});
 assert.deepEqual(errors,[]);console.log('PASS approved battle UI: 64 cells, 8 slots, mixed synergies, equipment, merge, sell, summon, responsive, live combat and result');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
