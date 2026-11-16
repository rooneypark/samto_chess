import {createArtworkScreen} from './artwork-screen.js';
import {exchangeTemplate} from './exchange-template.js';
import {artworkShell} from './ui-shell.js';
import {paintArtworkLayout} from './art-layout.js';
import {placeArtwork} from './art-controls.js';
import {nineSlice} from './nine-slice.js';
import {products,currencyNames,remaining,productLimit} from './economy.js';
export function initExchangeScreen({host,store,navigate,onWallet,onBuy,toast}){
const root=createArtworkScreen({host,sharedShell:true,className:'exchange-runtime',label:'상품 교환',template:exchangeTemplate,navigate,onWallet}),$=s=>root.querySelector(s);let revision=0;
let selected='gold';const icons=['33.333% 100%','33.333% 0','100% 100%'];
$('#barracks-back').id='shop-back';
const ready=paintArtworkLayout(root,{stablePixels:true});
for(const [i,p]of products.entries()){const b=document.createElement('button');b.className='product-card';b.dataset.product=p.id;b.innerHTML=`<i class="symbol" style="background-position:${icons[i]}"></i><strong>${p.id==='gold'?'골드 300':p.id==='hero'?'A 장수 선택상자':'A 보물 선택상자'}</strong><small>${p.period==='day'?'일일':'주간'} ${p.limit}회</small>`;placeArtwork(b,[50+i*286,554,269,172]);$('.products').append(b);b.onclick=()=>{selected=p.id;draw()};}
async function render(){const token=++revision;await ready;if(root.hidden||token!==revision)return;const balances=store.get();artworkShell(root,{screen:'shop',title:'상품 교환',progress:balances,controlsRoot:root});for(const b of root.querySelectorAll('[data-product]')){const p=products.find(p=>p.id===b.dataset.product);b.querySelector('small').textContent=(p.period==='day'?'일일':'주간')+' '+productLimit(balances,p)+'회';}root.inert=true;root.setAttribute('aria-busy','true');const p=products.find(p=>p.id===selected),left=Math.max(0,remaining(balances,p)),short=balances[p.currency]<p.price;$('.balance').textContent=`무료 다이아 ${balances.freeDiamonds} · 장수 재료 ${balances.heroTokens} · 보물 재료 ${balances.treasureTokens}`;$('.detail-name').textContent=p.name;$('.effect').textContent=p.id==='gold'?'획득 · 골드 300':'획득 · A등급 '+(p.id==='hero'?'장수':'보물')+' 1개 선택';$('.cost').textContent=`필요 · ${currencyNames[p.currency]} ${p.price} / 보유 ${balances[p.currency]}`;$('.unlock').textContent=`${p.period==='day'?'오늘':'이번 주'} 남은 교환 ${left} / ${productLimit(balances,p)}회`;$('.description').textContent=p.id==='gold'?'무료 다이아만 사용합니다.':'장터 시설 레벨에 따라 주간 교환 한도가 늘어납니다.';$('.apply').disabled=!left||short;$('.apply').textContent=!left?'교환 한도 완료':short?'교환 재료 부족':p.id==='gold'?'100 무료 다이아 · 교환':'받을 '+(p.id==='hero'?'장수':'보물')+' 선택';await Promise.all([...root.querySelectorAll('[data-product]')].map(b=>{b.setAttribute('aria-pressed',String(b.dataset.product===selected));return nineSlice(b,b.dataset.product===selected?'green':'blue',{stablePixels:true})}));await document.fonts.ready;if(token===revision&&!root.hidden){root.inert=false;root.setAttribute('aria-busy','false');}}
const draw=()=>render().catch(e=>{root.inert=false;root.setAttribute('aria-busy','false');toast('상품을 표시하지 못했습니다. '+e.message)});
$('.apply').onclick=()=>{if(!$('.apply').disabled)onBuy(selected)};
root.querySelectorAll('.home-back,#shop-back').forEach(b=>b.onclick=()=>navigate('shop'));
root.addEventListener('keydown',e=>{if(e.key==='Escape'&&!root.inert&&!document.querySelector('dialog[open]')){e.stopImmediatePropagation();navigate('shop')}},true);
store.subscribe(()=>{if(!root.hidden)draw()});window.addEventListener('focus',()=>{if(!root.hidden)draw()});setInterval(()=>{if(!root.hidden&&!document.querySelector('dialog[open]'))draw()},30000);
return {show(visible){revision++;root.hidden=!visible;host.classList.toggle('exchange-art',visible);if(visible){selected='gold';draw();}}};
}
