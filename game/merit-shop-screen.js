import {exchangeTemplate} from './exchange-template.js';
import {createArtworkScreen} from './artwork-screen.js';
import {periods} from './economy.js';
import {artworkShell} from './ui-shell.js';
import {paintArtworkLayout} from './art-layout.js';
import {placeArtwork} from './art-controls.js';
import {nineSlice} from './nine-slice.js';
import {meritShop,meritBought,arenaCommand} from './arena-state.js';
export function initMeritShop({host,store,navigate,onWallet,toast}){
const root=createArtworkScreen({host,sharedShell:true,className:'merit-shop-runtime',label:'군공 상점',template:exchangeTemplate,navigate,onWallet});
const $=selector=>root.querySelector(selector);
const products=meritShop(Date.now());
let selected='treasure',busy=false,revision=0,week,refreshTimer;
const icons=['33.333% 0','100% 100%','66.667% 50%'];
$('.scroll-heading').textContent='군공 교환';
root.querySelector('[data-box="50,286,841,44"]').textContent='보유 군공';
root.querySelector('[data-box="50,1234,841,44"]').textContent='주간 갱신';
root.querySelector('[data-box="50,1292,841,60"]').textContent='매주 월요일 05시 (한국 시간) · 교환 한도와 장수 카드 갱신';

const ready=paintArtworkLayout(root,{stablePixels:true});
for(const [i,p]of products.entries()){const b=document.createElement('button');b.className='product-card';b.dataset.product=p.id;b.innerHTML=`<i class="symbol" style="background-position:${icons[i]}"></i><strong>${p.name}</strong><small>${'주간'} ${p.limit}회</small>`;placeArtwork(b,[50+i*286,554,269,172]);$('.products').append(b);b.onclick=()=>{selected=p.id;draw()};}
async function render(){
 const token=++revision;
 await ready;
 if(root.hidden||busy||token!==revision)return;
 const state=store.get(),now=Date.now(),merit=state.merit??0;
 week=periods(now).week;
 const nextReset=(Number(week)*7+4)*86400000-4*3600000;
 clearTimeout(refreshTimer);
 refreshTimer=setTimeout(draw,Math.max(1,nextReset-now));
 artworkShell(root,{screen:'arena',title:'군공 상점',progress:state,controlsRoot:root});
 const current=meritShop(now);
 for(const product of current)$(`[data-product=${product.id}] strong`).textContent=product.name;
 root.inert=true;root.setAttribute('aria-busy','true');
 const item=current.find(product=>product.id===selected);
 const left=Math.max(0,item.limit-meritBought(state,item.id,now));
 $('.balance').textContent=merit+' 군공 · 군웅대전 보상으로 획득';
 $('.detail-name').textContent=item.name;
 $('.effect').textContent=item.hero?'A등급 장수 카드 1장':item.id==='hero'?'장수 교환재료 5개 지급':'보물 교환재료 5개 지급';
 $('.cost').textContent='비용 · 군공 '+item.price+' / 보유 '+merit;
 $('.unlock').textContent='이번 주 남은 교환 '+left+' / '+item.limit+'회';
 $('.description').textContent=item.hero?'미등용 장수는 합류하고, 보유 장수는 각성 카드를 받습니다.':'교환한 재료는 상점의 A등급 선택상자에 사용할 수 있습니다.';
 $('.apply').disabled=!left||merit<item.price;
 $('.apply').textContent=!left?'주간 한도 완료':merit<item.price?'군공 '+(item.price-merit)+' 부족':'군공 '+item.price+' · 교환';
 await Promise.all([...root.querySelectorAll('[data-product]')].map(b=>{b.setAttribute('aria-pressed',String(b.dataset.product===selected));return nineSlice(b,b.dataset.product===selected?'green':'blue',{stablePixels:true})}));await document.fonts.ready;if(token===revision&&!root.hidden){root.inert=false;root.setAttribute('aria-busy','false');}}

function draw(){render().catch(error=>{root.inert=false;root.setAttribute('aria-busy','false');toast(error.message,'error');});}
$('.apply').onclick=async()=>{
 if(busy||$('.apply').disabled)return;
 const item=selected,displayedWeek=week;
 busy=true;
 $('.apply').disabled=true;
 try{
  await store.transact(state=>{
   const now=Date.now();
   if(periods(now).week!==displayedWeek)throw Error('주간 상품이 갱신되었습니다. 새 상품을 확인해 주세요.');
   return arenaCommand(state,{type:'buy',item},now);
  });
  toast('교환 완료','success');
 }catch(error){toast(error.message,'error');}
 finally{busy=false;if(!root.hidden)draw();}
};
const back=()=>navigate('arena');
$('#barracks-back').onclick=back;
root.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&!document.querySelector('dialog[open]')){event.stopImmediatePropagation();back();}
},true);
store.subscribe(()=>{if(!root.hidden&&!busy)draw();});
window.addEventListener('focus',()=>{if(!root.hidden&&!busy)draw();});
return {show(visible){
 revision++;
 root.hidden=!visible;
 host.classList.toggle('merit-shop-art',visible);
 if(visible){selected='treasure';draw();}
 else clearTimeout(refreshTimer);
}};
}
