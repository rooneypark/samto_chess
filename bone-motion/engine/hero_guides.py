"""Per-hero drawing guides: the type's bone pose with that hero's own size and weapon, as three annotated pictures
and a request text.

    python bone-motion/engine/hero_guides.py            all 49 heroes
    python bone-motion/engine/hero_guides.py 2 xuchu    only these ids

Writes art-in/<id>/guide/guide-front.png, guide-side.png, guide-back.png (256 canvas shown 4x) and REQUEST.md, and
hero-profiles.json (the numbers every later step uses: guides, art check, PixelLab export).

A hero is the type's bone plus a few numbers: weapon length, size of the weapon's head, height and width of the body.
The numbers are limited by what the type's clips can take without leaving the canvas (measured here).
"""
import importlib, json, math, os, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm, render
from overview import solve

VIEW = {'front': ('front', '정면', '캐릭터가 화면 쪽을 본다'), 'left': ('side', '왼쪽 측면', '캐릭터가 화면 왼쪽을 본다'), 'rear': ('back', '후면', '캐릭터가 화면 안쪽을 본다')}
FAMILY = {'foot_spear': '보행 창', 'sword': '한손 검·단도', 'spear_shield': '창·방패', 'dual': '쌍무기', 'heavy': '중무기', 'flexible': '사슬·채찍', 'bow': '궁', 'command': '군령',
          'caster': '책사·지원', 'mounted_spear': '기마 창', 'mounted_blade': '기마 월도·화극', 'sickle': '사슬낫'}
WEAPON = {   # family: (weapon word, pairs of (butt joint, tip joint), size of the head on the standard weapon)
    'foot_spear': ('창', [('spear_butt', 'spear_tip')], 24), 'sword': ('검', [('sword_butt', 'sword_tip')], 30), 'spear_shield': ('창', [('spear_butt', 'spear_tip')], 20),
    'dual': ('쌍무기', [('swordR_butt', 'swordR_tip'), ('swordL_butt', 'swordL_tip')], 26), 'heavy': ('중무기', [('spear_butt', 'spear_tip')], 20),
    'command': ('검', [('sword_butt', 'sword_tip')], 26), 'mounted_spear': ('창', [('glaive_butt', 'glaive_tip')], 22), 'mounted_blade': ('월도', [('glaive_butt', 'glaive_tip')], 36),
    'sickle': ('낫', [('sickle_butt', 'sickle_tip')], 14), 'flexible': ('사슬', [], 0), 'bow': ('활', [], 0), 'caster': ('소품', [], 0)}
BODY = {'samto-body-neutral.json': 124, 'samto-body-tactician-neutral.json': 111, 'samto-body-cavalry-neutral.json': 163}

