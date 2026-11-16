import {escapeHtml} from './dialog-content.js';

// One atlas for every legacy semantic icon inside artwork dialogs.
export const dialogIconNames=['shop','helmet','gate','banner','swords','mail','scroll','settings','map','gold','gem','chest'];
export function dialogArtworkCallout(kind,label){
  const file=kind==='treasure'?'treasure-hall-v3.png':'recruit-confirm-v1.png';
  return `<div class="game-dialog-callout recruit-dialog-art" data-recruit-art="${kind==='treasure'?'treasure':'hero'}"><img src="assets/shop-v2/${file}" alt=""><strong>${escapeHtml(label)}</strong></div>`;
}
export function styleDialogContent(root){
  for(const icon of root.querySelectorAll('.icon:not([data-dialog-icon])')){
    const index=dialogIconNames.findIndex(name=>icon.classList.contains('icon-'+name));
    if(index<0)continue;
    icon.dataset.dialogIcon=dialogIconNames[index];
    icon.style.backgroundImage='url("assets/ui-common/dialog-icons-v1.png")';
    icon.style.backgroundSize='400% 300%';
    icon.style.backgroundPosition=`${index%4*100/3}% ${Math.floor(index/4)*50}%`;
    icon.style.backgroundRepeat='no-repeat';
    icon.setAttribute('aria-hidden','true');
  }
  root.querySelectorAll('.game-dialog-empty,.game-dialog-hero').forEach(panel=>panel.classList.add('dialog-art-panel'));
}
