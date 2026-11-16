import {artworkShell} from './ui-shell.js';
import {paintArtworkLayout} from './art-layout.js';
import {placeArtwork} from './art-controls.js';
import {nineSlice} from './nine-slice.js';
import {rates,poolEntries} from './economy.js';
import {ratesTemplate} from './rates-template.js';
import {createArtworkScreen} from './artwork-screen.js';
import {poolLocked,pickupOf,pickupRules} from './collection.js';

export function initRatesScreen({host,store,navigate,onWallet,toast}){
 const root=createArtworkScreen({host,sharedShell:true,className:'rates-runtime',label:'모집 확률',template:ratesTemplate,navigate,onWallet});
 const $=selector=>root.querySelector(selector);
 $('#barracks-back').id='shop-back';
 const ready=paintArtworkLayout(root,{stablePixels:true});
 let pool='hero',grade='S',revision=0,pickup=false;
 for(const [index,key] of ['S','A','B','C'].entries()){
  const button=document.createElement('button');
  button.className='rate-card';
  button.dataset.grade=key;
  button.innerHTML=`<strong>${key} · ${rates[key]*100}%</strong><small>등급 상세</small>`;
  placeArtwork(button,[50+index*214,442,199,120]);
  $('.grades').append(button);
  button.onclick=()=>{grade=key;draw();};
 }
 function renderPickup(state){
 const rotation=pickupOf();
 const roster=poolEntries('hero').filter(hero=>!poolLocked(state,hero.id));
 const name=id=>roster.find(hero=>hero.id===id)?.name??id;
 const percent=value=>Number((value*100).toFixed(4))+'%';
 const end=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(rotation.endsAt);
 $('.hint').textContent='다이아 전용 · '+end+'까지 (한국 시간)';
 const guaranteed=pool==='treasure', chance=pickupRules.chance;
 const entries=roster.filter(hero=>hero.grade===grade);
 $('.detail-title').textContent=grade==='S'?'S 픽업 · '+name(rotation.s):grade==='A'?'A 픽업 · '+rotation.a.map(name).join(' · '):grade+'등급 · 일반 장수 '+entries.length+'종';
 const rate=grade==='S'?(guaranteed?1:chance):grade==='A'?chance/rotation.a.length:1/entries.length;
 $('.chance').textContent=(grade==='A'?'픽업 장수 각각 ':'등급 내 ')+percent(rate)+' · 기본 1회 '+percent(rates[grade]*rate);
 $('.names').textContent=grade==='S'?(guaranteed?'S등급이 나오면 이번 픽업 장수를 확정 획득합니다.':'S등급이 나오면 '+percent(chance)+' 확률로 픽업 장수를 획득합니다.') : grade==='A'?'A등급이 나오면 '+percent(chance)+' 확률로 두 픽업 장수 중 한 명을 획득합니다.':entries.map(hero=>hero.name).join(' · ');
 const pity=state.shop.pity.hero;
 const current=state.shop.pickup?.guaranteed?'확정':'기본';
 $('.names').textContent='현재 S 픽업 상태 · '+current+'\n'+$('.names').textContent;
 $('.rules').textContent=[
  '픽업 외 S 획득 시 다음 픽업 모집의 S는 픽업 확정',
  'A 이상 29회 미획득 후 A 80% / S 20% · S 99회 후 확정',
  '일반 장수 모집과 등급 보장 횟수를 공유합니다.',
  '남은 횟수 · A 이상 '+(30-pity.a)+'회 / S '+(100-pity.s)+'회',
  '기본 1회 확률은 등급 보장 적용 전 기준입니다.'
 ].join('\n');
 }
 async function render(){
  const token=++revision;
  root.inert=true;
  root.setAttribute('aria-busy','true');
  await ready;
  if(root.hidden||token!==revision)return;
  const state=store.get();
  artworkShell(root,{screen:'shop',title:pickup?'픽업 확률':'모집 확률',progress:state,controlsRoot:root});
  $('[data-pool=hero]').textContent=pickup?'기본 픽업':'장수 모집';
  $('[data-pool=treasure]').textContent=pickup?'다음 S 픽업 확정':'보물 모집';
  $('.scroll-heading').textContent=pickup?'픽업 대상과 확정 조건':'모집 확률과 보장 안내';
  if(pickup)renderPickup(state);
  else{
  $('.hint').textContent='골드·다이아 동일 확률 · 장수/보물 보장 횟수는 별도';
  const entries=poolEntries(pool).filter(entry=>entry.grade===grade&&(pool!=='hero'||!poolLocked(state,entry.id)));
  $('.detail-title').textContent=grade+'등급 · '+(pool==='hero'?'장수':'보물')+' '+entries.length+'종';
  $('.chance').textContent=entries.length?'각 '+(rates[grade]*100/entries.length).toFixed(4)+'% · 등급 내 균등':'모집 대상 없음';
  $('.names').textContent=entries.map(entry=>entry.name).join(' · ');
  $('.names').scrollTop=0;
  $('.rules').textContent='A 이상 29회 미획득: 다음 A 80% / S 20%\nS 99회 미획득: 다음 S 확정 · S 보장 우선\nA/S 획득 시 A 횟수 초기화 · S 획득 시 S 초기화\n'+(pool==='hero'?'장수 10회 모집: B 이상 1명 보장':'보물 10회 모집: B 이상 1개 보장');
  const pity=state.shop.pity[pool];
  $('.rules').textContent+='\n남은 횟수 · A 이상 '+(30-pity.a)+'회 / S '+(100-pity.s)+'회';
  }
  await Promise.all([...root.querySelectorAll('[data-grade],[data-pool]')].map(button=>{
   const active=button.dataset.grade?button.dataset.grade===grade:button.dataset.pool===pool;
   button.setAttribute('aria-pressed',String(active));
   return nineSlice(button,active?'green':'blue',{stablePixels:true});
  }));
  if(token===revision&&!root.hidden){root.inert=false;root.setAttribute('aria-busy','false');}
 }
 function draw(){render().catch(error=>{root.inert=false;root.setAttribute('aria-busy','false');toast(error.message);});}
 root.querySelectorAll('[data-pool]').forEach(button=>button.onclick=()=>{pool=button.dataset.pool;draw();});
 const back=()=>navigate('shop');
 $('.home-back').onclick=back;
 $('#shop-back').onclick=back;
 root.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!document.querySelector('dialog[open]')){event.stopImmediatePropagation();back();}
 },true);
 store.subscribe(()=>{if(!root.hidden)draw();});
 return {show(visible,initialPool){
  revision++;
  root.hidden=!visible;
  host.classList.toggle('rates-art',visible);
  root.classList.toggle('pickup-rates',initialPool==='pickup');
  if(visible){
   pickup=initialPool==='pickup';
   pool=initialPool==='treasure'||(pickup&&store.get().shop.pickup?.guaranteed)?'treasure':'hero';
   grade='S';
   draw();
  }
 }};
}
