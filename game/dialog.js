import {initArtPress} from './art-controls.js';
import {nineSlice,disposeNineSlices} from './nine-slice.js';
import {dialogButtonSelector,styleDialogButtons} from './dialog-buttons.js';
import {styleDialogContent} from './dialog-art-content.js';
import {applyCloseIcon} from './close-icon.js';
export function createGameDialog(dialog,{artwork=false}={}) {
  if(artwork){dialog.classList.add('art-dialog');initArtPress(dialog);}
  const titleElement = dialog.querySelector('#modal-title');
  const body = dialog.querySelector('#modal-body');
  const closeButton = dialog.querySelector('#close-modal');
  if(artwork)applyCloseIcon(closeButton);
  let returnFocus,busy=false;
  const nativeClose=dialog.close.bind(dialog);dialog.close=(...args)=>{if(!busy)nativeClose(...args);};
  document.addEventListener('game-committing',e=>{busy=e.detail;dialog.setAttribute('aria-busy',String(busy));closeButton.disabled=busy;});
  dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
  const titleIcon=document.createElement('i');
  titleIcon.setAttribute('aria-hidden','true');
  titleElement.before(titleIcon);
  body.addEventListener('click',event=>{if(event.target.closest('[data-dialog-close]'))dialog.close();});
  function paintActions(){
    styleDialogButtons(body,titleElement.textContent);
    if(!artwork||!dialog.open)return;
    styleDialogContent(body);
    const corner=Math.max(7,Math.round(dialog.clientWidth*28/821));
    const paint=(element,tone,button)=>nineSlice(element,tone,{button,corner,stablePixels:true,fitCorner:true}).catch(error=>console.error(error));
    body.querySelectorAll('.game-dialog-inset:not(.dialog-message),.guild-modal-row,.treasure-card,.result-card,.product-row,.rate-list section').forEach(panel=>paint(panel,'blue',false));
    body.querySelectorAll(dialogButtonSelector).forEach(button=>paint(button,button.dataset.dialogRole==='primary'?'green':'blue',true));
  }
  const observer = new MutationObserver(records=>{
    if(artwork)for(const record of records)for(const node of record.removedNodes){
      if(node.nodeType===Node.ELEMENT_NODE&&!body.contains(node))disposeNineSlices(node);
    }
    paintActions();
  });
  observer.observe(body, {childList:true, subtree:true, characterData:true});
  closeButton.onclick = () => dialog.close();
  dialog.addEventListener('close', () => {
    if (!dialog.open) returnFocus?.focus({preventScroll:true});
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  function open(title, content) {
    if (!dialog.open) returnFocus = document.activeElement;
    titleElement.textContent = title;
    if(artwork)disposeNineSlices(body);
    body.innerHTML = content;
    const symbol=/동맹|군량/.test(title)?'banner':/대전|순위|상대/.test(title)?'swords':/보물|상자|보상/.test(title)?'chest':/재화|기부|상품/.test(title)?'gold':/훈련|각성|장수|편성|군주/.test(title)?'helmet':/설정/.test(title)?'settings':/우편/.test(title)?'mail':/전역/.test(title)?'map':'scroll';
    titleIcon.className='icon icon-'+symbol;
    if(!body.querySelector('.modal-actions')){
      const footer=document.createElement('div');
      footer.className='modal-actions';
      footer.innerHTML='<button class="action secondary" data-dialog-close>닫기</button>';
      body.append(footer);
    }
    const paragraphs=[...body.children].filter(element=>element.tagName==='P');
    if(!artwork&&paragraphs.length===1 && body.querySelector('.modal-actions')) paragraphs[0].classList.add('game-dialog-inset');
    if (!dialog.open) dialog.showModal();
    paintActions();
    dialog.scrollTop = 0;
    closeButton.focus({preventScroll:true});
  }
  function confirm(title, message, label, action) {
    open(title, '<p class="dialog-message"></p><div class="modal-actions"><button class="action secondary" data-dialog-cancel>취소</button><button class="action" data-dialog-confirm></button></div>');
    body.querySelector('.dialog-message').textContent = message;
    body.querySelector('[data-dialog-cancel]').onclick = () => dialog.close();
    const button = body.querySelector('[data-dialog-confirm]');
    button.textContent = label;
    button.onclick = async () => {
      if (button.disabled) return;
      button.disabled = true;
      try { await action(); }
      finally { button.disabled = false; }
    };
  }
  function dismiss() {
    returnFocus = null;
    if (dialog.open) dialog.close();
  }
  return {open, confirm, dismiss};
}
