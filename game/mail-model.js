export const mailAvailable=(mail,now)=>!mail.claimedAt&&mail.expireAt>now;
export const mailStatus=(mail,now)=>mail.claimedAt?'수령 완료':mail.expireAt<=now?'기한 만료':'수령 가능';
export function mailPage(state,{tab='all',page=0,selected=null}={},now=Date.now()){
 now=Math.max(now,state.services?.clock??0);
 const all=state.services?.mail??[],waiting=all.filter(m=>mailAvailable(m,now)),claimed=all.filter(m=>m.claimedAt);
 const filtered=tab==='available'?waiting:tab==='claimed'?claimed:all,pages=Math.max(1,Math.ceil(filtered.length/3));
 page=Math.max(0,Math.min(page,pages-1));const visible=filtered.slice(page*3,page*3+3);
 if(!visible.some(m=>m.id===selected))selected=visible[0]?.id??null;
 const total={};for(const m of waiting)for(const [key,value] of Object.entries(m.attachments??{}))if(Number.isFinite(value)&&value>0)total[key]=(total[key]??0)+value;
 return {all,waiting,claimed,filtered,visible,pages,page,selected,chosen:visible.find(m=>m.id===selected)??null,tab,now,total};
}
