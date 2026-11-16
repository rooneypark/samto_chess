// Browser review uses a fresh isolated profile, starter levels/currency and seed 1.
// After setting the summon seed, every gameplay action is a real UI click.
const {launch,start:openGame,baseUrl,artifact,savedState,waitForSave,seed}=require('./browser-env.cjs');
const fs=require('node:fs/promises'),path=require('node:path'),{spawn}=require('node:child_process'),assert=require('node:assert/strict');
const plan=require('./battle-demo-plan.json'),out=path.dirname(artifact('battle-review','audit.json'));
(async()=>{await fs.mkdir(out,{recursive:true});const browser=await launch();let encoder,timer,cdp;const errors=[],audit={profile:'Fresh starter profile: all six starter heroes level 1 / star 1, gold 500. Only summon seed fixed to 1. No outcome/stat/currency manipulation.',seed:1,rounds:[],screenshots:[]};
try{const page=await browser.newPage({viewport:{width:480,height:720},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});await openGame(page);await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>{crypto.getRandomValues=array=>{array[0]=1;return array;};});
 encoder=spawn(process.env.SAMGUK_FFMPEG??'ffmpeg',['-y','-loglevel','error','-f','image2pipe','-vcodec','mjpeg','-framerate','15','-i','pipe:0','-an','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'battle-playthrough.mp4')]);let encodeError='';encoder.stderr.on('data',d=>{encodeError+=d;console.error(String(d));});encoder.on('error',e=>errors.push(e.message));encoder.stdin.on('error',e=>errors.push(e.message));const encoded=new Promise(resolve=>encoder.on('close',code=>resolve(code)));
 cdp=await page.context().newCDPSession(page);let latest=await page.screenshot({type:'jpeg',quality:85});cdp.on('Page.screencastFrame',e=>{latest=Buffer.from(e.data,'base64');cdp.send('Page.screencastFrameAck',{sessionId:e.sessionId}).catch(()=>{});});await cdp.send('Page.startScreencast',{format:'jpeg',quality:85,maxWidth:480,maxHeight:720,everyNthFrame:1});timer=setInterval(()=>{if(latest&&encoder.stdin.writable&&!encoder.stdin.writableNeedDrain)encoder.stdin.write(latest);},1000/15);
 const start=Date.now(),saved=()=>savedState(page),click=async sel=>{await page.locator(sel).first().click();await page.waitForTimeout(250);};
 const capture=async name=>{await page.screenshot({path:path.join(out,name+'.png')});audit.screenshots.push({name,time:(Date.now()-start)/1000});};
 await click('[data-action=depart]');await capture('01-empty-preparation');
 let mergeCaptured=false,skillCaptured=false;
 for(const round of plan.plan){
  for(const c of round.commands){const before=(await saved()).battleRun;
   if(c.type==='summon')await click('#battle-summon');
   if(c.type==='capacity'){await click('#battle-capacity');await click('[data-dialog-confirm]');}
   if(['move','equip'].includes(c.type)){
    if(await page.locator('.battle-piece.selected').count())await click('.battle-piece.selected');
    await click(`[data-unit="${c.id}"]`);
    if(c.type==='move'){const target=before.units.find(u=>u.x===c.x&&u.y===c.y),source=before.units.find(u=>u.id===c.id),merge=target&&target.id!==source.id&&target.hero===source.hero&&target.rank===source.rank;
     if(merge&&!mergeCaptured)await capture('03-merge-preview');
     await click(target?`[data-unit="${target.id}"]`:`[data-x="${c.x}"][data-y="${c.y}"]`);
     if(merge&&!mergeCaptured){await capture('04-merge-complete');mergeCaptured=true;}
    }else await click(`[data-gear="${c.index}"]`);
   }
   const after=(await saved()).battleRun;if(c.type==='summon')assert.equal(after.silver,before.silver-3);
  }
  if(await page.locator('.battle-piece.selected').count())await click('.battle-piece.selected');
  assert.equal(await page.locator('.battle-screen').evaluate(e=>e.scrollHeight>e.clientHeight+1),false,'prepare overflow round '+round.round);
  await capture(round.round===1?'02-summon-deploy':`round-${round.round}-preparation`);await page.waitForTimeout(500);await click('#battle-start');
  if(round.round>=3)await click('[data-speed="2"]');
  let recorded=false;
  while(!(await page.locator('.battle-result').count())){
   if(round.round>=2&&!skillCaptured&&await page.locator('.skill-callout').count()){await capture('05-skill-effect');assert.equal(await page.locator('.battle-screen').evaluate(e=>e.scrollHeight>e.clientHeight+1),false,'live overflow');skillCaptured=true;}
   if(!recorded&&await page.locator('.fx-slash').count()){await capture('attack-round-'+round.round);recorded=true;}
   await page.waitForTimeout(75);
  }
  const s=await saved(),r=s.battleRun;assert.equal(r.outcome,'win');audit.rounds.push({round:r.round,ticks:r.battle.tick,attacks:r.battle.log.filter(e=>e.type==='attack').length,skills:r.battle.log.filter(e=>e.type==='skill').length,silver:r.silver,units:r.units.map(u=>({hero:u.hero,rank:u.rank})),gold:s.gold,receipt:r.receipt??null});
  console.log('ROUND',r.round,r.outcome,'ticks',r.battle.tick,'skills',audit.rounds.at(-1).skills);await capture('result-round-'+r.round);await page.waitForTimeout(900);
  if(r.round<5){await click('#battle-next');if([2,4].includes(r.round))await click('[data-loot="sword"]');}
 }
 const final=await saved();assert.equal(final.gold,600);assert.equal(final.battleRun.receipt.gold,100);assert.ok(mergeCaptured&&skillCaptured);await capture('06-victory-reward');await page.waitForTimeout(1800);await page.reload();assert.equal((await saved()).gold,600);audit.reloadGold=600;await click('#battle-return');await capture('07-wallet-after-return');assert.equal((await saved()).gold,600);await page.waitForTimeout(1200);
 clearInterval(timer);timer=null;await cdp.send('Page.stopScreencast');encoder.stdin.end();const code=await encoded;assert.equal(code,0,encodeError);audit.durationSeconds=(Date.now()-start)/1000;audit.errors=errors;assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'audit.json'),JSON.stringify(audit,null,2));console.log('PASS full UI playthrough, merge, skills, five waves, 500 → 600 gold, no duplicate reward.');
}finally{if(timer)clearInterval(timer);if(encoder&&!encoder.stdin.destroyed)encoder.stdin.end();await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
