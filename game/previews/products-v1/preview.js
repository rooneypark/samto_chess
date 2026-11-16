import {productsTemplate} from '../../products-template.js';
import {artworkShell} from '../../ui-shell.js';
import {paintArtworkLayout} from '../../art-layout.js';
import {placeArtwork} from '../../art-controls.js';
import {nineSlice} from '../../nine-slice.js';
import {products,firstGift,monthly,fund} from '../../iap.js';

const root=document.querySelector('.game');
const find=selector=>root.querySelector(selector);
root.innerHTML=productsTemplate;
find('#barracks-back').id='shop-back';
await paintArtworkLayout(root,{stablePixels:true});
artworkShell(root,{screen:'shop',title:'상품 · 보급',progress:{gold:12450,diamonds:320},controlsRoot:root});

let selected=monthly;
const money=value=>value.toLocaleString('ko-KR')+'원';
const cardNames={first:'첫 결제 선물',monthly:'군량 보급',fund:'군주 성장 기금'};
const buttons=products.map((product,index)=>{
 const supply=index<3;
 const slot=supply?index:index-3;
 const button=document.createElement('button');
 button.className='rate-card product-card';
 button.dataset.product=product.id;
 const name=supply?cardNames[product.id]:'다이아 '+product.diamonds.toLocaleString('ko-KR');
 button.innerHTML=`<strong>${name}</strong><small class="price">${money(product.price)}</small><small>${supply?['계정당 1회','30일 보급','레벨별 수령'][slot]:'첫 구매 2배'} </small>`;
 placeArtwork(button,[50+slot%3*286,supply?350:632+Math.floor(slot/3)*154,269,140]);
 find(supply?'.supplies':'.packs').append(button);
 button.onclick=()=>{selected=product;render();};
 return button;
});
function benefits(product){
 if(product===firstGift)return `유료 다이아 ${product.diamonds} · 골드 ${product.grant.gold.toLocaleString('ko-KR')}\n장수 교환재료 ${product.grant.heroTokens}개 · 계정당 1회`;
 if(product===monthly)return `즉시 유료 다이아 ${product.diamonds}\n${product.days}일간 매일 무료 다이아 ${product.daily} 수령`;
 if(product===fund)return Object.entries(product.levels).map(([level,amount])=>'Lv.'+level+'  '+amount.toLocaleString('ko-KR')).reduce((lines,item,index)=>lines+(index===3?'\n':index?' · ':'')+item,'')+'\n군주 레벨 달성 시 무료 다이아 수령';
 return `유료 다이아 ${product.diamonds.toLocaleString('ko-KR')}\n해당 상품 첫 구매 시 ${(product.diamonds*2).toLocaleString('ko-KR')} 지급`;
}
async function render(){
 root.inert=true;
 root.setAttribute('aria-busy','true');
 find('.product-heading').textContent=cardNames[selected.id]??'다이아 · '+selected.name;
 find('.chance').textContent=money(selected.price);
 find('.product-copy').textContent=benefits(selected);
 find('.apply').textContent=money(selected.price)+' · 시험 결제';
 await Promise.all(buttons.map(button=>{
  const active=button.dataset.product===selected.id;
  button.setAttribute('aria-pressed',String(active));
  return nineSlice(button,active?'green':'blue',{stablePixels:true});
 }));
 await document.fonts.ready;
 root.inert=false;
 root.setAttribute('aria-busy','false');
}
function notify(){
 let notice=document.querySelector('.preview-status');
 if(!notice){notice=document.createElement('div');notice.className='preview-status';document.body.append(notice);}
 notice.textContent='상품·보급 화면의 검토용 시안입니다.';
 clearTimeout(notify.timer);
 notify.timer=setTimeout(()=>notice.remove(),2200);
}
root.querySelectorAll('.apply,.home-back,#shop-back,.bottom-nav button,.wallet button').forEach(button=>button.onclick=notify);
await render();
