const {launch}=require('../../tests/browser-env.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const out=path.join(__dirname,'media'),frames=path.resolve(__dirname,'../../../test-artifacts/motion-v1/frames');
(async()=>{await fs.mkdir(out,{recursive:true});await fs.mkdir(frames,{recursive:true});const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:900,height:980}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8780/game/previews/motion-v1/');await page.locator('body[data-ready=true]').waitFor();
 for(const width of [900,390,320]){await page.setViewportSize({width,height:980});await page.evaluate(()=>{motionPreview.seek('recruit',1800);motionPreview.seek('skill',650)});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:path.join(out,`preview-${width}.png`),fullPage:true});}
 const button=page.locator('[data-play=recruit]');await button.scrollIntoViewIfNeeded();const bounds=await button.boundingBox();await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.down();assert.ok(await button.evaluate(e=>e.classList.contains('is-pressed')));assert.deepEqual(await button.boundingBox(),bounds);await page.mouse.up();await page.locator('[data-still=recruit]').click();
 assert.deepEqual(await page.evaluate(async()=>({local:localStorage.length,db:(await indexedDB.databases()).length})),{local:0,db:0});
 for(const id of ['recruit','skill']){
  const count=id==='recruit'?84:60;
  for(let i=0;i<count;i++){
   const png=await page.evaluate(({id,t})=>{motionPreview.seek(id,t);const c=document.createElement('canvas');c.width=390;c.height=580;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(document.getElementById(id),0,0,390,580);return c.toDataURL('image/png').split(',')[1]},{id,t:i*1000/24});
   await fs.writeFile(path.join(frames,`${id}-${String(i).padStart(3,'0')}.png`),Buffer.from(png,'base64'));
  }
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','24','-i',path.join(frames,`${id}-%03d.png`),'-filter_complex','split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=none','-loop','0',path.join(out,`${id}.gif`)]);
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.locator('body[data-ready=true]').waitFor();const before=await page.locator('#recruit').screenshot();await page.waitForTimeout(200);assert.ok(before.equals(await page.locator('#recruit').screenshot()));assert.deepEqual(errors,[]);
 console.log('PASS: 2 timelines, 3 widths, pressed bounds, zero save access, reduced motion, GIF exports');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
