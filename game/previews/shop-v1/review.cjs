const {launch,artifact}=require('../../tests/browser-env.cjs');
const sharp=require('../../../design-delivery/v1/a-production/tools/node_modules/sharp');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..');
const read=buffer=>sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
async function press(page,button){
 const box=await button.boundingBox(),clip=Object.fromEntries(Object.entries(box).map(([k,v])=>[k,Math.round(v)]));
 await page.mouse.move(939,1480);await button.evaluate(e=>e.blur());
 const before=await read(await page.screenshot({clip}));
 const url=await button.evaluate(e=>getComputedStyle(e).getPropertyValue('--art-image').trim().slice(4,-1).replaceAll('"',''));
 const mask=await read(url.startsWith('data:')?Buffer.from(url.split(',')[1],'base64'):await fs.readFile(path.join(root,'game',url)));
 assert.equal(mask.info.width,clip.width);assert.equal(mask.info.height,clip.height);
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
 assert.equal(await button.evaluate(e=>e.classList.contains('is-pressed')),true);
 assert.deepEqual(await button.boundingBox(),box);
 const after=await read(await page.screenshot({clip}));let changed=0,outside=0;
 for(let i=0;i<before.data.length;i+=4){const delta=Math.abs(before.data[i]-after.data[i])+Math.abs(before.data[i+1]-after.data[i+1])+Math.abs(before.data[i+2]-after.data[i+2]);if(!mask.data[i+3]&&delta>3)outside++;if(delta>3)changed++;}
 assert.equal(outside,0,'Pressed changes outside source alpha');assert.ok(changed>100);
 await page.mouse.move(939,1480);await page.mouse.up();
 return {label:await button.getAttribute('aria-label')||await button.innerText(),outside,changed};
}
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:941,height:1672},deviceScaleFactor:1}),errors=[],report={sizes:[],pressed:[]};
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 await page.goto('http://127.0.0.1:8780/game/previews/shop-v1/index.html');await page.locator('.game[aria-busy=false]').waitFor();
 const frames=await page.evaluate(async()=>{const {renderNineSlice}=await import('./nine-slice.js'),out=[];for(const tone of ['blue','green'])for(const [w,h] of [[180,60],[281,74],[350,138],[425,72],[500,138],[901,488],[700,190]])out.push({tone,w,h,url:await renderNineSlice(tone,w,h)});return out;});
 const corners={};
 for(const f of frames){const png=Buffer.from(f.url.split(',')[1],'base64'),{data,info}=await read(png),parts=[];
  for(const [x,y] of [[0,0],[f.w-28,0],[0,f.h-28],[f.w-28,f.h-28]])parts.push(await sharp(png).extract({left:x,top:y,width:28,height:28}).raw().toBuffer());
  if(!corners[f.tone])corners[f.tone]=parts;else parts.forEach((p,i)=>assert.ok(p.equals(corners[f.tone][i]),'Corner ornament changed with width/height'));
  for(let y=28;y<f.h-28;y++)for(let x=28;x<f.w-28;x++)assert.equal(data[(y*f.w+x)*4+3],255,'Hole inside closed plate');
  await fs.writeFile(artifact('shop-concept',f.tone+'-'+f.w+'x'+f.h+'.png'),png);report.sizes.push({tone:f.tone,width:f.w,height:f.h,cornersIdentical:true,interiorOpaque:true});
 }
 for(const b of await page.locator('button.art-control').all())report.pressed.push(await press(page,b));
 await page.locator('[data-currency=diamonds]').click();assert.equal(await page.locator('[data-count="10"] span').innerText(),'1,000 다이아');await page.locator('[data-currency=gold]').click();
 await page.mouse.move(939,1480);await page.locator(':focus').evaluateAll(es=>es.forEach(e=>e.blur()));
 await page.screenshot({path:path.join(root,'design-delivery/v2/05-mockups/shop-recruitment-v1.png')});
 for(const size of [{width:320,height:568},{width:390,height:844},{width:1440,height:900}]){
  await page.setViewportSize(size);await page.screenshot({path:artifact('shop-concept','shop-'+size.width+'.png')});
  const stage=await page.locator('.recruit-stage').boundingBox();for(const img of await page.locator('.general-original').all()){const r=await img.boundingBox();assert.ok(r.x>=stage.x&&r.x+r.width<=stage.x+stage.width&&r.y>=stage.y&&r.y+r.height<=stage.y+stage.height,'Original sprite clipped');}
 }
 // Inspect real alpha composition on three backgrounds, using the same renderer.
 await page.setViewportSize({width:1200,height:950});
 await page.evaluate(frames=>{
  document.body.innerHTML='<main id="review"></main>';document.body.style.cssText='display:block;margin:0;background:#f5ead7;color:#15283d;font:16px sans-serif';const grid=document.querySelector('#review');grid.style.cssText='padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:18px';
  for(const f of frames.filter(f=>f.w<600)){const article=document.createElement('article');article.innerHTML=`<p>${f.tone} · ${f.w} × ${f.h} · corner 28px</p><img src="${f.url}" style="max-width:100%;image-rendering:pixelated">`;grid.append(article);}
 },frames);
 for(const [theme,color,text] of [['light','#f5ead7','#15283d'],['dark','#101c2c','#ffe6ba'],['contrast','#45b9a7','#142536']]){await page.evaluate(([c,t])=>{document.body.style.background=c;document.body.style.color=t},[color,text]);await page.screenshot({path:artifact('shop-concept','nine-slice-'+theme+'.png'),fullPage:true});}
 assert.deepEqual(errors,[]);await fs.writeFile(path.join(__dirname,'qa.json'),JSON.stringify(report,null,2));console.log('PASS 14 width/height variants, exact fixed corners, opaque interiors, '+report.pressed.length+' pressed alpha masks, 3 viewports; no sprite clipping or request errors');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
