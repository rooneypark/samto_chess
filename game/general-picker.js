import {heroes} from './heroes.js';
import {generalPortrait,portraitCrops} from './general-portraits.js';
// Shared multi-select dialog. Callers supply eligibility and domain summaries.
export function pickGenerals({dialog,title,ids,selected=[],count=3,summary,onConfirm}){
 const chosen=new Set(selected.filter(id=>ids.includes(id)).slice(0,count));
 dialog.open(title,'<p class="general-picker-summary" role="status"></p><div class="general-picker"></div><div class="modal-actions"><button class="action secondary" data-dialog-close>취소</button><button class="action" id="general-picker-confirm">편성 적용</button></div>');
 const body=document.querySelector('#modal-body'),list=body.querySelector('.general-picker'),confirm=body.querySelector('#general-picker-confirm');
 function refresh(){for(const b of list.querySelectorAll('[data-pick]')){const active=chosen.has(b.dataset.pick);b.setAttribute('aria-pressed',String(active));b.classList.toggle('secondary',!active);}body.querySelector('.general-picker-summary').textContent='선택 '+chosen.size+' / '+count+' · '+summary([...chosen]);confirm.disabled=chosen.size!==count;}
 for(const id of ids){const hero=heroes.find(h=>h.id===id),b=document.createElement('button');b.className='action secondary general-picker-card';b.dataset.pick=id;
  const art=document.createElement('span');art.className='general-picker-art';if(portraitCrops[id])art.append(generalPortrait(id));else{const img=new Image();img.src=hero.portrait;img.alt=hero.name;art.append(img);}b.append(art);const label=document.createElement('span');label.textContent=hero.name;b.append(label);b.onclick=()=>{if(chosen.has(id))chosen.delete(id);else if(chosen.size<count)chosen.add(id);refresh();};list.append(b);
 }
 if(!ids.length)list.textContent='현재 편성할 수 있는 보유 장수가 없습니다.';
 confirm.onclick=()=>{if(chosen.size!==count)return;dialog.dismiss();onConfirm([...chosen]);};refresh();
}
