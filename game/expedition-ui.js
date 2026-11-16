import {createArtworkScreen,paintArtworkSelection} from './artwork-screen.js';
import {artworkShell} from './ui-shell.js';
import {placeArtwork,uiComponentsReady} from './art-controls.js';
import {paintArtworkLayout} from './art-layout.js';
import {nineSlice,disposeNineSlices} from './nine-slice.js';
import {generalArtwork} from './general-art.js';
import {landmarkArtwork} from './campaign-landmarks.js';
import {sites,expeditionRules,teamBonus,heroPower,siteOpen,expeditionStatus,expeditionCommand} from './expedition.js';
import {heroes} from './heroes.js';
import {expeditionTemplate} from './expedition-template.js';
import {pickGenerals} from './general-picker.js';
import {periods} from './economy.js';
const landmarkNames={yellow:'yellow-camp',sishui:'sishui-wall',hulao:'hulao-gate'};
const labels={gold:'골드',treasureTokens:'보물 재료',heroTokens:'장수 재료'};
const rewards=r=>Object.entries(r).map(([k,v])=>k==='treasure'?v:(labels[k]??k)+' '+v).join(' · ');
const minutes=ms=>{const m=Math.max(0,Math.ceil(ms/60000));return Math.floor(m/60)+'시간 '+m%60+'분';};
export function initExpedition({host,store,navigate,toast,onWallet,dialog}){
 const root=createArtworkScreen({host,className:'expedition-runtime',label:'토벌 파견',template:expeditionTemplate,navigate,onWallet}),$=s=>root.querySelector(s);
 let page=0,selected='yellow',team=[],slotIndex=0,busy=false,revision=0,timer=null,nextRefresh=Infinity;
 const ready=Promise.all([uiComponentsReady,paintArtworkLayout(root)]);
 const available=(s,status)=>heroes.filter(h=>s.heroes[h.id]?.owned&&!status.busy.has(h.id)).map(h=>h.id);
 async function render(){
  const token=++revision;await ready;if(root.hidden||token!==revision)return;root.inert=true;root.setAttribute('aria-busy','true');
  const s=store.get(),now=Date.now(),status=expeditionStatus(s,now),eligible=available(s,status),painting=[];
  nextRefresh=(Number(periods(now).day)+1)*86400000-14400000;
  for(const slot of status.slots)if(slot.endsAt>now)nextRefresh=Math.min(nextRefresh,slot.endsAt-(Math.ceil((slot.endsAt-now)/60000)-1)*60000);
  team=team.filter(id=>eligible.includes(id));if(!team.length)team=s.order.filter(id=>eligible.includes(id)).slice(0,3);
  artworkShell(root,{screen:'home',title:'토벌 파견',progress:s,controlsRoot:root});$('.summary-title').textContent='오늘 파견 '+status.count+' / '+expeditionRules.daily+'회';$('.provisions').textContent='군량 '+(s.provisions??0);const march=s.alliance?.guild?(s.alliance.research?.march??0):0;$('.summary-copy').textContent=march?'장수 3명 · '+minutes(expeditionRules.duration*(1-march*.05))+' · 전투 참여 가능':'장수 3명 · 2시간 파견 · 파견 중에도 전투에 참여합니다.';
  const visible=sites.slice(page*3,page*3+3);if(!visible.some(site=>site.id===selected))selected=visible[0].id;
  const list=$('.site-list');disposeNineSlices(list);list.replaceChildren();
  for(const [i,site] of visible.entries()){
   const b=document.createElement('button');b.className='site-button';b.dataset.site=site.id;
   if(landmarkNames[site.id]){const img=new Image();img.src=await landmarkArtwork(landmarkNames[site.id]);if(token!==revision)return;img.alt='';b.append(img);}
   const title=document.createElement('strong');title.textContent=site.name;const copy=document.createElement('small');copy.textContent=siteOpen(s,site)?'필요 전투력 '+site.power:'잠금 · 전역 클리어 필요';b.append(title,copy);placeArtwork(b,[[20,326,632][i],420,289,182]);b.onclick=()=>{selected=site.id;draw();};list.append(b);painting.push(paintArtworkSelection(b,site.id===selected));
  }
  $('.team-title').textContent='파견 부대 · '+team.length+' / 3';const images=await Promise.all(team.map((id,i)=>generalArtwork(id,{center:[175,470,765][i],height:170,feet:974,maxWidth:180})));if(token!==revision)return;$('.team-art').replaceChildren(...images);$('.team-labels').replaceChildren();
  for(let i=0;i<3;i++){const label=document.createElement('p');label.className='team-name';label.textContent=team[i]?heroes.find(h=>h.id===team[i]).name:'장수 선택';placeArtwork(label,[[50,345,640][i],980,251,32]);$('.team-labels').append(label);}
  const site=sites.find(site=>site.id===selected),bonus=teamBonus(site,team),power=team.reduce((sum,id)=>sum+heroPower(s,id),0);
  $('.reward-title').textContent='전투력 '+power+' / '+site.power+' · 보상 +'+Math.round(bonus.rate*100)+'%';$('.reward-copy').textContent=rewards(Object.fromEntries(Object.entries(site.reward).map(([k,v])=>[k,Math.round(v*(1+bonus.rate))])))+' · 보물 확률 5%';
  $('.site-page').textContent=(page+1)+' / 2';$('.site-prev').disabled=!page;$('.site-next').disabled=page===1;
  const blocked=!siteOpen(s,site)?'파견지 잠김':status.slots.length>=expeditionRules.slots?'파견 부대 가득 참':status.count>=expeditionRules.daily?'오늘 파견 완료':team.length!==3?'장수 3명 선택':power<site.power?'전투력 부족':(s.provisions??0)<expeditionRules.provisions?'군량 부족':null;
  $('.send').disabled=!!blocked;$('.send').textContent=blocked??'파견 시작 · 군량 '+expeditionRules.provisions;painting.push(nineSlice($('.send'),blocked?'blue':'green'));
  slotIndex=Math.min(slotIndex,Math.max(0,status.slots.length-1));const slot=status.slots[slotIndex],returned=slot&&now>=slot.endsAt,multi=status.slots.length>1;
  $('.return-title').classList.toggle('multi',multi);$('.return-copy').classList.toggle('multi',multi);$('.slot-next').hidden=!multi;if(multi)painting.push(nineSlice($('.slot-next'),'blue'));
  $('.return-title').textContent=slot?(multi?'부대 '+(slotIndex+1)+' / '+status.slots.length:'파견 부대')+' · '+(returned?'귀환 완료':'파견 중'):'파견 중인 부대 없음';
  $('.return-copy').textContent=slot?sites.find(site=>site.id===slot.site).name+' · '+(returned?'보상을 받을 수 있습니다.':'남은 '+minutes(slot.endsAt-now)):'최대 2부대까지 동시에 파견할 수 있습니다.';
  $('.return-reward').textContent=slot?slot.heroes.map(id=>heroes.find(h=>h.id===id).name).join(' · '):s.expedition?.last?'지난 보상 · '+rewards(s.expedition.last.got):'장수 3명을 편성하고 파견을 시작하세요.';
  $('.return-claim').disabled=!returned;$('.return-claim').textContent=returned?'보상 받기':slot?'진행 중':'대기 중';painting.push(nineSlice($('.return-claim'),returned?'green':'blue'));$('.return-claim').onclick=()=>slot&&execute({type:'claim',id:slot.id});
  await Promise.all([...painting,document.fonts.ready,...[...root.querySelectorAll('img')].map(img=>img.decode())]);if(token===revision&&!root.hidden){root.inert=false;root.setAttribute('aria-busy','false');}
 }
 async function draw(){try{await render();}catch(e){root.inert=false;root.setAttribute('aria-busy','false');toast('화면을 표시하지 못했습니다. '+e.message);}}
 async function execute(command){if(busy||root.hidden)return;busy=true;root.inert=true;root.setAttribute('aria-busy','true');try{await store.transact(s=>expeditionCommand(s,command));toast(command.type==='send'?'파견 완료':'귀환 보상 수령 완료');}catch(e){toast(e.message,'error');}finally{busy=false;if(!root.hidden)await draw();}}
 $('.site-prev').onclick=()=>{page--;draw();};$('.site-next').onclick=()=>{page++;draw();};$('.slot-next').onclick=()=>{slotIndex=(slotIndex+1)%Math.max(1,expeditionStatus(store.get()).slots.length);draw();};
 $('.send').onclick=()=>execute({type:'send',id:crypto.randomUUID(),site:selected,heroes:[...team]});
 $('.change-team').onclick=()=>{const s=store.get(),status=expeditionStatus(s);pickGenerals({dialog,title:'토벌 파견 · 3장수 편성',ids:available(s,status),selected:team,count:3,summary:ids=>'전투력 '+ids.reduce((n,id)=>n+heroPower(s,id),0),onConfirm:ids=>{team=ids;draw();}});};
 store.subscribe(()=>{if(!root.hidden&&!busy)draw();});function refresh(){if(!root.hidden&&!busy&&Date.now()>=nextRefresh)draw();}window.addEventListener('focus',refresh);
 return {show(visible){clearInterval(timer);revision++;root.hidden=!visible;host.classList.toggle('expedition-art',visible);if(visible){draw();timer=setInterval(refresh,1000);}}};
}
