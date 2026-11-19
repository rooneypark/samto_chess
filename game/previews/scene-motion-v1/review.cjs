// Captures the live, interactive preview. No user profile is opened.
const {launch,artifact,baseUrl}=require('../../tests/browser-env.cjs');
const fs=require('node:fs'),{spawnSync}=require('node:child_process');
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:1180,height:960},deviceScaleFactor:1});
 await page.goto(baseUrl+'previews/scene-motion-v1/');await page.locator('body[data-ready=true]').waitFor();
 await page.screenshot({path:artifact('scene-motion','preview-desktop.png')});
 await page.locator('#play-all').click();const started=Date.now(),fps=12,count=102;
 for(let i=0;i<count;i++){
  const wait=started+i*1000/fps-Date.now();if(wait>0)await page.waitForTimeout(wait);
  await page.screenshot({path:artifact('scene-motion','frames',`frame-${String(i).padStart(4,'0')}.jpg`),type:'jpeg',quality:90});
 }
 const output=artifact('scene-motion','scene-motion-preview.mp4');
 const result=spawnSync('ffmpeg',['-y','-loglevel','error','-framerate',String(fps),'-i',artifact('scene-motion','frames','frame-%04d.jpg'),'-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',output],{stdio:'inherit'});
 if(result.status!==0)throw Error('Preview video encoding failed');
 fs.writeFileSync(artifact('scene-motion','capture.json'),JSON.stringify({output,frames:count,fps,elapsedMs:Date.now()-started},null,2));
 console.log(output);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
