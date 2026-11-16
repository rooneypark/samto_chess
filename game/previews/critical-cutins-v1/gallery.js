import {nineSlice} from '../../nine-slice.js';
import {initArtPress} from '../../art-controls.js';
const data=await(await fetch(new URL('data.json',import.meta.url))).json();
for(const e of data)e.file=new URL(e.file,import.meta.url).href;
const cards=document.querySelector('#cards'),dialog=document.querySelector('#detail'),preview=dialog.querySelector('img');
function render(){const selected=document.querySelector('#faction').value;cards.replaceChildren();const shown=data.filter(e=>!selected||e.faction===selected);document.querySelector('#count').textContent=shown.length+'명';for(const e of shown){const button=document.createElement('button');button.className='card';button.type='button';button.dataset.id=e.id;button.setAttribute('aria-label',e.name+' 컷인 보기');const pic=document.createElement('div');pic.className='picture';const im=new Image();im.src=e.file;im.alt=e.name;im.loading='lazy';pic.append(im);const cap=document.createElement('div');cap.className='caption';const name=document.createElement('span');name.textContent=e.name;const faction=document.createElement('small');faction.textContent=e.faction;cap.append(name,faction);button.append(pic,cap);button.addEventListener('click',()=>open(e));cards.append(button);}}
function open(e){preview.classList.remove('playing');preview.src=e.file;preview.alt=e.name+' 전법 준비 원화';dialog.querySelector('h2').textContent=e.name;const link=document.querySelector('#download');link.href=e.file;link.download=e.id+'-critical.webp';dialog.showModal();}
document.querySelector('#close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>preview.classList.remove('playing'));
document.querySelector('#play').addEventListener('click',()=>{preview.classList.remove('playing');void preview.offsetWidth;preview.classList.add('playing');});
preview.addEventListener('animationend',()=>preview.classList.remove('playing'));
document.addEventListener('visibilitychange',()=>{if(document.hidden)preview.classList.remove('playing');});
document.querySelector('#faction').addEventListener('change',render);
document.querySelector('#background').addEventListener('change',e=>document.body.dataset.background=e.target.value);
await Promise.all([...dialog.querySelectorAll('button')].map(b=>nineSlice(b,b.id==='play'?'green':'blue',{corner:18})));
initArtPress(dialog);render();
