import {createArtworkScreen} from './artwork-screen.js';
import {lordLevel} from './services.js';
import {strategyTemplate} from './strategy-template.js';
import {artworkShell} from './ui-shell.js';
import {paintArtworkLayout} from './art-layout.js';
import {placeArtwork} from './art-controls.js';
import {nineSlice} from './nine-slice.js';
import {strategyNames,strategyEffects,baseStrategies} from './battle-data.js';
import {unlockLevels,unlocked} from './unlocks.js';
export function initStrategyScreen({host,store,navigate,toast,onWallet}){
const root=createArtworkScreen({host,sharedShell:true,className:'strategy-runtime',label:'군략 선택',template:strategyTemplate,navigate,onWallet}),$=s=>root.querySelector(s);let busy=false,revision=0;
const details={vanguard:['33.333% 0','적용 대상 · 전열 장수','전열의 생존을 보조하는 군략입니다.'],strategist:['66.667% 50%','적용 대상 · 책사 장수','책사의 첫 전법 준비를 돕습니다.'],logistics:['100% 100%','적용 대상 · 전투 시작 자원','시작 은화를 추가로 확보합니다.'],ambush:['0 50%','적용 대상 · 기동 장수의 첫 전법','첫 전법의 피해를 강화합니다.'],fire:['100% 0','적용 대상 · 아군의 화염 피해','화염 피해가 있는 장수와 조합하세요.'],defend:['66.667% 0','적용 대상 · 3라운드 이후 방어 장수','후반 라운드의 방어를 보조합니다.']};
let selected='vanguard',current='vanguard',level=1;
const ready=paintArtworkLayout(root,{stablePixels:true});
for(const [i,id]of Object.keys(strategyNames).entries()){const b=document.createElement('button');b.className='strategy-card';b.dataset.strategy=id;b.innerHTML=`<i class="symbol" style="background-position:${details[id][0]}"></i><strong>${strategyNames[id]}</strong><small>${baseStrategies.includes(id)?'기본 군략':'잠김 · Lv.'+unlockLevels.strategies}</small>`;placeArtwork(b,[50+i%3*286,354+Math.floor(i/3)*178,269,158]);$('.strategies').append(b);b.onclick=()=>{selected=id;render()};}
async function render(){const token=++revision;await ready;if(root.hidden||busy||token!==revision)return;const state=store.get();current=state.strategy??'vanguard';level=lordLevel(state).level;artworkShell(root,{screen:'home',title:'군략 선택',progress:state,controlsRoot:root});$('.right').textContent='군주 Lv.'+level;for(const b of root.querySelectorAll('[data-strategy]'))b.querySelector('small').textContent=baseStrategies.includes(b.dataset.strategy)?'기본 군략':unlocked(state,'strategies')?'해금 완료':'잠김 · Lv.'+unlockLevels.strategies;root.inert=true;root.setAttribute('aria-busy','true');const locked=!baseStrategies.includes(selected)&&level<unlockLevels.strategies;$('.detail-name').textContent=strategyNames[selected]+(selected===current?' · 적용 중':'');$('.effect').textContent=strategyEffects[selected];$('.description').textContent=details[selected][1]+'\n'+details[selected][2];$('.unlock').textContent=locked?'군주 Lv.'+unlockLevels.strategies+'에 해금 · 현재 Lv.'+level:'사용 가능 · '+(baseStrategies.includes(selected)?'기본 군략':'군주 Lv.'+unlockLevels.strategies+' 해금');$('.current').textContent='현재 '+strategyNames[current]+' → 선택 '+strategyNames[selected];$('.apply').disabled=locked||selected===current;$('.apply').textContent=locked?'군주 Lv.'+unlockLevels.strategies+' 필요':selected===current?'현재 적용 중':strategyNames[selected]+' 군략 적용';await Promise.all([...root.querySelectorAll('[data-strategy]')].map(b=>{b.setAttribute('aria-pressed',String(b.dataset.strategy===selected));return nineSlice(b,b.dataset.strategy===selected?'green':'blue',{stablePixels:true})}));await document.fonts.ready;if(token===revision&&!root.hidden){root.inert=false;root.setAttribute('aria-busy','false');}}

$('.apply').onclick=async()=>{if(busy||$('.apply').disabled)return;const choice=selected;busy=true;revision++;root.inert=true;root.setAttribute('aria-busy','true');try{await store.transact(s=>{if(!strategyNames[choice]||!baseStrategies.includes(choice)&&!unlocked(s,'strategies'))throw Error('해금되지 않은 군략입니다.');return {...s,strategy:choice};});toast(strategyNames[choice]+' 군략 저장 완료');}catch(e){toast(e.message,'error');}finally{busy=false;await render();}};
root.querySelectorAll('.home-back,#barracks-back').forEach(b=>b.onclick=()=>navigate('campaign'));
root.addEventListener('keydown',e=>{if(e.key==='Escape'&&!root.inert){e.stopImmediatePropagation();navigate('campaign')}},true);
store.subscribe(()=>{if(!root.hidden&&!busy)render()});return {show(visible){revision++;root.hidden=!visible;host.classList.toggle('strategy-art',visible);if(visible){selected=store.get().strategy??'vanguard';render();}}};
}
