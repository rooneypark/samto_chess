import {artworkShell} from './ui-shell.js';
import {paintArtworkLayout} from './art-layout.js';
import {nineSlice,disposeNineSlices} from './nine-slice.js';
import {placeArtwork} from './art-controls.js';
import {createArtworkScreen} from './artwork-screen.js';
import {generalPortrait,portraitCrops} from './general-portraits.js';
import {treasureDefs,treasureQuote,manageTreasure} from './treasures.js';
import {treasureTemplate} from './treasure-template.js';
import {heroes,activeRoster} from './heroes.js';
const definition=item=>treasureDefs.find(d=>d.id===item.defId);
const ownerOf=(s,id)=>heroes.find(h=>s.heroes[h.id]?.treasure===id);
const materialsFor=(s,item)=>s.treasures.filter(m=>m.id!==item.id&&m.defId===item.defId&&m.star===1&&!m.locked&&!m.favorite&&!ownerOf(s,m.id));
const icon=d=>`<i class="symbol" style="background-image:url(${d.artwork});background-size:contain;background-position:center;background-repeat:no-repeat"></i>`;
export function initTreasureScreen({host,store,navigate,toast,onWallet,dialog}){
 const root=createArtworkScreen({host,sharedShell:true,className:'treasure-runtime',label:'보물함',template:treasureTemplate,navigate,onWallet}),$=s=>root.querySelector(s);
 const ready=paintArtworkLayout(root,{stablePixels:true});let chosen=null,filter='all',busy=false,revision=0;
 $('.items').dataset.box='50,432,841,300';placeArtwork($('.items'),[50,432,841,300]);
 $('.count').parentElement.nextElementSibling.classList.add('list-caption');$('.count').parentElement.nextElementSibling.textContent='개별 보물 목록';
 async function render(){const version=++revision;await ready;if(root.hidden||busy||version!==revision)return;root.inert=true;root.setAttribute('aria-busy','true');
 const state=store.get(),list=state.treasures.filter(item=>filter==='all'||(filter==='equipped'?ownerOf(state,item.id):!ownerOf(state,item.id)));
 if(!list.some(i=>i.id===chosen))chosen=list[0]?.id??null;
 await artworkShell(root,{screen:'barracks',title:'보물함',progress:state,controlsRoot:root});if(root.hidden||version!==revision)return;
 root.querySelectorAll('.art-header .barracks-scroll-heading,.art-header-content.barracks').forEach(e=>e.remove());
 const jobs=[],scroll=$('.items').scrollTop;disposeNineSlices($('.items'));$('.items').replaceChildren();$('.count').textContent=' · '+list.length+' / '+state.treasures.length+'개';
 for(const item of list){const def=definition(item),owner=ownerOf(state,item.id),b=document.createElement('button');b.className='card';b.dataset.item=item.id;b.setAttribute('aria-pressed',String(item.id===chosen));b.innerHTML=icon(def)+`<b>${def.name}</b><small>${def.grade} · ${item.star}성 · ${owner?owner.name:item.locked?'잠금':item.favorite?'관심':'미장착'}</small>`;$('.items').append(b);jobs.push(nineSlice(b,item.id===chosen?'green':'blue',{stablePixels:true}));b.onclick=()=>{chosen=item.id;draw()};}
 $('.items').scrollTop=scroll;if(!list.length){const p=document.createElement('p');p.className='empty';p.textContent=state.treasures.length?'해당 조건의 보물이 없습니다.':'보유 보물이 없습니다. 상점의 보물 모집에서 획득할 수 있습니다.';$('.items').append(p);}
 for(const b of root.querySelectorAll('[data-filter]')){b.setAttribute('aria-pressed',String(b.dataset.filter===filter));jobs.push(nineSlice(b,b.dataset.filter===filter?'green':'blue',{stablePixels:true}));}
 $('.owner').replaceChildren();$('.detail-icon').hidden=!chosen;
 if(chosen){const {item,def,value,copies,gold}=treasureQuote(state,chosen),owner=ownerOf(state,item.id),materials=materialsFor(state,item),max=item.star===5;
 $('.title').textContent=def.name+' · '+def.grade;$('.stars').textContent='★'.repeat(item.star)+'☆'.repeat(5-item.star);$('.detail-icon').style.backgroundImage='url('+def.artwork+')';$('.effect').textContent=def.effect.split('+')[0]+'+'+Number((value*100).toFixed(2))+'%';$('.next').textContent=max?'최대 성급':item.star+'성 → '+(item.star+1)+'성 · +'+Number((def.value*(1+.25*item.star)*100).toFixed(2))+'%';
 if(owner){if(portraitCrops[owner.id])$('.owner').append(generalPortrait(owner.id));else{const img=new Image();img.className='fallback';img.src=owner.portrait;img.alt=owner.name;$('.owner').append(img);}$('.owner').append(document.createTextNode('장착 장수 · '+owner.name));}else $('.owner').textContent='미장착 · 장수를 선택해 장착';
 $('.equip').textContent=owner?'장착 관리':'장수 선택';$('.material').innerHTML=max?'최대 5성에 도달했습니다.':icon(def)+`동일 보물 1성 · 필요 ${copies}개 / 가능 ${materials.length}개`;
 $('.cost').textContent=max?'추가 강화 비용 없음':'강화 비용 · '+gold.toLocaleString()+' 골드 / 보유 '+state.gold.toLocaleString();
 $('.enhance').disabled=!!state.battleRun||max||materials.length<copies||state.gold<gold;$('.equip').disabled=!!state.battleRun;
 $('.enhance').textContent=state.battleRun?'출정 중 변경 불가':max?'최대 성급':materials.length<copies?'강화 재료 부족':state.gold<gold?'골드 부족':'강화 확인';
 }else{for(const cls of ['.stars','.effect','.next','.material','.cost'])$(cls).textContent='';$('.title').textContent='보물을 선택해 주세요';$('.owner').textContent='';$('.equip').disabled=true;$('.enhance').disabled=true;$('.enhance').textContent='강화 확인';}
 await Promise.all([...jobs,document.fonts.ready]);if(version===revision&&!root.hidden){root.inert=false;root.setAttribute('aria-busy','false');}}
 async function draw(){try{await render()}catch(e){root.inert=false;root.setAttribute('aria-busy','false');toast('보물함을 표시하지 못했습니다. '+e.message)}}
 async function commit(change){if(busy)return;busy=true;const confirm=document.querySelector('#treasure-confirm');if(confirm)confirm.disabled=true;try{await store.transact(change);dialog.dismiss();toast('보물 변경 완료');}catch(e){toast('저장하지 못했습니다. '+e.message);if(confirm)confirm.disabled=false;}finally{busy=false;draw()}}
 function equip(){const id=chosen,s=store.get(),owner=ownerOf(s,id);if(!id||s.battleRun)return;
 dialog.open('보물 장착 · 해제',`<p>${definition(s.treasures.find(i=>i.id===id)).name} · ${owner?owner.name+' 장착 중':'미장착'}</p>${owner?'<button class="action secondary" id="treasure-unequip">장착 해제</button>':''}<p>장수를 선택하세요. 기존 장착 보물은 보물함에 보관됩니다.</p><div class="selection-grid">${activeRoster.filter(h=>s.heroes[h.id]?.owned).map(h=>`<button class="action secondary" data-equip-hero="${h.id}">${h.name}${s.heroes[h.id].treasure?' · 장착 중':''}</button>`).join('')}</div>`);
 const confirmFor=hero=>{dialog.open('장착 변경 확인',`<p>${hero?heroes.find(h=>h.id===hero).name+'에게 장착합니다.':'현재 장착을 해제합니다.'}</p><div class="modal-actions"><button class="action secondary" id="treasure-cancel">취소</button><button class="action" id="treasure-confirm">확인</button></div>`);document.querySelector('#treasure-cancel').onclick=equip;document.querySelector('#treasure-confirm').onclick=()=>commit(state=>{if(ownerOf(state,id)?.id!==owner?.id)throw Error('장착 상태가 변경되었습니다. 다시 선택하세요.');let next=state;if(owner)next=manageTreasure(next,{type:'equip',id,hero:owner.id});if(hero)next=manageTreasure(next,{type:'equip',id,hero});return next;});};
 document.querySelector('#treasure-unequip')?.addEventListener('click',()=>confirmFor(null));document.querySelectorAll('[data-equip-hero]').forEach(b=>b.onclick=()=>confirmFor(b.dataset.equipHero));}
 function upgrade(){const s=store.get(),id=chosen;if(!id||$('.enhance').disabled)return;const {item,def,copies,gold}=treasureQuote(s,id),star=item.star,materials=materialsFor(s,item).slice(0,copies).map(m=>m.id);
 dialog.open('보물 강화 확인',`<p>${def.name} · ${star}성 → ${star+1}성</p><p>동일 보물 1성 ${copies}개와 ${gold.toLocaleString()}골드를 소모합니다.</p><p>장착·잠금·즐겨찾기 보물은 재료에서 제외됩니다.</p><div class="modal-actions"><button class="action secondary" id="treasure-cancel">취소</button><button class="action" id="treasure-confirm">강화</button></div>`);document.querySelector('#treasure-cancel').onclick=()=>dialog.dismiss();document.querySelector('#treasure-confirm').onclick=()=>commit(state=>{if(treasureQuote(state,id).item.star!==star)throw Error('보물 성급이 변경되었습니다. 다시 확인하세요.');return manageTreasure(state,{type:'upgrade',id,materials});});}
 root.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;$('.items').scrollTop=0;draw()});$('.equip').onclick=equip;$('.enhance').onclick=upgrade;
 root.querySelectorAll('.home-back,#barracks-back').forEach(b=>b.onclick=()=>navigate('barracks'));
 store.subscribe(()=>{if(!root.hidden&&!busy)draw()});return {show(visible,hero){revision++;root.hidden=!visible;host.classList.toggle('treasure-art',visible);if(visible){if(hero?.treasureId&&store.get().treasures.some(t=>t.id===hero.treasureId)){filter='all';chosen=hero.treasureId;}else if(hero&&store.get().heroes[hero]?.treasure){filter='all';chosen=store.get().heroes[hero].treasure;}draw();}}};
}
