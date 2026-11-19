// Hero table for the simulator and for the docs: which motion type, which attack set and which skill clip each of
// the 49 heroes uses. Reads the game's own data (read only).   node bone-motion/engine/make_heroes.mjs
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url)), repo = join(here, '..', '..');
const load = f => import(pathToFileURL(join(repo, 'game', f)).href);
const { heroes } = await load('heroes.js'); const { specs } = await load('progression.js');

const FAMILY = { foot_spear: '보행 창', sword: '한손 검·단도', spear_shield: '창·방패', dual: '쌍무기', heavy: '중무기', flexible: '사슬·채찍', bow: '궁', command: '군령',
  caster: '책사·지원', mounted_spear: '기마 창', mounted_blade: '기마 월도·화극', sickle: '사슬·채찍 (사슬낫 변형)', poleaxe: '중무기 (긴자루 도끼 변형)' };
// name: [motion type, attack set, skill clip]
// Three attacks per hero, one from each slot. Every attack starts and ends in the guard, so slot 1, 2 and 3 can be taken
// from set A or set B independently: 8 trios per type instead of 2. Heroes of one type must not all swing the same
// three attacks (user review 2026-11-19: it should not look mass-produced). The first hero of each set keeps the plain
// trio (Zhang Fei = a1 a2 a3, already produced and approved); the others get the nearest unused mix. When a type has
// more heroes than trios, the first two attacks swap order.
// hero-attacks.json (engine/assign_attacks.py) holds the measured choice: the three attacks that differ most from each
// other and from the hero's skill. It wins over the simple A/B mix below, which is only the fallback.
const PICKED = (() => { try { return JSON.parse(readFileSync(new URL('../hero-attacks.json', import.meta.url), 'utf8')); } catch { return {}; } })();
const taken = {};
function combo(name, family, set) {
  const X = set.toLowerCase(), Y = X === 'a' ? 'b' : 'a', used = (taken[family] ||= new Set());
  const mixes = [[X, X, X], [X, Y, X], [X, X, Y], [Y, X, X], [X, Y, Y], [Y, Y, X], [Y, X, Y], [Y, Y, Y]];
  for (const swap of [false, true]) for (const mix of mixes) {
    let trio = mix.map((l, i) => l + (i + 1)); if (swap) trio = [trio[1], trio[0], trio[2]];
    const key = trio.join(' '); if (!used.has(key)) { used.add(key); return trio; }
  }
  return [X + 1, X + 2, X + 3];
}
const MAP = {
  장비: ['foot_spear', 'A', 's1'], 하후돈: ['foot_spear', 'B', 's2'], 강유: ['foot_spear', 'A', 's3'], 여몽: ['foot_spear', 'B', 's4'], 문추: ['foot_spear', 'B', 's5'],
  악진: ['sword', 'B', 's1'], 위연: ['sword', 'A', 's1'], 요화: ['sword', 'A', 's2'], 화웅: ['sword', 'A', 's2'], 안량: ['sword', 'B', 's2'], 정봉: ['sword', 'B', 's3'], 동탁: ['sword', 'A', 's3'],
  주유: ['sword', 'A', 's4'], 주창: ['sword', 'A', 's5'],
  의용보병: ['spear_shield', 'A', 's1'], 조홍: ['spear_shield', 'B', 's2'],
  유비: ['dual', 'A', 's1'], 전위: ['dual', 'B', 's2'], 손책: ['dual', 'A', 's3'],
  허저: ['heavy', 'B', 's1'], 서황: ['poleaxe', 'A', 's2'],
  감녕: ['sickle', 'A', 's1'], 황개: ['flexible', 'B', 's2'], 반장: ['flexible', 'A', 's3'],
  황충: ['bow', 'A', 's1'], 의용궁병: ['bow', 'A', 's2'], 하후연: ['bow', 'B', 's3'], 태사자: ['bow', 'B', 's4'], 손상향: ['bow', 'A', 's5'],
  조조: ['command', 'A', 's1'], 손권: ['command', 'B', 's2'], 원소: ['command', 'A', 's3'],
  제갈량: ['caster', 'A', 's1'], 사마의: ['caster', 'A', 's2'], 장각: ['caster', 'B', 's2'], 화타: ['caster', 'B', 's3'], 순욱: ['caster', 'B', 's3'], 노숙: ['caster', 'B', 's3'],
  곽가: ['caster', 'A', 's4'], 초선: ['caster', 'A', 's4'], 방통: ['caster', 'B', 's5'], 육손: ['caster', 'A', 's6'], 군영참모: ['caster', 'B', 's6'],
  조운: ['mounted_spear', 'A', 's1'], 마초: ['mounted_spear', 'B', 's2'], 공손찬: ['mounted_spear', 'A', 's3'],
  관우: ['mounted_blade', 'A', 's1'], 장료: ['mounted_blade', 'B', 's2'], 여포: ['mounted_blade', 'A', 's3'],
};
const out = heroes.map(h => {
  const m = MAP[h.name]; if (!m) throw new Error('no motion mapping for ' + h.name);
  const s = specs[h.id], [hp, atk, def, mdef, range, interval, mana] = s.stats;
  return { id: h.id, name: h.name, faction: h.faction, role: h.role, grade: s.grade, hp, atk, def, mdef, range, interval, mana, skill: s.skill, skillText: s.description,
           family: m[0], set: m[1], skillClip: m[2], attacks: PICKED[h.name] || combo(h.name, m[0], m[1]) };
});
writeFileSync(join(here, '..', 'sim', 'heroes.js'), 'window.SIM_HEROES = ' + JSON.stringify(out) + ';\n', 'utf8');

const order = Object.keys(FAMILY); let md = '# 장수 49명 모션 배정표\n\n`bone-motion/engine/make_heroes.mjs`가 게임 데이터에서 만든 표다. 고칠 때는 그 파일의 `MAP`을 고치고 다시 실행한다.\n\n'
  + '- 대기·이동: 유형 공통 클립(`idle`, `move`).\n- 평타: 장수마다 세 개를 순서대로 돈다. 1타·2타·3타를 A 세트와 B 세트에서 섞어, 같은 유형의 장수끼리 조합이 겹치지 않게 했다.\n- 전법: 유형의 전법 6개 중 하나.\n\n'
  + '| 장수 | 세력 | 역할 | 전투 유형 | 평타 3개 | 전법 (게임) | 전법 클립 |\n|---|---|---|---|---|---|---|\n';
for (const f of order) for (const h of out.filter(x => x.family === f)) md += `| ${h.name} | ${h.faction} | ${h.role} | ${FAMILY[f]} | ${h.attacks.join(' → ')} | ${h.skill} | ${h.skillClip} |\n`;
writeFileSync(join(here, '..', 'HERO-MOTIONS.md'), md, 'utf8');
console.log(out.length, 'heroes written');
