const {launch,start,seed,artifact,savedState}=require('./browser-env.cjs');
const sharp=require('../../design-delivery/v1/a-production/tools/node_modules/sharp');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),read=buffer=>sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:941,height:1672},deviceScaleFactor:1}),errors=[],report={pressed:[],frames:[],viewports:[],states:[]};
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 await start(page,{hash:'#campaign'});await seed(page,(s,{battleRun,battleEngine})=>{
 s.gold=12350;s.diamonds=s.freeDiamonds=290;s.paidDiamonds=0;s.order=['1','119','32','35','xuchu','diaochan'];s.campaign={cleared:true,stages:{yellow_02:{cleared:true}}};
 for(const id of s.order)Object.assign(s.heroes[id],{owned:true,level:10,star:3});
 let r=battleRun.newRun(s,11,'record-ui-check',null,Date.now(),'yellow_03');r.round=5;r.capacity=6;r.units=s.order.map((hero,i)=>({id:i+1,hero,rank:2,x:i+1,y:3}));r=battleRun.startRound(r);while(!r.battle.result)battleEngine.stepBattle(r.battle);s.battleRun=r;return s;
 });await page.locator('.results-v1[aria-busy=false]').waitFor();const savedBefore=await savedState(page);await page.locator('#battle-stats').click();await page.locator('.combat-record-v1[aria-busy=false]').waitFor();
 await page.waitForTimeout(200);await page.mouse.move(939,1480);
 const shot=await page.screenshot({path:artifact('combat-record-v1','runtime-approved.png')}),actual=await read(shot),reference=await read(await fs.readFile(path.join(root,'design-delivery/v2/05-mockups/approved-runtime/shop-941.png')));
 const scrollChange=await require('./approved-ui-changes.cjs')(page);
 const approved=await read(await fs.readFile(path.join(root,'design-delivery/v2/05-mockups/battle-record-v1.png')));let drift=0;for(let i=0;i<actual.data.length;i+=4)if(!scrollChange(i)&&!actual.data.subarray(i,i+4).equals(approved.data.subarray(i,i+4)))drift++;assert.equal(drift,0,'Approved record screen pixel drift');report.approvedPixelDrift=drift;
 let common=0;
 for(let y=0;y<1672;y++)for(let x=0;x<941;x++){
  if(y<150){if(x>=333&&x<608&&y>=19&&y<125)continue;}
  else if(y>=1498){if(y>=1512&&y<1656&&(x>=18&&x<196||x>=384&&x<562))continue;}
  else continue;
  const i=(y*941+x)*4;assert.ok(actual.data.subarray(i,i+4).equals(reference.data.subarray(i,i+4)),'Approved shell drift '+x+','+y);common++;
 }
 report.identicalShellPixels=common;
 for(const button of await page.locator('.combat-record-v1 button.art-control').all()){
  const box=await button.boundingBox(),clip=Object.fromEntries(Object.entries(box).map(([k,v])=>[k,Math.round(v)]));
  await page.mouse.move(939,1480);await button.evaluate(e=>e.blur());const before=await read(await page.screenshot({clip}));
  const url=await button.evaluate(e=>getComputedStyle(e).getPropertyValue('--art-image').trim().slice(4,-1).replaceAll('"',''));
  const mask=await read(url.startsWith('data:')?Buffer.from(url.split(',')[1],'base64'):await fs.readFile(path.join(root,'game',url.replace(/^https?:\/\/[^/]+\/game\//,''))));
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();assert.ok(await button.evaluate(e=>e.classList.contains('is-pressed')));assert.deepEqual(await button.boundingBox(),box);
  const after=await read(await page.screenshot({clip}));let outside=0,frame=0,missed=0;
  for(let y=0;y<clip.height;y++)for(let x=0;x<clip.width;x++){
   const i=(y*clip.width+x)*4,a=before.data[i]+before.data[i+1]+before.data[i+2],b=after.data[i]+after.data[i+1]+after.data[i+2],delta=Math.abs(before.data[i]-after.data[i])+Math.abs(before.data[i+1]-after.data[i+1])+Math.abs(before.data[i+2]-after.data[i+2]);
   if(!mask.data[i+3]&&delta>3)outside++;
   if(mask.data[i+3]===255&&(x<clip.width*.12||x>clip.width*.88||y<clip.height*.12||y>clip.height*.88)&&Math.max(mask.data[i],mask.data[i+1],mask.data[i+2])>100&&a>30){frame++;if(b>a*.92)missed++;}
  }
  const label=await button.getAttribute('aria-label')||await button.innerText();assert.equal(outside,0,label+' alpha exterior');assert.ok(frame>25);assert.equal(missed,0,label+' full border');report.pressed.push({label,outside,frame,missed});await page.mouse.move(939,1480);await page.mouse.up();
 }
 const mounted=await page.locator('.combat-record-v1 [data-hero="1"]').boundingBox(),standing=await page.locator('.combat-record-v1 [data-hero="32"]').boundingBox();assert.ok(Math.abs(standing.height/mounted.height-.7)<.001,'Mounted/standing ratio');
 const xuchu=await page.locator('.combat-record-v1 [data-hero="xuchu"]').boundingBox();assert.ok(Math.abs(xuchu.height/mounted.height-.85)<.001,'Xu Chu is larger than other standing heroes and smaller than mounted heroes');
 const before=await page.locator('.unit-record').evaluateAll(es=>es.map(e=>({id:e.dataset.unit,box:JSON.stringify(e.getBoundingClientRect().toJSON())})));
 await page.locator('.unit-record').last().click();await page.locator('.combat-record-v1[aria-busy=false]').waitFor();
 assert.deepEqual(await page.locator('.unit-record').evaluateAll(es=>es.map(e=>({id:e.dataset.unit,box:JSON.stringify(e.getBoundingClientRect().toJSON())}))),before,'Selection keeps row geometry');
 for(const metric of ['healing','casts','damage']){
  await page.locator('[data-metric='+metric+']').click();await page.locator('.combat-record-v1[aria-busy=false]').waitFor();
  const values=await page.locator('.row-value').allTextContents();assert.equal(values.length,6);assert.ok(values.every(v=>!v.includes('NaN')));
  if(metric==='healing'){assert.ok(values.every(v=>v==='0'));assert.deepEqual(await page.locator('.record-bar i').evaluateAll(es=>es.map(e=>e.style.width)),Array(6).fill('0%'));}
  report.states.push({metric,values});
 }
 await page.locator('[data-side="1"]').click();await page.locator('.combat-record-v1[aria-busy=false]').waitFor();assert.equal(await page.locator('.unit-record').count(),6);assert.match((await page.locator('.row-name').allTextContents()).join(' '),/장각/);
 await page.screenshot({path:artifact('combat-record-v1','enemy.png')});
 await page.locator('[data-side="0"]').click();await page.locator('.combat-record-v1[aria-busy=false]').waitFor();
 const frames=await page.evaluate(async()=>{const {renderNineSlice}=await import('./nine-slice.js'),out=[];for(const tone of ['blue','green'])for(const [w,h] of [[901,142],[441,74],[289,64],[901,704],[861,98],[901,64],[582,84]])out.push({tone,w,h,url:await renderNineSlice(tone,w,h,{stablePixels:true})});return out;});
 const corners={};for(const f of frames){const png=Buffer.from(f.url.split(',')[1],'base64'),parts=[];
  for(const [left,top] of [[0,0],[f.w-24,0],[0,f.h-24],[f.w-24,f.h-24]])parts.push(await sharp(png).extract({left,top,width:24,height:24}).raw().toBuffer());
  if(!corners[f.tone])corners[f.tone]=parts;else parts.forEach((part,i)=>assert.ok(part.equals(corners[f.tone][i]),'Fixed corner ornament'));report.frames.push({tone:f.tone,width:f.w,height:f.h,identicalCorners:true});
 }
 for(const size of [{width:320,height:568},{width:390,height:844},{width:1440,height:900}]){
  await page.setViewportSize(size);await page.waitForTimeout(100);await page.screenshot({path:artifact('combat-record-v1','preview-'+size.width+'.png')});
  for(const row of await page.locator('.unit-record').all()){const panel=await row.boundingBox();for(const img of await row.locator('.general-original').all()){const b=await img.boundingBox();assert.ok(b.x>=panel.x&&b.x+b.width<=panel.x+panel.width&&b.y>=panel.y&&b.y+b.height<=panel.y+panel.height,'Entire character inside row');}}
  const boundary=await page.locator('.battle-summary').boundingBox();
  for(const selector of ['.record-panel','.detail-panel']){const b=await page.locator('.combat-record-v1 '+selector).boundingBox();assert.ok(Math.abs(b.x-boundary.x)<.1&&Math.abs(b.x+b.width-boundary.x-boundary.width)<.1,'Common outside alignment');}
  const left=await page.locator('.result-back').boundingBox(),right=await page.locator('.combat-record-v1 .home-back').boundingBox();assert.ok(Math.abs(left.x-boundary.x)<.1&&Math.abs(right.x+right.width-boundary.x-boundary.width)<.1,'Split button alignment');
  if(size.width===390)await page.locator('.combat-record-v1').screenshot({path:artifact('combat-record-v1','runtime-mobile.png')});
  assert.equal(await page.locator('.game').evaluate(e=>e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1),false);
  const clipped=await page.locator('.result-back,.home-back,.side-tabs button,.metric-tabs button,.row-name,.row-affiliation,.row-value,.row-share,.selection-detail').evaluateAll(es=>es.flatMap(e=>{const b=e.getBoundingClientRect(),w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),bad=[];while(w.nextNode()){if(!w.currentNode.textContent.trim())continue;const r=document.createRange();r.selectNodeContents(w.currentNode);const t=r.getBoundingClientRect();if(t.left<b.left||t.right>b.right||t.top<b.top||t.bottom>b.bottom)bad.push(w.currentNode.textContent);}return bad;}));assert.deepEqual(clipped,[]);report.viewports.push(size);
 }
 const savedAfter=await savedState(page);assert.deepEqual(savedAfter.battleRun,savedBefore.battleRun,'Statistics do not mutate the actual battle');assert.equal(savedAfter.gold,savedBefore.gold);assert.equal(savedAfter.diamonds,savedBefore.diamonds);assert.deepEqual(errors,[]);
 await fs.writeFile(artifact('combat-record-v1','qa.json'),JSON.stringify(report,null,2));console.log('PASS shared shell '+common+' pixels; '+report.pressed.length+' full pressed masks; 14 nine-slice sizes; 3 responsive views; actual battle and rewards unchanged');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
