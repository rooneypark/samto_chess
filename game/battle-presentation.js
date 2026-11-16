// Native sprite pivots are centered. MOV/SPC are 96px; ATK has 16px
// extra padding on each side. The ground plane is always pivot + 48px.
export const GROUND={x:.5,y:.70};
export function spritePlacement(pose){
 const pixels=pose.startsWith('ATK-')?128:96,scale=.84/96;
 return {pixels,scale,width:pixels*scale*100,height:pixels*scale*100,left:(GROUND.x-pixels/2*scale)*100,top:(GROUND.y-(pixels/2+48)*scale)*100,anchorX:pixels/2,anchorY:pixels/2+48};
}
export function motionPose(u,b){
 const tick=b?.tick??0,t=b?.units.find(v=>v.id===(u.action?.target??u.poseTarget));
 const dx=u.move?u.move.x-u.x:t?t.x-u.x:0,dy=u.move?u.move.y-u.y:t?t.y-u.y:u.side===1?-1:1;
 const direction=Math.abs(dx)>Math.abs(dy)?2:dy>0?1:0;
 let pose=`MOV-${[7,8,9][direction]}`;
 if(u.hp===0)return {pose:'SPC-4',flip:false};
 if(u.action?.skill||u.poseSkill&&u.poseUntil>tick)pose=`SPC-${direction+1}`;
 else if(u.action){const start=u.action.start??u.action.at-7,progress=(tick-start)/Math.max(1,u.action.at-start);pose=`ATK-${direction*4+(progress<.65?1:2)}`;}
 else if(u.poseUntil>tick)pose=`ATK-${direction*4+(tick-u.poseStart<3?3:4)}`;
 else if(u.move)pose=`MOV-${[1,3,5][direction]+Math.floor((tick-u.move.start)/5)%2}`;
 return {pose,flip:direction===2&&dx>0};
}
export function screenPosition(u,b,reduced=false){
 let x=u.x,y=u.y;
 if(u.move&&!reduced){const p=Math.max(0,Math.min(1,(b.tick-u.move.start)/(u.move.at-u.move.start)));x+=(u.move.x-u.x)*p;y+=(u.move.y-u.y)*p;}
 return {x,y,left:x*12.5,top:(7-y)*12.5};
}
