import {artSet} from './art.js';
import {allianceTemplate} from './alliance-ui-template.js';
import {artworkShell} from './ui-shell.js';
import {placeArtwork,preloadArtwork} from './art-controls.js';
import {disposeNineSlices} from './nine-slice.js';
import {paintArtworkLayout} from './art-layout.js';
import {generals} from './character-art.js';
import {generalArtwork} from './general-art.js';
import {decorativeLineup} from './decorative-lineup.js';
import {attendReward} from './alliance-state.js';
export const allianceArtwork=artSet==='a';
export const allianceReady=allianceArtwork?preloadArtwork(['assets/alliance-v2/headquarters.png',...['1','35'].map(id=>generals[id].views.front.url)]):Promise.resolve();
let revision=0;
export async function renderAllianceArtwork(root,{state,status,actions}){
 disposeNineSlices(root);const token=++revision,{guild,eligible,preparation,claimed,supply,donations}=status;
 root.classList.add('alliance-v2');root.inert=true;root.setAttribute('aria-busy','true');root.innerHTML=allianceTemplate;
 const $=s=>root.querySelector(s),buttons=[...root.querySelectorAll('[data-tone]')];
 const names=['guild-overview','guild-members','guild-log','guild-supply','guild-donate','guild-raid','guild-attend','guild-shop','guild-research','guild-manage'];
 buttons.forEach((b,i)=>b.id=names[i]);
 $('.scroll-heading').textContent=guild?.name??'가입한 동맹이 없습니다.';
 const leader=guild?.members.find(m=>m.role==='군주');
 if(guild){const values=$('.guild-stats').querySelectorAll('b');values[0].textContent=leader?.name??'—';values[0].title=leader?.name??'';values[1].textContent=guild.members.length+' / 30';values[2].textContent=(status.contribution??0).toLocaleString();}
 else $('.guild-stats').textContent='';
 const notice=guild?(guild.notice||'함께 토벌 준비에 참여해 주세요.'):'';
 $('.notice').hidden=!notice;$('.notice span').textContent=notice;$('.notice').classList.toggle('long',notice.length>32);
 $('.preparation').setAttribute('aria-valuenow',preparation);$('.preparation i').style.width=preparation+'%';$('.percentage').innerHTML=Number(preparation)+'<span>%</span>';
 const bind=(id,fn,{disabled=false,title}={})=>{const el=$('#'+id);el.disabled=disabled;el.onclick=fn;if(title)el.title=title;return el;};
 $('#barracks-back').onclick=actions.back;
 bind('guild-overview',()=>{});
 bind('guild-members',actions.members,{disabled:!guild});bind('guild-log',actions.log,{disabled:!guild});
 if(guild){
  const supplyButton=bind('guild-supply',actions.supply,{disabled:!eligible||claimed||(supply&&preparation<100)});
  supplyButton.textContent=claimed?'수령 완료':preparation>=100?'보상 받기':supply?'지원 완료':'군량 지원';
  const donate=bind('guild-donate',actions.donate,{disabled:!eligible||donations>=3||state.gold<100});
  donate.title=!eligible?'가입 24시간 후 이용할 수 있습니다.':`100골드 → 공헌 10 · 오늘 ${3-donations} / 3회 남음`;
  if(donations>=3)donate.textContent='기부 완료';else if(state.gold<100)donate.textContent='골드 부족';
  if(!eligible)$('.helper').textContent='가입 24시간 후 기부·군량 지원 가능';
  else if(preparation>=100)$('.helper').textContent='토벌 준비 완료 · 함께 보스에게 도전하세요';
 }else{
  $('#guild-supply').id='guild-search';bind('guild-search',actions.search).textContent='동맹 찾기';
  $('#guild-donate').id='guild-create-button';bind('guild-create-button',actions.create).textContent='동맹 창설';
  $('.helper').textContent='동맹에 가입하면 출석과 공동 토벌에 참여할 수 있습니다.';
 }
 bind('guild-raid',actions.raid,{disabled:!guild});
 const attended=status.attendDay===status.period.day;
 bind('guild-attend',actions.attend,{disabled:!guild||attended});$('#guild-attend strong').textContent=attended?'출석 완료':'동맹 출석';$('#guild-attend small').textContent=`골드 ${attendReward.gold} · 공헌 ${attendReward.contribution}`;
 for(const [id,key] of [['guild-shop','shop'],['guild-research','research'],['guild-manage','manage']])bind(id,actions[key],{disabled:!guild});
 artworkShell(root,{screen:'alliance',title:'동맹',progress:state});
 const painting=paintArtworkLayout(root,{hollow:'.headquarters'});
 const images=decorativeLineup(root,2).map(async(id,i)=>{const img=await generalArtwork(id,{center:[142,798][i],height:232,feet:691});if(img&&token===revision)$('.general-lineup').append(img);});
 try{await Promise.all([allianceReady,painting,...images,document.fonts.ready,...[...root.querySelectorAll('img')].map(i=>i.decode())]);}
 finally{if(token===revision){root.inert=false;root.setAttribute('aria-busy','false');}}
}
