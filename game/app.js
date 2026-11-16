import {createToast} from './toast.js';
import {initArenaOpponents} from './arena-opponents-screen.js';
import {initArenaSeason} from './arena-season-screen.js';
import {initArenaRecords} from './arena-records-screen.js';
import {initMeritShop} from './merit-shop-screen.js';
import {initProductsScreen} from './products-screen.js';
import {initRatesScreen} from './rates-screen.js';
import {initRecruitResultsScreen} from './recruit-results-screen.js';
import {initSSelectScreen} from './s-select-screen.js';
import {initExchangeScreen} from './exchange-screen.js';
import {initStrategyScreen} from './strategy-screen.js';
import {initFormationScreen} from './formation-screen.js';
import {initSettingsScreen} from './settings-screen.js';
import {initProfileScreen} from './profile-screen.js';
import {initTreasureScreen} from './treasure-screen.js';
import {initGovernmentArtwork} from './government-ui.js';
import {initTower} from './tower-ui.js';
import {initExpedition} from './expedition-ui.js';
import {initStartMissions} from './start-missions.js';
import {artSet} from './art.js';
import {initCodex} from './codex-ui.js';
import {initCampaign} from './campaign.js';
import {initMail} from './mail.js';
import {mailArtwork} from './mail-ui.js';
import {initMissions} from './missions.js';
import {missionsArtwork} from './missions-ui.js';
import {campaignArtwork,campaignReady} from './campaign-ui.js';
import {preloadArtwork,uiComponentsReady} from './art-controls.js';
import {gateTitleArtwork} from './ui-shell.js';
import {arenaReady} from './arena-ui.js';
import {allianceReady} from './alliance-ui.js';
import {shopReady} from './shop-ui.js';
import {barracksReady} from './barracks-ui.js';
import {initGateLobby} from './gate-lobby.js';
import {initGovernment,governmentUnlocked} from './government.js';

import {campaignCatalog} from './campaign-catalog.js';
import {stages,stageOrder,stageName,chapters,stageStatus,currentStage,hardUnlocked,hardCleared,hardRules} from './stages.js';
import {initContent} from './content-ui.js';
import {unlocked,lockText,nextUnlocks,unlockLevels} from './unlocks.js';
import {strategyNames,strategyEffects,baseStrategies} from './battle-data.js';
import {bootStore,settingsPanel} from './settings.js';
import {initServices,rewardText} from './services-ui.js';
import {lordLevel,lordReward,unclaimedLordRewards,lordMaxLevel,serviceCommand} from './services.js';
import {initBattle} from './battle.js';
import {dialogHero,dialogRow,dialogEmpty,dialogInset} from './dialog-content.js';
import { createGameDialog } from './dialog.js';
import { initArena } from './arena.js?ui=arena-v2';
import { initAlliance } from './alliance.js?ui=alliance-v2-review';
import { initShop } from './shop.js';
import { initBarracks } from './barracks.js';
import { heroes } from './heroes.js';

const game = document.querySelector('.game');
// Retire old playtest bookmarks without replacing the real profile or active run.
if(['art-test','alliance-test','arena-test','arena-originals'].some(key=>new URLSearchParams(location.search).has(key))){const url=new URL(location.href);for(const key of ['art-test','alliance-test','arena-test','arena-originals'])url.searchParams.delete(key);history.replaceState(history.state,'',url.href);}
game.inert=true;game.setAttribute('aria-busy','true');
const party = document.querySelector('.party');
const modal = document.querySelector('#modal');
const body = document.querySelector('#modal-body');
const gameDialog = createGameDialog(modal,{artwork:artSet==='a'});
const store = await bootStore(gameDialog);
let state = store.get();
const gateLobby = initGateLobby(game,store);
store.subscribe(next => { state = next; { const l = lordLevel(state), small = document.querySelector('.profile small'); if (small) { small.textContent = 'Lv.' + l.level; document.querySelector('.xp i').style.width = (l.next ? Math.round(l.xp / l.next * 100) : 100) + '%'; } } game.classList.toggle('reduce-motion',state.reducedMotion);game.classList.toggle('large-text',!!state.preferences?.largeText);document.body.classList.toggle('large-text',!!state.preferences?.largeText);game.classList.toggle('reduced-fx',!!state.preferences?.reducedFx); });
const {show:toast,hide:hideToast}=createToast(document.querySelector('#toast'));
const open=gameDialog.open;

