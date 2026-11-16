import {artworkShell} from './ui-shell.js';
import {paintArtworkLayout} from './art-layout.js';
import {placeArtwork} from './art-controls.js';
import {nineSlice} from './nine-slice.js';
import {opponentsFor,tierOf,opponentPool} from './arena-state.js';

import {arenaOpponentsTemplate} from './arena-opponents-template.js';
import {createArtworkScreen} from './artwork-screen.js';

export function initArenaOpponents({host,store,navigate,onWallet,toast,arena}){
const root=createArtworkScreen({host,sharedShell:true,className:'arena-opponents-runtime',label:'군웅대전 상대 선택',template:arenaOpponentsTemplate,navigate,onWallet});
const find=selector=>root.querySelector(selector);
const ready=paintArtworkLayout(root,{stablePixels:true});
let offset=0,selected=0,revision=0;
const buttons=opponentsFor(1000).map((_,index)=>{
 const button=document.createElement('button');
 button.className='rate-card';
 button.dataset.tier=index;
 button.append(document.createElement('strong'),document.createElement('small'));
 placeArtwork(button,[50,528+index*157,841,135]);
 find('.opponents').append(button);
 button.onclick=()=>{selected=index;draw();};
 return button;
});
async function render(){
 const token=++revision;
 await ready;
 if(root.hidden||token!==revision)return;
 const state=store.get(),score=state.arena?.score??1000;
 artworkShell(root,{screen:'arena',title:'상대 선택',progress:state,controlsRoot:root});
 find('.own-score').textContent=score.toLocaleString()+'점 · '+tierOf(score).name;
 find('.home-back').disabled=Boolean(state.arena?.match);
 find('.home-back').textContent=state.arena?.match?'진행 중인 대전 있음':'선택 확정';
 root.inert=true;root.setAttribute('aria-busy','true');
 const candidates=opponentsFor(score,offset);
 const chosen=candidates[selected];
 find('.opponent-summary').textContent=chosen.name+' · '+chosen.score.toLocaleString()+'점 · '+tierOf(chosen.score).name;
 await Promise.all(buttons.map((button,index)=>{
  const opponent=candidates[index];
  button.firstElementChild.textContent=opponent.name;
  button.lastElementChild.textContent=opponent.score.toLocaleString()+'점 · '+tierOf(opponent.score).name;
  button.setAttribute('aria-pressed',String(index===selected));
  return nineSlice(button,index===selected?'green':'blue',{stablePixels:true});
 }));
 await document.fonts.ready;
 if(root.hidden||token!==revision)return;
 root.inert=false;root.setAttribute('aria-busy','false');
}

function draw(){render().catch(error=>{root.inert=false;root.setAttribute('aria-busy','false');toast(error.message);});}
find('.more').onclick=()=>{offset=(offset+1)%Math.ceil(opponentPool.length/3);selected=0;draw();};
find('.home-back').onclick=()=>{
 if(store.get().arena?.match)return;
 arena.selectOpponent(offset,selected);
 navigate('arena');
};
const back=()=>navigate('arena');
find('#barracks-back').onclick=back;
root.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&!document.querySelector('dialog[open]')){event.stopImmediatePropagation();back();}
},true);
store.subscribe(()=>{if(!root.hidden)draw();});
return {show(visible){
 revision++;
 root.hidden=!visible;
 host.classList.toggle('arena-opponents-art',visible);
 if(visible){({page:offset,pick:selected}=arena.getOpponentSelection());draw();}
}};
}