# What makes each hero that hero. extra = px of weapon beyond the type's standard (capped by the measured limit),
# head = size of the blade / mace head / axe head, h and w = body height and width against the standard bone.
OVERRIDE = {
 '장비': dict(extra=12, head=36, w=1.15, mark='장팔사모: 물결치는 뱀 모양의 큰 날. 창이 길어 보이는 것이 이 장수의 특징이다. 넓은 어깨와 굵은 팔.'),
 '허저': dict(h=1.06, w=1.15, head=28, mark='큰 몸집. 어깨·몸통·팔을 넓게. 머리는 키우지 않는다. 철퇴의 머리를 크고 무겁게.'),
 '전위': dict(h=1.05, w=1.15, mark='허저와 같은 급의 큰 몸. 양손의 쌍철극이 굵고 무겁다.'),
 '서황': dict(h=1.03, w=1.08, head=30, mark='큰 도끼. 도끼머리를 넓고 크게.'),
 '관우': dict(w=1.10, head=48, mark='긴 수염과 청룡언월도. 월도의 날을 크고 넓게(전체 길이는 그대로 두고 날의 비중을 키운다).'),
 '여포': dict(w=1.10, head=48, mark='방천화극의 큰 날과 투구의 긴 깃. 당당하게 편 가슴.'),
 '장료': dict(mark='절제된 기마 지휘관. 월도는 관우보다 작게.'),
 '동탁': dict(w=1.22, extra=10, head=38, mark='비만 체형: 몸통과 배를 넓게. 키는 그대로. 큰 칼.'),
 '화웅': dict(h=1.03, w=1.08, extra=10, head=38, mark='거친 대도 무장. 큰 칼.'), '안량': dict(h=1.03, w=1.08, extra=10, head=38, mark='날의 넓은 면이 보이는 대도.'),
 '주창': dict(h=1.03, w=1.08, extra=10, head=38, mark='우직한 호위장. 큰 칼.'), '위연': dict(extra=10, head=38, mark='가면과 큰 칼. 낮은 중심.'),
 '문추': dict(h=1.03, w=1.08, mark='끝까지 몰아붙이는 창장.'),
 '악진': dict(h=0.96, extra=-6, head=24, mark='작고 다부진 몸. 단검.'), '정봉': dict(extra=-6, head=24, mark='짧은 단도.'),
 '손상향': dict(w=0.92, mark='여성 궁수. 어깨를 좁게, 과장 없이 단단하게.'), '초선': dict(w=0.92, mark='작은 부채, 긴 분홍 의상, 금색 꽃장식.'), '곽가': dict(w=0.92, mark='마른 체격. 죽간.'),
 '조운': dict(mark='흰말과 은창. 정확하고 절제된 자세.'), '마초': dict(mark='은갑과 사자투구, 가슴이 넓은 말.'), '공손찬': dict(mark='백마.'),
 '감녕': dict(mark='방울 장식. 오른손에 낫, 사슬은 왼손에 모아 쥔다.'), '황개': dict(mark='맨상체의 노장. 쇠채찍(마디가 있는 굵은 채찍).'), '반장': dict(mark='감은 밧줄을 든다. 허리의 검은 칼집에 둔다.'),
 '원소': dict(mark='금갑과 흰 투구깃. 원화에서는 검 대신 창을 세워 든다(손 위치는 같게).'), '조조': dict(mark='금관, 남색 금장, 붉은 망토.'), '손권': dict(mark='붉은 복식, 검.'),
 '태사자': dict(mark='활을 들고, 보조 무기(쌍극)는 등에 멘다.'), '황충': dict(mark='흰 수염의 노궁수.'), '하후연': dict(mark='민첩한 궁수.'), '의용궁병': dict(mark='삿갓, 화살통.'),
 '제갈량': dict(mark='백우선(깃털부채), 관모, 흰·연녹 도포.'), '사마의': dict(mark='검은 도포, 깃털부채.'), '군영참모': dict(mark='죽간을 든다(부채 자리에).'),
 '순욱': dict(mark='홀(笏)을 든다(부채 자리에).'), '방통': dict(mark='지팡이를 짚는다. 작고 구부정한 몸.'), '장각': dict(mark='누런 도포, 지팡이.'), '화타': dict(mark='지팡이와 약상자.'),
 '육손': dict(mark='횃불을 든다(부채 자리에).'), '노숙': dict(mark='두루마리를 든다(부채 자리에).'),
 '유비': dict(mark='쌍검, 녹색 복식.'), '손책': dict(mark='짧은 쌍극.'), '하후돈': dict(mark='안대. 긴 창.'), '강유': dict(mark='젊은 창장.'), '여몽': dict(mark='흰옷, 절제된 창.'),
 '요화': dict(mark='실용적인 검과 갑주.'), '주유': dict(mark='지휘검, 붉은 망토.'), '의용보병': dict(mark='일반 병사. 창과 둥근 방패.'), '조홍': dict(mark='창과 방패.'),
}

def frames_of(family):
    mod = importlib.import_module('clips.' + family); out = []
    for cid in mod.CLIPS: out += solve(family, cid)[3]
    return out

def weapon_limit(family, margin=5.0):
    """How many px the weapon can grow at its tip before any frame of any clip of this type leaves the canvas."""
    pairs = WEAPON[family][1]
    if not pairs: return 0
    best = 60.0
    for j in frames_of(family):
        for butt, tip in pairs:
            axis = sm.unit(sm.sub(j[tip], j[butt]))
            for view in VIEW:
                e = 0.0
                while e < best:
                    x, y, _ = sm.project(view, sm.add(j[tip], sm.mul(axis, e + 1)))
                    if not (margin <= x <= 256 - margin and margin <= y <= 256 - margin): break
                    e += 1
                best = min(best, e)
    return int(best)

