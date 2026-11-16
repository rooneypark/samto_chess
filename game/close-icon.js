const closeIconAsset='assets/ui-common/close-x-v1.png';

// Shared approved icon; keep the larger hit target independent of the artwork.
export function applyCloseIcon(button,label='닫기'){
  button.classList.add('art-control','shared-close-icon');
  button.type='button';
  button.setAttribute('aria-label',label);
  button.style.setProperty('--art-image',`url("${closeIconAsset}")`);
  const image=document.createElement('img');
  image.src=closeIconAsset;
  image.alt='';image.draggable=false;
  button.replaceChildren(image);
}

