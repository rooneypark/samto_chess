export const recordMetrics=Object.freeze({damage:'피해량',healing:'치유량',casts:'전법 횟수'});
export const recordValue=value=>Number.isFinite(value)?Math.max(0,Math.floor(value)):0;
export const recordNumber=value=>recordValue(value).toLocaleString('ko-KR');

// Current-round statistics, including fallen and reinforced units. Never mutate
// the engine's unit order or values, and never infer unsupported lifetime totals.
export function combatRecordPage(battle,{side=0,metric='damage',page=0,selected=null}={}){
 if(!Object.hasOwn(recordMetrics,metric))metric='damage';
 const units=(battle?.units??[]).map((u,index)=>({...u,key:String(u.id??index),value:recordValue(u[metric])})).filter(u=>u.side===side)
  .sort((a,b)=>b.value-a.value||Number(a.id??0)-Number(b.id??0));
 const total=units.reduce((sum,u)=>sum+u.value,0),pages=Math.max(1,Math.ceil(units.length/6));
 page=Math.max(0,Math.min(pages-1,Math.floor(page)||0));
 const visible=units.slice(page*6,page*6+6),chosen=visible.find(u=>u.key===selected)??visible[0]??null;
 return {metric,page,pages,total,units,visible,chosen};
}