def profile(h, limits, traits):
    o = OVERRIDE.get(h['name'], {}); fam = h['family']; word, pairs, head = WEAPON[fam]; mod = importlib.import_module('clips.' + fam); rig = solve(fam, 'idle'); j = rig[3][0]
    std = round(sm.length(sm.sub(j[pairs[0][1]], j[pairs[0][0]]))) if pairs else 0
    extra = max(-12, min(o.get('extra', 0), limits[fam])) if pairs else 0
    return dict(id=h['id'], name=h['name'], family=fam, family_ko=FAMILY[fam], weapon=word, weapon_standard=std, weapon_length=std + extra, weapon_limit=std + limits[fam] if pairs else 0,
                weapon_head=o.get('head', head), height=o.get('h', 1.0), width=o.get('w', 1.0), body_standard=BODY[mod.BODY], mark=o.get('mark', ''), traits=traits.get(h['id'], {}).get('traits', ''))

def pose(p):
    """The idle pose of the type with this hero's height and weapon length applied."""
    m, clip, rig, frames = solve(p['family'], 'idle'); j = {k: (v[0] * p['height'], v[1] * p['height'], v[2] * p['height']) for k, v in frames[0].items()}
    for butt, tip in WEAPON[p['family']][1]:
        axis = sm.unit(sm.sub(j[tip], j[butt])); j[tip] = sm.add(j[butt], sm.mul(axis, p['weapon_length']))
        collar = tip.replace('_tip', '_collar')
        if collar in j: j[collar] = sm.add(j[butt], sm.mul(axis, p['weapon_length'] - p['weapon_head']))
    return rig, j, clip

def layering(j, rig, view, butt, tip, steps=28):
    """Along the weapon from butt to tip: is each stretch in front of the body, behind it, or clear of it in this view?
    Returns [(t0, t1, state, part)] with state 'front' | 'behind' | 'clear'."""
    import posecheck
    caps = [c for c in posecheck.capsules(j, rig) if '아래팔' not in c[0] and '위팔' not in c[0]]; out = []
    for i in range(steps):
        t = (i + 0.5) / steps; w = sm.lerp(j[butt], j[tip], t); wx, wy, wn = sm.project(view, w); state, part = 'clear', ''
        for name, a, b, rad in caps:
            for k in range(7):
                c = sm.lerp(a, b, k / 6.0); cx, cy, cn = sm.project(view, c)
                if math.hypot(wx - cx, wy - cy) < rad:
                    state, part = ('front' if wn > cn else 'behind'), name; break
            if state == 'behind': break
        if out and out[-1][2] == state and out[-1][3] == part: out[-1] = (out[-1][0], (i + 1) / steps, state, part)
        else: out.append((i / steps, (i + 1) / steps, state, part))
    return out

def body_layers(j, rig, view):
    """In words, how the parts of the body sit over one another in this view: the order from far to near, and every
    pair that overlaps on the picture with which one is drawn on top. Computed from the 3D pose."""
    import posecheck
    caps = posecheck.capsules(j, rig); mid = {}; flat = {}
    for name, a, b, rad in caps:
        pa, pb = sm.project(view, a), sm.project(view, b); mid[name] = (pa[2] + pb[2]) / 2; flat[name] = ((pa[0], pa[1], 0), (pb[0], pb[1], 0), rad)
    order = [n for n in sorted(mid, key=mid.get)]
    pairs = []
    def over(a, b):
        fa, fb = flat[a], flat[b]; return render.seg_seg(fa[0], fa[1], fb[0], fb[1]) < (fa[2] + fb[2]) * 0.75
    limbs = [n for n in mid if any(k in n for k in ('위팔', '아래팔', '허벅지', '정강이')) and '말' not in n]; core = [n for n in mid if n in ('몸통', '머리', '말 몸통', '말 목', '말 머리')]
    for l in limbs:
        for c in core:
            if over(l, c) and abs(mid[l] - mid[c]) > 1.5: pairs.append('%s: %s %s' % (l, c, '앞에 그린다' if mid[l] > mid[c] else '뒤로 가려진다'))
    for a, b in (('왼 아래팔', '오른 아래팔'), ('왼 위팔', '오른 위팔'), ('왼 허벅지', '오른 허벅지'), ('왼 정강이', '오른 정강이'), ('왼 아래팔', '오른 허벅지'), ('오른 아래팔', '왼 허벅지'),
                 ('왼 아래팔', '왼 허벅지'), ('오른 아래팔', '오른 허벅지'), ('머리', '몸통')):
        if a in flat and b in flat and over(a, b) and abs(mid[a] - mid[b]) > 1.5: pairs.append('%s: %s 앞에 그린다' % ((a, b) if mid[a] > mid[b] else (b, a)))
    return order, pairs

