import {exchangeTemplate} from '../../exchange-template.js';
import {artworkScreenTemplate} from '../../artwork-screen-template.js';
import {artworkShell} from '../../ui-shell.js';
import {paintArtworkLayout} from '../../art-layout.js';
import {placeArtwork} from '../../art-controls.js';
import {nineSlice} from '../../nine-slice.js';
import {products,currencyNames} from '../../economy.js';
const root=document.querySelector('.game'),$=s=>root.querySelector(s);
root.innerHTML=exchangeTemplate;
let selected='gold';const balances={freeDiamonds:320,heroTokens:40,treasureTokens:10},used={gold:1,hero:0,treasure:0},icons=['33.333% 100%','33.333% 0','100% 100%'];
$('#barracks-back').id='shop-back';
await paintArtworkLayout(root,{stablePixels:true});artworkShell(root,{screen:'shop',title:'상품 교환',progress:{gold:12450,diamonds:320},controlsRoot:root});
for(const [i,p]of products.entries()){const b=document.createElement('button');b.className='product-card';b.dataset.product=p.id;b.innerHTML=`<i class="symbol" style="background-position:${icons[i]}"></i><strong>${p.id==='gold'?'골드 300':p.id==='hero'?'A 장수 선택상자':'A 보물 선택상자'}</strong><small>${p.period==='day'?'일일':'주간'} ${p.limit}회</small>`;placeArtwork(b,[50+i*286,554,269,172]);$('.products').append(b);b.onclick=()=>{selected=p.id;render()};}
async function render(){root.inert=true;root.setAttribute('aria-busy','true');const p=products.find(p=>p.id===selected),left=p.limit-used[p.id],short=balances[p.currency]<p.price;$('.balance').textContent=`무료 다이아 ${balances.freeDiamonds} · 장수 재료 ${balances.heroTokens} · 보물 재료 ${balances.treasureTokens}`;$('.detail-name').textContent=p.name;$('.effect').textContent=p.id==='gold'?'획득 · 골드 300':'획득 · A등급 '+(p.id==='hero'?'장수':'보물')+' 1개 선택';$('.cost').textContent=`필요 · ${currencyNames[p.currency]} ${p.price} / 보유 ${balances[p.currency]}`;$('.unlock').textContent=`${p.period==='day'?'오늘':'이번 주'} 남은 교환 ${left} / ${p.limit}회`;$('.description').textContent=p.id==='gold'?'무료 다이아만 사용합니다.':'장터 시설 레벨에 따라 주간 교환 한도가 늘어납니다.';$('.apply').disabled=!left||short;$('.apply').textContent=!left?'교환 한도 완료':short?'교환 재료 부족':p.id==='gold'?'100 무료 다이아 · 교환':'받을 '+(p.id==='hero'?'장수':'보물')+' 선택';await Promise.all([...root.querySelectorAll('[data-product]')].map(b=>{b.setAttribute('aria-pressed',String(b.dataset.product===selected));return nineSlice(b,b.dataset.product===selected?'green':'blue',{stablePixels:true})}));await document.fonts.ready;root.inert=false;root.setAttribute('aria-busy','false');}
const notify=()=>{let e=document.querySelector('.preview-status');if(!e){e=document.createElement('div');e.className='preview-status';document.body.append(e)}e.textContent='검토용 시안입니다. 실제 재화와 저장은 변경하지 않습니다.';setTimeout(()=>e.remove(),2200)};$('.apply').onclick=notify;root.querySelectorAll('.home-back,#shop-back,.bottom-nav button,.wallet button').forEach(b=>b.onclick=notify);await render();
