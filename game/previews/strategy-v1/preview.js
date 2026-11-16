import {strategyTemplate} from '../../strategy-template.js';
import {artworkScreenTemplate} from '../../artwork-screen-template.js';
import {artworkShell} from '../../ui-shell.js';
import {paintArtworkLayout} from '../../art-layout.js';
import {placeArtwork} from '../../art-controls.js';
import {nineSlice} from '../../nine-slice.js';
import {strategyNames,strategyEffects,baseStrategies} from '../../battle-data.js';
import {unlockLevels} from '../../unlocks.js';
const root=document.querySelector('.game'),$=s=>root.querySelector(s);
root.innerHTML=strategyTemplate;
const details={vanguard:['33.333% 0','적용 대상 · 전열 장수','전열의 생존을 보조하는 군략입니다.'],strategist:['66.667% 50%','적용 대상 · 책사 장수','책사의 첫 전법 준비를 돕습니다.'],logistics:['100% 100%','적용 대상 · 전투 시작 자원','시작 은화를 추가로 확보합니다.'],ambush:['0 50%','적용 대상 · 기동 장수의 첫 전법','첫 전법의 피해를 강화합니다.'],fire:['100% 0','적용 대상 · 아군의 화염 피해','화염 피해가 있는 장수와 조합하세요.'],defend:['66.667% 0','적용 대상 · 3라운드 이후 방어 장수','후반 라운드의 방어를 보조합니다.']};
let selected='vanguard',current='vanguard';const level=12;
await paintArtworkLayout(root,{stablePixels:true});artworkShell(root,{screen:'home',title:'군략 선택',progress:{gold:12450,diamonds:320}});
for(const [i,id]of Object.keys(strategyNames).entries()){const b=document.createElement('button');b.className='strategy-card';b.dataset.strategy=id;b.innerHTML=`<i class="symbol" style="background-position:${details[id][0]}"></i><strong>${strategyNames[id]}</strong><small>${baseStrategies.includes(id)?'기본 군략':'잠김 · Lv.'+unlockLevels.strategies}</small>`;placeArtwork(b,[50+i%3*286,354+Math.floor(i/3)*178,269,158]);$('.strategies').append(b);b.onclick=()=>{selected=id;render()};}
async function render(){root.inert=true;root.setAttribute('aria-busy','true');const locked=!baseStrategies.includes(selected)&&level<unlockLevels.strategies;$('.detail-name').textContent=strategyNames[selected]+(selected===current?' · 적용 중':'');$('.effect').textContent=strategyEffects[selected];$('.description').textContent=details[selected][1]+'\n'+details[selected][2];$('.unlock').textContent=locked?'군주 Lv.'+unlockLevels.strategies+'에 해금 · 현재 Lv.'+level:'사용 가능 · 기본 군략';$('.current').textContent='현재 '+strategyNames[current]+' → 선택 '+strategyNames[selected];$('.apply').disabled=locked||selected===current;$('.apply').textContent=locked?'군주 Lv.'+unlockLevels.strategies+' 필요':selected===current?'현재 적용 중':strategyNames[selected]+' 군략 적용';await Promise.all([...root.querySelectorAll('[data-strategy]')].map(b=>{b.setAttribute('aria-pressed',String(b.dataset.strategy===selected));return nineSlice(b,b.dataset.strategy===selected?'green':'blue',{stablePixels:true})}));await document.fonts.ready;root.inert=false;root.setAttribute('aria-busy','false');}
$('.apply').onclick=()=>{if($('.apply').disabled)return;current=selected;render()};const notify=()=>{let n=document.querySelector('.preview-status');if(!n){n=document.createElement('div');n.className='preview-status';document.body.append(n);}n.textContent='검토용 시안입니다. 실제 군략·저장은 변경하지 않습니다.';clearTimeout(notify.timer);notify.timer=setTimeout(()=>n.remove(),2200)};root.querySelectorAll('.home-back,#barracks-back,.bottom-nav button,.wallet button').forEach(b=>b.onclick=notify);await render();
