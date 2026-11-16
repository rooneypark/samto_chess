const sharp=require('../../design-delivery/v1/a-production/tools/node_modules/sharp'),assert=require('node:assert/strict'),path=require('node:path');
module.exports=async function verifyButtonAlpha(id,before,after){
 const mask=await sharp(path.resolve('game/assets/ui-common/battle-'+id+'.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const a=await sharp(before).ensureAlpha().raw().toBuffer({resolveWithObject:true}),b=await sharp(after).ensureAlpha().raw().toBuffer();
 assert.equal(a.info.width,mask.info.width);assert.equal(a.info.height,mask.info.height);
 const {width:w,height:h}=a.info;let transparent=0,gold=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,red=mask.data[i],green=mask.data[i+1],blue=mask.data[i+2];
  if(mask.data[i+3]===0){transparent++;assert.deepEqual([...b.slice(i,i+3)],[...a.data.slice(i,i+3)],id+' background at '+x+','+y);}
  else if((x<w*.2||x>w*.8||y<h*.2||y>h*.8)&&(red>100&&green>65&&red>green*1.025&&green>blue*1.1||red>100&&green>110&&blue>120)){gold++;assert.ok(b[i]+b[i+1]+b[i+2]<(a.data[i]+a.data[i+1]+a.data[i+2])*.9,id+' gold frame at '+x+','+y);}
 }
 assert.ok(transparent>30,id+' transparent corners');assert.ok(gold>150,id+' complete gold outline');
};
