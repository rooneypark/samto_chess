// Treasure codex catalogue: the 32 named treasures whose art is finished (art-source/treasures/v1/catalog.json).
// These are display entries only. The treasures a player can own are still the twelve in treasures.js; the
// mapping from those to this catalogue is not decided (docs/보물_기획서.md, 6절), so nothing here is marked owned.
export const treasureCategories={weapon:'무기',horse:'명마',book:'병서',armor:'방어구',jewel:'보옥',object:'기물'};
export const treasureCodex=[
 ['tr-001','의천검','weapon'],
 ['tr-002','청공검','weapon'],
 ['tr-003','청룡언월도','weapon'],
 ['tr-004','장팔사모','weapon'],
 ['tr-005','방천화극','weapon'],
 ['tr-006','자웅일대검','weapon'],
 ['tr-007','고정도','weapon'],
 ['tr-008','칠성보도','weapon'],
 ['tr-011','쌍철극','weapon'],
 ['tr-016','이광궁','weapon'],
 ['tr-018','여포궁','weapon'],
 ['tr-032','적토마','horse'],
 ['tr-033','적로','horse'],
 ['tr-034','절영','horse'],
 ['tr-035','조황비전','horse'],
 ['tr-042','손자병법','book'],
 ['tr-043','육도','book'],
 ['tr-044','삼략','book'],
 ['tr-045','맹덕신서','book'],
 ['tr-046','청낭서','book'],
 ['tr-047','태평요술서','book'],
 ['tr-048','둔갑천서','book'],
 ['tr-049','태평청령서','book'],
 ['tr-071','황금갑옷','armor'],
 ['tr-074','용린갑옷','armor'],
 ['tr-082','제갈건','armor'],
 ['tr-083','옥새','object'],
 ['tr-085','백우선','object'],
 ['tr-088','청룡보옥','jewel'],
 ['tr-089','주작보옥','jewel'],
 ['tr-090','백호보옥','jewel'],
 ['tr-091','현무보옥','jewel']
].map(([id,name,category])=>({id,name,category,image:`assets/treasures-v1/${id}.png`}));
