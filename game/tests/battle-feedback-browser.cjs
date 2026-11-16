const {launch,start,seed,artifact,waitForSave,savedState}=require('./browser-env.cjs');
const assert=require('node:assert/strict');
const sharp=require('../../design-delivery/v1/a-production/tools/node_modules/sharp');
const verifyButtonAlpha=require('./button-alpha.cjs');
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:941,height:1672}});await start(page);
 await seed(page,(s,{battleRun})=>{s.order=['xuchu','1','119','32','35','diaochan'];for(const id of [...s.order,'archer'])s.heroes[id].owned=true;const r=battleRun.newRun(s,7,'feedback-review');r.capacity=6;r.silver=7;r.units=s.order.map((hero,i)=>({id:i+1,hero,rank:i<3?2:1,x:[1,3,6,1,3,6][i],y:i<3?2:0,cost:3}));r.units.push({id:7,hero:'32',rank:1,x:0,y:-1,cost:3},{id:8,hero:'archer',rank:1,x:1,y:-1,cost:3});r.nextId=9;r.gear=[{type:'sword',rank:1},{type:'armor',rank:1},{type:'bow',rank:1}];s.battleRun=r;return s;});
 await page.locator('.battle-v2[aria-busy=false]').waitFor();await page.mouse.move(930,1100);const unselected=await page.screenshot();await page.locator('[data-unit="4"]').click();await page.mouse.move(930,1100);const selectedImage=await page.screenshot({path:artifact('battle-feedback','selection-behind.png')});
 const covered=await page.evaluate(async([before,after])=>{
  const read=async src=>{const image=new Image();image.src='data:image/png;base64,'+src;await image.decode();const c=document.createElement('canvas');c.width=941;c.height=1672;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);return ctx.getImageData(0,0,941,1672).data;};
  const [a,b]=await Promise.all([read(before),read(after)]),sprite=document.querySelector('.battle-position [data-unit="4"] img'),r=sprite.getBoundingClientRect(),canvas=document.createElement('canvas');canvas.width=941;canvas.height=1672;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(sprite,r.x,r.y,r.width,r.height);const mask=ctx.getImageData(0,0,941,1672).data;let changed=0;for(let i=0;i<a.length;i+=4)if(mask[i+3]===255&&(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2]))changed++;return changed;
 },[unselected.toString('base64'),selectedImage.toString('base64')]);assert.equal(covered,0,'Selection must not recolor any opaque character pixels');
 // The selection rectangle uses the same box as the grid cell, regardless of art dimensions.
 const selection=await page.locator('.battle-position [data-unit="4"]').evaluate(e=>{const r=e.getBoundingClientRect(),cell=document.querySelector('.battle-cell[data-x="1"][data-y="0"]').getBoundingClientRect(),css=getComputedStyle(document.querySelector('.battle-cell.tile-selected'),'::after');return {a:[r.x,r.y,r.width,r.height],b:[cell.x,cell.y,cell.width,cell.height],inset:[css.top,css.right,css.bottom,css.left]};});
 selection.a.forEach((v,i)=>assert.ok(Math.abs(v-selection.b[i])<.15));assert.deepEqual(selection.inset,['0px','0px','0px','0px']);
 for(const id of ['battle-summon','battle-start','battle-help','battle-bonds']){
  const button=page.locator('#'+id),box=await button.boundingBox(),clip=Object.fromEntries(Object.entries(box).map(([k,v])=>[k,Math.round(v)])),before=await page.screenshot({clip});
  for(const [x,y] of [[.01,.5],[.99,.5],[.5,.015],[.5,.985]]){
   await page.mouse.move(box.x+box.width*x,box.y+box.height*y);await page.mouse.down();assert.ok(await button.evaluate(e=>e.classList.contains('is-pressed')));assert.deepEqual(await button.boundingBox(),box);
   const after=await page.screenshot({clip,path:artifact('battle-feedback',id+'-pressed.png')});
   const a=await sharp(before).ensureAlpha().raw().toBuffer({resolveWithObject:true}),b=await sharp(after).ensureAlpha().raw().toBuffer();
   // Samples on all four outer frame bands must darken, not only the button center.
   await verifyButtonAlpha(id.replace('battle-',''),before,after);
   await page.mouse.move(930,1100);await page.mouse.up();assert.equal(await button.evaluate(e=>e.classList.contains('is-pressed')),false);
  }
  assert.equal((await savedState(page)).battleRun.phase,'prepare');assert.equal((await savedState(page)).battleRun.silver,7);
 }
 for(const id of ['battle-help','battle-bonds']){await page.locator('#'+id).click();await page.locator('#modal[open]').waitFor();assert.equal(await page.locator('.is-pressed').count(),0);await page.keyboard.press('Escape');}
 await page.locator('#battle-bonds').focus();await page.keyboard.down('Space');assert.equal(await page.locator('#battle-bonds.is-pressed').count(),1);await page.keyboard.up('Space');await page.locator('#modal[open]').waitFor();await page.keyboard.press('Escape');
 // Real touch capture must clear when dragged out, without spending currency.
 const touch=await page.context().newCDPSession(page),summonBox=await page.locator('#battle-summon').boundingBox();
 await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:summonBox.x+3,y:summonBox.y+65}]});assert.equal(await page.locator('#battle-summon.is-pressed').count(),1);
 await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:930,y:1100}]});await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await page.locator('.battle-art-button.is-pressed').count(),0);assert.equal((await savedState(page)).battleRun.silver,7);await touch.detach();
 // Approved indicator is now rendered by production code, with no injected CSS.
 assert.equal(await page.locator('[data-unit="4"] .rank-diamond').count(),5);
 assert.equal(await page.locator('[data-unit="4"] .rank-diamond.filled').count(),1);
 await page.locator('.battle-screen').screenshot({path:artifact('battle-feedback','indicator-live.png')});
 // Native edge clicks still execute exactly once after canceled presses.
 await page.locator('#battle-summon').click({position:{x:3,y:65}});await waitForSave(page,s=>s.battleRun.silver===4&&s.battleRun.units.length===9);
 const startButton=page.locator('#battle-start'),r=await startButton.boundingBox();await startButton.click({position:{x:r.width-3,y:r.height/2}});await waitForSave(page,s=>s.battleRun.phase==='fighting');
 console.log('PASS cell selection, all four pressed frame edges, drag-out cancellation, single edge activation; approved live indicator rendered');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
