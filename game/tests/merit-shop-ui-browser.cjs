const {launch,start,seed,artifact,savedState}=require('./browser-env.cjs');
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
 if(outside){await sharp(before.data,{raw:before.info}).png().toFile(artifact('government-v1','failed-before.png'));await sharp(after.data,{raw:after.info}).png().toFile(artifact('government-v1','failed-after.png'));await sharp(mask.data,{raw:mask.info}).png().toFile(artifact('government-v1','failed-mask.png'));}
 assert.equal(outside,0,'Pressed changes outside source alpha: '+await button.innerText());assert.ok(changed>100);
 assert.ok(frame>25);assert.equal(missed,0,'Entire border must press: '+await button.innerText());
 await page.mouse.move(939,1480);await page.mouse.up();
 return {label:await button.getAttribute('aria-label')||await button.innerText(),outside,changed,frame,missed};
}
(async()=>{const browser=await launch();try{const page=await browser.newPage({viewport:{width:941,height:1672}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await start(page,{hash:'#arena'});await seed(page,s=>{s.merit=260;return s});await page.locator('#arena-shop:visible').click();const ready=()=>page.locator('.merit-shop-runtime[aria-busy=false]').waitFor();await ready();let count=0;for(const b of await page.locator('.merit-shop-runtime button.art-control').all()){if(await b.isEnabled()){await press(page,b);count++;}}for(const b of await page.locator('.merit-shop-runtime [data-product]').all()){const box=await b.boundingBox();await b.click();await ready();assert.deepEqual(await b.boundingBox(),box);assert.equal(await b.getAttribute('aria-pressed'),'true');}const root=page.locator('.merit-shop-runtime'),action=root.locator('.apply');
const before=await savedState(page);
await root.locator('[data-product=card]').click();await ready();
await action.click();await ready();assert.ok(await action.isDisabled());
const cardSave=await savedState(page);assert.equal(cardSave.merit,180);
const changed=Object.keys(before.heroes).filter(id=>before.heroes[id].owned!==cardSave.heroes[id].owned||before.heroes[id].cards!==cardSave.heroes[id].cards);
assert.equal(changed.length,1);
await root.locator('[data-product=hero]').click();await ready();await action.click();await ready();
assert.equal((await savedState(page)).heroTokens,before.heroTokens+5);
await root.locator('[data-product=treasure]').click();await ready();for(let i=0;i<3;i++){await action.click();await ready();}
assert.ok(await action.isDisabled());
const after=await savedState(page);assert.equal(after.merit,50);assert.equal(after.treasureTokens,before.treasureTokens+15);
await page.reload();await ready();assert.ok(await action.isDisabled());assert.deepEqual(await savedState(page),after);
for(const width of [941,390,320]){await page.setViewportSize({width,height:width===941?1672:844});await page.waitForTimeout(150);await page.screenshot({path:artifact('merit-shop-v1','preview-'+width+'.png')});}const frames=await page.evaluate(async()=>{const {renderNineSlice}=await import('./nine-slice.js'),out=[];for(const tone of ['blue','green'])for(const [w,h] of [[901,120],[901,500],[901,470],[411,64],[412,64],[582,64],[170,64]])out.push({tone,w,h,url:await renderNineSlice(tone,w,h,{stablePixels:true})});return out;});const corners={};for(const f of frames){const parts=[];for(const [left,top] of [[0,0],[f.w-24,0],[0,f.h-24],[f.w-24,f.h-24]])parts.push(await sharp(Buffer.from(f.url.split(',')[1],'base64')).extract({left,top,width:24,height:24}).raw().toBuffer());if(!corners[f.tone])corners[f.tone]=parts;else parts.forEach((p,i)=>assert.ok(p.equals(corners[f.tone][i]),JSON.stringify({tone:f.tone,w:f.w,h:f.h,corner:i})));}

const currentWeek=await page.evaluate(async()=>{const {periods}=await import('./economy.js');return Number(periods(Date.now()).week);});
const reset=(currentWeek*7+4)*86400000-4*3600000;
assert.equal(new Date(reset).getUTCDay(),0);
await page.clock.setFixedTime(reset);
await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
await root.locator('.unlock').filter({hasText:'3 / 3회'}).waitFor();
assert.ok(await action.isEnabled());
assert.deepEqual(await savedState(page),after);
assert.deepEqual(errors,[]);console.log('PASS '+count+' pressed alpha/borders, 3 selected bounds, material shortage and limits, 3 screenshots');}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});