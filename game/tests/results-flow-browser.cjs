const {launch,start,seed,artifact,savedState,waitForSave}=require('./browser-env.cjs');
const assert=require('node:assert/strict');
const ready=page=>page.locator('.results-v1[aria-busy=false]').waitFor();
// Fixtures are confined to this runner's fresh browser profile.
async function campaignResult(page,{id='results-flow',round=1,weak=false}={}){
 await seed(page,new Function('s','m',`
 const {battleRun,battleEngine}=m;s.battleRun=null;s.order=${JSON.stringify(weak?['infantry','35','1','119','32','diaochan']:['xuchu','35','1','119','32','diaochan'])};
 for(const id of s.order){s.heroes[id].owned=true;s.heroes[id].level=${weak?1:20};s.heroes[id].star=${weak?1:5};}
 let r=battleRun.newRun(s,11,${JSON.stringify(id)},null,Date.now());r.round=${round};r.capacity=6;r.units=s.order.slice(0,${weak?1:6}).map((hero,i)=>({id:i+1,hero,rank:${weak?1:5},x:i+1,y:3}));
 r=battleRun.startRound(r);while(!r.battle.result)battleEngine.stepBattle(r.battle);s.battleRun=r;return s;
 `));await ready(page);
}
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await start(page,{hash:'#campaign'});
 await campaignResult(page,{id:'results-intermediate'});let s=await savedState(page),gold=s.gold,silver=s.battleRun.silver;
 assert.equal(s.battleRun.outcome,'win');assert.equal(s.battleRun.receipt,undefined);assert.match(await page.locator('.paid-label').innerText(),/다음 준비/);
 await page.locator('#battle-stats').click();await page.locator('.combat-record-v1[aria-busy=false]').waitFor();assert.match(await page.locator('.combat-record-v1 .metric-heading').innerText(),/피해/);await page.keyboard.press('Escape');
 await page.locator('#battle-next').click();s=await waitForSave(page,s=>s.battleRun?.phase==='prepare');assert.equal(s.battleRun.round,2);assert.equal(s.battleRun.silver,silver+4);assert.equal(s.gold,gold);
 await campaignResult(page,{id:'results-loot',round:2});await page.locator('#battle-next').click();await page.locator('[data-loot]').first().click();s=await waitForSave(page,s=>s.battleRun?.phase==='prepare');assert.equal(s.battleRun.round,3);assert.equal(s.battleRun.gear.length,1);
 await campaignResult(page,{id:'results-loss',round:5,weak:true});s=await savedState(page);gold=s.gold;assert.equal(s.battleRun.outcome,'loss');const snapshot=s.battleRun.snapshot;assert.equal(await page.locator('#battle-retry').innerText(),'다시 도전');assert.match(await page.locator('.next-condition').innerText(),/2회 남음/);
 await page.screenshot({path:artifact('results-v1','loss.png')});
 await page.locator('#battle-retry').evaluate(b=>{b.click();b.click();});s=await waitForSave(page,s=>s.battleRun?.phase==='prepare');assert.equal(s.battleRun.retries,1);assert.deepEqual(s.battleRun.units,snapshot.units);assert.equal(s.gold,gold);
 for(let i=1;i<=2;i++){
  await seed(page,(s,{battleRun,battleEngine})=>{let r=battleRun.startRound(s.battleRun);while(!r.battle.result)battleEngine.stepBattle(r.battle);s.battleRun=r;return s;});await ready(page);
  if(i===1){assert.equal(await page.locator('#battle-retry').innerText(),'다시 도전');assert.match(await page.locator('.next-condition').innerText(),/1회 남음/);await page.locator('#battle-retry').click();await waitForSave(page,s=>s.battleRun?.phase==='prepare'&&s.battleRun.retries===2);}
 }
 assert.equal(await page.locator('#battle-retry').count(),0);await page.locator('#battle-return').click();s=await waitForSave(page,s=>!s.battleRun);assert.equal(s.gold,gold);assert.equal(s.battleReceipts['results-loss'].gold,0);
 // A failed automatic payout must remain unpaid and recover without duplication.
 await page.addInitScript(()=>{const put=IDBObjectStore.prototype.put;let failed=false;IDBObjectStore.prototype.put=function(...args){if(!failed&&this.name==='profile'&&args[0]?.battleRun?.id==='results-store-fail'&&args[0].battleRun.receipt){failed=true;this.transaction.abort();return;}return put.apply(this,args);};});
 await campaignResult(page,{id:'results-store-fail',round:5});assert.match(await page.locator('.paid-label').innerText(),/저장 대기/);s=await savedState(page);assert.equal(s.battleReceipts['results-store-fail'],undefined);gold=s.gold;
 await page.locator('.result-error').click();s=await waitForSave(page,s=>s.battleRun?.receipt);await ready(page);const payout=s.battleRun.receipt.gold;assert.equal(s.gold,gold+payout);assert.match(await page.locator('.paid-label').innerText(),/지급 완료/);
 await page.reload();await ready(page);assert.equal((await savedState(page)).gold,gold+payout);
 await page.locator('.results-v1 .bottom-nav [data-action=shop]').click();s=await waitForSave(page,s=>!s.battleRun);await page.locator('.shop-v2[aria-busy=false]').waitFor();assert.equal(s.gold,gold+payout);assert.equal(new URL(page.url()).hash,'#shop');
 // Arena draw uses the same settled receipt and safe navigation.
 await seed(page,(s,{battleRun})=>{s.arena={score:1000,match:null,rewards:0};const match={id:'results-draw',playerOrder:s.order,opponent:{name:'검수 상대',score:1000,order:s.order}};let r=battleRun.newRun(s,11,match.id,match,Date.now());r=battleRun.startRound(r);r.battle.result='draw';s.battleRun=r;return s;});await ready(page);s=await waitForSave(page,s=>s.battleRun?.receipt);assert.equal(s.battleRun.outcome,'draw');assert.match(await page.locator('.victory-title').innerText(),/무승부/);assert.match(await page.locator('.reward-panel~.reward-item').allTextContents().then(x=>x.join(' ')),/군공/);
 await page.screenshot({path:artifact('results-v1','draw.png')});await page.locator('#battle-return').click();await page.locator('.arena-v2[aria-busy=false]').waitFor();assert.equal(new URL(page.url()).hash,'#arena');
 assert.deepEqual(errors,[]);console.log('PASS actual intermediate silver/equipment, loss/retry snapshot and cap, double clicks, failed settlement recovery, reload idempotence, result navigation and arena draw receipt');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
