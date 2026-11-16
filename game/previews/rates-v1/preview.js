import {ratesTemplate} from '../../rates-template.js';
import {artworkShell} from '../../ui-shell.js';
import {paintArtworkLayout} from '../../art-layout.js';
import {placeArtwork} from '../../art-controls.js';
import {nineSlice} from '../../nine-slice.js';
import {rates,poolEntries} from '../../economy.js';
const root=document.querySelector('.game'),$=s=>root.querySelector(s);
root.innerHTML=ratesTemplate;
$('#barracks-back').id='shop-back';await paintArtworkLayout(root,{stablePixels:true});artworkShell(root,{screen:'shop',title:'모집 확률',progress:{gold:12450,diamonds:320},controlsRoot:root});let pool='hero',grade='S';
for(const [i,g]of ['S','A','B','C'].entries()){const b=document.createElement('button');b.className='rate-card';b.dataset.grade=g;b.innerHTML=`<strong>${g} · ${rates[g]*100}%</strong><small>등급 상세</small>`;placeArtwork(b,[50+i*214,442,199,120]);$('.grades').append(b);b.onclick=()=>{grade=g;render()};}
async function render(){root.inert=true;root.setAttribute('aria-busy','true');const entries=poolEntries(pool).filter(e=>e.grade===grade);$('.detail-title').textContent=grade+'등급 · '+(pool==='hero'?'장수':'보물')+' '+entries.length+'종';$('.chance').textContent='각 '+(rates[grade]*100/entries.length).toFixed(4)+'% · 등급 내 균등';$('.names').textContent=entries.map(e=>e.name).join(' · ');$('.rules').textContent='A 이상 29회 미획득: 다음 A 80% / S 20%\nS 99회 미획득: 다음 S 확정 · S 보장 우선\nA/S 획득 시 A 횟수 초기화 · S 획득 시 S 초기화\n'+(pool==='hero'?'장수 10회 모집: B 이상 1명 보장':'보물 10회 모집: B 이상 1개 보장')+'\n표시 확률은 보장 적용 전 기본 확률입니다.';await Promise.all([...root.querySelectorAll('[data-grade],[data-pool]')].map(b=>{const selected=b.dataset.grade?b.dataset.grade===grade:b.dataset.pool===pool;b.setAttribute('aria-pressed',String(selected));return nineSlice(b,selected?'green':'blue',{stablePixels:true})}));await document.fonts.ready;root.inert=false;root.setAttribute('aria-busy','false');}
root.querySelectorAll('[data-pool]').forEach(b=>b.onclick=()=>{pool=b.dataset.pool;render()});const notify=()=>{let e=document.querySelector('.preview-status');if(!e){e=document.createElement('div');e.className='preview-status';document.body.append(e)}e.textContent='검토용 시안입니다. 실제 저장과 모집은 변경하지 않습니다.';setTimeout(()=>e.remove(),2200)};root.querySelectorAll('.home-back,#shop-back,.bottom-nav button,.wallet button').forEach(b=>b.onclick=notify);await render();
