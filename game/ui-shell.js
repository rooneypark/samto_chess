import {artButton,placeArtwork,artworkNavigation,initArtPress} from './art-controls.js';

export const featuredGenerals=['1','xuchu','32','35','diaochan','119'];
export const gateTitleArtwork='assets/ui-common/gate-title-samto.png';
// Entry point for pages sharing the approved header, wallet and footer.
// Screens own their content and navigation; the shell owns only presentation.
export function artworkShell(root,{screen,title,progress,controlsRoot=root.closest('.game')}){
 const game=root.closest('.game');initArtPress(game);
 artworkHeader(root,screen,title);artworkWallet(controlsRoot,progress);artworkNavigation(controlsRoot,screen);
}
// All artwork scenes use this exact frame, title slot and control alignment.
export function artworkHeader(root,screen,title){
 let shell=root.querySelector(':scope > .art-header');
 if(!shell){shell=document.createElement('div');shell.className='art-header';shell.setAttribute('aria-hidden','true');root.append(shell);}
 shell.dataset.screen=screen;shell.replaceChildren();
 const label=document.createElement('div');label.className='art-header-title';label.textContent=title;
 if(screen==='gate'&&title==='삼토체스'){
  const lettering=new Image();
  lettering.className='gate-title-lettering';
  lettering.alt='';
  lettering.src=gateTitleArtwork;
  lettering.decode().then(()=>{
   label.classList.add('has-gate-lettering');
   label.append(lettering);
  }).catch(()=>{});
 }
 if(screen==='battle')label.style.fontSize=Math.min(4.7,25/title.length)+'cqw';
 placeArtwork(label,[333,19,275,106]);shell.append(label);
 if(screen==='battle'||screen==='barracks'){
  const content=document.createElement('div');content.className='art-header-content '+screen;
  placeArtwork(content,[0,150,941,screen==='battle'?160:95]);shell.append(content);
  if(screen==='barracks'){content.style.backgroundImage='none';content.style.backgroundColor='#1b304a';const heading=document.createElement('div');heading.className='scroll-heading barracks-scroll-heading';heading.textContent='장수 성장 · 편성';placeArtwork(heading,[22,153,895,90]);shell.append(heading);}
 }
 if(screen!=='gate'){
  const back=root.querySelector(screen==='battle'?'#battle-exit':screen==='shop'?'#shop-back':'#barracks-back');
  artButton(back,'barracks-back',{paint:true});placeArtwork(back,[35,26,98,98]);back.classList.add('shell-back');
 }
 if(screen==='battle'){
  const help=root.querySelector('#battle-help');artButton(help,'battle-help',{paint:true});placeArtwork(help,[812,32,95,85]);help.classList.add('shell-help');
 }
}
export function artworkWallet(game,progress){
 game.querySelectorAll(':scope > .wallet button,:scope > .hud > .wallet button').forEach((el,i)=>{
  artButton(el,'gate-'+(i?'diamonds':'gold'),{paint:true});
  let value=el.querySelector('.shell-wallet-value');if(!value){value=document.createElement('b');value.className='shell-wallet-value';value.dataset.field=i?'diamonds':'gold';el.append(value);}
  value.textContent=progress[i?'diamonds':'gold'].toLocaleString();
 });
}
