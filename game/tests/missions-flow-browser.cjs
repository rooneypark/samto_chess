const {launch,start,seed,savedState,waitForSave,artifact}=require('./browser-env.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs/promises');
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],report={};page.on('pageerror',e=>errors.push(e.message));
 await start(page,{lord:1});await seed(page,(s,{services})=>{
  const q=services.prepareServices(s);q.attendance={day:null,index:4};s.campaign={cleared:true};q.lifetime.runs=10;q.lifetime.merges=100;
  for(const p of Object.values(q.quests)){p.progress=p.target;p.claimed=false;}return s;
 });await page.locator('.game[aria-busy=false]').waitFor();await page.locator('[data-action=quests]').click();
 const root=page.locator('.missions-v1'),ready=()=>page.locator('.missions-v1[aria-busy=false]').waitFor(),tab=async name=>{await root.locator('[data-tab='+name+']').click();await ready();};await ready();
 const initial=await savedState(page),xp=initial.services.lord.xp;
 assert.match(await root.locator('.attendance-copy').innerText(),/5일차 · 훈련권 1/);assert.ok(await root.locator('.bonus-claim').isDisabled());
 // Both synchronous clicks reach the handler; the controller submits only one transaction.
 await root.locator('.attendance-claim').evaluate(b=>{b.click();b.click();});await waitForSave(page,s=>s.services.attendance.index===5);await ready();
 let saved=await savedState(page);assert.equal(saved.trainingTickets,(initial.trainingTickets??0)+1);assert.equal(saved.revision,initial.revision+1);assert.ok(await root.locator('.attendance-claim').isDisabled());
 const seal=await root.locator('.attendance-claim .polish-stamp').evaluate(stamp=>({
  aboveMask:+getComputedStyle(stamp).zIndex>+getComputedStyle(stamp.parentElement,'::after').zIndex,
  fill:getComputedStyle(stamp).backgroundColor
 }));
 assert.deepEqual(seal,{aboveMask:true,fill:'rgb(246, 230, 200)'});
 // A real IndexedDB write failure must not display success or change the receipt/profile.
 const beforeFailure=await savedState(page);
 await page.evaluate(()=>{const original=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){IDBObjectStore.prototype.put=original;this.transaction.abort();return undefined;};});
 await root.locator('[data-quest=daily_run] button').click();await page.locator('#toast').filter({hasText:'보상 수령 실패'}).waitFor();await ready();assert.deepEqual(await savedState(page),beforeFailure);assert.equal(await root.locator('[data-quest=daily_run] button').innerText(),'보상 받기');
 for(const id of ['daily_run','daily_merge','daily_skill','daily_train']){
  await root.locator('[data-quest='+id+'] button').evaluate(b=>{b.click();b.click();});await waitForSave(page,s=>s.services.quests[id].claimed);await ready();
 }
 assert.equal((await savedState(page)).gold,initial.gold+200);assert.equal((await savedState(page)).services.lord.xp,xp+80);assert.equal(await root.locator('.bonus-claim').innerText(),'보너스 받기');
 await root.locator('.bonus-claim').evaluate(b=>{b.click();b.click();});await waitForSave(page,s=>s.freeDiamonds===20);await ready();assert.ok(await root.locator('.bonus-claim').isDisabled());
 await tab('week');assert.equal(await root.locator('.mission').count(),5);
 for(const id of ['weekly_run','weekly_win','weekly_merge','weekly_skill','weekly_draw']){await root.locator('[data-quest='+id+'] button').click();await waitForSave(page,s=>s.services.quests[id].claimed);await ready();}
 await root.locator('.bonus-claim').evaluate(b=>{b.click();b.click();});await waitForSave(page,s=>s.freeDiamonds===70);await ready();
 await tab('achievement');for(const id of ['ach_first_clear','ach_10_runs','ach_100_merges']){await root.locator('[data-quest='+id+'] button').click();await waitForSave(page,s=>s.services.achievements[id]);await ready();}
 saved=await savedState(page);assert.equal(saved.gold,initial.gold+1600);assert.equal(saved.freeDiamonds,120);assert.equal(saved.diamonds,120);assert.equal(saved.services.lord.xp,xp+180);assert.equal(saved.revision,initial.revision+15);
 await page.screenshot({path:artifact('missions-v1','all-rewards-claimed.png')});report.payouts={gold:1600,freeDiamonds:120,trainingTickets:1,lordXp:180,transactions:15};report.failureRetry=true;report.duplicateClick=true;
 await page.reload();await ready();assert.deepEqual(await savedState(page),saved);assert.ok(await root.locator('.attendance-claim').isDisabled());assert.ok(await root.locator('.bonus-claim').isDisabled());
 await tab('week');assert.ok(await root.locator('.bonus-claim').isDisabled());await tab('achievement');assert.equal(await root.locator('.mission button:disabled').count(),3);
 await root.locator('.wallet button').first().click();await page.locator('#modal[open]').waitFor();await page.keyboard.press('Escape');await ready();
 await root.locator('.bottom-nav [data-action=alliance]').click();await page.locator('#toast').filter({hasText:'Lv.8'}).waitFor();assert.equal(new URL(page.url()).hash,'#missions');
 await root.locator('.bottom-nav [data-action=shop]').click();await page.locator('.shop-v2[aria-busy=false]').waitFor();assert.equal(new URL(page.url()).hash,'#shop');await page.goBack();await ready();
 await root.locator('.home-back').click();assert.equal(new URL(page.url()).hash,'#home');await page.locator('[data-action=quests]').click();await ready();await page.keyboard.press('Escape');assert.equal(new URL(page.url()).hash,'#home');report.navigation=true;
 // Live daily/weekly rollover at Monday 05:00 KST, without reloading the screen.
 const rollover=await browser.newPage({viewport:{width:390,height:844}});rollover.on('pageerror',e=>errors.push(e.message));await rollover.clock.setFixedTime(new Date('2026-11-15T19:59:59Z'));await start(rollover,{hash:'#missions',lord:1});
 await seed(rollover,(s,{services})=>{const q=services.prepareServices(s);q.attendance={day:q.periods.day,index:7};q.quests.daily_run.progress=2;q.quests.weekly_run.progress=10;return s;});
 const rr=rollover.locator('.missions-v1'),rready=()=>rollover.locator('.missions-v1[aria-busy=false]').waitFor();await rready();assert.ok(await rr.locator('.attendance-claim').isDisabled());assert.equal(await rr.locator('[data-quest=daily_run] button').innerText(),'보상 받기');
 await rollover.clock.setFixedTime(new Date('2026-11-15T20:00:01Z'));await rr.locator('[data-quest=daily_run] .mission-claim-status').filter({hasText:'진행 중'}).waitFor();await rready();assert.match(await rr.locator('.attendance-copy').innerText(),/1일차 · 골드 100/);
 await rr.locator('[data-tab=week]').click();await rready();assert.equal(await rr.locator('[data-quest=weekly_run] .progress-label').innerText(),'0 / 10');
 await rr.locator('.attendance-claim').click();const rolled=await waitForSave(rollover,s=>s.services.attendance.index===8);await rready();assert.equal(rolled.gold,600);assert.equal(rolled.services.mail.filter(m=>m.title.includes('미수령')).length,2);
 const ids=rolled.services.mail.map(m=>m.id);await rollover.reload();await rready();assert.deepEqual((await savedState(rollover)).services.mail.map(m=>m.id),ids);report.rollover={daily:true,weekly:true,mailCount:2,attendanceCycle:true};
 // All-max-level roster uses the existing alternate mission and complete title.
 await seed(rollover,(s,{services})=>{for(const h of Object.values(s.heroes))if(h.owned)h.level=20;delete s.services.periods.day;services.prepareServices(s);return s;});await rready();assert.equal(await rr.locator('[data-quest=daily_train] h3').innerText(),'만렙 장수 대체 출정');assert.equal(await rr.locator('[data-quest=daily_train] .progress-label').innerText(),'0 / 3');
 for(const width of [280,320,390]){
  await rollover.setViewportSize({width,height:568});
  const fits=await rr.locator('[data-quest=daily_train] h3').evaluate(async heading=>{
   await document.fonts.ready;
   const range=document.createRange();range.selectNodeContents(heading);
   const text=range.getBoundingClientRect(),title=heading.getBoundingClientRect();
   const progress=heading.parentElement.querySelector('.progress-label').getBoundingClientRect();
   const reward=heading.parentElement.querySelector('.reward').getBoundingClientRect();
   return text.width>0&&text.right<=title.right&&text.right<progress.left&&text.bottom<reward.top;
  });
  assert.ok(fits,'Alternate training title should fit at '+width+'px');
 }
 report.alternateTraining=true;
 // A saved classic preference now opens the shared mission screen.
 const classic=await browser.newPage();classic.on('pageerror',e=>errors.push(e.message));await classic.addInitScript(()=>localStorage.setItem('samguk.artSet','classic'));await start(classic,{hash:'#missions',lord:1});await classic.locator('.missions-v1[aria-busy=false]:visible').waitFor();await classic.locator('.attendance-claim').click();await waitForSave(classic,s=>s.gold===600);assert.ok(await classic.locator('.attendance-claim').isDisabled());report.classic=true;
 assert.deepEqual(errors,[]);await fs.writeFile(artifact('missions-v1','flow-qa.json'),JSON.stringify(report,null,2));console.log('PASS real attendance/4 daily/5 weekly/3 achievements/2 bonuses; duplicate clicks; failed-write retry; reload; navigation; live day/week rollover and mail; 7-day cycle; alternate training; legacy theme');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