def layer_text(spans):
    """'자루 끝에서 20~45%: 오른 허벅지의 뒤' style lines for the request."""
    lines = []
    for t0, t1, state, part in spans:
        if state == 'clear': continue
        lines.append('끝에서 %d~%d%% 구간은 %s의 %s' % (round(t0 * 100), round(t1 * 100), part, '앞(무기가 위에 그려진다)' if state == 'front' else '뒤(몸에 가려진다)'))
    return lines or ['몸과 겹치지 않는다']

def guide(p, out_dir):
    rig, j, clip = pose(p); S = 4; W = 256 * S; rows = {}; body = getattr(rig, 'body', None); keep = dict(body.r) if body else None
    if body:
        for k in ('torso', 'upper', 'fore', 'thigh', 'shin'): body.r[k] = keep[k] * p['width']
    for view, (fname, ko, facing) in VIEW.items():
        # the figure keeps its dark outlines and its near-over-far order, only lightened (a see-through figure made the overlapping legs unreadable)
        solid = render.draw_view(rig, j, view, None, target=None, support=())
        bone = Image.blend(solid, Image.new('RGBA', solid.size, (255, 255, 255, 255)), 0.30).resize((W, W), Image.LANCZOS)
        g = bone.copy(); d = ImageDraw.Draw(g); f = render.font(15, bold=False); fb = render.font(17)
        P = lambda v: (sm.project(view, v)[0] * S, sm.project(view, v)[1] * S); Q = lambda v: (round(sm.project(view, v)[0]), round(sm.project(view, v)[1]))
        head = 'r_head' if 'r_head' in j else 'head'; crown = sm.project(view, j[head])[1] - 18.5 * p['height']
        d.line([(0, 224 * S), (W, 224 * S)], fill=(0, 150, 0, 255), width=2); d.text((8, 224 * S + 4), '바닥 y=224', font=f, fill=(0, 120, 0, 255))
        d.line([(0, crown * S), (W, crown * S)], fill=(0, 110, 220, 255), width=2); d.text((8, crown * S - 22), '머리 꼭대기 y=%d (상투·투구·관모는 이 위로)' % round(crown), font=f, fill=(0, 90, 200, 255))
        info = dict(crown=round(crown))
        for n, (butt, tip) in enumerate(WEAPON[p['family']][1]):
            b, t = P(j[butt]), P(j[tip]); collar = tip.replace('_tip', '_collar'); spans = layering(j, rig, view, butt, tip)
            for t0, t1, state, part in spans:          # solid = in front of the body or clear of it, dotted = hidden behind the body
                a0 = (b[0] + (t[0] - b[0]) * t0, b[1] + (t[1] - b[1]) * t0); a1 = (b[0] + (t[0] - b[0]) * t1, b[1] + (t[1] - b[1]) * t1)
                if state != 'behind': d.line([a0, a1], fill=(230, 0, 0, 255), width=4)
                else:
                    n = max(2, int(math.hypot(a1[0] - a0[0], a1[1] - a0[1]) / 9))
                    for q in range(n):
                        if q % 2 == 0: d.line([(a0[0] + (a1[0] - a0[0]) * q / n, a0[1] + (a1[1] - a0[1]) * q / n), (a0[0] + (a1[0] - a0[0]) * (q + 1) / n, a0[1] + (a1[1] - a0[1]) * (q + 1) / n)], fill=(120, 0, 160, 255), width=4)
            info.setdefault('layers', []).append(layer_text(spans))
            for q, lab in ((b, '끝'), (t, '무기 끝')): d.ellipse([q[0] - 7, q[1] - 7, q[0] + 7, q[1] + 7], outline=(230, 0, 0, 255), width=3); d.text((q[0] + 11, q[1] - 10), lab, font=f, fill=(200, 0, 0, 255))
            if collar in j: c = P(j[collar]); d.ellipse([c[0] - 6, c[1] - 6, c[0] + 6, c[1] + 6], fill=(230, 0, 0, 255)); d.text((c[0] + 10, c[1] - 10), '날·머리 시작', font=f, fill=(200, 0, 0, 255))
            info['weapon%d' % n] = (Q(j[butt]), Q(j[tip]))
        for side, lab in (('R', '오른손'), ('L', '왼손')):
            key = ('r_hand.' if 'r_hand.R' in j else 'hand.') + side; q = P(j[key]); d.ellipse([q[0] - 8, q[1] - 8, q[0] + 8, q[1] + 8], fill=(255, 150, 0, 255)); d.text((q[0] + 11, q[1] + 2), lab, font=f, fill=(170, 80, 0, 255)); info['hand' + side] = Q(j[key])
        info['order'], info['pairs'] = body_layers(j, rig, view)
        d.rectangle([0, 0, W, 30], fill=(20, 26, 38, 255)); d.text((8, 4), '%s · %s · %s (%s) · 256의 4배 · 빨간 실선=무기(몸 앞), 보라 점선=몸 뒤로 가려지는 부분, 주황=손' % (p['name'], p['family_ko'], ko, facing), font=fb, fill=(255, 255, 255, 255))
        g.convert('RGB').save(os.path.join(out_dir, 'guide-%s.png' % fname)); rows[view] = info
        # the same guide at the real size (256x256, no text): lay it under the drawing as a layer
        one = Image.blend(solid, Image.new('RGBA', solid.size, (255, 255, 255, 255)), 0.30).resize((256, 256), Image.LANCZOS); e = ImageDraw.Draw(one); R1 = lambda v: (sm.project(view, v)[0], sm.project(view, v)[1])
        e.line([(0, 224), (255, 224)], fill=(0, 150, 0, 255)); e.line([(0, round(crown)), (255, round(crown))], fill=(0, 110, 220, 255))
        for butt, tip in WEAPON[p['family']][1]: e.line([R1(j[butt]), R1(j[tip])], fill=(230, 0, 0, 255), width=1)
        for side in ('R', 'L'):
            q = R1(j[('r_hand.' if 'r_hand.R' in j else 'hand.') + side]); e.ellipse([q[0] - 2, q[1] - 2, q[0] + 2, q[1] + 2], fill=(255, 150, 0, 255))
        one.convert('RGB').save(os.path.join(out_dir, 'guide-%s-256.png' % fname))
    if body: body.r.update(keep)
    return rows

