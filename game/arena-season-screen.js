import {arenaSeasonTemplate} from './arena-season-template.js';
import {createArtworkScreen} from './artwork-screen.js';
import {artworkShell} from './ui-shell.js';
import {paintArtworkLayout} from './art-layout.js';
import {placeArtwork} from './art-controls.js';
import {nineSlice} from './nine-slice.js';
import {tiers,tierIndex,seasonRewards,seasonEndsAt,seasonOf,arenaCommand} from './arena-state.js';

export function initArenaSeason({host,store,navigate,onWallet,toast}){
const root=createArtworkScreen({host,sharedShell:true,className:'arena-season-runtime',label:'시즌 · 등급',template:arenaSeasonTemplate,navigate,onWallet});
const find=selector=>root.querySelector(selector);
let selected=null,revision=0,timer;
const date=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const ready=paintArtworkLayout(root,{stablePixels:true});
const buttons=tiers.map((tier,index)=>{
 const button=document.createElement('button');
 button.className='rate-card';
 button.dataset.tier=index;
 button.innerHTML=`<strong>${tier.name}</strong><small>${tier.min.toLocaleString()}점 이상</small>`;
 placeArtwork(button,[50+index%3*286,566+Math.floor(index/3)*170,269,145]);
 find('.tiers').append(button);
 button.onclick=()=>{selected=index;draw();};
 return button;
});
async function render(){
 const token=++revision;
 await ready;
 if(root.hidden||token!==revision)return;
 const now=Date.now();
 const arena=store.get().arena;
 if(arena&&arena.season!==seasonOf(now)){
  await store.transact(state=>state.arena?.season===seasonOf(now)?state:arenaCommand(state,{type:'season'},now));
  if(root.hidden||token!==revision)return;
 }
 const state=store.get(),score=state.arena?.score??1000,current=tierIndex(score);
 selected??=current;
 const end=seasonEndsAt(now);
 clearTimeout(timer);
 timer=setTimeout(draw,Math.min(2147483647,Math.max(1,end-now)));
 artworkShell(root,{screen:'arena',title:'시즌 · 등급',progress:state,controlsRoot:root});
 find('.current-tier').textContent='현재 등급 · '+tiers[current].name;
 find('.current-score').textContent='대전 점수 '+score.toLocaleString()+'점';
 find('.season-end').textContent='시즌 종료 · '+date.format(end)+' (한국 시간)';
 buttons.forEach((button,index)=>{button.lastElementChild.textContent=tiers[index].min.toLocaleString()+'점 이상'+(index===current?' · 현재':'');});

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
 if(token===revision&&!root.hidden){root.inert=false;root.setAttribute('aria-busy','false');}
}
function draw(){render().catch(error=>{root.inert=false;root.setAttribute('aria-busy','false');toast(error.message);});}
const back=()=>navigate('arena');
find('.home-back').onclick=back;
find('#barracks-back').onclick=back;
root.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&!document.querySelector('dialog[open]')){event.stopImmediatePropagation();back();}
},true);
store.subscribe(()=>{if(!root.hidden)draw();});
window.addEventListener('focus',()=>{if(!root.hidden)draw();});
return {show(visible){revision++;root.hidden=!visible;host.classList.toggle('arena-season-art',visible);if(visible){selected=null;draw();}else clearTimeout(timer);}};
}
