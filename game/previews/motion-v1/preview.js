import {renderNineSlice,nineSlice} from '../../nine-slice.js';
import {initArtPress} from '../../art-controls.js';

// Preview-only deterministic timelines. No store, game engine, or transaction imports.
const assets={header:'ui-common/header-frame.png',title:'ui-common/header-title.png',scroll:'ui-common/scroll-paper.png',hall:'shop-v2/pickup-hall-v3.png',guan:'../art-source/characters/v1/1/front.png',lu:'../art-source/characters/v1/119/front.png',cao:'../art-source/characters/v1/32/front.png',xu:'../art-source/characters/v1/xuchu/front.png',zhuge:'../art-source/characters/v1/35/front.png',diao:'../art-source/characters/v1/diaochan/front.png',board:'battle-v2/scene.png'};
const art={};await Promise.all(Object.entries(assets).map(async([key,file])=>{const im=new Image();im.src=file.startsWith('../')?file:'assets/'+file;await im.decode();art[key]=im}));
art.cutin=new Image();art.cutin.src='previews/motion-v1/assets/guan-skill-cutin-v2.png';await art.cutin.decode();
async function frame(key,tone,w,h,center=true){const im=new Image();im.src=await renderNineSlice(tone,w*2,h*2,{corner:20,center,stablePixels:true});await im.decode();art[key]=im;}
await Promise.all([frame('card','green',206,346),frame('cardEdge','green',206,346,false),frame('band','green',370,154),frame('info','blue',370,62),frame('seal','green',94,94)]);
await document.fonts.ready;
for(const root of document.querySelectorAll('.game')){initArtPress(root);await Promise.all([...root.querySelectorAll('button')].map((b,i)=>nineSlice(b,i?'blue':'green',{corner:28})));}
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>1-(1-clamp(x))**3;
const canvases=Object.fromEntries(['recruit','skill'].map(id=>[id,document.getElementById(id)]));
function image(c,im,x,y,w,h){c.drawImage(im,Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function text(c,s,x,y,size=16,color='#fff0cd',align='center'){c.font=`bold ${size}px Georgia, Batang, serif`;c.textAlign=align;c.textBaseline='middle';c.fillStyle='#0b1728';c.fillText(s,x,y+1);c.fillStyle=color;c.fillText(s,x,y);}
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function begin(id){const c=canvases[id].getContext('2d');c.setTransform(2,0,0,2,0,0);c.globalAlpha=1;c.imageSmoothingEnabled=false;rect(c,0,0,390,580,'#14263c');return c;}
function shell(c,title,subtitle){image(c,art.header,0,0,390,62);image(c,art.title,120,10,150,40);text(c,title,195,30,20);image(c,art.scroll,10,67,370,36);text(c,subtitle,195,85,16,'#273b46');}
function sprite(c,key,cx,feet,h,alpha=1){const im=art[key],w=h*im.naturalWidth/im.naturalHeight;c.save();c.globalAlpha*=alpha;image(c,im,cx-w/2,feet-h,w,h);c.restore();}
function diamond(c,x,y,size,color){c.fillStyle=color;c.beginPath();c.moveTo(x,y-size);c.lineTo(x+size,y);c.lineTo(x,y+size);c.lineTo(x-size,y);c.fill();}
function recruit(t){const c=begin('recruit');image(c,art.hall,0,107,390,473);rect(c,0,107,390,473,'#0714269c');shell(c,'장수 등용','장수 1회 모집');
 const enter=ease(t/340),turn=clamp((t-650)/420),front=turn>=.5,scaleX=Math.max(.025,Math.abs(Math.cos(turn*Math.PI))),cy=303+(1-enter)*24;
 // Only the card animates; no surrounding lines, particles, flash or shake.
 c.save();c.globalAlpha=enter;c.translate(195,cy);c.scale(scaleX,1);image(c,art.card,-103,-173,206,346);
 if(!front){image(c,art.seal,-47,-47,94,94);diamond(c,0,0,33,'#c9a558');diamond(c,0,0,29,'#173d38');text(c,'등용',0,1,24,'#f7d38c');rect(c,-1,-137,2,65,'#ad8a48');rect(c,-1,73,2,65,'#ad8a48');text(c,'삼토체스',0,149,12,'#c9b581');}
 else{c.save();c.beginPath();c.rect(-95,-165,190,330);c.clip();image(c,art.hall,-322,-165,650,330);rect(c,-95,-165,190,330,'#09283190');c.restore();text(c,'S',-76,-147,23,'#ffdc84');text(c,'촉',76,-148,13,'#c7ddd1');sprite(c,'guan',0,112,250);rect(c,-84,122,168,1,'#bd9c58');text(c,'관우',0,143,24,'#ffe5ac');image(c,art.cardEdge,-103,-173,206,346);}
 c.restore();
 const label=clamp((t-1180)/300);c.save();c.globalAlpha=label;image(c,art.info,10,502,370,62);text(c,'관우 합류',195,524,20,'#ffe0a0');text(c,'S등급 · 청룡참',195,546,13,'#bbd8cf');c.restore();
}
// Canvas drawImage overload for source cropping, kept explicit to avoid slicing any character sprite.
function skill(t){const c=begin('skill');c.drawImage(art.board,85,315,770,760,10,114,370,365);
 sprite(c,'lu',285,245,88);sprite(c,'cao',195,205,62);sprite(c,'xu',104,245,75);sprite(c,'guan',150,398,94);sprite(c,'zhuge',240,428,66);sprite(c,'diao',100,453,66);shell(c,'전투','황건의 난 · 3 / 5 라운드');
 // 250ms lead-in, then 900ms cue: 150 enter / 530 hold / 220 exit.
 const p=t-250,entry=ease(p/150),exit=ease((p-680)/220),visible=entry*(1-exit);if(visible<=0)return;
 c.save();c.globalAlpha=visible*.60;rect(c,10,108,370,382,'#081322');c.restore();
 // One generated transparent illustration conveys the wind-up. No title, panel or cropped idle portrait.
 const x=Math.round((1-entry)*-8+exit*8),w=350,h=w*art.cutin.naturalHeight/art.cutin.naturalWidth;
 c.save();c.globalAlpha=visible;image(c,art.cutin,20+x,300-h/2,w,h);
 c.restore();
}
const draw={recruit,skill},ends={recruit:2200,skill:1500},still={recruit:1800,skill:650},active=new Map();let raf=0;
function tick(now){raf=0;for(const [id,start]of active){const t=Math.min(now-start,ends[id]);draw[id](t);if(t>=ends[id])active.delete(id)}if(active.size)raf=requestAnimationFrame(tick);}
function play(id){active.set(id,performance.now());if(!raf)raf=requestAnimationFrame(tick);}
function seek(id,t){active.delete(id);draw[id](t);}
document.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>play(b.dataset.play));document.querySelectorAll('[data-still]').forEach(b=>b.onclick=()=>seek(b.dataset.still,still[b.dataset.still]));
document.addEventListener('visibilitychange',()=>{if(document.hidden){for(const id of active.keys())draw[id](still[id]);active.clear();cancelAnimationFrame(raf);raf=0}});
window.motionPreview={seek,play,ends,still};
if(matchMedia('(prefers-reduced-motion: reduce)').matches){seek('recruit',still.recruit);seek('skill',still.skill)}else{play('recruit');play('skill')}
document.body.dataset.ready='true';
