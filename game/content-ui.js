// Dialogs for the collection and side content: 도감·인연 임무, 시작 7일 임무, 토벌 파견, 연무탑.
// Rules live in collection.js / services.js / expedition.js / tower.js; this file only shows and sends commands.
import {heroes,generalRoster,activeRoster,generalRosterIds} from './heroes.js';
import {specs} from './progression.js';
import {bonds} from './bonds.js';
import {factions} from './factions.js';
import {dialogRow,dialogInset,dialogEmpty,escapeHtml} from './dialog-content.js';
import {heroSources,codexComplete,codexReward,factionRoster,factionTitles,startMissions,startFinalReward,BOND_MISSION_WINS} from './collection.js';
import {serviceCommand,prepareServices} from './services.js';
import {rewardText} from './services-ui.js';
import {sites,siteOpen,expeditionRules,expeditionStatus,expeditionCommand,teamBonus,heroPower} from './expedition.js';
import {towerStages,stageUnlocked,stageCleared} from './stages.js';
import {constraintText,towerDeck,towerProgress,towerFloorIds} from './tower.js';
import {unlocked,lockText} from './unlocks.js';

const hero=id=>heroes.find(h=>h.id===id);
const body=()=>document.querySelector('#modal-body');
const minutes=ms=>{const m=Math.max(0,Math.ceil(ms/60000));return m>=60?Math.floor(m/60)+'시간 '+(m%60)+'분':m+'분';};

