// One approved shop scroll. This component paints only; screen coordinates stay unchanged.
export const scrollArtworkURL=new URL('./assets/ui-common/scroll-paper.png',import.meta.url).href;
export const scrollSelector='.scroll-heading,.pity-scroll,.guild-notice,.shared-scroll';
export function sharedScroll(el){
 el.classList.add('shared-scroll');el.dataset.scrollArtwork='shop';
 el.style.setProperty('background-image','url("'+scrollArtworkURL+'")','important');
 el.style.setProperty('background-color','transparent','important');
 el.style.setProperty('background-size','100% 100%');
 el.style.setProperty('--art-image','url("'+scrollArtworkURL+'")');
 return el;
}
