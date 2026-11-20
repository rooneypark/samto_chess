// Shared approved icon; keep the larger hit target independent of the artwork.
export function applyCloseIcon(button,label='닫기'){
  button.classList.remove('art-control','art-painted');
  button.classList.add('shared-close-icon');
  button.type='button';
  button.setAttribute('aria-label',label);
  button.replaceChildren(document.createTextNode('×'));
}

