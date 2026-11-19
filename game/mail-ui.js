import {artSet} from './art.js';
import {mailTemplate} from './mail-ui-template.js';
import {artworkShell} from './ui-shell.js';
import {placeArtwork,uiComponentsReady} from './art-controls.js';
import {paintArtworkLayout} from './art-layout.js';
import {nineSlice,disposeNineSlices} from './nine-slice.js';
import {mailAvailable,mailStatus} from './mail-model.js';
import {currencyLabels,rewardText} from './services-ui.js';
export const mailArtwork=artSet==='a';
const revisions=new WeakMap(),DAY=86400000;
export function invalidateMailArtwork(root){revisions.set(root,(revisions.get(root)??0)+1);disposeNineSlices(root);}
const stamp=t=>{const d=new Date(t+9*3600000);return (d.getUTCMonth()+1)+'.'+String(d.getUTCDate()).padStart(2,'0')+' '+String(d.getUTCHours()).padStart(2,'0')+':'+String(d.getUTCMinutes()).padStart(2,'0');};
function setRewards(el,reward,empty=''){
 el.replaceChildren();const entries=Object.entries(reward??{}).filter(([,v])=>Number.isFinite(v)&&v>0).sort(([a],[b])=>(a==='gold'?0:a==='freeDiamonds'?1:2)-(b==='gold'?0:b==='freeDiamonds'?1:2));
 el.classList.toggle('many-rewards',entries.length>2||entries.some(([k])=>!['gold','freeDiamonds'].includes(k)));el.title=entries.length?rewardText(Object.fromEntries(entries)):empty;
 const compact=!el.classList.contains('detail-rewards'),extra=compact?entries.filter(([key])=>!['gold','freeDiamonds'].includes(key)):[],shown=compact?entries.filter(([key])=>['gold','freeDiamonds'].includes(key)):entries;
 shown.forEach(([key,value],i)=>{
  if(i){const gap=document.createElement('span');gap.className='reward-space';el.append(gap);}
  if(key==='gold'||key==='freeDiamonds'){const img=new Image();img.src='assets/shop-v2/'+(key==='gold'?'coin':'gem')+'.png';img.alt=currencyLabels[key];el.append(img);}
  else{const label=document.createElement('span');label.className='reward-other';label.textContent=currencyLabels[key]??'기타 보상';el.append(label);}
  const amount=document.createElement('b');amount.textContent=value.toLocaleString();el.append(amount);
 });if(extra.length){const label=document.createElement('span');label.className='reward-other';label.textContent=(shown.length?'외 ':'보상 ')+extra.length+'종';el.append(label);}if(!entries.length){const b=document.createElement('b');b.textContent=empty;el.append(b);}if(!compact)el.tabIndex=0;
}
export async function renderMailArtwork(game,{state,view,actions}){
 const $=s=>game.querySelector(s);disposeNineSlices(game);game.innerHTML=mailTemplate;
 artworkShell(game,{screen:'home',title:'우편함',progress:state,controlsRoot:game});
 const token=(revisions.get(game)??0)+1;revisions.set(game,token);game.inert=true;game.setAttribute('aria-busy','true');
 const {all,waiting,claimed,visible,pages,page,selected,tab,now,total}=view,available=m=>mailAvailable(m,now),status=m=>mailStatus(m,now);
 $('.summary-title b').textContent=waiting.length+'통';setRewards($('.summary-rewards'),total,!waiting.length?'받을 보상 없음':'첨부 보상 없음');

 const painting=[paintArtworkLayout(game),uiComponentsReady];for(const b of game.querySelectorAll('[data-tab]')){b.setAttribute('aria-pressed',String(b.dataset.tab===tab));b.querySelector('small').textContent=({all,available:waiting,claimed})[b.dataset.tab].length;painting.push(nineSlice(b,b.dataset.tab===tab?'green':'blue'));}
 const rows=$('.mail-rows');disposeNineSlices(rows);rows.replaceChildren();
 visible.forEach((m,i)=>{const b=document.createElement('button');b.className='mail-row'+(m.claimedAt?' claimed':m.expireAt<=now?' expired':'');b.dataset.mail=m.id;b.setAttribute('aria-pressed',String(m.id===selected));b.setAttribute('aria-label',m.title+' · '+status(m));
  b.innerHTML='<strong class="row-title"></strong><span class="row-state"></span><span class="row-rewards"></span><span class="row-expiry"></span>';
  b.querySelector('.row-title').textContent=m.title;b.querySelector('.row-title').title=m.title;b.querySelector('.row-state').textContent=m.claimedAt?'✓ 수령 완료':m.expireAt<=now?'기한 만료':Math.ceil((m.expireAt-now)/DAY)+'일 남음';setRewards(b.querySelector('.row-rewards'),m.attachments,'첨부 없음');b.querySelector('.row-expiry').textContent=stamp(m.claimedAt??m.expireAt)+(m.claimedAt?' 수령':'까지');
  placeArtwork(b,[20,524+i*158,901,140]);b.onclick=()=>actions.select(m.id);rows.append(b);painting.push(nineSlice(b,m.id===selected?'green':'blue'));
 });
 $('.empty-list').hidden=visible.length>0;$('.page-prev').disabled=page===0;$('.page-next').disabled=page===pages-1;$('.page-count').textContent=(page+1)+' / '+pages;
 const m=view.chosen;$('.detail-title').textContent=m?.title??'선택한 우편 없음';$('.detail-status').textContent=m?status(m):'';$('.detail-status').classList.toggle('expired',!!m&&!m.claimedAt&&m.expireAt<=now);$('.detail-body').textContent=m?.body??'다른 탭에서 우편을 확인해 주세요.';$('.detail-title').title=m?.title??'';$('.detail-body').classList.toggle('long-body',(m?.body??'').length>40||!!m?.body?.includes('\n'));$('.detail-body').tabIndex=0;setRewards($('.detail-rewards'),m?.attachments??{},m?'첨부 보상 없음':'');
 const claim=$('.claim-mail');claim.disabled=!m||!available(m);claim.textContent=!m?'보상 받기':m.claimedAt?'수령 완료':m.expireAt<=now?'기한 만료':'보상 받기';$('.delete-mail').hidden=claim.hidden=!m;$('.delete-mail').disabled=!m;$('.claim-all').disabled=!waiting.length;
 painting.push(nineSlice(claim,claim.disabled?'blue':'green'));
 $('#barracks-back').id='mail-back';$('#mail-back').onclick=$('.home-back').onclick=()=>actions.navigate('home');
 game.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>actions.tab(b.dataset.tab));
 $('.page-prev').onclick=()=>actions.page(-1);$('.page-next').onclick=()=>actions.page(1);
 $('.claim-mail').onclick=()=>actions.claim(selected);$('.claim-all').onclick=actions.claimAll;$('.delete-mail').onclick=()=>actions.remove(selected);
 game.querySelectorAll('.bottom-nav button').forEach(b=>b.onclick=()=>actions.navigate(b.dataset.action));
 game.querySelectorAll('.wallet button').forEach((b,i)=>{b.setAttribute('aria-label',(i?'다이아 ':'골드 ')+state[i?'diamonds':'gold'].toLocaleString());b.onclick=actions.wallet;});
 await Promise.all([...painting,document.fonts.ready,...Array.from(game.querySelectorAll('img'),img=>img.decode())]);if(token===revisions.get(game)){game.querySelectorAll('.bottom-nav button').forEach(b=>b.tabIndex=0);game.inert=false;game.setAttribute('aria-busy','false');}
}
