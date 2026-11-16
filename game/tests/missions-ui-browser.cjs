const {launch,artifact,start,seed,savedState}=require('./browser-env.cjs');
const sharp=require('../../design-delivery/v1/a-production/tools/node_modules/sharp');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),read=buffer=>sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:941,height:1672},deviceScaleFactor:1}),errors=[],report={pressed:[],frames:[],viewports:[],states:[]};
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 const view=page.locator('.missions-v1');const ready=()=>page.locator('.missions-v1[aria-busy=false]').waitFor();
 await start(page,{hash:'#missions'});await seed(page,(s,{services})=>{
 const q=services.prepareServices(s);s.gold=12450;s.diamonds=s.freeDiamonds=320;s.paidDiamonds=0;
 q.attendance={day:String(Number(q.periods.day)-1),index:2};
 for(const [id,n] of Object.entries({daily_run:2,daily_merge:5,daily_skill:12,daily_train:0,weekly_run:6,weekly_win:3,weekly_merge:25,weekly_skill:74,weekly_draw:3}))q.quests[id].progress=n;
 q.quests.daily_merge.claimed=true;q.lifetime.runs=6;q.lifetime.merges=74;s.campaign={cleared:true};return s;
 });await ready();const savedBefore=await savedState(page);await page.locator(':focus').evaluateAll(es=>es.forEach(e=>e.blur()));await page.waitForTimeout(150);await page.mouse.move(939,1400);
 const shot=await page.screenshot({path:artifact('missions-v1','runtime-approved.png')}),actual=await read(shot),reference=await read(await fs.readFile(path.join(root,'design-delivery/v2/05-mockups/approved-runtime/shop-941.png')));
 const scrollChange=await require('./approved-ui-changes.cjs')(page);
 const approved=await read(await fs.readFile(path.join(root,'design-delivery/v2/05-mockups/missions-v1.png')));let drift=0;for(let i=0;i<actual.data.length;i+=4)if(!scrollChange(i)&&!actual.data.subarray(i,i+4).equals(approved.data.subarray(i,i+4)))drift++;assert.equal(drift,0,'Approved missions pixel drift');report.approvedPixelDrift=drift;
 let common=0;
 for(let y=0;y<1672;y++)for(let x=0;x<941;x++){
  if(y<150){if(x>=333&&x<608&&y>=19&&y<125)continue;}
  else if(y>=1498){if(y>=1512&&y<1656&&(x>=18&&x<196||x>=384&&x<562))continue;}
  else continue;
  const i=(y*941+x)*4;assert.ok(actual.data.subarray(i,i+4).equals(reference.data.subarray(i,i+4)),'Approved shell drift '+x+','+y);common++;
 }report.identicalShellPixels=common;
 async function pressChecks(tab){
  for(const button of await view.locator('button.art-control:not(:disabled)').all()){
   const box=await button.boundingBox(),clip=Object.fromEntries(Object.entries(box).map(([k,v])=>[k,Math.round(v)]));
   await page.mouse.move(939,1400);await button.evaluate(e=>e.blur());const before=await read(await page.screenshot({clip}));
   const url=await button.evaluate(e=>getComputedStyle(e).getPropertyValue('--art-image').trim().slice(4,-1).replaceAll('"',''));
   const mask=await read(url.startsWith('data:')?Buffer.from(url.split(',')[1],'base64'):await fs.readFile(path.join(root,'game',url.replace(/^https?:\/\/[^/]+\/game\//,''))));
   await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();assert.ok(await button.evaluate(e=>e.classList.contains('is-pressed')));assert.deepEqual(await button.boundingBox(),box);
   const after=await read(await page.screenshot({clip}));let outside=0,frame=0,missed=0;
   for(let y=0;y<clip.height;y++)for(let x=0;x<clip.width;x++){
    const i=(y*clip.width+x)*4,a=before.data[i]+before.data[i+1]+before.data[i+2],b=after.data[i]+after.data[i+1]+after.data[i+2],delta=Math.abs(before.data[i]-after.data[i])+Math.abs(before.data[i+1]-after.data[i+1])+Math.abs(before.data[i+2]-after.data[i+2]);
    if(!mask.data[i+3]&&delta>3)outside++;
    if(mask.data[i+3]===255&&(x<clip.width*.12||x>clip.width*.88||y<clip.height*.12||y>clip.height*.88)&&Math.max(mask.data[i],mask.data[i+1],mask.data[i+2])>100&&a>30){frame++;if(b>a*.92)missed++;}
   }
   const label=await button.getAttribute('aria-label')||await button.innerText();assert.equal(outside,0,label+' alpha exterior');assert.ok(frame>25);assert.equal(missed,0,label+' full border');report.pressed.push({tab,label,outside,frame,missed});await page.mouse.move(939,1400);await page.mouse.up();
  }
 }
 const before=await view.locator('[data-tab]').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));
 for(const tab of ['day','week','achievement']){
  await view.locator('[data-tab='+tab+']').click();await ready();await page.mouse.move(939,1400);await page.locator(':focus').evaluateAll(es=>es.forEach(e=>e.blur()));
  assert.deepEqual(await view.locator('[data-tab]').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON())),before,'Selected geometry unchanged');
  assert.equal(await view.locator('.mission').count(),tab==='week'?5:tab==='day'?4:3);
  await page.screenshot({path:artifact('missions-v1',tab+'.png')});await pressChecks(tab);report.states.push(tab);
 }
 const frames=await page.evaluate(async()=>{const {renderNineSlice}=await import('./nine-slice.js'),out=[];for(const tone of ['blue','green'])for(const [w,h] of [[901,254],[120,110],[289,74],[901,116],[901,90],[901,146],[239,74],[901,64]])out.push({tone,w,h,url:await renderNineSlice(tone,w,h,{stablePixels:true})});return out;});
 const corners={};for(const f of frames){const png=Buffer.from(f.url.split(',')[1],'base64'),parts=[];
  for(const [left,top] of [[0,0],[f.w-28,0],[0,f.h-28],[f.w-28,f.h-28]])parts.push(await sharp(png).extract({left,top,width:28,height:28}).raw().toBuffer());
  if(!corners[f.tone])corners[f.tone]=parts;else parts.forEach((part,i)=>assert.ok(part.equals(corners[f.tone][i]),'Fixed corner ornament'));report.frames.push({tone:f.tone,width:f.w,height:f.h,identicalCorners:true});
 }
 for(const size of [{width:320,height:568},{width:390,height:844},{width:1440,height:900}]){
  await page.setViewportSize(size);
  for(const tab of ['day','week','achievement']){
   await view.locator('[data-tab='+tab+']').click();await ready();await page.mouse.move(0,0);await page.locator(':focus').evaluateAll(es=>es.forEach(e=>e.blur()));
   const boundary=await view.locator('.attendance-panel').boundingBox();
   const scene=await page.locator('.game').boundingBox(),home=await view.locator('.home-back').boundingBox(),note=await view.locator('.mail-note').boundingBox(),panel=await view.locator('.bonus-panel').boundingBox(),scale=scene.width/941;
   assert.ok(Math.abs((scene.y+1498*scale-home.y-home.height)/scale-20)<.1,'Footer gap 20');
   assert.ok(Math.abs((home.y-note.y-note.height)/scale-12)<.1,'Above button gap 12');
   assert.ok(Math.abs((note.y-panel.y-panel.height)/scale-12)<.1,'Above note gap 12');
   const last=await view.locator('.mission').last().boundingBox(),bonus=await view.locator('.bonus-panel').boundingBox();assert.ok(last.y+last.height<bonus.y,'Rows clear bonus panel');
   for(const el of await view.locator('.mission,.bonus-panel,.home-back').all()){const b=await el.boundingBox();assert.ok(Math.abs(b.x-boundary.x)<.1&&Math.abs(b.x+b.width-boundary.x-boundary.width)<.1,'Common outside alignment');}
   const clipped=await view.locator('.attendance-title,.attendance-copy,.day,.mission h3,.mission .reward,.progress-label,.mission button,.bonus-title,.bonus-rewards,.bonus-copy,.bonus-claim,.section-tabs button,.mail-note,.home-back').evaluateAll(es=>es.flatMap(e=>{const b=e.getBoundingClientRect(),w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),bad=[];while(w.nextNode()){if(!w.currentNode.textContent.trim())continue;const r=document.createRange();r.selectNodeContents(w.currentNode);const t=r.getBoundingClientRect();if(t.left<b.left-.5||t.right>b.right+.5||t.top<b.top-.5||t.bottom>b.bottom+.5)bad.push(w.currentNode.textContent);}return bad;}));assert.deepEqual(clipped,[],tab+' text containment');
   assert.equal(await page.locator('.game').evaluate(e=>e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1),false);
   await page.screenshot({path:artifact('missions-v1',tab+'-'+size.width+'.png')});if(size.width===390&&tab==='day')await page.locator('.game').screenshot({path:artifact('missions-v1','runtime-mobile.png')});
  }report.viewports.push(size);
 }
 assert.deepEqual(await savedState(page),savedBefore,'Read-only tab review never changes profile');assert.deepEqual(errors,[]);
 await fs.writeFile(artifact('missions-v1','runtime-qa.json'),JSON.stringify(report,null,2));console.log('PASS approved screen identical; '+common+' shared shell pixels; '+report.pressed.length+' pressed states; 16 nine-slice sizes; 3 tabs × 3 viewports');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
