import {artSet} from './art.js';
import {arenaTemplate} from './arena-ui-template.js';
import {artworkShell} from './ui-shell.js';
import {preloadArtwork} from './art-controls.js';
import {disposeNineSlices} from './nine-slice.js';
import {generals} from './character-art.js';
import {arenaRules} from './battle-data.js';
import {meritRules} from './arena-state.js';
import {generalArtwork,appendGeneralArtwork} from './general-art.js';
import {paintArtworkLayout} from './art-layout.js';
export const arenaArtwork=artSet==='a';
export const arenaReady=arenaArtwork?preloadArtwork(['assets/arena-v2/courtyard.png']):Promise.resolve();
let revision=0;
export async function renderArenaArtwork(root,{state,arena,opponent,playerOrder,tier,rewards}){
 disposeNineSlices(root);const token=++revision;
 root.classList.add('arena-v2');root.inert=true;root.setAttribute('aria-busy','true');root.innerHTML=arenaTemplate;
 const $=s=>root.querySelector(s);
 const ids=['arena-overview','arena-rank','arena-history','arena-season','arena-formation','arena-next','arena-rules','arena-start','arena-shop'];
 root.querySelectorAll('[data-tone]').forEach((b,i)=>b.id=ids[i]);
 const stats=$('.rating-copy');stats.querySelector('span b').textContent=tier.name;stats.querySelector('span b').id='arena-tier';stats.querySelector('strong').textContent=arena.score.toLocaleString();
 const values=stats.querySelectorAll('small b');values[0].textContent=(state.merit??0).toLocaleString();values[0].id='arena-merit';values[1].textContent=rewards+' / '+arenaRules.dailyLimit+'회';
 const name=(el,label,score)=>{const value=document.createElement('span');value.textContent=score.toLocaleString()+'점';el.replaceChildren(document.createTextNode(label+' '),value);el.classList.toggle('long-name',label.length>5);};
 name($('.challenger.player strong'),'군주',arena.score);name($('.challenger.opponent strong'),opponent.name,opponent.score);
 $('.duel-stage').setAttribute('aria-label','내 진영과 선택한 NPC 상대');
 $('.formation-generals').setAttribute('aria-label','실제 출전 편성');$('h2 small').textContent=playerOrder.length+' / 6';
 $('#arena-start strong').textContent=arena.match?'준비한 대전 보기':'대전 시작';
 $('#arena-start small').textContent=rewards>=arenaRules.dailyLimit?'오늘 보상 한도 완료':`승리 골드 ${arenaRules.winGold} · 군공 ${meritRules.win}`;
 $('#arena-shop small').textContent='보유 군공 '+(state.merit??0).toLocaleString();
 $('#arena-next').disabled=!!arena.match;$('#arena-formation').disabled=!!arena.match;
 artworkShell(root,{screen:'arena',title:'군웅대전',progress:state});
 const painting=[paintArtworkLayout(root)];
 async function hero(id,center,height,feet,container){
  const img=await generalArtwork(id,{center,height,feet,maxWidth:container==='.duel-generals'?300:110});
  if(img&&token===revision)appendGeneralArtwork($(container),img);
 }
 const representative=order=>order.find(id=>generals[id])??order[0];
 const images=[hero(representative(playerOrder),264,317,932,'.duel-generals'),hero(representative(opponent.order),677,317,932,'.duel-generals'),...playerOrder.map((id,i)=>hero(id,112+i*137,68,1163,'.formation-generals'))];
 try{await Promise.all([arenaReady,...painting,...images]);}finally{if(token===revision){root.inert=false;root.setAttribute('aria-busy','false');}}
}
