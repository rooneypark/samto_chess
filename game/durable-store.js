import {createGameStore,validateSave} from './store.js';
import {capCommandReceipts} from './retention.js';
import {SAVE_KEY as KEY,RULESET} from './versions.js';
export async function durableStore(initial){
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('samguk-chess',1);r.onupgradeneeded=()=>r.result.createObjectStore('profile');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 const record=await new Promise((resolve,reject)=>{const r=db.transaction('profile').objectStore('profile').get('main');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 let state=record?validateSave(record):(typeof initial==='function'?initial():initial).get(),queue=Promise.resolve();
 const listeners=new Set(),channel=typeof BroadcastChannel==='function'?new BroadcastChannel('samguk-profile'):null;
 let stale=false;channel?.addEventListener('message',e=>{if(e.data.revision>state.revision)stale=true;});
 try{if(record)localStorage.setItem(KEY,JSON.stringify(state));}catch{}
 const transact=(change,metadata={})=>{
  // Only requests that bring their own id can be replayed, so only those leave a receipt.
  const explicit=metadata.id!==undefined,commandId=metadata.id??crypto.randomUUID();
  const task=async()=>{document.dispatchEvent(new CustomEvent('game-committing',{detail:true}));try{
   if(explicit&&state.commandReceipts?.[commandId])return structuredClone(state);
   if(explicit&&metadata.issuedAt!==undefined&&metadata.issuedAt<=(state.commandReceiptFloor??-1))throw Error('보관 기간이 지난 요청입니다. 다시 시도하세요.');
   if(stale)throw Error('다른 창에서 저장이 변경되었습니다. 새로고침 후 다시 시도하세요.');
   if(typeof change!=='function'&&change.revision!==undefined&&change.revision!==state.revision)throw Error('이전 화면의 요청입니다. 다시 시도하세요.');
   let raw=JSON.stringify(state);const scratch=createGameStore({getItem:k=>k===KEY?raw:null,setItem:(k,v)=>{raw=v;}});
   const next=scratch.update(change),revision=state.revision;
   if(explicit)next.commandReceipts={...state.commandReceipts,[commandId]:{revision:next.revision,reason:metadata.reason??'profile-command',rulesetId:RULESET,date:Date.now()}};
   capCommandReceipts(next);
   if(next.ledger?.at(-1)?.afterRevision===next.revision)Object.assign(next.ledger.at(-1),{transactionId:commandId,commandId,reason:metadata.reason??next.ledger.at(-1).reason});
   await new Promise((resolve,reject)=>{const tx=db.transaction('profile','readwrite'),store=tx.objectStore('profile'),r=store.get('main');let conflict=false;
    r.onsuccess=()=>{if(r.result&&r.result.revision!==revision){conflict=true;tx.abort();return;}store.put(next,'main');};
    tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(Error(conflict?'다른 창의 저장과 충돌했습니다. 새로고침하세요.':'저장 거래가 취소되었습니다.'));
   });
   state=next;try{localStorage.setItem(KEY,JSON.stringify(state));}catch{/* IndexedDB is authoritative; the compatibility mirror is optional. */}
   channel?.postMessage({revision:state.revision});for(const fn of listeners)try{fn(structuredClone(state));}catch(e){console.error(e);}
   return structuredClone(state);
  }finally{document.dispatchEvent(new CustomEvent('game-committing',{detail:false}));}};
  const result=queue.then(task);queue=result.catch(()=>{});return result;
 };
 return {get:()=>structuredClone(state),subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},update:transact,transact,
 async restore(next){validateSave(next);await transact(s=>({...next,revision:s.revision}));},close(){channel?.close();db.close();}};
}
