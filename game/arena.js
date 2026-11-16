import {arenaArtwork,renderArenaArtwork} from './arena-ui.js';
import {disposeNineSlices} from './nine-slice.js';
import {heroes} from './heroes.js';
import {periods} from './economy.js';
import {arenaRules,strategyNames,strategyEffects,opponentStrategy} from './battle-data.js';
import {escapeHtml,dialogRow,dialogInset} from './dialog-content.js';
import {opponentPool,opponentsFor,tierOf,tiers,seasonRewards,seasonEndsAt,seasonOf,meritRules,meritShop,meritBought,arenaCommand,emptyArena,bannedHeroes,applyBans} from './arena-state.js';
import {rewardText} from './services-ui.js';

const rules = {level:arenaRules.level,star:arenaRules.star,rank:arenaRules.rank,treasures:false};
const payouts = {승리:[arenaRules.winGold,meritRules.win],패배:[arenaRules.otherGold,meritRules.other],무승부:[arenaRules.otherGold,meritRules.other]};
const dailyLimit = arenaRules.dailyLimit;
const strategyLabel = id => strategyNames[id]+' · '+strategyEffects[id];
const findHero = id => heroes.find(hero => hero.id === id);
const lineup = ids => '<div class="arena-lineup">'+ids.map(id=>{
  const hero = findHero(id);
  if (!hero) return '';
  return '<div><img src="'+hero.portrait+'" alt=""><span>'+hero.name+'</span><b>Ⅲ</b></div>';
}).join('')+'</div>';

