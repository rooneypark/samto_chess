import {configureSceneMotion,motionAllowed,cancelSceneMotions,growthScene,rewardScene,unlockScene} from './scene-motion.js';
import {stageOrder,stageStatus} from './stages.js';
const unlocks=new Set();
export function playCampaignUnlocks(root){if(root.hidden)return;for(const id of unlocks){const card=root.querySelector(`[data-stage-card="${id}"]`);if(card){unlockScene(root.closest('.game'),card);unlocks.delete(id);}}}
export function initSceneMotion(game,store){
 let previous=store.get(),origins={},clickedAt=-Infinity,timer,pending=new Set();configureSceneMotion(()=>previous);
 document.addEventListener('click',e=>{const b=e.target.closest?.('button');if(b&&!b.disabled){const screen=b.closest('section.missions-v1,section.mail-v1,.missions-v1,.mail-v1');
   const region=b.closest('[data-quest]')??screen?.querySelector(
    b.matches('.attendance-claim')?'.day.today':b.matches('.bonus-claim')?'.bonus-rewards':
    b.matches('.claim-all')?'.summary-rewards':'.detail-rewards');
   origins={};
   for(const [kind,file] of [['gold','coin'],['diamonds','gem']]){
    const icon=region?.querySelector('img[src$="/'+file+'.png"]');
    if(icon?.getClientRects().length)origins[kind]=icon.getBoundingClientRect();
   }
   clickedAt=performance.now();}},true);
 const media=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');media?.addEventListener('change',()=>{if(!motionAllowed())cancelSceneMotions();});
 store.subscribe(next=>{
  const before=previous;previous=next;if(!motionAllowed(next)){clearTimeout(timer);pending.clear();unlocks.clear();cancelSceneMotions();return;}
  for(const id of stageOrder)if(stageStatus(before,id)==='locked'&&stageStatus(next,id)!=='locked')unlocks.add(id);
  // Durable-store subscribers run only after the IndexedDB transaction commits.
  const changed=Object.keys(next.heroes??{}).find(id=>(next.heroes[id].level??0)>(before.heroes?.[id]?.level??0)||(next.heroes[id].star??0)>(before.heroes?.[id]?.star??0));
  if(changed)requestAnimationFrame(()=>{const root=game.querySelector('.barracks-screen:not([hidden])');if(root?.querySelector('.roster-card.selected')?.dataset.hero===changed)growthScene(root,next.heroes[changed].star>before.heroes[changed].star?'awaken':'train',next.heroes[changed].star);});
  if(performance.now()-clickedAt>2000||game.classList.contains('in-battle'))return;
  for(const key of ['gold','diamonds'])if(next[key]>before[key])pending.add(key);
  if(!pending.size)return;clearTimeout(timer);timer=setTimeout(()=>{
   const buttons=[...game.querySelectorAll('.wallet button')].filter(e=>e.getClientRects().length),targets=[...pending].map(kind=>({kind,origin:origins[kind],target:buttons.find(b=>b.querySelector(`[data-field="${kind}"]`))??buttons[kind==='gold'?0:1]}));pending.clear();rewardScene(game,targets);
  },90);
 });
}
