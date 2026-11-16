import {generalPortraitHolder} from '../../general-portrait-holder.js';
import {createArtworkResultCard,paintArtworkResultSelection} from '../../artwork-result-cards.js';
import {recruitResultsTemplate} from '../../recruit-results-template.js';
import {artworkScreenTemplate} from '../../artwork-screen-template.js';
import {artworkShell} from '../../ui-shell.js';
import {paintArtworkLayout} from '../../art-layout.js';
import {generalArtwork} from '../../general-art.js';
import {heroes} from '../../heroes.js';
import {specs} from '../../progression.js';
const root=document.querySelector('.game'),$=s=>root.querySelector(s);
root.innerHTML=recruitResultsTemplate;
$('#barracks-back').id='shop-back';await paintArtworkLayout(root,{stablePixels:true});artworkShell(root,{screen:'shop',title:'등용 결과',progress:{gold:9450,diamonds:320},controlsRoot:root});
const ids=['1','xuchu','32','35','diaochan','119','15','0','2','16'],statuses=['new','new','converted','new','new','new','duplicate','duplicate','duplicate','new'];let selected=0;
for(const [i,id]of ids.entries()){const h=heroes.find(h=>h.id===id);const portrait=generalPortraitHolder(h);const b=createArtworkResultCard({index:i,gradeLabel:specs[id].grade+' · '+h.faction,visual:portrait,name:h.name,status:statuses[i]==='new'?'신규 합류':statuses[i]==='duplicate'?'카드 +1':'재료 +'+4,statusClass:statuses[i]==='new'?'new':''});$('.results').append(b);b.onclick=()=>{selected=i;render()};}
async function render(){root.inert=true;root.setAttribute('aria-busy','true');const id=ids[selected],h=heroes.find(h=>h.id===id),spec=specs[id];$('.detail-title').textContent=h.name+' · '+h.faction+' · '+spec.grade;$('.result-status').textContent=statuses[selected]==='new'?'신규 합류 · 병영에서 편성할 수 있습니다.':statuses[selected]==='duplicate'?'보유 장수 · 각성 카드 1장 획득':'최대 각성 장수 · 장수 교환재료 4개 획득';$('.skill').textContent='전법 · '+spec.skill;$('.skill-text').textContent=spec.description;$('.full-art').replaceChildren(await generalArtwork(id,{center:190,height:370,feet:1255,maxWidth:270}));await paintArtworkResultSelection(root,selected);await document.fonts.ready;root.inert=false;root.setAttribute('aria-busy','false');}
const notify=()=>{let e=document.querySelector('.preview-status');if(!e){e=document.createElement('div');e.className='preview-status';document.body.append(e)}e.textContent='결과 예시 시안입니다. 실제 장수와 재화는 변경하지 않습니다.';setTimeout(()=>e.remove(),2200)};root.querySelectorAll('.save,.home-back,#shop-back,.bottom-nav button,.wallet button').forEach(b=>b.onclick=notify);await render();
