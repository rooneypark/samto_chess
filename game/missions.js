import {missionsArtwork,renderMissionsArtwork,invalidateMissionsArtwork} from './missions-ui.js';
import {prepareServices,serviceCommand,questPeriods} from './services.js';

// Commands always use the durable store's latest profile. The prepared display
// snapshot is never saved back over a newer battle, quest or wallet transaction.
export function initMissions({game,store,toast,navigate,onWallet}){
 const root=document.createElement('section');root.className='missions-v1';root.hidden=true;root.setAttribute('aria-label','임무 · 보상');game.append(root);
 let tab='day',busy=false,timer=null,periods='',snapshotClock=0,generation=0;
 const actions={claim,tab(value){if(busy)return;tab=value;render('[data-tab="'+tab+'"]');},navigate(value){if(!busy)navigate(value);},wallet(){if(!busy)onWallet();}};
 async function render(focus){
  if(root.hidden||!missionsArtwork)return;const token=++generation,state=store.get();prepareServices(state);periods=JSON.stringify(state.services.periods);snapshotClock=state.services.clock;
  try{await renderMissionsArtwork(root,{state,tab,actions});if(token===generation&&!root.hidden&&focus)root.querySelector(focus)?.focus({preventScroll:true});}
  catch(error){if(token===generation&&!root.hidden){root.inert=false;root.setAttribute('aria-busy','false');toast('임무 화면을 표시하지 못했습니다. '+error.message);}}
 }
 async function claim(command){
  if(busy||root.hidden)return;busy=true;root.inert=true;root.setAttribute('aria-busy','true');let message;
  try{await store.transact(s=>serviceCommand(s,command));message='보상 수령 완료';}
  catch(error){message='보상 수령 실패';}
  finally{busy=false;if(!root.hidden){await render('[data-tab="'+tab+'"]');toast(message);}}
 }
 function refreshPeriod(){if(root.hidden||busy)return;const clock=Math.max(Date.now(),snapshotClock);if(JSON.stringify(questPeriods(clock))!==periods)render();}
 store.subscribe(()=>{if(!root.hidden&&!busy)render();});
 window.addEventListener('focus',refreshPeriod);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshPeriod();});
 root.addEventListener('keydown',event=>{
  if(document.querySelector('dialog[open]')||busy)return;
  if(event.key==='Escape'){event.preventDefault();navigate('home');}
  if(event.key==='Tab'){
   const controls=[...root.querySelectorAll('button:not(:disabled),[tabindex="0"]')].filter(e=>e.getClientRects().length),first=controls[0],last=controls.at(-1);
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }
 });
 return {show(visible){
  clearInterval(timer);root.hidden=!visible;game.classList.toggle('missions-art',visible&&missionsArtwork);
  if(!visible){generation++;invalidateMissionsArtwork(root);root.replaceChildren();root.inert=false;return;}
  tab='day';render('#missions-back');timer=setInterval(refreshPeriod,1000);
 }};
}
