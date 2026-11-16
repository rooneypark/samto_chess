// Shared visual stature for full-body originals, including barracks detail/cards,
// arena, results and combat records; never gameplay stats or collision size.
// The approved Guan Yu / Lu Bu originals include their mounts. Standing figures
// must not be enlarged to the height of a rider plus horse. Xu Chu is a larger
// standing figure: 85% of mounted height, versus 70% for the other standing heroes.
// Preserve source proportions and one foot baseline; this never changes stats.
const mountedOriginals=new Set(['1','119']);
export const characterHeight=(id,mountedHeight)=>mountedHeight*(mountedOriginals.has(id)?1:id==='xuchu'?.85:.70);
