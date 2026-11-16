const {launch,start,seed,artifact,savedState,waitForSave,baseUrl}=require('./browser-env.cjs');
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
 if(outside){await sharp(before.data,{raw:before.info}).png().toFile(artifact('alliance-v2','failed-before.png'));await sharp(after.data,{raw:after.info}).png().toFile(artifact('alliance-v2','failed-after.png'));await sharp(mask.data,{raw:mask.info}).png().toFile(artifact('alliance-v2','failed-mask.png'));}
 assert.equal(outside,0,'Pressed changes outside source alpha: '+await button.innerText());assert.ok(changed>100);
 assert.ok(frame>25);assert.equal(missed,0,'Entire border must press: '+await button.innerText());
 await page.mouse.move(939,1480);await page.mouse.up();
 return {label:await button.getAttribute('aria-label')||await button.innerText(),outside,changed,frame,missed};
}
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:941,height:1672},deviceScaleFactor:1}),errors=[],report=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 await start(page,{hash:'#alliance'});await page.locator('.alliance-v2[aria-busy=false]').waitFor();
 assert.ok(await page.locator('#guild-attend').isDisabled());
 await page.locator('#guild-search').click();await page.locator('[data-join=cloud]').click();await page.locator('#guild-confirm').click();
 const joined=await waitForSave(page,s=>!!s.alliance.guild);assert.ok(await page.locator('#guild-donate').isDisabled());assert.ok(await page.locator('#guild-supply').isDisabled());
 await page.locator('#guild-attend').evaluate(b=>{b.click();b.click();});
 const attended=await waitForSave(page,s=>s.gold===joined.gold+50);assert.equal(attended.alliance.contribution,5);assert.ok(await page.locator('#guild-attend').isDisabled());
 await page.reload();await page.locator('.alliance-v2[aria-busy=false]').waitFor();assert.ok(await page.locator('#guild-attend').isDisabled());assert.equal((await savedState(page)).gold,attended.gold);
 // Match the approved design with an isolated, reproducible profile.
 await seed(page,s=>{const a=s.alliance;a.guild.joinedAt-=48*3600000;a.guild.notice='군량을 모아 함께 토벌을 준비합시다.';a.preparation=60;a.contribution=120;a.attendDay='';while(a.guild.members.length<12)a.guild.members.push({id:'sample'+a.guild.members.length,name:'동맹원',portrait:'1',role:'회원',points:0});s.gold=12450;s.diamonds=s.freeDiamonds=320;s.paidDiamonds=0;return s;});
 await page.locator('.alliance-v2[aria-busy=false]').waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(250);await page.mouse.move(939,1480);
 const game=page.locator('.game'),origin=await game.boundingBox();
 // Measure both layouts with the same browser rasterizer. The archived PNG
 // remains the approval record and the preview retains its approved coordinates.
 const preview=await browser.newPage({viewport:{width:941,height:1672},deviceScaleFactor:1});
 await preview.goto(baseUrl+'previews/alliance-v1/index.html');
 await preview.locator('.game[aria-busy=false]').waitFor();
 const reference=await read(await preview.locator('.game').screenshot({path:artifact('alliance-v2','current-preview.png')}));
 await preview.close();
 const shot=await game.screenshot({path:artifact('alliance-v2','approved-layout.png')}),actual=await read(shot);
 const images=await page.locator('.alliance-v2 .general-original').evaluateAll((es,o)=>es.map(e=>{const r=e.getBoundingClientRect();return {left:Math.floor(r.left-o.x)-1,right:Math.ceil(r.right-o.x)+1,top:Math.floor(r.top-o.y)-1,bottom:Math.ceil(r.bottom-o.y)+1};}),origin);
 const scrollChange=await require('./approved-ui-changes.cjs')(page,941,origin);
 let changed=0,imageRasterPixels=0,imageError=0;for(let i=0;i<actual.data.length;i+=4)if(!scrollChange(i)&&!actual.data.subarray(i,i+4).equals(reference.data.subarray(i,i+4))){const x=i/4%941,y=Math.floor(i/4/941);if(images.some(r=>x>=r.left&&x<r.right&&y>=r.top&&y<r.bottom)){imageRasterPixels++;for(let k=0;k<3;k++)imageError+=Math.abs(actual.data[i+k]-reference.data[i+k]);}else changed++;}
 // Original character PNGs are unchanged; Chromium can choose a different
 // decoded downsampling level. Every UI pixel remains a strict comparison.
 await fs.writeFile(artifact('alliance-v2','pixel-comparison.json'),JSON.stringify({changed,imageRasterPixels,compared:941*1672}));assert.equal(changed,0,'Approved alliance UI pixels');assert.ok(imageError/actual.data.length<.6);
 for(const button of await page.locator('.alliance-v2 button.art-control,.wallet button.art-control,.bottom-nav button.art-control').all())if(await button.isVisible())report.push(await press(page,button));
 const frames=await page.evaluate(async()=>{const {renderNineSlice}=await import('./nine-slice.js'),out=[];for(const tone of ['blue','green'])for(const [w,h] of [[281,74],[901,410],[901,270],[268,66],[430,130],[430,112],[600,360]])out.push({tone,w,h,url:await renderNineSlice(tone,w,h,{stablePixels:true})});return out;});
 const corners={};for(const f of frames){const png=Buffer.from(f.url.split(',')[1],'base64'),parts=[];for(const [left,top] of [[0,0],[f.w-28,0],[0,f.h-28],[f.w-28,f.h-28]])parts.push(await sharp(png).extract({left,top,width:28,height:28}).raw().toBuffer());if(!corners[f.tone])corners[f.tone]=parts;else parts.forEach((part,i)=>assert.ok(part.equals(corners[f.tone][i]),'Fixed corner ornament'));}
 const before=await savedState(page);await page.locator('#guild-donate').click();await page.locator('#guild-cancel').click();assert.deepEqual(await savedState(page),before);
 await page.locator('#guild-donate').click();await page.locator('#guild-confirm').evaluate(b=>{b.click();b.click();});
 const donated=await waitForSave(page,s=>s.alliance.donations===1);assert.equal(donated.gold,12350);assert.equal(donated.alliance.contribution,130);assert.equal(donated.alliance.preparation,80);
 await page.locator('#guild-supply').click();await page.locator('#guild-confirm').click();
 const supplied=await waitForSave(page,s=>s.alliance.supply);assert.equal(supplied.gold,12350);assert.equal(supplied.alliance.contribution,140);assert.equal(supplied.alliance.preparation,100);assert.equal(await page.locator('#guild-supply').innerText(),'보상 받기');
 await page.locator('#guild-supply').click();await page.locator('#guild-confirm').evaluate(b=>{b.click();b.click();});
 const claimed=await waitForSave(page,s=>s.alliance.claimed);assert.equal(claimed.gold,12650);assert.ok(await page.locator('#guild-supply').isDisabled());
 for(let n=2;n<=3;n++){await page.locator('#guild-donate').click();await page.locator('#guild-confirm').click();await waitForSave(page,s=>s.alliance.donations===n);}
 assert.ok(await page.locator('#guild-donate').isDisabled());const capped=await savedState(page);assert.equal(capped.gold,12450);assert.equal(capped.alliance.contribution,160);
 await page.reload();await page.locator('.alliance-v2[aria-busy=false]').waitFor();assert.ok(await page.locator('#guild-donate').isDisabled());assert.ok(await page.locator('#guild-supply').isDisabled());
 // New day/week refresh is based on the real period calculation.
 await page.evaluate(()=>{const now=Date.now();Date.now=()=>now+8*86400000;window.dispatchEvent(new Event('focus'));});
 await page.locator('.alliance-v2[aria-busy=false]').waitFor();assert.equal(await page.locator('#guild-supply').innerText(),'군량 지원');assert.ok(await page.locator('#guild-donate').isEnabled());assert.ok(await page.locator('#guild-attend').isEnabled());
 await page.locator('#guild-supply').click();await page.locator('#guild-confirm').click();const nextWeek=await waitForSave(page,s=>s.alliance.week!==capped.alliance.week);assert.equal(nextWeek.alliance.preparation,40);assert.equal(nextWeek.alliance.donations,0);assert.ok(await page.locator('#guild-supply').isDisabled());
 // Failed persistence leaves currency, contribution, limits and preparation intact.
 const beforeFail=await savedState(page);
 await page.evaluate(()=>{const original=IDBObjectStore.prototype.put;window.failNextAllianceWrite=true;IDBObjectStore.prototype.put=function(...args){if(this.name==='profile'&&window.failNextAllianceWrite){window.failNextAllianceWrite=false;this.transaction.abort();return;}return original.apply(this,args);};});
 await page.locator('#guild-donate').click();await page.locator('#guild-confirm').click();await page.locator('.guild-error').waitFor();assert.deepEqual(await savedState(page),beforeFail);await page.locator('#guild-cancel').click();
 // Direct attendance errors are visible even though no dialog is open.
 await page.evaluate(()=>window.failNextAllianceWrite=true);await page.locator('#guild-attend').click();await page.locator('#toast:not([hidden])').waitFor();assert.deepEqual(await savedState(page),beforeFail);
 await page.locator('#guild-members').click();assert.equal(await page.locator('#modal .guild-member').count(),12);await page.keyboard.press('Escape');await page.locator('#guild-log').click();await page.keyboard.press('Escape');
 const slots=await page.locator('.bottom-nav button:visible').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));
 for(const tab of ['home','barracks','shop','alliance'])await page.locator('.bottom-nav [data-action='+tab+']:visible').click();
 assert.deepEqual(await page.locator('.bottom-nav button:visible').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON())),slots);assert.equal(await page.locator('.bottom-nav [data-action=alliance]:visible').getAttribute('data-art-button'),'nav-alliance-selected');
 await seed(page,s=>{s.gold=0;s.alliance.guild.notice='<img src=x onerror=alert(1)> '+ '함께하는 동맹 공지입니다. '.repeat(3);return s;});await page.locator('.alliance-v2[aria-busy=false]').waitFor();assert.ok(await page.locator('#guild-donate').isDisabled());assert.equal(await page.locator('.guild-notice img').count(),0);
 for(const size of [{width:280,height:568},{width:320,height:568},{width:390,height:844},{width:1440,height:900}]){
  await page.setViewportSize(size);await page.waitForTimeout(100);await page.screenshot({path:artifact('alliance-v2','live-'+size.width+'.png')});const panel=await page.locator('.headquarters').boundingBox();
  for(const img of await page.locator('.alliance-v2 .general-original').all()){const r=await img.boundingBox();assert.ok(r.x>=panel.x&&r.x+r.width<=panel.x+panel.width&&r.y>=panel.y&&r.y+r.height<=panel.y+panel.height);}
  assert.equal(await page.locator('.alliance-v2').evaluate(e=>e.scrollHeight>e.clientHeight+1||e.scrollWidth>e.clientWidth+1),false);
  const clipped=await page.locator('.alliance-v2 .section-tabs button,.alliance-v2 .cooperation-actions button,.alliance-v2 .activity-buttons button').evaluateAll(es=>es.flatMap(e=>{const b=e.getBoundingClientRect(),w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),bad=[];while(w.nextNode()){if(!w.currentNode.textContent.trim())continue;const r=document.createRange();r.selectNodeContents(w.currentNode);const t=r.getBoundingClientRect();if(t.left<b.left||t.right>b.right||t.top<b.top||t.bottom>b.bottom)bad.push(w.currentNode.textContent);}return bad;}));assert.deepEqual(clipped,[],'Button labels remain inside the frame');
  const button=page.locator('#guild-members'),box=await button.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
  assert.equal(await button.evaluate(el=>el.classList.contains('is-pressed')),true);
  assert.deepEqual(await button.boundingBox(),box,'Pressed keeps the same small-screen button bounds');
  await page.mouse.move(0,0);await page.mouse.up();
  assert.equal(await button.evaluate(el=>el.classList.contains('is-pressed')),false);
 }
 assert.deepEqual(errors,[]);await fs.writeFile(artifact('alliance-v2','pressed-verification.json'),JSON.stringify(report,null,2));console.log('PASS approved live preview comparison, '+report.length+' pressed masks, 14 nine-slice sizes, join/cooldown, attendance, donation/supply/claim, duplicate/cancel, limits/rollover, failure rollback, reload, shared navigation and 4 sizes');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