async function save(next) {
  try {
    await store.update(next);
    return true;
  } catch {
    toast('저장 실패');
    return false;
  }
}

// Account identity is independent of a nation. Legacy faction fields are retained only for save compatibility.
const lord = () => heroes.find(hero => hero.id === '0');
function renderParty() {
  document.querySelector('.profile img').src = lord().portrait;
  { const l = lordLevel(state); document.querySelector('.profile small').textContent = 'Lv.' + l.level; document.querySelector('.xp i').style.width = (l.next ? Math.round(l.xp / l.next * 100) : 100) + '%'; }
  game.dataset.faction = state.faction ?? '';
  { const id = currentStage(state); document.querySelector('.campaign').textContent = (chapters[stages[id].chapterId] ?? '전역').replace(/ \(.*/, '') + ' · ' + stageName(id); }
  party.replaceChildren();
  for (const id of state.order) {
    const hero = heroes.find(item => item.id === id);
    const button = document.createElement('button');
    button.className = 'hero';
    button.setAttribute('aria-label', `${hero.name} 상세 보기`);
    button.innerHTML = `<img src="${hero.sprite}" alt=""><span class="hero-label">${hero.name}</span>`;
    button.onclick = () => heroDetail(hero);
    party.append(button);
  }
  gateLobby.render(state);
  game.classList.toggle('reduce-motion', state.reducedMotion);game.classList.toggle('large-text',!!state.preferences?.largeText);document.body.classList.toggle('large-text',!!state.preferences?.largeText);game.classList.toggle('reduced-fx',!!state.preferences?.reducedFx);
}

function heroDetail(hero) { navigate('barracks', hero.id); }

function formation() {
  if(artSet==='a'){navigate('formation',currentTab);return;}
  const draft = [...state.order];
  open('출전 편성', '<p>장수 6명의 성문 배치 순서를 변경합니다.</p><ol class="formation-list"></ol><div class="formation-replacement"><label>교체할 슬롯 <select id="replace-slot"></select></label><label>보유 장수 <select id="replace-hero"></select></label><button class="action secondary" id="replace-party">장수 교체</button></div><div class="modal-actions"><button class="action secondary" id="cancel-party">취소</button><button class="action" id="save-party">편성 저장</button></div>');
  function draw() {
    const list = body.querySelector('ol');
    list.replaceChildren();
    draft.forEach((id, index) => {
      const hero = heroes.find(item => item.id === id);
      const row = document.createElement('li');
      row.innerHTML = `<img src="${hero.sprite}" alt=""><span>${index + 1}. ${hero.name}</span><button aria-label="${hero.name} 앞으로" ${index === 0 ? 'disabled' : ''}>↑</button><button aria-label="${hero.name} 뒤로" ${index === draft.length - 1 ? 'disabled' : ''}>↓</button>`;
      row.querySelectorAll('button').forEach((button, direction) => {
        button.onclick = () => {
          const next = index + (direction === 0 ? -1 : 1);
          [draft[index], draft[next]] = [draft[next], draft[index]];
          draw();
          list.children[next].querySelectorAll('button')[direction].focus();
        };
      });
      list.append(row);
    });
  }
  draw();
  function replacements(){
   document.querySelector('#replace-slot').innerHTML=draft.map((id,i)=>`<option value="${i}">${i+1}. ${heroes.find(h=>h.id===id).name}</option>`).join('');
   const available=heroes.filter(h=>state.heroes[h.id].owned&&!draft.includes(h.id));
   document.querySelector('#replace-hero').innerHTML=available.map(h=>`<option value="${h.id}">${h.name}</option>`).join('')||'<option>대기 장수 없음</option>';
   document.querySelector('#replace-party').disabled=!available.length;
  }
  replacements();
  document.querySelector('#replace-party').onclick=()=>{const id=document.querySelector('#replace-hero').value;const slot=Number(document.querySelector('#replace-slot').value);if(!state.heroes[id]?.owned||draft.includes(id))return;draft[slot]=id;draw();replacements();};
  document.querySelector('#cancel-party').onclick = () => modal.close();
  document.querySelector('#save-party').onclick = async () => {
    if (!await save({ ...state, order: draft })) return;
    renderParty();
    modal.close();
    toast('편성 저장 완료');
  };
}

const tabNames={home:'성문',barracks:'병영',shop:'상점',alliance:'동맹',arena:'군웅대전',campaign:'전역',missions:'임무',mail:'우편함',codex:'장수 도감',start:'첫 7일 보상',expedition:'토벌 파견',tower:'연무탑',government:'내정',treasure:'보물함',profile:'군주 정보',settings:'설정',formation:'장수 편성',strategy:'군략 선택',exchange:'상품 교환',sSelect:'S 장수 선택',recruitResults:'등용 결과',rates:'모집 확률',pickupRates:'픽업 확률',products:'상품 · 보급',meritShop:'군공 상점',arenaRanking:'군웅대전 순위표',arenaHistory:'군웅대전 최근 전적',arenaSeason:'시즌 · 등급',arenaOpponents:'상대 선택'};
// The HTML's default active tab is not evidence that a screen has been mounted.
let currentTab=null;
const mainTabs=['home','barracks','shop','alliance','arena'];
const shopTabs=['exchange','sSelect','recruitResults','rates','pickupRates','products'];
const arenaTabs=['meritShop','arenaRanking','arenaHistory','arenaSeason','arenaOpponents'];
function parentTab(tab){
 if(mainTabs.includes(tab))return tab;
 if(shopTabs.includes(tab))return 'shop';
 if(arenaTabs.includes(tab))return 'arena';
 if(tab==='treasure')return 'barracks';
 return 'home';
}
function navigate(tab,id,replace=false){
 if(!Object.hasOwn(tabNames,tab))tab='home';
 if(tab==='sSelect'&&artSet!=='a'){navigate('home',undefined,replace);shop.selectS();return;}
 if(tab==='exchange'&&artSet!=='a'){navigate('home',undefined,replace);shop.exchange();return;}
 if(tab==='settings'&&artSet!=='a'){navigate('home',undefined,replace);settingsPanel({store,dialog:gameDialog,toast});return;}
 if(tab==='government'&&artSet!=='a'){navigate('home',undefined,replace);government.show();return;}
 if(tab==='tower'&&artSet!=='a'){navigate('home',undefined,replace);content.tower();return;}
 if(tab==='expedition'&&artSet!=='a'){navigate('home',undefined,replace);content.expedition();return;}
 if(tab==='start'&&artSet!=='a'){navigate('home',undefined,replace);content.start();return;}
 if(tab==='codex'&&artSet!=='a'){navigate('home',undefined,replace);content.codex();return;}
 if(tab==='mail'&&!mailArtwork){navigate('home',undefined,replace);services.mail();return;}
 if(tab==='missions'&&!missionsArtwork){navigate('home',undefined,replace);services.quests();return;}
 if(tab==='campaign'&&!campaignArtwork){navigate('home',undefined,replace);actions.campaignList();return;}
 // 군주 레벨 해금: a locked tab stays closed and says when it opens.
 const gatedTab=arenaTabs.includes(tab)?'arena':tab;
 let lockedMessage='';
 if(tab==='government'&&!governmentUnlocked(state)||unlockLevels[gatedTab]&&!unlocked(state,gatedTab)){
  lockedMessage=tab==='government'?'황건 토벌을 처음 승리하면 성내 시설이 열립니다.':lockText(gatedTab);
  if(currentTab){
   if(replace&&location.hash!==`#${currentTab}`)history.replaceState({tab:currentTab},'',`#${currentTab}`);
   toast(lockedMessage);return;
  }
  tab='home';
 }
 gameDialog.dismiss();
 hideToast();
 barracks.show(tab==='barracks',id);
 shop.show(tab==='shop');
 alliance.show(tab==='alliance');
 arena.show(tab==='arena');
 arenaOpponentsScreen.show(tab==='arenaOpponents');
 arenaSeasonScreen.show(tab==='arenaSeason');
 arenaRecordsScreen.show(tab==='arenaRanking'||tab==='arenaHistory',tab==='arenaHistory'?'history':'rank');
 meritShopScreen.show(tab==='meritShop');
 campaign.show(tab==='campaign');
 missions.show(tab==='missions');
 mailbox.show(tab==='mail');
 codexScreen.show(tab==='codex');
 startScreen.show(tab==='start');
 expeditionScreen.show(tab==='expedition');
 towerScreen.show(tab==='tower');
 governmentScreen.show(tab==='government');
 treasureScreen.show(tab==='treasure',id);
 profileScreen.show(tab==='profile');
 settingsScreen.show(tab==='settings');
 formationScreen.show(tab==='formation',id);
 productsScreen.show(tab==='products');
 strategyScreen.show(tab==='strategy');
 ratesScreen.show(tab==='rates'||tab==='pickupRates',tab==='pickupRates'?'pickup':id);
 exchangeScreen.show(tab==='exchange');
 sSelectScreen.show(tab==='sSelect');
 recruitResultsScreen.show(tab==='recruitResults');
 game.classList.toggle('in-secondary',tab!=='home'&&tab!=='barracks');
 gateLobby.navigate(tab);
 document.querySelector('.hud h1').textContent=tab==='home'?'삼토체스':tabNames[tab];
 const activeTab=parentTab(tab);
 nav.querySelectorAll('button').forEach(b=>{const active=b.dataset.action===activeTab;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 if(location.hash!==`#${tab}`)history[replace?'replaceState':'pushState']({tab},'',`#${tab}`);
 currentTab=tab;
 if(lockedMessage)toast(lockedMessage);
 if(tab==='home'&&state.tutorial?.step===15&&!state.tutorial.completed){open('기초 훈련 · 마지막 단계','<p>훈련 보상 100골드를 받았습니다. 병영에서 장수를 한 번 훈련하면 기초 훈련이 완료됩니다.</p><button class="action" id="tutorial-train">'+heroes.find(hero=>hero.id===state.order[0]).name+' 훈련하러 가기</button>');body.querySelector('#tutorial-train').onclick=()=>{navigate('barracks',state.order[0]);document.querySelector('#train').click();};}
}

const government=initGovernment({store,dialog:gameDialog,toast,navigate,onArtwork:artSet==='a'?()=>navigate('government'):null});
const services=initServices({store,dialog:gameDialog,toast});
const actions = {
  home: () => navigate('home'),
  barracks: () => navigate('barracks'),
  depart: () => battle.open(null,currentStage(state)),
  profile: () => {if(artSet==='a'){navigate('profile');return;}const l=lordLevel(state),waiting=unclaimedLordRewards(state);open('군주 정보',dialogHero(lord(),'군주 Lv.'+l.level)+dialogRow('군주 경험치',l.next?l.xp+' / '+l.next:'최고 레벨 '+lordMaxLevel)+(waiting.length?'<button class="action" id="lord-reward">레벨 보상 받기 · Lv.'+waiting.join(', ')+'</button>':dialogRow('다음 레벨 보상',l.level<lordMaxLevel?rewardText(lordReward(l.level+1)):'없음'))+dialogRow('출전 장수',state.order.length+'명')+dialogRow('보유 장수',Object.values(state.heroes).filter(hero=>hero.owned).length+' / '+heroes.length+'명')+(nextUnlocks(state).length?dialogInset('다음 해금 · '+nextUnlocks(state).slice(0,3).map(u=>'Lv.'+u.level+' '+u.name).join(' · ')):'')+dialogInset('위·촉·오·군웅의 모든 장수를 등용할 수 있습니다. 편성한 장수의 세력에 따라 전투 시너지가 발동합니다.')+'<button class="action" id="government-open">내정 · 성내 시설</button>');document.querySelector('#government-open').onclick=()=>government.show();const claim=document.querySelector('#lord-reward');if(claim)claim.onclick=async()=>{claim.disabled=true;try{await store.transact(s=>serviceCommand(s,{type:'lord-reward'}));toast('군주 레벨 보상을 받았습니다.');actions.profile();}catch(e){toast(e.message);claim.disabled=false;}};},
  wallet: () => barracks.wallet(),
  mail: () => mailArtwork?navigate('mail'):services.mail(),
  quests: () => missionsArtwork?navigate('missions'):services.quests(),
  formation,
  settings: () => artSet==='a'?navigate('settings'):settingsPanel({store,dialog:gameDialog,toast}),
  codex: () => artSet==='a'?navigate('codex'):content.codex(),
  start: () => artSet==='a'?navigate('start'):content.start(),
  expedition: () => artSet==='a'?navigate('expedition'):content.expedition(),
  tower: () => artSet==='a'?navigate('tower'):content.tower(),
  campaign: () => campaignArtwork?navigate('campaign'):actions.campaignList(),
  campaignList: () => {
    const statusLabel={cleared:'완료',open:'도전 가능',locked:'잠김'},selected=currentStage(state);
    const chapterRows=Object.entries(chapters).map(([chapterId,title])=>'<section><h3>'+title+'</h3>'+stageOrder.filter(id=>stages[id].chapterId===chapterId).map(id=>{const status=stageStatus(state,id);
      return '<button class="stage-card" data-stage="'+id+'" '+(status==='locked'?'disabled':'')+'><strong>'+stageName(id)+'</strong><span>'+stages[id].rounds.length+'라운드 · '+statusLabel[status]+(status==='locked'&&stages[id].lordLevel&&!unlocked(state,'antiDong')?' · 군주 Lv.'+stages[id].lordLevel:'')+(hardCleared(state,id)?' · 어려움 완료':'')+(id===selected?' · 선택됨':'')+'</span></button>';}).join('')+'</section>').join('');
    const pending=[...new Set(campaignCatalog.filter(c=>c.status==='AUTHORING_PENDING'&&!stages[c.stageId]).map(c=>c.campaign))].filter(name=>!Object.values(chapters).some(title=>title.startsWith(name)));
    open('전역 선택','<button class="action secondary" id="tutorial-start">기초 훈련 · 소환부터 성장까지</button>'+chapterRows+(pending.length?dialogInset('제작 대기 전역: '+pending.join(' · ')+'. 적 배치·보상 데이터가 준비되면 열립니다.'):'')+(artSet==='a'?'<button class="action" id="strategy-open">군략 선택 · '+strategyNames[state.strategy??'vanguard']+'</button>':'')+'<label class="setting">군략<select id="campaign-strategy">'+Object.keys(strategyNames).map(id=>{const locked=!baseStrategies.includes(id)&&!unlocked(state,'strategies');return '<option value="'+id+'" '+(locked?'disabled':'')+'>'+strategyNames[id]+' · '+strategyEffects[id]+(locked?' (군주 Lv.'+unlockLevels.strategies+')':'')+'</option>';}).join('')+'</select></label>');
    body.querySelectorAll('[data-stage]').forEach(card=>card.onclick=()=>{
      const id=card.dataset.stage,stage=stages[id],generals=stage.rounds.flatMap(r=>r.enemies.filter(e=>e.hero).map(e=>e.title??heroes.find(h=>h.id===e.hero).name));
      open(stageName(id)+' · 전투 상세','<p>'+stage.board.width+'×'+stage.board.height+' 전장 · '+stage.rounds.length+'라운드 · 적 전멸 시 승리'+(stage.board.blocked.length?' · 지나갈 수 없는 칸 '+stage.board.blocked.length+'곳':'')+'</p>'
        +stage.rounds.map(r=>dialogRow(r.round+'라운드','적 '+r.enemies.length+'명 · 승리 은화 '+r.victorySilver+(r.equipmentReward?' · 장비 선택':''))).join('')
        +(stage.ruleText?dialogInset('전장 규칙 · '+stage.ruleText):'')+(generals.length?dialogRow('적 장수',generals.join(' · ')):'')
        +dialogRow('보상','첫 승리 '+stage.reward.firstClearGold+'골드'+(stage.reward.firstClearDiamonds?' + 무료 다이아 '+stage.reward.firstClearDiamonds:'')+(stage.grantsHero?' + '+heroes.find(h=>h.id===stage.grantsHero).name+' 합류':'')+' · 반복 '+stage.reward.repeatGold+'골드, 하루 '+stage.reward.dailyRepeatLimit+'회')
        +(stage.proposal&&id!==stageOrder[0]?'<p class="muted">적 수치는 밸런스 검증 전 제안값입니다.</p>':'')
        +dialogRow('어려움',hardUnlocked(state,id)?'적 HP ×'+hardRules.hp+' · 공격 ×'+hardRules.atk+' · 보상 ×'+hardRules.gold+(hardCleared(state,id)?' · 완료':''):'이 전역의 세 전투를 모두 깨고 군주 Lv.'+unlockLevels.hard+'이 되면 열립니다.')
        +'<div class="modal-actions"><button class="action secondary" id="stage-back">목록</button><button class="action secondary" id="stage-hard" '+(hardUnlocked(state,id)?'':'disabled')+'>어려움 출정</button><button class="action" id="stage-depart">출정</button></div>');
      document.querySelector('#stage-hard').onclick=()=>battle.open(null,id,'hard');
      document.querySelector('#stage-back').onclick=()=>actions.campaign();
      document.querySelector('#stage-depart').onclick=async()=>{if(!await save({...state,selectedStage:id}))return;renderParty();battle.open(null,id);};
    });
    body.querySelector('#tutorial-start').onclick=()=>battle.tutorial();
    const strategyOpen=document.querySelector('#strategy-open');if(strategyOpen){strategyOpen.onclick=()=>navigate('strategy');document.querySelector('#campaign-strategy').closest('label').hidden=true;}
    const strategy=document.querySelector('#campaign-strategy');strategy.value=state.strategy??'vanguard';strategy.onchange=()=>save({...state,strategy:strategy.value});
  },
};

const barracks = initBarracks({ open, toast, formation, getOrder: () => state.order, store, onHome: () => navigate('home'), onShop: () => navigate('shop'), onTreasure:artSet==='a'?id=>navigate('treasure',id):null });

const shop = initShop({store,open,toast,navigate});
const alliance = initAlliance({store,open,toast,navigate});
const battle = initBattle({store,dialog:gameDialog,navigate});
const arena = initArena({store,dialog:gameDialog,toast,formation,navigate,startBattle:match=>battle.open(match)});
const campaign = initCampaign({store,dialog:gameDialog,toast,navigate,startBattle:(id,difficulty)=>battle.open(null,id,difficulty),onSelected:renderParty,onCatalog:()=>actions.campaignList(),onDetails:id=>{actions.campaignList();body.querySelector('[data-stage="'+id+'"]')?.click();}});
const codexScreen=initCodex({host:game,store,navigate,toast,onWallet:()=>barracks.wallet(),showSources:(hero,sources)=>{open(hero.name+' 등용처',sources.map(source=>dialogRow('등용 방법',source)).join('')+'<button class="action" id="codex-recruit-shop">상점에서 등용</button>');document.querySelector('#codex-recruit-shop').onclick=()=>navigate('shop');}});
const startScreen=initStartMissions({host:game,store,navigate,toast,onWallet:()=>barracks.wallet(),onMission:day=>{if(day===4){government.show();return;}navigate(({1:'campaign',2:'barracks',3:'shop',5:'arena',6:'campaign',7:'campaign'})[day]);}});
const expeditionScreen=initExpedition({host:game,store,navigate,toast,onWallet:()=>barracks.wallet(),dialog:gameDialog});
const recruitResultsScreen=initRecruitResultsScreen({host:game,store,navigate,toast,onWallet:()=>barracks.wallet()});
const sSelectScreen=initSSelectScreen({host:game,store,navigate,toast,onWallet:()=>barracks.wallet(),onSelect:id=>shop.chooseS(id)});
const exchangeScreen=initExchangeScreen({host:game,store,navigate,toast,onWallet:()=>barracks.wallet(),onBuy:id=>shop.buy(id)});
const ratesScreen=initRatesScreen({host:game,store,navigate,toast,onWallet:()=>barracks.wallet()});
const arenaOpponentsScreen=initArenaOpponents({host:game,store,navigate,onWallet:()=>barracks.wallet(),toast,arena});
const arenaSeasonScreen=initArenaSeason({host:game,store,navigate,onWallet:()=>barracks.wallet(),toast});
const arenaRecordsScreen=initArenaRecords({host:game,store,navigate,onWallet:()=>barracks.wallet(),toast});
const meritShopScreen=initMeritShop({host:game,store,navigate,onWallet:()=>barracks.wallet(),toast});
const productsScreen=initProductsScreen({host:game,store,navigate,onWallet:()=>barracks.wallet(),open,toast});
const strategyScreen=initStrategyScreen({host:game,store,navigate,toast,onWallet:()=>barracks.wallet()});
const formationScreen=initFormationScreen({host:game,store,navigate,toast,onWallet:()=>barracks.wallet(),onSaved:renderParty});
const settingsScreen=initSettingsScreen({host:game,store,navigate,toast,onWallet:()=>barracks.wallet(),dialog:gameDialog});
const profileScreen=initProfileScreen({host:game,store,navigate,toast,onWallet:()=>barracks.wallet()});
const treasureScreen=initTreasureScreen({host:game,store,navigate,toast,onWallet:()=>barracks.wallet(),dialog:gameDialog});
const governmentScreen=initGovernmentArtwork({host:game,store,navigate,toast,onWallet:()=>barracks.wallet(),onExchange:()=>shop.exchange()});
const towerScreen=initTower({host:game,store,navigate,toast,onWallet:()=>barracks.wallet(),startBattle:id=>battle.open(null,id)});
const content = initContent({store,dialog:gameDialog,toast,startBattle:floor=>battle.open(null,floor)});
const mailbox = initMail({game,store,dialog:gameDialog,toast,navigate,onWallet:()=>barracks.wallet()});
const missions = initMissions({game,store,toast,navigate,onWallet:()=>barracks.wallet()});

document.querySelectorAll('[data-action]').forEach(button => {
  button.onclick = () => {
    const action = button.dataset.action;
    if (tabNames[action]&&!['campaign','formation'].includes(action)) navigate(action);
    else actions[action]();
  };
});
renderParty();


const nav=document.querySelector('.bottom-nav');nav.setAttribute('role','tablist');
nav.querySelectorAll('button').forEach(button=>{button.setAttribute('role','tab');button.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const tabs=[...nav.querySelectorAll('button')],i=tabs.indexOf(button);const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(i+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;navigate(tabs[next].dataset.action);tabs[next].focus();});});
window.addEventListener('popstate',()=>navigate(location.hash.slice(1),undefined,true));
navigate(location.hash.slice(1)||'home',undefined,true);

const initialArtwork={barracks:barracksReady,shop:shopReady,alliance:allianceReady,arena:arenaReady,campaign:campaignReady};
const gateArtwork=currentTab==='home'&&artSet==='a'
 ?preloadArtwork(['assets/gate-lobby/scene.png',gateTitleArtwork])
 :undefined;
await Promise.all([uiComponentsReady,initialArtwork[currentTab],gateArtwork,battle.resume()]);
delete game.dataset.booting;
game.inert=false;game.setAttribute('aria-busy','false');
