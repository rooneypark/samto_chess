import {nineSlice} from './nine-slice.js';
import {selectedTone} from './ui-spec.js';
// Shared hosting and navigation for full-page artwork screens. Domain rules
// and approved layout coordinates stay in the individual screen modules.
export function createArtworkScreen({host,className,label,template,navigate,onWallet,sharedShell=false}){
 const root=document.createElement('section');root.className=className+' artwork-screen'+(sharedShell?' artwork-runtime':'');root.hidden=true;
 root.setAttribute('aria-label',label);root.innerHTML=template;host.append(root);
 root.querySelectorAll('.bottom-nav button').forEach(b=>b.onclick=()=>navigate(b.dataset.action));
 root.querySelectorAll('.home-back,#barracks-back').forEach(b=>b.onclick=()=>navigate('home'));
 root.querySelectorAll('.wallet button').forEach(b=>b.onclick=onWallet);
 root.addEventListener('keydown',e=>{if(e.key==='Escape'&&!root.inert&&!document.querySelector('dialog[open]')){e.preventDefault();navigate('home');}});
 return root;
}
export function paintArtworkSelection(button,selected){
 button.setAttribute('aria-pressed',String(selected));
 const tone=selectedTone(selected);
 // The existing ResizeObserver still redraws on resize. Selection renders
 // need no new bitmap when the element already has the requested tone.
 return button.dataset.nineSlice===tone?Promise.resolve():nineSlice(button,tone);
}
