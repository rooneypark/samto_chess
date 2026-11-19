import {campaignArtwork,campaignMapIds,renderCampaignArtwork} from './campaign-ui.js';
import {disposeNineSlices} from './nine-slice.js';
import {currentStage,stageStatus,hardUnlocked} from './stages.js';
import {departScene} from './scene-motion.js';
export function initCampaign({store,dialog,toast,navigate,startBattle,onCatalog,onDetails,onSelected}){
 const game=document.querySelector('.game'),root=document.createElement('section');root.className='campaign-v4';root.hidden=true;root.setAttribute('aria-label','전역 선택');document.querySelector('.bottom-nav').before(root);
 let selected=null,difficulty='normal',busy=false;
 const render=()=>{if(root.hidden)return;return renderCampaignArtwork(root,{state:store.get(),selected,difficulty,busy,onSelect:select,onDepart:depart,onDifficulty:chooseDifficulty,onCatalog,onHome:()=>navigate('home')}).catch(error=>{toast('전역을 표시하지 못했습니다. '+error.message);});};
 async function select(id){if(busy)return;const previous=selected,previousDifficulty=difficulty;selected=id;if(!hardUnlocked(store.get(),id))difficulty='normal';if(stageStatus(store.get(),id)==='locked'){await render();return;}busy=true;try{await store.transact(s=>({...s,selectedStage:id}));onSelected();}catch(e){selected=previous;difficulty=previousDifficulty;toast('전투 선택을 저장하지 못했습니다. '+e.message);}finally{busy=false;await render();}}
 async function depart(){if(busy)return;const s=store.get();if(stageStatus(s,selected)==='locked'||difficulty==='hard'&&!hardUnlocked(s,selected))return;busy=true;try{
  if(!s.battleRun){await store.transact(latest=>{if(stageStatus(latest,selected)==='locked'||difficulty==='hard'&&!hardUnlocked(latest,selected))throw Error('아직 열리지 않은 전투입니다.');return {...latest,selectedStage:selected};});onSelected();}
  departScene(game,root.querySelector('[data-stage-card="'+selected+'"]'));
  await startBattle(selected,difficulty);
 }catch(e){toast('출정을 시작하지 못했습니다. '+e.message);}finally{busy=false;if(!game.classList.contains('in-battle'))await render();}}
 function chooseDifficulty(){const available=hardUnlocked(store.get(),selected);dialog.open('전역 난도','<p>어려움은 해당 장 전체 클리어와 군주 Lv.12 달성 후 열립니다.</p><div class="modal-actions"><button class="action" id="campaign-normal">일반</button><button class="action" id="campaign-hard" '+(available?'':'disabled')+'>어려움</button><button class="action secondary" id="campaign-details">전투 상세</button></div>');for(const [id,value] of [['campaign-normal','normal'],['campaign-hard','hard']])document.getElementById(id).onclick=()=>{difficulty=value;dialog.dismiss();render();};document.getElementById('campaign-details').onclick=()=>onDetails(selected);}
 store.subscribe(()=>{if(!root.hidden&&!busy&&!game.classList.contains('in-battle'))render();});
 return {show(visible){root.hidden=!visible;game.classList.toggle('campaign-art',visible&&campaignArtwork);if(!visible){disposeNineSlices(root);return;}selected=campaignMapIds.includes(currentStage(store.get()))?currentStage(store.get()):campaignMapIds[8];if(!hardUnlocked(store.get(),selected))difficulty='normal';render();}};
}
