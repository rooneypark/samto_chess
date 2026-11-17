import {artButton,placeArtwork,artworkNavigation,initArtPress} from './art-controls.js';

export const featuredGenerals=['1','xuchu','32','35','diaochan','119'];
export const gateTitleArtwork='assets/ui-common/gate-title-samto.png';
// Entry point for pages sharing the approved header, wallet and footer.
// Screens own their content and navigation; the shell owns only presentation.
export function artworkShell(root,{screen,title,progress,controlsRoot=root.closest('.game')}){
 const game=root.closest('.game');initArtPress(game);
 artworkHeader(root,screen,title);artworkWallet(controlsRoot,progress);artworkNavigation(controlsRoot,screen);
}
// Header titles drawn as brush lettering: title text -> file in assets/ui-common/header-lettering.
// A title that is not listed (boss names, composed titles) is drawn as text.
// treasure-codex.png is composed from existing glyphs (보물 획득 + 장수 도감), colour-matched.
const headerLettering={'상점':'shop','병영':'barracks','동맹':'alliance','군웅대전':'arena','전역':'campaign','임무':'missions','우편함':'mail',
 '장수 도감':'codex','보물 도감':'treasure-codex','첫 7일 보상':'start','토벌 파견':'expedition','연무탑':'tower','내정':'government','보물함':'treasure',
 '군주 정보':'profile','설정':'settings','장수 편성':'formation','군략 선택':'strategy','상품 교환':'exchange','S 장수 선택':'select',
 '등용 결과':'recruit-result','보물 획득':'treasure-result','모집 확률':'rates','픽업 확률':'pickup','상품 · 보급':'products','군공 상점':'merit',
 '시즌 · 등급':'season','상대 선택':'opponent','전투 기록':'record','전투 결과':'results',
 '황건의 난':'yellow','사수관':'sishui','호뢰관':'hulao','복양':'puyang','관도':'guandu','하비':'xiapi','적벽':'chibi','이릉':'yiling','기초 훈련':'training'};
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
 // Brush lettering for titles that have artwork (assets/ui-common/header-lettering). The text stays underneath
 // at zero size, and is shown again if the image fails to load.
 else if(headerLettering[title]){
  const lettering=new Image();
  lettering.className='header-title-lettering';
  lettering.alt='';
  lettering.src='assets/ui-common/header-lettering/'+headerLettering[title]+'.png';
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
