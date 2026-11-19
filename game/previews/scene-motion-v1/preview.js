import {characterSource} from '../../character-art.js';
import {landmarkArtwork} from '../../campaign-landmarks.js';
import {configureSceneMotion,cancelSceneMotions,playSceneMotion,growthScene,rewardScene,departScene,unlockScene,mergeScene,impactScene,resultScene} from '../../scene-motion.js';
import {createGameDialog} from '../../dialog.js';
import {createToast} from '../../toast.js';
import {growthSuccess} from '../../dialog-content.js';
import {nineSlice} from '../../nine-slice.js';
import {initArtPress} from '../../art-controls.js';
const paintButton=(button,selected)=>nineSlice(button,selected?'green':'blue',{corner:button.closest('.game')?20:7,fitCorner:true});
initArtPress(document.querySelector('header'));
initArtPress(document.querySelector('main'));
await Promise.all([...document.querySelectorAll('main button, #play-all')].map(b=>paintButton(b,b.id==='play-all'||b.matches('.active'))));
const dialog=createGameDialog(document.querySelector('#modal'),{artwork:true});
const $=s=>document.querySelector(s),demo=id=>$(`[data-demo="${id}"]`),stage=id=>demo(id).querySelector('.demo-stage');
const rewardToast=createToast($('#reward-toast'));
let reduced=false,serial=0,sequence=0;
configureSceneMotion(()=>({reducedMotion:reduced}));
for(const image of document.querySelectorAll('[data-art]'))image.src=characterSource(image.dataset.art);
for(const image of document.querySelectorAll('[data-face]'))image.src=`assets/portraits-v4/${image.dataset.face}.png`;
const landmark=await landmarkArtwork('yellow-camp');document.querySelectorAll('[data-landmark]').forEach(i=>i.src=landmark);
await Promise.all([...document.images].map(i=>i.decode()));await document.fonts.ready;
const names={select:'선택 · 편성',growth:'훈련 · 각성',reward:'보상 수령',campaign:'해금 · 출정',battle:'합성 · 강한 타격',result:'승리 · 결과'};
export async function play(id,alternate=false){
 const root=stage(id);demo(id).classList.add('playing');setTimeout(()=>demo(id).classList.remove('playing'),650);$('#status').textContent=reduced?'움직임 줄이기: 결과를 즉시 표시합니다.':names[id]+' 연출 재생 중';
 if(id==='select'){const im=root.querySelector('.hero-picture');if(alternate){im.src=characterSource('15');await im.decode();}else{im.src=characterSource('1');await im.decode();}im.alt=alternate?'조운':'관우';
 await Promise.all([...root.querySelectorAll('.selection-card')].map((c,i)=>{
  const selected=i===(alternate?1:0);
  c.classList.toggle('active',selected);c.setAttribute('aria-pressed',String(selected));
  return paintButton(c,selected);
 }));playSceneMotion(im,'select');}
 if(id==='growth'){root.querySelector('.hero-level').textContent=alternate?'Lv.8':'Lv.9';root.querySelectorAll('.hero-stat').forEach((e,i)=>e.textContent=(alternate?[1240,146,72]:[1302,153,76])[i].toLocaleString());root.querySelectorAll('.hero-stars i').forEach((e,i)=>e.classList.toggle('lit',i<(alternate?3:2)));root.querySelector('.hero-stars').setAttribute('aria-label','각성 '+(alternate?3:2)+'성');growthScene(root,alternate?'awaken':'train',3);}
 if(id==='reward'){rewardToast.show('보상 수령 완료','success');root.querySelector('[data-wallet=gold] b').textContent='600';root.querySelector('[data-wallet=diamonds] b').textContent='40';rewardScene(root,['gold','diamonds'].map(kind=>({kind,origin:root.querySelector('.reward-paper img[src$="'+(kind==='gold'?'coin':'gem')+'.png"]').getBoundingClientRect(),target:root.querySelector(`[data-wallet="${kind}"]`)})));}
 if(id==='campaign'){root.querySelector('.lock-mark').hidden=true;if(alternate)departScene(root,root.querySelector('.target'));else unlockScene(root,root.querySelector('.target'));}
 if(id==='battle'){if(alternate){impactScene(root.querySelector('.target'));}else mergeScene(root.querySelector('.unit-rank'));}
 if(id==='result'){root.classList.add('revealed');resultScene(root,{key:'preview-'+ ++serial,paid:true});}
}
document.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>{sequence++;
 const alternate=b.hasAttribute('data-alternate');
 play(b.dataset.play,alternate);
 if(b.dataset.play==='growth')growthSuccess(dialog.open,{name:'장비',portrait:'assets/portraits-v4/2.png'},!alternate,{level:8,star:2},{level:alternate?8:9,star:alternate?3:2});
});
$('#reduce').onchange=e=>{reduced=e.target.checked;cancelSceneMotions();$('#status').textContent=reduced?'적용된 결과는 유지하고 움직임만 생략합니다.':'모든 연출을 다시 확인할 수 있습니다.';};
$('#play-all').onclick=async()=>{const token=++sequence;for(const [id,alternate]of [['select',true],['growth',false],['growth',true],['reward',false],['campaign',false],['campaign',true],['battle',false],['battle',true],['result',false]]){if(token!==sequence)break;await play(id,alternate);await new Promise(r=>setTimeout(r,850));}if(token===sequence)$('#status').textContent='전체 재생 완료 · 각 장면에서 다시 볼 수 있습니다.';};
window.motionPreview={play,ready:true,stop(){sequence++;cancelSceneMotions();}};
document.body.dataset.ready='true';

if(location.hash==='#toast'){demo('reward').scrollIntoView({block:'center'});rewardToast.show('보상 수령 완료','success');}