export function initContent({store,dialog,toast,startBattle}){
 const run=async(change,refresh,message)=>{try{await store.transact(change);if(message)toast(message);refresh();}catch(error){toast(error.message);}};
 const snapshot=()=>{const s=store.get();prepareServices(s);return s;};

 // 도감: every hero by faction, where to get the missing ones, faction completion reward, bond missions.
 function codex(focus){
  const s=snapshot(),q=s.services,owned=id=>s.heroes[id]?.owned;
  const missions=Object.entries(q.bondMissions).filter(([,m])=>generalRosterIds.has(m.hero)).map(([id,m])=>{const bond=bonds.find(b=>b.id===id);return bond?`<div class="service-row"><div><strong>${bond.name} · ${hero(m.hero).name}</strong><small>출정 승리 ${m.wins} / ${BOND_MISSION_WINS} · 보상 ${hero(m.hero).name} ${owned(m.hero)?'카드 1장':'합류'}</small></div><button class="action" data-bond-mission="${id}" ${m.claimed||m.wins<BOND_MISSION_WINS?'disabled':''}>${m.claimed?'수령 완료':'받기'}</button></div>`:'';}).join('');
  dialog.open('장수 도감',`<p>보유 ${generalRoster.filter(h=>owned(h.id)).length} / ${generalRoster.length}명 · 장수를 누르면 얻는 곳이 나옵니다.</p><div id="codex-detail" role="status">${focus?sourceText(focus,owned(focus)):''}</div>`+
   Object.values(factions).map(f=>{const ids=factionRoster(f.id),have=ids.filter(owned).length,done=!!q.codex[f.id];
    return `<section><h3 style="color:${f.color}">${f.title} · ${have} / ${ids.length}</h3><div class="codex-grid">${ids.map(id=>`<button class="codex-card ${owned(id)?'':'missing'}" data-codex="${id}" aria-label="${hero(id).name} ${owned(id)?'보유':'미보유'}"><img src="${hero(id).portrait}" alt=""><span>${hero(id).name}</span><b>${specs[id].grade}</b></button>`).join('')}</div><button class="action secondary" data-codex-reward="${f.id}" ${done||!codexComplete(s,f.id)?'disabled':''}>${done?'달성 보상 수령 완료 · '+factionTitles[f.id]:'전원 수집 보상 '+rewardText(codexReward)+' + 칭호'}</button></section>`;}).join('')+
   `<section><h3>인연 임무</h3>${missions||dialogEmpty('scroll','인연의 구성원을 한 명만 남기고 모으면 임무가 열립니다.')}</section>`);
  body().querySelectorAll('[data-codex]').forEach(b=>b.onclick=()=>{body().querySelector('#codex-detail').innerHTML=sourceText(b.dataset.codex,owned(b.dataset.codex));body().querySelector('#codex-detail').scrollIntoView({block:'nearest'});});
  body().querySelectorAll('[data-codex-reward]').forEach(b=>b.onclick=()=>run(st=>serviceCommand(st,{type:'codex',faction:b.dataset.codexReward}),()=>codex(),'도감 달성 보상을 받았습니다.'));
  body().querySelectorAll('[data-bond-mission]').forEach(b=>b.onclick=()=>run(st=>serviceCommand(st,{type:'bond-mission',id:b.dataset.bondMission}),()=>codex(),'인연 임무 보상을 받았습니다.'));
 }
 const sourceText=(id,owned)=>dialogInset(`<strong>${hero(id).name}</strong> · ${hero(id).faction} · ${specs[id].grade}등급 · ${hero(id).role} · ${owned?'보유 중':'미보유'}<br>얻는 곳: ${heroSources(id).join(' · ')}<br>인연: ${bonds.filter(b=>b.members.includes(id)&&b.members.filter(member=>generalRosterIds.has(member)).length>=b.need).map(b=>b.name).join(' · ')||'없음'}`);

 // 시작 7일 임무
 function start(){
  const s=snapshot(),q=s.services,today=Number(q.periods.day)-q.start.day0+1,all=startMissions.every(m=>q.start.claimed[m.day]);
  dialog.open('시작 7일 임무',`<p>하루에 하나씩 열립니다. 기한은 없습니다. 오늘은 ${Math.min(7,today)}일차입니다.</p>`+startMissions.map(m=>{const open=m.day<=today,done=open&&m.done(s),claimed=!!q.start.claimed[m.day];
   return `<div class="service-row"><div><strong>${m.day}일차 · ${m.name}</strong><small>${open?(done?'달성':'진행 중'):m.day+'일차에 열림'} · ${rewardText(m.reward)}</small></div><button class="action" data-start="${m.day}" ${claimed||!done?'disabled':''}>${claimed?'수령 완료':'받기'}</button></div>`;}).join('')+
   `<button class="action secondary" id="start-final" ${q.start.claimed.final||!all?'disabled':''}>${q.start.claimed.final?'완주 보상 수령 완료':'7일 완주 보상 '+rewardText(startFinalReward)+' (A등급 선택상자 1회분)'}</button>`);
  body().querySelectorAll('[data-start]').forEach(b=>b.onclick=()=>run(st=>serviceCommand(st,{type:'start-mission',day:Number(b.dataset.start)}),start,'보상을 받았습니다.'));
  body().querySelector('#start-final').onclick=()=>run(st=>serviceCommand(st,{type:'start-mission',day:'final'}),start,'완주 보상을 받았습니다.');
 }

 // 토벌 파견
 function expedition(){
  const s=store.get();if(!unlocked(s,'expedition')){dialog.open('토벌 파견','<p>'+lockText('expedition')+'</p>');return;}
  const now=Date.now(),status=expeditionStatus(s,now),last=s.expedition?.last;
  const slots=status.slots.map(slot=>{const site=sites.find(x=>x.id===slot.site),back=now>=slot.endsAt;return `<div class="service-row"><div><strong>${site.name}</strong><small>${slot.heroes.map(id=>hero(id).name).join(' · ')} · ${back?'귀환':'남은 시간 '+minutes(slot.endsAt-now)}</small></div><button class="action" data-claim="${escapeHtml(slot.id)}" ${back?'':'disabled'}>${back?'보상 받기':'진행 중'}</button></div>`;}).join('');
  dialog.open('토벌 파견',`<p>장수 3명을 보내면 ${expeditionRules.duration/3600000}시간 뒤 돌아옵니다. 보낸 장수도 전투에 그대로 쓸 수 있습니다.</p>`+dialogRow('군량',(s.provisions??0)+' · 1회 '+expeditionRules.provisions+' (내정 농지 수확)')+dialogRow('오늘 파견',status.count+' / '+expeditionRules.daily+' · 동시 '+status.slots.length+' / '+expeditionRules.slots)+
   (last?dialogInset('지난 보상 · '+Object.entries(last.got).map(([k,v])=>k==='treasure'?'보물 '+v:rewardText({[k]:v})).join(' + ')):'')+
   `<section><h3>파견 중</h3>${slots||dialogEmpty('map','파견 중인 부대가 없습니다.')}</section><section><h3>파견지</h3>${sites.map(site=>{const open=siteOpen(s,site);return `<div class="service-row"><div><strong>${site.name}</strong><small>${open?'필요 전투력 '+site.power+' · '+rewardText(site.reward)+' · '+site.faction+' 장수 1명당 +10%':'해당 전역을 완료하면 열립니다.'}</small></div><button class="action" data-site="${site.id}" ${open?'':'disabled'}>보내기</button></div>`;}).join('')}</section>`);
  body().querySelectorAll('[data-claim]').forEach(b=>b.onclick=()=>run(st=>expeditionCommand(st,{type:'claim',id:b.dataset.claim}),expedition,'파견 보상을 받았습니다.'));
  body().querySelectorAll('[data-site]').forEach(b=>b.onclick=()=>pick(sites.find(x=>x.id===b.dataset.site)));
 }
 function pick(site){
  const s=store.get(),status=expeditionStatus(s),chosen=new Set();
  const list=activeRoster.filter(h=>s.heroes[h.id].owned&&!status.busy.has(h.id)).sort((a,b)=>heroPower(s,b.id)-heroPower(s,a.id));
  dialog.open(site.name+' · 부대 편성',`<p>장수 3명을 고르세요. 필요 전투력 ${site.power}.</p><div class="codex-grid">${list.map(h=>`<button class="codex-card" data-pick="${h.id}" aria-pressed="false"><img src="${h.portrait}" alt=""><span>${h.name}</span><b>${heroPower(s,h.id)}</b></button>`).join('')}</div><p id="expedition-summary" role="status"></p><div class="modal-actions"><button class="action secondary" id="expedition-back">목록</button><button class="action" id="expedition-send" disabled>파견</button></div>`);
  const summary=()=>{const ids=[...chosen],power=ids.reduce((n,id)=>n+heroPower(s,id),0),bonus=ids.length?teamBonus(site,ids):{rate:0,sameFaction:0,bond:false};
   body().querySelector('#expedition-summary').textContent=`선택 ${ids.length} / 3 · 전투력 ${power} / ${site.power} · 보상 +${Math.round(bonus.rate*100)}%`+(bonus.bond?' (인연)':'');
   body().querySelector('#expedition-send').disabled=ids.length!==3||power<site.power;};
  body().querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{const id=b.dataset.pick;if(chosen.has(id))chosen.delete(id);else if(chosen.size<3)chosen.add(id);b.setAttribute('aria-pressed',String(chosen.has(id)));summary();});
  body().querySelector('#expedition-back').onclick=expedition;
  body().querySelector('#expedition-send').onclick=()=>{const id=crypto.randomUUID();run(st=>expeditionCommand(st,{type:'send',id,site:site.id,heroes:[...chosen]}),expedition,'부대를 파견했습니다.');};
  summary();
 }

 // 연무탑
 function tower(){
  const s=store.get();if(!unlocked(s,'tower')){dialog.open('연무탑','<p>'+lockText('tower')+'</p>');return;}
  const done=towerProgress(s),next=towerFloorIds.find(id=>!stageCleared(s,id));
  const card=id=>{const f=towerStages[id],cleared=stageCleared(s,id),open=stageUnlocked(s,id),deck=towerDeck(s,f);
   return `<div class="service-row"><div><strong>${f.floor}층${f.floor%5===0?' · 장수':''}</strong><small>${constraintText(f.constraint)} · 은화 ${f.startSilver} · 보상 골드 ${f.reward.firstClearGold}${f.reward.firstClearDiamonds?' + 다이아 '+f.reward.firstClearDiamonds:''}${f.reward.extra?' + '+rewardText(f.reward.extra):''}${open&&!deck.length?' · 조건에 맞는 장수 없음':''}</small></div><button class="action" data-floor="${id}" ${open&&deck.length?'':'disabled'}>${cleared?'다시 도전':open?'도전':'잠김'}</button></div>`;};
  const shown=towerFloorIds.filter((id,i)=>i<=done+2);
  dialog.open('연무탑',`<p>층마다 제약이 다릅니다. 한 층은 1라운드이고 최초 클리어 보상만 있습니다.</p>`+dialogRow('진행',done+' / '+towerFloorIds.length+'층')+(next?'':dialogInset('모든 층을 클리어했습니다.'))+shown.reverse().map(card).join(''));
  body().querySelectorAll('[data-floor]').forEach(b=>b.onclick=()=>startBattle(b.dataset.floor));
 }
 return {codex,start,expedition,tower};
}
