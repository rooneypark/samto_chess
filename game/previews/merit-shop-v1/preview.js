import {exchangeTemplate} from '../../exchange-template.js';
import {artworkScreenTemplate} from '../../artwork-screen-template.js';
import {artworkShell} from '../../ui-shell.js';
import {paintArtworkLayout} from '../../art-layout.js';
import {placeArtwork} from '../../art-controls.js';
import {nineSlice} from '../../nine-slice.js';
import {meritShop} from '../../arena-state.js';
const root=document.querySelector('.game'),$=s=>root.querySelector(s);
root.innerHTML=exchangeTemplate;
const products=meritShop(Date.now());
let selected='treasure';
const merit=75,used={card:0,treasure:1,hero:0};
const icons=['33.333% 0','100% 100%','66.667% 50%'];
$('.scroll-heading').textContent='군공으로 장수 카드와 재료를 교환';
$('.home-back').textContent='군웅대전으로';
root.querySelector('[data-box="50,286,841,44"]').textContent='보유 군공';
root.querySelector('[data-box="50,1234,841,44"]').textContent='주간 갱신';
root.querySelector('[data-box="50,1292,841,60"]').textContent='매주 월요일 05시 (한국 시간) · 교환 한도와 장수 카드 갱신';

await paintArtworkLayout(root,{stablePixels:true});artworkShell(root,{screen:'arena',title:'군공 상점',progress:{gold:12450,diamonds:320},controlsRoot:root});
for(const [i,p]of products.entries()){const b=document.createElement('button');b.className='product-card';b.dataset.product=p.id;b.innerHTML=`<i class="symbol" style="background-position:${icons[i]}"></i><strong>${p.name}</strong><small>${'주간'} ${p.limit}회</small>`;placeArtwork(b,[50+i*286,554,269,172]);$('.products').append(b);b.onclick=()=>{selected=p.id;render()};}
async function render(){
 root.inert=true;root.setAttribute('aria-busy','true');
 const item=products.find(product=>product.id===selected);
 const left=item.limit-used[item.id];
 $('.balance').textContent=merit+' 군공 · 군웅대전 보상으로 획득';
 $('.detail-name').textContent=item.name;
 $('.effect').textContent=item.hero?'A등급 장수 카드 1장':item.id==='hero'?'장수 교환재료 5개 지급':'보물 교환재료 5개 지급';
 $('.cost').textContent='비용 · 군공 '+item.price+' / 보유 '+merit;
 $('.unlock').textContent='이번 주 남은 교환 '+left+' / '+item.limit+'회';
 $('.description').textContent=item.hero?'미등용 장수는 합류하고, 보유 장수는 각성 카드를 받습니다.':'교환한 재료는 상점의 A등급 선택상자에 사용할 수 있습니다.';
 $('.apply').disabled=!left||merit<item.price;
 $('.apply').textContent=!left?'주간 한도 완료':merit<item.price?'군공 '+(item.price-merit)+' 부족':'군공 '+item.price+' · 교환';
 await Promise.all([...root.querySelectorAll('[data-product]')].map(b=>{b.setAttribute('aria-pressed',String(b.dataset.product===selected));return nineSlice(b,b.dataset.product===selected?'green':'blue',{stablePixels:true})}));await document.fonts.ready;root.inert=false;root.setAttribute('aria-busy','false');}
const notify=()=>{let e=document.querySelector('.preview-status');if(!e){e=document.createElement('div');e.className='preview-status';document.body.append(e)}e.textContent='검토용 시안입니다. 실제 재화와 저장은 변경하지 않습니다.';setTimeout(()=>e.remove(),2200)};$('.apply').onclick=notify;root.querySelectorAll('.home-back,#shop-back,.bottom-nav button,.wallet button').forEach(b=>b.onclick=notify);await render();
