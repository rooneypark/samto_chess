const {launch,start,seed,artifact,waitForSave,savedState}=require('./browser-env.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),sharp=require('../../design-delivery/v1/a-production/tools/node_modules/sharp');
const metadata=JSON.parse(fs.readFileSync(path.resolve('game/assets/ui-common/manifest.json'))).records;
async function checkPress(page,button){
 const id=await button.getAttribute('data-art-button'),def=metadata[id];const box=await button.boundingBox(),clip=Object.fromEntries(Object.entries(box).map(([k,v])=>[k,Math.round(v)]));
 await page.mouse.move(939,1480);await button.evaluate(e=>e.blur());
 const before=await page.screenshot({clip});
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();assert.equal(await button.evaluate(e=>e.classList.contains('is-pressed')),true,id);
 assert.deepEqual(await button.boundingBox(),box,id+' must not shift');
 const after=await page.screenshot({clip,path:artifact('ui-components',id+'-pressed.png')});
 const a=await sharp(before).ensureAlpha().raw().toBuffer({resolveWithObject:true}),b=await sharp(after).ensureAlpha().raw().toBuffer();
 let mask=await sharp(path.resolve('game/assets/ui-common/'+def.file)).resize(a.info.width,a.info.height,{kernel:'nearest'}).ensureAlpha().raw().toBuffer();
 // The same applies to any control whose layout box lands on a fractional pixel.
 if(id.startsWith('barracks-card')||[box.x,box.y,box.width,box.height].some(v=>!Number.isInteger(v))){
  // Grid cards have fractional CSS bounds. Rasterize the source mask at those
  // exact bounds; rounding and resizing the PNG shifts its edge by a pixel.
  await button.evaluate(e=>{const r=e.getBoundingClientRect(),layer=document.createElement('div'),face=document.createElement('div');layer.id='qa-card-mask';Object.assign(layer.style,{position:'fixed',inset:'0',background:'black',zIndex:'2147483647',pointerEvents:'none'});Object.assign(face.style,{position:'absolute',left:r.x+'px',top:r.y+'px',width:r.width+'px',height:r.height+'px',background:'white',maskImage:getComputedStyle(e).getPropertyValue('--art-image'),maskSize:'100% 100%',maskRepeat:'no-repeat',imageRendering:getComputedStyle(e).imageRendering});layer.append(face);document.body.append(layer);});
  const raster=await sharp(await page.screenshot({clip})).ensureAlpha().raw().toBuffer();
  await page.locator('#qa-card-mask').evaluate(e=>e.remove());
  for(let i=0;i<mask.length;i+=4)mask[i+3]=raster[i];
 }
 let outside=0,frame=0,missed=0;const samples=[];
 for(let y=0;y<a.info.height;y++)for(let x=0;x<a.info.width;x++){
  const i=(y*a.info.width+x)*4,delta=Math.abs(a.data[i]-b[i])+Math.abs(a.data[i+1]-b[i+1])+Math.abs(a.data[i+2]-b[i+2]);
  if(mask[i+3]===0&&delta>3)outside++;
  if(mask[i+3]===255&&(x<a.info.width*.12||x>a.info.width*.88||y<a.info.height*.12||y>a.info.height*.88)&&Math.max(mask[i],mask[i+1],mask[i+2])>100&&a.data[i]+a.data[i+1]+a.data[i+2]>30){
   frame++;if(b[i]+b[i+1]+b[i+2]>(a.data[i]+a.data[i+1]+a.data[i+2])*.92){missed++;if(samples.length<12)samples.push({x,y,a:[...a.data.slice(i,i+3)],b:[...b.slice(i,i+3)]});}
  }
 }
 assert.equal(outside,0,id+' must leave all transparent exterior pixels untouched');
 assert.ok(frame>25,id+' visible border');assert.equal(missed,0,id+' must press complete visible frame '+JSON.stringify({box,samples}));
 await page.mouse.move(939,1480);await page.mouse.up();assert.equal(await button.evaluate(e=>e.classList.contains('is-pressed')),false);
 return {id,frame,outside};
}
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:941,height:1672},deviceScaleFactor:1}),errors=[],report=[];page.on('pageerror',e=>errors.push(e.message));
 await start(page);
 await seed(page,s=>{s.order=['1','xuchu','32','35','diaochan','119'];for(const id of s.order){s.heroes[id].owned=true;s.heroes[id].cards=99;}s.gold=12450;s.diamonds=320;s.freeDiamonds=320;s.paidDiamonds=0;s.reducedMotion=true;return s;});
 await page.locator('.game[aria-busy=false]').waitFor();
 for(const id of ['gate-profile','gate-gold','gate-diamonds','gate-mail','gate-quests','gate-start','gate-settings','gate-codex','gate-expedition','gate-tower','gate-formation','gate-campaign','gate-depart','nav-shop','nav-barracks','nav-home-selected','nav-alliance','nav-arena'])report.push(await checkPress(page,page.locator('[data-art-button="'+id+'"]')));
 await page.screenshot({path:artifact('ui-components','gate-normal.png')});
 await page.locator('[role=tab][data-action=barracks]').click();await page.locator('.barracks-v2').waitFor();await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
 assert.equal(await page.locator('.hero-name').textContent(),'관우');
 for(const id of ['gate-gold','gate-diamonds','barracks-back','barracks-train','barracks-awaken','barracks-formation','barracks-treasure','barracks-skill','barracks-filter-all','barracks-filter-wei','barracks-filter-shu','barracks-filter-wu','barracks-filter-qun','nav-shop','nav-barracks-selected','nav-home','nav-alliance','nav-arena'])report.push(await checkPress(page,page.locator('[data-art-button="'+id+'"]')));
 for(const hero of ['1','xuchu','32','35','diaochan','119']){
  await page.locator('.roster-card[data-hero="'+(hero==='1'?'32':'1')+'"]').click();
  const card=page.locator('.roster-card[data-hero="'+hero+'"]');
  report.push(await checkPress(page,card));await card.click();
  report.push(await checkPress(page,card));
 }
 await page.locator('.roster-card[data-hero="1"]').click();
 await page.screenshot({path:artifact('ui-components','barracks-normal.png')});
 await page.locator('.barracks-screen [data-faction="위"]').click();assert.equal(await page.locator('.barracks-screen [data-faction="위"]').getAttribute('aria-pressed'),'true');
 assert.ok(await page.locator('.roster-card').count()>0);
 assert.ok(await page.locator('.roster-card').evaluateAll(async els=>{const {heroes}=await import('./heroes.js');return els.every(e=>heroes.find(h=>h.id===e.dataset.hero).faction==='위')}));
 await page.locator('.barracks-screen [data-faction="전체"]').click();await page.locator('[data-hero="35"]').click();assert.equal(await page.locator('.hero-name').textContent(),'제갈량');
 const old=(await savedState(page)).heroes['35'].level;
 await page.locator('#train').click();await page.locator('#growth-confirm').click();await waitForSave(page,s=>s.heroes['35'].level===old+1);
 assert.equal(await page.locator('.hero-level').textContent(),'Lv.'+(old+1));
 await page.locator('#hero-skill').click();await page.locator('#modal[open]').waitFor();await page.keyboard.press('Escape');
 // The treasure box and formation are their own screens now; each returns to the barracks.
 for(const [id,screen] of [['treasure-open','.treasure-runtime'],['barracks-formation','.formation-runtime']]){await page.locator('#'+id).click();await page.locator(screen+'[aria-busy=false]').waitFor();await page.locator(screen+' .home-back').click();await page.locator(screen).waitFor({state:'hidden'});await page.locator('.barracks-screen').waitFor();}
 for(const viewport of [{width:320,height:568},{width:390,height:844},{width:1440,height:900}]){
  await page.setViewportSize(viewport);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));/* the page refits on the resize event */const root=await page.locator('.game').boundingBox();assert.ok(root.width<=viewport.width+.1&&root.height<=viewport.height+.1);
  for(const id of ['train','awaken','treasure-open']){const b=await page.locator('#'+id).boundingBox();assert.ok(b.x>=root.x&&b.x+b.width<=root.x+root.width+1);}
  const image=await page.locator('.hero-stage img').boundingBox(),panel=await page.locator('.hero-stage').boundingBox();assert.ok(image.x>=panel.x-.1&&image.y>=panel.y-.1&&image.y+image.height<=panel.y+panel.height+.1);
  await page.screenshot({path:artifact('ui-components','barracks-'+viewport.width+'.png')});
 }
 await page.setViewportSize({width:941,height:1672});await page.locator('[role=tab][data-action=home]').click();await page.locator('[data-action=depart]').click();await page.locator('.battle-v2[aria-busy=false]').waitFor();
 for(const id of ['barracks-back','battle-help','battle-capacity','battle-summon','battle-start','battle-bonds']){const el=page.locator('.battle-v2 [data-art-button="'+id+'"]');if(await el.isEnabled())report.push(await checkPress(page,el));}
 await page.screenshot({path:artifact('ui-components','battle-normal.png')});
 fs.writeFileSync(artifact('ui-components','verification.json'),JSON.stringify(report,null,2));assert.deepEqual(errors,[]);
 console.log('PASS '+report.length+' real-screen alpha masks, full pressed borders, native growth, faction filters and 3 responsive sizes');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});

