const {launch,start,seed,artifact,savedState,waitForSave}=require('./browser-env.cjs');
const sharp=require('../../design-delivery/v1/a-production/tools/node_modules/sharp'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),read=buffer=>sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
async function press(page,button){
 const box=await button.boundingBox(),clip=Object.fromEntries(Object.entries(box).map(([k,v])=>[k,Math.round(v)]));
 await page.mouse.move(939,1480);await button.evaluate(e=>e.blur());
 const before=await read(await page.screenshot({clip}));
 const url=await button.evaluate(e=>getComputedStyle(e).getPropertyValue('--art-image').trim().slice(4,-1).replaceAll('"',''));
 const mask=await read(url.startsWith('data:')?Buffer.from(url.split(',')[1],'base64'):await fs.readFile(path.join(root,'game',url.replace(/^https?:\/\/[^/]+\/game\//,''))));
 assert.equal(mask.info.width,clip.width);assert.equal(mask.info.height,clip.height);
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
 assert.equal(await button.evaluate(e=>e.classList.contains('is-pressed')),true);
 assert.deepEqual(await button.boundingBox(),box);
 const after=await read(await page.screenshot({clip}));let changed=0,outside=0,frame=0,missed=0;
 for(let i=0;i<before.data.length;i+=4){const delta=Math.abs(before.data[i]-after.data[i])+Math.abs(before.data[i+1]-after.data[i+1])+Math.abs(before.data[i+2]-after.data[i+2]);if(!mask.data[i+3]&&delta>3)outside++;if(delta>3)changed++;
  const x=i/4%clip.width,y=Math.floor(i/4/clip.width),a=before.data[i]+before.data[i+1]+before.data[i+2],b=after.data[i]+after.data[i+1]+after.data[i+2];
  if(mask.data[i+3]===255&&(x<clip.width*.12||x>clip.width*.88||y<clip.height*.12||y>clip.height*.88)&&Math.max(mask.data[i],mask.data[i+1],mask.data[i+2])>100&&a>30){frame++;if(b>a*.92)missed++;}
 }
 if(outside){await sharp(before.data,{raw:before.info}).png().toFile(artifact('arena-v2','failed-before.png'));await sharp(after.data,{raw:after.info}).png().toFile(artifact('arena-v2','failed-after.png'));await sharp(mask.data,{raw:mask.info}).png().toFile(artifact('arena-v2','failed-mask.png'));}
 assert.equal(outside,0,'Pressed changes outside source alpha: '+await button.innerText());assert.ok(changed>100);
 assert.ok(frame>25);assert.equal(missed,0,'Entire border must press: '+await button.innerText());
 await page.mouse.move(939,1480);await page.mouse.up();
 return {label:await button.getAttribute('aria-label')||await button.innerText(),outside,changed,frame,missed};
}
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:941,height:1672},deviceScaleFactor:1}),errors=[],report=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 await start(page,{hash:'#arena'});await page.locator('.arena-v2[aria-busy=false]').waitFor();
 await seed(page,s=>{s.order=['1','xuchu','32','35','diaochan','119'];for(const id of s.order)s.heroes[id].owned=true;s.gold=12450;s.diamonds=s.freeDiamonds=320;s.paidDiamonds=0;s.merit=120;s.arena={score:1120,match:null,rewards:0};return s;});
 await page.locator('.arena-v2[aria-busy=false]').waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(200);await page.mouse.move(939,1480);
 const screenshot=await page.screenshot({path:artifact('arena-v2','approved-layout.png')}),actual=await read(screenshot),reference=await read(await fs.readFile(path.join(root,'design-delivery/v2/05-mockups/arena-versus-v1.png')));
 const artBounds=await page.locator('.arena-v2 .general-original').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {left:Math.floor(r.left)-1,right:Math.ceil(r.right)+1,top:Math.floor(r.top)-1,bottom:Math.ceil(r.bottom)+1};}));
 // The selected opponent uses their actual representative, not the preview's Lu Bu.
 artBounds.push({left:592,right:762,top:620,bottom:940});
 const referenceFormation=await page.evaluate(async()=>{const {generals}=await import('./assets/generals-v2/generals.js');return ['1','xuchu','32','35','diaochan','119'].map((id,i)=>{const a=generals[id].views.front,h=68,w=h*a.width/a.height,x=112+i*137-w/2,y=1163-h*a.foot[1]/a.height;return {left:Math.floor(x)-1,right:Math.ceil(x+w)+1,top:Math.floor(y)-1,bottom:Math.ceil(y+h)+1};});});artBounds.push(...referenceFormation);
 const duel=await page.locator('.duel-generals .general-original').all();const rider=await duel[0].boundingBox(),standing=await duel[1].boundingBox();assert.ok(Math.abs(standing.height/rider.height-.70)<.001,'Standing general is 70% of the mounted stature');
 const scrollChange=await require('./approved-ui-changes.cjs')(page);
 let changed=0,imageRasterPixels=0;for(let i=0;i<actual.data.length;i+=4)if(!scrollChange(i)&&!actual.data.subarray(i,i+4).equals(reference.data.subarray(i,i+4))){const x=i/4%941,y=Math.floor(i/4/941);if(artBounds.some(b=>x>=b.left&&x<b.right&&y>=b.top&&y<b.bottom))imageRasterPixels++;else changed++;}
 await fs.writeFile(artifact('arena-v2','pixel-comparison.json'),JSON.stringify({changed,imageRasterPixels}));assert.equal(changed,0,'Approved UI pixels outside actual character sprites');
 const frames=await page.evaluate(async()=>{const {renderNineSlice}=await import('./nine-slice.js'),out=[];for(const tone of ['blue','green'])for(const [w,h] of [[281,74],[901,500],[901,130],[207,64],[430,88],[570,136],[290,136]])out.push({tone,w,h,url:await renderNineSlice(tone,w,h,{stablePixels:true})});return out;});
 const corners={};for(const f of frames){const png=Buffer.from(f.url.split(',')[1],'base64'),parts=[];for(const [left,top] of [[0,0],[f.w-28,0],[0,f.h-28],[f.w-28,f.h-28]])parts.push(await sharp(png).extract({left,top,width:28,height:28}).raw().toBuffer());if(!corners[f.tone])corners[f.tone]=parts;else parts.forEach((part,i)=>assert.ok(part.equals(corners[f.tone][i]),'Fixed corner ornament'));}
 for(const button of await page.locator('.arena-v2 button.art-control,.wallet button.art-control,.bottom-nav button.art-control').all())if(await button.isVisible())report.push(await press(page,button));
 assert.equal(await page.locator('.bottom-nav [data-action=arena]:visible').getAttribute('data-art-button'),'nav-arena-selected');
 const original=await page.locator('.challenger.opponent strong').innerText();
 await page.locator('#arena-next').click();await page.locator('.arena-opponents-runtime [data-tier="1"]').click();await page.locator('.arena-opponents-runtime .home-back').click();await page.locator('.arena-v2[aria-busy=false]').waitFor();
 assert.notEqual(await page.locator('.challenger.opponent strong').innerText(),original);
 await page.locator('#arena-next').click();await page.locator('.arena-opponents-runtime .more').click();await page.locator('.arena-opponents-runtime [data-tier="2"]').click();await page.locator('.arena-opponents-runtime .home-back').click();await page.locator('.arena-v2[aria-busy=false]').waitFor();
 await page.locator('#arena-formation').click();await page.locator('#arena-defense').click();await waitForSave(page,s=>!!s.arena.defense);await page.keyboard.press('Escape');
 for(const [button,screen] of [['arena-rank','.arena-records-runtime'],['arena-history','.arena-records-runtime'],['arena-season','.arena-season-runtime']]){await page.locator('#'+button).click();await page.locator(screen+'[aria-busy=false]').waitFor();await page.locator(screen+' .home-back').click();await page.locator('.arena-v2[aria-busy=false]').waitFor();}
 await page.locator('#arena-rules').click();await page.keyboard.press('Escape');
 const beforeShop=await savedState(page);await page.locator('#arena-shop').click();await page.locator('.merit-shop-runtime[aria-busy=false]').waitFor();await page.locator('.merit-shop-runtime [data-product=treasure]').click();await page.locator('.merit-shop-runtime[aria-busy=false]').waitFor();await page.locator('.merit-shop-runtime .apply').evaluate(b=>{b.click();b.click();});const bought=await waitForSave(page,s=>s.merit===beforeShop.merit-30);assert.equal(bought.treasureTokens,beforeShop.treasureTokens+5);await page.locator('.merit-shop-runtime[aria-busy=false]').waitFor();await page.locator('.merit-shop-runtime .home-back').click();await page.locator('.arena-v2[aria-busy=false]').waitFor();
 for(const size of [{width:320,height:568},{width:390,height:844},{width:1440,height:900}]){
  await page.setViewportSize(size);await page.waitForTimeout(100);await page.screenshot({path:artifact('arena-v2','live-'+size.width+'.png')});
  for(const [panelSelector,images] of [['.duel-stage','.duel-generals .general-original'],['.formation','.formation-generals .general-original']]){const panel=await page.locator(panelSelector).boundingBox();for(const img of await page.locator(images).all()){const b=await img.boundingBox();assert.ok(b.x>=panel.x&&b.x+b.width<=panel.x+panel.width&&b.y>=panel.y&&b.y+b.height<=panel.y+panel.height,'Full independent original');}}
  const clipped=await page.locator('.arena-v2 button').evaluateAll(es=>es.flatMap(e=>{const b=e.getBoundingClientRect(),w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),bad=[];while(w.nextNode()){if(!w.currentNode.textContent.trim())continue;const r=document.createRange();r.selectNodeContents(w.currentNode);const t=r.getBoundingClientRect();if(t.left<b.left||t.right>b.right||t.top<b.top||t.bottom>b.bottom)bad.push(w.currentNode.textContent);}return bad;}));assert.deepEqual(clipped,[]);
 }
 await page.evaluate(async()=>window.arenaTestBans=(await import('./arena-state.js')).bannedHeroes(Date.now()));
 await seed(page,s=>{s.order=Object.keys(s.heroes).filter(id=>s.heroes[id].owned&&!window.arenaTestBans.includes(id)).slice(0,6);return s;});await page.locator('.arena-v2[aria-busy=false]').waitFor();
 const beforeBattle=await savedState(page);await page.locator('#arena-start').click();await page.locator('[data-dialog-cancel]').click();assert.deepEqual(await savedState(page),beforeBattle);
 await page.evaluate(()=>{const original=IDBObjectStore.prototype.put;window.failArenaWrite=true;IDBObjectStore.prototype.put=function(...args){if(this.name==='profile'&&window.failArenaWrite){window.failArenaWrite=false;this.transaction.abort();return;}return original.apply(this,args);};});
 await page.locator('#arena-start').click();await page.locator('[data-dialog-confirm]').click();await page.locator('.arena-error').waitFor();assert.deepEqual(await savedState(page),beforeBattle);await page.keyboard.press('Escape');
 await page.locator('#arena-start').click();await page.locator('[data-dialog-confirm]').evaluate(b=>{b.click();b.click();});await page.locator('.battle-screen[aria-busy=false]').waitFor();
 const prepared=await savedState(page);assert.equal(prepared.battleRun.mode,'arena');assert.equal(prepared.battleRun.match.id,prepared.arena.match.id);assert.equal(prepared.gold,beforeBattle.gold);
 await page.reload();await page.locator('.battle-screen[aria-busy=false]').waitFor();assert.equal((await savedState(page)).battleRun.match.id,prepared.arena.match.id);
 await page.locator('#battle-start').click();await page.locator('[data-speed="3"]').click();await page.locator('.battle-result').waitFor({timeout:60000});
 const settled=await savedState(page),receipt=settled.battleRun.receipt;assert.ok(receipt);assert.equal(settled.gold,beforeBattle.gold+receipt.gold);assert.equal(settled.merit,beforeBattle.merit+receipt.merit);assert.equal(settled.arena.score,beforeBattle.arena.score+receipt.score);assert.equal(settled.arena.match,null);assert.ok(settled.arena.history.length);
 await page.reload();await page.locator('.battle-result').waitFor();assert.equal((await savedState(page)).gold,settled.gold);assert.equal((await savedState(page)).merit,settled.merit);
 await page.locator('#battle-return').click();await waitForSave(page,s=>s.battleRun===null);await page.locator('.arena-v2[aria-busy=false]').waitFor();assert.equal(await page.locator('#arena-merit').innerText(),settled.merit.toLocaleString());
 assert.deepEqual(errors,[]);await fs.writeFile(artifact('arena-v2','pressed-verification.json'),JSON.stringify(report,null,2));console.log('PASS approved UI pixels, '+report.length+' pressed masks, 14 nine-slices, opponents, defense, merit shop, 3 viewports, start cancel/rollback/duplicate, prepared reload, full battle, reward/ELO/history and idempotent settlement');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
