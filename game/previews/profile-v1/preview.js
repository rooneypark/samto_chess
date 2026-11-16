import {profileTemplate} from '../../profile-template.js';
import {artworkScreenTemplate} from '../../artwork-screen-template.js';
import {artworkShell} from '../../ui-shell.js';
import {paintArtworkLayout} from '../../art-layout.js';
import {nineSlice} from '../../nine-slice.js';
import {placeArtwork} from '../../art-controls.js';
import {generalPortrait} from '../../general-portraits.js';
import {lordReward,lordXpForNext} from '../../services.js';
const root=document.querySelector('.game'),$=s=>root.querySelector(s);
root.innerHTML=profileTemplate;
$('.face').append(generalPortrait('32'));const next=lordXpForNext(8),xp=Math.floor(next*.62);$('.xp-label').textContent='군주 경험치 · '+xp+' / '+next;$('.xp i').style.width=xp/next*100+'%';
let selected=8;await paintArtworkLayout(root,{stablePixels:true});artworkShell(root,{screen:'home',title:'군주 정보',progress:{gold:12450,diamonds:320}});
const format=r=>r.gold+' 골드'+(r.freeDiamonds?' · 무료 다이아 '+r.freeDiamonds:'');
for(const [i,level] of [6,7,8,9,10,11].entries()){const b=document.createElement('button'),reward=lordReward(level);b.className='reward';b.dataset.level=level;b.innerHTML=`<b>Lv.${level}</b><strong>${reward.gold} 골드</strong><small>${reward.freeDiamonds?'무료 다이아 '+reward.freeDiamonds:level<=7?'✓ 수령 완료':level===8?'◆ 수령 가능':'잠김 · 레벨 달성 필요'}</small>`;placeArtwork(b,[50+i%3*286,700+Math.floor(i/3)*140,269,124]);$('.rewards').append(b);b.onclick=()=>{selected=level;render()};}
async function render(){root.inert=true;root.setAttribute('aria-busy','true');await Promise.all([...root.querySelectorAll('[data-level]')].map(b=>{b.setAttribute('aria-pressed',String(+b.dataset.level===selected));return nineSlice(b,+b.dataset.level===selected?'green':'blue',{stablePixels:true})}));$('.selected-reward').textContent='Lv.'+selected+' · '+format(lordReward(selected))+' · '+(selected<8?'수령 완료':selected===8?'수령 가능':'미달성');await document.fonts.ready;root.inert=false;root.setAttribute('aria-busy','false');}
const notify=()=>{let n=document.querySelector('.preview-status');if(!n){n=document.createElement('div');n.className='preview-status';document.body.append(n)}n.textContent='검토용 시안입니다. 실제 레벨·재화·보상은 변경하지 않습니다.';clearTimeout(notify.timer);notify.timer=setTimeout(()=>n.remove(),2200)};
root.querySelectorAll('.claim,.government,.home-back,#barracks-back,.bottom-nav button,.wallet button').forEach(b=>b.onclick=notify);await render();
