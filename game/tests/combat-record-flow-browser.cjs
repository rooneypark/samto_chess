const {launch,start,seed,artifact,savedState,waitForSave}=require('./browser-env.cjs');
const assert=require('node:assert/strict');
const ready=p=>p.locator('.combat-record-v1[aria-busy=false]:not([hidden])').waitFor();
const result=p=>p.locator('.results-v1[aria-busy=false]:not([hidden])').waitFor();
async function checkRows(p,battle,side,metric){
 const units=battle.units.filter(u=>u.side===side).sort((a,b)=>Math.floor(b[metric])-Math.floor(a[metric])||a.id-b.id),expected=units.map(u=>({id:String(u.id),value:Math.floor(u[metric]).toLocaleString('ko-KR')+(metric==='casts'?'회':'')}));
 const actual=[];
 for(let i=0;i<Math.ceil(units.length/6);i++){
  actual.push(...await p.locator('.unit-record').evaluateAll(es=>es.map(e=>({id:e.dataset.unit,value:e.querySelector('.row-value').textContent}))));
  if(i<Math.ceil(units.length/6)-1){await p.locator('#record-next').click();await ready(p);}
 }
 assert.deepEqual(actual,expected);const total=units.reduce((n,u)=>n+Math.floor(u[metric]),0);assert.match(await p.locator('.combat-record-v1 .summary-copy').innerText(),new RegExp(total.toLocaleString('ko-KR')));
 if(units.length>6)assert.equal(await p.locator('#record-next').isDisabled(),true);
}
(async()=>{const browser=await launch();try{
 const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await start(p,{hash:'#campaign'});
 await seed(p,(s,{battleRun,battleEngine})=>{
  s.order=['0','1','119','32','35','diaochan'];s.campaign={cleared:true};for(const id of s.order)Object.assign(s.heroes[id],{owned:true,level:5,star:2});
  let r=battleRun.newRun(s,11,'record-real-healing',null,Date.now(),'yellow_02');r.round=4;r.capacity=6;r.units=s.order.map((hero,i)=>({id:i+1,hero,rank:1,x:i+1,y:3}));r=battleRun.startRound(r);while(!r.battle.result)battleEngine.stepBattle(r.battle);s.battleRun=r;return s;
 });await result(p);const before=await savedState(p);assert.ok(before.battleRun.battle.units.some(u=>u.healing>0));
 await p.locator('#battle-stats').click();await ready(p);
 for(const side of [0,1])for(const metric of ['damage','healing','casts']){
  await p.locator('[data-side="'+side+'"]').click();await ready(p);await p.locator('[data-metric='+metric+']').click();await ready(p);await checkRows(p,before.battleRun.battle,side,metric);
 }
 assert.match(await p.locator('.page-number').innerText(),/2 \/ 2/);await p.locator('.unit-record').last().click();await ready(p);assert.equal(await p.locator('.unit-record[aria-pressed=true]').count(),1);
 await p.locator('#record-home').click();await p.locator('[data-dialog-cancel]').click();await ready(p);assert.equal(await p.locator('.combat-record-v1').isVisible(),true);assert.deepEqual((await savedState(p)).battleRun,before.battleRun);
 await p.keyboard.press('Escape');await result(p);assert.equal(await p.locator('.combat-record-v1').isVisible(),false);assert.equal((await savedState(p)).gold,before.gold);
 await p.locator('#battle-stats').click();await ready(p);await p.reload();await result(p);await p.locator('#battle-stats').click();await ready(p);await checkRows(p,before.battleRun.battle,0,'damage');await p.locator('#record-return').click();await result(p);
 await p.locator('#battle-next').click();await p.locator('[data-loot]').first().click();await waitForSave(p,s=>s.battleRun?.phase==='prepare'&&s.battleRun.round===5);
 // Opening live records freezes the engine; closing restores prior pause state.
 await p.locator('#battle-start').click();await waitForSave(p,s=>s.battleRun?.battle?.tick>=20);await p.locator('#battle-stats').click();await ready(p);
 assert.match(await p.locator('.outcome').innerText(),/전투 중/);assert.match(await p.locator('#record-return').innerText(),/전투로/);
 const live=await savedState(p),copy=await p.locator('.combat-record-v1 .summary-copy').innerText();await p.waitForTimeout(350);assert.equal((await savedState(p)).battleRun.battle.tick,live.battleRun.battle.tick);assert.equal(await p.locator('.combat-record-v1 .summary-copy').innerText(),copy);
 await p.locator('#record-home').click();await p.locator('[data-dialog-cancel]').click();await ready(p);await p.locator('#record-return').click();await waitForSave(p,s=>s.battleRun.battle.tick>live.battleRun.battle.tick);
 await p.locator('#battle-header-pause').click();await p.locator('#battle-stats').click();await ready(p);const paused=(await savedState(p)).battleRun.battle.tick;await p.keyboard.press('Escape');await p.waitForTimeout(350);assert.equal((await savedState(p)).battleRun.battle.tick,paused);assert.equal(await p.locator('#battle-header-pause').innerText(),'▶');
 await p.locator('#battle-stats').click();await ready(p);await p.locator('.combat-record-v1 .bottom-nav [data-action=shop]').click();await p.locator('[data-dialog-confirm]').click();await waitForSave(p,s=>!s.battleRun);assert.equal(new URL(p.url()).hash,'#shop');assert.equal((await savedState(p)).gold,before.gold);
 // Actual arena settlement remains unchanged while viewing and leaving records.
 await seed(p,(s,{battleRun,battleEngine})=>{s.arena={score:1000,match:null,rewards:0};const match={id:'record-arena',playerOrder:s.order,opponent:{name:'기록 검수 상대',score:1000,order:s.order}};let r=battleRun.startRound(battleRun.newRun(s,11,match.id,match,Date.now()));while(!r.battle.result)battleEngine.stepBattle(r.battle);s.battleRun=r;return s;});await result(p);const settled=await savedState(p);
 await p.locator('#battle-stats').click();await ready(p);assert.match(await p.locator('.combat-record-v1 .scroll-heading').innerText(),/군웅대전/);assert.equal(await p.locator('.combat-record-v1 .bottom-nav [data-action=arena]').getAttribute('data-art-button'),'nav-arena-selected');
 await checkRows(p,settled.battleRun.battle,0,'damage');await p.screenshot({path:artifact('combat-record-v1','arena-real-data.png')});
 await p.locator('.combat-record-v1 .bottom-nav [data-action=arena]').click();await waitForSave(p,s=>!s.battleRun);assert.equal(new URL(p.url()).hash,'#arena');const after=await savedState(p);assert.equal(after.gold,settled.gold);assert.equal(after.merit,settled.merit);assert.deepEqual(after.battleReceipts,settled.battleReceipts);
 assert.deepEqual(errors,[]);console.log('PASS real damage/healing/casts for both sides, seven-unit paging, selected details, read-only battle/rewards, reload, round continuation, live freeze/resume and prior pause, cancel/confirmed navigation, arena receipt');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
