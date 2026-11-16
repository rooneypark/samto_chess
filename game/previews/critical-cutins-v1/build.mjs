import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require('../../../design-delivery/v1/a-production/tools/node_modules/sharp');
import {heroes} from '../../heroes.js';
const root='art-source/critical-cutins/v1',out='game/previews/critical-cutins-v1';
const manifest=JSON.parse(fs.readFileSync(`${root}/manifest.json`,'utf8'));
if(manifest.entries.length!==heroes.length||heroes.some(h=>!manifest.entries.some(e=>e.id===h.id)))throw Error('Roster mismatch');
const assets='game/assets/skill-cutins';fs.mkdirSync(assets,{recursive:true});
const review=[];
for(const e of manifest.entries){
 /* The lossless WEBP is the only stored copy (PNG originals removed 2026-11-16): validate it, do not convert. */const input=`${assets}/${e.id}.webp`,bytes=fs.readFileSync(input);
 const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let x0=info.width,y0=info.height,x1=-1,y1=-1,transparent=0,visible=0,edgeVisible=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const a=data[(y*info.width+x)*4+3];if(a===0)transparent++;
  if(a>16){visible++;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);if(x===0||y===0||x===info.width-1||y===info.height-1)edgeVisible++;}
 }
 if(!visible||!transparent||edgeVisible)throw Error(`Alpha/edge validation failed: ${e.id}, edge=${edgeVisible}`);
 // Lossless format conversion only. Preserve full canvas and exact visible pixels.
 
 review.push({id:e.id,name:e.name,faction:e.faction,file:`../../assets/skill-cutins/${e.id}.webp`,source:input,width:info.width,height:info.height,alphaBounds:[x0,y0,x1,y1],edgeVisible,transparentPixels:transparent,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 fs.writeFileSync(`${root}/${e.id}/prompt.txt`,e.prompt+'\n'+(e.revisions||[]).map(r=>'\nRevision '+r.file+'\n'+r.prompt).join('\n'));
}
fs.writeFileSync(`${out}/data.json`,JSON.stringify(review,null,2)+'\n');
fs.writeFileSync(`${root}/validation.json`,JSON.stringify({count:review.length,checks:['roster coverage','RGBA transparency','no visible edge clipping at alpha>16'],entries:review},null,2)+'\n');
// QA contact sheets are flattened against three contrasting backgrounds, never used as sprites.
fs.mkdirSync('test-artifacts',{recursive:true});
for(const [tone,color] of [['dark','#142338'],['light','#eee9dc'],['contrast','#d68fba']]){
 const cells=[];for(let i=0;i<review.length;i++){
  const im=await sharp(`${out}/${review[i].file}`).resize(240,160,{fit:'contain',background:color}).flatten({background:color}).png().toBuffer();
  cells.push({input:im,left:(i%7)*244,top:Math.floor(i/7)*164});
 }
 await sharp({create:{width:1708,height:1148,channels:3,background:color}}).composite(cells).png().toFile(`test-artifacts/cutins-${tone}.png`);
}
console.log(`Prepared ${review.length} lossless previews; source alpha/edge checks passed.`);
