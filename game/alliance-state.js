import {periods} from './economy.js';
import {heroes} from './heroes.js';
import {specs} from './progression.js';
import {combatant,arenaUnits} from './battle-data.js';
import {createBattle,stepBattle} from './battle-engine.js';
import {runProfile} from './retention.js';

// 동맹 토벌 (종합기획서 11.4), local simulator. The boss opens when this week's preparation reaches 100%.
// Every member chips at one shared HP pool: the player by a simulated battle (two a day, capped per attempt),
// NPC members by a fixed daily share. Each 10% pays a chest to everyone. Numbers are proposals.
export const raidRules={hp:60000,attemptsPerDay:2,attemptCap:.08,npcDailyShare:.015,weakBonus:.2,weakNeed:3,chest:{gold:100,contribution:10},steps:10};
export const raidBosses=[{hero:'zhangjue',title:'태평도 장각',weak:'위'},{hero:'dongzhuo',title:'폭군 동탁',weak:'촉'},{hero:'119',title:'비장 여포',weak:'오'}];
export const raidBoss=week=>raidBosses[Number(week)%raidBosses.length];
export const attendReward={gold:50,contribution:5};
export const CREATE_COST=1000;
// 동맹 연구: contribution buys guild-wide buffs. The levels belong to the guild and are lost on leaving.
export const research={farm:{name:'둔전 개간',text:'농지 생산 +5%',step:.05},march:{name:'행군 훈련',text:'토벌 파견 시간 −5%',step:.05}};
export const researchCosts=[50,100,200];
export const researchLevel=(state,id)=>state.alliance?.guild?state.alliance.research?.[id]??0:0;
// Simulates one attempt with the saved formation and real growth; returns the damage dealt to the boss.
export function raidAttempt(state,week){
 const boss=raidBoss(week),profile=runProfile(state),units=arenaUnits(state.order,0).map(u=>combatant(u,0,profile));
 const foe=combatant({id:100,hero:boss.hero,rank:1,x:4,y:6,title:boss.title,fixed:{level:20,star:3},scale:{hp:40,atk:.7}},1,profile);
 const b=createBattle([...units,foe],'raid','raid:'+week);while(!b.result&&b.tick<1800)stepBattle(b);
 const dealt=b.units.filter(u=>u.side===0).reduce((n,u)=>n+u.damage,0),weak=new Set(state.order.filter(id=>heroes.find(h=>h.id===id).faction===boss.weak)).size>=raidRules.weakNeed;
 return {damage:Math.min(Math.round(raidRules.hp*raidRules.attemptCap),Math.round(dealt*(weak?1+raidRules.weakBonus:1))),weak,survived:b.units.some(u=>u.side===0&&u.hp>0)};
}
export function raidStatus(state,time=Date.now()){
 const st=allianceStatus(state,time),r=st.raid?.week===st.period.week?st.raid:null,open=!!st.guild&&st.preparation>=100;
 const npcs=st.guild?st.guild.members.filter(m=>m.id!=='me').length:0,days=r?Math.max(0,Number(st.period.day)-Number(r.openDay))+1:0;
 const npc=Math.round(raidRules.hp*raidRules.npcDailyShare*npcs*days),total=Math.min(raidRules.hp,(r?.mine??0)+npc),step=Math.floor(total*raidRules.steps/raidRules.hp);
 return {open,boss:raidBoss(st.period.week),hp:raidRules.hp,total,mine:r?.mine??0,npc,step,claimed:r?.claimed??0,attempts:r&&r.attemptDay===st.period.day?r.attempts:0,defeated:total>=raidRules.hp};
}
// 동맹 상점: bought with contribution, weekly limits. The hero card follows a faction that changes each week.
export function allianceShop(time){
 const week=Number(periods(time).week),faction=['위','촉','오','군웅'][week%4],hero=heroes.find(h=>h.faction===faction&&specs[h.id].grade==='A');
 return [{id:'card',name:hero.name+' 카드 1장',hero:hero.id,price:60,limit:1},{id:'treasure',name:'보물 교환재료 5개',reward:{treasureTokens:5},price:30,limit:2}];
}
export const allianceBought=(state,item,time)=>{const b=state.alliance?.shop;return b?.week===periods(time).week?b.counts?.[item]??0:0;};

