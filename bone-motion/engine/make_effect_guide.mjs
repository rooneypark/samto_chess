// EFFECT-GUIDE.md를 sim/effects.js와 sim/heroes.js에서 만든다.
//     node bone-motion/engine/make_effect_guide.mjs
// 표는 전부 코드에서 뽑으므로, 이펙트 배정을 바꾼 뒤에는 이 스크립트를 다시 돌린다.
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
const require = createRequire(import.meta.url), here = path.dirname(fileURLToPath(import.meta.url)), sim = path.join(here, '..', 'sim');
globalThis.window = {};
require(path.join(sim, 'effects.js')); require(path.join(sim, 'heroes.js')); require(path.join(sim, 'data.js'));
const F = window.SIM_FX, HEROES = window.SIM_HEROES, FAM = Object.fromEntries(window.SIM_DATA.families.map(f => [f.id, f]));
const frames = ms => Math.max(3, Math.round(ms / 66));
const name = k => `${F.NOTES[k][0]}(${k})`;
const list = (h, slot) => F.what(h, slot).map(s => name(s.kind) + (s.n > 1 ? ` ${s.n}발` : '') + (s.rain ? ' 화살비' : '') + (s.big ? ' 굵게' : '')).join(' + ') || '-';
const QUICK = ['jab', 'cut', 'chop', 'rise', 'thud', 'whip'];
const GROUPS = [
  ['근접 평타', ['jab', 'cut', 'chop', 'rise', 'thud', 'whip', 'cross', 'spark']],
  ['원거리 평타', ['arrow', 'missile', 'orb', 'petal', 'needle', 'order']],
  ['전법 공통', ['cast', 'burst']],
  ['근접 전법', ['slash', 'pierce', 'dash', 'shock', 'spin', 'roar', 'shield', 'fury', 'flurry', 'blink', 'bind', 'drain', 'stun']],
  ['책사·지원 전법', ['bolt', 'rock', 'ice', 'fire', 'wind', 'rune', 'chain', 'heal', 'aura']],
];
const out = [];
out.push(`# 이펙트 제작 가이드

평타와 전법 이펙트를 그릴 때 보는 문서입니다. 지금 시뮬레이터에 들어 있는 이펙트는 전부 임시 도형이고, 이 문서의 규격대로 그린 그림으로 바꿉니다.
표는 \`sim/effects.js\`에서 자동으로 뽑았습니다. 배정을 바꾸면 \`node bone-motion/engine/make_effect_guide.mjs\`로 다시 만듭니다.

## 시안 보는 곳

- 종류별 시안: \`simulator.cmd\`를 실행한 뒤 주소를 \`/bone-motion/sim/effects.html\`로 바꿉니다. ${Object.keys(F.KINDS).length}가지가 각각 반복 재생되고, 색·속도·평타/전법 크기를 바꿔 볼 수 있습니다. "멈춰서 4장면으로 보기"를 켜면 시작·중간·끝 모양을 볼 수 있습니다.
- 전투 속 모습: \`/bone-motion/sim/battle.html\`에서 장수를 골라 전투를 돌립니다.

## 공통 규격

- **배율**: 캐릭터 그림과 1:1입니다. 격자 한 칸이 100px, 보병 키가 약 124px입니다. 표의 크기는 모두 이 배율의 px입니다.
- **기준점**: 발밑은 캐릭터 그림의 접지점(256 캔버스의 128, 224)입니다. 대상 가슴은 발밑에서 위로 36px, 자신 가슴은 위로 50px입니다.
- **방향**: 자신에서 대상으로 가는 이펙트(화살, 찌르기, 베기 등)는 오른쪽을 향하게 한 벌만 그립니다. 게임이 방향에 맞게 돌립니다. 하늘에서 떨어지거나 바닥에 깔리는 이펙트는 돌리지 않습니다.
- **시간과 장수**: 표의 시간이 재생 길이입니다. 권장 장수는 초당 15장 기준입니다.
- **평타**: 타격 프레임에 시작해서 0.2초 안에 끝납니다. 근접 평타는 표의 시간에 0.6을 곱한 값이 실제 길이입니다(표에는 곱한 값을 적었습니다).
- **전법**: 같은 종류라도 평타보다 1.25배 크고 1.25배 길게 재생하며 빛 번짐이 붙습니다. 전법용 그림은 표의 크기와 시간에 1.25를 곱해 그립니다.
- **색**: 흰 심에 장수 색 테두리가 기본입니다. 장수 색은 아래 장수별 표에 있습니다. 한 벌을 흰색·회색으로 그려 두고 게임에서 색을 입혀도 됩니다.
- **파일**: 배경이 투명한 PNG. \`fx/<종류>/01.png\`부터 번호 순서로 둡니다. 장수 전용으로 따로 그리면 \`fx/<종류>-<장수 id>/\`에 둡니다.
- **겹치는 순서**: 시안은 전부 캐릭터 위에 그립니다. 바닥에 깔리는 것(진, 충격파 고리, 시전 고리, 강화 고리)은 캐릭터 아래에 두는 쪽을 권합니다.

## 한 번의 공격에서 나오는 것

| 상황 | 나오는 이펙트 |
|---|---|
| 근접 평타 | 동작에 맞는 자국 1개 + 맞는 섬광(spark). 중무기·긴자루 도끼의 내려치기에는 작은 충격파가 더 붙습니다 |
| 원거리 평타 | 장수별 발사체 1개 |
| 전법 (모든 장수) | 자신에게 시전 빛기둥(cast)과 전법 이름 → 장수별 이펙트 → 맞는 대상마다 명중 섬광(burst) |
| 지원 전법 | 자신에게 시전 빛기둥과 자신용 이펙트 → 효과를 받는 아군마다 지원 이펙트 |
`);
out.push('## 종류\n');
for (const [title, kinds] of GROUPS) {
  out.push(`### ${title}\n`);
  out.push('| 종류 | 이름 | 쓰임 | 기준점 | 크기 | 시간 | 권장 장수 |\n|---|---|---|---|---|---|---|');
  for (const k of kinds) { const n = F.NOTES[k], ms = Math.round(F.DUR[k] * (QUICK.includes(k) ? 0.6 : 1)); out.push(`| ${k} | ${n[0]} | ${n[1]} | ${n[2]} | ${n[3]} | ${ms}ms | ${frames(ms)}장 |`); }
  out.push('');
}
out.push(`## 근접 평타가 정해지는 규칙

본 동작의 이름으로 자국이 정해집니다. 위에서부터 먼저 맞는 줄을 씁니다.

| 동작 이름에 들어 있는 말 | 종류 |
|---|---|
| 방패 치기 | 방패 치기(thud) |
| 찌르, 직창 | 짧은 찌르기(jab) |
| 교차 | X자 베기(cross) |
| 올려 | 올려 베기(rise) |
| 내리꽂, 내려, 찍 | 내려 베기(chop) |
| 후리, 당기 | 채찍 줄(whip) |
| 그 밖 (베기, 휘두르기, 걸기) | 짧은 베기(cut) |

### 병종별 평타 동작과 자국
`);
out.push('| 병종 | 동작 → 자국 |\n|---|---|');
for (const f of window.SIM_DATA.families) {
  if (['bow', 'caster'].includes(f.id)) continue;
  const h = { family: f.id, name: '' }, rows = Object.entries(f.clips).filter(([id, c]) => /^[ab]\d$/.test(id) && !/지목|지시/.test(c.event || '')).map(([id, c]) => `${c.title} → ${F.melee(h, c.title)[0].kind}`);
  out.push(`| ${f.title} | ${rows.join('<br>')} |`);
}
out.push(`
## 장수별 배정

색은 그 장수의 이펙트 테두리 색입니다. 근접 장수의 평타는 위 규칙을 따르고, 색만 장수 색을 씁니다.

| 장수 | 병종 | 전법 | 색 | 평타 | 전법: 대상에게 | 전법: 자신에게 | 전법: 아군에게 |
|---|---|---|---|---|---|---|---|`);
for (const h of HEROES) {
  const ranged = ['bow', 'caster'].includes(h.family), fam = FAM[h.family];
  const basic = ranged ? list(h, 'attack') : (h.attacks || []).map(id => F.melee(h, fam.clips[id].title)[0].kind).join(', ') + (h.family === 'command' ? ' (지시 동작은 표적 표시)' : '');
  const skillClip = fam.clips[h.skillClip], support = (skillClip.event === '발동') && !['책사', '화공'].includes(h.role) && h.family !== 'bow';
  out.push(`| ${h.name} | ${fam.title} | ${h.skill} | \`${F.colour(h)}\` | ${basic} | ${support ? '-' : list(h, 'skill')} | ${list(h, 'self')} | ${support ? list(h, 'support') : '-'} |`);
}
out.push(`
## 그림으로 바꿔 끼우는 법

- 누가 어떤 종류를 쓰는지는 \`sim/effects.js\`의 \`HERO\` 표에 있습니다. 종류를 바꾸거나 색을 바꿀 때는 이 표만 고칩니다.
- 종류마다 그리는 함수는 같은 파일의 \`KINDS\`에 있습니다. 그림이 준비된 종류는 그 함수를 "기준점에 프레임 그림을 그리는 코드"로 바꿉니다. 나머지 종류는 임시 도형으로 계속 나옵니다.
- 시뮬레이터의 피해 규칙은 단순합니다. 가로 한 줄, 지나가는 길 같은 범위는 아직 없어서 이펙트가 대상 자리에만 나옵니다. 게임에 넣을 때는 전법 설명의 범위에 맞춰 배치합니다.
`);
fs.writeFileSync(path.join(here, '..', 'EFFECT-GUIDE.md'), out.join('\n'), 'utf8');
console.log('EFFECT-GUIDE.md', out.join('\n').split('\n').length, '줄');
