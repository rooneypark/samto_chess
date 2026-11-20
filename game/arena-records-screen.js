import {artworkShell} from './ui-shell.js';
import {paintArtworkLayout} from './art-layout.js';
import {nineSlice} from './nine-slice.js';
import {opponentPool,tierOf,emptyArena} from './arena-state.js';

import {createArtworkScreen} from './artwork-screen.js';
import {arenaRecordsTemplate} from './arena-records-template.js';
const labels={win:'승리',loss:'패배',draw:'무승부',abandoned:'포기'};
const date=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'long',day:'numeric'});
export function initArenaRecords({host,store,navigate,onWallet,toast}){
const root=createArtworkScreen({host,sharedShell:true,className:'arena-records-runtime',label:'군웅대전 순위와 전적',template:arenaRecordsTemplate,navigate,onWallet});
const find=selector=>root.querySelector(selector);
const ready=paintArtworkLayout(root,{stablePixels:true});
let tab='rank',revision=0;
function row(title,description,value,tone='',mine=false){
 const item=document.createElement('div');
 item.className='record-row'+(mine?' mine':'');
 const text=document.createElement('div'),name=document.createElement('strong'),detail=document.createElement('small'),points=document.createElement('strong');
 name.textContent=title;detail.textContent=description;points.textContent=value;points.className=tone;
 text.append(name,detail);item.append(text,points);return item;
}
async function render(){
 const token=++revision;
 await ready;
 if(root.hidden||token!==revision)return;
 const state=store.get(),arena=state.arena??emptyArena();
 const player={score:arena.score,mine:true};
 const rankings=[...opponentPool,player].sort((a,b)=>b.score-a.score);
 const history=[...(arena.history??[])].sort((a,b)=>b.time-a.time).slice(0,10);
 const count=outcome=>history.filter(entry=>entry.outcome===outcome).length;
 artworkShell(root,{screen:'arena',title:'군웅대전',progress:state,controlsRoot:root});

 root.inert=true;root.setAttribute('aria-busy','true');
 const rank=tab==='rank';
 find('.scroll-heading').textContent=rank?'군웅대전 순위표':'군웅대전 최근 전적';
 find('.section-title').textContent=rank?'내 순위':'최근 10판';
 find('.record-summary').textContent=rank?(rankings.indexOf(player)+1)+'위 · '+player.score.toLocaleString()+'점 · '+tierOf(player.score).name:history.length?`${count('win')}승 · ${count('loss')}패 · ${count('draw')}무${count('abandoned')?' · 포기 '+count('abandoned')+'판':''}`:'아직 대전 기록이 없습니다.';
 find('.hint').textContent=rank?'내 점수와 고정 점수의 NPC를 비교합니다.':'가장 최근에 치른 대전부터 표시합니다.';
 const list=find('.record-list');
 list.replaceChildren(...(rank?rankings.map((entry,index)=>row((index+1)+'위 · '+(entry.mine?'나':entry.name),tierOf(entry.score).name+(entry.mine?' · 내 기록':' · NPC'),entry.score.toLocaleString()+'점','',entry.mine)):history.map(entry=>row(entry.opponent,date.format(entry.time)+' · NPC',labels[entry.outcome]+' · '+(entry.score>0?'+':'')+entry.score+'점',entry.outcome))));
 list.scrollTop=0;
 await Promise.all([...root.querySelectorAll('[data-tab]')].map(button=>{
  const active=button.dataset.tab===tab;
  button.setAttribute('aria-pressed',String(active));
  return nineSlice(button,active?'green':'blue',{stablePixels:true});
 }));
 await document.fonts.ready;
 if(token===revision&&!root.hidden){root.inert=false;root.setAttribute('aria-busy','false');}
}

function draw(){render().catch(error=>{root.inert=false;root.setAttribute('aria-busy','false');toast(error.message);});}
root.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>navigate(button.dataset.tab==='rank'?'arenaRanking':'arenaHistory'));
const back=()=>navigate('arena');
find('.home-back')?.addEventListener('click',back);
find('#barracks-back').onclick=back;
root.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&!document.querySelector('dialog[open]')){event.stopImmediatePropagation();back();}
},true);
store.subscribe(()=>{if(!root.hidden)draw();});
return {show(visible,view){revision++;root.hidden=!visible;host.classList.toggle('arena-records-art',visible);if(visible){tab=view;draw();}}};
}
