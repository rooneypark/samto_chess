import {artworkShell,artworkWallet} from '../../ui-shell.js';
import {placeArtwork,uiComponentsReady} from '../../art-controls.js';
import {paintArtworkLayout} from '../../art-layout.js';
import {nineSlice,disposeNineSlices} from '../../nine-slice.js';
import {createGameStore} from '../../store.js';
import {prepareServices,serviceCommand,periodBonus,questDefs} from '../../services.js';

// Design example only: no localStorage/IndexedDB or real player profile access.
const now=Date.UTC(2026,10,13,20),DAY=86400000,game=document.querySelector('.game'),$=s=>game.querySelector(s);
let state=createGameStore({getItem:()=>null,setItem(){}}).get(),tab='all',page=0,selected='weekly-bonus',revision=0;
prepareServices(state,now);state.gold=12450;state.diamonds=state.freeDiamonds=320;
const quest=id=>({gold:questDefs.find(d=>d.id===id).gold});
state.services.mail=[
 {id:'weekly-bonus',title:'임무 완료 보너스',body:'지난 주 임무를 모두 완료한 보상입니다.',createdAt:now-2*DAY,expireAt:now+5*DAY,attachments:{...periodBonus.week},claimedAt:null},
 {id:'daily-run',title:'출정 완료 미수령 보상',body:'지난 기간에 완료한 임무 보상입니다.',createdAt:now-5*DAY,expireAt:now+2*DAY,attachments:quest('daily_run'),claimedAt:null},
 {id:'daily-merge',title:'장수 합성 미수령 보상',body:'지난 기간에 완료한 임무 보상입니다.',createdAt:now-4*DAY,expireAt:now+3*DAY,attachments:quest('daily_merge'),claimedAt:now-DAY},
 {id:'daily-skill',title:'전법 사용 미수령 보상',body:'보관 기한이 지나 보상을 받을 수 없습니다.',createdAt:now-8*DAY,expireAt:now-DAY,attachments:quest('daily_skill'),claimedAt:null}
];
const coin='<img src="assets/shop-v2/coin.png" alt="골드">',gem='<img src="assets/shop-v2/gem.png" alt="무료 다이아">';
const rewards=r=>(r.gold?coin+'<b>'+r.gold.toLocaleString()+'</b>':'')+(r.gold&&r.freeDiamonds?'<span class="reward-space"></span>':'')+(r.freeDiamonds?gem+'<b>'+r.freeDiamonds.toLocaleString()+'</b>':'');
const available=m=>!m.claimedAt&&m.expireAt>now,status=m=>m.claimedAt?'수령 완료':m.expireAt<=now?'기한 만료':'수령 가능';
const stamp=t=>{const d=new Date(t+9*3600000);return (d.getUTCMonth()+1)+'.'+String(d.getUTCDate()).padStart(2,'0')+' '+String(d.getUTCHours()).padStart(2,'0')+':'+String(d.getUTCMinutes()).padStart(2,'0');};
function note(message='우편함 디자인 시안입니다. 실제 저장은 변경하지 않습니다.'){const el=document.querySelector('.preview-status');el.textContent=message;el.hidden=false;clearTimeout(note.timer);note.timer=setTimeout(()=>el.hidden=true,2400);}
artworkShell(game,{screen:'home',title:'우편함',progress:state});await Promise.all([uiComponentsReady,paintArtworkLayout(game)]);
async function render(){
 const token=++revision;game.inert=true;game.setAttribute('aria-busy','true');artworkWallet(game,state);
 const all=state.services.mail,waiting=all.filter(available),claimed=all.filter(m=>m.claimedAt),filtered=tab==='available'?waiting:tab==='claimed'?claimed:all,pages=Math.max(1,Math.ceil(filtered.length/3));page=Math.min(page,pages-1);
 const visible=filtered.slice(page*3,page*3+3);if(!visible.some(m=>m.id===selected))selected=visible[0]?.id??null;
 $('.summary-title b').textContent=waiting.length+'통';$('.summary-rewards').innerHTML=rewards(waiting.reduce((a,m)=>({gold:a.gold+(m.attachments.gold??0),freeDiamonds:a.freeDiamonds+(m.attachments.freeDiamonds??0)}),{gold:0,freeDiamonds:0}))||'<b>수령 완료</b>';
 const painting=[];for(const b of game.querySelectorAll('[data-tab]')){b.setAttribute('aria-pressed',String(b.dataset.tab===tab));b.querySelector('small').textContent=({all,available:waiting,claimed})[b.dataset.tab].length;painting.push(nineSlice(b,b.dataset.tab===tab?'green':'blue'));}
 const rows=$('.mail-rows');disposeNineSlices(rows);rows.replaceChildren();
 visible.forEach((m,i)=>{const b=document.createElement('button');b.className='mail-row'+(m.claimedAt?' claimed':m.expireAt<=now?' expired':'');b.dataset.mail=m.id;b.setAttribute('aria-pressed',String(m.id===selected));b.setAttribute('aria-label',m.title+' · '+status(m));
  b.innerHTML='<strong class="row-title"></strong><span class="row-state"></span><span class="row-rewards"></span><span class="row-expiry"></span>';
  b.querySelector('.row-title').textContent=m.title;b.querySelector('.row-state').textContent=m.claimedAt?'✓ 수령 완료':m.expireAt<=now?'기한 만료':Math.ceil((m.expireAt-now)/DAY)+'일 남음';b.querySelector('.row-rewards').innerHTML=rewards(m.attachments);b.querySelector('.row-expiry').textContent=stamp(m.claimedAt??m.expireAt)+(m.claimedAt?' 수령':'까지');
  placeArtwork(b,[20,524+i*158,901,140]);b.onclick=()=>{selected=m.id;render();};rows.append(b);painting.push(nineSlice(b,m.id===selected?'green':'blue'));
 });
 $('.empty-list').hidden=visible.length>0;$('.page-prev').disabled=page===0;$('.page-next').disabled=page===pages-1;$('.page-count').textContent=(page+1)+' / '+pages;
 const m=all.find(m=>m.id===selected);$('.detail-title').textContent=m?.title??'선택한 우편 없음';$('.detail-status').textContent=m?status(m):'';$('.detail-status').classList.toggle('expired',!!m&&!m.claimedAt&&m.expireAt<=now);$('.detail-body').textContent=m?.body??'다른 탭에서 우편을 확인해 주세요.';$('.detail-rewards').innerHTML=m?rewards(m.attachments):'';
 const claim=$('.claim-mail');claim.disabled=!m||!available(m);claim.textContent=!m?'보상 받기':m.claimedAt?'수령 완료':m.expireAt<=now?'기한 만료':'보상 받기';$('.delete-mail').disabled=!m;$('.claim-all').disabled=!waiting.length;
 painting.push(nineSlice(claim,claim.disabled?'blue':'green'));
 await Promise.all([...painting,document.fonts.ready,...Array.from(game.querySelectorAll('img'),img=>img.decode())]);if(token===revision){game.inert=false;game.setAttribute('aria-busy','false');}
}
game.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;page=0;render();});
$('.page-prev').onclick=()=>{page--;render();};$('.page-next').onclick=()=>{page++;render();};
$('.claim-mail').onclick=async()=>{state=serviceCommand(state,{type:'mail',id:selected},now);await render();note('수령 상태를 미리 보았습니다. 실제 재화는 변경되지 않습니다.');};
$('.claim-all').onclick=async()=>{for(const m of state.services.mail.filter(available))state=serviceCommand(state,{type:'mail',id:m.id},now);await render();note('모두 받기 상태를 미리 보았습니다. 실제 재화는 변경되지 않습니다.');};
$('.delete-mail').onclick=()=>note('우편 삭제는 실제 적용 시 확인 창을 거칩니다. 시안의 우편은 유지합니다.');
game.querySelectorAll('.bottom-nav button,.wallet button,.home-back,#barracks-back').forEach(b=>b.onclick=()=>note());
await render();
