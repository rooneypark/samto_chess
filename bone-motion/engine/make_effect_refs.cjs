// 이펙트 시안 그림: sim/effects.js의 임시 도형을 PNG로 뽑는다. 이펙트를 그리거나 생성할 때 참고 원화로 쓴다.
//
//     npm i @napi-rs/canvas          (아무 폴더에나 한 번; 저장소에는 넣지 않는다)
//     set NODE_PATH=<그 폴더>\node_modules
//     node bone-motion/engine/make_effect_refs.cjs
//
// art-source/effects/v1/reference/<종류>.png        여섯 장면(10, 25, 40, 55, 70, 90%)을 사람 모양과 함께 나란히
// art-source/effects/v1/reference/<종류>-peak.png   가장 뚜렷한 한 장면만, 투명 배경 (생성 도구의 첫 프레임 참고용)
// 두 그림 모두 캐릭터 그림과 같은 배율이다. peak 그림은 512x512이고 대상의 발밑이 (336, 440), 자신의 발밑이 (176, 440)이다.
const path = require('path'), fs = require('fs');
const { createCanvas } = require('@napi-rs/canvas');
global.window = {};
require(path.join(__dirname, '..', 'sim', 'effects.js'));
const F = window.SIM_FX, OUT = path.join(__dirname, '..', '..', 'art-source', 'effects', 'v1', 'reference');
fs.mkdirSync(OUT, { recursive: true });
const SELF = new Set(['cast', 'spin', 'roar', 'shield', 'fury', 'heal', 'aura']), QUICK = new Set(['jab', 'cut', 'chop', 'rise', 'thud', 'whip']);
const COL = '#ffb07a', MOMENTS = [0.1, 0.25, 0.4, 0.55, 0.7, 0.9], PEAK = { cast: 0.3, burst: 0.25, shield: 0.5, roar: 0.5, shock: 0.4, heal: 0.4, aura: 0.4, fury: 0.4, stun: 0.5, bind: 0.4, rune: 0.4, chain: 0.4, fire: 0.5, wind: 0.5, bolt: 0.3, rock: 0.45, ice: 0.45, orb: 0.5, blink: 0.5 };
function body(g, x, ground, col) {
  g.fillStyle = col; g.globalAlpha = 0.35; g.beginPath(); g.ellipse(x, ground, 24, 7, 0, 0, 7); g.fill(); g.globalAlpha = 1;
  g.fillRect(x - 13, ground - 92, 26, 60); g.fillRect(x - 11, ground - 34, 9, 34); g.fillRect(x + 2, ground - 34, 9, 34); g.beginPath(); g.arc(x, ground - 108, 16, 0, 7); g.fill();
}
function effect(kind) {
  const self = SELF.has(kind), a = { px: self ? 0.5 : 0, py: 0 }, b = { px: self ? 0.5 : 1, py: 0 }, spec = { kind, col: COL };
  if (QUICK.has(kind)) spec.quick = true;
  const e = F.make(spec, a, b, [{ px: 0.2, py: 0 }, { px: 1, py: 0 }], false); e.seed = 7; return [e, self];
}
for (const kind of Object.keys(F.KINDS)) {
  const [e, self] = effect(kind), W = 340, H = 440, G = 400, at = x => [90 + x * 160, G];
  const cv = createCanvas(W * MOMENTS.length, H), g = cv.getContext('2d'); g.fillStyle = '#192a3c'; g.fillRect(0, 0, cv.width, H);
  MOMENTS.forEach((k, i) => {
    g.save(); g.translate(i * W, 0); g.beginPath(); g.rect(0, 0, W, H); g.clip();
    g.strokeStyle = '#283d53'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, G + 0.5); g.lineTo(W, G + 0.5); g.stroke();
    if (self) body(g, at(0.5)[0], G, '#5d6b7c'); else { body(g, at(0)[0], G, '#5d6b7c'); body(g, at(1)[0], G, '#7a5d62'); }
    F.draw(g, { ...e, t: e.dur * k }, at);
    g.fillStyle = '#93a4b8'; g.font = '14px sans-serif'; g.fillText(Math.round(k * 100) + '%  ' + Math.round(e.dur * k) + 'ms', 8, 18); g.restore();
  });
  fs.writeFileSync(path.join(OUT, kind + '.png'), cv.toBuffer('image/png'));
  const pc = createCanvas(512, 512), pg = pc.getContext('2d'), pat = x => [176 + x * 160, 440];
  F.draw(pg, { ...e, t: e.dur * (PEAK[kind] || 0.4) }, pat); fs.writeFileSync(path.join(OUT, kind + '-peak.png'), pc.toBuffer('image/png'));
}
console.log(Object.keys(F.KINDS).length + '가지 ->', OUT);
