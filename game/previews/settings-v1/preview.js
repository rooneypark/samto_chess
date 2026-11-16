import {settingsTemplate} from '../../settings-template.js';
import {artworkScreenTemplate} from '../../artwork-screen-template.js';
import {artworkShell} from '../../ui-shell.js';
import {paintArtworkLayout} from '../../art-layout.js';
import {placeArtwork} from '../../art-controls.js';
import {nineSlice} from '../../nine-slice.js';
const root=document.querySelector('.game'),$=s=>root.querySelector(s);
root.innerHTML=settingsTemplate;
const options=[['motion','움직임 줄이기','전환과 이동 애니메이션 간소화',false],['large','큰 글씨','지원 화면의 글자를 크게 표시',false],['fx','전법 이펙트 줄이기','전투 효과를 간결하게 표시',false],['art','새 디자인','현재 승인된 배경·아이콘·초상 사용',true]];
let volume=50;
for(const [i,[id,title,description,initial]]of options.entries()){const y=350+i*102,label=document.createElement('p'),help=document.createElement('p');label.className='setting-name';label.textContent=title;placeArtwork(label,[50,y,500,38]);help.className='setting-help';help.textContent=description;placeArtwork(help,[50,y+42,500,28]);$('.settings-list').append(label,help);for(const [j,value]of [true,false].entries()){const b=document.createElement('button');b.className='choice';b.dataset.setting=id;b.dataset.value=value;b.textContent=value?'켬':'끔';b.setAttribute('aria-label',title+' '+b.textContent);placeArtwork(b,[605+j*151,y+5,135,64]);$('.settings-list').append(b);b.onclick=()=>{options[i][3]=value;render()};}}
for(const [i,n]of [0,25,50,75,100].entries()){const b=document.createElement('button');b.className='volume';b.dataset.volume=n;b.textContent=n+'%';placeArtwork(b,[50+i*172,894,153,64]);$('.volume-list').append(b);b.onclick=()=>{volume=n;render()};}
await paintArtworkLayout(root,{stablePixels:true});artworkShell(root,{screen:'home',title:'설정',progress:{gold:12450,diamonds:320}});
async function render(){root.inert=true;root.setAttribute('aria-busy','true');const jobs=[];for(const b of root.querySelectorAll('.choice,.volume')){const selected=b.classList.contains('volume')?+b.dataset.volume===volume:options.find(o=>o[0]===b.dataset.setting)[3]=== (b.dataset.value==='true');b.setAttribute('aria-pressed',String(selected));jobs.push(nineSlice(b,selected?'green':'blue',{stablePixels:true}));}$('.volume-value').textContent=volume?volume+'%':'음소거';await Promise.all([...jobs,document.fonts.ready]);root.inert=false;root.setAttribute('aria-busy','false');}
const notify=()=>{let n=document.querySelector('.preview-status');if(!n){n=document.createElement('div');n.className='preview-status';document.body.append(n);}n.textContent='검토용 시안입니다. 실제 설정·저장 파일은 변경하지 않습니다.';clearTimeout(notify.timer);notify.timer=setTimeout(()=>n.remove(),2400)};
root.querySelectorAll('[data-operation],.home-back,#barracks-back,.bottom-nav button,.wallet button').forEach(b=>b.onclick=notify);await render();