def request(p, rows, out_dir):
    L = ['# %s 전투 대기 원화 요청 (ID `%s`, %s)' % (p['name'], p['id'], p['family_ko']), '',
         '정면, 왼쪽 측면, 후면 3장을 그린다. **납품은 256×256 PNG다.**', '',
         '- `guide-front.png`, `guide-side.png`, `guide-back.png`: 보기 편하게 4배(1024×1024)로 키운 안내 그림이다. 글자와 치수를 읽는 용도이고, 이 크기로 그리지 않는다.',
         '- `guide-front-256.png`, `guide-side-256.png`, `guide-back-256.png`: 같은 안내를 실제 크기(256×256)로 그린 것이다. 이 그림을 밑에 깔고 그 위에 그린다. 좌표가 납품 그림과 1:1로 맞는다.',
         '- 큰 캔버스에서 그린다면 정확히 4배(1024×1024)로 그리고 4×4 픽셀 블록 단위로 찍은 뒤, 마지막에 최근접(nearest) 방식으로 256×256으로 줄인다. 다른 배율이나 부드러운 축소는 쓰지 않는다.', '',
         '## 이 장수의 특징', '']
    if p['mark']: L.append('- **살릴 것:** ' + p['mark'])
    if p['traits']: L.append('- **인물과 외형(통합가이드 12절):** ' + p['traits'])
    L += ['', '## 크기', '',
          '| 항목 | 값 | 표준과의 차이 |', '|---|---|---|',
          '| 키 | 표준 본의 %d%% | %s |' % (round(p['height'] * 100), '표준' if p['height'] == 1 else ('%+d%%' % round((p['height'] - 1) * 100))),
          '| 어깨·몸통·팔다리 폭 | 표준의 %d%% | %s |' % (round(p['width'] * 100), '표준' if p['width'] == 1 else ('%+d%%. 폭으로 덩치를 표현하고 머리는 키우지 않는다' % round((p['width'] - 1) * 100)))]
    if p['weapon_length']:
        L.append('| %s 전체 길이 | **%dpx** | %s (이 유형의 한계 %dpx) |' % (p['weapon'], p['weapon_length'], '표준' if p['weapon_length'] == p['weapon_standard'] else '표준 %dpx에서 %+dpx' % (p['weapon_standard'], p['weapon_length'] - p['weapon_standard']), p['weapon_limit']))
        L.append('| 날·머리 부분 | %dpx | 전체 길이 안에서 차지하는 길이 |' % p['weapon_head'])
    L += ['', '몸을 줄이거나 키워서 무기 비율을 맞추지 않는다. 몸과 무기는 각각 위 값으로 그린다.', '', '## 방향별 좌표 (256×256 캔버스)', '',
          '| 방향 | 머리 꼭대기 y | 오른손 | 왼손 | 무기 (끝 → 무기 끝) |', '|---|---|---|---|---|']
    for view, (fname, ko, facing) in VIEW.items():
        r = rows[view]; w = ', '.join('(%d, %d) → (%d, %d)' % (r[k][0] + r[k][1]) for k in sorted(r) if k.startswith('weapon')) or '가이드 그림 참고'
        L.append('| %s | %d | (%d, %d) | (%d, %d) | %s |' % (ko, r['crown'], *r['handR'], *r['handL'], w))
    if any('layers' in rows[v] for v in VIEW):
        L += ['', '### 무기와 몸의 앞뒤', '', '가이드 그림에서 빨간 실선은 무기가 몸 앞에 있거나 몸과 겹치지 않는 부분이고, 보라 점선은 몸 뒤로 지나가 가려지는 부분이다. 3D 본에서 계산한 것이다.', '']
        for v in VIEW:
            for n, lines in enumerate(rows[v].get('layers', [])): L.append('- %s%s: %s' % (VIEW[v][1], ' (무기 %d)' % (n + 1) if len(rows[v]['layers']) > 1 else '', '; '.join(lines)))
    L += ['', '### 몸의 앞뒤 (겹치는 부분을 어떻게 그리나)', '',
          '같은 자세를 방향마다 다르게 보기 때문에, 방향에 따라 앞에 오는 팔다리가 달라진다. 아래는 3D 본에서 계산한 것이다. "앞"은 카메라에 가까워 위에 덮어 그리는 쪽, "뒤"는 가려지는 쪽이다.', '']
    for v in VIEW:
        L.append('**%s** (%s)' % (VIEW[v][1], VIEW[v][2])); L.append('')
        L.append('- 그리는 순서(먼 것부터 가까운 것): ' + ' → '.join(rows[v]['order']))
        for line in rows[v]['pairs']: L.append('- ' + line)
        if not rows[v]['pairs']: L.append('- 팔다리가 몸통·머리와 겹치는 곳이 없다')
        L.append('')
    L += ['- 왼쪽·오른쪽은 항상 **캐릭터 자신의** 왼쪽·오른쪽이다. 정면 그림에서는 캐릭터의 왼쪽이 화면 오른쪽에 온다. 가이드 인형은 왼쪽 팔다리가 하늘색, 오른쪽이 분홍색이다.',
          '- 가려지는 부분은 그리지 않는다. 가려진 손이나 무기를 보이게 하려고 위치를 옮기지 않는다.']
    L += ['', '- 발바닥은 세 장 모두 y=224 선 위. 접지 기준점은 (128, 224). 정면과 후면에서는 카메라에 가까운 발이 조금 더 아래에 그려진다.',
          '- 무기 길이는 측면 그림에서 잰다. 정면과 후면에서는 무기가 기운 만큼 조금 짧게 보일 수 있다.',
          '- 정면과 후면에서는 카메라에 가까운 발이 더 아래에 그려진다(앞뒤로 벌린 자세를 위에서 비스듬히 본 것이다). 무릎을 굽힌 자세라 다리가 짧아 보이고 앞다리가 뒷다리를 가린다. 인형의 겹침 순서를 따른다.',
          '- 손이 가려지는 방향에서는 손을 억지로 보이게 하지 않는다. 무기와 몸의 앞뒤만 맞춘다.', '',
          '## 지킬 것', '',
          '1. 최종 파일은 256×256 PNG, 투명 배경. 1024로 그렸다면 반드시 256으로 줄여서 넘긴다. 바닥·그림자·배경 없음. 캐릭터 바깥에 희미한 픽셀이 남지 않게 한다.',
          '2. 세 장은 같은 자세를 세 방향에서 본 것이다. 목과 골반의 높이가 세 장에서 같아야 한다.',
          '3. 손이 무기를 잡는 자리, 두 발의 자리, 몸의 방향은 가이드와 같게 한다.',
          '4. 가이드의 선, 점, 글자, 회색 인형, 격자는 그리지 않는다.',
          '5. 얼굴, 수염, 머리 장식, 복색, 갑옷, 무기의 모양은 이 장수답게 그린다. 그림체는 승인된 픽셀 그림체(굵은 외곽선, 큰 색면)를 따른다.', '',
          '## 넘기기 전에 스스로 잴 것', '']
    if p['weapon_length']: L.append('- 측면 그림에서 무기의 양 끝 사이 거리가 %d~%dpx인가.' % (p['weapon_length'] - 5, p['weapon_length'] + 5))
    L += ['- 파일 크기가 256×256인가(1024×1024가 아닌가).', '- 측면 그림에서 머리 꼭대기(상투·투구 제외)가 y=%d 근처(±4)이고 발바닥이 y=224인가.' % rows['left']['crown'],
          '- 캔버스 가장자리 3px 안에 닿는 픽셀이 없는가.', '- 세 장의 축척이 같은가(따로 확대·축소하지 않았는가).', '',
          '## 저장', '', '`bone-motion/art-in/%s/`에 `front.png`, `side.png`, `back.png`. 표준과 다르게 그린 것이 있으면 `notes.txt`에 적는다.' % p['id'],
          '넣은 뒤 `python -X utf8 bone-motion/engine/artcheck.py %s --estimate`로 검사한다.' % p['id'], '']
    open(os.path.join(out_dir, 'REQUEST.md'), 'w', encoding='utf-8', newline='\n').write('\n'.join(L))

if __name__ == '__main__':
    heroes = json.loads(open(os.path.join(sm.WORK, 'sim', 'heroes.js'), encoding='utf-8').read()[len('window.SIM_HEROES = '):-2])
    traits = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'hero_traits.json'), encoding='utf-8'))
    limits = {f: weapon_limit(f) for f in FAMILY}; print('weapon can grow by (px):', limits)
    profiles = {}; want = set(sys.argv[1:])
    for h in heroes:
        p = profile(h, limits, traits); profiles[h['id']] = p
        if want and h['id'] not in want: continue
        d = os.path.join(sm.WORK, 'art-in', h['id'], 'guide'); os.makedirs(d, exist_ok=True); request(p, guide(p, d), d)
    json.dump({'weapon_growth_limit_px': limits, 'heroes': profiles}, open(os.path.join(sm.WORK, 'hero-profiles.json'), 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
    print(len(profiles), 'profiles;', len(want) or len(profiles), 'guides written')
