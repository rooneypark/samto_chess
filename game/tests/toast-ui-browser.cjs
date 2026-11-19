const {launch,start,seed,artifact}=require('./browser-env.cjs');
const assert=require('node:assert/strict');
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
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const box=await toast.boundingBox(),game=await page.locator('.game').boundingBox();
   const scale=await page.locator('.game-stack').evaluate(el=>el.getBoundingClientRect().width/el.offsetWidth);
   assert.ok(Math.abs(box.y-game.y-8*scale)<1,JSON.stringify({width,box,game,scale}));
   assert.ok(box.y+box.height<game.y+game.height);
   assert.ok(Math.abs(box.x+box.width/2-game.x-game.width/2)<1 && box.width<=game.width*.91, JSON.stringify({box,game}));
   assert.equal(await toast.evaluate(el=>getComputedStyle(el).pointerEvents),'none');
  }
  const shown=await page.locator('.game').boundingBox();assert.equal(await toast.getByRole('button').count(),0);await toast.waitFor({state:'hidden'});assert.deepEqual(await page.locator('.game').boundingBox(),shown);
  const game=await page.locator('.game').boundingBox();assert.ok(game.width>=319);
  const result=await page.evaluate(async()=>{
   const {createToast}=await import('./toast.js');
   const el=document.querySelector('#toast'),toast=createToast(el);
   const results=[];
   for(const text of ['보상 수령 완료','군공이 부족합니다.','주간 갱신을 확인하세요. 다음 보상은 다음 임무를 마친 뒤에 받을 수 있습니다.']){
    toast.show(text);
    results.push([el.dataset.state,...Array.from(el.querySelectorAll('strong,span'),node=>getComputedStyle(node).color)]);
   }
   return results;
  });
  assert.deepEqual(result,['success','error','info'].map(state=>[state,'rgb(255, 255, 255)','rgb(255, 255, 255)']));
  await toast.waitFor();
  const geometry=await toast.evaluate(async el=>{
   const {createToast}=await import('./toast.js');
   createToast(el).show('저장하지 못했습니다. 재화는 소모되지 않았습니다.');
   const range=document.createRange();
   range.selectNodeContents(el.querySelector('strong'));
   const label=range.getBoundingClientRect();
   range.selectNodeContents(el.querySelector('span'));
   const lines=[...range.getClientRects()];
   return {count:lines.length,top:lines[0].top-label.top,indent:lines.at(-1).left-lines[0].left,
    image:getComputedStyle(el).backgroundImage,border:getComputedStyle(el).borderImageSource};
  });
  assert.equal(geometry.count,2);assert.ok(Math.abs(geometry.top)<1 && Math.abs(geometry.indent)<1);
  assert.equal(geometry.image,'none');assert.equal(geometry.border,'none');
  await page.screenshot({path:artifact('scene-motion','plain-failure-toast.png')});
  assert.deepEqual(errors,[]);
  console.log('PASS purchase toast, distinct states, top overlay at 3 widths, unchanged game bounds, two-line failure alignment');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});


