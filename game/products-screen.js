import {productsTemplate} from './products-template.js';
import {createArtworkScreen} from './artwork-screen.js';
import {artworkShell} from './ui-shell.js';
import {paintArtworkLayout} from './art-layout.js';
import {placeArtwork} from './art-controls.js';
import {nineSlice} from './nine-slice.js';
import {products,firstGift,monthly,fund,iapStatus,iapCommand} from './iap.js';

export function initProductsScreen({host,store,navigate,onWallet,open,toast}){
const root=createArtworkScreen({host,sharedShell:true,className:'products-runtime',label:'상품 · 보급',template:productsTemplate,navigate,onWallet});
const find=selector=>root.querySelector(selector);
find('#barracks-back').id='shop-back';
const ready=paintArtworkLayout(root,{stablePixels:true});
let revision=0,busy=false,claim=null;
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
 button.onclick=()=>{selected=product;draw();};
 return button;
});
function benefits(product){
 if(product===firstGift)return `유료 다이아 ${product.diamonds} · 골드 ${product.grant.gold.toLocaleString('ko-KR')}\n장수 교환재료 ${product.grant.heroTokens}개 · 계정당 1회`;
 if(product===monthly)return `즉시 유료 다이아 ${product.diamonds}\n${product.days}일간 매일 무료 다이아 ${product.daily} 수령`;
 if(product===fund)return Object.entries(product.levels).map(([level,amount])=>'Lv.'+level+'  '+amount.toLocaleString('ko-KR')).reduce((lines,item,index)=>lines+(index===3?'\n':index?' · ':'')+item,'')+'\n군주 레벨 달성 시 무료 다이아 수령';
 return `유료 다이아 ${product.diamonds.toLocaleString('ko-KR')}\n해당 상품 첫 구매 시 ${(product.diamonds*2).toLocaleString('ko-KR')} 지급`;
}
async function render(){
 const token=++revision;
 await ready;
 if(root.hidden||busy||token!==revision)return;
 const state=store.get(),status=iapStatus(state);
 artworkShell(root,{screen:'shop',title:'상품 · 보급',progress:state,controlsRoot:root});
 root.inert=true;
 root.setAttribute('aria-busy','true');
 find('.product-heading').textContent=cardNames[selected.id]??'다이아 · '+selected.name;
 find('.chance').textContent=money(selected.price);
 find('.product-copy').textContent=benefits(selected);
 const action=find('.apply');
 claim=null;
 action.disabled=false;
 action.textContent=money(selected.price)+' · 시험 결제';
 const copy=find('.product-copy');
 if(selected===firstGift&&status.firstBought){action.disabled=true;action.textContent='첫 결제 선물 지급 완료';}
 if(selected===monthly&&status.monthlyActive){
  find('.chance').textContent='보급 기간 · '+status.monthlyDays+'일 남음';
  claim=status.monthlyClaimable?'monthly-claim':null;
  action.textContent=claim?'오늘 보급 받기 · 무료 다이아 '+monthly.daily:money(monthly.price)+' · 보급 연장';
  copy.textContent+='\n'+(claim?'오늘 수령 가능':'오늘 보급 수령 완료');
 }
 if(selected===fund&&status.fundBought){
  claim=status.fundClaimable.length?'fund-claim':null;
  const total=status.fundClaimable.reduce((sum,level)=>sum+fund.levels[level],0);
  action.disabled=!claim;
  action.textContent=claim?'기금 보상 받기 · '+total.toLocaleString('ko-KR'):'수령 가능한 보상 없음';
  find('.chance').textContent='구매 완료 · '+(claim?'Lv. '+status.fundClaimable.join(' · ')+' 수령 가능':'레벨별 보상');
  copy.textContent=Object.entries(fund.levels).map(([level,amount])=>'Lv.'+level+' '+amount+' · '+(status.fund.claimed[level]?'수령 완료':status.fundClaimable.includes(Number(level))?'수령 가능':'미달성')).join('\n');
 }
 if(status.doubled[selected.id])copy.textContent='유료 다이아 '+selected.diamonds.toLocaleString('ko-KR')+'\n첫 구매 2배 사용 완료';
 for(const button of buttons){
  const id=button.dataset.product;
  const label=button.lastElementChild;
  if(id===firstGift.id&&status.firstBought)label.textContent='지급 완료';
  if(id===fund.id&&status.fundBought)label.textContent='구매 완료';
  if(status.doubled[id])label.textContent='첫 구매 2배 사용';
 }
 await Promise.all(buttons.map(button=>{
  const active=button.dataset.product===selected.id;
  button.setAttribute('aria-pressed',String(active));
  return nineSlice(button,active?'green':'blue',{stablePixels:true});
 }));
 await document.fonts.ready;
 if(token===revision&&!root.hidden){root.inert=false;root.setAttribute('aria-busy','false');}
}
function draw(){render().catch(error=>{root.inert=false;root.setAttribute('aria-busy','false');toast(error.message,'error');});}
async function commit(command,button){
 if(busy)return;
 busy=true;button.disabled=true;
 try{
  await store.transact(state=>iapCommand(state,command));
  if(command.type==='purchase')document.querySelector('#modal').close();
  toast(command.type==='purchase'?'시험 결제 지급 완료':'보상 수령 완료','success');
 }catch(error){toast(error.message,'error');button.disabled=false;}
 finally{busy=false;if(!root.hidden)draw();}
}
find('.apply').onclick=()=>{
 if(claim){commit({type:claim},find('.apply'));return;}
 const product=selected;
 const command={type:'purchase',product:product.id,id:crypto.randomUUID()};
 open('시험 결제',`<p>${cardNames[product.id]??'다이아 '+product.diamonds} · ${money(product.price)}</p><p>상품이 즉시 지급됩니다. 실제 청구는 없습니다.</p><div class="modal-actions"><button id="products-cancel" class="action secondary">취소</button><button id="products-confirm" class="action">시험 결제</button></div>`);
 const modal=document.querySelector('#modal');
 modal.querySelector('#products-cancel').onclick=()=>modal.close();
 modal.querySelector('#products-confirm').onclick=event=>commit(command,event.currentTarget);
};
const back=()=>navigate('shop');
find('.home-back').onclick=back;
find('#shop-back').onclick=back;
root.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&!document.querySelector('dialog[open]')){event.stopImmediatePropagation();back();}
},true);
store.subscribe(()=>{if(!root.hidden&&!busy)draw();});
window.addEventListener('focus',()=>{if(!root.hidden&&!busy)draw();});
return {show(visible){revision++;root.hidden=!visible;host.classList.toggle('products-art',visible);if(visible){selected=monthly;draw();}}};
}
