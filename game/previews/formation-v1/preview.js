import {generalPortraitHolder} from '../../general-portrait-holder.js';
import {formationTemplate} from '../../formation-template.js';
import {artworkScreenTemplate} from '../../artwork-screen-template.js';
import {artworkShell} from '../../ui-shell.js';
import {paintArtworkLayout} from '../../art-layout.js';
import {placeArtwork} from '../../art-controls.js';
import {nineSlice,disposeNineSlices} from '../../nine-slice.js';
import {heroes} from '../../heroes.js';
import {synergyTiers,synergyLabel,synergies} from '../../factions.js';
import {activeBonds} from '../../bonds.js';
const root=document.querySelector('.game'),$=s=>root.querySelector(s);
root.innerHTML=formationTemplate;
const originals=['1','xuchu','32','35','diaochan','119'],owned=[...originals,'0','2','33'];let party=[...originals],selected=0,candidate='0';
const hero=id=>heroes.find(h=>h.id===id);
await paintArtworkLayout(root,{stablePixels:true});artworkShell(root,{screen:'home',title:'장수 편성',progress:{gold:12450,diamonds:320}});
function card(id,index,bench){const h=hero(id),b=document.createElement('button');b.className='hero-card';b.dataset[bench?'bench':'slot']=bench?id:index;b.setAttribute('aria-pressed',String(bench?id===candidate:index===selected));const portrait=generalPortraitHolder(h);b.append(portrait);const info=document.createElement('span');info.className='info';info.innerHTML=`<span class="number">${bench?'대기':(index+1)+'번'}</span><b>${h.name}</b><small>${h.faction} · Lv.1</small>`;b.append(info);placeArtwork(b,bench?[50+index*286,850,269,148]:[50+index%3*286,344+Math.floor(index/3)*150,269,134]);b.onclick=()=>{if(bench)candidate=id;else selected=index;render()};return b;}
async function render(){root.inert=true;root.setAttribute('aria-busy','true');const jobs=[],bench=owned.filter(id=>!party.includes(id));if(!bench.includes(candidate))candidate=bench[0];for(const sel of ['.formation-party','.bench','.synergies']){disposeNineSlices($(sel));$(sel).replaceChildren();}party.forEach((id,i)=>{const b=card(id,i,false);$('.formation-party').append(b);jobs.push(nineSlice(b,i===selected?'green':'blue',{stablePixels:true}));});bench.forEach((id,i)=>{const b=card(id,i,true);$('.bench').append(b);jobs.push(nineSlice(b,id===candidate?'green':'blue',{stablePixels:true}));});
$('.previous').disabled=selected===0;$('.next').disabled=selected===5;$('.replace').disabled=!candidate;$('.replace').textContent=hero(party[selected]).name+' ↔ '+hero(candidate).name;
const units=party.map(id=>({hero:id,faction:hero(id).faction})),tiers=synergyTiers(units);['위','촉','오','군웅'].forEach((f,i)=>{const e=document.createElement('div'),count=units.filter(u=>u.faction===f).length,t=tiers[f]?.tier;e.className='synergy';e.innerHTML=`<strong>${f} · ${count}명</strong><span>${t?['공격','HP','전법','공속'][i]+' +'+Math.round(synergies[f].tiers[t-1]*100)+'%':'2명부터 활성'}</span>`;e.title=t?synergyLabel(f,t):f+' 장수 2명부터 활성';placeArtwork(e,[50+i*214,1124,199,64]);$('.synergies').append(e);jobs.push(nineSlice(e,t?'green':'blue',{button:false,stablePixels:true}));});const bonds=activeBonds(units);$('.bond').innerHTML=bonds.length?bonds.map(({bond})=>'<strong>'+bond.name+'</strong> · '+bond.text).join('<br>'):'활성 인연 없음 · 함께 편성한 장수에 따라 인연이 열립니다.';
await Promise.all([...jobs,document.fonts.ready]);root.inert=false;root.setAttribute('aria-busy','false');}
for(const [cls,delta]of [['.previous',-1],['.next',1]])$(cls).onclick=()=>{const n=selected+delta;if(n<0||n>=party.length)return;[party[selected],party[n]]=[party[n],party[selected]];selected=n;render()};$('.replace').onclick=()=>{const previous=party[selected];party[selected]=candidate;candidate=previous;render()};
const notify=()=>{let n=document.querySelector('.preview-status');if(!n){n=document.createElement('div');n.className='preview-status';document.body.append(n);}n.textContent='편성 검토용 시안입니다. 실제 보유·편성은 변경하지 않습니다.';clearTimeout(notify.timer);notify.timer=setTimeout(()=>n.remove(),2200)};root.querySelectorAll('.save,.home-back,#barracks-back,.bottom-nav button,.wallet button').forEach(b=>b.onclick=notify);await render();
