// The temporary art-test mode is retired; old links must load the real profile.
const {launch,start,seed,baseUrl,savedState,waitForSave,artifact}=require('./browser-env.cjs');
const assert=require('node:assert/strict'),verifyButtonAlpha=require('./button-alpha.cjs');
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:941,height:1672}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await start(page);
 await seed(page,(s,{battleRun})=>{s.gold=12345;const r=battleRun.newRun(s,17,'normal-player-run');r.capacity=3;r.silver=99;r.units=s.order.slice(0,3).map((hero,i)=>({id:i+1,hero,rank:1,x:[1,3,6][i],y:2,cost:3}));r.nextId=4;s.battleRun=r;return s;});
 await page.locator('.battle-v2[aria-busy=false]').waitFor();const original=await savedState(page);
 await page.goto(baseUrl+'?art-test=1#home');await page.locator('.battle-v2[aria-busy=false]').waitFor();
 assert.equal(new URL(page.url()).searchParams.has('art-test'),false);assert.equal(await page.locator('.art-test-controls').count(),0);assert.deepEqual(await savedState(page),original);
 assert.equal(await page.locator('.battle-position:not(:has(.enemy))').count(),3);
 // Keep the real + button alpha and capacity transaction regression after retirement.
 const plus=page.locator('#battle-capacity'),box=await plus.boundingBox(),clip=Object.fromEntries(Object.entries(box).map(([k,v])=>[k,Math.round(v)])),normal=await page.screenshot({clip});
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();assert.equal(await page.locator('#battle-capacity.is-pressed').count(),1);
 const pressed=await page.screenshot({clip,path:artifact('battle-feedback','capacity-pressed.png')});await verifyButtonAlpha('capacity',normal,pressed);await page.mouse.up();await page.locator('[data-dialog-confirm]').click();
 const expanded=await waitForSave(page,s=>s.battleRun?.capacity===4&&s.battleRun?.silver===95);assert.equal(expanded.gold,12345);assert.deepEqual(expanded.order,original.order);
 await page.goto(baseUrl+'?art-test=1');await page.locator('.battle-v2[aria-busy=false]').waitFor();assert.deepEqual(await savedState(page),expanded);
 assert.deepEqual(errors,[]);console.log('PASS retired test URL: normal profile, original roster and active run preserved; real capacity button alpha and transaction');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
