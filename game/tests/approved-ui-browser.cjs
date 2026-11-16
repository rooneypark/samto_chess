// --record is only for a newly user-approved visual baseline. Normal runs read it.
const {launch,start,seed,artifact}=require('./browser-env.cjs');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const sharp=require('../../design-delivery/v1/a-production/tools/node_modules/sharp');
const baseline=path.resolve(__dirname,'../../design-delivery/v2/05-mockups/approved-runtime'),record=process.argv.includes('--record'),scaleRecord=process.argv.includes('--record-barracks-scale'),portraitRecord=process.argv.includes('--record-barracks-portraits');
(async()=>{const browser=await launch();try{
 await fs.mkdir(baseline,{recursive:true});let count=0;const errors=[];
 for(const screen of (scaleRecord||portraitRecord?['barracks']:['home','barracks','shop','battle'])){
  const page=await browser.newPage({viewport:{width:941,height:1672},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));
  await start(page,{hash:screen==='battle'?'':'#'+screen});
  await seed(page,(s,{battleRun})=>{s.order=['1','xuchu','32','35','diaochan','119'];for(const id of s.order)s.heroes[id].owned=true;s.gold=12450;s.diamonds=s.freeDiamonds=320;s.paidDiamonds=0;s.reducedMotion=true;return s;});
  if(screen==='battle'){
   await seed(page,(s,{battleRun})=>{const r=battleRun.newRun(s,7,'approved-ui');r.capacity=6;r.silver=7;r.units=s.order.map((hero,i)=>({id:i+1,hero,rank:i<3?2:1,x:[1,3,6,1,3,6][i],y:i<3?2:0,cost:3}));r.nextId=7;s.battleRun=r;return s;});
   await page.locator('.battle-v2[aria-busy=false]').waitFor();
  }
  if(screen==='shop')await page.locator('.shop-v2[aria-busy=false]').waitFor();
  for(const size of [{width:941,height:1672},{width:390,height:844}]){
   await page.setViewportSize(size);await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});await page.mouse.move(0,0);await page.waitForTimeout(250);
   const name=screen+'-'+size.width+'.png',png=await page.screenshot({path:artifact('approved-ui',name)});
   if(scaleRecord||portraitRecord){
    // This explicit mode is only for the user's approved 100/85/70 correction.
    // Refuse to replace a baseline if any pixel outside the original-art slots changed.
    const a=await sharp(png).ensureAlpha().raw().toBuffer(),b=await sharp(path.join(baseline,name)).ensureAlpha().raw().toBuffer();assert.equal(a.length,b.length);
    const slots=await page.locator(portraitRecord?'.general-card-art':'.hero-stage,.general-card-art').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {left:Math.floor(r.left)-1,top:Math.floor(r.top)-1,right:Math.ceil(r.right)+1,bottom:Math.ceil(r.bottom)+1};}));
    let changed=0;for(let i=0;i<a.length;i+=4)if(!a.subarray(i,i+4).equals(b.subarray(i,i+4))){const x=i/4%size.width,y=Math.floor(i/4/size.width);assert.ok(slots.some(r=>x>=r.left&&x<r.right&&y>=r.top&&y<r.bottom),'Non-character pixel changed '+name+' '+x+','+y);changed++;}
    assert.ok(changed>0);await fs.writeFile(path.join(baseline,name),png);console.log(portraitRecord?'Approved roster portraits only':'Approved stature-only correction',name,changed,'pixels');
   }else if(record)await fs.writeFile(path.join(baseline,name),png);
   else{const a=await sharp(png).ensureAlpha().raw().toBuffer(),b=await sharp(path.join(baseline,name)).ensureAlpha().raw().toBuffer();assert.equal(a.length,b.length);
    // Chromium can use different decoded downsampling levels for high-res
    // character PNGs. Native UI outside visible <img> bounds stays exact;
    // images/mobile allow only <0.6 / 255 mean channel error over the view.
    // Only the explicitly removed sort control differs from the approved layout.
    const g=await page.locator('.game').boundingBox(),scale=g.width/941;
    const scrollChange=await require('./approved-ui-changes.cjs')(page,size.width);
    const insetPixel=i=>{const y=(Math.floor(Math.floor(i/4)/size.width)-g.y)/scale;const x=(Math.floor(i/4)%size.width-g.x)/scale;return scrollChange(i)||(screen==='barracks'&&x>=690&&x<910&&y>=1460&&y<1498);};
    let error=0;for(let i=0;i<a.length;i++)if(!insetPixel(i))error+=Math.abs(a[i]-b[i]);assert.ok(error/a.length<.6,name+' visual drift: '+error/a.length);
    if(size.width===941){
     const images=await page.locator('.game img').evaluateAll(es=>es.filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {left:Math.floor(r.left)-1,top:Math.floor(r.top)-1,right:Math.ceil(r.right)+1,bottom:Math.ceil(r.bottom)+1};}));
     for(let i=0;i<a.length;i+=4)if(!a.subarray(i,i+4).equals(b.subarray(i,i+4))){const x=i/4%941,y=Math.floor(i/4/941);assert.ok(insetPixel(i)||images.some(r=>x>=r.left&&x<r.right&&y>=r.top&&y<r.bottom),name+' UI differs at '+x+','+y);}
    }
   }
   count++;
  }
  await page.close();
 }
 assert.deepEqual(errors,[]);console.log((record?'RECORDED ':'PASS ')+count+' approved runtime views (native UI exact, decoded images/mobile raster-tolerant)');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
