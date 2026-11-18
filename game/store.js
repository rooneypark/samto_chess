import {trackServices} from './services.js';
import {heroes} from './heroes.js';
import {loadProgress,legacyTreasureIds} from './progression.js';
import {compactSave} from './retention.js';
import {SAVE_KEY,RULESET,LEGACY_PROGRESS_KEY,LEGACY_LOBBY_KEY} from './versions.js';
import {factions,defaultStarter} from './factions.js';
import {migrateTreasures,treasureDefs} from './treasures.js';
const KEY=SAVE_KEY;
const ids=heroes.map(h=>h.id),legacyIds=['1','2','15','16','35','0'];
const starter=defaultStarter;
const emptyHero=owned=>({owned,level:1,star:1,cards:0,treasure:null});
const validOrder=(order,hs)=>Array.isArray(order)&&order.length===6&&new Set(order).size===6&&order.every(id=>hs[id]?.owned);
// Saves written before the roster grew lack the newer heroes; they join as not owned.
function normalize(s){if(s?.heroes)for(const id of ids)s.heroes[id]??=emptyHero(false);return s;}
function validate(s){
 if(s.faction!=null&&!factions[s.faction])throw Error('세력 저장 데이터 오류');
 const nonnegative=n=>Number.isSafeInteger(n)&&n>=0;
 if(![s.gold,s.diamonds,s.freeDiamonds,s.paidDiamonds,s.heroTokens,s.treasureTokens,s.revision].every(nonnegative)||s.diamonds!==s.freeDiamonds+s.paidDiamonds||![s.sShards??0,s.merit??0,s.provisions??0].every(nonnegative))throw Error('재화 저장 데이터 오류');
 if(!Array.isArray(s.treasures)||new Set(s.treasures.map(t=>t.id)).size!==s.treasures.length)throw Error('보물 저장 데이터 오류');
 migrateTreasures(s);
 for(const t of s.treasures)if(typeof t.id!=='string'||!/^[A-Za-z0-9:_-]+$/.test(t.id)||!treasureDefs.some(d=>d.id===t.defId)||!Number.isInteger(t.star)||t.star<1||t.star>5)throw Error('보물 정보 오류');
 const equipped=new Set();for(const id of ids){const h=s.heroes[id];if(!h||typeof h.owned!=='boolean'||!Number.isInteger(h.level)||h.level<1||h.level>20||!Number.isInteger(h.star)||h.star<1||h.star>5||!nonnegative(h.cards))throw Error('장수 저장 데이터 오류');if(h.treasure!==null){if(!h.owned||equipped.has(h.treasure)||!s.treasures.some(t=>t.id===h.treasure))throw Error('장착 정보 오류');equipped.add(h.treasure);}}
 if(!validOrder(s.order,s.heroes))throw Error('편성 저장 데이터 오류');
 for(const p of Object.values(s.shop.pity))if(!nonnegative(p.a)||p.a>29||!nonnegative(p.s)||p.s>99)throw Error('천장 저장 데이터 오류');
 return s;
}
// clock is injectable so retention and period rollover can be tested against simulated time.
export function createGameStore(storage=localStorage,clock=Date.now){
 let raw=storage.getItem(KEY),old=raw?JSON.parse(raw):null,legacy=null;
 if(!old){try{legacy=JSON.parse(storage.getItem(LEGACY_LOBBY_KEY));}catch{}if(storage.getItem(LEGACY_PROGRESS_KEY)||legacy){old={...loadProgress(legacyIds,storage),order:legacy?.order??legacyIds,reducedMotion:legacy?.reducedMotion===true,diamonds:320,version:2};}}
 let state;
 if(old?.version===3)state=validate(normalize(old));
 else{
  if(old&&old.version!==2)throw Error('지원하지 않는 저장 버전입니다.');
  const hs=Object.fromEntries(ids.map(id=>[id,emptyHero(!old&&starter.includes(id))]));
  if(old)for(const id of legacyIds){if(!old.heroes?.[id])throw Error('이전 장수 데이터 오류');hs[id]={...old.heroes[id],owned:true};if(hs[id].treasure)hs[id].treasure='legacy-'+hs[id].treasure;}
  state=validate({version:3,revision:0,gold:old?.gold??500,diamonds:old?.diamonds??0,freeDiamonds:old?.diamonds??0,paidDiamonds:0,heroTokens:0,treasureTokens:0,heroes:hs,order:old?.order??starter,reducedMotion:old?.reducedMotion??false,treasures:old?legacyTreasureIds.map(defId=>({id:'legacy-'+defId,defId,star:1})):[],shop:{pity:{hero:{a:0,s:0},treasure:{a:0,s:0}},receipts:{},limits:{},lastTime:0,pending:null}});
 }
 const listeners=new Set();
 const update=change=>{
  if(storage.getItem(KEY)!==raw)throw Error('다른 창에서 저장이 변경되었습니다. 새로고침 후 다시 시도해 주세요.');
  const now=clock(),next=trackServices(state,{...state,...(typeof change==='function'?change(structuredClone(state)):change),version:3,revision:state.revision+1},now);
  const deltas=Object.fromEntries(['gold','freeDiamonds','paidDiamonds','heroTokens','treasureTokens','sShards','merit','provisions'].map(k=>[k,(next[k]??0)-(state[k]??0)]).filter(([,n])=>n));
  if(Object.keys(deltas).length)next.ledger=[...(state.ledger??[]),{transactionId:'rev:'+next.revision,reason:next.battleRun?.receipt&&!state.battleRun?.receipt?'battle-settlement':'profile-command',deltas,beforeRevision:state.revision,afterRevision:next.revision,date:now,rulesetId:RULESET}];
  validate(compactSave(next,now));
  const encoded=JSON.stringify(next);storage.setItem(KEY,encoded);raw=encoded;state=next;
  listeners.forEach(fn=>{try{fn(structuredClone(state));}catch(e){console.error(e);}});return structuredClone(state);
 };
 return {get:()=>structuredClone(state),subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn)},update,transact:change=>globalThis.navigator?.locks?navigator.locks.request(KEY,()=>update(change)):Promise.resolve().then(()=>update(change))};
}

export function validateSave(s){if(s?.version!==3)throw Error('지원하지 않는 저장 버전입니다.');return validate(normalize(structuredClone(s)));}
