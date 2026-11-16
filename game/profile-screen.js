import {artworkShell} from './ui-shell.js';
import {paintArtworkLayout} from './art-layout.js';
import {nineSlice,disposeNineSlices} from './nine-slice.js';
import {placeArtwork} from './art-controls.js';
import {createArtworkScreen} from './artwork-screen.js';
import {generalPortrait} from './general-portraits.js';
import {lordLevel,lordReward,unclaimedLordRewards,lordMaxLevel,serviceCommand} from './services.js';
import {nextUnlocks,unlocked} from './unlocks.js';
import {governmentUnlocked} from './government.js';
import {heroes} from './heroes.js';
import {profileTemplate} from './profile-template.js';
const format=r=>r.gold.toLocaleString()+' 골드'+(r.freeDiamonds?' · 무료 다이아 '+r.freeDiamonds.toLocaleString():'');
export function initProfileScreen({host,store,navigate,toast,onWallet}){
 const root=createArtworkScreen({host,sharedShell:true,className:'profile-runtime',label:'군주 정보',template:profileTemplate,navigate,onWallet}),$=s=>root.querySelector(s);
 const ready=paintArtworkLayout(root,{stablePixels:true});placeArtwork($('.rewards'),[50,700,841,264]);$('.face').append(generalPortrait('32'));
 const info=root.querySelector('[data-box="310,478,551,36"]'),available=root.querySelector('[data-box="660,637,231,44"]'),rows=[...root.querySelectorAll('.unlock-row')];
 $('.government').id='government-open';$('.claim').id='lord-reward';
 let selected=2,busy=false,revision=0,jump=false;
 function stateLabel(s,n){return n>lordLevel(s).level?'미달성':s.services?.lord?.claimed?.[n]?'수령 완료':'수령 가능'}
 async function render(){const token=++revision;await ready;if(root.hidden||busy||token!==revision)return;root.inert=true;root.setAttribute('aria-busy','true');const s=store.get(),l=lordLevel(s),waiting=unclaimedLordRewards(s);
 artworkShell(root,{screen:'home',title:'군주 정보',progress:s,controlsRoot:root});$('.heading').textContent='군주 · Lv.'+l.level;$('.xp-label').textContent=l.next?'군주 경험치 · '+l.xp.toLocaleString()+' / '+l.next.toLocaleString():'최고 레벨 · Lv.'+lordMaxLevel;$('.xp i').style.width=(l.next?l.xp/l.next*100:100)+'%';$('.xp').setAttribute('role','progressbar');$('.xp').setAttribute('aria-label','군주 경험치');$('.xp').setAttribute('aria-valuemin','0');$('.xp').setAttribute('aria-valuemax',String(l.next||1));$('.xp').setAttribute('aria-valuenow',String(l.next?l.xp:1));
 info.textContent='출전 장수 '+s.order.length+'명 · 보유 장수 '+Object.values(s.heroes).filter(h=>h.owned).length+' / '+heroes.length;available.textContent='수령 가능 · '+waiting.length+'개';
 const list=$('.rewards'),scroll=list.scrollTop;disposeNineSlices(list);list.replaceChildren();const jobs=[];
 for(let n=2;n<=lordMaxLevel;n++){const reward=lordReward(n),b=document.createElement('button');b.className='reward';b.dataset.level=n;b.setAttribute('aria-pressed',String(n===selected));b.innerHTML=`<b>Lv.${n}</b><strong>${reward.gold} 골드</strong><small>${reward.freeDiamonds?'다이아 '+reward.freeDiamonds+' · ':''}${stateLabel(s,n)}</small>`;list.append(b);jobs.push(nineSlice(b,n===selected?'green':'blue',{stablePixels:true}));b.onclick=()=>{selected=n;draw()};}
 if(jump){list.scrollTop=Math.max(0,Math.floor((selected-2)/3)-1)*140*root.getBoundingClientRect().width/941;jump=false;}else list.scrollTop=scroll;
 $('.selected-reward').textContent='Lv.'+selected+' · '+format(lordReward(selected))+' · '+stateLabel(s,selected);
 const total=waiting.reduce((r,n)=>{const a=lordReward(n);r.gold+=a.gold;r.freeDiamonds+=a.freeDiamonds||0;return r},{gold:0,freeDiamonds:0});$('.claim').disabled=!waiting.length;$('.claim').textContent=waiting.length?'레벨 보상 받기 · '+format(total):'현재 레벨 보상 수령 완료';
 const groups=[];for(const u of nextUnlocks(s).filter(u=>!unlocked(s,u.feature))){let g=groups.find(g=>g.level===u.level);if(!g){g={level:u.level,names:[]};groups.push(g);}g.names.push(u.name);}rows.forEach((row,i)=>{const u=groups[i];row.replaceChildren();if(u){const b=document.createElement('b');b.textContent='Lv.'+u.level;row.append(b,document.createTextNode(u.names.join(' · ')));}else row.textContent=i===0?'모든 군주 레벨 기능이 열렸습니다.':'';});
 $('.government').textContent=governmentUnlocked(s)?'내정 · 성내 시설':'내정 · 황건 토벌 승리 후';
 await Promise.all([...jobs,document.fonts.ready]);if(token===revision&&!root.hidden){root.inert=false;root.setAttribute('aria-busy','false');}}
 async function draw(){try{await render()}catch(e){root.inert=false;root.setAttribute('aria-busy','false');toast('군주 정보를 표시하지 못했습니다. '+e.message)}}
 $('.claim').onclick=async()=>{if(busy||$('.claim').disabled)return;busy=true;revision++;root.inert=true;root.setAttribute('aria-busy','true');try{await store.transact(s=>serviceCommand(s,{type:'lord-reward'}));toast('레벨 보상 수령 완료');}catch(e){toast('보상을 받지 못했습니다. '+e.message);}finally{busy=false;if(!root.hidden)await draw();}};
 $('.government').onclick=()=>{if(!governmentUnlocked(store.get())){toast('황건 토벌을 처음 승리하면 성내 시설이 열립니다.');return;}navigate('government');};
 store.subscribe(()=>{if(!root.hidden&&!busy)draw()});return {show(visible){revision++;root.hidden=!visible;host.classList.toggle('profile-art',visible);if(visible){const s=store.get();selected=unclaimedLordRewards(s)[0]??Math.max(2,lordLevel(s).level);jump=true;draw();}}};
}
