// 원거리 공격·전법 이펙트 (임시 도형).
// 장수마다 "어떤 종류의 이펙트를 쓰는가"만 여기서 정한다. 그림은 전부 캔버스 도형으로 그린 임시본이고,
// 나중에 제작한 이펙트 그림으로 바꿀 때는 KINDS의 그리기 함수만 갈아 끼우면 된다. 피해 계산은 battle.html이 한다.
//
// 종류
//   missile  직선으로 날아가는 빛줄기          orb     천천히 날아가 터지는 구슬
//   petal    흔들리며 날아가는 꽃잎            needle  아주 빠른 가는 침
//   arrow    화살 (n: 발 수, rain: 하늘에서 쏟아짐, big: 굵은 한 발)
//   bolt     하늘에서 떨어지는 번개            rock    하늘에서 떨어지는 바위
//   ice      비스듬히 떨어지는 얼음 조각        fire    땅에서 솟는 불기둥
//   wind     대상 자리에서 도는 회오리          rune    대상 발밑에 펼쳐지는 진
//   chain    대상들을 잇는 사슬                 order   지휘 장수가 찍는 표적 표시
//   heal     아군에게 오르는 초록 빛            aura    아군을 감싸는 금색 고리
// 근접 전법
//   slash    대상 앞의 초승달 베기              cross   X자 두 번 베기
//   pierce   대상을 뚫고 지나가는 찌르기        dash    돌진 궤적
//   shock    땅을 치는 충격파                   spin    자신 둘레를 도는 회전 베기
//   roar     자신에게서 퍼지는 함성 고리        shield  몸을 덮는 보호막
//   fury     몸에서 오르는 기세                 flurry  잔 베기 여러 번
//   blink    사라졌다 나타나는 연기             bind    대상을 조이는 밧줄
//   drain    대상에서 자신에게 오는 붉은 빛      stun    대상 머리 위의 별
//
// 근접 평타 (짧고 굵게, 0.2초 안쪽): 본 동작 이름으로 종류가 정해진다 (아래 melee 함수)
//   jab      짧은 찌르기 줄                     cut     짧은 초승달 베기
//   chop     위에서 아래로 긋는 베기            rise    아래에서 위로 긋는 베기
//   thud     방패로 치는 둔탁한 고리            whip    휘어 들어가는 채찍 줄
//   spark    맞는 자리의 작은 섬광 (모든 근접 평타에 붙는다)
// 전법 공통 (모든 장수, 모든 병종): 전법을 쓰는 순간 자신에게 cast(빛기둥과 발밑 고리), 맞는 대상마다 burst(섬광과 불꽃).
// 전법 이펙트는 평타보다 크고 오래 가며 빛 번짐이 붙는다.
//
// 칸: attack(원거리 평타), skill(대상에게), self(전법을 쓴 자신에게), support(지원 전법을 받은 아군마다)
(function () {
  const HERO = {
    // 책사: 평타와 전법이 장수마다 다르다
    제갈량: { attack: { kind: 'wind', col: '#9fe6d0', size: 0.6 }, skill: [{ kind: 'rune', col: '#9fe6d0' }, { kind: 'wind', col: '#c8fff0', size: 1.2 }] },
    사마의: { attack: { kind: 'orb', col: '#a98bff' }, skill: [{ kind: 'bolt', col: '#c9b4ff', size: 1.3 }] },
    곽가: { attack: { kind: 'ice', col: '#a8e4ff', size: 0.6 }, skill: [{ kind: 'ice', col: '#d6f3ff', size: 1.3 }] },
    방통: { attack: { kind: 'rock', col: '#a08a6c', size: 0.7 }, skill: [{ kind: 'chain', col: '#c8ccd4' }, { kind: 'rock', col: '#a08a6c', size: 1.2 }] },
    육손: { attack: { kind: 'orb', col: '#ff9a4a' }, skill: [{ kind: 'fire', col: '#ff8a3a', size: 1.3 }] },
    장각: { attack: { kind: 'missile', col: '#ffe36a' }, skill: [{ kind: 'bolt', col: '#ffe36a', size: 1.3 }] },
    초선: { attack: { kind: 'petal', col: '#ffa8cf' }, self: [{ kind: 'rune', col: '#ffa8cf' }, { kind: 'roar', col: '#ffa8cf', size: 0.8 }], support: [{ kind: 'aura', col: '#ffa8cf' }, { kind: 'shield', col: '#ffd0e6' }] },
    화타: { attack: { kind: 'needle', col: '#f2f6ff' }, self: [{ kind: 'rune', col: '#8ee6a8' }, { kind: 'roar', col: '#8ee6a8', size: 0.9 }], support: [{ kind: 'heal', col: '#8ee6a8' }, { kind: 'aura', col: '#d8ffe0' }] },
    순욱: { attack: { kind: 'missile', col: '#8fc4ff' }, self: [{ kind: 'rune', col: '#8fc4ff' }, { kind: 'roar', col: '#8fc4ff', size: 0.9 }], support: [{ kind: 'aura', col: '#8fc4ff' }, { kind: 'heal', col: '#bfe0ff' }] },
    노숙: { attack: { kind: 'orb', col: '#7fd6c0' }, self: [{ kind: 'rune', col: '#7fd6c0' }, { kind: 'wind', col: '#7fd6c0', size: 0.8 }], support: [{ kind: 'heal', col: '#7fd6c0' }, { kind: 'aura', col: '#c8fff0' }] },
    군영참모: { attack: { kind: 'missile', col: '#b9a2ff' }, self: [{ kind: 'rune', col: '#8ee6a8' }], support: [{ kind: 'heal', col: '#8ee6a8' }, { kind: 'aura', col: '#8ee6a8' }] },
    // 근접 장수의 전법
    관우: { skill: [{ kind: 'slash', col: '#5fd08a', size: 1.7 }, { kind: 'shock', col: '#5fd08a', size: 0.8 }] },
    장비: { self: [{ kind: 'roar', col: '#ff7a4a', size: 1.3 }, { kind: 'shield', col: '#ffb07a' }] },
    조운: { skill: [{ kind: 'pierce', col: '#bfe3ff', size: 1.3 }] },
    유비: { self: [{ kind: 'roar', col: '#ffe08a', size: 0.7 }], support: [{ kind: 'heal', col: '#b6f0a0' }, { kind: 'shield', col: '#ffe08a' }] },
    하후돈: { self: [{ kind: 'shield', col: '#d05a5a' }, { kind: 'shock', col: '#d05a5a', size: 1.2 }] },
    장료: { skill: [{ kind: 'dash', col: '#8fb8ff' }, { kind: 'slash', col: '#8fb8ff', size: 1.2 }] },
    주유: { skill: [{ kind: 'fire', col: '#ff5a3a', size: 1.3 }] },
    여포: { self: [{ kind: 'spin', col: '#e0414f', size: 1.5 }, { kind: 'fury', col: '#e0414f' }], skill: [{ kind: 'shock', col: '#e0414f', size: 1.2 }] },
    의용보병: { self: [{ kind: 'shield', col: '#c9d6e6' }, { kind: 'shock', col: '#c9d6e6' }, { kind: 'roar', col: '#c9d6e6', size: 0.7 }] },
    전위: { self: [{ kind: 'roar', col: '#c86a3a', size: 1.2 }, { kind: 'fury', col: '#ff8a4a' }] },
    허저: { self: [{ kind: 'shield', col: '#ffb24a' }, { kind: 'fury', col: '#ffb24a' }] },
    서황: { skill: [{ kind: 'slash', col: '#e6d2a0', size: 1.4 }, { kind: 'shock', col: '#e6d2a0', size: 1.1 }, { kind: 'stun', col: '#ffe36a' }] },
    악진: { skill: [{ kind: 'slash', col: '#e8ecf4', size: 1.1 }] },
    조홍: { self: [{ kind: 'shield', col: '#9fb8d8' }, { kind: 'shock', col: '#9fb8d8' }, { kind: 'fury', col: '#9fb8d8' }] },
    마초: { skill: [{ kind: 'dash', col: '#f2f2f2', size: 1.4 }, { kind: 'shock', col: '#f2f2f2', size: 1.1 }, { kind: 'stun', col: '#ffe36a' }] },
    강유: { skill: [{ kind: 'pierce', col: '#9fe6d0', size: 1.1 }, { kind: 'bind', col: '#a98bff', size: 0.7 }] },
    위연: { skill: [{ kind: 'cross', col: '#ff5a5a', size: 1.2 }, { kind: 'drain', col: '#ff5a5a' }] },
    요화: { skill: [{ kind: 'slash', col: '#d8e0ea', size: 1.0 }], self: [{ kind: 'shield', col: '#b8c6d8', size: 0.8 }] },
    주창: { self: [{ kind: 'roar', col: '#c9d6e6', size: 0.8 }, { kind: 'fury', col: '#c9d6e6' }], support: [{ kind: 'shield', col: '#c9d6e6' }, { kind: 'aura', col: '#ffffff' }] },
    손책: { self: [{ kind: 'fury', col: '#ffc44a', size: 1.3 }, { kind: 'roar', col: '#ff8a4a', size: 0.8 }] },
    감녕: { skill: [{ kind: 'blink', col: '#7fd6c0' }, { kind: 'cross', col: '#7fd6c0', size: 1.1 }] },
    여몽: { skill: [{ kind: 'blink', col: '#f4f4f4' }, { kind: 'pierce', col: '#f4f4f4', size: 1.1 }] },
    황개: { self: [{ kind: 'fire', col: '#ff7a3a', size: 1.5 }, { kind: 'fury', col: '#ff7a3a' }] },
    정봉: { skill: [{ kind: 'slash', col: '#d6f3ff', size: 1.2 }, { kind: 'ice', col: '#d6f3ff', size: 0.6 }] },
    반장: { skill: [{ kind: 'bind', col: '#b08a5a' }] },
    동탁: { self: [{ kind: 'spin', col: '#8a5ac8', size: 1.4 }], skill: [{ kind: 'drain', col: '#c85a8a' }] },
    안량: { skill: [{ kind: 'pierce', col: '#ffd76a', size: 1.6 }] },
    문추: { skill: [{ kind: 'flurry', col: '#ffb07a' }, { kind: 'pierce', col: '#ffb07a', size: 1.0 }] },
    화웅: { skill: [{ kind: 'slash', col: '#ff8a4a', size: 1.4 }], self: [{ kind: 'fury', col: '#ff8a4a' }] },
    공손찬: { skill: [{ kind: 'blink', col: '#ffffff' }, { kind: 'pierce', col: '#e8f0ff', size: 1.2 }] },
    조조: { self: [{ kind: 'roar', col: '#c86ad8', size: 1.0 }], support: { kind: 'aura', col: '#e0a0ff' } },
    손권: { self: [{ kind: 'roar', col: '#6ad0c8', size: 1.0 }], support: { kind: 'shield', col: '#8fe6dc' } },
    원소: { self: [{ kind: 'roar', col: '#f0dba4', size: 1.0 }], support: { kind: 'aura', col: '#f0dba4' } },
    // 궁수: 평타는 화살 한 발, 전법은 장수마다 다르다
    황충: { skill: [{ kind: 'arrow', col: '#ffd76a', big: true }] },
    의용궁병: { skill: [{ kind: 'arrow', col: '#f4dea0', n: 3 }] },
    하후연: { skill: [{ kind: 'arrow', col: '#f4dea0', fast: true }] },
    태사자: { skill: [{ kind: 'arrow', col: '#f4dea0', n: 3, spread: 0 }] },
    손상향: { skill: [{ kind: 'arrow', col: '#ffb7a0', n: 6, rain: true }] },
  };
  const MELEE = { skill: [{ kind: 'slash', col: '#e8ecf4' }], support: { kind: 'aura', col: '#f0dba4' } };      // 표에 없는 근접 장수
  const FAMILY = {
    caster: { attack: { kind: 'missile', col: '#b9a2ff' }, skill: [{ kind: 'missile', col: '#b9a2ff' }], support: { kind: 'heal', col: '#8ee6a8' } },
    bow: { attack: { kind: 'arrow', col: '#f4dea0' }, skill: [{ kind: 'arrow', col: '#f4dea0' }] },
    command: { attack: { kind: 'order', col: '#ff6b5e' }, support: { kind: 'aura', col: '#f0dba4' } },
  };
  const DUR = { missile: 160, orb: 300, petal: 340, needle: 110, arrow: 210, bolt: 340, rock: 430, ice: 380, fire: 560, wind: 560, rune: 650, chain: 650, order: 300, heal: 650, aura: 650,
                jab: 270, cut: 290, chop: 290, rise: 290, thud: 300, whip: 320, spark: 170, cast: 620, burst: 420, slash: 280, cross: 320, pierce: 260, dash: 240, shock: 500, spin: 440, roar: 620, shield: 850, fury: 720, flurry: 440, blink: 340, bind: 680, drain: 540, stun: 850 };
  const rnd = (seed, i) => { const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453; return x - Math.floor(x); };

  // what(hero, 'attack' | 'skill' | 'support') -> a list of effect descriptions, possibly empty
  function what(h, slot) {
    const own = HERO[h.name] || {}, fam = FAMILY[h.family] || (HERO[h.name] ? {} : MELEE), got = own[slot] !== undefined ? own[slot] : fam[slot];
    return !got ? [] : Array.isArray(got) ? got : [got];
  }
  // 근접 평타: the bone clip's title says what the blow is, and the blow picks the mark it leaves
  function melee(h, title) {
    const t = title || '', col = colour(h), heavy = h.family === 'heavy' || h.family === 'poleaxe';
    const kind = /방패 치기/.test(t) ? 'thud' : /찌르|직창/.test(t) ? 'jab' : /교차/.test(t) ? 'cross' : /올려/.test(t) ? 'rise' : /내리꽂|내려|찍/.test(t) ? 'chop' : /후리|당기/.test(t) ? 'whip' : 'cut';
    const out = [{ kind, col, size: heavy ? 1.2 : 1, quick: true }, { kind: 'spark', col }];
    if (kind === 'chop' && heavy) out.push({ kind: 'shock', col, size: 0.6, quick: true });
    return out;
  }
  // the hero's own colour: the first colour its skill uses
  function colour(h) { for (const slot of ['skill', 'self', 'support', 'attack']) { const got = what(h, slot); if (got.length) return got[0].col; } return '#f0dba4'; }
  // make(spec, from, to, all): one live effect. Positions are board coordinates, copied so a fallen target does not move it.
  function make(spec, a, b, all, skill) {
    if (skill) spec = { ...spec, size: (spec.size || 1) * 1.25, skill: true };
    const dur = (skill ? 1.25 : 1) * (spec.quick ? 0.6 : 1) * (DUR[spec.kind] || 300) * (spec.fast ? 0.6 : 1) + (spec.kind === 'arrow' && spec.n > 1 && spec.spread === 0 ? 180 : 0);
    return { ...spec, ax: a.px, ay: a.py, bx: b.px, by: b.py, t: 0, dur, seed: Math.random() * 1000, links: (all || []).map(o => [o.px, o.py]) };
  }

  const KINDS = {
    missile(g, e, k, P) { const x = P.ax + (P.bx - P.ax) * k, y = P.ay + (P.by - P.ay) * k, j = Math.max(0, k - 0.3);
      g.strokeStyle = e.col; g.lineWidth = 3; g.beginPath(); g.moveTo(P.ax + (P.bx - P.ax) * j, P.ay + (P.by - P.ay) * j); g.lineTo(x, y); g.stroke(); },
    needle(g, e, k, P) { const j = Math.max(0, k - 0.5); g.strokeStyle = e.col; g.lineWidth = 1.5; g.beginPath();
      g.moveTo(P.ax + (P.bx - P.ax) * j, P.ay + (P.by - P.ay) * j); g.lineTo(P.ax + (P.bx - P.ax) * k, P.ay + (P.by - P.ay) * k); g.stroke(); },
    orb(g, e, k, P) { const f = Math.min(1, k / 0.8), x = P.ax + (P.bx - P.ax) * f, y = P.ay + (P.by - P.ay) * f;
      if (k < 0.8) { for (let i = 3; i >= 0; i--) { const q = Math.max(0, f - i * 0.06); g.globalAlpha = 0.9 - i * 0.2; g.fillStyle = e.col; g.beginPath();
          g.arc(P.ax + (P.bx - P.ax) * q, P.ay + (P.by - P.ay) * q, 8 - i * 1.6, 0, 7); g.fill(); } g.globalAlpha = 1; g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
      else { const r = (k - 0.8) / 0.2; g.globalAlpha = 1 - r; g.strokeStyle = e.col; g.lineWidth = 3; g.beginPath(); g.arc(P.bx, P.by, 8 + r * 20, 0, 7); g.stroke(); } },
    petal(g, e, k, P) { for (let i = 0; i < 4; i++) { const q = Math.max(0, Math.min(1, k * 1.2 - i * 0.07)), nx = -(P.by - P.ay), ny = P.bx - P.ax, n = Math.hypot(nx, ny) || 1, w = Math.sin(q * 9 + i * 2) * 9;
        g.fillStyle = i % 2 ? '#fff' : e.col; g.globalAlpha = q >= 1 ? 0 : 0.95; g.beginPath(); g.ellipse(P.ax + (P.bx - P.ax) * q + nx / n * w, P.ay + (P.by - P.ay) * q + ny / n * w, 5, 2.5, q * 8 + i, 0, 7); g.fill(); } },
    arrow(g, e, k, P) { const n = e.n || 1, total = e.dur;
      for (let i = 0; i < n; i++) { const delay = e.spread === 0 ? i * 90 : e.rain ? rnd(e.seed, i) * 120 : 0, q = (e.t - delay) / (total - (e.spread === 0 ? 180 : e.rain ? 120 : 0)); if (q < 0 || q > 1) continue;
        const off = e.spread === 0 || n === 1 ? 0 : (i - (n - 1) / 2) * 12, sx = e.rain ? P.bx + (rnd(e.seed, i + 9) - 0.5) * 70 - 40 : P.ax, sy = e.rain ? P.by - 330 : P.ay, tx = e.rain ? sx + 40 : P.bx, ty = P.by;
        const nx = -(ty - sy), ny = tx - sx, m = Math.hypot(nx, ny) || 1, arc = e.rain ? 0 : Math.sin(Math.PI * q) * 16, x = sx + (tx - sx) * q + nx / m * off, y = sy + (ty - sy) * q + ny / m * off - arc;
        const ang = Math.atan2(ty - sy - Math.cos(Math.PI * q) * (e.rain ? 0 : 50), tx - sx), z = e.size || 1, L = (e.big ? 34 : 24) * z;
        g.strokeStyle = e.col; g.lineWidth = (e.big ? 4 : 2) * z; g.beginPath(); g.moveTo(x - Math.cos(ang) * L, y - Math.sin(ang) * L); g.lineTo(x, y); g.stroke();
        g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x + Math.cos(ang) * 5, y + Math.sin(ang) * 5); g.lineTo(x + Math.cos(ang + 2.5) * 6, y + Math.sin(ang + 2.5) * 6); g.lineTo(x + Math.cos(ang - 2.5) * 6, y + Math.sin(ang - 2.5) * 6); g.fill(); } },
    bolt(g, e, k, P) { const s = e.size || 1, flick = Math.floor(e.t / 60), top = P.gy - 380; g.globalAlpha = k < 0.7 ? 1 : (1 - k) / 0.3;
      for (const [w, c] of [[7 * s, e.col], [2.5 * s, '#fff']]) { g.strokeStyle = c; g.lineWidth = w; g.lineJoin = 'miter'; g.beginPath(); g.moveTo(P.bx + (rnd(e.seed, flick) - 0.5) * 60, top);
        for (let i = 1; i < 7; i++) g.lineTo(P.bx + (rnd(e.seed + flick, i) - 0.5) * 44 * s * (1 - i / 7), top + (P.gy - top) * i / 7); g.lineTo(P.bx, P.gy); g.stroke(); }
      g.fillStyle = e.col; g.globalAlpha *= 0.5; g.beginPath(); g.ellipse(P.bx, P.gy, 30 * s, 10 * s, 0, 0, 7); g.fill(); },
    rock(g, e, k, P) { const s = e.size || 1, f = Math.min(1, k / 0.6), y = P.gy - 300 * (1 - f * f) - 18 * s;
      if (k < 0.6) { g.fillStyle = e.col; g.strokeStyle = '#3b3126'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283 + e.seed, r = (13 + rnd(e.seed, i) * 7) * s; g[i ? 'lineTo' : 'moveTo'](P.bx + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke(); }
      else { const r = (k - 0.6) / 0.4; g.globalAlpha = 1 - r; g.fillStyle = e.col; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + e.seed; g.beginPath(); g.arc(P.bx + Math.cos(a) * r * 38 * s, P.gy - 6 - Math.abs(Math.sin(a)) * r * 26 * s + r * r * 20, 5 * s * (1 - r) + 1, 0, 7); g.fill(); }
        g.strokeStyle = '#d8cdb8'; g.lineWidth = 2; g.beginPath(); g.ellipse(P.bx, P.gy, 16 + r * 30 * s, 5 + r * 9 * s, 0, 0, 7); g.stroke(); } },
    ice(g, e, k, P) { const s = e.size || 1, n = s > 1 ? 5 : 2;
      for (let i = 0; i < n; i++) { const q = Math.min(1, Math.max(0, k * 1.5 - i * 0.1)), ox = (rnd(e.seed, i) - 0.5) * 50 * s, x = P.bx + ox - 90 * (1 - q), y = P.gy - 260 * (1 - q) - 10;
        if (q < 1) { g.fillStyle = e.col; g.strokeStyle = '#fff'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y + 12 * s); g.lineTo(x - 5 * s, y - 2); g.lineTo(x - 14 * s, y - 22 * s); g.lineTo(x + 2, y - 6 * s); g.closePath(); g.fill(); g.stroke(); }
        else { g.globalAlpha = Math.max(0, 1 - (k * 1.5 - i * 0.1 - 1) * 3); g.strokeStyle = e.col; g.lineWidth = 2; for (let j = 0; j < 4; j++) { const a = j * 1.57 + i; g.beginPath(); g.moveTo(P.bx + ox, P.gy - 10); g.lineTo(P.bx + ox + Math.cos(a) * 14, P.gy - 10 + Math.sin(a) * 9); g.stroke(); } g.globalAlpha = 1; } } },
    fire(g, e, k, P) { const s = e.size || 1, grow = Math.min(1, k / 0.25) * (k < 0.75 ? 1 : (1 - k) / 0.25);
      for (let i = 0; i < 5; i++) { const ox = (i - 2) * 11 * s, h = (46 + rnd(e.seed + Math.floor(e.t / 70), i) * 40) * s * grow * (1 - Math.abs(i - 2) * 0.22);
        for (const [w, c] of [[10 * s, e.col], [5 * s, '#ffe08a']]) { g.fillStyle = c; g.beginPath(); g.moveTo(P.bx + ox - w, P.gy); g.quadraticCurveTo(P.bx + ox - w, P.gy - h * 0.5, P.bx + ox + Math.sin(e.t / 60 + i) * 5, P.gy - h * (c === e.col ? 1 : 0.6));
          g.quadraticCurveTo(P.bx + ox + w, P.gy - h * 0.5, P.bx + ox + w, P.gy); g.fill(); } }
      g.globalAlpha = 0.45 * grow; g.fillStyle = e.col; g.beginPath(); g.ellipse(P.bx, P.gy, 40 * s, 11 * s, 0, 0, 7); g.fill(); },
    wind(g, e, k, P) { const s = e.size || 1; g.globalAlpha = k < 0.2 ? k / 0.2 : k > 0.75 ? (1 - k) / 0.25 : 1; g.strokeStyle = e.col; g.lineWidth = 2.5; g.lineCap = 'round';
      for (let i = 0; i < 6; i++) { const y = P.gy - 6 - i * 16 * s, r = (10 + i * 6) * s, a = e.t / 55 + i * 1.1; g.beginPath(); g.ellipse(P.bx + Math.sin(e.t / 120 + i) * 4, y, r, r * 0.3, 0, a, a + 4.2); g.stroke(); } },
    rune(g, e, k, P) { const r = 46 * Math.min(1, k / 0.3); g.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1; g.strokeStyle = e.col; g.lineWidth = 2;
      for (const m of [1, 0.6]) { g.beginPath(); for (let i = 0; i <= 8; i++) { const a = i / 8 * 6.283 + e.t / 500 * (m === 1 ? 1 : -1); g[i ? 'lineTo' : 'moveTo'](P.bx + Math.cos(a) * r * m, P.gy + Math.sin(a) * r * m * 0.32); } g.stroke(); } },
    chain(g, e, k, P, at) { g.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1; g.strokeStyle = e.col; g.lineWidth = 3; g.setLineDash([7, 5]); g.lineDashOffset = -e.t / 20; g.beginPath();
      e.links.forEach(([x, y], i) => { const p = at(x, y); g[i ? 'lineTo' : 'moveTo'](p[0], p[1] - 34); }); g.stroke(); g.setLineDash([]); },
    order(g, e, k, P) { const r = 26 - 10 * Math.min(1, k / 0.4); g.globalAlpha = k > 0.6 ? (1 - k) / 0.4 : 1; g.strokeStyle = e.col; g.lineWidth = 3; g.beginPath(); g.arc(P.bx, P.by, r, 0, 7); g.stroke();
      for (let i = 0; i < 4; i++) { const a = i * 1.5708; g.beginPath(); g.moveTo(P.bx + Math.cos(a) * (r - 6), P.by + Math.sin(a) * (r - 6)); g.lineTo(P.bx + Math.cos(a) * (r + 8), P.by + Math.sin(a) * (r + 8)); g.stroke(); } },
    heal(g, e, k, P) { g.fillStyle = e.col; for (let i = 0; i < 6; i++) { const q = (k + i / 6) % 1, x = P.bx + (rnd(e.seed, i) - 0.5) * 46, y = P.gy - q * 90; g.globalAlpha = (1 - q) * (k > 0.8 ? (1 - k) / 0.2 : 1); g.fillRect(x - 1.5, y - 5, 3, 10); g.fillRect(x - 5, y - 1.5, 10, 3); } },
    aura(g, e, k, P) { g.globalAlpha = 1 - k; g.strokeStyle = e.col; g.lineWidth = 3; for (const d of [0, 0.25]) { const q = Math.max(0, k - d); g.beginPath(); g.ellipse(P.bx, P.gy - q * 40, 30 + q * 14, 9 + q * 4, 0, 0, 7); g.stroke(); } },
    slash(g, e, k, P) { const s = e.size || 1, ang = Math.atan2(P.by - P.ay, P.bx - P.ax) || 0, R = 36 * s, ox = P.bx - Math.cos(ang) * R * 0.55, oy = P.by - Math.sin(ang) * R * 0.55, f = Math.min(1, k / 0.45);
      g.globalAlpha = k < 0.55 ? 1 : (1 - k) / 0.45; for (const [w, c] of [[9 * s, e.col], [3 * s, '#fff']]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.arc(ox, oy, R, ang - 1.25, ang - 1.25 + 2.5 * f); g.stroke(); } },
    cross(g, e, k, P) { const s = e.size || 1, L = 30 * s; g.globalAlpha = k < 0.6 ? 1 : (1 - k) / 0.4;
      [[-1, -1, 1, 1, 0], [1, -1, -1, 1, 0.3]].forEach(([x0, y0, x1, y1, d]) => { const f = Math.max(0, Math.min(1, (k - d) / 0.3)); if (!f) return;
        for (const [w, c] of [[7 * s, e.col], [2.5 * s, '#fff']]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(P.bx + x0 * L, P.by + y0 * L); g.lineTo(P.bx + (x0 + (x1 - x0) * f) * L, P.by + (y0 + (y1 - y0) * f) * L); g.stroke(); } }); },
    pierce(g, e, k, P) { const s = e.size || 1, dx = P.bx - P.ax, dy = P.by - P.ay, m = Math.hypot(dx, dy) || 1, ex = P.bx + dx / m * 60 * s, ey = P.by + dy / m * 60 * s, f = Math.min(1, k / 0.5), j = Math.max(0, f - 0.55);
      g.globalAlpha = k < 0.5 ? 1 : (1 - k) / 0.5; for (const [w, c] of [[8 * s, e.col], [2.5 * s, '#fff']]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(P.ax + (ex - P.ax) * j, P.ay + (ey - P.ay) * j); g.lineTo(P.ax + (ex - P.ax) * f, P.ay + (ey - P.ay) * f); g.stroke(); } },
    dash(g, e, k, P) { const s = e.size || 1, dx = P.bx - P.ax, dy = P.by - P.ay, m = Math.hypot(dx, dy) || 1, nx = -dy / m, ny = dx / m; g.strokeStyle = e.col; g.lineWidth = 2.5;
      for (let i = -2; i <= 2; i++) { const f = Math.min(1, k * 1.6 - Math.abs(i) * 0.08); if (f <= 0) continue; g.globalAlpha = (1 - k) * (1 - Math.abs(i) * 0.25); g.beginPath();
        g.moveTo(P.ax + nx * i * 7 * s + dx * Math.max(0, f - 0.5), P.ay + 30 + ny * i * 7 * s + dy * Math.max(0, f - 0.5)); g.lineTo(P.ax + nx * i * 7 * s + dx * f, P.ay + 30 + ny * i * 7 * s + dy * f); g.stroke(); } },
    shock(g, e, k, P) { const s = e.size || 1; g.globalAlpha = 1 - k; g.strokeStyle = e.col; g.lineWidth = 4 * (1 - k) + 1;
      for (const d of [0, 0.2]) { const q = Math.max(0, k - d); g.beginPath(); g.ellipse(P.bx, P.gy, 12 + q * 62 * s, 4 + q * 20 * s, 0, 0, 7); g.stroke(); }
      g.lineWidth = 2; for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283 + e.seed, r = Math.min(1, k * 2.5) * (30 + rnd(e.seed, i) * 26) * s; g.beginPath(); g.moveTo(P.bx, P.gy); g.lineTo(P.bx + Math.cos(a) * r, P.gy + Math.sin(a) * r * 0.32); g.stroke(); } },
    spin(g, e, k, P) { const s = e.size || 1, a = k * 9; g.globalAlpha = k < 0.6 ? 1 : (1 - k) / 0.4;
      for (const [w, c, r] of [[9, e.col, 54 * s], [3, '#fff', 54 * s], [4, e.col, 38 * s]]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.ellipse(P.bx, P.gy - 34, r, r * 0.36, 0, a, a + 3.6); g.stroke(); } },
    roar(g, e, k, P) { const s = e.size || 1; g.strokeStyle = e.col; for (let i = 0; i < 3; i++) { const q = k - i * 0.18; if (q <= 0) continue; g.globalAlpha = Math.max(0, 1 - q * 1.3); g.lineWidth = 5 * (1 - q) + 1; g.beginPath(); g.ellipse(P.bx, P.gy - 20, 20 + q * 150 * s, 7 + q * 52 * s, 0, 0, 7); g.stroke(); } },
    shield(g, e, k, P) { const s = e.size || 1, a = k < 0.15 ? k / 0.15 : k > 0.8 ? (1 - k) / 0.2 : 1; g.globalAlpha = 0.16 * a; g.fillStyle = e.col; g.beginPath(); g.ellipse(P.bx, P.gy - 46, 36 * s, 56 * s, 0, 0, 7); g.fill();
      g.globalAlpha = 0.9 * a; g.strokeStyle = e.col; g.lineWidth = 2.5; g.beginPath(); g.ellipse(P.bx, P.gy - 46, 36 * s, 56 * s, 0, 0, 7); g.stroke();
      g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.ellipse(P.bx, P.gy - 46, 36 * s, 56 * s, 0, 3.6 + k * 3, 4.5 + k * 3); g.stroke(); },
    fury(g, e, k, P) { const s = e.size || 1; g.strokeStyle = e.col; g.lineWidth = 3; for (let i = 0; i < 9; i++) { const q = (k * 1.6 + rnd(e.seed, i)) % 1, x = P.bx + (rnd(e.seed, i + 20) - 0.5) * 64 * s, y = P.gy - q * 110 * s;
        g.globalAlpha = (1 - q) * (k > 0.8 ? (1 - k) / 0.2 : 1); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(q * 8 + i) * 3, y - 16 * s); g.stroke(); } },
    flurry(g, e, k, P) { for (let i = 0; i < 5; i++) { const q = (k - i * 0.15) / 0.3; if (q <= 0 || q >= 1) continue; const a = rnd(e.seed, i) * 3.14, x = P.bx + (rnd(e.seed, i + 5) - 0.5) * 36, y = P.by + (rnd(e.seed, i + 11) - 0.5) * 44, L = 20;
        g.globalAlpha = 1 - q; for (const [w, c] of [[5, e.col], [2, '#fff']]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x - Math.cos(a) * L, y - Math.sin(a) * L); g.lineTo(x - Math.cos(a) * L + Math.cos(a) * 2 * L * Math.min(1, q * 2), y - Math.sin(a) * L + Math.sin(a) * 2 * L * Math.min(1, q * 2)); g.stroke(); } } },
    blink(g, e, k, P) { g.fillStyle = e.col; for (const [x, y, grow] of [[P.ax, P.ay + 20, false], [P.bx, P.by, true]]) for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + e.seed, q = grow ? k : 1 - k, r = 6 + q * 26;
        g.globalAlpha = (grow ? 1 - k : k) * 0.7; g.beginPath(); g.arc(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6, 7 * (grow ? 1 - k * 0.5 : k + 0.3), 0, 7); g.fill(); } },
    bind(g, e, k, P) { const s = e.size || 1, tight = 1 - 0.35 * Math.min(1, k / 0.3); g.globalAlpha = k > 0.75 ? (1 - k) / 0.25 : 1; g.strokeStyle = e.col; g.lineWidth = 3.5;
      for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(P.bx, P.gy - 22 - i * 22, 30 * s * tight, 8 * s, (i - 1) * 0.18, 0, 7); g.stroke(); } },
    drain(g, e, k, P) { g.fillStyle = e.col; for (let i = 0; i < 7; i++) { const q = k * 1.4 - i * 0.06; if (q <= 0 || q >= 1) continue; const w = Math.sin(q * 3.14) * (rnd(e.seed, i) - 0.5) * 50;
        g.globalAlpha = 0.9; g.beginPath(); g.arc(P.bx + (P.ax - P.bx) * q, P.by + (P.ay + 14 - P.by) * q + w, 4, 0, 7); g.fill(); } },
    stun(g, e, k, P) { g.globalAlpha = k > 0.8 ? (1 - k) / 0.2 : 1; g.fillStyle = e.col; for (let i = 0; i < 3; i++) { const a = e.t / 130 + i * 2.094, x = P.bx + Math.cos(a) * 20, y = P.gy - 112 + Math.sin(a) * 6;
        g.beginPath(); for (let j = 0; j < 10; j++) { const r = j % 2 ? 2.5 : 6, b = j / 10 * 6.283 - 1.57; g[j ? 'lineTo' : 'moveTo'](x + Math.cos(b) * r, y + Math.sin(b) * r); } g.fill(); } },
    jab(g, e, k, P) { KINDS.pierce(g, { ...e, size: (e.size || 1) * 0.55 }, k, P); },
    cut(g, e, k, P) { KINDS.slash(g, { ...e, size: (e.size || 1) * 0.85 }, k, P); },
    chop(g, e, k, P) { const s = e.size || 1, f = Math.min(1, k / 0.45), x0 = P.bx - 14 * s, y0 = P.by - 56 * s, x1 = P.bx + 8 * s, y1 = P.by + 26 * s; g.globalAlpha = k < 0.5 ? 1 : (1 - k) / 0.5;
      for (const [w, c] of [[9 * s, e.col], [3.5 * s, '#fff']]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 - 12 * s, (y0 + y1) / 2, x0 + (x1 - x0) * f, y0 + (y1 - y0) * f); g.stroke(); } },
    rise(g, e, k, P) { const s = e.size || 1, f = Math.min(1, k / 0.45), x0 = P.bx - 12 * s, y0 = P.by + 28 * s, x1 = P.bx + 10 * s, y1 = P.by - 54 * s; g.globalAlpha = k < 0.5 ? 1 : (1 - k) / 0.5;
      for (const [w, c] of [[9 * s, e.col], [3.5 * s, '#fff']]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + 26 * s, (y0 + y1) / 2, x0 + (x1 - x0) * f, y0 + (y1 - y0) * f); g.stroke(); } },
    thud(g, e, k, P) { const s = e.size || 1; g.globalAlpha = 1 - k; g.strokeStyle = e.col; g.lineWidth = 7 * (1 - k) + 1; g.beginPath(); g.arc(P.bx, P.by, (10 + k * 22) * s, 0, 7); g.stroke();
      g.strokeStyle = '#fff'; g.lineWidth = 3; for (let i = 0; i < 4; i++) { const a = i * 1.5708 + 0.785; g.beginPath(); g.moveTo(P.bx + Math.cos(a) * 14 * s, P.by + Math.sin(a) * 14 * s); g.lineTo(P.bx + Math.cos(a) * (22 + k * 16) * s, P.by + Math.sin(a) * (22 + k * 16) * s); g.stroke(); } },
    whip(g, e, k, P) { const dx = P.bx - P.ax, dy = P.by - P.ay, m = Math.hypot(dx, dy) || 1, bend = 46 * (1 - Math.min(1, k / 0.5)), mx = (P.ax + P.bx) / 2 - dy / m * bend, my = (P.ay + P.by) / 2 + dx / m * bend - 20;
      g.globalAlpha = k < 0.5 ? 1 : (1 - k) / 0.5; for (const [w, c] of [[5, e.col], [1.5, '#fff']]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(P.ax, P.ay + 10); g.quadraticCurveTo(mx, my, P.bx, P.by); g.stroke(); } },
    spark(g, e, k, P) { g.globalAlpha = 1 - k; g.fillStyle = '#fff'; g.beginPath(); g.arc(P.bx, P.by, 10 * (1 - k) + 2, 0, 7); g.fill(); g.strokeStyle = e.col; g.lineWidth = 2.5;
      for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + e.seed, r0 = 8 + k * 14, r1 = r0 + 12 * (1 - k); g.beginPath(); g.moveTo(P.bx + Math.cos(a) * r0, P.by + Math.sin(a) * r0); g.lineTo(P.bx + Math.cos(a) * r1, P.by + Math.sin(a) * r1); g.stroke(); } },
    cast(g, e, k, P) { const a = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85, w = 30 + 26 * Math.min(1, k / 0.2), grad = g.createLinearGradient(0, P.gy, 0, P.gy - 240);
      grad.addColorStop(0, e.col); grad.addColorStop(1, 'rgba(255,255,255,0)'); g.globalAlpha = 0.55 * a; g.fillStyle = grad; g.fillRect(P.bx - w / 2, P.gy - 240, w, 240);
      g.globalAlpha = 0.5 * a; g.fillStyle = '#fff'; g.fillRect(P.bx - w / 6, P.gy - 240, w / 3, 240);
      g.strokeStyle = e.col; for (const d of [0, 0.15, 0.3]) { const q = k - d; if (q <= 0) continue; g.globalAlpha = Math.max(0, 1 - q * 1.4); g.lineWidth = 4; g.beginPath(); g.ellipse(P.bx, P.gy, 16 + q * 90, 6 + q * 30, 0, 0, 7); g.stroke(); }
      g.fillStyle = '#fff'; for (let i = 0; i < 14; i++) { const q = (k * 1.3 + rnd(e.seed, i)) % 1, x = P.bx + (rnd(e.seed, i + 30) - 0.5) * 80; g.globalAlpha = (1 - q) * a; g.beginPath(); g.arc(x, P.gy - q * 170, 2.2, 0, 7); g.fill(); } },
    burst(g, e, k, P) { const s = e.size || 1; g.globalAlpha = Math.max(0, 1 - k * 2.2); g.fillStyle = '#fff'; g.beginPath(); g.arc(P.bx, P.by, 26 * s * (0.5 + k), 0, 7); g.fill();
      g.globalAlpha = 1 - k; g.strokeStyle = e.col; g.lineWidth = 3; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 + e.seed, r0 = (10 + k * 40) * s, r1 = r0 + (14 + rnd(e.seed, i) * 22) * s * (1 - k);
        g.beginPath(); g.moveTo(P.bx + Math.cos(a) * r0, P.by + Math.sin(a) * r0 * 0.8); g.lineTo(P.bx + Math.cos(a) * r1, P.by + Math.sin(a) * r1 * 0.8); g.stroke(); }
      g.fillStyle = e.col; for (let i = 0; i < 10; i++) { const a = rnd(e.seed, i + 40) * 6.283, d = k * (40 + rnd(e.seed, i + 50) * 50) * s; g.beginPath(); g.arc(P.bx + Math.cos(a) * d, P.by + Math.sin(a) * d * 0.7 + k * k * 30, 3 * (1 - k) + 0.5, 0, 7); g.fill(); }
      g.lineWidth = 3; g.beginPath(); g.ellipse(P.bx, P.gy, 10 + k * 46 * s, 4 + k * 15 * s, 0, 0, 7); g.stroke(); },
  };

  // draw(g, effect, at): at(boardX, boardY) -> [screen x of the tile centre, screen y of the feet]
  function draw(g, e, at) {
    const k = Math.min(1, e.t / e.dur), a = at(e.ax, e.ay), b = at(e.bx, e.by);
    g.save(); g.lineCap = 'round'; if (e.skill) { g.shadowColor = e.col; g.shadowBlur = 16; } KINDS[e.kind](g, e, k, { ax: a[0], ay: a[1] - 50, bx: b[0], by: b[1] - 36, gy: b[1] }, at); g.restore();
  }
  // 종류별 설명: 이펙트 미리보기(effects.html)와 제작 가이드(EFFECT-GUIDE.md)가 함께 읽는다.
  //   [이름, 쓰임, 기준점, 크기(px, 캐릭터 그림과 같은 배율)]
  const NOTES = {
    missile: ['빛줄기', '원거리 평타', '자신 가슴 → 대상 가슴', '굵기 3, 길이는 거리의 30%'],
    orb: ['구슬', '원거리 평타', '자신 가슴 → 대상 가슴', '구슬 지름 16, 터질 때 지름 56'],
    petal: ['꽃잎', '원거리 평타', '자신 가슴 → 대상 가슴', '꽃잎 10×5, 4장'],
    needle: ['침', '원거리 평타', '자신 가슴 → 대상 가슴', '굵기 1.5'],
    arrow: ['화살', '궁병 평타·전법', '자신 가슴 → 대상 가슴 (화살비는 하늘 → 대상)', '길이 24, 굵은 화살 34'],
    order: ['표적 표시', '지휘 평타', '대상 가슴', '지름 52에서 32로 조여 듦'],
    jab: ['짧은 찌르기', '근접 평타', '자신 가슴 → 대상 너머 33', '굵기 4.4'],
    cut: ['짧은 베기', '근접 평타', '대상 가슴', '반지름 31 초승달, 굵기 7.7'],
    chop: ['내려 베기', '근접 평타', '대상 가슴', '폭 22, 높이 82'],
    rise: ['올려 베기', '근접 평타', '대상 가슴', '폭 22, 높이 82'],
    thud: ['방패 치기', '근접 평타', '대상 가슴', '고리 지름 20에서 64'],
    whip: ['채찍 줄', '근접 평타', '자신 가슴 → 대상 가슴', '굵기 5, 휘는 폭 46'],
    spark: ['맞는 섬광', '모든 근접 평타', '대상 가슴', '섬광 지름 24, 광선 6개 길이 12'],
    bolt: ['번개', '책사 전법', '하늘 → 대상 발밑', '높이 380, 폭 44, 바닥 빛 60×20'],
    rock: ['낙석', '책사 평타·전법', '하늘 → 대상 발밑', '바위 지름 36, 낙하 300, 먼지 고리 92×28'],
    ice: ['얼음 조각', '책사 평타·전법', '하늘 → 대상 발밑', '조각 16×34, 낙하 260'],
    fire: ['불기둥', '책사 전법', '대상 발밑', '폭 80, 높이 86, 바닥 빛 80×22'],
    wind: ['회오리', '책사 평타·전법', '대상 발밑', '아래 폭 20, 위 폭 80, 높이 90'],
    rune: ['진', '책사·지원 전법', '대상(또는 자신) 발밑', '팔각 두 겹 92×30'],
    chain: ['사슬', '책사 전법', '대상들의 가슴을 잇는다', '굵기 3 점선'],
    heal: ['회복 빛', '지원 전법', '아군 발밑에서 위로', '십자 10×10 여섯 개, 상승 90'],
    aura: ['강화 고리', '지원 전법', '아군 발밑', '고리 60×18에서 88×26, 상승 40'],
    slash: ['큰 베기', '근접 전법', '대상 가슴', '반지름 36 초승달, 굵기 9'],
    cross: ['X자 베기', '근접 전법·평타', '대상 가슴', '60×60'],
    pierce: ['관통 찌르기', '근접 전법', '자신 가슴 → 대상 너머 60', '굵기 8'],
    dash: ['돌진 궤적', '근접 전법', '자신 발밑 → 대상 발밑', '줄 5개, 폭 28'],
    shock: ['충격파', '근접 전법', '대상(또는 자신) 발밑', '고리 148×48, 균열 길이 30~56'],
    spin: ['회전 베기', '근접 전법', '자신 허리', '고리 108×39'],
    roar: ['함성', '근접·지휘 전법', '자신 발밑', '고리 3개, 최대 340×118'],
    shield: ['보호막', '방어 전법', '자신 또는 아군 몸통', '타원 72×112'],
    fury: ['기세', '강화 전법', '자신 발밑에서 위로', '줄 9개, 폭 64, 높이 110'],
    flurry: ['잔 베기', '근접 전법', '대상 가슴', '길이 40 선 5개'],
    blink: ['순간이동 연기', '근접 전법', '자신 자리와 대상 자리', '연기 지름 64, 두 곳'],
    bind: ['밧줄', '방해 전법', '대상 몸통', '고리 3개 60×16'],
    drain: ['흡수', '근접 전법', '대상 가슴 → 자신 가슴', '점 7개, 지름 8'],
    stun: ['기절 별', '전법 부가', '대상 머리 위 (발에서 112)', '별 3개, 지름 12'],
    cast: ['시전 빛기둥', '모든 전법 공통', '자신 발밑', '빛기둥 56×240, 고리 최대 212×72'],
    burst: ['명중 섬광', '모든 전법 공통', '대상 가슴과 발밑', '섬광 지름 52에서 78, 광선 12개, 불꽃 10개'],
  };
  window.SIM_FX = { what, make, draw, colour, melee, DUR, NOTES, HERO, FAMILY, KINDS };
})();
