const {launch,start,artifact,seed,savedState,waitForSave}=require('./browser-env.cjs');
const assert=require('node:assert/strict');
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:941,height:1672},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
 page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 try{await start(page);}catch(error){await page.screenshot({path:artifact('gate-lobby','startup-failure.png')});console.error('Startup DOM:',await page.locator('body').innerText());throw error;}
 await seed(page,(s,{services})=>{
  s.order=['xuchu','1','32','35','diaochan','119'];for(const id of s.order)s.heroes[id].owned=true;
  s.gold=12450;s.diamonds=320;s.freeDiamonds=320;s.paidDiamonds=0;s.reducedMotion=true;
  let xp=0;for(let i=1;i<12;i++)xp+=services.lordXpForNext(i);s.services.lord.xp=xp;
  return s;
 });
 await page.locator('.game[aria-busy=false]').waitFor();await page.evaluate(()=>document.fonts.ready);
 const screenshot=await page.locator('.game').screenshot({path:artifact('gate-lobby','reference-state.png')});
 const comparison=await page.evaluate(async encoded=>{
  async function pixels(src){const image=new Image();image.src=src;await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);return ctx.getImageData(0,0,c.width,c.height).data;}
  const a=await pixels('assets/gate-lobby/reference.png'),b=await pixels('data:image/png;base64,'+encoded);
  let compared=0,changed=0;
  for(let y=0;y<1672;y++)for(let x=0;x<941;x++){
   // Shared header/footer are now independently verified across scenes by ui-shell-browser.
   if(y<150||y>=1498)continue;
   // Actual player portrait and XP differ from example data.
   if((x>=40&&x<155&&y>=28&&y<128)||(x>=170&&x<300&&y>=80&&y<108))continue;
   // The mail button's red dot is live data too: drawn only while a reward is waiting.
   if(x>=101&&x<136&&y>=176&&y<210)continue;
   compared++;const i=(y*941+x)*4;if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])changed++;
  }
  return {compared,changed};
 },screenshot.toString('base64'));
 require('node:fs').writeFileSync(artifact('gate-lobby','pixel-comparison.json'),JSON.stringify(comparison,null,2));
 assert.equal(comparison.changed,0,'Static screen pixels must match the approved source exactly at native size');
 assert.equal(await page.locator('.party .hero').count(),6);
 const imageSources=await page.locator('.party img').evaluateAll(els=>els.map(e=>e.getAttribute('src')));
 assert.deepEqual(imageSources,['xuchu','1','32','35','diaochan','119'].map(id=>'assets/gate-lobby/'+id+'.png'));
 // Press feedback has no layout shift or changes outside the pressed button.
 const button=page.locator('[data-action=settings]'),box=await button.boundingBox();
 const center={x:box.x+box.width/2,y:box.y+box.height/2};
 await page.mouse.move(center.x,center.y);await page.mouse.down();
 assert.equal(await page.locator('.gate-hit.is-pressed').count(),1);
 assert.deepEqual(await button.boundingBox(),box);
 const pressed=await page.locator('.game').screenshot({path:artifact('gate-lobby','settings-pressed.png')});
 const pressPixels=await page.evaluate(async ([before,after,box])=>{
  const read=async data=>{const im=new Image();im.src='data:image/png;base64,'+data;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);return ctx.getImageData(0,0,c.width,c.height).data;};
  const a=await read(before),b=await read(after);let changed=0,outside=0;
  for(let y=0;y<1672;y++)for(let x=0;x<941;x++){const i=(y*941+x)*4;if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2]){changed++;if(x<box.x||x>=box.x+box.width||y<box.y||y>=box.y+box.height)outside++;}}
  return {changed,outside};
 },[screenshot.toString('base64'),pressed.toString('base64'),box]);
 assert.ok(pressPixels.changed>100);assert.equal(pressPixels.outside,0);
 await page.mouse.move(470,350);assert.equal(await page.locator('.gate-hit.is-pressed').count(),0);
 await page.mouse.move(center.x,center.y);assert.equal(await page.locator('.gate-hit.is-pressed').count(),1);
 await page.mouse.move(470,350);await page.mouse.up();assert.equal(await page.locator('#modal[open]').count(),0);
 const restored=await page.locator('.game').screenshot();assert.ok(restored.equals(screenshot),'Release must restore the exact original pixels');
 // Space uses the browser's native single activation; no synthetic duplicate click.
 await button.focus();await page.keyboard.down('Space');assert.equal(await page.locator('.gate-hit.is-pressed').count(),1);
 await page.keyboard.up('Space');await page.locator('#modal[open]').waitFor();assert.equal(await page.locator('.gate-hit.is-pressed').count(),0);await page.keyboard.press('Escape');
 await button.focus();await page.keyboard.press('Enter');await page.locator('#modal[open]').waitFor();assert.equal(await page.locator('.gate-hit.is-pressed').count(),0);await page.keyboard.press('Escape');
 // Real touch events, including implicit capture and dragging outside before release.
 const touch=await page.context().newCDPSession(page);
 const point={x:center.x,y:center.y};
 await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});assert.equal(await page.locator('.gate-hit.is-pressed').count(),1);
 await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.locator('#modal[open]').waitFor();await page.keyboard.press('Escape');
 await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
 await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:470,y:350}]});
 await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await page.locator('#modal[open]').count(),0);assert.equal(await page.locator('.gate-hit.is-pressed').count(),0);
 await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
 await touch.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal(await page.locator('.gate-hit.is-pressed').count(),0);await touch.detach();
 await page.mouse.move(center.x,center.y);await page.mouse.down();await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await page.locator('.gate-hit.is-pressed').count(),0);await page.mouse.move(470,350);await page.mouse.up();
 await button.evaluate(el=>el.blur());
 for(const action of ['mail','quests','settings','formation','campaign']){
  await page.locator(`[data-action=${action}]`).click();
  if(action==='campaign'){await page.locator('.campaign-v4[aria-busy=false]').waitFor();await page.locator('#campaign-back').click();}
  else{await page.locator('#modal[open]').waitFor();await page.keyboard.press('Escape');}
 }
 // Reorder the actual saved party, not a visual-only demonstration.
 await page.locator('[data-action=formation]').click();
 await page.locator('.formation-list li').nth(1).locator('button').first().click();
 await page.locator('#save-party').click();await waitForSave(page,s=>s.order[0]==='1');
 assert.equal(await page.locator('.party img').first().getAttribute('src'),'assets/gate-lobby/1.png');
 await page.locator('[data-action=barracks]').click();await page.locator('.barracks-screen').waitFor();
 await page.locator('[data-action=home]').click();
 await page.locator('[data-action=shop]').click();await page.locator('.shop-screen').waitFor();
 await page.locator('[data-action=home]').click();
 for(const viewport of [{width:360,height:640},{width:390,height:844},{width:1440,height:900}]){
  await page.setViewportSize(viewport);await page.mouse.move(0,0);
  const game=await page.locator('.game').boundingBox();assert.ok(game.width<=viewport.width+.1&&game.height<=viewport.height+.1);
  for(const action of ['depart','barracks','settings']){
   const box=await page.locator(`[data-action=${action}]`).boundingBox();assert.ok(box.x>=game.x-1&&box.y>=game.y-1&&box.x+box.width<=game.x+game.width+1&&box.y+box.height<=game.y+game.height+1);
  }
  await page.screenshot({path:artifact('gate-lobby',`live-${viewport.width}.png`)});
 }
 // Live economy changes must replace the painted example amounts.
 await seed(page,s=>{s.gold=987654;s.diamonds=27;s.freeDiamonds=27;return s;});
 await page.locator('.game[aria-busy=false]').waitFor();
 assert.equal(await page.locator('[data-field=gold]').textContent(),'987,654');
 assert.equal(await page.locator('[data-field=diamonds]').textContent(),'27');
 await page.locator('[data-action=depart]').click();await page.locator('.battle-screen').waitFor();
 assert.ok((await savedState(page)).battleRun);
 assert.deepEqual(errors,[]);console.log('PASS gate lobby: source art, live wallet/party, dialogs, tabs, battle, 3 viewport sizes');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
