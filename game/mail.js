import {mailArtwork,renderMailArtwork,invalidateMailArtwork} from './mail-ui.js';
import {mailPage,mailAvailable} from './mail-model.js';
import {prepareServices,serviceCommand,questPeriods} from './services.js';
import {rewardText} from './services-ui.js';

export function initMail({game,store,dialog,toast,navigate,onWallet}){
 const root=document.createElement('section');root.className='mail-v1';root.hidden=true;root.setAttribute('aria-label','우편함');game.append(root);
 let tab='all',page=0,selected=null,busy=false,generation=0,timer=null,nextRefresh=Infinity,snapshotClock=0;
 const snapshot=()=>{const s=store.get();prepareServices(s);return s;};
 const actions={claim,claimAll,remove,select(id){if(busy)return;selected=id;render('.mail-row[aria-pressed=true]');},tab(value){if(busy)return;tab=value;page=0;selected=null;render('[data-tab="'+tab+'"]');},page(delta){if(busy)return;page+=delta;selected=null;render(delta>0?'.page-prev':'.page-next');},navigate(value){if(!busy)navigate(value);},wallet(){if(!busy)onWallet();}};
 async function render(focus){
  if(root.hidden||!mailArtwork)return;const token=++generation,state=snapshot(),view=mailPage(state,{tab,page,selected});page=view.page;selected=view.selected;snapshotClock=view.now;
  const DAY=86400000;nextRefresh=(Number(questPeriods(view.now).day)+1)*DAY-14400000;
  for(const m of view.waiting)nextRefresh=Math.min(nextRefresh,m.expireAt-(Math.ceil((m.expireAt-view.now)/DAY)-1)*DAY);
  try{await renderMailArtwork(root,{state,view,actions});if(token===generation&&!root.hidden&&focus)root.querySelector(focus)?.focus({preventScroll:true});}
  catch(error){if(token===generation&&!root.hidden){root.inert=false;root.setAttribute('aria-busy','false');toast('우편함을 표시하지 못했습니다. '+error.message);}}
 }
 async function execute(work){
  if(busy||root.hidden)return;busy=true;root.inert=true;root.setAttribute('aria-busy','true');let message;
  try{message=await work();}catch(error){message='처리 실패: '+error.message;}
  finally{busy=false;if(!root.hidden){await render('[data-tab="'+tab+'"]');toast(message);}}
 }
 function claim(id){return execute(async()=>{await store.transact(s=>serviceCommand(s,{type:'mail',id}));return '우편 보상 수령 완료';});}
 function claimAll(){return execute(async()=>{
  const state=snapshot(),ids=state.services.mail.filter(m=>mailAvailable(m,state.services.clock)).map(m=>m.id);let received=0,failed=0;
  for(const id of ids)try{await store.transact(s=>serviceCommand(s,{type:'mail',id}));received++;}catch{failed++;}
  return failed?received+'통 수령 · '+failed+'통 실패':received?received+'통의 우편 보상 수령 완료':'수령 가능한 우편이 없습니다.';
 });}
 function remove(id){
  if(busy||root.hidden)return;const state=snapshot(),m=state.services.mail.find(m=>m.id===id);if(!m)return;
  const warning=mailAvailable(m,state.services.clock)?'미수령 보상('+rewardText(m.attachments)+')도 함께 삭제됩니다.':m.claimedAt?'이미 수령한 보상은 유지됩니다.':'기한이 지난 우편을 삭제합니다.';
  dialog.confirm('우편 삭제',m.title+'\n'+warning,'삭제',()=>execute(async()=>{
   try{await store.transact(s=>serviceCommand(s,{type:'delete-mail',id,confirm:true}));return '우편 삭제 완료';}
   finally{dialog.dismiss();}
  }));
 }
 function refresh(){if(!root.hidden&&!busy&&Math.max(Date.now(),snapshotClock)>=nextRefresh)render();}
 store.subscribe(()=>{if(!root.hidden&&!busy)render();});window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
 root.addEventListener('keydown',event=>{
  if(busy||document.querySelector('dialog[open]'))return;
  if(event.key==='Escape'){event.preventDefault();navigate('home');}
  if(event.key==='Tab'){const controls=[...root.querySelectorAll('button:not(:disabled),[tabindex="0"]')].filter(e=>e.getClientRects().length),first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
 });
 return {show(visible){clearInterval(timer);root.hidden=!visible;game.classList.toggle('mail-art',visible&&mailArtwork);if(!visible){generation++;invalidateMailArtwork(root);root.replaceChildren();root.inert=false;return;}tab='all';page=0;selected=null;render('#mail-back');timer=setInterval(refresh,1000);}};
}
