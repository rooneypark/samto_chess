// Base values at 1 star, using the existing combatant stat types.
const statLabels = {
 atk:'공격', speed:'공격속도', skill:'전법 피해', move:'이동속도',
 hp:'최대 체력', def:'방어', mdef:'마법방어', heal:'주는 회복', shield:'주는 보호막'
};

export const treasureTraits = Object.fromEntries([
 // Weapons
 ['tr-001','의천검','A','atk',12],
 ['tr-002','청공검','B','atk',10],
 ['tr-003','청룡언월도','S','skill',15],
 ['tr-004','장팔사모','S','atk',15],
 ['tr-005','방천화극','S','speed',12],
 ['tr-006','자웅일대검','B','shield',10],
 ['tr-007','고정도','C','atk',7],
 ['tr-008','칠성보도','A','skill',11],
 ['tr-011','쌍철극','B','def',12],
 ['tr-016','이광궁','C','speed',6],
 ['tr-018','여포궁','B','speed',8],
 // Mounts
 ['tr-032','적토마','S','move',17],
 ['tr-033','적로','A','hp',14],
 ['tr-034','절영','B','move',12],
 ['tr-035','조황비전','A','move',14],
 // Books
 ['tr-042','손자병법','A','shield',12],
 ['tr-043','육도','B','hp',10],
 ['tr-044','삼략','C','def',8],
 ['tr-045','맹덕신서','B','skill',8],
 ['tr-046','청낭서','A','heal',12],
 ['tr-047','태평요술서','A','skill',12],
 ['tr-048','둔갑천서','B','mdef',12],
 ['tr-049','태평청령서','B','heal',9],
 // Armor, artifacts and gems
 ['tr-071','황금갑옷','A','def',15],
 ['tr-074','용린갑옷','A','mdef',15],
 ['tr-082','제갈건','C','mdef',8],
 ['tr-083','옥새','S','hp',18],
 ['tr-085','백우선','C','skill',5],
 ['tr-088','청룡보옥','B','atk',9],
 ['tr-089','주작보옥','A','speed',10],
 ['tr-090','백호보옥','C','hp',8],
 ['tr-091','현무보옥','C','shield',7]
].map(([id,name,grade,stat,percent])=>[id,{name,grade,stat,percent,label:statLabels[stat]}]));
