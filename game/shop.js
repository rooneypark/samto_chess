import {clearDecorativeLineup} from './decorative-lineup.js';
import {shopArtwork,renderShopArtwork} from './shop-ui.js';
import {disposeNineSlices} from './nine-slice.js';
import {generals} from './character-art.js';
import {dialogRow,dialogInset} from './dialog-content.js';
import {dialogArtworkCallout} from './dialog-art-content.js';
import {heroes} from './heroes.js';
import {specs} from './progression.js';
import {treasureDefs} from './treasures.js';
import {applyShopCommand,products,rates,poolEntries,remaining,productLimit,currencyNames} from './economy.js';
import {pickupOf,poolLocked,pickupRules,S_SELECT_COST} from './collection.js';
import {diamondPacks,firstGift,monthly,fund,iapStatus,iapCommand} from './iap.js';
export function initShop({store,open,toast,navigate}){
 const root=document.createElement('section');root.className='shop-screen';root.hidden=true;root.setAttribute('aria-label','상점');document.querySelector('.bottom-nav').before(root);
 let pool='hero',pickup=false,busy=false,currency='gold';
 const money=n=>n.toLocaleString();
 function resultView(){const pending=store.get().shop.pending;if(!pending)return;
 if(shopArtwork&&['hero','treasure'].includes(pending.pool)){queueMicrotask(()=>navigate('recruitResults'));return;}
 open(pending.results.length===10?'10회 모집 결과':'획득 결과',`<div class="recruit-results">${pending.results.map(r=>{const item=pending.pool==='hero'?heroes.find(h=>h.id===r.id):pending.pool==='treasure'?treasureDefs.find(t=>t.id===r.id):null;return `<div class="result-card grade-${r.grade??'C'}">${r.grade?`<b>${r.grade}</b>`:''}${item?.portrait?`<img src="${item.portrait}" alt="">`:`<i class="icon icon-${item?.icon??'gold'}"></i>`}<strong>${item?.name??'골드 '+r.amount}</strong><span>${r.status==='new'?'신규 획득':r.status==='duplicate'?'중복 카드 +1':r.status==='converted'?`장수 교환재료 +${r.amount}`:'구매 완료'}</span></div>`}).join('')}</div><div class="modal-actions"><button class="action secondary" id="result-barracks">병영으로</button><button class="action" id="result-confirm">확인</button></div>`);
 const acknowledge=async(go)=>{if(busy)return;busy=true;document.querySelectorAll('#result-confirm,#result-barracks').forEach(b=>b.disabled=true);try{await store.transact(s=>{s.shop.pending=null;return s;});document.querySelector('#modal').close();if(go)navigate('barracks',pending.pool==='hero'?pending.results[0].id:undefined);}catch(e){toast(e.message);document.querySelectorAll('#result-confirm,#result-barracks').forEach(b=>b.disabled=false);}finally{busy=false;}};
 document.querySelector('#result-confirm').onclick=()=>acknowledge(false);document.querySelector('#result-barracks').onclick=()=>acknowledge(true);
 }
 function confirm(command,title,description){
 if(store.get().shop.pending){resultView();return;}
 const id=crypto.randomUUID(),issuedAt=Date.now(),seed=crypto.getRandomValues(new Uint32Array(1))[0];
 open(title,`${description}<div class="modal-actions"><button class="action secondary" id="purchase-cancel">취소</button><button class="action" id="purchase-confirm">${command.type==='recruit'?'모집':command.product==='gold'?'구매':'교환'}</button></div>`);
 document.querySelector('#purchase-cancel').onclick=()=>document.querySelector('#modal').close();
 document.querySelector('#purchase-confirm').onclick=async()=>{if(busy)return;busy=true;const button=document.querySelector('#purchase-confirm');button.disabled=true;try{await store.transact(s=>applyShopCommand(s,{...command,id,seed,issuedAt,time:Date.now()}));resultView();}catch(e){toast(e.message);button.disabled=false;}finally{busy=false;}};
 }
 function recruit(currency,count){
 const cost=(currency==='gold'?300:100)*count;
 const title=(pool==='hero'?'장수':'보물')+' '+count+'회 모집';
 const summary=shopArtwork
  ? dialogArtworkCallout(pool,count+'회 모집')
  : '<div class="game-dialog-callout"><i class="icon icon-'+(pool==='hero'?'helmet':'chest')+'"></i><strong>'+count+'회 모집</strong></div>';
 confirm({type:'recruit',pool,currency,count,...(pickup?{banner:'pickup'}:{})},(pickup?'픽업 ':'')+title,summary+dialogRow('사용 재화',money(cost)+' '+currencyNames[currency])+dialogRow('획득 수량',count+'개')+dialogInset(dialogRow('보유',money(store.get()[currency]))+dialogRow('모집 후 잔액',money(store.get()[currency]-cost)))+(currency==='diamonds'?'<p class="muted">무료 다이아부터 사용합니다.</p>':''));
 }
 function buy(product){const p=products.find(x=>x.id===product);const description=dialogInset(p.name)+dialogRow('비용',currencyNames[p.currency]+' '+p.price)+dialogRow(p.period==='day'?'오늘 남은 횟수':'이번 주 남은 횟수',remaining(store.get(),p)+' / '+productLimit(store.get(),p));
 if(product==='gold'){confirm({type:'purchase',product},'상품 구매',description+'<p>골드 300을 받습니다.</p>');return;}
 open(p.name,`${description}<p>받을 항목을 선택해 주세요. 선택 후 비용을 확인합니다.</p><div class="selection-grid">${poolEntries(product).filter(e=>e.grade==='A').map(e=>`<button class="selection-card" data-choice="${e.id}">${e.portrait?`<img src="${e.portrait}" alt="">`:`<i class="icon icon-${e.icon}"></i>`}<span>${e.name}</span></button>`).join('')}</div>`);
 document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{const e=poolEntries(product).find(e=>e.id===b.dataset.choice);confirm({type:'purchase',product,choice:e.id},'선택상자 교환',description+`<p><strong>${e.name}</strong> 1개 획득${product==='hero'&&store.get().heroes[e.id].owned?' · 중복 카드는 각성 재료로 지급됩니다.':''}</p>`);});
 }
 // 상품: local test payment only. Nothing is charged; the dialog says so on every purchase.
 function iap(){const s=store.get(),st=iapStatus(s),won=n=>n.toLocaleString()+'원';
  const row=(id,name,detail,label,disabled)=>`<div class="service-row"><div><strong>${name}</strong><small>${detail}</small></div><button class="action" data-iap="${id}" ${disabled?'disabled':''}>${label}</button></div>`;
  open('상품',`<p class="muted">시험 결제입니다. 실제로 청구되지 않으며, 결제 연동 전까지 기록에 "시험"으로 남습니다.</p>`+dialogRow('유료 다이아',money(s.paidDiamonds))+dialogRow('시험 결제 누계',won(st.spent))+
   row('first',firstGift.name,`유료 다이아 ${firstGift.diamonds} + 장수 재료 ${firstGift.grant.heroTokens}(A 선택상자 1회분) + 골드 ${firstGift.grant.gold} · 계정당 1회`,st.firstBought?'구매 완료':won(firstGift.price),st.firstBought)+
   row('monthly',monthly.name,`즉시 유료 다이아 ${monthly.diamonds} + 매일 무료 다이아 ${monthly.daily}${st.monthlyActive?' · 남은 '+st.monthlyDays+'일':''}`,won(monthly.price),false)+
   (st.monthlyActive?`<button class="action secondary" id="iap-monthly" ${st.monthlyClaimable?'':'disabled'}>${st.monthlyClaimable?'오늘의 군량 보급 받기 · 무료 다이아 '+monthly.daily:'오늘 보급 수령 완료'}</button>`:'')+
   row('fund',fund.name,'군주 Lv.'+Object.entries(fund.levels).map(([l,n])=>l+' → '+n).join(' · ')+' 다이아',st.fundBought?'구매 완료':won(fund.price),st.fundBought)+
   (st.fundBought?`<button class="action secondary" id="iap-fund" ${st.fundClaimable.length?'':'disabled'}>${st.fundClaimable.length?'기금 보상 받기 · Lv.'+st.fundClaimable.join(', '):'받을 기금 보상 없음'}</button>`:'')+
   '<h3>다이아</h3>'+diamondPacks.map(p=>row(p.id,p.name+' · 유료 다이아 '+money(p.diamonds),st.doubled[p.id]?'첫 구매 2배 사용함':'첫 구매 2배 → '+money(p.diamonds*2),won(p.price),false)).join(''));
  const run=async(command,message)=>{try{await store.transact(st=>iapCommand(st,command));toast(message);iap();}catch(e){toast(e.message);}};
  document.querySelectorAll('[data-iap]').forEach(b=>b.onclick=()=>{const p=[firstGift,monthly,fund,...diamondPacks].find(p=>p.id===b.dataset.iap),id=crypto.randomUUID();
   open('시험 결제',dialogRow('상품',p.name)+dialogRow('금액',won(p.price))+'<p>실제 결제가 아닙니다. 확인을 누르면 상품이 바로 지급됩니다.</p><div class="modal-actions"><button class="action secondary" id="iap-cancel">취소</button><button class="action" id="iap-confirm">시험 결제</button></div>');
   document.querySelector('#iap-cancel').onclick=iap;document.querySelector('#iap-confirm').onclick=()=>run({type:'purchase',id,product:p.id},p.name+' 지급 완료 (시험 결제)');});
  document.querySelector('#iap-monthly')?.addEventListener('click',()=>run({type:'monthly-claim'},'군량 보급을 받았습니다.'));document.querySelector('#iap-fund')?.addEventListener('click',()=>run({type:'fund-claim'},'기금 보상을 받았습니다.'));}
 function selectS(){if(shopArtwork){navigate('sSelect');return;}const s=store.get(),list=poolEntries('hero').filter(e=>e.grade==='S'&&!poolLocked(s,e.id));open('S등급 장수 선택',`<p>S 선택 조각 ${S_SELECT_COST}개로 한 명을 고릅니다. 이미 보유한 장수는 각성 카드 1장으로 받습니다.</p><div class="selection-grid">${list.map(e=>`<button class="selection-card" data-choice="${e.id}"><img src="${e.portrait}" alt=""><span>${e.name}</span></button>`).join('')}</div>`);
 document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{const e=list.find(e=>e.id===b.dataset.choice);confirm({type:'s-select',choice:e.id},'S등급 장수 선택',dialogRow('사용','S 선택 조각 '+S_SELECT_COST)+`<p><strong>${e.name}</strong> ${store.get().heroes[e.id].owned?'카드 1장':'합류'}</p>`);});}
 function probabilities(){const state=store.get(),up=pickupOf(Date.now()),entries=poolEntries(pool).filter(e=>pool!=='hero'||!poolLocked(state,e.id)),p=state.shop.pity[pool];open('모집 확률 정보',`<p>골드·다이아 동일 확률 · ${pool==='hero'?'장수':'보물'} ${entries.length}종</p><p>기본 확률 (천장 제외)</p><div class="rate-list">${Object.entries(rates).map(([grade,rate])=>{const group=entries.filter(e=>e.grade===grade);return `<section><strong>${grade}등급 ${rate*100}%</strong><p>${group.map(e=>e.name).join(' · ')}</p><small>각 ${(rate*100/group.length).toFixed(4)}% · 등급 내 균등</small></section>`}).join('')}</div><p>A 이상 미획득 ${p.a}/30 · S 미획득 ${p.s}/100</p><p class="muted">30번째는 A 80% / S 20%, 100번째는 S 확정입니다. S 보장이 우선합니다. A/S 획득 시 A 카운터, S 획득 시 S 카운터가 초기화됩니다. 10회도 한 번씩 순서대로 처리하며 지급 수단을 바꿔도 천장은 유지됩니다. 장수와 보물의 천장은 별도입니다.</p>${pool==='hero'?'<p class="muted">위·촉·오·군웅의 모든 장수를 처음부터 모집할 수 있습니다. 일반 모집은 같은 등급 안에서 균등 확률이며, 국가별 우대가 없습니다. 10회 모집은 B 이상 1명이 확정입니다.</p>':''}${pickup?'<p class="muted">픽업 모집(다이아 전용): S가 나오면 '+pickupRules.chance*100+'% 확률로 '+heroes.find(h=>h.id===up.s).name+'. 아니었다면 다음 S는 반드시 픽업입니다'+(state.shop.pickup?.guaranteed?' (현재 확정 상태)':'')+'. A가 나오면 '+pickupRules.chance*100+'% 확률로 '+up.a.map(id=>heroes.find(h=>h.id===id).name).join(' 또는 ')+'. 천장 횟수는 일반 모집과 함께 셉니다.</p>':''}`);}
 function exchange(){if(shopArtwork){navigate('exchange');return;}const s=store.get();
 open('상품 교환',`<div class="shop-products">${products.map(p=>{const left=remaining(s,p),lacking=s[p.currency]<p.price;return `<article class="product-row"><i class="icon icon-${p.icon}"></i><div class="product-info"><h4>${p.name}</h4><span>${currencyNames[p.currency]} ${p.price}</span><small>보유 ${money(s[p.currency])}</small></div><div class="product-limit"><span>${p.period==='day'?'일일':'주간'} ${productLimit(s,p)}회</span><strong>${left} / ${productLimit(s,p)}</strong></div><button class="action" data-buy="${p.id}" ${left===0||lacking?'disabled':''}>${left===0?'완료':lacking?'재화 부족':p.id==='gold'?'구매':'교환'}</button></article>`;}).join('')}</div><p class="muted">매일 05:00 · 주간 월요일 05:00 갱신 (한국 시간)</p>`);
 document.querySelectorAll('#modal [data-buy]').forEach(b=>b.onclick=()=>buy(b.dataset.buy));
 }
 function render(){
  if(!shopArtwork){renderClassic();return;}
  renderShopArtwork(root,{state:store.get(),pool,pickup,currency,
   onPool:id=>{pickup=id==='pickup';pool=pickup?'hero':id;if(pickup)currency='diamonds';render();},
   onCurrency:key=>{if(pickup&&key!=='diamonds')return;currency=key;render();},
   onRecruit:recruit,onProbabilities:()=>pickup?navigate('pickupRates'):navigate('rates',pool),onExchange:exchange,
   onSelectS:selectS,
   onProducts:()=>navigate('products'),onBack:()=>navigate('home'),onPending:resultView
  }).catch(()=>toast('상점 이미지 로드 실패'));
 }
 function renderClassic(){const s=store.get(),pity=s.shop.pity[pool],up=pickupOf(Date.now()),shards=s.sShards??0;root.innerHTML=`<div class="shop-heading"><h2>상점</h2><button class="mini-teal" id="iap-open">상품</button><span>무료 다이아 ${money(s.freeDiamonds)} · 유료 ${money(s.paidDiamonds)}</span></div><div class="shop-pool-tabs" role="tablist" aria-label="모집 종류"><button role="tab" aria-selected="${pool==='hero'&&!pickup}" data-pool="hero">장수 모집</button><button role="tab" aria-selected="${pickup}" data-pool="pickup">픽업 모집</button><button role="tab" aria-selected="${pool==='treasure'}" data-pool="treasure">보물 모집</button></div><section class="recruit-panel pixel-panel"><div class="recruit-banner"><div class="recruit-art">${pool==='hero'?(pickup?[up.s,...up.a]:['1','15','2']).map(id=>`<img src="${heroes.find(h=>h.id===id).sprite}" alt="">`).join(''):'<i class="icon icon-chest"></i><i class="icon icon-scroll"></i>'}</div><div class="recruit-intro"><h3>${pickup?'픽업 모집':(pool==='hero'?'장수':'보물')+' 모집'}</h3><p>${pickup?'S '+heroes.find(h=>h.id===up.s).name+' · A '+up.a.map(id=>heroes.find(h=>h.id===id).name).join('·')+' · '+new Date(up.endsAt).toLocaleDateString('ko-KR')+'까지':'골드·다이아 동일 확률'}</p><button class="skin" id="probabilities">확률 정보</button></div></div><div class="pity-bar">A 이상 보장까지 <strong>${30-pity.a}회</strong> · S 보장까지 <strong>${100-pity.s}회</strong></div><div class="recruit-options">${(pickup?['diamonds']:['gold','diamonds']).map(currency=>`<section class="pixel-panel"><h4><i class="icon icon-${currency==='gold'?'gold':'gem'}"></i>${currencyNames[currency]} 모집</h4>${[1,10].map(count=>{const cost=(currency==='gold'?300:100)*count;return `<button class="primary recruit-button" data-currency="${currency}" data-count="${count}" ${s[currency]<cost?'disabled':''}>${count}회 · ${money(cost)} ${currencyNames[currency]}</button>`}).join('')}<small>${s[currency]<(currency==='gold'?300:100)?currencyNames[currency]+' 부족':'보유 '+money(s[currency])}</small></section>`).join('')}</div></section><h3 class="shop-products-title">상품 구매</h3><div class="shop-products pixel-panel">${products.map(p=>{const left=remaining(s,p),lacking=s[p.currency]<p.price;return `<article class="product-row"><i class="icon icon-${p.icon}"></i><div class="product-info"><h4>${p.name}</h4><span>${currencyNames[p.currency]} ${p.price}</span><small>보유 ${money(s[p.currency])}</small></div><div class="product-limit"><span>${p.period==='day'?'일일':'주간'} ${productLimit(s,p)}회</span><strong>${left} / ${productLimit(s,p)}</strong></div><button class="mini-teal" data-buy="${p.id}" ${left===0||lacking?'disabled':''}>${left===0?'완료':lacking?'재화 부족':p.id==='gold'?'구매':'교환'}</button></article>`}).join('')}<article class="product-row"><i class="icon icon-helmet"></i><div class="product-info"><h4>S등급 장수 선택</h4><span>S 선택 조각 ${S_SELECT_COST}</span><small>보유 ${shards}</small></div><div class="product-limit"><span>확정 획득</span><strong>${Math.min(shards,S_SELECT_COST)} / ${S_SELECT_COST}</strong></div><button class="mini-teal" id="s-select" ${shards<S_SELECT_COST?'disabled':''}>${shards<S_SELECT_COST?'조각 부족':'선택'}</button></article></div><p class="shop-reset">매일 05:00 · 주간 월요일 05:00 갱신 (한국 시간)</p>${s.shop.pending?'<button id="pending-result" class="mini-teal">미확인 획득 결과</button>':''}`;
 root.querySelectorAll('[data-pool]').forEach(b=>b.onclick=()=>{pickup=b.dataset.pool==='pickup';pool=pickup?'hero':b.dataset.pool;render();});root.querySelectorAll('[data-currency]').forEach(b=>b.onclick=()=>recruit(b.dataset.currency,Number(b.dataset.count)));root.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>buy(b.dataset.buy));root.querySelector('#probabilities').onclick=probabilities;root.querySelector('#s-select').onclick=selectS;root.querySelector('#iap-open').onclick=iap;root.querySelector('#pending-result')?.addEventListener('click',resultView);
 }
 store.subscribe(()=>{if(!root.hidden)render();});
 // Update period limits when the application regains focus, without a refresh.
 window.addEventListener('focus',()=>{if(!root.hidden)render();});
 return {exchange,buy,selectS,chooseS(id){const s=store.get(),e=poolEntries('hero').find(e=>e.id===id&&e.grade==='S');if(!e||poolLocked(s,id)){toast('고를 수 없는 장수입니다.');return;}const h=s.heroes[id];confirm({type:'s-select',choice:id},'S등급 장수 선택',dialogRow('사용','S 선택 조각 '+S_SELECT_COST)+'<p><strong>'+e.name+'</strong> '+(!h.owned?'신규 합류':h.star===5?'장수 교환재료 8개':'중복 카드 1장')+'</p>');},show(visible){if(!visible)clearDecorativeLineup(root);root.hidden=!visible;root.closest('.game').classList.toggle('shop-art',visible&&shopArtwork);if(visible){render();if(store.get().shop.pending)resultView();}else disposeNineSlices(root);}};
}
