// Finishing layer: icon tiles, reward icons, product art, notification dots.
// It decorates what the screens already render and never changes their text content, so each screen's own
// code and checks stay as they are. Icons live under assets/ui-temp/ (the folder name is historical; the art is final
// except rank-*.png, which are stand-ins from tools/make_rank_icons.py). New art replaces a file under the same name.
import {prepareServices} from './services.js';
import {startMissions,codexComplete,BOND_MISSION_WINS} from './collection.js';
import {factions} from './factions.js';
import {expeditionStatus} from './expedition.js';
import {allianceStatus} from './alliance-state.js';
import {unlocked} from './unlocks.js';
import {heroes} from './heroes.js';
import {stages} from './stages.js';
import {raidBoss} from './alliance-state.js';
import {periods} from './economy.js';
import {specs} from './progression.js';

const temp=id=>'assets/ui-temp/'+id+'.png';
// button id -> tile icon
const tiles={'shop-exchange':'tile-exchange','s-select':'tile-s-select','iap-open':'tile-products',
 'guild-attend':'tile-attend','guild-shop':'tile-guild-shop','guild-research':'tile-research','guild-manage':'tile-manage',
 'guild-supply':'tile-supply','guild-donate':'tile-donate','guild-raid':'tile-raid',
 'arena-next':'tile-next','arena-rules':'tile-rules','arena-shop':'tile-merit-shop','arena-start':'tile-battle'};
// reward label -> icon (longest labels first so "무료 다이아" wins over "다이아")
const rewards=[['무료 다이아','assets/shop-v2/gem.png'],['유료 다이아','assets/shop-v2/gem.png'],['보물 교환재료',temp('reward-treasure-token')],['장수 교환재료',temp('reward-hero-token')],
 ['S 선택 조각',temp('reward-s-shard')],['보물 재료',temp('reward-treasure-token')],['장수 재료',temp('reward-hero-token')],['다이아','assets/shop-v2/gem.png'],
 ['훈련권',temp('reward-ticket')],['골드','assets/shop-v2/coin.png'],['군공',temp('reward-merit')],['군량',temp('reward-provisions')],['공헌',temp('reward-contribution')]];
const rewardTargets='.start-runtime .day-reward,.start-runtime .detail-reward,.start-runtime .bonus-reward';
const productIcons=new Set(['first','monthly','fund','d60','d320','d700','d2300','d4300','d8400']);

