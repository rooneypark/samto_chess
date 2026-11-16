const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../../../..');
const sharp=require(path.join(root,'design-delivery/v1/a-production/tools/node_modules/sharp'));
const {launch}=require(path.join(root,'game/tests/browser-env.cjs'));
(async()=>{
const g=JSON.parse(fs.readFileSync(path.join(__dirname,'generation.json'),'utf8'));const report=[];
for(const e of g.entries){
const {data,info}=await sharp(path.join(__dirname,e.file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
let l=info.width,t=info.height,r=-1,b=-1,edge=0,transparent=0;
for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const a=data[(y*info.width+x)*4+3];if(a===0)transparent++;if(a>8){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);if(x===0||y===0||x===info.width-1||y===info.height-1)edge++;}}
if(edge)throw Error(e.name+' touches canvas edge');
report.push({name:e.name,file:e.file,dimensions:[info.width,info.height],alphaThreshold:8,bounds:[l,t,r-l+1,b-t+1],margins:[l,t,info.width-1-r,info.height-1-b],edgePixels:edge,fullyTransparentPixels:transparent});
}
const browser=await launch();const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:1});
await page.goto(pathToFileURL(path.join(__dirname,'index.html')).href);await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
for(const theme of ['', 'dark','contrast']){await page.evaluate(t=>document.body.className=t,theme);await page.screenshot({path:path.join(__dirname,'review-'+(theme||'light')+'.png'),fullPage:true});}
await browser.close();fs.writeFileSync(path.join(__dirname,'qa.json'),JSON.stringify({status:'silhouette-and-alpha-preview-checked',runtimeApplied:false,sheets:report},null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});

