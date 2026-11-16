import {arenaRecordsTemplate} from '../../arena-records-template.js';
import {artworkShell} from '../../ui-shell.js';
import {paintArtworkLayout} from '../../art-layout.js';
import {nineSlice} from '../../nine-slice.js';
import {opponentPool,tierOf} from '../../arena-state.js';

const root=document.querySelector('.game');
const find=selector=>root.querySelector(selector);
root.innerHTML=arenaRecordsTemplate;
await paintArtworkLayout(root,{stablePixels:true});
artworkShell(root,{screen:'arena',title:'군웅대전',progress:{gold:12450,diamonds:320},controlsRoot:root});
const player={name:'내 순위',score:1120,mine:true};
const rankings=[...opponentPool,player].sort((a,b)=>b.score-a.score);
const outcomes=['win','loss','win','draw','win','loss','win','loss','win','loss'];
const labels={win:'승리',loss:'패배',draw:'무승부'};
const history=outcomes.map((result,index)=>({result,opponent:opponentPool[index].name,score:result==='win'?21:result==='loss'?-16:0,date:'11월 '+(14-Math.floor(index/3))+'일'}));
let tab='rank';
function row(title,description,value,tone='',mine=false){
 const item=document.createElement('div');
 item.className='record-row'+(mine?' mine':'');
 const text=document.createElement('div'),name=document.createElement('strong'),detail=document.createElement('small'),points=document.createElement('strong');
 name.textContent=title;detail.textContent=description;points.textContent=value;points.className=tone;
 text.append(name,detail);item.append(text,points);return item;
}
async function render(){
 root.inert=true;root.setAttribute('aria-busy','true');
 const rank=tab==='rank';
 find('.scroll-heading').textContent=rank?'군웅대전 순위표':'군웅대전 최근 전적';
 find('.section-title').textContent=rank?'내 순위':'최근 10판';
 find('.record-summary').textContent=rank?(rankings.indexOf(player)+1)+'위 · '+player.score.toLocaleString()+'점 · '+tierOf(player.score).name:'5승 · 4패 · 1무';
 find('.hint').textContent=rank?'내 점수와 고정 점수의 NPC를 비교합니다.':'가장 최근에 치른 대전부터 표시합니다.';
 const list=find('.record-list');
 list.replaceChildren(...(rank?rankings.map((entry,index)=>row((index+1)+'위 · '+(entry.mine?'나':entry.name),tierOf(entry.score).name+(entry.mine?' · 내 기록':' · NPC'),entry.score.toLocaleString()+'점','',entry.mine)):history.map(entry=>row(entry.opponent,entry.date+' · NPC',labels[entry.result]+' · '+(entry.score>0?'+':'')+entry.score+'점',entry.result))));
 list.scrollTop=0;
 await Promise.all([...root.querySelectorAll('[data-tab]')].map(button=>{
  const active=button.dataset.tab===tab;
  button.setAttribute('aria-pressed',String(active));
  return nineSlice(button,active?'green':'blue',{stablePixels:true});
 }));
 await document.fonts.ready;
 root.inert=false;root.setAttribute('aria-busy','false');
}
root.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>{tab=button.dataset.tab;render();});
await render();
