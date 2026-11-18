// Review-only blade insert; source body pixels and the occluded impact frame stay intact.
const fs=require('fs'),path=require('path'),{chromium}=require('playwright-core');
const root=path.resolve(__dirname,'../..'),src=path.join(root,'bone-motion/out/pixellab/2/a3-rear-v1'),out=path.join(src,'../a3-rear-edge-review-v5');
const generated=process.argv[2];
const data=p=>'data:image/png;base64,'+fs.readFileSync(p).toString('base64');
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();
const result=await page.evaluate(async({original,generated,impact})=>{
 const load=async u=>{const i=new Image();i.src=u;await i.decode();return i};
 const [a,g,b]=await Promise.all([load(original),load(generated),load(impact)]);
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.drawImage(a,0,0);const before=x.getImageData(0,0,256,256);
 x.clearRect(145,20,23,58);x.imageSmoothingEnabled=false;
 x.drawImage(g,94,74,14,42,146,22,14,56);
 const blade=document.createElement('canvas');blade.width=23;blade.height=58;const bx=blade.getContext('2d');bx.drawImage(c,145,20,23,58,0,0,23,58);
 const pixels=bx.getImageData(0,0,23,58).data;let lo=23,hi=-1;
 for(let yy=50;yy<58;yy++)for(let xx=0;xx<23;xx++)if(pixels[(yy*23+xx)*4+3]>128){lo=Math.min(lo,xx);hi=Math.max(hi,xx);}
 let goldLo=256,goldHi=0;for(let yy=80;yy<85;yy++)for(let xx=145;xx<165;xx++){const k=(yy*256+xx)*4;if(before.data[k]>140&&before.data[k+1]>80&&before.data[k+2]<130&&before.data[k+3]>128){goldLo=Math.min(goldLo,xx);goldHi=Math.max(goldHi,xx);}}
 const rootCenter=145+(lo+hi)/2,socketCenter=(goldLo+goldHi)/2,shift=Math.round(socketCenter-rootCenter);
 x.clearRect(145,20,23,58);x.save();x.beginPath();x.rect(145,20,23,58);x.clip();x.drawImage(blade,145+shift,20);x.restore();
 const after=x.getImageData(0,0,256,256);let changed=0;
 for(let y=0;y<256;y++)for(let xx=0;xx<256;xx++){const k=(y*256+xx)*4;if(before.data.slice(k,k+4).some((v,j)=>v!==after.data[k+j])){changed++;if(!(xx>=145&&xx<168&&y>=20&&y<78))throw Error(JSON.stringify({xx,y,rootCenter,socketCenter,shift,lo,hi,goldLo,goldHi}));}}
 const corrected=c.toDataURL();const s=document.createElement('canvas');s.width=1024;s.height=1080;const z=s.getContext('2d');z.fillStyle='#28303e';z.fillRect(0,0,s.width,s.height);z.imageSmoothingEnabled=false;z.fillStyle='white';z.font='20px sans-serif';
 for(const [row,old,newIm,label] of [[0,a,c,'07 PRE-IMPACT'],[1,b,b,'08 IMPACT (OCCLUDED / UNCHANGED)']]){const y=row*540;z.fillText('BEFORE '+label,12,y+24);z.fillText('AFTER '+label,524,y+24);z.drawImage(old,0,y+28,512,512);z.drawImage(newIm,512,y+28,512,512);}
 return {corrected,comparison:s.toDataURL(),changed,rootCenter,socketCenter,shift};
},{original:data(path.join(src,'07.png')),generated:data(generated),impact:data(path.join(src,'08.png'))});
for(const [name,value] of [['07.png',result.corrected],['before-after.png',result.comparison]])fs.writeFileSync(path.join(out,name),Buffer.from(value.split(',')[1],'base64'));
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({status:'review_only_not_approved',frames:[{frame:7,file:'07.png',changed_pixels:result.changed},{frame:8,file:'../a3-rear-v1/08.png',unchanged:true,reason:'Blade occluded by body'}],canvas:[256,256],pivot:[128,224],method:'Original a3-front-v1/07.png blade crop [94,74,108,116], nearest-neighbor length fit and socket-center alignment; no generated blade used; all pixels outside blade ROI identical',edit_box:[145,20,168,78],runtime_applied:false},null,2));
await browser.close();console.log(JSON.stringify({out,changed:result.changed,outside_roi_changes:0,rootCenter:result.rootCenter,socketCenter:result.socketCenter,shift:result.shift}));})();
