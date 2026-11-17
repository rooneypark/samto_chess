// Small windows: scale the whole game as one picture.
// Sizes inside the game are container units, so the frame normally just gets narrower. Below about 480px
// that stops working for text: browsers refuse to draw type under a minimum size (10px by default in Korean
// Chrome), so the art kept shrinking while the lettering did not, and labels spilled out of their frames.
// Below BASE the game is therefore laid out at BASE wide and the stack is scaled down with a transform,
// which shrinks type and art together. At BASE and above nothing changes.
const BASE=480;
export function initFit(game){
 const stack=game.parentElement;let queued=false;
 const apply=()=>{
  queued=false;
  const parts=getComputedStyle(game).aspectRatio.match(/[\d.]+/g)?.map(Number)??[];
  const ratio=parts.length>=2&&parts[0]&&parts[1]?parts[0]/parts[1]:941/1672;
  const target=Math.min(innerWidth,innerHeight*ratio);
  if(target>=BASE){
   if(!stack.dataset.fit)return;
   delete stack.dataset.fit;game.style.removeProperty('width');
   for(const name of ['position','left','top','transform','max-width'])stack.style.removeProperty(name);
   return;
  }
  const scale=(target/BASE).toFixed(4);
  if(stack.dataset.fit===scale)return;
  stack.dataset.fit=scale;game.style.width=BASE+'px';
  stack.style.position='fixed';stack.style.left='50%';stack.style.top='50%';stack.style.maxWidth='none';
  stack.style.transform=`translate(-50%,-50%) scale(${scale})`;
 };
 const queue=()=>{if(!queued){queued=true;requestAnimationFrame(apply);}};
 // Resizes apply at once: anything measured right after a resize must already see the fitted layout.
 addEventListener('resize',apply);
 // The frame's proportions differ between the gate and the artwork screens; follow screen changes.
 new MutationObserver(queue).observe(game,{attributes:true,attributeFilter:['class','hidden'],subtree:true});
 apply();
}
