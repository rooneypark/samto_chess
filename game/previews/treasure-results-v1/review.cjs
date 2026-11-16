const {launch,start,seed,artifact,savedState}=require('../../tests/browser-env.cjs');
const sharp=require('../../../design-delivery/v1/a-production/tools/node_modules/sharp'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'../../..'),read=buffer=>sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
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
(async()=>{const browser=await launch();try{const page=await browser.newPage({viewport:{width:941,height:1672}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8780/game/previews/treasure-results-v1/');const ready=()=>page.locator('.game[aria-busy=false]').waitFor();await ready();let count=0;for(const b of await page.locator('button.art-control').all()){if(await b.isEnabled()){await press(page,b);count++;}}for(const id of await page.locator('[data-result]').evaluateAll(es=>es.map(e=>e.dataset.result))){const b=page.locator('[data-result=\"'+id+'\"]'),box=await b.boundingBox();await b.click();await ready();assert.deepEqual(await b.boundingBox(),box);assert.equal(await b.getAttribute('aria-pressed'),'true');}await page.locator('[data-result]').first().click();await ready();for(const width of [941,390,320]){await page.setViewportSize({width,height:width===941?1672:844});await page.waitForTimeout(150);await page.screenshot({path:artifact('treasure-results-v1','preview-'+width+'.png')});}const frames=await page.evaluate(async()=>{const {renderNineSlice}=await import('./nine-slice.js'),out=[];for(const tone of ['blue','green'])for(const [w,h] of [[901,120],[901,500],[901,470],[411,64],[412,64],[582,64],[170,64]])out.push({tone,w,h,url:await renderNineSlice(tone,w,h,{stablePixels:true})});return out;});const corners={};for(const f of frames){const parts=[];for(const [left,top] of [[0,0],[f.w-28,0],[0,f.h-28],[f.w-28,f.h-28]])parts.push(await sharp(Buffer.from(f.url.split(',')[1],'base64')).extract({left,top,width:28,height:28}).raw().toBuffer());if(!corners[f.tone])corners[f.tone]=parts;else parts.forEach((p,i)=>assert.ok(p.equals(corners[f.tone][i]),JSON.stringify({tone:f.tone,w:f.w,h:f.h,corner:i})));}

assert.deepEqual(errors,[]);console.log('PASS '+count+' pressed alpha/borders, selected bounds, 10 result selections, 3 screenshots');}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});