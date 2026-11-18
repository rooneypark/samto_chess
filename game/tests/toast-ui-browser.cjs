const {launch,start,seed,artifact}=require('./browser-env.cjs');
const assert=require('node:assert/strict');
const sharp=require('../../design-delivery/v1/a-production/tools/node_modules/sharp');
(async()=>{
 const browser=await launch();
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await start(page,{hash:'#products'});
  const action=page.locator('.products-runtime .apply');
  const initial=await page.locator('.game').boundingBox();await action.click();
  await page.locator('#products-confirm').click();
  const toast=page.locator('#toast');
  await toast.locator('strong').filter({hasText:'성공'}).waitFor();assert.deepEqual(await page.locator('.game').boundingBox(),initial);
  for(const width of [941,390,320]){
   await page.setViewportSize({width,height:width===941?1672:844});
   const box=await toast.boundingBox(),game=await page.locator('.game').boundingBox();
   const scale=await page.locator('.game-stack').evaluate(el=>el.getBoundingClientRect().width/el.offsetWidth);
   assert.ok(Math.abs(box.y-game.y-8*scale)<1,JSON.stringify({width,box,game,scale}));
   assert.ok(box.y+box.height<game.y+game.height);
   assert.ok(Math.abs(box.x-game.x-game.width*20/941)<1, JSON.stringify({box,game}));
   assert.equal(await toast.evaluate(el=>getComputedStyle(el).pointerEvents),'none');
  }
  const shown=await page.locator('.game').boundingBox();await toast.getByRole('button',{name:'알림 닫기'}).click();await toast.waitFor({state:'hidden'});assert.deepEqual(await page.locator('.game').boundingBox(),shown);
  const game=await page.locator('.game').boundingBox();assert.ok(game.width>=319);
  const result=await page.evaluate(async()=>{
   const {createToast}=await import('./toast.js');
   const el=document.querySelector('#toast'),toast=createToast(el);
   const results=[];
   for(const text of ['보상 수령 완료','군공이 부족합니다.','주간 갱신을 확인하세요.']){
    toast.show(text);
    results.push([el.dataset.state,...Array.from(el.querySelectorAll('strong,span'),node=>getComputedStyle(node).color)]);
   }
   return results;
  });
  assert.deepEqual(result,['success','error','info'].map(state=>[state,'rgb(255, 255, 255)','rgb(255, 255, 255)']));
  await toast.waitFor();
  await page.waitForFunction(()=>document.querySelector('#toast').dataset.nineSlice==='blue');
  const data=await toast.evaluate(el=>el.style.backgroundImage.slice(5,-2).split(',')[1]);
  const {data:rgba,info}=await sharp(Buffer.from(data,'base64')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(const pixel of [0,info.width-1,info.width*(info.height-1),info.width*info.height-1])assert.equal(rgba[pixel*4+3],0);
  assert.deepEqual(errors,[]);
  console.log('PASS purchase toast, distinct states, top overlay at 3 widths, unchanged game bounds, transparent corners');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});