function decorateTiles(root){
 for(const [id,name] of Object.entries(tiles)){
  const button=root.querySelector('#'+id);if(!button||button.querySelector(':scope>.tile-icon'))continue;
  const box=(button.dataset.box??'').split(',').map(Number),height=box[3]||88;
  const size=Math.min(height*.66,box[2]?box[2]*.3:height)/941*100;
  const image=document.createElement('i');image.className='tile-icon';image.setAttribute('aria-hidden','true');image.style.backgroundImage=`url('${temp(name)}')`;
  button.style.setProperty('--tile-icon',size.toFixed(3)+'cqw');button.classList.add('polish-tile');button.prepend(image);
 }
}
function decorateRewards(root){
 for(const el of root.querySelectorAll(rewardTargets)){
  if(el.querySelector('.rw-icon')||el.children.length)continue;
  const text=el.textContent,found=rewards.find(([label])=>text.startsWith(label+' '));if(!found)continue;
  const rest=text.slice(found[0].length+1),amount=rest.match(/^[\d,]+/)?.[0];if(!amount)continue;
  const image=document.createElement('i'),label=document.createElement('span'),number=document.createElement('b');
  image.className='rw-icon';image.setAttribute('aria-hidden','true');image.style.backgroundImage=`url('${found[1]}')`;
  label.className='rw-label';label.textContent=found[0]+' ';number.textContent=amount;
  el.replaceChildren(image,label,number,document.createTextNode(rest.slice(amount.length)));el.classList.add('rw');
 }
}
// Every "골드 100" / "100 골드" style amount on any screen: the currency word becomes its icon.
// The word stays in the DOM (zero-size) so textContent, innerText and screen readers are unchanged, and the
// whole rewritten text sits in one inline wrapper so a flex parent still has a single item.
const amountLabels=rewards.map(([label])=>label).join('|');
const amountPattern=new RegExp('('+amountLabels+') ([0-9,]+)|([0-9,]+) (골드|군공)','g');
const amountTest=new RegExp('(?:'+amountLabels+') [0-9]|[0-9] (?:골드|군공)');
const iconOf=Object.fromEntries(rewards);
// Item names keep their words ("보물 교환재료 5개" names a product; an icon alone would not say what it is).
const amountSkip='.rw,.rw-flow,.rw-label,.scroll-heading,.art-header-title,#battle,.battle,script,style,.product-card:not(.rate-card),.detail-name,.merit-shop-runtime .effect';
function decorateAmounts(root){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),found=[];
 for(let node;node=walker.nextNode();)if(amountTest.test(node.nodeValue)&&!node.parentElement.closest(amountSkip))found.push(node);
 for(const node of found){
  const text=node.nodeValue,flow=document.createElement('span');flow.className='rw-flow';let last=0;amountPattern.lastIndex=0;
  for(let m;m=amountPattern.exec(text);){
   if(m.index>last)flow.append(text.slice(last,m.index));
   const before=!!m[1],label=before?m[1]:m[4],amount=before?m[2]:m[3];
   const item=document.createElement('span'),icon=document.createElement('i'),word=document.createElement('span'),number=document.createElement('b');
   item.className='rwi';icon.className='rw-icon';icon.setAttribute('aria-hidden','true');icon.style.backgroundImage=`url('${iconOf[label]}')`;
   word.className='rw-word';word.textContent=before?label+' ':' '+label;number.textContent=amount;
   if(before)item.append(icon,word,number);else item.append(icon,number,word);
   flow.append(item);last=m.index+m[0].length;
  }
  if(last<text.length)flow.append(text.slice(last));
  node.replaceWith(flow);
 }
}
function decorateProducts(root){
 for(const card of root.querySelectorAll('.products-runtime .product-card[data-product]')){
  if(card.querySelector(':scope>.product-icon')||!productIcons.has(card.dataset.product))continue;
  const image=document.createElement('i');image.className='product-icon';image.setAttribute('aria-hidden','true');image.style.backgroundImage=`url('${temp('product-'+card.dataset.product)}')`;
  card.prepend(image);card.classList.add('polish-product');
  if(card.dataset.product==='monthly')card.dataset.recommended='true';
  for(const small of card.querySelectorAll('small'))if(/첫 구매 2배/.test(small.textContent)&&!/사용/.test(small.textContent))small.classList.add('ribbon');
 }
}
// Barracks: a bar under each of the four stats, relative to the best base value in the roster,
// so a hero reads as tanky or hard-hitting at a glance.
const statMax=[0,1,2,3].map(i=>Math.max(...heroes.map(h=>specs[h.id].stats[i])));
function decorateStats(root){
 const name=root.querySelector('.barracks-screen .hero-name')?.textContent.trim(),hero=heroes.find(h=>h.name===name);if(!hero)return;
 root.querySelectorAll('.barracks-screen .hero-stat').forEach((el,i)=>{
  if(i>3||el.querySelector('.stat-bar')?.dataset.hero===hero.id)return;el.querySelector('.stat-bar')?.remove();
  const bar=document.createElement('i'),fill=document.createElement('i');bar.className='stat-bar';bar.dataset.hero=hero.id;bar.setAttribute('aria-hidden','true');
  fill.style.width=Math.round(specs[hero.id].stats[i]/statMax[i]*100)+'%';bar.dataset.stat=String(i);bar.append(fill);el.append(bar);
 });
}
// Recruit rates: a bar on each grade card, in the grade's colour.
function decorateRates(root){
 for(const card of root.querySelectorAll('.rates-runtime .rate-card[data-grade]')){
  const rate=Number(card.querySelector('strong')?.textContent.match(/([\d.]+)%/)?.[1]);if(!Number.isFinite(rate))continue;
  let bar=card.querySelector(':scope>.rate-bar');if(!bar){bar=document.createElement('i');bar.className='rate-bar';bar.setAttribute('aria-hidden','true');bar.append(document.createElement('i'));card.append(bar);}
  bar.firstChild.style.width=Math.max(4,rate/60*100)+'%';
 }
}
// ---- Second batch: pictures for information that was sentences only. All of it reads what the screen
// already shows (text, pressed state) and adds elements beside it; no screen logic is replaced.
const factionFile={'위':'wei','촉':'shu','오':'wu','군웅':'qun'};
const heroByName=name=>heroes.find(h=>h.name===name);
const mark=(el,key,value)=>{if(el.dataset[key]===String(value))return false;el.dataset[key]=String(value);return true;};
// A gauge drawn as the element's own background (no child element, so the text box never overflows).
function gauge(host,cls,ratio){
 if(ratio===null){host.classList.remove('polish-gauge',cls);return;}
 const fill=Math.round(Math.max(0,Math.min(1,ratio))*100);host.classList.add('polish-gauge',cls);host.style.setProperty('--fill',fill+'%');host.dataset.full=String(ratio>=1);
}
// 4. Arena: a card behind each of the six formation slots, with grade colour and faction emblem.
// Cards are placed by slot and read from the saved formation, not from the sprites: the sprites are added one
// by one as their images decode, and following them made the cards depend on timing.
function decorateArena(root,state){
 const screen=root.querySelector('.arena-v2:not([hidden])'),panel=screen?.querySelector('section.formation');if(!panel)return;
 const order=(state.arena?.match?.playerOrder??state.order??[]).slice(0,6),key=order.join(',');
 if(panel.dataset.polishOrder===key&&screen.querySelectorAll('.formation-card').length===order.length)return;
 screen.querySelectorAll('.formation-card').forEach(card=>card.remove());panel.dataset.polishOrder=key;
 const top=parseFloat(panel.style.top),height=parseFloat(panel.style.height),cards=[];
 order.forEach((id,i)=>{
  const hero=heroes.find(h=>h.id===id);if(!hero)return;
  const card=document.createElement('i');card.className='formation-card';card.setAttribute('aria-hidden','true');card.dataset.grade=specs[id].grade;
  card.style.left=(12.05+14.62*i-6.4)+'%';card.style.top=(top+4.75)+'%';card.style.width='12.8%';card.style.height=(height-5.5)+'%';
  card.style.setProperty('--emblem',`url('${temp('faction-'+factionFile[hero.faction])}')`);cards.push(card);
 });
 panel.after(...cards);
}
// Shared slots: the tab row under the scroll heading and the action bar above the navigation sit at the same
// place on every screen but are styled per screen. Tag them by position so one rule sizes their labels.
function decorateSlots(root){
 for(const button of root.querySelectorAll('button[style*="top"]:not(.slot-seen)')){
  button.classList.add('slot-seen');
  const y=parseFloat(button.style.top)/100*1672,h=parseFloat(button.style.height)/100*1672;if(!(h>=58&&h<=70))continue;
  if(y>=255&&y<=330)button.classList.add('slot-tab');else if(y>=1380&&y<=1445)button.classList.add('slot-action');
 }
}
// Arena ranks: the tier's emblem beside its name (season cards, current tier, reward title, arena summary).
const rankNames=['병졸','백부장','교위','장군','대장군','천하무쌍'];
const rankUrl=index=>`url('${temp('rank-'+(index+1))}')`;
function decorateRanks(root){
 for(const card of root.querySelectorAll('.arena-season-runtime .rate-card[data-tier]')){
  if(card.querySelector(':scope>.rank-icon'))continue;
  const icon=document.createElement('i');icon.className='rank-icon';icon.setAttribute('aria-hidden','true');icon.style.backgroundImage=rankUrl(Number(card.dataset.tier));
  card.classList.add('rank-card');card.prepend(icon);
 }
 for(const el of root.querySelectorAll('.arena-season-runtime .current-tier,.arena-season-runtime .reward-title,#arena-tier')){
  // Longest name first: "대장군" contains "장군".
  const index=[4,5,3,2,1,0].find(i=>el.textContent.includes(rankNames[i]));
  if(index===undefined){el.classList.remove('has-rank');continue;}
  if(mark(el,'rank',index)){el.classList.add('has-rank');el.style.setProperty('--rank',rankUrl(index));}
 }
 // "군공 <b>120</b>" in the arena summary is split across elements, so decorateAmounts does not see it.
 for(const small of root.querySelectorAll('.arena-v2 .rating-copy small')){
  const node=small.firstChild;if(node?.nodeType!==3||!node.nodeValue.startsWith('군공'))continue;
  const item=document.createElement('span'),icon=document.createElement('i'),word=document.createElement('span');
  item.className='rwi';icon.className='rw-icon';icon.setAttribute('aria-hidden','true');icon.style.backgroundImage=`url('${iconOf['군공']}')`;
  word.className='rw-word';word.textContent=node.nodeValue;item.append(icon,word);node.replaceWith(item);
 }
}
// 6. Missions: finished rows get a gold bar and claimed rows a stamp.
function decorateMissions(root){
 const screen=root.querySelector('.missions-v1:not([hidden])');if(!screen)return;
 for(const label of screen.querySelectorAll('p.progress-label')){
  const m=label.textContent.match(/(\d+)\s*\/\s*(\d+)/),bar=label.nextElementSibling;if(!m||!bar?.classList.contains('progress-bar'))continue;
  bar.dataset.done=String(Number(m[1])>=Number(m[2]));
 }
 for(const button of screen.querySelectorAll('button')){
  // The stamp is an empty element (its mark is drawn by CSS), so the button's own text never changes.
  let stamp=button.querySelector(':scope>.polish-stamp');
  const claimed=button.textContent.trim()==='수령 완료';
  if(claimed&&!stamp){stamp=document.createElement('i');stamp.className='polish-stamp';stamp.setAttribute('aria-hidden','true');button.append(stamp);}
  else if(!claimed&&stamp)stamp.remove();
 }
}
// 7. Government: how full the farm store is, and the next level as a highlighted line.
function decorateGovernment(root,screen=root.querySelector('.government-runtime:not([hidden])')){
 if(!screen)return;
 const effect=screen.querySelector('.detail-effect')?.textContent??'',stock=screen.querySelector('.detail-stock'),next=screen.querySelector('.detail-next');
 const rate=effect.match(/시간당 골드 ([\d,]+)/),hours=effect.match(/최대 (\d+)시간/),held=stock?.textContent.match(/골드 ([\d,]+)/);
 if(stock){
  if(rate&&hours&&held){const cap=Number(rate[1].replace(/,/g,''))*Number(hours[1]);gauge(stock,'store-gauge',cap?Number(held[1].replace(/,/g,''))/cap:0);}
  else gauge(stock,'store-gauge',null);
 }
 if(next)next.classList.toggle('polish-next',/다음 Lv/.test(next.textContent));
}
// 8. Campaign: the selected battle's board rules and enemy general as chips; a tick on cleared nodes, a lock on closed ones.
function decorateCampaign(root){
 const screen=root.querySelector('.campaign-v4:not([hidden])'),panel=screen?.querySelector('section.details');if(!panel)return;
 for(const node of screen.querySelectorAll('.stage-node[data-status]')){
  let badge=node.querySelector(':scope>.node-badge');
  if(!badge){badge=document.createElement('i');badge.className='node-badge';badge.setAttribute('aria-hidden','true');node.append(badge);}
  badge.dataset.status=node.dataset.status;
 }
 const id=screen.querySelector('.stage-node[aria-pressed=true]')?.dataset.stage,stage=id&&stages[id];
 let row=screen.querySelector(':scope>.rule-chips');
 if(!stage){row?.remove();return;}
 if(!row){row=document.createElement('div');row.className='rule-chips';row.setAttribute('aria-hidden','true');panel.after(row);
  row.style.left=(parseFloat(panel.style.left)+parseFloat(panel.style.width)*.5)+'%';row.style.top=(parseFloat(panel.style.top)+.9)+'%';row.style.width=(parseFloat(panel.style.width)*.47)+'%';}
 if(!mark(row,'polishStage',id))return;
 const chips=[];
 if(stage.board.blocked.length)chips.push(['wall','막힌 칸']);
 if(stage.rounds.some(r=>r.reinforcements?.length))chips.push(['reinforce','증원']);
 if(stage.hazard)chips.push(['hazard',stage.hazard.name??'위험 칸']);
 if(stage.fireScale)chips.push(['fire','화공 강화']);
 const generals=[...new Set(stage.rounds.flatMap(r=>r.enemies.filter(e=>e.hero).map(e=>e.hero)))];
 row.innerHTML=chips.map(([tone,text])=>`<span data-tone="${tone}">${text}</span>`).join('')+generals.map(g=>{const h=heroes.find(x=>x.id===g);return h?`<span data-tone="boss"><img src="${h.portrait}" alt="">${h.name}</span>`:'';}).join('');
}
// 9. Expedition: team power against the requirement as a gauge; a lock on closed sites.
function decorateExpedition(root){
 const screen=root.querySelector('.expedition-runtime:not([hidden])');if(!screen)return;
 const title=screen.querySelector('.reward-title'),m=title?.textContent.match(/전투력 ([\d,]+)\s*\/\s*([\d,]+)/);
 if(title){if(m)gauge(title,'power-gauge',Number(m[1].replace(/,/g,''))/Number(m[2].replace(/,/g,'')));else gauge(title,'power-gauge',null);}
 for(const site of screen.querySelectorAll('.site-button'))site.classList.toggle('polish-locked',/잠금/.test(site.textContent));
}
// 10. Alliance raid: this week's boss beside the preparation bar, with its weak faction.
function decorateRaid(root,state,screen=root.querySelector('.alliance-v2:not([hidden])')){
 const bar=screen?.querySelector('.preparation');if(!bar)return;
 const boss=raidBoss(periods(Math.max(Date.now(),state.alliance?.lastTime??0)).week),hero=heroes.find(h=>h.id===boss.hero);
 let chip=screen.querySelector('.raid-boss');
 if(!chip){chip=document.createElement('div');chip.className='raid-boss';chip.setAttribute('aria-hidden','true');bar.after(chip);
  chip.style.left=(parseFloat(bar.style.left)+parseFloat(bar.style.width)*.58)+'%';chip.style.top=(parseFloat(bar.style.top)-4.1)+'%';}
 if(mark(chip,'boss',boss.hero))chip.innerHTML=`<img src="${hero.portrait}" alt=""><span>${boss.title}</span><i style="background-image:url('${temp('faction-'+factionFile[boss.weak])}')"></i><small>약점</small>`;
}
// 11. Barracks: the faction emblem in front of "촉 · 기동 전사".
function decorateRole(root){
 const el=root.querySelector('.barracks-screen .hero-role');if(!el)return;
 const faction=el.textContent.trim().split(' · ')[0];if(!factionFile[faction])return;
 let emblem=el.querySelector(':scope>.role-emblem');
 if(!emblem){emblem=document.createElement('i');emblem.className='role-emblem';emblem.setAttribute('aria-hidden','true');el.prepend(emblem);}
 if(mark(emblem,'faction',faction))emblem.style.backgroundImage=`url('${temp('faction-'+factionFile[faction])}')`;
}
// 13. Results and battle record: a crown on the top row of the per-hero record.
function decorateMvp(root){
 for(const list of root.querySelectorAll('.combat-record:not([hidden]) .record-rows,.combat-record-runtime:not([hidden]) .record-rows,.record-rows')){
  const first=list.firstElementChild;if(!first||first.querySelector(':scope>.mvp-crown'))continue;
  list.querySelectorAll('.mvp-crown').forEach(c=>c.remove());
  const crown=document.createElement('i');crown.className='mvp-crown';crown.setAttribute('aria-hidden','true');crown.textContent='MVP';first.append(crown);
 }
}
// What is waiting to be claimed, beyond mail and missions (those have their own painted dots on the gate).
export function polishAlerts(state,now=Date.now()){
 const q=prepareServices({...state,services:structuredClone(state.services)},now);
 const today=Number(q.periods.day)-q.start.day0+1,claimed=q.start.claimed;
 const start=startMissions.some(m=>m.day<=today&&!claimed[m.day]&&m.done(state))||(startMissions.every(m=>claimed[m.day])&&!claimed.final);
 const codex=Object.keys(factions).some(f=>!q.codex[f]&&codexComplete(state,f))||Object.values(q.bondMissions).some(m=>!m.claimed&&m.wins>=BOND_MISSION_WINS);
 const expedition=unlocked(state,'expedition')&&expeditionStatus(state,now).slots.some(slot=>slot.endsAt<=now);
 const guild=allianceStatus(state,now),alliance=!!guild.guild&&guild.attendDay!==guild.period.day;
 return {start,codex,expedition,alliance};
}
function renderDots(game,alerts){
 for(const [action,on] of Object.entries(alerts)){
  const selector=action==='alliance'?'[role=tab][data-action=alliance]':`.gate-hit[data-action="${action}"]`;
  for(const button of game.querySelectorAll(selector)){
   let dot=button.querySelector(':scope>.polish-dot');
   if(!dot){dot=document.createElement('i');dot.className='polish-dot';dot.setAttribute('aria-hidden','true');button.append(dot);}
   dot.hidden=!on;
  }
 }
}
// For preview pages that show a screen without the game store.
export function decorateStatic(root){decorateSlots(root);decorateTiles(root);decorateRewards(root);decorateAmounts(root);decorateProducts(root);decorateGovernment(root,root);decorateRaid(root,{},root);}
export function initPolish({store,game}){
 // Runs inside the mutation callback (a microtask, before the next paint), so a screen is never shown
 // or captured half decorated. `busy` keeps our own DOM changes from re-entering.
 // The profile is read only when the store changes; a live battle redraws every frame and is left alone.
 let busy=false,state=store.get(),alerts={};
 const refresh=()=>{state=store.get();try{alerts=polishAlerts(state);}catch(error){console.error(error);alerts={};}};
 const run=()=>{
  if(busy||game.classList.contains('in-battle'))return;busy=true;
  try{
   decorateSlots(game);decorateTiles(game);decorateRewards(game);decorateAmounts(game);decorateRanks(game);decorateProducts(game);decorateStats(game);decorateRates(game);decorateArena(game,state);decorateMissions(game);
   decorateGovernment(game);decorateCampaign(game);decorateExpedition(game);decorateRole(game);decorateMvp(game);decorateRaid(game,state);renderDots(game,alerts);
  }catch(error){console.error(error);}finally{busy=false;}
 };
 new MutationObserver(run).observe(game,{childList:true,subtree:true,characterData:true});
 store.subscribe(()=>{refresh();run();});refresh();run();
}
