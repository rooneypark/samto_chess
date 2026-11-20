import {artworkShell} from './ui-shell.js';
import {paintArtworkLayout} from './art-layout.js';
import {placeArtwork} from './art-controls.js';
import {nineSlice,disposeNineSlices} from './nine-slice.js';
import {createArtworkScreen} from './artwork-screen.js';
import {settingsTemplate} from './settings-template.js';
import {settingsActions} from './settings.js';
const options=[['motion','움직임 줄이기','전환과 이동 애니메이션 간소화'],['large','큰 글씨','지원 화면의 글자를 크게 표시'],['fx','전법 이펙트 줄이기','전투 효과를 간결하게 표시']];
export function initSettingsScreen({host,store,navigate,toast,onWallet,dialog}){
 const root=createArtworkScreen({host,sharedShell:true,className:'settings-runtime',label:'설정',template:settingsTemplate,navigate,onWallet}),$=s=>root.querySelector(s),actions=settingsActions({store,dialog,toast});
 let busy=false,revision=0;const ready=paintArtworkLayout(root,{stablePixels:true});
 for(const [i,[id,title,description]]of options.entries()){const y=350+i*125,label=document.createElement('p'),help=document.createElement('p');label.className='setting-name';label.textContent=title;placeArtwork(label,[50,y,500,38]);help.className='setting-help';help.textContent=description;placeArtwork(help,[50,y+42,500,28]);$('.settings-list').append(label,help);for(const [j,value]of [true,false].entries()){const b=document.createElement('button');b.className='choice';b.dataset.setting=id;b.dataset.value=value;b.textContent=value?'켬':'끔';b.setAttribute('aria-label',title+' '+b.textContent);placeArtwork(b,[605+j*151,y+5,135,64]);$('.settings-list').append(b);b.onclick=()=>change(id,value);}}
 for(const [i,n]of [0,25,50,75,100].entries()){const b=document.createElement('button');b.className='volume';b.dataset.volume=n;b.textContent=n+'%';Object.assign(b.style,{left:(i*20)+'%',top:'0',width:'20%',height:'100%'});$('.volume-list').append(b);b.onclick=()=>change('volume',n);}
 const file=document.createElement('input');file.type='file';file.accept='.json,application/json';file.hidden=true;file.id='settings-import';root.append(file);file.onchange=()=>{const selected=file.files?.[0];file.value='';actions.restore(selected)};
 root.querySelectorAll('[data-operation]').forEach(b=>b.onclick=()=>{if(b.dataset.operation==='restore')file.click();else actions[b.dataset.operation]();});
 async function render(){const token=++revision;await ready;if(root.hidden||busy||token!==revision)return;root.inert=true;root.setAttribute('aria-busy','true');const s=store.get(),p=s.preferences??{},volume=p.volume??50,values={motion:!!s.reducedMotion,large:!!p.largeText,fx:!!p.reducedFx};artworkShell(root,{screen:'home',title:'설정',progress:s,controlsRoot:root});const jobs=[];for(const b of root.querySelectorAll('.choice,.volume')){const selected=b.classList.contains('volume')?+b.dataset.volume===volume:values[b.dataset.setting]===(b.dataset.value==='true');b.setAttribute('aria-pressed',String(selected));if(!b.classList.contains('volume')||selected)jobs.push(nineSlice(b,selected?'green':'blue',{stablePixels:true}));else {disposeNineSlices(b);b.style.removeProperty('background-image');b.style.removeProperty('--art-image');b.classList.remove('art-painted');}}$('.volume-value').textContent=volume?volume+'%':'음소거';await Promise.all([...jobs,document.fonts.ready]);if(token===revision&&!root.hidden){root.inert=false;root.setAttribute('aria-busy','false');}}
 async function draw(){try{await render()}catch(e){root.inert=false;root.setAttribute('aria-busy','false');toast('설정을 표시하지 못했습니다. '+e.message)}}
 async function change(id,value){if(busy)return;
 busy=true;revision++;root.inert=true;root.setAttribute('aria-busy','true');try{await store.transact(s=>id==='motion'?{...s,reducedMotion:value}:{...s,preferences:{...s.preferences,[{large:'largeText',fx:'reducedFx',volume:'volume'}[id]]:value}});}catch(e){toast('설정을 저장하지 못했습니다. '+e.message);}finally{busy=false;if(!root.hidden)await draw();}}
 store.subscribe(()=>{if(!root.hidden&&!busy)draw()});document.addEventListener('fullscreenchange',()=>{if(!root.hidden&&!busy)draw()});return {show(visible){revision++;root.hidden=!visible;host.classList.toggle('settings-art',visible);if(visible)draw();}};
}
