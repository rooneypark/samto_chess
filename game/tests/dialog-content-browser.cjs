const {launch,start,artifact}=require('./browser-env.cjs');
const assert=require('node:assert/strict');
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await start(page,{hash:'#shop'});
 await page.evaluate(async()=>{
  document.querySelector('#modal').remove();const el=document.createElement('dialog');el.id='modal';el.innerHTML='<header class="dialog-header"><h2 id="modal-title"></h2><button id="close-modal"></button></header><div id="modal-body"></div>';document.body.append(el);
  const {createGameDialog}=await import('./dialog.js');const {dialogEmpty}=await import('./dialog-content.js');const {dialogIconNames}=await import('./dialog-art-content.js');
  window.artAudit=createGameDialog(el,{artwork:true});window.artAudit.open('공용 아이콘 확인',dialogIconNames.map(name=>dialogEmpty(name,name)).join(''));
 });
 await page.waitForFunction(()=>document.querySelectorAll('[data-dialog-icon]').length===12);
 assert(await page.locator('[data-dialog-icon]').evaluateAll(es=>es.every(e=>getComputedStyle(e).backgroundImage.includes('dialog-icons-v1.png'))));
 await page.evaluate(()=>new Promise((resolve,reject)=>{const i=new Image();i.onload=resolve;i.onerror=reject;i.src='assets/ui-common/dialog-icons-v1.png'}));
 for(const width of [941,390,320]){
  await page.setViewportSize({width,height:width===941?1672:844});
  for(const name of ['banner','scroll','helmet','map','chest']){
   await page.evaluate(async name=>{const {dialogEmpty}=await import('./dialog-content.js');window.artAudit.open('안내',dialogEmpty(name,'현재 표시할 항목이 없습니다.'));},name);
   await page.waitForFunction(()=>document.querySelector('.dialog-art-panel')?.dataset.nineSlice);
   assert(await page.locator('#modal').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
   await page.locator('#modal').screenshot({path:artifact('dialog-content',`${name}-${width}.png`)});
  }
 }
 await page.evaluate(async()=>{const {dialogEmpty}=await import('./dialog-content.js');document.querySelector('#modal-body').insertAdjacentHTML('afterbegin',dialogEmpty('banner','검색 결과가 없습니다.'));});
 await page.waitForFunction(()=>document.querySelectorAll('[data-dialog-icon]').length===2);
 await page.locator('#close-modal').click();assert.equal(await page.locator('#modal').evaluate(e=>e.open),false);assert.deepEqual(errors,[]);
 console.log('PASS 12 shared icons, 5 empty states x 3 sizes, dynamic insertion and X');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
