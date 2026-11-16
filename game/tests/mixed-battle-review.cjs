const {launch,start,baseUrl,artifact,savedState,waitForSave,seed}=require('./browser-env.cjs');
const fs=require('node:fs/promises'),path=require('node:path'),{spawn}=require('node:child_process');
(async()=>{
 const out=path.dirname(artifact('mixed-battle','audit.json'));
 const browser=await launch();
 const page=await browser.newPage({viewport:{width:480,height:720}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await start(page);
 await seed(page,(state,m)=>{
  const {newRun}=m.battleRun,{createBattle}=m.battleEngine,{combatant}=m.battleData;
  const run=newRun(state,1,'mixed-review');
  const roster=['15','infantry','1','35','77','tactician'];
  run.units=roster.map((hero,i)=>({id:i+1,hero,rank:2,x:[2,3,4,2,3,4][i],y:i<3?3:1,cost:6}));
  run.capacity=6;run.round=5;run.phase='fighting';
  const enemies=['bandit','shield','bandit','boss','32','taoist'].map((hero,i)=>combatant({id:100+i,hero,rank:2,x:[2,3,4,2,3,4][i],y:i<3?4:6},1,state));
  run.battle=createBattle([...run.units.map(u=>combatant(u,0,state)),...enemies],'campaign','mixed-review');
  return {...state,battleRun:run};
 });
 const encoder=spawn(process.env.SAMGUK_FFMPEG??'ffmpeg',['-y','-loglevel','error','-f','image2pipe','-vcodec','mjpeg','-framerate','15','-i','pipe:0','-an','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',out+'/mixed-battle.mp4']);
 const encoded=new Promise(resolve=>encoder.on('close',resolve));encoder.stderr.on('data',d=>process.stderr.write(d));
 const cdp=await page.context().newCDPSession(page);let latest=await page.screenshot({type:'jpeg'});
 cdp.on('Page.screencastFrame',e=>{latest=Buffer.from(e.data,'base64');cdp.send('Page.screencastFrameAck',{sessionId:e.sessionId}).catch(()=>{});});
 await cdp.send('Page.startScreencast',{format:'jpeg',quality:85,everyNthFrame:1});
 const timer=setInterval(()=>{if(!encoder.stdin.writableNeedDrain)encoder.stdin.write(latest);},1000/15);
 try{
  await page.reload();let captured=false;const started=Date.now();
  while(!await page.locator('.battle-result').count()){
   if(Date.now()-started>110000)throw Error('battle timeout');
   if(!captured&&await page.locator('.original-spell').count()&&await page.locator('.warrior-effect').count()){await page.screenshot({path:out+'/mixed-skills.png'});captured=true;}
   await page.waitForTimeout(100);
  }
  await page.screenshot({path:out+'/result.png'});
  const state=await savedState(page);
  const audit={fixture:'isolated 6v6 mixed troop test, rank II, level 1, normal starting mana',result:state.battleRun.outcome,ticks:state.battleRun.battle.tick,units:state.battleRun.battle.units.map(u=>({name:u.name,skill:u.skill,casts:u.casts,damage:u.damage,healing:u.healing})),errors};
  await fs.writeFile(out+'/audit.json',JSON.stringify(audit,null,2));console.log(JSON.stringify(audit));await page.waitForTimeout(1800);
 }finally{clearInterval(timer);await cdp.send('Page.stopScreencast');encoder.stdin.end();await encoded;await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
