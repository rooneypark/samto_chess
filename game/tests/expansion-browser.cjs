// 보강 콘텐츠를 화면에서 직접 눌러 확인한다: 군주 레벨 잠금, 7일 임무, 도감, 픽업 모집, S 선택,
// 군웅대전 군공 상점·시즌, 동맹 출석·토벌·상점, 토벌 파견, 연무탑, 어려움 난도.
// Screenshots go to test-artifacts/expansion/.
const {launch,start,artifact,waitForSave,seed}=require('./browser-env.cjs');
const assert=require('node:assert/strict');
(async()=>{const browser=await launch();try{
 const errors=[];
 const watch=page=>{page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});};
 const shot=(page,name)=>page.screenshot({path:artifact('expansion',name+'.png')});

 // Locked deep links must finish initializing the approved home shell at Lv.1.
 for(const [tab,level] of [['alliance',8],['arena',6]]){
  const entry=await browser.newPage({viewport:{width:390,height:844}});watch(entry);
  await start(entry,{lord:1,hash:'#'+tab});
  assert.equal(await entry.locator('.game').evaluate(e=>e.classList.contains('gate-lobby')),true,'Locked deep link initializes home artwork');
  assert.equal(new URL(entry.url()).hash,'#home');
  assert.equal(await entry.locator('.bottom-nav [aria-selected=true]').getAttribute('data-action'),'home');
  assert.match(await entry.locator('#toast').innerText(),new RegExp('Lv\\.'+level));
  await entry.goto(new URL('?alliance-test=1&arena-test=1&arena-originals=1#'+tab,entry.url()).href);await entry.locator('.game.gate-lobby[aria-busy=false]').waitFor();
  for(const key of ['alliance-test','arena-test','arena-originals'])assert.equal(new URL(entry.url()).searchParams.has(key),false,'Retired test bookmarks do not unlock content');
  assert.match(await entry.locator('.castle').evaluate(e=>getComputedStyle(e).backgroundImage),/gate-lobby\/scene\.png/);
  await entry.reload();await entry.locator('.game.gate-lobby[aria-busy=false]').waitFor();
  await shot(entry,'startup-from-locked-'+tab);await entry.close();
 }

 // ---- A new lord (Lv.1): gated tabs stay closed and say when they open.
 {const page=await browser.newPage({viewport:{width:390,height:844}});watch(page);const click=s=>page.locator(s).first().click();
  await start(page,{lord:1});
  for(const [tab,level] of [['arena',6],['alliance',8]]){await click('[data-action='+tab+']');await page.locator('#toast:not([hidden])').waitFor();assert.match(await page.locator('#toast').innerText(),new RegExp('Lv\\.'+level));assert.equal(await page.locator('.bottom-nav .active').getAttribute('data-action'),'home');}
  await click('[data-action=expedition]');assert.match(await page.locator('#modal-body').innerText(),/Lv\.10/);await page.keyboard.press('Escape');
  await click('.bottom-nav [data-action=home]');await click('[data-action=tower]');assert.match(await page.locator('#modal-body').innerText(),/Lv\.15/);await page.keyboard.press('Escape');
  await click('[data-action=profile]');assert.match(await page.locator('#modal-body').innerText(),/다음 해금[\s\S]*Lv\.4/);await shot(page,'01-profile-next-unlocks');await page.keyboard.press('Escape');
  await click('[data-action=campaign]');await page.locator('.campaign-v4[aria-busy=false]').waitFor();await click('#campaign-catalog');assert.equal(await page.locator('#campaign-strategy option[value=ambush]').isDisabled(),true);await page.keyboard.press('Escape');await click('#campaign-back');
  // seven-day missions: day one needs the first battle
  await click('[data-action=start]');assert.equal(await page.locator('[data-start="1"]').isDisabled(),true);assert.match(await page.locator('#modal-body').innerText(),/2일차에 열림/);await shot(page,'02-start-missions');
  await page.close();}

 // ---- A grown lord with everything cleared.
 const page=await browser.newPage({viewport:{width:390,height:844}});watch(page);const click=s=>page.locator(s).first().click();
 const text=s=>page.locator(s).first().innerText();
 await start(page);
 await seed(page,(s,{services})=>{
  s.gold=50000;s.diamonds=s.freeDiamonds=20000;s.sShards=60;s.merit=200;s.provisions=100;
  s.campaign={cleared:true,day:null,count:0,stages:Object.fromEntries(['yellow_02','yellow_03','sishui_01','sishui_02','sishui_03','hulao_01','hulao_02','hulao_03'].map(id=>[id,{cleared:true}]))};
  for(const id of s.order)s.heroes[id].level=10;
  const q=services.prepareServices(s);q.start.day0-=6;q.lifetime.draws=10;
 });
 await page.locator('.game[aria-busy="false"]').waitFor();

 // 7일 임무: 1일차 수령
 await click('[data-action=start]');await click('[data-start="1"]');await waitForSave(page,s=>s.services.start.claimed[1]);
 assert.equal(await page.locator('[data-start="1"]').isDisabled(),true);await shot(page,'03-start-claimed');await page.keyboard.press('Escape');

 // 도감: 미보유 장수의 얻는 곳
 await click('[data-action=codex]');assert.ok(await page.locator('.codex-card.missing').count()>20);
 await click('[data-codex="simayi"]');assert.match(await text('#codex-detail'),/사마의[\s\S]*미보유[\s\S]*S 선택 조각/);await shot(page,'04-codex');await page.keyboard.press('Escape');

 // 상점: 픽업 모집은 다이아만, S 선택 조각으로 확정 획득
 await click('[data-action=shop]');await click('[data-pool=pickup]');
 assert.equal(await page.locator('.recruit-button[data-currency=gold]').count(),0);assert.match(await text('.recruit-intro'),/픽업 모집[\s\S]*까지/);await shot(page,'05-pickup');
 await click('#probabilities');assert.match(await text('#modal-body'),/픽업 모집\(다이아 전용\)/);await page.keyboard.press('Escape');
 await click('.recruit-button[data-count="10"]');await click('#purchase-confirm');
 const drawn=await waitForSave(page,s=>s.shop.pending?.results.length===10);assert.ok(drawn.shop.pending.results.some(r=>r.grade!=='C'));assert.equal(Object.values(drawn.shop.receipts).at(-1).banner,'pickup');
 await click('#result-confirm');await waitForSave(page,s=>!s.shop.pending);
 await click('#s-select');await shot(page,'06-s-select');await click('[data-choice="35"]');await click('#purchase-confirm');
 const selected=await waitForSave(page,s=>s.sShards===0);assert.ok(selected.heroes['35'].owned);await click('#result-confirm');await waitForSave(page,s=>!s.shop.pending);

 // 군웅대전: 등급, 군공 상점, 시즌 안내, 방어 편성
 await click('[data-action=arena]');assert.equal(await text('#arena-tier'),'백부장');assert.equal(await text('#arena-merit'),'200');await shot(page,'07-arena');
 await click('#arena-season');assert.match(await text('#modal-body'),/천하무쌍[\s\S]*S 선택 조각/);await page.keyboard.press('Escape');
 await click('#arena-shop');await click('[data-merit=treasure]');await waitForSave(page,s=>s.merit===170);await shot(page,'08-merit-shop');await page.keyboard.press('Escape');
 await click('#arena-formation');await click('#arena-defense');assert.ok((await waitForSave(page,s=>s.arena?.defense)).arena.defense.order.length===6);await page.keyboard.press('Escape');

 // 동맹: 가입, 출석, 상점 (기부는 가입 24시간 뒤라 토벌은 준비도를 넣어 확인)
 await click('[data-action=alliance]');await click('#guild-search');await click('[data-join=cloud]');await click('#guild-confirm');await waitForSave(page,s=>s.alliance?.guild);
 await click('#guild-attend');await waitForSave(page,s=>s.alliance.contribution===5);assert.equal(await page.locator('#guild-raid').isDisabled(),false);await click('#guild-raid');assert.ok(await page.locator('#raid-go').isDisabled());await page.keyboard.press('Escape');
 await seed(page,s=>{s.alliance.preparation=100;s.alliance.contribution=65;});
 await page.locator('.game[aria-busy="false"]').waitFor();await click('[data-action=alliance]');await shot(page,'09-alliance');
 await click('#guild-raid');await shot(page,'10-raid');await click('#raid-go');
 const raided=await waitForSave(page,s=>s.alliance.raid?.attempts===1);assert.ok(raided.alliance.raid.mine>0&&raided.alliance.contribution===75);
 await click('#guild-shop');await click('[data-guild-buy=treasure]');await waitForSave(page,s=>s.alliance.contribution===45);

 // 토벌 파견: 세 명을 골라 보낸다
 await click('[data-action=home]');await click('[data-action=expedition]');await click('[data-site=yellow]');
 for(const id of ['15','0','infantry'])await click(`[data-pick="${id}"]`);
 assert.match(await text('#expedition-summary'),/선택 3 \/ 3/);await shot(page,'11-expedition-pick');await click('#expedition-send');
 const sent=await waitForSave(page,s=>s.expedition?.slots.length===1);assert.equal(sent.provisions,80);assert.match(await text('#modal-body'),/남은 시간/);await shot(page,'12-expedition');await page.keyboard.press('Escape');

 // 전역: 어려움 출정
 await click('[data-action=campaign]');await page.locator('.campaign-v4[aria-busy=false]').waitFor();await click('#campaign-catalog');assert.equal(await page.locator('#campaign-strategy option[value=ambush]').isDisabled(),false);
 await click('#modal-body [data-stage=yellow_02]');assert.match(await text('#modal-body'),/어려움[\s\S]*HP ×1\.5/);await shot(page,'13-hard');await click('#stage-hard');
 const hard=await waitForSave(page,s=>s.battleRun?.difficulty==='hard');assert.equal(hard.battleRun.stageId,'yellow_02');assert.match(await text('.battle-title h2'),/어려움/);await shot(page,'14-hard-battle');
 await click('#battle-exit');await click('[data-dialog-confirm]');await waitForSave(page,s=>s.battleRun===null);

 // 연무탑 1층: 은화가 넉넉하고 한 라운드로 끝난다
 await page.evaluate(()=>{crypto.getRandomValues=a=>{a[0]=7;return a;};});
 await click('.bottom-nav [data-action=home]');await click('[data-action=tower]');assert.match(await text('#modal-body'),/0 \/ 30층/);await shot(page,'15-tower');await click('[data-floor=tower_01]');
 const floor=await waitForSave(page,s=>s.battleRun?.stageId==='tower_01');assert.equal(floor.battleRun.silver,19);assert.match(await text('.battle-title h2'),/연무탑 1층/);
 for(const [x,y] of [[2,3],[3,3],[4,3]]){await click('#battle-summon');await click('.bench-cell [data-unit]');await click(`.battle-cell[data-x="${x}"][data-y="${y}"]`);}
 await waitForSave(page,s=>s.battleRun.units.filter(u=>u.y>=0).length===3);await shot(page,'16-tower-battle');
 await click('#battle-start');await click('[data-speed="3"]');await page.locator('.battle-result').waitFor({timeout:90000});
 const ended=await waitForSave(page,s=>s.battleRun?.phase==='result');assert.ok(['win','loss'].includes(ended.battleRun.outcome));await shot(page,'17-tower-result');

 assert.deepEqual(errors,[]);console.log('PASS lord gates, start missions, codex, pickup and S select, arena merit/season, alliance attend/raid/shop, expedition, hard mode, tower');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
