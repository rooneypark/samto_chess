// Explicitly requested scroll / barracks body changes; retain historical references.
// Shared-scroll and side-margins tests verify source pixels, alpha, corners and the uniform backdrop.
module.exports=async function sharedScrollBaseline(page,width=941,origin={x:0,y:0}){
 const boxes=await page.locator('.shared-scroll:visible,.art-header-content.barracks:visible').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:Math.floor(r.x)-1,y:Math.floor(r.y)-1,right:Math.ceil(r.right)+1,bottom:Math.ceil(r.bottom)+1};}));
 // Barracks replaces the entire baked backdrop with separate original-alpha layers.
 // Its body is covered by dedicated source/corner/layout/character/background-pixel tests.
 if(await page.locator('.barracks-v2:visible').count()){const g=await page.locator('.game').boundingBox(),s=g.width/941;for(const [x,y,w,h] of [[0,150,941,1348]])boxes.push({x:g.x+x*s,y:g.y+y*s,right:g.x+(x+w)*s,bottom:g.y+(y+h)*s});}
 return i=>{const pixel=Math.floor(i/4),x=pixel%width+origin.x,y=Math.floor(pixel/width)+origin.y;return boxes.some(b=>x>=b.x&&x<b.right&&y>=b.y&&y<b.bottom);};
};
