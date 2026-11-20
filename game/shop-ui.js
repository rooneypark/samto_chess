import {artSet} from './art.js';
import {heroes} from './heroes.js';
import {generalArtwork} from './general-art.js';
import {decorativeLineup} from './decorative-lineup.js';
import {generals} from './character-art.js';
import {pickupOf,S_SELECT_COST} from './collection.js';
import {poolEntries} from './economy.js';
import {artworkShell} from './ui-shell.js';
import {placeArtwork,preloadArtwork} from './art-controls.js';
import {nineSlice,disposeNineSlices} from './nine-slice.js';
export const shopArtwork=artSet==='a';
export const shopReady=shopArtwork?preloadArtwork(['pickup-hall-v3','treasure-hall-v3','coin','gem'].map(id=>'assets/shop-v2/'+id+'.png').concat(['blue','green'].map(id=>'assets/ui-scalable/'+id+'.png'),Object.keys(generals).map(id=>generals[id].views.front.url))):Promise.resolve();
let revision=0;
export function renderShopArtwork(root,{state,pool,pickup,currency,onPool,onCurrency,onRecruit,onProbabilities,onExchange,onSelectS,onProducts,onBack,onPending}){
 disposeNineSlices(root);const token=++revision,pity=state.shop.pity[pool],up=pickupOf(Date.now()),isHero=pool==='hero',title=pickup?'픽업 등용':isHero?'장수 등용':'보물 모집';
 root.classList.add('shop-v2');root.inert=true;root.setAttribute('aria-busy','true');
 root.innerHTML=`<button id="shop-back" aria-label="성문으로 돌아가기"></button>
 <div class="scroll-heading" data-box="22,153,895,90">${title}</div>
 <nav class="pool-tabs" role="tablist" aria-label="모집 종류">${[['hero','장수 등용'],['pickup','픽업 등용'],['treasure','보물 모집']].map(([id,label],i)=>{const active=id===(pickup?'pickup':pool);return `<button role="tab" data-pool="${id}" aria-selected="${active}" data-tone="${active?'green':'blue'}" data-box="${32+i*298},264,281,74">${label}</button>`;}).join('')}</nav>
 <section class="recruit-stage" data-box="20,354,901,488"><div class="hall" data-recruit-art="${pickup?'pickup':isHero?'hero':'treasure'}"></div><div class="stage-frame"></div></section>
 ${isHero?`<div class="stage-caption recruit-intro" data-box="120,379,701,42">${pickup?'픽업 모집 · '+heroes.find(h=>h.id===up.s).name+' · '+new Date(up.endsAt).toLocaleDateString('ko-KR')+'까지':'기본 병종 5종 · 확정 명단 장수 20명'}</div>`:''}<div class="general-lineup"></div>
 <div class="pity-scroll" data-box="22,861,895,90"><span>A 이상 보장까지 <b>${30-pity.a}회</b></span><i></i><span>S 보장까지 <b>${100-pity.s}회</b></span></div>
 <p class="odds-note" data-box="41,967,600,40">${pickup?'픽업 모집 · 다이아 전용':'골드·다이아 동일 확률 · '+(isHero?'장수':'보물')+' '+poolEntries(pool).length+'종'}</p>
 <button id="probabilities" class="small" data-tone="blue" data-box="721,956,180,60">확률 정보</button>
 <div class="currencies" role="group" aria-label="모집 재화">${['gold','diamonds'].map((key,i)=>`<button data-select-currency="${key}" data-tone="${currency===key?'green':'blue'}" data-box="${i?480:36},1038,425,72" aria-pressed="${currency===key}" ${pickup&&key==='gold'?'disabled title="픽업 모집은 다이아 전용입니다."':''}><i class="currency-icon ${i?'gem':'gold'}"></i>${i?'다이아':'골드'} ${isHero?'등용':'모집'}</button>`).join('')}</div>
 ${[1,10].map((count,i)=>{const cost=(currency==='gold'?300:100)*count;return `<button class="recruit-action recruit-button" data-currency="${currency}" data-count="${count}" data-tone="${i?'green':'blue'}" data-box="${i?'405,1135,500':'36,1135,350'},138" ${state[currency]<cost?'disabled title="재화가 부족합니다."':''}><strong>${count}회 ${isHero?'등용':'모집'}</strong><span>${cost.toLocaleString()} ${currency==='gold'?'골드':'다이아'}</span></button>`;}).join('')}
 <p class="guarantee" data-box="70,${state.shop.pending?1280:1287},801,${state.shop.pending?30:43}">10회 ${isHero?'등용':'모집'} 시 <b>B등급 이상 1${isHero?'명':'개'} 확정</b></p>
 <div class="utility-buttons"><button id="shop-exchange" data-tone="blue" data-box="32,${state.shop.pending?1330:1351},281,${state.shop.pending?64:108}"><strong>상품 교환</strong><small>재료 · 선택상자</small></button><button id="s-select" data-tone="blue" data-box="330,${state.shop.pending?1330:1351},281,${state.shop.pending?64:108}"><strong>S 장수 선택</strong><small>선택 조각 ${S_SELECT_COST}개</small></button><button id="iap-open" data-tone="blue" data-box="628,${state.shop.pending?1330:1351},281,${state.shop.pending?64:108}"><strong>상품</strong><small>다이아 · 보급</small></button></div>
 ${state.shop.pending?'<button id="pending-result" data-tone="blue" data-box="330,1414,281,64">미확인 획득 결과</button>':''}`;
 artworkShell(root,{screen:'shop',title:'상점',progress:state});
 root.querySelectorAll('[data-box]').forEach(el=>placeArtwork(el,el.dataset.box.split(',').map(Number)));
 const painted=[...root.querySelectorAll('[data-tone]')].map(el=>nineSlice(el,el.dataset.tone));painted.push(nineSlice(root.querySelector('.stage-frame'),'blue',{button:false,center:false}));
 const imageJobs=[];
 if(isHero){
  const ids=pickup?[up.s,...up.a]:decorativeLineup(root,6);
  const step=pickup?250:139,start=pickup?220:122,height=pickup?300:235;
  for(const [i,id]of ids.entries())imageJobs.push(generalArtwork(id,{center:start+i*step,height,feet:810}).then(img=>{if(img&&token===revision)root.querySelector('.general-lineup').append(img);}));
 }
 root.querySelector('#shop-back').onclick=onBack;root.querySelector('#probabilities').onclick=onProbabilities;root.querySelector('#shop-exchange').onclick=onExchange;root.querySelector('#s-select').onclick=onSelectS;root.querySelector('#iap-open').onclick=onProducts;root.querySelector('#pending-result')?.addEventListener('click',onPending);
 root.querySelectorAll('[data-pool]').forEach(b=>b.onclick=()=>onPool(b.dataset.pool));root.querySelectorAll('[data-select-currency]').forEach(b=>b.onclick=()=>onCurrency(b.dataset.selectCurrency));root.querySelectorAll('[data-count]').forEach(b=>b.onclick=()=>onRecruit(b.dataset.currency,Number(b.dataset.count)));
 return Promise.all([...painted,shopReady,...imageJobs,...[...root.querySelectorAll('img')].map(i=>i.decode())]).finally(()=>{if(token===revision){root.inert=false;root.setAttribute('aria-busy','false');}});
}
