// A small picture of a tactic for the skill dialog: where it lands on a 5x5 patch of the board, and what it does.
// Everything is read from the tactic's own description, so new heroes get a picture without extra data.
// "나" marks the caster (bottom centre, facing up); filled cells are the affected area.
const shapes=[
 [/모든 적|모든 아군|전체/,'all','전체'],
 [/가로 한 줄|한 줄 전체/,'row','가로 한 줄'],
 [/직선|돌진|지나가는/,'line','직선'],
 [/반경 ?2/,'ring2','반경 2'],
 [/반경|밀집|주변|인접/,'ring','범위'],
 [/(\d)명|연쇄|서로 다른/,'multi','여러 명'],
 [/자신에게|자신의|자신 /,'self','자신']
];
const cells={
 all:()=>true,
 row:(x,y)=>y===1,
 line:(x,y)=>x===2&&y<4,
 ring2:(x,y)=>Math.hypot(x-2,y-2)<=2.1&&!(x===2&&y===4),
 ring:(x,y)=>Math.hypot(x-2,y-1)<=1.5,
 multi:(x,y)=>(x===1&&y===1)||(x===3&&y===0)||(x===2&&y===2),
 self:(x,y)=>x===2&&y===4,
 single:(x,y)=>x===2&&y===3
};
const effects=[
 [/물리 피해/,'물리','dmg'],[/마법 피해|벼락|번개/,'마법','magic'],[/화염|불|화공/,'화염','fire'],[/기절/,'기절','bad'],[/둔화|공격속도 −|공격속도 -/,'둔화','bad'],
 [/침묵/,'침묵','bad'],[/이동 불가|묶/,'속박','bad'],[/도발/,'도발','bad'],[/방어.{0,6}−|방어 감소/,'방어↓','bad'],
 [/보호막/,'보호막','good'],[/회복/,'회복','good'],[/공격 \+|공격속도 \+|피해 \+/,'강화','good'],[/마나 \+/,'마나','good'],[/피해.{0,8}감소/,'피해감소','good'],
 [/순간이동|돌진/,'이동','move']
];
export function skillVisual(description){
 const text=String(description??''),found=shapes.find(([pattern])=>pattern.test(text)),shape=found?.[1]??'single',label=found?.[2]??'단일 대상';
 const friendly=/아군|자신/.test(text)&&!/적/.test(text);
 let grid='';
 for(let y=0;y<5;y++)for(let x=0;x<5;x++){const me=x===2&&y===4,hit=cells[shape](x,y);grid+=`<i class="${me?'me ':''}${hit?'hit':''}">${me?'나':''}</i>`;}
 const chips=effects.filter(([pattern])=>pattern.test(text)).map(([,name,tone])=>`<span data-tone="${tone}">${name}</span>`).join('');
 return `<div class="skill-visual" data-friendly="${friendly}"><div class="skill-grid" role="img" aria-label="전법 범위: ${label}">${grid}</div><div class="skill-facts"><strong>${label}</strong><div class="skill-chips">${chips}</div></div></div>`;
}
