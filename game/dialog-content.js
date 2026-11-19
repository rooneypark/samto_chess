// Saved names and user input must pass through this before entering innerHTML.
export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export function dialogRow(label,value){
 return '<div class="game-dialog-row"><span>'+label+'</span><strong>'+value+'</strong></div>';
}
export function dialogHero(hero,detail,star=1,plain=false){
 return '<div class="game-dialog-hero'+(plain?' growth-success-hero':'')+'"><img src="'+hero.portrait+'" alt=""><div><h3>'+hero.name+'</h3><div class="game-dialog-stars">'+'★'.repeat(star)+'☆'.repeat(5-star)+'</div><small>'+detail+'</small></div></div>';
}
export function growthSuccess(open, hero, train, before, after){
 const detail=train ? 'Lv.'+before.level+' → Lv.'+after.level : before.star+'성 → '+after.star+'성';
 open(train?'훈련 성공':'각성 성공',dialogHero(hero,detail,after.star,true));
}
export function dialogEmpty(icon,message){
 return '<div class="game-dialog-empty"><i class="icon icon-'+icon+'"></i><p>'+message+'</p></div>';
}
export function dialogInset(content){return '<div class="game-dialog-inset">'+content+'</div>';}
