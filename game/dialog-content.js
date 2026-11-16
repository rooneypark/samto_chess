// Saved names and user input must pass through this before entering innerHTML.
export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export function dialogRow(label,value){
 return '<div class="game-dialog-row"><span>'+label+'</span><strong>'+value+'</strong></div>';
}
export function dialogHero(hero,detail,star=1){
 return '<div class="game-dialog-hero"><img src="'+hero.portrait+'" alt=""><div><h3>'+hero.name+'</h3><div class="game-dialog-stars">'+'★'.repeat(star)+'☆'.repeat(5-star)+'</div><small>'+detail+'</small></div></div>';
}
export function dialogEmpty(icon,message){
 return '<div class="game-dialog-empty"><i class="icon icon-'+icon+'"></i><p>'+message+'</p></div>';
}
export function dialogInset(content){return '<div class="game-dialog-inset">'+content+'</div>';}
