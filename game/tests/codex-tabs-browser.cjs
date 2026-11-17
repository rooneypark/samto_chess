const {launch,start,seed,savedState,artifact}=require('./browser-env.cjs');
const assert=require('node:assert/strict');
const catalog=require('../../art-source/treasures/v1/catalog.json');
(async()=>{
 const browser=await launch();
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)errors.push(response.url());});
  await start(page,{hash:'#codex'});
  await seed(page,state=>{
   state.treasures.push({id:'codex-existing-treasure',defId:'iron',star:1});
   return state;
  });
  const root=page.locator('.codex-runtime'),ready=()=>root.and(page.locator('[aria-busy=false]')).waitFor();
  await ready();await root.locator('.header-lettering img').waitFor();
  const before=await savedState(page);
  for(const width of [941,390,320]){
   await page.setViewportSize({width,height:width===941?1672:844});
   await root.locator('[data-kind=treasures]').click();await ready();
   assert.equal(await root.locator('.summary-title b').textContent(),'32종');
   assert.ok(await root.locator('.reward-amount').isHidden());
   assert.ok(await root.locator('.source-button').isHidden());
   for(const [id,name] of [['tr-002','청공검'],['tr-003','청룡언월도']]){
    await root.locator('[data-treasure='+id+']').click();await ready();
    assert.equal(await root.locator('.detail-title').textContent(),name);
    const art=await root.locator('.detail-art img').evaluate(img=>[img.src,img.naturalWidth,img.naturalHeight]);
    assert.ok(art[0].endsWith('/'+id+'.png'));assert.deepEqual(art.slice(1),[256,256]);
   }
   await page.screenshot({path:artifact('codex-tabs','treasures-'+width+'.png')});
   const seen=[];
   for(let i=0;i<6;i++){
    seen.push(...await root.locator('[data-treasure]').evaluateAll(cards=>cards.map(card=>card.dataset.treasure)));
    if(i<5){await root.locator('.page-next').click();await ready();}
   }
   assert.deepEqual(seen,catalog.items.map(item=>item.catalogId));
   assert.equal(await root.locator('.page-next').isDisabled(),true);
   for(const [group,count] of [['무기',11],['군마',4],['서책',8],['기타',9]]){
    await root.locator('[data-faction="'+group+'"]').click();await ready();
    assert.match(await root.locator('.page-count').textContent(),new RegExp(count+'종$'));
   }
   await root.locator('[data-kind=heroes]').click();await ready();
   assert.equal(await root.locator('[data-hero].codex-entry').count(),6);
   assert.ok(await root.locator('.source-button').isVisible());
  }
  assert.deepEqual(await savedState(page),before);
  assert.deepEqual(errors,[]);
  console.log('PASS 32 treasure originals, detail images, categories and pages at 3 widths, existing inventory unchanged');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
