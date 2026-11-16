import {heroes} from '../../heroes.js';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),sharp=require('../../../design-delivery/v1/a-production/tools/node_modules/sharp');
const config=JSON.parse(fs.readFileSync('art-source/characters/v1/display-scale.json','utf8'));
const entries=[];
fs.mkdirSync('game/previews/motion-v1/media/references',{recursive:true});
for(const h of heroes){
 const file=`art-source/characters/v1/${h.id}/front.png`,{data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});let foot=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>128)foot=y;
 await sharp(file).resize(300,340,{fit:'inside',kernel:'nearest'}).png().toFile(`game/previews/motion-v1/media/references/${h.id}.png`);
 entries.push({...h,file:`/game/previews/motion-v1/media/references/${h.id}.png`,width:info.width,height:info.height,foot,scale:Math.min(150/info.width,170/info.height)*(config.overrides[h.id]?.scale??1),correction:config.overrides[h.id]?.scale??1});
}
fs.writeFileSync('game/previews/motion-v1/reference-data.json',JSON.stringify(entries,null,2)+'\n');
const card=h=>`<article><div class="unit"><img src="${h.file}" style="width:${h.width*h.scale}px;height:${h.height*h.scale}px;bottom:${-(h.height-h.foot)*h.scale}px" alt="${h.name}"></div><p>${h.name}${h.correction!==1?' · 조정':''}</p></article>`;
fs.writeFileSync('game/previews/motion-v1/reference-review.html',`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>장수 원화 크기 검수</title><style>*{box-sizing:border-box}body{margin:0;padding:24px;background:#101b2b;color:#eeddb9;font-family:Georgia,Batang,serif}h1{font-size:22px}h2{font-size:17px}main{display:grid;grid-template-columns:repeat(auto-fit,160px);gap:16px;max-width:1216px}.unit{position:relative;width:160px;height:185px;background:#253447;border-bottom:1px solid #657889}.unit img{position:absolute;left:50%;transform:translateX(-50%);image-rendering:pixelated}p{font-size:13px;text-align:center}article{margin:0}header p{text-align:left}section{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:28px}</style><header><h1>장수 원화 · 몸 크기 및 발 기준 검수</h1><p>원본 픽셀 보존 · 하후연 72%, 조홍 78%, 육손 72% 표시 보정 · 실제 전투 데이터 변경 없음</p></header><h2>수정 장수와 비교 기준</h2><section>${['16','xiahouyuan','33','caohong','35','luxun'].map(id=>card(entries.find(e=>e.id===id))).join('')}</section><h2>전체 49명</h2><main>${entries.map(card).join('')}</main></html>`);
console.log('Reference review built; source PNGs unchanged.');
