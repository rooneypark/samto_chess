import {arenaSeasonTemplate} from '../../arena-season-template.js';
import {artworkShell} from '../../ui-shell.js';
import {paintArtworkLayout} from '../../art-layout.js';
import {placeArtwork} from '../../art-controls.js';
import {nineSlice} from '../../nine-slice.js';
import {tiers,tierIndex,seasonRewards,seasonEndsAt,SEASON_DAYS} from '../../arena-state.js';

const root=document.querySelector('.game');
const find=selector=>root.querySelector(selector);
root.innerHTML=arenaSeasonTemplate;
const current=tierIndex(1120);
let selected=current;
const end=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(seasonEndsAt(Date.now()));
find('.season-end').textContent='시즌 종료 · '+end+' (한국 시간)';
await paintArtworkLayout(root,{stablePixels:true});
artworkShell(root,{screen:'arena',title:'시즌 · 등급',progress:{gold:12450,diamonds:320},controlsRoot:root});
const buttons=tiers.map((tier,index)=>{
 const button=document.createElement('button');
 button.className='rate-card';
 button.dataset.tier=index;
 button.innerHTML=`<strong>${tier.name}</strong><small>${tier.min.toLocaleString()}점 이상${index===current?' · 현재':''}</small>`;
 placeArtwork(button,[50+index%3*286,566+Math.floor(index/3)*170,269,145]);
 find('.tiers').append(button);
 button.onclick=()=>{selected=index;render();};
 return button;
});
async function render(){
 root.inert=true;root.setAttribute('aria-busy','true');
 const reward=seasonRewards[selected];
 find('.reward-title').textContent=tiers[selected].name+' · 시즌 보상';
 find('.reward').textContent='무료 다이아 '+reward.freeDiamonds.toLocaleString()+' · S 선택 조각 '+reward.sShards;
 await Promise.all(buttons.map((button,index)=>{
  const active=index===selected;
  button.setAttribute('aria-pressed',String(active));
  return nineSlice(button,active?'green':'blue',{stablePixels:true});
 }));
 await document.fonts.ready;
 root.inert=false;root.setAttribute('aria-busy','false');
}
await render();
