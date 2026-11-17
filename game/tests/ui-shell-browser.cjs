const {launch,start,seed,savedState,artifact}=require('./browser-env.cjs');
const assert=require('node:assert/strict'),sharp=require('../../design-delivery/v1/a-production/tools/node_modules/sharp');
const ids=['1','xuchu','32','35','diaochan','119'];
const pixels=png=>sharp(png).ensureAlpha().raw().toBuffer();
async function capture(page,name){
 await page.evaluate(()=>document.fonts.ready);await page.mouse.move(939,1480);await page.locator(':focus').evaluateAll(es=>es.forEach(e=>e.blur()));
 return pixels(await page.locator('.game').screenshot({path:artifact('ui-shell',name+'.png')}));
}
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:941,height:1672},deviceScaleFactor:1}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 await start(page);
 const initial=await savedState(page);await page.locator('[data-action=barracks]:visible').click();
 assert.deepEqual((await page.locator('.roster-card').evaluateAll(es=>es.map(e=>e.dataset.hero))).sort(),Object.keys(initial.heroes).filter(id=>initial.heroes[id].owned).sort(),'Only recruited heroes appear');
 assert.ok(await page.locator('.hero-stage img').evaluate((img,heroes)=>Object.keys(heroes).some(id=>heroes[id].owned&&(img.getAttribute('src')==='assets/generals-v2/'+id+'-front.png'||img.getAttribute('src')==='assets/heroes/'+id+'-idle.png')),initial.heroes),'Initial detail belongs to an owned hero');
 await seed(page,s=>{for(const id of ['1','xuchu','32','35','diaochan','119'])s.heroes[id].owned=true;return s;});
 await page.locator('[data-action=home]:visible').click();const before=await savedState(page),gate=await capture(page,'gate');
 const slots=await page.locator('.bottom-nav button:visible').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));
 await page.locator('[data-action=barracks]:visible').click();
 assert.deepEqual(await page.locator('.roster-card').evaluateAll(es=>es.slice(0,6).map(e=>e.dataset.hero)),ids);
 const bounds=await page.locator('.hero-roster').boundingBox();
 for(const id of ids){
  const card=page.locator('.hero-roster [data-hero="'+id+'"]'),box=await card.boundingBox();
  assert.ok(box.y>=bounds.y&&box.y+box.height<=bounds.y+bounds.height,'All six originals fit without scrolling');
  await card.click();assert.equal(await page.locator('.hero-stage img').getAttribute('src'),'assets/generals-v2/'+id+'-front.png');
  assert.equal(await page.locator('#train').isEnabled(),before.heroes[id].owned);
  assert.equal(await page.locator('#awaken').isEnabled(),before.heroes[id].owned);
  assert.equal(await page.locator('#treasure-open').isEnabled(),before.heroes[id].owned);
 }
 await page.locator('.hero-roster [data-hero="1"]').click();
 assert.deepEqual(await page.locator('.bottom-nav button:visible').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON())),slots,'Tab slots never move');
 const barracks=await capture(page,'barracks'),after=await savedState(page);
 assert.deepEqual(after.heroes,before.heroes,'Artwork browsing must not grant/grow any hero');assert.equal(after.gold,before.gold);assert.equal(after.diamonds,before.diamonds);
 let footerPixels=0;
 for(let y=1498;y<1672;y++)for(let x=0;x<941;x++){
  if(x>=201&&x<379||x>=384&&x<562)continue;
  const i=(y*941+x)*4;assert.ok(gate.subarray(i,i+4).equals(barracks.subarray(i,i+4)),`Shared footer differs at ${x},${y}`);footerPixels++;
 }
 // Selection may only recolor the plate: actual rendered content and hitbox
 // must remain fixed, including the full black outline and label pixels.
 for(const action of ['home','shop','barracks']){
  const button=page.locator('.bottom-nav [data-action='+action+']:visible'),box=await button.boundingBox();
  const clip=Object.fromEntries(Object.entries(box).map(([k,v])=>[k,Math.round(v)]));
  await page.mouse.move(939,1480);const normal=await pixels(await page.screenshot({clip}));
  await button.click();await page.locator('.game[aria-busy=false]').waitFor();
  if(action==='shop')await page.locator('.shop-v2[aria-busy=false]').waitFor();
  await button.evaluate(e=>e.blur());await page.mouse.move(939,1480);
  assert.deepEqual(await button.boundingBox(),box,'Selection must not resize or move '+action);
  const selected=await pixels(await page.screenshot({clip,path:artifact('ui-shell',action+'-selected-fixed.png')}));
  const content=await pixels('game/assets/navigation/'+action+'-content.png');let compared=0;
  for(let i=0;i<content.length;i+=4)if(content[i+3]){assert.ok(normal.subarray(i,i+4).equals(selected.subarray(i,i+4)),action+' content moved or resized on selection');compared++;}
  assert.ok(compared>3000);
 }
 for(const size of [{width:320,height:568},{width:390,height:844},{width:1440,height:900}]){
  await page.setViewportSize(size);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const roster=await page.locator('.hero-roster').boundingBox();
  for(const id of ids){const r=await page.locator('.hero-roster [data-hero="'+id+'"]').boundingBox();assert.ok(r.y+r.height<=roster.y+roster.height+.1);}
  const measured={detail:[]};
  const portraitBoxes=()=>page.locator('.general-card-art .portrait-viewport').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));
  const fixedPortraits=await portraitBoxes();
  for(const id of ids){
   await page.locator('.hero-roster [data-hero="'+id+'"]').click();
   const geometry=await page.evaluate(async id=>{const {generals}=await import('./assets/generals-v2/generals.js');const source=generals[id].views.front,measure=(img,box)=>{const r=img.getBoundingClientRect(),p=box.getBoundingClientRect();return {height:r.height,width:r.width,foot:r.y-p.y+r.height*source.foot[1]/source.height,inside:r.x>=p.x-.1&&r.right<=p.right+.1&&r.y>=p.y-.1&&r.bottom<=p.bottom+.1,aspect:r.width/r.height};};return {detail:measure(document.querySelector('.hero-stage img'),document.querySelector('.hero-stage')),cards:measure(document.querySelector('.roster-card[data-hero="'+id+'"] img'),document.querySelector('.roster-card[data-hero="'+id+'"]')),aspect:source.width/source.height};},id);
   assert.deepEqual(await portraitBoxes(),fixedPortraits,'Selection preserves all portrait windows');
   for(const key of ['detail']){assert.ok(geometry[key].inside,id+' complete silhouette '+key);assert.ok(Math.abs(geometry[key].aspect-geometry.aspect)<.003,id+' aspect '+key);measured[key].push(geometry[key]);}
  }
  for(const key of ['detail'])for(let i=0;i<ids.length;i++){const ratio=['1','119'].includes(ids[i])?1:ids[i]==='xuchu'?.85:.7;assert.ok(Math.abs(measured[key][i].height/measured[key][0].height-ratio)<.003,ids[i]+' shared stature '+key);assert.ok(Math.abs(measured[key][i].foot-measured[key][0].foot)<.1,ids[i]+' shared foot baseline '+key);}
  // Eye rows measured on the six approved 96×120 portrait PNGs.
  const eyeRows={'1':56,xuchu:63,'32':58,'35':60,diaochan:61,'119':65};
  const portraits=await page.locator('.general-card-art .portrait-viewport').evaluateAll(async (slots,eyes)=>{
   return Promise.all(slots.filter(slot=>slot.closest('[data-hero]').dataset.hero in eyes).map(async slot=>{
    const id=slot.closest('[data-hero]').dataset.hero,img=slot.querySelector('img');
    await img.decode();
    const box=slot.getBoundingClientRect(),r=img.getBoundingClientRect();
    return {id,eye:(r.y+eyes[id]*r.height/120-box.y)/box.height,aspect:r.width/r.height,
     natural:[img.naturalWidth,img.naturalHeight],background:getComputedStyle(slot).backgroundColor,src:img.getAttribute('src')};
   }));
  },eyeRows);
  assert.equal(portraits.length,ids.length);
  for(const p of portraits){
   assert.ok(Math.abs(p.eye-eyeRows[p.id]/120)<.003,p.id+' portrait eyes');
   assert.ok(Math.abs(p.aspect-.8)<.003,p.id+' approved portrait aspect');
   assert.deepEqual(p.natural,[96,120]);
   assert.equal(p.background,'rgba(0, 0, 0, 0)');
   assert.equal(p.src,'assets/portraits-v4/'+p.id+'.png');
  }
  await page.locator('.hero-roster [data-hero="35"]').click();await page.screenshot({path:artifact('ui-shell','barracks-zhuge-'+size.width+'.png')});
  await page.locator('.hero-roster [data-hero="1"]').click();await page.screenshot({path:artifact('ui-shell','barracks-'+size.width+'.png')});
 }
 await page.setViewportSize({width:941,height:1672});await page.locator('[data-action=home]:visible').click();
 await page.locator('[data-action=depart]').click();await page.locator('.battle-v2[aria-busy=false]').waitFor();
 const battle=await capture(page,'battle');let headerPixels=0;
 for(let y=0;y<150;y++)for(let x=0;x<941;x++){
  if(x>=30&&x<305&&y>=17&&y<140||x>=330&&x<611&&y>=17&&y<128||x>=690&&x<916&&y>=17&&y<134)continue;
  const i=(y*941+x)*4;assert.ok(gate.subarray(i,i+4).equals(barracks.subarray(i,i+4)),`Barracks frame differs at ${x},${y}`);
  assert.ok(gate.subarray(i,i+4).equals(battle.subarray(i,i+4)),`Battle frame differs at ${x},${y}`);headerPixels++;
 }
 assert.deepEqual(errors,[]);console.log(`PASS shared header ${headerPixels} identical pixels across 3 scenes, footer ${footerPixels} identical pixels, fixed tab slots, 6 original previews, unchanged ownership/currency, 3 viewport sizes`);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
