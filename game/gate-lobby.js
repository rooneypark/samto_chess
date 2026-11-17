import {artSet} from './art.js';
import {heroes} from './heroes.js';
import {lordLevel} from './services.js';
import {chapters,currentStage,stages,stageOrder} from './stages.js';
import {gateSprites as sprites} from './assets/gate-lobby/sprites.js';
import {artButton,initArtPress} from './art-controls.js';
import {artworkShell,artworkWallet} from './ui-shell.js';
import {artboard} from './ui-spec.js';
import {serviceAlerts} from './service-alerts.js';

const {width:W,height:H}=artboard,base='assets/gate-lobby/';
const centers=[110,263,406,548,676,817];
const rect=(el,x,y,w,h)=>{
 for(const [key,value] of Object.entries({x:x/W*100,y:y/H*100,w:w/W*100,h:h/H*100}))el.style.setProperty('--g'+key,value+'%');
};
export function initGateLobby(game,store){
 if(artSet!=='a')return {render(){},navigate(){}};
 const controls=['.profile','.wallet button:first-child','.wallet button:last-child',
  ...['mail','quests','start','settings','codex','expedition','tower','formation','campaign','depart'].map(id=>'[data-action='+id+']'),
  ...['shop','barracks','home','alliance','arena'].map(id=>'.bottom-nav [data-action='+id+']')];
 for(const selector of controls)game.querySelector(selector).classList.add('gate-hit');
 const layer=document.createElement('div');layer.className='gate-layer';layer.setAttribute('aria-hidden','true');game.append(layer);
 const field=(name,box,cls='')=>{const el=document.createElement('div');el.className='gate-value '+cls;el.dataset.field=name;rect(el,...box);layer.append(el);return el;};
 const fields={
  level:field('level',[167,36,132,40],'gate-dark'),
  campaign:field('campaign',[271,1191,436,58],'gate-paper'),
  count:field('count',[112,1090,275,51],'gate-paper'),
  xp:field('xp',[175,87,118,16],'gate-xp')
 };
 const fill=document.createElement('i');fields.xp.append(fill);
 // Reuse each shortcut's opposite corner to cover the painted sample badge.
 const alerts=[
  {action:'mail',label:'우편',box:[101,176,35,34],sampleX:16},
  {action:'quests',label:'임무',box:[103,304,34,33],sampleX:16}
 ].map(({action,label,box,sampleX})=>{
  const patch=field(action+'-badge-cover',box,'gate-badge-cover');
  const [,y,w,h]=box;
  patch.style.backgroundSize=`${W/w*100}% ${H/h*100}%`;
  patch.style.backgroundPosition=`${sampleX/(W-w)*100}% ${y/(H-h)*100}%`;
  return {action,label,patch,button:game.querySelector(`[data-action="${action}"]`)};
 });
 function renderAlerts(state){
  const pending=serviceAlerts(state);
  for(const {action,label,patch,button} of alerts){
   patch.hidden=pending[action];
   button.setAttribute('aria-label',pending[action]?label+' · 받을 보상 있음':label);
  }
 }
 const press=initArtPress(game);
 const buttonIds={profile:'profile',mail:'mail',quests:'quests',start:'start',settings:'settings',codex:'codex',expedition:'expedition',tower:'tower',formation:'formation',campaign:'campaign',depart:'depart'};
 function skinControls(){
  artworkShell(game,{screen:'gate',title:'삼토체스',progress:store.get()});
  for(const [action,id] of Object.entries(buttonIds))artButton(game.querySelector('[data-action='+action+']'),'gate-'+id,{paint:action==='formation'});
  artButton(game.querySelector('.profile'),'gate-profile',{paint:true});
 }
 skinControls();
 const value=(el,text,original)=>{el.textContent=text;el.hidden=text===original;};
 function render(state=store.get()){
  if(game.classList.contains('gate-lobby'))renderAlerts(state);
  if(game.matches('.gate-lobby,.barracks-art')&&!game.classList.contains('in-battle'))artworkWallet(game,state);
  const l=lordLevel(state),id=currentStage(state),chapter=stages[id].chapterId;
  const number=stageOrder.filter(key=>stages[key].chapterId===chapter).indexOf(id)+1;
  value(fields.level,'Lv.'+l.level,null);
  value(fields.campaign,(chapters[chapter]??'전역').replace(/ \(.*/,'')+' · '+number+'전투','황건의 난 · 1전투');
  value(fields.count,'출전 장수 '+state.order.length+'/6','출전 장수 6/6');
  const ratio=l.next?Math.min(1,l.xp/l.next):1;fill.style.width=ratio*100+'%';
  game.querySelector('.party-toolbar strong').textContent=state.order.length+' / 6';
  for(const [i,button] of [...game.querySelectorAll('.party .hero')].entries()){
   const id=state.order[i],image=button.querySelector('img'),s=sprites[id];button.classList.add('gate-hero');button.dataset.gateHero=id;
   // Reset the fallback on every render: changing the order must also change the art.
   image.src=s?base+id+'.png':heroes.find(h=>h.id===id).sprite;
   button.classList.toggle('gate-fallback',!s);
   if(s)rect(button,centers[i]+s[0]-s[4],s[1],s[2],s[3]);
   else rect(button,centers[i]-78,769,156,248);
  }
 }
 store.subscribe(render);
 window.addEventListener('focus',()=>{if(game.classList.contains('gate-lobby'))renderAlerts(store.get());});
 return {render,navigate(tab){press.reset();game.classList.toggle('gate-lobby',tab==='home');if(tab==='home'){skinControls();renderAlerts(store.get());}else if(!['barracks','shop','alliance','arena','campaign','missions','mail'].includes(tab))for(const selector of controls){const el=game.querySelector(selector);el.classList.remove('art-control','art-painted');delete el.dataset.artButton;for(const key of ['left','top','width','height'])el.style.removeProperty(key);}}};
}
