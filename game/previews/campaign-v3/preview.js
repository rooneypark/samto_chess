import {nineSlice} from '../../nine-slice.js';
import {initArtPress} from '../../art-controls.js';
const game=document.querySelector('.game');initArtPress(game);
const articles=[...game.querySelectorAll('article')];
async function select(article){await Promise.all(articles.map(a=>{const selected=a===article;a.setAttribute('aria-current',String(selected));a.querySelector('button').setAttribute('aria-pressed',String(selected));return nineSlice(a.querySelector('button'),selected?'green':'blue');}));}
const ready=articles.map(async article=>{
 const image=new Image();image.src='assets/campaign-v4/'+article.dataset.asset+'.png';await image.decode();
 const temp=document.createElement('canvas');temp.width=image.width;temp.height=image.height;const t=temp.getContext('2d');t.drawImage(image,0,0);const p=t.getImageData(0,0,temp.width,temp.height);let left=temp.width,top=temp.height,right=0,bottom=0;
 for(let y=0;y<temp.height;y++)for(let x=0;x<temp.width;x++){const i=(y*temp.width+x)*4+3;if(p.data[i]<=1)p.data[i]=0;if(p.data[i]){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}}
 t.putImageData(p,0,0);const w=right-left+1,h=bottom-top+1,scale=Math.min(104/w,84/h),dw=Math.round(w*scale),dh=Math.round(h*scale),canvas=article.querySelector('canvas'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(temp,left,top,w,h,Math.round((120-dw)/2),90-dh,dw,dh);
 article.querySelector('button').addEventListener('click',()=>select(article));
});
await Promise.all([...ready,nineSlice(game.querySelector('.panel-frame'),'blue',{button:false,center:false}),document.fonts.ready]);await select(articles[0]);const map=new Image();map.src='assets/campaign-v4/map.png';await map.decode();game.inert=false;game.setAttribute('aria-busy','false');
