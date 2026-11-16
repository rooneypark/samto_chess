import {artworkShell} from '../../ui-shell.js';
import {placeArtwork,uiComponentsReady} from '../../art-controls.js';
import {paintArtworkLayout} from '../../art-layout.js';
import {generalArtwork} from '../../general-art.js';
import {nineSlice,disposeNineSlices} from '../../nine-slice.js';
import {heroes} from '../../heroes.js';
import {enemyImage} from '../../battle-data.js';
import {recordExample} from './fixture.js';

const game=document.querySelector('.game'),$=s=>game.querySelector(s),battle=recordExample();
let side=0,metric='damage',selected=null,revision=0;
const labels={damage:'피해량',healing:'치유량',casts:'전법 횟수'},format=n=>Math.floor(n).toLocaleString('ko-KR');
artworkShell(game,{screen:'home',title:'전투 기록',progress:{gold:12450,diamonds:320}});
await Promise.all([uiComponentsReady,paintArtworkLayout(game)]);

async function render(){
 const token=++revision;game.inert=true;game.setAttribute('aria-busy','true');
 const rows=$('.record-rows');disposeNineSlices(rows);rows.replaceChildren();
 const units=battle.units.filter(u=>u.side===side).sort((a,b)=>b[metric]-a[metric]||a.id-b.id),total=units.reduce((n,u)=>n+Math.floor(u[metric]),0);
 if(!units.some(u=>u.id===selected))selected=units[0].id;
 $('.summary-copy').textContent='전투 시간 '+(battle.tick/20).toFixed(1)+'초 · '+(side?'적군':'아군')+' '+labels[metric]+' '+format(total)+(metric==='casts'?'회':'');
 $('.metric-heading').textContent=labels[metric]+' · '+(total?'기여 비중':'기록 없음');
 const painting=[];
 game.querySelectorAll('[data-side]').forEach(b=>{const active=Number(b.dataset.side)===side;b.setAttribute('aria-pressed',String(active));painting.push(nineSlice(b,active?'green':'blue'));});
 game.querySelectorAll('[data-metric]').forEach(b=>{const active=b.dataset.metric===metric;b.setAttribute('aria-pressed',String(active));painting.push(nineSlice(b,active?'green':'blue'));});
 const images=units.map(async(u,i)=>{
  const b=document.createElement('button');b.className='unit-record';b.dataset.unit=u.id;b.setAttribute('aria-pressed',String(u.id===selected));b.setAttribute('aria-label',u.name+' · '+labels[metric]+' '+format(u[metric]));
  placeArtwork(b,[40,675+i*102,861,98]);
  b.innerHTML='<span class="row-art"></span><span class="row-number"></span><strong class="row-name"></strong><small class="row-affiliation"></small><strong class="row-value"></strong><span class="row-share"></span><span class="record-bar"><i></i></span>';
  b.querySelector('.row-number').textContent=i+1;b.querySelector('.row-name').textContent=u.name;b.querySelector('.row-name').classList.toggle('long-name',u.name.length>4);
  const hero=heroes.find(h=>h.id===u.hero);b.querySelector('.row-affiliation').textContent=hero?(hero.faction+' · '+hero.role):'황건군';
  b.querySelector('.row-value').textContent=format(u[metric])+(metric==='casts'?'회':'');b.querySelector('.row-share').textContent=(total?Math.floor(u[metric])/total*100:0).toFixed(1)+'%';
  b.querySelector('.record-bar i').style.width=(total?Math.floor(u[metric])/total*100:0)+'%';
  b.onclick=()=>{selected=u.id;render();};rows.append(b);painting.push(nineSlice(b,u.id===selected?'green':'blue'));
  // The helper uses global artwork coordinates; normalize into this row's box.
  let img=await generalArtwork(u.hero,{center:106,height:86,feet:90,maxWidth:90});
  if(img){img.style.left=parseFloat(img.style.left)*941/861+'%';img.style.width=parseFloat(img.style.width)*941/861+'%';img.style.top=parseFloat(img.style.top)*1672/98+'%';img.style.height=parseFloat(img.style.height)*1672/98+'%';}
  else{img=new Image();img.className='general-original';img.alt=u.name;img.src=enemyImage(u.hero);Object.assign(img.style,{left:'7%',top:'15%',width:'11%',height:'72%',objectFit:'contain'});await img.decode();}
  if(token===revision)b.querySelector('.row-art').append(img);
 });
 const chosen=units.find(u=>u.id===selected);$('.selection-detail').textContent=chosen.name+' · 피해 '+format(chosen.damage)+' · 치유 '+format(chosen.healing)+' · 전법 '+chosen.casts+'회';
 await Promise.all([...painting,...images,document.fonts.ready]);if(token===revision){game.inert=false;game.setAttribute('aria-busy','false');}
}
game.querySelectorAll('[data-side]').forEach(b=>b.onclick=()=>{side=Number(b.dataset.side);selected=null;render();});
game.querySelectorAll('[data-metric]').forEach(b=>b.onclick=()=>{metric=b.dataset.metric;selected=null;render();});
const toast=document.querySelector('.preview-status');let timer;
function note(){clearTimeout(timer);toast.textContent='전투 기록 디자인 시안입니다. 실제 저장은 변경하지 않습니다.';toast.hidden=false;timer=setTimeout(()=>toast.hidden=true,2600);}
game.querySelectorAll('.bottom-nav button,.wallet button,.home-back').forEach(b=>b.onclick=note);
$('#barracks-back').onclick=$('.result-back').onclick=()=>location.href='previews/results-v1/index.html';
await render();
