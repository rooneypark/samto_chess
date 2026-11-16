import {pickupOf,pickupRules} from '../../collection.js';
import {ratesTemplate} from '../../rates-template.js';
import {artworkShell} from '../../ui-shell.js';
import {paintArtworkLayout} from '../../art-layout.js';
import {placeArtwork} from '../../art-controls.js';
import {nineSlice} from '../../nine-slice.js';
import {rates,poolEntries} from '../../economy.js';
const root=document.querySelector('.game'),$=s=>root.querySelector(s);
root.innerHTML=ratesTemplate;
$('#barracks-back').id='shop-back';await paintArtworkLayout(root,{stablePixels:true});artworkShell(root,{screen:'shop',title:'픽업 확률',progress:{gold:12450,diamonds:320},controlsRoot:root});let pool='hero',grade='S';
for(const [i,g]of ['S','A','B','C'].entries()){const b=document.createElement('button');b.className='rate-card';b.dataset.grade=g;b.innerHTML=`<strong>${g} · ${rates[g]*100}%</strong><small>등급 상세</small>`;placeArtwork(b,[50+i*214,442,199,120]);$('.grades').append(b);b.onclick=()=>{grade=g;render()};}
const rotation=pickupOf(Date.now());
const roster=poolEntries('hero');
const name=id=>roster.find(hero=>hero.id===id).name;
const percent=value=>Number((value*100).toFixed(4))+'%';
$('[data-pool=hero]').textContent='기본 픽업';
$('[data-pool=treasure]').textContent='다음 S 픽업 확정';
$('.scroll-heading').textContent='픽업 대상과 확정 조건';
const end=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(rotation.endsAt);
$('.hint').textContent='다이아 전용 · '+end+'까지 (한국 시간)';
async function render(){
 root.inert=true;
 root.setAttribute('aria-busy','true');
 const guaranteed=pool==='treasure', chance=pickupRules.chance;
 const entries=roster.filter(hero=>hero.grade===grade);
 $('.detail-title').textContent=grade==='S'?'S 픽업 · '+name(rotation.s):grade==='A'?'A 픽업 · '+rotation.a.map(name).join(' · '):grade+'등급 · 일반 장수 '+entries.length+'종';
 const rate=grade==='S'?(guaranteed?1:chance):grade==='A'?chance/rotation.a.length:1/entries.length;
 $('.chance').textContent=(grade==='A'?'픽업 장수 각각 ':'등급 내 ')+percent(rate)+' · 기본 1회 '+percent(rates[grade]*rate);
 $('.names').textContent=grade==='S'?(guaranteed?'S등급이 나오면 이번 픽업 장수를 확정 획득합니다.':'S등급이 나오면 '+percent(chance)+' 확률로 픽업 장수를 획득합니다.') : grade==='A'?'A등급이 나오면 '+percent(chance)+' 확률로 두 픽업 장수 중 한 명을 획득합니다.':entries.map(hero=>hero.name).join(' · ');
 $('.rules').textContent='픽업 외 S 획득 시 다음 픽업 모집의 S는 픽업 확정\nA 이상 29회 미획득 후: A 80% / S 20%\nS 99회 미획득 후: S 확정 · S 보장 우선\n일반 장수 모집과 등급 보장 횟수를 공유합니다.\n기본 1회 확률은 등급 보장 적용 전 기준입니다.';
 await Promise.all([...root.querySelectorAll('[data-grade],[data-pool]')].map(button=>{
  const active=button.dataset.grade?button.dataset.grade===grade:button.dataset.pool===pool;
  button.setAttribute('aria-pressed',String(active));
  return nineSlice(button,active?'green':'blue',{stablePixels:true});
 }));
 await document.fonts.ready;
 root.inert=false;
 root.setAttribute('aria-busy','false');
}
root.querySelectorAll('[data-pool]').forEach(b=>b.onclick=()=>{pool=b.dataset.pool;render()});const notify=()=>{let e=document.querySelector('.preview-status');if(!e){e=document.createElement('div');e.className='preview-status';document.body.append(e)}e.textContent='검토용 시안입니다. 실제 저장과 모집은 변경하지 않습니다.';setTimeout(()=>e.remove(),2200)};root.querySelectorAll('.home-back,#shop-back,.bottom-nav button,.wallet button').forEach(b=>b.onclick=notify);await render();
