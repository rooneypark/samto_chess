import {clearDecorativeLineup} from './decorative-lineup.js';
import {dialogEmpty,dialogRow,dialogInset,escapeHtml as escape} from './dialog-content.js';
import {allianceStatus,allianceCommand,guilds,raidStatus,raidRules,allianceShop,allianceBought,attendReward,research,researchCosts,CREATE_COST} from './alliance-state.js';
import {heroes} from './heroes.js';
import {designPortrait} from './art.js';
import {allianceArtwork,renderAllianceArtwork} from './alliance-ui.js';
import {disposeNineSlices} from './nine-slice.js';

// Member data comes from the save (and from restored backups), so every field is escaped on output.
const portrait = id => '<img class="guild-avatar" alt="" src="'+(designPortrait(id)??designPortrait('0'))+'">';

export function initAlliance({store,open,toast,navigate}) {
  const root=document.createElement('section');
  root.className='alliance-screen';
  root.hidden=true;
  root.setAttribute('aria-label','동맹');
  document.querySelector('.bottom-nav').before(root);
  const modal=document.querySelector('#modal');
  let busy=false;
  let sort='points';
  let expanded=false;

  async function commit(type,value){
    if(busy)return;
    busy=true;
    const buttons=[...modal.querySelectorAll('button:not(:disabled)')];
    buttons.forEach(button=>button.disabled=true);
    try{
      await store.transact(state=>allianceCommand(state,type,value));
      modal.close();
      toast(({join:'동맹 가입 완료',create:'동맹 창설 완료',leave:'동맹에서 나갔습니다.',donate:'공헌 10 획득',supply:'군량 지원 완료',claim:'골드 300 수령 완료',attend:'출석 완료',raid:'토벌 참여 완료','raid-claim':'토벌 상자 수령 완료',buy:'교환 완료',research:'연구 완료'})[type]??'저장 완료','success');
    }catch(error){
      if(!modal.open){toast(error.message);return;}
      let feedback=modal.querySelector('.guild-error');
      if(!feedback){feedback=document.createElement('p');feedback.className='guild-error';feedback.setAttribute('role','alert');document.querySelector('#modal-body').append(feedback);}
      feedback.textContent=error.message;
      buttons.forEach(button=>button.disabled=false);
    }finally{busy=false;}
  }
  function confirm(title,description,type,value){
    const action={join:'가입',leave:'나가기',donate:'기부',claim:'보상 받기',supply:'지원',kick:'추방',transfer:'위임'}[type]??'저장';
    open(title,'<p>'+description+'</p><div class="modal-actions"><button class="action secondary" id="guild-cancel">취소</button><button class="action" id="guild-confirm">'+action+'</button></div>');
    document.querySelector('#guild-cancel').onclick=()=>modal.close();
    document.querySelector('#guild-confirm').onclick=()=>commit(type,value);
  }
  function search(){
    if(store.get().alliance?.guild)return;
    open('동맹 찾기','<label class="guild-field">동맹 이름 <input id="guild-query" maxlength="12" autocomplete="off"></label><div id="guild-results"></div>');
    const input=document.querySelector('#guild-query');
    function results(){
      const matches=guilds.filter(g=>g.name.includes(input.value.trim()));
      const container=document.querySelector('#guild-results');
      container.innerHTML=matches.map(g=>'<div class="guild-modal-row">'+portrait(g.portrait)+'<div><strong>'+g.name+'</strong><br><small>NPC 동맹 · 군주 '+g.leader+'</small></div><button class="action" data-join="'+g.id+'">가입</button></div>').join('')||dialogEmpty('banner','검색 결과가 없습니다.')+'<button class="action secondary" id="guild-search-reset">검색 초기화</button>';
      container.querySelector('#guild-search-reset')?.addEventListener('click',()=>{input.value='';results();input.focus();});
      container.querySelectorAll('[data-join]').forEach(button=>button.onclick=()=>confirm('동맹 가입',guilds.find(g=>g.id===button.dataset.join).name+'에 가입합니다. '+'가입 24시간 후 기부와 군량 지원을 할 수 있습니다.','join',button.dataset.join));
    }
    input.oninput=results;
    results();
  }
  function create(){
    if(store.get().alliance?.guild)return;
    open('동맹 창설','<p>창설 비용 골드 '+CREATE_COST+'</p><form id="guild-create"><label class="guild-field">동맹 이름 <input name="name" required minlength="2" maxlength="12" autocomplete="off"></label><div class="modal-actions"><button class="action">창설</button></div></form>');
    document.querySelector('#guild-create').onsubmit=event=>{event.preventDefault();commit('create',new FormData(event.currentTarget).get('name'));};
  }
  function manage(guild,leader){
    open('동맹 관리',(leader?'<form id="guild-notice"><label class="guild-field">동맹 공지 <textarea name="notice" maxlength="80" rows="3">'+escape(guild.notice)+'</textarea></label><button class="action">공지 저장</button></form>':'')+'<div class="modal-actions"><button class="action secondary" id="guild-leave">'+(leader&&guild.members.length===1?'동맹 해산':'탈퇴')+'</button></div>');
    if(leader)document.querySelector('#guild-notice').onsubmit=event=>{event.preventDefault();commit('notice',new FormData(event.currentTarget).get('notice'));};
    document.querySelector('#guild-leave').onclick=()=>confirm('동맹 나가기','동맹에서 나가면 24시간 후 다시 가입할 수 있습니다.','leave');
    if(allianceArtwork&&leader){
      document.querySelector('#modal-body').insertAdjacentHTML('beforeend','<div class="modal-actions"><button class="action" id="guild-applications">가입 신청 '+guild.applications.length+'</button></div>');
      document.querySelector('#guild-applications').onclick=()=>applications(guild);
    }
  }
  function applications(guild){
    open('가입 신청',guild.applications.map(m=>'<div class="guild-modal-row">'+portrait(m.portrait)+'<strong>'+escape(m.name)+'</strong><button class="action secondary" data-reject="'+escape(m.id)+'">거절</button><button class="action" data-approve="'+escape(m.id)+'">승인</button></div>').join('')||dialogEmpty('banner','대기 중인 신청이 없습니다.'));
    for(const type of ['approve','reject'])document.querySelectorAll('[data-'+type+']').forEach(button=>button.onclick=()=>commit(type,button.dataset[type]));
  }
  function memberMenu(member){
    const roleLabel=member.role==='회원'?'부군주 임명':'부군주 해임';
    open(member.name+' 관리','<p>현재 직책 · '+escape(member.role)+'</p><div class="modal-actions"><button class="action secondary" id="guild-promote">'+roleLabel+'</button><button class="action secondary" id="guild-kick" '+(member.role!=='회원'?'disabled':'')+'>추방</button><button class="action" id="guild-transfer">군주 위임</button></div>');
    for(const [type,label] of [['promote',roleLabel],['kick','추방'],['transfer','군주 위임']]){
      const consequence={promote:'님의 직책을 변경합니다.',kick:'님이 동맹에서 제외됩니다.',transfer:'님에게 군주 권한을 넘깁니다.'};
      document.querySelector('#guild-'+type).onclick=()=>confirm(label,escape(member.name)+' '+consequence[type],type,member.id);
    }
  }
  function raid(){
    const state=store.get(),r=raidStatus(state),bossName=heroes.find(h=>h.id===r.boss.hero)?.name??'';
    open('동맹 토벌','<p>'+escape(r.boss.title)+' · 약점 '+r.boss.weak+' 장수 '+raidRules.weakNeed+'명 이상이면 피해 +'+raidRules.weakBonus*100+'%</p><progress max="'+r.hp+'" value="'+r.total+'" aria-label="보스 체력"></progress>'+
      dialogRow('누적 피해',r.total.toLocaleString()+' / '+r.hp.toLocaleString())+dialogRow('내 피해',r.mine.toLocaleString())+dialogRow('동맹원(NPC) 피해',r.npc.toLocaleString())+dialogRow('오늘 도전',r.attempts+' / '+raidRules.attemptsPerDay)+dialogRow('토벌 상자',r.claimed+' / '+r.step+'개 수령 (10%마다 1개)')+
      dialogInset('저장된 출전 편성과 실제 성장으로 90초 전투를 시뮬레이션합니다. 한 번의 도전은 보스 체력의 '+raidRules.attemptCap*100+'%까지만 깎습니다. 동맹원은 NPC이며 하루에 정해진 양을 보탭니다.')+
      '<div class="modal-actions"><button class="action secondary" id="raid-claim" '+(r.step>r.claimed?'':'disabled')+'>상자 받기</button><button class="action" id="raid-go" '+(!r.open||r.defeated||r.attempts>=raidRules.attemptsPerDay?'disabled':'')+'>'+(r.defeated?'토벌 완료':'도전')+'</button></div>');
    document.querySelector('#raid-go').onclick=()=>commit('raid');document.querySelector('#raid-claim').onclick=()=>commit('raid-claim');
  }
  function researchDialog(){
    const state=store.get(),have=state.alliance?.contribution??0;
    open('동맹 연구','<p>공헌으로 동맹 전체에 적용되는 효과를 올립니다. 동맹을 나가면 사라집니다.</p>'+dialogRow('보유 공헌',have)+Object.entries(research).map(([id,r])=>{const level=state.alliance.research?.[id]??0,cost=researchCosts[level];return '<div class="service-row"><div><strong>'+r.name+' '+level+' / '+researchCosts.length+'</strong><small>'+r.text+' (단계마다) · '+(cost?'공헌 '+cost:'최고 단계')+'</small></div><button class="action" data-research="'+id+'" '+(!cost||have<cost?'disabled':'')+'>연구</button></div>';}).join(''));
    document.querySelectorAll('[data-research]').forEach(button=>button.onclick=()=>commit('research',button.dataset.research));
  }
  function guildShop(){
    const state=store.get(),now=Date.now(),have=state.alliance?.contribution??0;
    open('동맹 상점','<p>공헌으로 교환합니다. 매주 월요일 05:00에 한도와 장수 카드가 바뀝니다.</p>'+dialogRow('보유 공헌',have)+allianceShop(now).map(item=>{const left=item.limit-allianceBought(state,item.id,now);return '<div class="service-row"><div><strong>'+item.name+'</strong><small>공헌 '+item.price+' · 이번 주 '+left+' / '+item.limit+'</small></div><button class="action" data-guild-buy="'+item.id+'" '+(left<=0||have<item.price?'disabled':'')+'>'+(left<=0?'완료':'교환')+'</button></div>';}).join(''));
    document.querySelectorAll('[data-guild-buy]').forEach(button=>button.onclick=()=>commit('buy',button.dataset.guildBuy));
  }
  function members(){
    const guild=store.get().alliance?.guild;if(!guild)return;
    const leader=guild.members.find(m=>m.id==='me')?.role==='군주';
    const rows=[...guild.members].sort((a,b)=>sort==='points'?b.points-a.points:a.name.localeCompare(b.name,'ko'));
    open('동맹원',`<label>정렬 <select id="guild-member-sort"><option value="points">공헌순</option><option value="name">이름순</option></select></label><div class="guild-roster">${rows.map(m=>'<div class="guild-member">'+portrait(m.portrait)+'<div><strong>'+escape(m.name)+'</strong><small>'+escape(m.role)+'</small></div><span>공헌 '+Number(m.points)+'</span>'+(leader&&m.id!=='me'?'<button class="action secondary" data-member="'+escape(m.id)+'">관리</button>':'')+'</div>').join('')}</div>`);
    const select=document.querySelector('#guild-member-sort');select.value=sort;select.onchange=()=>{sort=select.value;members();};
    document.querySelectorAll('#modal [data-member]').forEach(b=>b.onclick=()=>memberMenu(guild.members.find(m=>m.id===b.dataset.member)));
  }
  function render(){
    if(!allianceArtwork){renderClassic();return;}
    const state=store.get(),status=allianceStatus(state),guild=status.guild;
    renderAllianceArtwork(root,{state,status,actions:{
      back:()=>navigate('home'),search,create,members,
      log:()=>open('활동 기록',guild.log.map(line=>'<p>'+escape(line)+'</p>').join('')||dialogEmpty('scroll','기록된 활동이 없습니다.')),
      manage:()=>manage(guild,guild.members.find(m=>m.id==='me')?.role==='군주'),
      attend:()=>commit('attend'),raid,shop:guildShop,research:researchDialog,
      donate:()=>confirm('군자금 기부','100골드를 사용해 공헌 10과 토벌 준비도 20%p를 얻습니다.','donate'),
      supply:()=>status.preparation>=100?confirm('토벌 준비 보상','준비 완료 보상 300골드를 받습니다.','claim'):confirm('군량 지원','주 1회, 토벌 준비도 40%p와 공헌 10을 얻습니다.','supply')
    }}).catch(()=>toast('동맹 이미지 로드 실패'));
  }
  function renderClassic(){
    const state=store.get();
    const status=allianceStatus(state);
    const {guild,eligible,preparation,claimed,supply,donations}=status;
    const heading='<div class="shop-heading"><button class="skin guild-back" aria-label="성문으로 돌아가기">←</button><h2>동맹</h2><span>로컬 동맹</span></div>';
    if(!guild){
      root.innerHTML=heading+'<section class="pixel-panel guild-empty"><i class="icon icon-banner"></i><h3>소속 동맹 없음</h3><p>동맹에 가입하거나 새 동맹을 창설하세요.</p><div class="guild-actions"><button class="primary" id="guild-search">동맹 찾기</button><button class="skin" id="guild-create-button">동맹 창설</button></div></section>';
      root.querySelector('#guild-create-button').onclick=create;
    }else{
      const leader=guild.members.find(m=>m.id==='me').role==='군주';
      const members=[...guild.members].sort((a,b)=>sort==='points'?b.points-a.points:a.name.localeCompare(b.name,'ko'));
      const memberRows=(expanded?members:members.slice(0,4)).map(m=>'<div class="guild-member">'+portrait(m.portrait)+'<div><strong>'+escape(m.name)+'</strong><small>'+escape(m.role)+'</small></div><span>공헌 '+Number(m.points)+'</span>'+(leader&&m.id!=='me'?'<button class="mini-teal" data-member="'+escape(m.id)+'">관리</button>':'')+'</div>').join('');
      const wait=eligible?'매일 05:00 기부 횟수 갱신':'가입 24시간 후 기부·군량 지원 가능';
      root.innerHTML=heading+`<section class="pixel-panel guild-summary">
        <div class="guild-banner"><i class="icon icon-banner"></i><div><h3>${escape(guild.name)}</h3><p>군주 · ${escape(guild.members.find(m=>m.role==='군주')?.name)}</p><p>동맹원 ${guild.members.length} / 30</p></div><div class="guild-summary-buttons"><button class="mini-teal" id="guild-manage">동맹 관리</button></div></div>
        <p class="guild-notice"><i class="icon icon-scroll"></i><strong>공지</strong> ${escape(guild.notice)||'등록된 공지가 없습니다.'}</p>
        <div class="guild-actions"><button class="primary" id="guild-applications" ${leader?'':'disabled'}>가입 신청 ${leader?guild.applications.length:''}</button><button class="skin" id="guild-log">활동 기록</button></div>
        </section><div class="guild-section-heading"><h3>동맹원</h3><select aria-label="동맹원 정렬"><option value="points">공헌순</option><option value="name">이름순</option></select></div>
        <section class="pixel-panel guild-roster">${memberRows}${members.length>4?'<button class="skin" id="guild-expand">'+(expanded?'접기':'전체 동맹원 보기')+'</button>':''}</section>
        <h3 class="shop-products-title">협력 콘텐츠</h3><section class="pixel-panel guild-coop">
        <article><i class="icon icon-swords"></i><div><h4>공동 토벌 준비</h4><progress max="100" value="${preparation}" aria-label="토벌 준비도"></progress><small>${preparation}% · 주간 준비</small></div><button class="mini-teal" id="guild-supply" ${!eligible||claimed||(supply&&preparation<100)?'disabled':''}>${claimed?'수령 완료':preparation===100?'보상 받기':supply?'지원 완료':'군량 지원'}</button></article>
        <article><i class="icon icon-chest"></i><div><h4>군자금 기부</h4><small>골드 100 → 공헌 10 · ${3-donations} / 3회</small></div><button class="mini-teal" id="guild-donate" ${!eligible||donations>=3||state.gold<100?'disabled':''}>${state.gold<100?'골드 부족':'기부'}</button></article>
        <article><i class="icon icon-scroll"></i><div><h4>동맹 출석</h4><small>골드 ${attendReward.gold} · 공헌 ${attendReward.contribution} · 하루 1회</small></div><button class="mini-teal" id="guild-attend" ${status.attendDay===status.period.day?'disabled':''}>${status.attendDay===status.period.day?'출석 완료':'출석'}</button></article>
        <article><i class="icon icon-swords"></i><div><h4>동맹 토벌</h4><small>${preparation>=100?'보스 출현 · 누적 '+Math.round(raidStatus(state).total*100/raidRules.hp)+'%':'준비도 100%가 되면 열립니다'}</small></div><button class="mini-teal" id="guild-raid" ${preparation>=100?'':'disabled'}>토벌</button></article>
        <article><i class="icon icon-shop"></i><div><h4>동맹 상점</h4><small>보유 공헌 ${status.contribution??0}</small></div><button class="mini-teal" id="guild-shop">상점</button></article>
        <article><i class="icon icon-map"></i><div><h4>동맹 연구</h4><small>둔전 개간 ${status.research?.farm??0} · 행군 훈련 ${status.research?.march??0}</small></div><button class="mini-teal" id="guild-research">연구</button></article>
        <p class="shop-reset">${wait}</p></section>`;
      root.querySelector('select').value=sort;
      root.querySelector('select').onchange=event=>{sort=event.target.value;render();};
      root.querySelector('#guild-manage').onclick=()=>manage(guild,leader);
      root.querySelector('#guild-applications').onclick=()=>applications(guild);
      root.querySelector('#guild-log').onclick=()=>open('활동 기록',guild.log.map(line=>'<p>'+escape(line)+'</p>').join('')||dialogEmpty('scroll','기록된 활동이 없습니다.'));
      root.querySelector('#guild-expand')?.addEventListener('click',()=>{expanded=!expanded;render();});
      root.querySelectorAll('[data-member]').forEach(button=>button.onclick=()=>memberMenu(guild.members.find(m=>m.id===button.dataset.member)));
      root.querySelector('#guild-attend').onclick=()=>commit('attend');root.querySelector('#guild-raid').onclick=raid;root.querySelector('#guild-shop').onclick=guildShop;root.querySelector('#guild-research').onclick=researchDialog;
      root.querySelector('#guild-donate').onclick=()=>confirm('군자금 기부','100골드를 사용해 공헌 10과 토벌 준비도 20%p를 얻습니다.','donate');
      root.querySelector('#guild-supply').onclick=()=>preparation===100?confirm('토벌 준비 보상','준비 완료 보상 300골드를 받습니다.','claim'):confirm('군량 지원','주 1회, 토벌 준비도 40%p와 공헌 10을 얻습니다.','supply');
    }
    root.querySelector('#guild-search')?.addEventListener('click',search);
    root.querySelector('.guild-back').onclick=()=>navigate('home');
  }
  store.subscribe(()=>{if(!root.hidden)render();});
  window.addEventListener('focus',()=>{if(!root.hidden)render();});
  return {show(visible){if(!visible)clearDecorativeLineup(root);root.hidden=!visible;root.closest('.game').classList.toggle('alliance-art',visible&&allianceArtwork);if(visible)render();else disposeNineSlices(root);}};
}
