const {launch,artifact,start,seed,savedState}=require('./browser-env.cjs');
const sharp=require('../../design-delivery/v1/a-production/tools/node_modules/sharp');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),read=buffer=>sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:941,height:1672},deviceScaleFactor:1}),errors=[],report={pressed:[],frames:[],viewports:[],states:[]};
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 const view=page.locator('.mail-v1');const ready=()=>page.locator('.mail-v1[aria-busy=false]').waitFor();
 await page.clock.setFixedTime(new Date('2026-11-13T20:00:00Z'));await start(page,{hash:'#mail'});await seed(page,(s,{services})=>{
 const now=Date.now(),DAY=86400000;services.prepareServices(s);s.gold=12450;s.diamonds=s.freeDiamonds=320;s.paidDiamonds=0;const periodBonus=services.periodBonus,quest=id=>({gold:services.questDefs.find(d=>d.id===id).gold});
s.services.mail=[
 {id:'weekly-bonus',title:'임무 완료 보너스',body:'지난 주 임무를 모두 완료한 보상입니다.',createdAt:now-2*DAY,expireAt:now+5*DAY,attachments:{...periodBonus.week},claimedAt:null},
 {id:'daily-run',title:'출정 완료 미수령 보상',body:'지난 기간에 완료한 임무 보상입니다.',createdAt:now-5*DAY,expireAt:now+2*DAY,attachments:quest('daily_run'),claimedAt:null},
 {id:'daily-merge',title:'장수 합성 미수령 보상',body:'지난 기간에 완료한 임무 보상입니다.',createdAt:now-4*DAY,expireAt:now+3*DAY,attachments:quest('daily_merge'),claimedAt:now-DAY},
 {id:'daily-skill',title:'전법 사용 미수령 보상',body:'보관 기한이 지나 보상을 받을 수 없습니다.',createdAt:now-8*DAY,expireAt:now-DAY,attachments:quest('daily_skill'),claimedAt:null}
];
return s;});await ready();const savedBefore=await savedState(page);await page.locator(':focus').evaluateAll(es=>es.forEach(e=>e.blur()));await page.waitForTimeout(150);await page.mouse.move(939,1400);
 const shot=await page.screenshot({path:artifact('mail-v1','runtime-approved.png')}),actual=await read(shot),reference=await read(await fs.readFile(path.join(root,'design-delivery/v2/05-mockups/approved-runtime/shop-941.png')));
 const scrollChange=await require('./approved-ui-changes.cjs')(page);
 const approved=await read(await fs.readFile(path.join(root,'design-delivery/v2/05-mockups/mail-v1.png')));let drift=0;for(let i=0;i<actual.data.length;i+=4)if(!scrollChange(i)&&!actual.data.subarray(i,i+4).equals(approved.data.subarray(i,i+4)))drift++;assert.equal(drift,0,'Approved mail screen pixel drift');report.approvedPixelDrift=drift;
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
 for(const tab of ['all','available','claimed']){
  await view.locator('[data-tab='+tab+']').click();await ready();if(tab==='all'){await view.locator('.mail-row').first().click();await ready();}await page.mouse.move(939,1400);await page.locator(':focus').evaluateAll(es=>es.forEach(e=>e.blur()));
  assert.deepEqual(await view.locator('[data-tab]').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON())),before,'Selected geometry unchanged');
  assert.equal(await view.locator('.mail-row').count(),tab==='all'?3:tab==='available'?2:1);
  await page.screenshot({path:artifact('mail-v1',tab+'.png')});await pressChecks(tab);report.states.push(tab);
 }
 const frames=await page.evaluate(async()=>{const {renderNineSlice}=await import('./nine-slice.js'),out=[];for(const tone of ['blue','green'])for(const [w,h] of [[901,146],[289,74],[901,140],[170,64],[901,276],[266,64],[271,64],[582,64]])out.push({tone,w,h,url:await renderNineSlice(tone,w,h,{stablePixels:true})});return out;});
 const corners={};for(const f of frames){const png=Buffer.from(f.url.split(',')[1],'base64'),parts=[];
  for(const [left,top] of [[0,0],[f.w-24,0],[0,f.h-24],[f.w-24,f.h-24]])parts.push(await sharp(png).extract({left,top,width:24,height:24}).raw().toBuffer());
  if(!corners[f.tone])corners[f.tone]=parts;else parts.forEach((part,i)=>assert.ok(part.equals(corners[f.tone][i]),'Fixed corner ornament'));report.frames.push({tone:f.tone,width:f.w,height:f.h,identicalCorners:true});
 }
 for(const size of [{width:320,height:568},{width:390,height:844},{width:1440,height:900}]){
  await page.setViewportSize(size);
  for(const tab of ['all','available','claimed']){
   await view.locator('[data-tab='+tab+']').click();await ready();if(tab==='all'){await view.locator('.mail-row').first().click();await ready();}await page.mouse.move(0,0);await page.locator(':focus').evaluateAll(es=>es.forEach(e=>e.blur()));
   const boundary=await view.locator('.mail-summary').boundingBox(),scene=await page.locator('.game').boundingBox(),scale=scene.width/941;
   for(const el of await view.locator('.mail-row,.detail-panel').all()){const r=await el.boundingBox();assert.ok(Math.abs(r.x-boundary.x)<.1&&Math.abs(r.x+r.width-boundary.x-boundary.width)<.1,'Common body edges');}
   const all=await view.locator('.claim-all').boundingBox(),home=await view.locator('.home-back').boundingBox(),note=await view.locator('.mail-note').boundingBox(),panel=await view.locator('.detail-panel').boundingBox(),reward=await view.locator('.detail-rewards').boundingBox();
   assert.ok(Math.abs(all.x-boundary.x)<.1&&Math.abs(home.x+home.width-boundary.x-boundary.width)<.1,'Split button edges');
   assert.ok(Math.abs((scene.y+1498*scale-home.y-home.height)/scale-20)<.1,'Footer gap 20');assert.ok(Math.abs((home.y-note.y-note.height)/scale-12)<.1,'Helper/button gap 12');assert.ok(Math.abs((note.y-panel.y-panel.height)/scale-12)<.1,'Panel/helper gap 12');
   for(const el of await view.locator('.delete-mail,.claim-mail').all()){const r=await el.boundingBox();assert.ok(Math.abs((panel.y+panel.height-r.y-r.height)/scale-20)<.1,'Inner button bottom gap 20');assert.ok(Math.abs((r.y-reward.y-reward.height)/scale-20)<.1,'Inner button top gap 20');}
   const clipped=await view.locator('.section-tabs button,.summary-title,.summary-copy,.summary-rewards,.row-title,.row-state,.row-rewards,.row-expiry,.detail-title,.detail-status,.detail-body,.detail-rewards,.delete-mail,.claim-mail,.mail-note,.claim-all,.home-back').evaluateAll(es=>es.flatMap(e=>{const b=e.getBoundingClientRect(),w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),bad=[];while(w.nextNode()){if(!w.currentNode.textContent.trim())continue;const r=document.createRange();r.selectNodeContents(w.currentNode);const t=r.getBoundingClientRect();if(t.left<b.left-.5||t.right>b.right+.5||t.top<b.top-.5||t.bottom>b.bottom+.5)bad.push(w.currentNode.textContent);}return bad;}));assert.deepEqual(clipped,[],tab+' text containment');
   await page.screenshot({path:artifact('mail-v1',tab+'-'+size.width+'.png')});if(size.width===390&&tab==='all')await page.locator('.game').screenshot({path:artifact('mail-v1','runtime-mobile.png')});
  }report.viewports.push(size);
 }
 assert.deepEqual(await savedState(page),savedBefore,'Tab/selection review never changes the profile');assert.deepEqual(errors,[]);
 await fs.writeFile(artifact('mail-v1','runtime-qa.json'),JSON.stringify(report,null,2));console.log('PASS approved screen identical; '+common+' shared shell pixels; '+report.pressed.length+' pressed states; 16 sizes; 3 tabs × 3 views with internal/external margins');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
