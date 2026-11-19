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
const PROMPT = {
  jab: 'a short straight thrust streak, thin bright line with a white core, pointing right, appears and fades in a flash',
  cut: 'a short crescent slash arc, white core with a colored edge, sweeping once and fading',
  chop: 'a vertical downward slash mark, slightly curved, drawn from top to bottom then fading',
  rise: 'a vertical upward slash mark, slightly curved, drawn from bottom to top then fading',
  thud: 'a blunt impact ring that expands once with four short white rays, shield bash hit',
  whip: 'a thin whip line that bends in an arc and snaps straight to the right',
  cross: 'two crossing slashes forming an X, the second a moment after the first',
  spark: 'a small white hit flash with six short rays, very brief',
  arrow: 'a single arrow flying to the right in a shallow arc, white arrowhead, no bow, no archer',
  missile: 'a short streak of light flying straight to the right',
  orb: 'a glowing magic orb with a short trail flying to the right, then bursting into a ring',
  petal: 'four flower petals fluttering to the right in a wavy path',
  needle: 'a very thin fast needle streak flying to the right',
  order: 'a round target mark with four tick lines that tightens onto a point and fades',
  cast: 'a tall pillar of light rising from a ring on the ground, sparkles floating up, then fading',
  burst: 'a bright starburst flash with twelve rays and flying sparks, plus a ground ring, then fading',
  slash: 'a large crescent slash arc with a white core and thick colored edge, one powerful sweep',
  pierce: 'a long piercing thrust streak that shoots to the right through a point and beyond',
  dash: 'five parallel speed lines along the ground streaking to the right',
  shock: 'a ground shockwave: two flat rings expanding on the ground with short cracks radiating out',
  spin: 'a flat spinning slash ring at waist height, seen from a low top-down camera',
  roar: 'three flat rings expanding outward on the ground one after another, a war cry shockwave',
  shield: 'a translucent oval barrier dome with a moving highlight, appears, holds, fades',
  fury: 'short streaks of energy rising upward from the ground like an aura',
  flurry: 'five small quick slashes at random angles, one after another',
  blink: 'a puff of smoke that shrinks and vanishes, vanish effect',
  bind: 'three rope rings that tighten around an upright body shape and fade',
  drain: 'seven small glowing motes flying to the left in a loose stream',
  stun: 'three small stars circling in a flat ring',
  bolt: 'a lightning bolt striking down from the top of the frame to the ground, flickering, with a glow where it lands',
  rock: 'a boulder falling from above, hitting the ground and breaking into dust and a dust ring',
  ice: 'sharp ice shards falling diagonally from the upper left, shattering on the ground',
  fire: 'a pillar of flames rising from the ground, flickering, with a glowing base, then dying down',
  wind: 'a small whirlwind, narrow at the bottom and wide at the top, spinning in place',
  rune: 'an octagonal formation circle drawn on the ground, two nested octagons slowly rotating, flat on the ground',
  chain: 'a taut chain stretched horizontally between two points, links sliding along it',
  heal: 'small plus-shaped lights rising upward and fading',
  aura: 'two flat rings rising from the ground and fading, a buff effect',
};
out.push(`
## 이펙트 그림 만드는 법

### 준비물

| 준비물 | 어디에 있나 |
|---|---|
| 종류별 규격 (크기, 시간, 장수, 기준점) | 위의 "종류" 표 |
| 종류별 시안 그림 | \`art-source/effects/v1/reference/<종류>.png\` (여섯 장면을 사람 모양과 함께), \`<종류>-peak.png\` (가장 뚜렷한 한 장면, 투명 배경) |
| 움직이는 시안 | \`sim/effects.html\` |
| 장수 색 | 위의 "장수별 배정" 표 |
| 그림체 기준 | 확정 원화 \`art-source/characters/v1/\` (굵은 어두운 윤곽선, 단색 면, 픽셀 그림) |

시안 그림은 \`bone-motion/engine/make_effect_refs.cjs\`로 다시 뽑습니다.

### 방법 1. 사람이나 다른 Claude가 그린다

이 문서와 \`art-source/effects/v1/reference/\` 폴더를 통째로 넘기고, 아래 내용을 그대로 요청합니다.

- 종류마다 "종류" 표의 권장 장수만큼 그립니다. 시안의 여섯 장면이 시작, 가장 큰 순간, 사라지는 순간의 기준입니다.
- 캔버스는 종류마다 하나로 고정하고, 모든 프레임에서 기준점의 위치가 같아야 합니다. 기준점 좌표를 \`fx/<종류>/anchor.json\`에 \`{"canvas": [가로, 세로], "anchor": [x, y], "anchorIs": "대상 가슴"}\` 꼴로 적습니다.
- 배경은 투명, 흰 심과 색 테두리로 그립니다. 색 테두리는 중간 밝기의 한 가지 색으로 그려 두면 게임에서 장수 색으로 바꿉니다.
- 캐릭터는 그리지 않습니다. 시안의 회색 사람 모양은 크기와 위치를 보라는 표시입니다.
- 결과는 \`art-source/effects/v1/fx/<종류>/01.png …\`에 넣습니다.

### 방법 2. PixelLab으로 만든다

PixelLab API 문서(2026-11-19 확인)에 따르면 캐릭터 뼈대 없이 이펙트를 만들 수 있는 기능이 있습니다. 아직 시험해 보지 않았고, 비용은 문서에 적힌 값이라 실제 견적(\`quoted_generations\`)으로 다시 확인해야 합니다.

| 기능 | 넣는 것 | 나오는 것 | 문서상 비용 |
|---|---|---|---|
| \`/vfx\` (이펙트 전용) | 설명 글(\`description\`), 프레임 수(\`sprite_frames\` 1~32), 속도(\`sprite_fps\`), 품질(\`artist\`: lite 또는 pro). 참고 그림(\`sprite\`)은 선택 | 최대 512×512, 최대 32프레임 | 128px 이하 lite 1회분, pro 6회분, 참고 그림을 쓰면 3~28회분 |
| \`/animate-with-text-v3\` | 첫 프레임 그림(\`first_frame\`, 최대 256×256) 필수, 동작 글(\`action\`), 프레임 수(\`frame_count\` 4~16 짝수), 투명 배경(\`no_background\`). 끝 프레임(\`last_frame\`)은 선택 | 최대 256×256, 4~16프레임 | 문서에 없음 |
| \`/create-image-pixen\` | 설명 글, 크기, 투명 배경(256×256까지) | 정지 그림 1장 (첫 프레임을 만들 때) | 문서에 없음 |

PixelLab으로 가려면 필요한 것은 세 가지입니다.

1. **설명 글**: 아래 표의 영어 문장에 공통 문구를 붙입니다.
2. **첫 프레임 그림** (\`/animate-with-text-v3\`를 쓸 때만): \`<종류>-peak.png\`를 그 종류 크기로 잘라 쓰거나, 방법 1로 한 장만 먼저 그립니다. 256×256을 넘는 종류(번개, 함성, 시전 빛기둥)는 절반 크기로 만들어 게임에서 키웁니다.
3. **프레임 수와 크기**: "종류" 표의 권장 장수와 크기.

공통 문구: \`pixel art visual effect sprite, transparent background, no character, no weapon, no text, thick dark outline is not needed, white core with a single mid-bright color edge, clean shapes, readable at small size, low top-down game camera\`

권장 순서: \`/vfx\`로 성격이 다른 세 가지(짧은 베기 cut, 번개 bolt, 보호막 shield)를 lite로 먼저 한 번씩 만들어 보고(문서상 3회분), 쓸 만하면 나머지를 넣습니다. 38가지를 lite로 한 번씩이면 문서상 38회분입니다.

| 종류 | 설명 글 (영어, 공통 문구 앞에 붙인다) |
|---|---|`);
for (const [title, kinds] of GROUPS) for (const k of kinds) out.push(`| ${name(k)} | ${PROMPT[k]} |`);
out.push(`
## 그림으로 바꿔 끼우는 법

- 누가 어떤 종류를 쓰는지는 \`sim/effects.js\`의 \`HERO\` 표에 있습니다. 종류를 바꾸거나 색을 바꿀 때는 이 표만 고칩니다.
- 종류마다 그리는 함수는 같은 파일의 \`KINDS\`에 있습니다. 그림이 준비된 종류는 그 함수를 "기준점에 프레임 그림을 그리는 코드"로 바꿉니다. 나머지 종류는 임시 도형으로 계속 나옵니다.
- 시뮬레이터의 피해 규칙은 단순합니다. 가로 한 줄, 지나가는 길 같은 범위는 아직 없어서 이펙트가 대상 자리에만 나옵니다. 게임에 넣을 때는 전법 설명의 범위에 맞춰 배치합니다.
`);
fs.writeFileSync(path.join(here, '..', 'EFFECT-GUIDE.md'), out.join('\n'), 'utf8');
console.log('EFFECT-GUIDE.md', out.join('\n').split('\n').length, '줄');
