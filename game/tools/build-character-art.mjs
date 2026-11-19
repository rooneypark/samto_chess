import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)('../../design-delivery/v1/a-production/tools/node_modules/sharp');
const root=path.resolve(import.meta.dirname,'../..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'art-source/characters/v1/manifest.json'),'utf8'));
const profiles=JSON.parse(fs.readFileSync(path.join(root,'bone-motion/hero-profiles.json'),'utf8')).heroes;
const entries={};
for(const e of manifest.entries){
 const views={};
 for(const view of ['front','side','back']){
  const d=e.directions[view],file=path.join(root,`art-source/characters/v1/${e.id}/${view}.png`);
  const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let x0=info.width,y0=info.height,x1=0,y1=0;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>16){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x+1);y1=Math.max(y1,y+1);}
  const visible=[x0,y0,x1-x0,y1-y0].map(v=>v*256/info.width);
  views[view]={url:`../art-source/characters/v1/${e.id}/${view}.png`,width:256,height:256,foot:[128,224],visible,nativeCanvas:d.canvas,sha256:d.sha256};
 }
 entries[e.id]={name:e.name,family:profiles[e.id].family,views};
}
fs.writeFileSync(path.join(root,'game/character-art-data.js'),'// Generated from the user-approved 2026-11-18 artwork. Coordinates are logical 256px.\nexport const generals='+JSON.stringify(entries,null,2)+';\n');
