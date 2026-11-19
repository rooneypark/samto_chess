export {generals} from './character-art-data.js';
import {generals} from './character-art-data.js';
export const characterView=(id,view='front')=>generals[id]?.views[view];
export const characterSource=(id,view='front')=>characterView(id,view)?.url;
// Every hero shares a canvas scale. Physique is already authored into the pixels.
export const characterCanvasHeight=height=>height*256/176;
export function characterFacing(unit,battle){
 const target=battle?.units?.find(v=>v.id===(unit.action?.target??unit.poseTarget));
 const dx=unit.move?unit.move.x-unit.x:target?target.x-unit.x:0;
 const dy=unit.move?unit.move.y-unit.y:target?target.y-unit.y:unit.side===1?-1:1;
 const view=unit.y<0?'front':Math.abs(dx)>Math.abs(dy)?'side':dy>0?'back':'front';
 return {view,flip:view==='side'&&dx>0};
}
