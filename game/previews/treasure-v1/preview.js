import {treasureTemplate} from '../../treasure-template.js';
import {artworkScreenTemplate} from '../../artwork-screen-template.js';
import {artworkShell} from '../../ui-shell.js';
import {paintArtworkLayout} from '../../art-layout.js';
import {nineSlice,disposeNineSlices} from '../../nine-slice.js';
import {placeArtwork} from '../../art-controls.js';
import {generalPortrait} from '../../general-portraits.js';
import {treasureDefs,treasureQuote} from '../../treasures.js';
const root=document.querySelector('.game'),$=s=>root.querySelector(s);
root.innerHTML=treasureTemplate;
let chosen='dragon',filter='all';const owners={dragon:['32','조조'],strategy:['35','제갈량'],tiger:['xuchu','허저']};
const ids=['dragon','strategy','tiger','jade','haste','bronze'];const positions={gold:'33.333% 100%',scroll:'66.667% 50%',helmet:'33.333% 0',gem:'66.667% 100%',banner:'100% 0',swords:'0 50%'};
const state={gold:12450,diamonds:320,treasures:ids.map(id=>({id,defId:id,star:id==='dragon'?2:1}))};
function icon(id){return `<i class="symbol" style="background-position:${positions[treasureDefs.find(t=>t.id===id).icon]}"></i>`;}
await paintArtworkLayout(root,{stablePixels:true});
async function render(){root.inert=true;root.setAttribute('aria-busy','true');await artworkShell(root,{screen:'barracks',title:'보물함',progress:state});root.querySelectorAll('.art-header .barracks-scroll-heading,.art-header-content.barracks').forEach(e=>e.remove());$('.scroll-heading').textContent='보물을 갖추고 장수를 강하게';const jobs=[];disposeNineSlices($('.items'));$('.items').replaceChildren();
const list=ids.filter(id=>filter==='all'||(filter==='equipped'?owners[id]:!owners[id]));$('.count').textContent=' · '+list.length+'종 / 14개';
list.forEach((id,i)=>{const def=treasureDefs.find(t=>t.id===id),item=state.treasures.find(t=>t.id===id),b=document.createElement('button');b.className='card';b.dataset.item=id;b.setAttribute('aria-pressed',String(id===chosen));b.innerHTML=icon(id)+`<b>${def.name}</b><small>${def.grade} · ${item.star}성 · ${owners[id]?owners[id][1]+' 장착':'미장착'}</small>`;placeArtwork(b,[50+i%3*286,432+Math.floor(i/3)*156,269,144]);$('.items').append(b);jobs.push(nineSlice(b,id===chosen?'green':'blue',{stablePixels:true}));b.onclick=()=>{chosen=id;render()};});
for(const b of root.querySelectorAll('[data-filter]')){b.setAttribute('aria-pressed',String(b.dataset.filter===filter));jobs.push(nineSlice(b,b.dataset.filter===filter?'green':'blue',{stablePixels:true}));}
const q=treasureQuote(state,chosen),{item,def,value,copies,gold}=q;$('.title').textContent=def.name+' · '+def.grade;$('.stars').textContent='★'.repeat(item.star)+'☆'.repeat(5-item.star);$('.detail-icon').style.backgroundPosition=positions[def.icon];$('.effect').textContent=def.effect.split('+')[0]+'+'+Math.round(value*100)+'%';$('.next').textContent=item.star+'성 → '+(item.star+1)+'성 · +'+Math.round(def.value*(1+.25*item.star)*100)+'%';$('.owner').replaceChildren();if(owners[chosen]){$('.owner').append(generalPortrait(owners[chosen][0]),document.createTextNode('장착 장수 · '+owners[chosen][1]));}else $('.owner').textContent='미장착 · 장수를 선택해 장착';$('.equip').textContent=owners[chosen]?'장수 변경':'장수 선택';$('.material').innerHTML=icon(chosen)+`동일 보물 1성 · 필요 ${copies}개 / 사용 가능 ${chosen==='dragon'?4:2}개`;
$('.cost').textContent='강화 비용 · '+gold.toLocaleString()+' 골드 / 보유 12,450';await Promise.all([...jobs,document.fonts.ready]);root.inert=false;root.setAttribute('aria-busy','false');}
root.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;render()});
const notify=()=>{let n=document.querySelector('.preview-status');if(!n){n=document.createElement('div');n.className='preview-status';document.body.append(n);}n.textContent='검토용 시안입니다. 실제 보물과 재화는 변경하지 않습니다.';clearTimeout(notify.timer);notify.timer=setTimeout(()=>n.remove(),2200)};
root.querySelectorAll('.equip,.enhance,.home-back,#barracks-back,.bottom-nav button,.wallet button').forEach(b=>b.onclick=notify);await render();
