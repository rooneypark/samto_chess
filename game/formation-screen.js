import {generalPortraitHolder} from './general-portrait-holder.js';
import {formationTemplate} from './formation-template.js';
import {artworkScreenTemplate} from './artwork-screen-template.js';
import {artworkShell} from './ui-shell.js';
import {paintArtworkLayout} from './art-layout.js';
import {placeArtwork} from './art-controls.js';
import {nineSlice,disposeNineSlices} from './nine-slice.js';
import {heroes} from './heroes.js';
import {synergyTiers,synergyLabel,synergies} from './factions.js';
import {activeBonds} from './bonds.js';
import {createArtworkScreen} from './artwork-screen.js';
export function initFormationScreen({host,store,navigate,toast,onWallet,onSaved}){
const root=createArtworkScreen({host,sharedShell:true,className:'formation-runtime',label:'장수 편성',template:formationTemplate,navigate,onWallet}),$=s=>root.querySelector(s);
let party=[],baseline=[],selected=0,candidate=null,returnTab='barracks',busy=false,revision=0;
const hero=id=>heroes.find(h=>h.id===id);
const ready=paintArtworkLayout(root,{stablePixels:true});placeArtwork($('.bench'),[50,850,841,148]);
function card(id,index,bench){const h=hero(id),b=document.createElement('button');b.className='hero-card';b.dataset[bench?'bench':'slot']=bench?id:index;b.setAttribute('aria-pressed',String(bench?id===candidate:index===selected));const portrait=generalPortraitHolder(h);b.append(portrait);const info=document.createElement('span');info.className='info';info.innerHTML=`<span class="number">${bench?'대기':(index+1)+'번'}</span><b>${h.name}</b><small>${h.faction} · Lv.${store.get().heroes[id].level}</small>`;b.append(info);if(!bench)placeArtwork(b,[50+index%3*286,344+Math.floor(index/3)*150,269,134]);b.onclick=()=>{if(bench)candidate=id;else selected=index;draw()};return b;}
function renderSynergies(){
 const units=party.map(id=>({hero:id,faction:hero(id).faction}));
 const tiers=synergyTiers(units);
 const factions=[['위','wei','공격'],['촉','shu','HP'],['오','wu','전법'],['군웅','qun','공속']];
 $('.synergies').replaceChildren(...factions.map(([name,icon,stat])=>{
  const count=units.filter(unit=>unit.faction===name).length;
  const tier=tiers[name]?.tier;
  const entry=document.createElement('div');
  entry.className='synergy';
  entry.classList.toggle('active',Boolean(tier));
  const image=new Image();
  image.src='assets/ui-temp/faction-'+icon+'.png';
  image.alt='';
  const label=document.createElement('span');
  label.textContent=name+' '+count+'명';
  const effect=document.createElement('span');
  effect.className='synergy-effect';
  effect.textContent=tier?stat+' +'+Math.round(synergies[name].tiers[tier-1]*100)+'%':'2명부터 활성';
  entry.title=tier?synergyLabel(name,tier):name+' 장수 2명부터 활성';
  entry.append(image,label,effect);
  return entry;
 }));
 const active=activeBonds(units);
 const rows=active.map(({bond,present})=>{
  const content=document.createElement('div');
  const name=document.createElement('strong');
  name.textContent=bond.name;
  const members=document.createElement('span');
  members.textContent=present.map(id=>hero(id).name).join(' · ');
  const effect=document.createElement('small');
  effect.textContent=bond.text;
  content.append(name,members,effect);
  return bondRow(content);
 });
 if(!rows.length){
  const empty=document.createElement('span');
  empty.textContent='활성 인연 없음';
  rows.push(bondRow(empty));
 }
 $('.bond').replaceChildren(...rows);
}
function bondRow(content){
 const row=document.createElement('div');
 row.className='bond-row';
 const mark=document.createElement('i');
 mark.className='bond-mark';
 mark.setAttribute('aria-hidden','true');
 row.append(mark,content);
 return row;
}
async function render(){const token=++revision;await ready;if(root.hidden||busy||token!==revision)return;root.inert=true;root.setAttribute('aria-busy','true');const state=store.get();artworkShell(root,{screen:'home',title:'장수 편성',progress:state,controlsRoot:root});const jobs=[],bench=heroes.filter(h=>state.heroes[h.id]?.owned&&!party.includes(h.id)).map(h=>h.id),scroll=$('.bench').scrollTop;root.querySelector('[data-box="500,790,391,44"]').textContent='보유 장수만 표시 · '+bench.length+'명';if(!bench.includes(candidate))candidate=bench[0];for(const sel of ['.formation-party','.bench']){disposeNineSlices($(sel));$(sel).replaceChildren();}party.forEach((id,i)=>{const b=card(id,i,false);$('.formation-party').append(b);jobs.push(nineSlice(b,i===selected?'green':'blue',{stablePixels:true}));});bench.forEach((id,i)=>{const b=card(id,i,true);$('.bench').append(b);jobs.push(nineSlice(b,id===candidate?'green':'blue',{stablePixels:true}));});
$('.bench').scrollTop=scroll;if(!bench.length){const p=document.createElement('p');p.className='empty';p.textContent='대기 중인 보유 장수가 없습니다.';$('.bench').append(p);}$('.save').disabled=party.join('|')===baseline.join('|');$('.save').textContent=$('.save').disabled?'저장된 편성':'편성 저장';$('.previous').disabled=selected===0;$('.next').disabled=selected===5;$('.replace').disabled=!candidate;const swapLabel=candidate?hero(party[selected]).name+' ↔ '+hero(candidate).name:'대기 장수 없음';$('.replace').textContent=swapLabel.length>9?'선택 장수 교체':swapLabel;$('.replace').setAttribute('aria-label',swapLabel);$('.replace').title=swapLabel;
renderSynergies();
await Promise.all([...jobs,document.fonts.ready]);if(token===revision&&!root.hidden){root.inert=false;root.setAttribute('aria-busy','false');}}
async function draw(){try{await render()}catch(e){root.inert=false;root.setAttribute('aria-busy','false');toast('편성을 표시하지 못했습니다. '+e.message)}}
for(const [cls,delta]of [['.previous',-1],['.next',1]])$(cls).onclick=()=>{const n=selected+delta;if(n<0||n>=party.length)return;[party[selected],party[n]]=[party[n],party[selected]];selected=n;draw()};$('.replace').onclick=()=>{if(!candidate)return;const previous=party[selected];party[selected]=candidate;candidate=previous;draw()};

root.querySelectorAll('.home-back,#barracks-back').forEach(b=>b.onclick=()=>navigate(returnTab));root.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]')){e.stopImmediatePropagation();navigate(returnTab)}},true);
$('.save').onclick=async()=>{if(busy||$('.save').disabled)return;busy=true;revision++;root.inert=true;root.setAttribute('aria-busy','true');const draft=[...party];try{await store.transact(s=>{if(s.order.join('|')!==baseline.join('|'))throw Error('다른 곳에서 편성이 변경되었습니다. 편성 화면을 다시 열어 주세요.');if(draft.length!==6||new Set(draft).size!==6||draft.some(id=>!s.heroes[id]?.owned))throw Error('보유 장수 6명을 중복 없이 편성하세요.');return {...s,order:draft};});baseline=[...draft];onSaved();navigate(returnTab);toast('편성 저장 완료');}catch(e){toast(e.message==='저장 거래가 취소되었습니다.'?'편성 저장 실패':e.message,'error');}finally{busy=false;if(!root.hidden)await draw();}};
store.subscribe(()=>{if(!root.hidden&&!busy)draw()});return {show(visible,from){revision++;root.hidden=!visible;host.classList.toggle('formation-art',visible);if(visible){returnTab=['home','barracks','arena','campaign'].includes(from)?from:'barracks';$('.home-back').textContent='취소 · '+({home:'성문',barracks:'병영',arena:'대전',campaign:'전역'}[returnTab]);party=[...store.get().order];baseline=[...party];selected=0;candidate=null;$('.bench').scrollTop=0;draw();}}};
}