export function initArena({store,dialog,toast,formation,navigate,startBattle}) {
  const root = document.createElement('section');
  root.className = 'alliance-screen arena-screen';
  root.hidden = true;
  root.setAttribute('aria-label','군웅대전');
  document.querySelector('.bottom-nav').before(root);
  let page = 0, pick = 0, commandBusy=false;

  async function save(change) {
    try {
      await store.transact(state => {
        state.arena = change(state.arena ?? emptyArena(),state);
        return state;
      });
      return true;
    } catch(error) {
      dialog.open('대전 준비 오류','<p class="arena-error" role="alert"></p>');
      document.querySelector('.arena-error').textContent = error.message;
      return false;
    }
  }
  const command = async (c,message,after) => {
    if(commandBusy)return;commandBusy=true;
    try { await store.transact(state => arenaCommand(state,c)); if (message) toast?.(message); after?.(); }
    catch(error) { toast?.(error.message); }finally{commandBusy=false;}
  };

  function shop() {
    if(arenaArtwork){navigate('meritShop');return;}
    const state = store.get(), now = Date.now();
    dialog.open('군공 상점','<p>군공은 대전 보상으로 얻습니다. 매주 월요일 05:00에 한도와 장수 카드가 바뀝니다.</p>'+dialogRow('보유 군공',(state.merit??0).toLocaleString())+
      meritShop(now).map(item=>{const left=item.limit-meritBought(state,item.id,now);
        return '<div class="service-row"><div><strong>'+item.name+'</strong><small>군공 '+item.price+' · 이번 주 '+left+' / '+item.limit+'</small></div><button class="action" data-merit="'+item.id+'" '+(left<=0||(state.merit??0)<item.price?'disabled':'')+'>'+(left<=0?'완료':'교환')+'</button></div>';}).join(''));
    document.querySelectorAll('[data-merit]').forEach(button=>button.onclick=()=>command({type:'buy',item:button.dataset.merit},'교환했습니다.',shop));
  }
  function season(arena) {
    const tier = tierOf(arena.score);
    dialog.open('시즌과 등급','<p>시즌은 28일입니다. 한 판 이상 치른 시즌이 끝나면 등급 보상이 우편으로 오고, 점수는 1,000점 쪽으로 절반 당겨집니다.</p>'+
      dialogRow('현재 등급',tier.name+' · '+arena.score.toLocaleString()+'점')+dialogRow('시즌 종료',new Date(seasonEndsAt(Date.now())).toLocaleDateString('ko-KR'))+
      tiers.map((t,i)=>dialogRow(t.name+' ('+t.min.toLocaleString()+'점 이상)'+(t===tier?' ◀':''),rewardText(seasonRewards[i]))).join(''));
  }

  function render() {
    const state = store.get();
    const arena = state.arena ?? emptyArena();
    const candidates = opponentsFor(arena.score,page);
    const banned = bannedHeroes(Date.now()), bannedNames = banned.map(id=>findHero(id).name).join(' · ');
    const picked = candidates[pick%candidates.length];
    const opponent = arena.match?.opponent ?? {...picked,order:applyBans(picked.order,Date.now())};
    const playerOrder = arena.match?.playerOrder ?? state.order;
    const playerStrategy = arena.match?.playerStrategy ?? state.strategy ?? 'vanguard';
    const foeStrategy = opponentStrategy({opponent});
    const opponentName = escapeHtml(opponent.name), opponentScore = Number(opponent.score).toLocaleString();
    const rankings = [...opponentPool,{name:'나',score:arena.score,id:'me'}].sort((a,b)=>b.score-a.score);
    const rank = rankings.findIndex(entry=>entry.id==='me')+1;
    const today = periods(Date.now()).day;
    const rewards = arena.rewardDay===today ? arena.rewards : 0;
    const matches = arena.matchDay===today ? arena.dayMatches??0 : 0;
    const tier = tierOf(arena.score);
    const layoutSaved = arena.layout && playerOrder.every(id=>arena.layout[id]);
    if(arenaArtwork)renderArenaArtwork(root,{state,arena,opponent,playerOrder,tier,rewards}).catch(()=>toast?.('대전 이미지를 불러오지 못했습니다. 다시 열어 주세요.'));
    else root.innerHTML = `
      <div class="shop-heading"><button class="skin guild-back" aria-label="성문으로 돌아가기">←</button><h2>군웅대전</h2><span>로컬 대전</span></div>
      <section class="pixel-panel arena-panel">
        <div class="arena-intro"><i class="icon icon-swords"></i><div><h3>공정 대전 · 비동기</h3><p>훈련 10 · 각성 3 · 전투등급 Ⅲ · 보물 미적용</p></div><button class="skin" id="arena-rules" aria-label="대전 규칙">ⓘ</button></div>
        <div class="arena-bar"><span>등급 <b id="arena-tier">${tier.name}</b> · ${rank}위</span><span>대전 점수 <b>${arena.score.toLocaleString()}</b></span><button class="mini-teal" id="arena-rank">순위표</button></div>
        <div class="arena-bar"><span>군공 <b id="arena-merit">${(state.merit??0).toLocaleString()}</b></span><button class="mini-teal" id="arena-history">기록</button><button class="mini-teal" id="arena-season">시즌·등급</button><button class="mini-teal" id="arena-shop">군공 상점</button></div>
      </section>
      <section class="pixel-panel arena-panel">
        <div class="arena-bar"><h3>내 편성 · ${playerOrder.length} / 6</h3><button class="mini-teal" id="arena-formation" ${arena.match?'disabled':''}>편성 변경</button></div>
        ${lineup(playerOrder)}
        <p class="muted">내 군략 · ${strategyLabel(playerStrategy)} · ${layoutSaved?'지난 대전의 배치 사용':'기본 배치'}</p>
        <div class="arena-bar"><span class="muted">방어 편성 · ${arena.defense?'저장됨':'미저장'}</span><button class="mini-teal" id="arena-defense">현재 편성으로 저장</button></div>
        <div class="arena-versus">VS</div>
        <div class="arena-bar"><h3>${opponentName} · ${opponentScore}점</h3><button class="mini-teal" id="arena-opponent">상대 상세</button></div>
        ${lineup(opponent.order)}
        <p class="muted" id="arena-foe-strategy">상대 군략 · ${strategyLabel(foeStrategy)}</p>
        <p class="muted" id="arena-bans">이번 주 금지 장수 · ${bannedNames}</p>
        <button class="skin arena-next" id="arena-next" ${arena.match?'disabled':''}>다른 상대 보기</button>
        <button class="primary arena-start" id="arena-start">${arena.match?'준비한 대전 보기':'대전 시작'}</button>
      </section>
      <section class="pixel-panel arena-panel arena-rewards"><h3>대전 보상</h3>
        <div>${Object.entries(payouts).map(([result,[gold,merit]])=>'<span><i class="icon icon-gold"></i>'+result+' '+gold+'골드 · 군공 '+merit+'</span>').join('')}</div>
        <p>오늘 보상 횟수 ${rewards} / ${dailyLimit} · 05:00 갱신</p><p>오늘 ${Math.min(matches,meritRules.dailyMatches)} / ${meritRules.dailyMatches}판 · 3판째에 ${rewardText(meritRules.dailyBonus)}</p>
      </section>`;
    root.querySelector('.guild-back').onclick = () => navigate('home');
    const saveDefense=()=>command({type:'defense'},'방어 편성을 저장했습니다.');
    root.querySelector('#arena-formation').onclick = arenaArtwork?()=>{
      dialog.open('대전 편성',lineup(playerOrder)+'<p>내 군략 · '+strategyLabel(playerStrategy)+' · '+(layoutSaved?'지난 대전의 배치 사용':'기본 배치')+'</p><div class="modal-actions"><button class="action" id="arena-edit-formation">편성 변경</button><button class="action secondary" id="arena-defense">현재 편성으로 방어 저장</button></div>');
      document.querySelector('#arena-edit-formation').onclick=formation;document.querySelector('#arena-defense').onclick=saveDefense;
    }:formation;
    root.querySelector('#arena-shop').onclick = shop;
    root.querySelector('#arena-history').onclick = arenaArtwork?()=>navigate('arenaHistory'):() => dialog.open('전투 기록','<p>최근 10판입니다. 다시 보기는 아직 없습니다.</p>'+((arena.history??[]).map(h=>dialogRow(escapeHtml(h.opponent)+' · '+new Date(h.time).toLocaleDateString('ko-KR'),({win:'승리',loss:'패배',draw:'무승부',abandoned:'포기'})[h.outcome]+' · '+(h.score>=0?'+':'')+h.score+'점')).join('')||'<p class="muted">기록이 없습니다.</p>'));
    root.querySelector('#arena-season').onclick = arenaArtwork?()=>navigate('arenaSeason'):()=>season(arena);
    root.querySelector('#arena-defense')?.addEventListener('click',saveDefense);
    root.querySelector('#arena-next').onclick = arenaArtwork?()=>navigate('arenaOpponents'):() => {
      pick++;
      if (pick%candidates.length===0) page = (page+1)%Math.ceil(opponentPool.length/3);
      render();
      root.querySelector('#arena-next').focus({preventScroll:true});
    };
    const showOpponent = () => dialog.open(
      '상대 상세','<p>'+opponentName+' · '+opponentScore+'점 · '+tierOf(opponent.score).name+' · NPC</p>'+lineup(opponent.order)+'<p>군략 · '+strategyLabel(foeStrategy)+'</p>'+
      '<p class="muted">저장된 6인 편성 · 훈련 10 · 각성 3 · 전투등급 Ⅲ</p>');
    root.querySelector('#arena-opponent')?.addEventListener('click',showOpponent);
    root.querySelector('#arena-overview')?.addEventListener('click',()=>{});
    root.querySelector('#arena-rank').onclick = arenaArtwork?()=>navigate('arenaRanking'):() => dialog.open('로컬 순위표',
      '<ol class="arena-rank-list">'+rankings.map(entry=>'<li><strong>'+escapeHtml(entry.name)+'</strong><span>'+Number(entry.score).toLocaleString()+'점 · '+tierOf(entry.score).name+'</span></li>').join('')+'</ol>'+dialogInset('NPC 20명과 나의 점수입니다. NPC 점수는 고정입니다.'));
    root.querySelector('#arena-rules').onclick = () => {dialog.open('공정 대전 규칙',
      '<p>모든 장수는 훈련 '+rules.level+', 각성 '+rules.star+', 전투등급 Ⅲ으로 맞추고 보물 효과를 제외합니다. 군략은 양 진영이 각자의 것을 적용합니다.</p><p>대전 결과에 따라 골드와 군공을 지급하며, 하루 최대 '+dailyLimit+'회입니다. 보상은 전투 결과가 확정된 뒤 받을 수 있습니다.</p><p>대전 준비 화면에서 장수를 옮겨 배치할 수 있고, 그 배치는 다음 대전에도 쓰입니다.</p><p id="arena-bans">이번 주 금지 장수 · '+bannedNames+'</p><p id="arena-foe-strategy">상대 군략 · '+strategyLabel(foeStrategy)+'</p>'+(arenaArtwork?'<div class="modal-actions"><button class="action" id="arena-opponent">상대 상세</button></div>':''));
      if(arenaArtwork)document.querySelector('#arena-opponent').onclick=showOpponent;
    };
    root.querySelector('#arena-start').onclick = () => {
      if (arena.match) {startBattle(arena.match);return;}
      if (state.order.some(id=>banned.includes(id))) {dialog.open('금지 장수','<p>이번 주에는 '+bannedNames+'을(를) 대전에 쓸 수 없습니다. 편성을 바꿔 주세요.</p>');return;}
      dialog.confirm('대전 시작',opponent.name+'과 대전할 6인 편성을 확정합니다. 내 군략 '+strategyNames[playerStrategy]+' · 상대 군략 '+strategyNames[foeStrategy]+'. 확정 후에는 편성과 군략이 이 대전에 고정됩니다.','편성 확정',async()=>{
        const success = await save((current,latest)=>current.match ? current : {...current,match:{
          id:crypto.randomUUID(),createdAt:Date.now(),status:'prepared',playerOrder:[...latest.order],playerStrategy:latest.strategy??'vanguard',
          ...(current.layout&&latest.order.every(id=>current.layout[id])?{playerLayout:current.layout}:{}),opponent:{...opponent,strategy:foeStrategy},rules
        }});
        if(success) startBattle(store.get().arena.match);
      });
    };
  }

  store.subscribe(()=>{if(!root.hidden)render();});
  return {getOpponentSelection:()=>({page,pick:pick%3}),selectOpponent(nextPage,nextPick){page=nextPage;pick=nextPick;},async show(visible){root.hidden=!visible;root.closest('.game').classList.toggle('arena-art',visible&&arenaArtwork);if(!visible){disposeNineSlices(root);return;}
    render();
    // Season rollover (reward mail, score compression) is applied when the screen opens in a new season.
    const arena=store.get().arena;
    if(arena&&arena.season!==seasonOf(Date.now()))try{await store.transact(state=>arenaCommand(state,{type:'season'}));}catch{}
  }};
}
