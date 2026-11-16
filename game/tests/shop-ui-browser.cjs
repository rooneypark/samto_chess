const {launch,start,seed,artifact,savedState,waitForSave}=require('./browser-env.cjs');
const sharp=require('../../design-delivery/v1/a-production/tools/node_modules/sharp'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=buffer=>sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
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
 if(outside){await sharp(before.data,{raw:before.info}).png().toFile(artifact('shop-v2','failed-before.png'));await sharp(after.data,{raw:after.info}).png().toFile(artifact('shop-v2','failed-after.png'));await sharp(mask.data,{raw:mask.info}).png().toFile(artifact('shop-v2','failed-mask.png'));}
 assert.equal(outside,0,'Pressed changes outside source alpha: '+await button.innerText());assert.ok(changed>100);
 assert.ok(frame>25);assert.equal(missed,0,'Entire border must press: '+await button.innerText());
 await page.mouse.move(939,1480);await page.mouse.up();
 return {label:await button.getAttribute('aria-label')||await button.innerText(),outside,changed,frame,missed};
}
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:941,height:1672},deviceScaleFactor:1}),errors=[],report=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 await start(page,{hash:'#shop'});await seed(page,s=>{s.gold=12450;s.diamonds=s.freeDiamonds=320;s.paidDiamonds=0;return s});await page.locator('.shop-v2[aria-busy=false]').waitFor();
 await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});await page.mouse.move(939,1480);
 // Chromium may finish its decoded sprite raster after the first two frames.
 // Compare the settled paint, not that transient first-load resampling.
 await page.waitForTimeout(200);
 const shot=await page.locator('.game').screenshot({path:artifact('shop-v2','approved-layout.png')}),actual=await read(shot),reference=await read(await fs.readFile(path.join(root,'design-delivery/v2/05-mockups/shop-recruitment-v1.png')));
 const scrollChange=await require('./approved-ui-changes.cjs')(page);
 assert.equal(actual.info.width,reference.info.width);let changed=0,updatedNavigationPixels=0;for(let i=0;i<actual.data.length;i+=4)if(!scrollChange(i)&&!actual.data.subarray(i,i+4).equals(reference.data.subarray(i,i+4))){const x=i/4%941,y=Math.floor(i/4/941);if(x>=18&&x<928&&y>=1512&&y<1656)updatedNavigationPixels++;else changed++;}
 await fs.writeFile(artifact('shop-v2','pixel-comparison.json'),JSON.stringify({changed,updatedNavigationPixels,compared:941*1672},null,2));
 assert.equal(changed,0,'Actual shop must match the approved composition at reference state');
 // The selected tab must retain every cream/highlight pixel from the source lettering.
 const original=await read(await fs.readFile(path.join(root,'game/assets/ui-common/nav-shop.png'))),selected=await read(await fs.readFile(path.join(root,'game/assets/shop-v2/nav-shop-selected.png')));
 let strokes=0;for(let y=88;y<133;y++)for(let x=33;x<146;x++){const i=(y*178+x)*4;if(original.data[i]>125&&original.data[i+1]>125&&original.data[i+2]>90){assert.ok(original.data.subarray(i,i+4).equals(selected.data.subarray(i,i+4)));strokes++;}}assert.ok(strokes>300);
 const frames=await page.evaluate(async()=>{const {renderNineSlice}=await import('./nine-slice.js'),out=[];for(const tone of ['blue','green'])for(const [w,h] of [[180,60],[281,74],[350,138],[425,72],[500,138],[901,488],[700,190]])out.push({tone,w,h,url:await renderNineSlice(tone,w,h)});return out;});
 const corners={};for(const f of frames){const png=Buffer.from(f.url.split(',')[1],'base64'),{data}=await read(png),parts=[];
  for(const [x,y] of [[0,0],[f.w-28,0],[0,f.h-28],[f.w-28,f.h-28]])parts.push(await sharp(png).extract({left:x,top:y,width:28,height:28}).raw().toBuffer());
  if(!corners[f.tone])corners[f.tone]=parts;else parts.forEach((p,i)=>assert.ok(p.equals(corners[f.tone][i]),'Corner ornament changed'));
  for(let y=28;y<f.h-28;y++)for(let x=28;x<f.w-28;x++)assert.equal(data[(y*f.w+x)*4+3],255);
 }
 // A late disposer from the previous screen cannot detach a fresh instance.
 const resized=await page.evaluate(async()=>{
  const {nineSlice,disposeNineSlices}=await import('./nine-slice.js'),el=document.createElement('div');
  el.style.cssText='position:absolute;left:-1000px;width:180px;height:60px';document.querySelector('.game').append(el);
  const oldDispose=await nineSlice(el,'blue',{button:false});disposeNineSlices(el);
  await nineSlice(el,'green',{button:false});oldDispose();el.style.width='350px';
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  const img=new Image();img.src=el.style.getPropertyValue('--art-image').slice(5,-2);await img.decode();
  const result={width:img.width,tone:el.dataset.nineSlice};disposeNineSlices(el);el.remove();return result;
 });assert.deepEqual(resized,{width:350,tone:'green'});
 for(const button of await page.locator('.shop-v2 button.art-control,.wallet button.art-control,.bottom-nav button.art-control').all())if(await button.isVisible())report.push(await press(page,button));
 // A canceled purchase cannot consume anything.
 const before=await savedState(page);await page.locator('[data-count="1"]').click();await page.locator('#purchase-cancel').click();assert.deepEqual(await savedState(page),before);
 // Duplicate activations on the same confirmation cause one debit/award.
 await page.locator('[data-count="1"]').click();await page.locator('#purchase-confirm').evaluate(b=>{b.click();b.click();});
 const one=await waitForSave(page,s=>!!s.shop.pending);assert.equal(one.gold,before.gold-300);assert.equal(one.shop.pending.results.length,1);assert.equal(Object.keys(one.shop.receipts).length,Object.keys(before.shop.receipts).length+1);
 const awarded=one.shop.pending.results[0];assert.ok(one.heroes[awarded.id].owned);
 if(before.heroes[awarded.id].owned)assert.equal(one.heroes[awarded.id].cards,before.heroes[awarded.id].cards+1);
 await page.reload();await page.locator('.recruit-results-runtime .save').waitFor();assert.equal((await savedState(page)).gold,one.gold);await page.locator('.recruit-results-runtime .save').click();await waitForSave(page,s=>!s.shop.pending);
 // Ten draws debit exactly once and keep the B+ guarantee.
 await page.locator('[data-count="10"]').click();await page.locator('#purchase-confirm').click();
 const ten=await waitForSave(page,s=>s.shop.pending?.results.length===10);assert.equal(ten.gold,one.gold-3000);assert.ok(ten.shop.pending.results.some(r=>r.grade!=='C'));await page.locator('.recruit-results-runtime .save').click();await waitForSave(page,s=>!s.shop.pending);
 // Free diamonds are consumed before paid diamonds, including a split debit.
 await seed(page,s=>{s.diamonds=150;s.freeDiamonds=40;s.paidDiamonds=110;return s});await page.locator('.shop-v2[aria-busy=false]').waitFor();await page.locator('[data-select-currency=diamonds]').click();
 assert.ok(await page.locator('[data-count="10"]').isDisabled());await page.locator('[data-count="1"]').click();await page.locator('#purchase-confirm').click();
 const diamond=await waitForSave(page,s=>!!s.shop.pending);assert.equal(diamond.diamonds,50);assert.equal(diamond.freeDiamonds,0);assert.equal(diamond.paidDiamonds,50);
 await page.locator('.recruit-results-runtime .save').click();await waitForSave(page,s=>!s.shop.pending);assert.ok(await page.locator('[data-count="1"]').isDisabled());assert.equal(await page.locator('.wallet [data-field=diamonds]:visible').textContent(),'50');
 // Simulate an aborted IndexedDB write; no debit, award, pity or receipt survives.
 await page.locator('[data-select-currency=gold]').click();const beforeFail=await savedState(page);
 await page.evaluate(()=>{const original=IDBObjectStore.prototype.put;window.failNextShopWrite=true;IDBObjectStore.prototype.put=function(...args){if(this.name==='profile'&&window.failNextShopWrite){window.failNextShopWrite=false;this.transaction.abort();return;}return original.apply(this,args);};});
 await page.locator('[data-count="1"]').click();await page.locator('#purchase-confirm').click();await page.locator('#toast:not([hidden])').waitFor();
 assert.deepEqual(await savedState(page),beforeFail);assert.equal(await page.locator('.wallet [data-field=gold]:visible').textContent(),beforeFail.gold.toLocaleString());await page.locator('#purchase-cancel').click();
 // Revisit the live page through the other artwork tabs and exercise all sizes.
 for(const tab of ['home','barracks','shop'])await page.locator('.bottom-nav [data-action="'+tab+'"]:visible').click();
 for(const size of [{width:320,height:568},{width:390,height:844},{width:1440,height:900}]){
  await page.setViewportSize(size);await page.screenshot({path:artifact('shop-v2','live-'+size.width+'.png')});const panel=await page.locator('.recruit-stage').boundingBox();
  for(const image of await page.locator('.shop-v2 .general-original').all()){const r=await image.boundingBox();assert.ok(r.x>=panel.x&&r.x+r.width<=panel.x+panel.width&&r.y>=panel.y&&r.y+r.height<=panel.y+panel.height);}
  assert.equal(await page.locator('.shop-v2').evaluate(e=>e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1),false);
 }
 assert.deepEqual(errors,[]);await fs.writeFile(artifact('shop-v2','pressed-verification.json'),JSON.stringify(report,null,2));
 console.log('PASS approved pixels with restored shop icon and lettering; 14 nine-slice sizes; '+report.length+' pressed alpha masks; gold/diamond debits, duplicate prevention, cancellation, reload recovery, write-failure rollback, 3 responsive layouts');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
