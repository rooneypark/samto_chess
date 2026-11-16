// Retention policy for the append-only parts of the save.
//
// Nothing here may reopen a payout. Idempotency receipts are only dropped together with a
// "floor": the newest time that was dropped. A request stamped at or before the floor is
// refused instead of being executed again (economy.js, battle-run.js, durable-store.js).
// Records that are still needed are pinned: the active run, an unseen shop result,
// unclaimed unexpired mail. Time is the save's own monotonic clock, so moving the device
// clock backwards can neither un-expire nor re-admit anything.
const DAY=86400000;
export const RETENTION={ledgerEntries:400,receiptDays:30,commandReceipts:200,seenWeeks:2,mailDays:30,claimDays:60,archivedRuns:5};

// The only profile fields a run reads: growth, formation, equipped treasures, strategy, motion preference.
export function runProfile(state){
 const equipped=new Set(Object.values(state.heroes).map(h=>h.treasure).filter(Boolean));
 return {
  heroes:Object.fromEntries(Object.entries(state.heroes).map(([id,h])=>[id,{owned:h.owned!==false,level:h.level,star:h.star,treasure:h.treasure??null}])),
  order:[...state.order],
  treasures:(state.treasures??[]).filter(t=>equipped.has(t.id)).map(t=>({id:t.id,defId:t.defId,star:t.star})),
  strategy:state.strategy??'vanguard',
  reducedMotion:!!state.reducedMotion
 };
}
const runSummary=r=>({id:r.id,mode:r.mode,round:r.round,phase:r.phase,outcome:r.outcome??null,rulesetId:r.rulesetId??null,contentVersion:r.contentVersion??null,startedAt:r.startedAt??null,archived:true});
export const archiveRun=run=>runSummary(run);
export function saveClock(s,now=0){return Math.max(now,s.services?.clock??0,s.shop?.lastTime??0,s.battleClock??0);}

export function compactSave(s,now=Date.now()){
 const clock=saveClock(s,now),receiptCut=clock-RETENTION.receiptDays*DAY;

 // Currency ledger: keep recent detail, fold older entries into a running total.
 if((s.ledger?.length??0)>RETENTION.ledgerEntries){
  const old=s.ledger.splice(0,s.ledger.length-RETENTION.ledgerEntries),sum=s.ledgerSummary??{entries:0,deltas:{},fromRevision:old[0].beforeRevision,fromDate:old[0].date};
  for(const e of old){sum.entries++;for(const [k,n] of Object.entries(e.deltas))sum.deltas[k]=(sum.deltas[k]??0)+n;sum.throughRevision=e.afterRevision;sum.throughDate=e.date;}
  s.ledgerSummary=sum;
 }

 // Shop receipts: an unseen result stays; receipts without a request time are never aged out.
 if(s.shop?.receipts){
  let floor=s.shop.receiptFloor??0;
  for(const [id,r] of Object.entries(s.shop.receipts)){
   if(id===s.shop.pending?.commandId||!Number.isFinite(r.time)||r.untimed||r.time>=receiptCut)continue;
   floor=Math.max(floor,r.time);delete s.shop.receipts[id];
  }
  if(floor)s.shop.receiptFloor=floor;
 }

 // Battle receipts: the active run's receipt (shown on its result screen) stays.
 if(s.battleReceipts){
  let floor=s.battleReceiptFloor??0;
  for(const [id,r] of Object.entries(s.battleReceipts)){
   if(id===s.battleRun?.id||!Number.isFinite(r.time)||r.time>=receiptCut)continue;
   floor=Math.max(floor,r.time);delete s.battleReceipts[id];
  }
  if(floor)s.battleReceiptFloor=floor;
 }

 // Quest de-duplication marks: stamped with their week; marks of the active run stay.
 const q=s.services;
 if(q?.seen&&q.periods?.week!==undefined){
  const week=Number(q.periods.week),runId=s.battleRun?.id;
  for(const [id,mark] of Object.entries(q.seen)){
   if(mark===true){q.seen[id]=week;continue;}
   if(runId&&(id.startsWith(runId+':')||id.startsWith('skill:'+runId+':')||id==='run:'+runId||id==='win:'+runId))continue;
   if(week-mark>=RETENTION.seenWeeks)delete q.seen[id];
  }
 }
 if(q?.mail){
  const cut=q.clock-RETENTION.mailDays*DAY;
  q.mail=q.mail.filter(m=>{const closed=m.claimedAt||m.expireAt<=q.clock;return !closed||Math.max(m.claimedAt??0,m.expireAt)>=cut;});
 }
 if(q?.claims&&q.periods?.day!==undefined){
  const day=Number(q.periods.day),week=Number(q.periods.week);
  for(const key of Object.keys(q.claims)){const [,kind,period]=key.split(':'),age=kind==='day'?day-Number(period):(week-Number(period))*7;if(age>RETENTION.claimDays)delete q.claims[key];}
 }

 // A run never needs the ledger, quest log or receipts of the profile it started from.
 const p=s.battleRun?.profile;
 if(p&&Object.keys(p).some(k=>!['heroes','order','treasures','strategy','reducedMotion'].includes(k)))s.battleRun.profile=runProfile(p);
 if(s.archivedRuns?.length)s.archivedRuns=s.archivedRuns.slice(-RETENTION.archivedRuns).map(r=>r.archived?r:runSummary(r));
 return s;
}

// Command receipts exist only for requests that carry their own id; they are capped by count.
export function capCommandReceipts(s){
 const entries=Object.entries(s.commandReceipts??{});
 if(entries.length<=RETENTION.commandReceipts)return s;
 entries.sort((a,b)=>a[1].date-b[1].date||a[1].revision-b[1].revision);
 const dropped=entries.splice(0,entries.length-RETENTION.commandReceipts);
 s.commandReceiptFloor=Math.max(s.commandReceiptFloor??0,...dropped.map(([,r])=>r.date));
 s.commandReceipts=Object.fromEntries(entries);
 return s;
}
