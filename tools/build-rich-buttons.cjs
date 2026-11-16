const fs = require('node:fs');
const path = require('node:path');
const sharp = require('../design-delivery/v1/a-production/tools/node_modules/sharp');

async function main() {
  const root = path.resolve(__dirname, '..');
  for (const tone of ['green', 'blue']) {
    const version = 'v3';
    const source = path.join(root, 'art-source/ui-build/v1/button-rich-v2', `${tone}-source-${version}.png`);
    const {data, info} = await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let left=info.width, top=info.height, right=0, bottom=0;
    for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++) {
      const offset=(y*info.width+x)*4;
      data[offset+3]=data[offset+3]>=128?255:0;
      if(data[offset+3]) { left=Math.min(left,x); top=Math.min(top,y); right=Math.max(right,x); bottom=Math.max(bottom,y); }
    }
    const output = path.join(root, 'game/assets/ui-scalable', `${tone}-rich.png`);
    await sharp(data,{raw:info}).extract({left,top,width:right-left+1,height:bottom-top+1})
      .resize(579,143,{fit:'fill',kernel:'nearest'}).png().toFile(output);
    console.log(tone, {width:579,height:143,slice:66,corner:28});
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});

