const {launch,start,seed,artifact}=require('./browser-env.cjs');
const sharp=require('../../design-delivery/v1/a-production/tools/node_modules/sharp');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),read=buffer=>sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:941,height:1672},deviceScaleFactor:1}),errors=[],report={pressed:[],frames:[],viewports:[]};
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 await start(page,{hash:'#campaign',lord:9});await seed(page,(s,{battleRun,battleEngine})=>{
 s.gold=12350;s.diamonds=s.freeDiamonds=290;s.paidDiamonds=0;s.campaign={cleared:true,day:null,count:0,stages:{yellow_02:{cleared:true}}};
 s.order=['xuchu','35','1','119','32','diaochan'];for(const id of s.order){s.heroes[id].owned=true;s.heroes[id].level=20;s.heroes[id].star=5;}
 let r=battleRun.newRun(s,11,'results-pixel-check',null,Date.now(),'yellow_03');r.round=5;r.capacity=6;r.units=s.order.map((hero,i)=>({id:i+1,hero,rank:5,x:i+1,y:3}));r=battleRun.startRound(r);while(!r.battle.result)battleEngine.stepBattle(r.battle);s.battleRun=r;return s;
 });await page.locator('.results-v1[aria-busy=false]').waitFor();
 await page.waitForTimeout(200);await page.mouse.move(939,1480);
 const shot=await page.screenshot({path:artifact('results-v1','runtime-approved.png')}),actual=await read(shot),reference=await read(await fs.readFile(path.join(root,'design-delivery/v2/05-mockups/approved-runtime/shop-941.png')));
 const scrollChange=await require('./approved-ui-changes.cjs')(page);
 const approved=await read(await fs.readFile(path.join(root,'design-delivery/v2/05-mockups/battle-results-v1.png')));let drift=0;
 for(let i=0;i<actual.data.length;i+=4)if(!scrollChange(i)&&!actual.data.subarray(i,i+4).equals(approved.data.subarray(i,i+4)))drift++;
 report.approvedPixelDrift=drift;assert.equal(drift,0,'Approved result screen pixel drift');
 let common=0;
 for(let y=0;y<1672;y++)for(let x=0;x<941;x++){
  if(y<150){if(x>=333&&x<608&&y>=19&&y<125)continue;}
  else if(y>=1498){if(y>=1512&&y<1656&&(x>=18&&x<196||x>=384&&x<562))continue;}
  else continue;
  const i=(y*941+x)*4;assert.ok(actual.data.subarray(i,i+4).equals(reference.data.subarray(i,i+4)),'Approved shell drift '+x+','+y);common++;
 }
 report.identicalShellPixels=common;
 for(const button of await page.locator('.results-v1 button.art-control').all()){
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
 const mounted=await page.locator('.results-v1 [data-hero="1"]').boundingBox(),standing=await page.locator('.results-v1 [data-hero="32"]').boundingBox();assert.ok(Math.abs(standing.height/mounted.height-.7)<.001,'Approved mounted/standing scale');
 const xuchu=await page.locator('.results-v1 [data-hero="xuchu"]').boundingBox();assert.ok(Math.abs(xuchu.height/mounted.height-.85)<.001,'Larger Xu Chu silhouette');
 const frames=await page.evaluate(async()=>{const {renderNineSlice}=await import('./nine-slice.js'),out=[];for(const tone of ['blue','green'])for(const [w,h] of [[281,64],[901,518],[901,254],[240,140],[901,130],[901,78],[582,118]])out.push({tone,w,h,url:await renderNineSlice(tone,w,h,{stablePixels:true})});return out;});
 const corners={};for(const f of frames){const png=Buffer.from(f.url.split(',')[1],'base64'),parts=[];
  for(const [left,top] of [[0,0],[f.w-28,0],[0,f.h-28],[f.w-28,f.h-28]])parts.push(await sharp(png).extract({left,top,width:28,height:28}).raw().toBuffer());
  if(!corners[f.tone])corners[f.tone]=parts;else parts.forEach((part,i)=>assert.ok(part.equals(corners[f.tone][i]),'Fixed corner ornament'));report.frames.push({tone:f.tone,width:f.w,height:f.h,identicalCorners:true});
 }
 for(const size of [{width:320,height:568},{width:390,height:844},{width:1440,height:900}]){
  await page.setViewportSize(size);await page.waitForTimeout(100);await page.screenshot({path:artifact('results-v1','preview-'+size.width+'.png')});
  for(const [panelSelector,images] of [['.victory-scene','.victory-generals .general-original']]){const panel=await page.locator(panelSelector).boundingBox();for(const img of await page.locator(images).all()){const b=await img.boundingBox();assert.ok(b.x>=panel.x&&b.x+b.width<=panel.x+panel.width&&b.y>=panel.y&&b.y+b.height<=panel.y+panel.height,'Full independent original');}}
  const boundary=await page.locator('.victory-scene').boundingBox();
  for(const selector of ['.reward-panel','.next-stage','.record-button']){const b=await page.locator('.results-v1 '+selector).boundingBox();assert.ok(Math.abs(b.x-boundary.x)<.1&&Math.abs(b.x+b.width-boundary.x-boundary.width)<.1,'Shared content edges: '+selector);}
  const left=await page.locator('.return-campaign').boundingBox(),right=await page.locator('.return-home').boundingBox();assert.ok(Math.abs(left.x-boundary.x)<.1&&Math.abs(right.x+right.width-boundary.x-boundary.width)<.1,'Split buttons share outer panel edges');
  assert.equal(await page.locator('.game').evaluate(e=>e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1),false);
  const clipped=await page.locator('.record-button,.return-campaign,.return-home').evaluateAll(es=>es.flatMap(e=>{const b=e.getBoundingClientRect(),w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),bad=[];while(w.nextNode()){if(!w.currentNode.textContent.trim())continue;const r=document.createRange();r.selectNodeContents(w.currentNode);const t=r.getBoundingClientRect();if(t.left<b.left||t.right>b.right||t.top<b.top||t.bottom>b.bottom)bad.push(w.currentNode.textContent);}return bad;}));assert.deepEqual(clipped,[]);report.viewports.push(size);
 }
 assert.deepEqual(errors,[]);
 await fs.writeFile(artifact('results-v1','qa.json'),JSON.stringify(report,null,2));console.log('PASS shared shell '+common+' pixels; '+report.pressed.length+' full pressed masks; 14 nine-slice sizes; 3 responsive views; isolated actual settlement');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