const DAY = 86400000;
export const guilds = [
  {id:'cloud', name:'청운동맹', leader:'청운', notice:'군량을 모아 황건 토벌을 준비합시다.', portrait:'15'},
  {id:'tiger', name:'백호동맹', leader:'백운', notice:'군자금을 모아 성채를 지원합시다.', portrait:'2'},
  {id:'wind', name:'풍림동맹', leader:'솔바람', notice:'함께 토벌 준비도를 높여 주세요.', portrait:'35'}
];
export const emptyAlliance = () => ({guild:null, leftAt:0, lastTime:0, day:'', donations:0, week:'', supply:false, preparation:0, claimed:false});
export function allianceStatus(state, time=Date.now()) {
  const data = state.alliance ?? emptyAlliance();
  const now = Math.max(time,data.lastTime);
  const period = periods(now);
  return {...data, now, period,
    donations: data.day===period.day ? data.donations : 0,
    supply: data.week===period.week && data.supply,
    preparation: data.week===period.week ? data.preparation : 0,
    claimed: data.week===period.week && data.claimed,
    eligible: !!data.guild && now-data.guild.joinedAt>=DAY
  };
}
export function allianceCommand(state, type, value, time=Date.now()) {
  const next = structuredClone(state);
  const status = allianceStatus(next,time);
  const {now,period,eligible,...data} = status;
  data.day=period.day;
  data.week=period.week;
  data.lastTime=now;
  next.alliance=data;
  const guild=data.guild;
  if(type==='join'||type==='create'){
    if(guild)throw Error('이미 동맹에 소속되어 있습니다.');
    if(data.leftAt && now-data.leftAt<DAY)throw Error('탈퇴 24시간 후 가입할 수 있습니다.');
    const entry=type==='join'?guilds.find(g=>g.id===value):null;
    if(type==='join'&&!entry)throw Error('동맹을 찾을 수 없습니다.');
    if(type==='create'){if(next.gold<CREATE_COST)throw Error('동맹 창설에는 골드 '+CREATE_COST+'이 필요합니다.');next.gold-=CREATE_COST;}
    const name=entry?.name??String(value).trim();
    if(name.length<2||name.length>12)throw Error('동맹 이름을 2~12자로 입력해 주세요.');
    data.guild={name,notice:entry?.notice??'함께 토벌 준비에 참여해 주세요.',joinedAt:now,
      members:entry?[{id:entry.id,name:entry.leader,portrait:entry.portrait,role:'군주',points:0},{id:'me',name:'나',portrait:'0',role:'회원',points:0}]:[{id:'me',name:'나',portrait:'0',role:'군주',points:0}],
      applications:entry?[]:[{id:'cloud',name:'청운',portrait:'15'},{id:'tiger',name:'백운',portrait:'2'},{id:'wind',name:'솔바람',portrait:'35'}], log:[]};
    data.preparation=0;data.research={};
    return next;
  }
  if(!guild)throw Error('동맹에 가입해 주세요.');
  const earn=n=>{data.contribution=(data.contribution??0)+n;};
  if(type==='research'){
    if(!research[value])throw Error('없는 연구입니다.');const level=data.research?.[value]??0;
    if(level>=researchCosts.length)throw Error('최고 단계입니다.');if((data.contribution??0)<researchCosts[level])throw Error('공헌이 부족합니다.');
    data.contribution-=researchCosts[level];(data.research??={})[value]=level+1;guild.log.unshift(research[value].name+' '+(level+1)+'단계를 연구했습니다.');guild.log=guild.log.slice(0,30);return next;
  }
  if(type==='attend'){
    if(data.attendDay===period.day)throw Error('오늘은 이미 출석했습니다.');
    data.attendDay=period.day;next.gold+=attendReward.gold;earn(attendReward.contribution);guild.members.find(m=>m.id==='me').points+=attendReward.contribution;return next;
  }
  if(type==='buy'){
    const item=allianceShop(now).find(i=>i.id===value);if(!item)throw Error('없는 상품입니다.');
    if(data.shop?.week!==period.week)data.shop={week:period.week,counts:{}};
    if((data.shop.counts[item.id]??0)>=item.limit)throw Error('이번 주 구매 한도를 모두 사용했습니다.');
    if((data.contribution??0)<item.price)throw Error('공헌이 부족합니다.');
    data.contribution-=item.price;data.shop.counts[item.id]=(data.shop.counts[item.id]??0)+1;
    if(item.hero){const h=next.heroes[item.hero];if(h.owned)h.cards++;else h.owned=true;}else for(const [k,n] of Object.entries(item.reward))next[k]+=n;
    return next;
  }
  if(type==='raid'||type==='raid-claim'){
    if(data.preparation<100)throw Error('토벌 준비도 100%가 되면 열립니다.');
    if(data.raid?.week!==period.week)data.raid={week:period.week,openDay:period.day,mine:0,attempts:0,attemptDay:period.day,claimed:0};
    const raid=data.raid,status=raidStatus(next,now);
    if(type==='raid'){
      if(status.defeated)throw Error('이번 주 보스를 이미 물리쳤습니다.');
      if(raid.attemptDay!==period.day){raid.attemptDay=period.day;raid.attempts=0;}
      if(raid.attempts>=raidRules.attemptsPerDay)throw Error('오늘의 도전 횟수를 모두 사용했습니다.');
      const result=raidAttempt(next,period.week);raid.attempts++;raid.mine+=result.damage;raid.last=result;earn(10);guild.members.find(m=>m.id==='me').points+=10;
      guild.log.unshift('동맹 토벌에서 '+result.damage.toLocaleString()+' 피해를 주었습니다.');guild.log=guild.log.slice(0,30);
    }else{
      const waiting=raidStatus(next,now).step-raid.claimed;if(waiting<=0)throw Error('받을 토벌 상자가 없습니다.');
      next.gold+=raidRules.chest.gold*waiting;earn(raidRules.chest.contribution*waiting);raid.claimed+=waiting;
    }
    return next;
  }
  const me=guild.members.find(m=>m.id==='me');
  const log=message=>{guild.log.unshift(message);guild.log=guild.log.slice(0,30);};
  if(type==='leave'){
    if(me.role==='군주'&&guild.members.length>1)throw Error('다른 동맹원에게 군주를 위임한 뒤 탈퇴할 수 있습니다.');
    data.guild=null;data.leftAt=now;data.preparation=0;
    return next;
  }
  if(['notice','approve','reject','promote','kick','transfer'].includes(type)){
    if(me.role!=='군주')throw Error('군주 권한이 필요합니다.');
    if(type==='notice'){
      guild.notice=String(value).trim().slice(0,80);
      log('동맹 공지를 변경했습니다.');
    }else if(type==='approve'||type==='reject'){
      const applicant=guild.applications.find(m=>m.id===value);
      if(!applicant)throw Error('가입 신청을 찾을 수 없습니다.');
      if(type==='approve'){
        if(guild.members.length>=30)throw Error('동맹 정원이 찼습니다.');
        guild.members.push({...applicant,role:'회원',points:0});
        log(applicant.name+' 님이 가입했습니다.');
      }
      guild.applications=guild.applications.filter(m=>m.id!==value);
    }else{
      const member=guild.members.find(m=>m.id===value&&m.id!=='me');
      if(!member)throw Error('동맹원을 찾을 수 없습니다.');
      if(type==='kick'){if(member.role!=='회원')throw Error('회원만 추방할 수 있습니다.');guild.members=guild.members.filter(m=>m!==member);log(member.name+' 님을 추방했습니다.');}
      if(type==='promote'){member.role=member.role==='회원'?'부군주':'회원';log(member.name+' 님의 직책을 변경했습니다.');}
      if(type==='transfer'){me.role='회원';member.role='군주';log(member.name+' 님에게 군주를 위임했습니다.');}
    }
    return next;
  }
  if(!eligible)throw Error('가입 24시간 후 이용할 수 있습니다.');
  if(type==='donate'){
    if(data.donations>=3)throw Error('오늘의 기부 횟수를 모두 사용했습니다.');
    if(next.gold<100)throw Error('골드가 부족합니다.');
    next.gold-=100;data.donations++;me.points+=10;earn(10);
    data.preparation=Math.min(100,data.preparation+20);
    log('군자금 100골드를 기부했습니다.');
  }else if(type==='supply'){
    if(data.supply||data.preparation>=100)throw Error('이번 주 군량 지원을 완료했습니다.');
    data.supply=true;data.preparation=Math.min(100,data.preparation+40);me.points+=10;earn(10);
    log('토벌 준비에 군량을 지원했습니다.');
  }else if(type==='claim'){
    if(data.preparation<100||data.claimed)throw Error('수령 가능한 보상이 없습니다.');
    data.claimed=true;next.gold+=300;
    log('토벌 준비 보상 300골드를 받았습니다.');
  }else throw Error('지원하지 않는 동맹 요청입니다.');
  return next;
}
