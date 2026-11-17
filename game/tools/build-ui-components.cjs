const fs=require('node:fs/promises'),path=require('node:path');
const {frameCutout,pressedPNG,sharp}=require('./ui-cutout.cjs');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'game/assets/ui-common');
const sources={gate:'gate-lobby-v1.png',battle:'battle-preparation-v1.png',barracks:'barracks-v1.png'};
async function goldFormationLowerEdge(png){
 const {data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const shades=[[236,193,116],[208,158,79],[119,81,44],[65,46,31]];
 // Clear the lettering baked into the source so the button can use its live label.
 for(let y=8;y<50;y++)for(let x=43;x<121;x++){
  const i=(y*info.width+x)*4,left=(y*info.width+42)*4,right=(y*info.width+121)*4;
  for(let c=0;c<3;c++)data[i+c]=Math.round(data[left+c]+(data[right+c]-data[left+c])*(x-42)/79);
 }
 for(const [row,shade] of shades.entries())for(let x=10;x<150;x++){
  const i=((52+row)*info.width+x)*4;
  if(!data[i+3]||data[i+2]-data[i]<18)continue;
  const variation=(data[i+1]-[146,128,74,53][row])*.4;
  for(let c=0;c<3;c++)data[i+c]=Math.max(0,Math.min(255,Math.round(shade[c]+variation)));
 }
 return sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();
}
const definitions={
 gate:{
 profile:[35,18,124,120],gold:[693,20,220,55],diamonds:[693,77,220,54],
 mail:[20,177,115,123],quests:[20,305,115,125],start:[20,436,115,124],
 settings:[807,174,118,117],codex:[807,293,118,115],expedition:[807,410,118,115],tower:[807,529,118,118],
 formation:[688,1085,160,61],campaign:[43,1287,191,185],depart:[245,1283,643,191],
 'nav-shop':[18,1512,178,144],'nav-barracks':[201,1512,174,144],'nav-home':[375,1499,193,160],'nav-alliance':[570,1512,174,144],'nav-arena':[747,1512,177,144]
 },
 battle:{
 back:[39,15,94,84],help:[812,14,95,85],capacity:[813,216,89,74],sell:[348,1163,162,83],
 summon:[18,1404,307,145],start:[337,1404,582,145],
 sword:[531,1163,119,83],armor:[655,1163,121,83],bow:[779,1163,120,83]
 },
 barracks:{
 back:[28,17,98,98],gold:[699,17,213,55],diamonds:[699,76,213,49],
 train:[24,794,311,94],awaken:[346,795,277,94],formation:[630,795,291,94],
 treasure:[769,695,134,56],skill:[488,606,420,77],card:[326,1011,290,200],'card-selected':[19,1011,295,200],
 'filter-all':[399,920,115,59],'filter-wei':[514,920,101,59],'filter-shu':[615,920,100,59],'filter-wu':[715,920,96,59],'filter-qun':[811,920,101,59],
 'nav-shop':[18,1514,177,144],'nav-barracks':[198,1499,178,163],'nav-home':[378,1514,185,144],'nav-alliance':[570,1514,170,144],'nav-arena':[747,1514,177,144]
 }
};
(async()=>{
 await fs.mkdir(out,{recursive:true});const records={};
 for(const [screen,items] of Object.entries(definitions))for(const [name,box] of Object.entries(items)){
  const id=screen+'-'+name,source=path.join(root,'design-delivery/v2/05-mockups',screen==='barracks'&&name.startsWith('card')?'barracks-clean-plate.png':sources[screen]);
  const options={rim:2,tone:(['gold','diamonds','skill'].includes(name)||name.startsWith('nav-'))?'slate':'both'};if(screen==='gate'&&['mail','quests'].includes(name))options.include=[[98,17,15]];
  if(['gate-campaign','battle-summon','battle-sell','barracks-awaken','barracks-formation'].includes(id))options.rim=6;
  if(id==='gate-formation'||screen==='barracks'&&name.startsWith('filter-'))options.paperBackground=true;
  if(name.startsWith('nav-')&&!['gate-nav-home','barracks-nav-barracks'].includes(id)){options.tone='slate';options.slateFrame=true;}
  if(['gold','diamonds'].includes(name))options.includeGreen=true;
  if(screen==='gate'&&['mail','quests','start','settings','codex','expedition','tower'].includes(name))options.darkOutline=true;
  if(name.startsWith('card'))options.tone='slate';
  let png=await frameCutout(source,box,options);
  if(id==='gate-formation')png=await goldFormationLowerEdge(png);
  await fs.writeFile(path.join(out,id+'.png'),png);
  await fs.writeFile(path.join(out,id+'-pressed.png'),await pressedPNG(png));
  records[id]={file:id+'.png',pressedFile:id+'-pressed.png',screen,box,source:path.relative(root,source).replaceAll('\\','/'),method:options.paperBackground?'original RGB, exterior parchment flood fill':'original RGB, measured frame outline and dark rim'};
 }
 // The parchment synergy bar has rolled ends rather than a closed metallic frame.
 // Its silhouette is measured from the source's dark rolled edge, row by row.
 const box=[22,1564,895,90],src=path.join(root,'game/assets/battle-v2/scroll-empty.png');
 const raw=await sharp(src).ensureAlpha().raw().toBuffer();const w=895,h=90;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const outside=(y<3&&(x<9||x>w-10))||(y>h-4&&(x<9||x>w-10));const i=(y*w+x)*4,r=raw[i],g=raw[i+1],b=raw[i+2],cap=r>70&&g>60&&g>b*1.15||g>r*1.2&&g>b*1.1;raw[i+3]=outside&&!cap?0:255;}
 await sharp(raw,{raw:{width:w,height:h,channels:4}}).png().toFile(path.join(out,'battle-bonds.png'));
 records['battle-bonds']={file:'battle-bonds.png',screen:'battle',box,source:'game/assets/battle-v2/scroll-empty.png',method:'rolled-scroll source edge'};
 await fs.writeFile(path.join(out,'battle-bonds-pressed.png'),await pressedPNG(path.join(out,'battle-bonds.png')));records['battle-bonds'].pressedFile='battle-bonds-pressed.png';
 await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify({records},null,2));
 await fs.writeFile(path.join(out,'components.js'),'// Generated by build-ui-components.cjs. Source-specific variants retain approved artwork.\nexport const uiComponents='+JSON.stringify(records)+';\n');
 console.log('Exported '+Object.keys(records).length+' reusable alpha UI components');
})().catch(e=>{console.error(e);process.exitCode=1});

