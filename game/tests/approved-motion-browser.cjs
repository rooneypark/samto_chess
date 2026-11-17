const {launch,start,seed,artifact}=require('./browser-env.cjs');
const assert=require('node:assert/strict');
(async()=>{const browser=await launch();try{
 const page=await browser.newPage({viewport:{width:941,height:1672}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await start(page);
 await seed(page,(s,{battleRun})=>{
  s.order=['2','1','15','16','35','0'];for(const id of s.order)s.heroes[id].owned=true;s.preferences={...(s.preferences??{}),reducedFx:true};
  const r=battleRun.newRun(s,42,'approved-motion-check');r.units=[{id:1,hero:'2',rank:1,x:3,y:3,cost:3}];r.nextId=2;s.battleRun=r;return s;
 });
 await page.locator('.battle-v2[aria-busy=false]').waitFor();
 const canvas=page.locator('[data-unit="1"] canvas[data-approved-motion]');
 await canvas.waitFor();assert.match(await canvas.getAttribute('data-painted-frame'),/characters\/v1\/2\/back.png/);
 const geometry=await canvas.evaluate(el=>{const c=el.getBoundingClientRect(),tile=el.closest('.battle-position').getBoundingClientRect();return {scale:c.width/tile.width,foot:c.top+c.height*.875,target:tile.top+tile.height*.7};});
 assert.ok(Math.abs(geometry.scale-2.048)<.01);assert.ok(Math.abs(geometry.foot-geometry.target)<1);
 await page.screenshot({path:artifact('approved-motion','prepare.png')});
 await page.locator('#battle-start').click();
 await page.waitForFunction(()=>document.querySelector('[data-unit="1"] [data-approved-motion]')?.dataset.approvedMotion.endsWith('-attack'),{},{timeout:30000});
 await page.locator('#battle-header-pause').click();
 const frozen=await canvas.getAttribute('data-painted-frame');await page.waitForTimeout(200);assert.equal(await canvas.getAttribute('data-painted-frame'),frozen);
 await page.screenshot({path:artifact('approved-motion','attack.png')});
 // Exercise all three directions and both lateral flips with the actual decoded assets.
 const matrix=await page.evaluate(async()=>{
  const {approvedMotionSprite,paintApprovedMotions}=await import('./approved-motion.js');
  const host=document.createElement('div');host.id='motion-review';host.style='position:fixed;inset:0;background:#26384b;z-index:99999;display:flex;flex-wrap:wrap;align-content:start';document.body.append(host);
  for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0]])for(const state of ['move','attack','skill']){
   const u={id:1,hero:'2',side:0,x:3,y:3,hp:100,status:{}},r={phase:'fighting',profile:{},battle:{tick:5,units:[{id:2,x:3+dx,y:3+dy}]}};
   if(state==='move')u.move={x:3+dx,y:3+dy,start:0,at:10};else u.action={start:0,at:10,target:2,skill:state==='skill'};
   const box=document.createElement('div');box.style='position:relative;width:24%;height:300px';box.innerHTML='<p>'+state+' '+dx+','+dy+'</p><div style="position:absolute;left:65px;top:140px;width:100px;height:100px">'+approvedMotionSprite(u,r)+'</div>';host.append(box);
  }
  paintApprovedMotions(host);
  return [...host.querySelectorAll('canvas')].map(c=>({clip:c.dataset.approvedMotion,painted:!!c.dataset.paintedFrame,opaque:[...c.getContext('2d').getImageData(0,0,256,256).data].filter((v,i)=>i%4===3&&v>0).length}));
 });
 assert.equal(matrix.length,12);assert.ok(matrix.every(c=>c.painted&&c.opaque>100));
 await page.screenshot({path:artifact('approved-motion','directions.png')});
 await page.evaluate(()=>document.querySelector('#motion-review').remove());
 await page.locator('#battle-header-pause').click();
 await seed(page,(s,{battleRun})=>{
  const r=battleRun.newRun(s,43,'approved-skill-check');r.units=[{id:1,hero:'2',rank:1,x:3,y:3,cost:3}];r.nextId=2;
  const fighting=battleRun.startRound(r);const u=fighting.battle.units.find(v=>v.side===0);u.mana=u.maxMana;s.battleRun=fighting;return s;
 });
 await page.waitForFunction(()=>document.querySelector('[data-unit="1"] [data-approved-motion]')?.dataset.approvedMotion.endsWith('-skill'),{},{timeout:30000});
 await page.locator('#battle-header-pause').click();
 await page.screenshot({path:artifact('approved-motion','skill.png')});
 assert.deepEqual(errors,[]);
 console.log('PASS: runtime preload, pivot/scale, attack, pause, 12 directional states, no page errors');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
