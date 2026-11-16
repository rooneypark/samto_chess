import {arenaOpponentsTemplate} from '../../arena-opponents-template.js';
import {artworkShell} from '../../ui-shell.js';
import {paintArtworkLayout} from '../../art-layout.js';
import {placeArtwork} from '../../art-controls.js';
import {nineSlice} from '../../nine-slice.js';
import {opponentsFor,tierOf} from '../../arena-state.js';

const root=document.querySelector('.game');
const find=selector=>root.querySelector(selector);
root.innerHTML=arenaOpponentsTemplate;
await paintArtworkLayout(root,{stablePixels:true});
artworkShell(root,{screen:'arena',title:'상대 선택',progress:{gold:12450,diamonds:320},controlsRoot:root});
let offset=0,selected=0;
const buttons=opponentsFor(1120).map((_,index)=>{
 const button=document.createElement('button');
 button.className='rate-card';
 button.dataset.tier=index;
 button.append(document.createElement('strong'),document.createElement('small'));
 placeArtwork(button,[50,528+index*157,841,135]);
 find('.opponents').append(button);
 button.onclick=()=>{selected=index;render();};
 return button;
});
async function render(){
 root.inert=true;root.setAttribute('aria-busy','true');
 const candidates=opponentsFor(1120,offset);
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
 root.inert=false;root.setAttribute('aria-busy','false');
}
find('.more').onclick=()=>{offset++;selected=0;render();};
find('.home-back').onclick=()=>{find('.home-back').textContent='시안에서 선택 확인';};
await render();
