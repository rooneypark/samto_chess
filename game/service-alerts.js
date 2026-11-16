import {mailAvailable} from './mail-model.js';
import {achievementDefs,achievementProgress,prepareServices,questDefs} from './services.js';

export function serviceAlerts(state,now=Date.now()){
 const q=prepareServices({...state,services:structuredClone(state.services)},now);
 const quest=questDefs.some(({id})=>{
  const progress=q.quests[id];
  return !progress.claimed&&progress.progress>=progress.target;
 });
 const bonus=['day','week'].some(period=>!q.claims[`bonus:${period}:${q.periods[period]}`]
  &&questDefs.filter(def=>def.period===period).every(({id})=>q.quests[id].claimed));
 const achievement=achievementDefs.some(def=>!q.achievements[def.id]&&achievementProgress(state,def)>=def.target);
 return {
  mail:q.mail.some(mail=>mailAvailable(mail,q.clock)),
  quests:q.attendance.day!==q.periods.day||quest||bonus||achievement
 };
}
