"""Free local check before any paid PixelLab call. Nothing here calls the API.

    python -X utf8 bone-motion/engine/pixellab.py preflight <hero id> [clip ...]
    python -X utf8 bone-motion/engine/preflight.py --types          rear twist of every type's guard

For every clip x view it builds exactly what `animate` would send and checks the things that went wrong on the first
hero (docs/2026-11-19-zhangfei-motion-handoff.md):

  후면 방향    the bone's torso turn in the rear view against a back drawing that is square to the camera
  후면 문구    face words that would reach a rear request
  머리 관절    the rear rig has 'back of skull' and no NOSE
  캔버스       keypoints that leave the 256 canvas (they would be clamped and the weapon shortened)
  깊이         weapon passing through the torso seen from this camera, hands behind the back plate in the rear view
  발           toe joints present; foot direction in the rear view
  중복 제출    a job that already exists for this clip/view

Output: out/pixellab-preflight/<id>/report.md and <clip>-<view>.png (art + first-frame joints, then the 15 target frames).
A pass here is not a promise about the generated picture; it only removes the causes we already know.
"""
import json, math, os, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm
from overview import solve, FAMILIES

TWIST_LIMIT = 20.0      # degrees of chest turn a square back drawing can absorb
VIEWS = ('front', 'left', 'rear'); NAME = {'front': '정면', 'left': '측면', 'rear': '후면'}

def turn(j, a, b):
    s = sm.sub(j[a + '.L'], j[a + '.R']); return math.degrees(math.atan2(-s[1], s[0]))

def guard_twist(family):
    j = solve(family, 'idle')[3][0]
    if 'shoulder.L' not in j: return None
    return turn(j, 'shoulder', None), turn(j, 'hip', None)

def types():
    print('유형별 전투 대기의 몸통 회전. 20°를 넘는 유형은 후면만 rear.py의 후면 전용 본을 쓴다 (정면·측면은 그대로)')
    for fam in FAMILIES:
        t = guard_twist(fam)
        if t is None: print('  %-14s 기마: 사람 관절 이름이 달라 아직 검사 못 함' % fam); continue
        print('  %-14s 가슴 %5.1f°  골반 %5.1f°  %s' % (fam, abs(t[0]), abs(t[1]), '후면 전용 본 사용' if abs(t[0]) > TWIST_LIMIT else '그대로'))

def seg_point_dist(p, a, b):
    ax, ay = b[0] - a[0], b[1] - a[1]; L = ax * ax + ay * ay
    t = 0 if L == 0 else max(0.0, min(1.0, ((p[0] - a[0]) * ax + (p[1] - a[1]) * ay) / L))
    return math.hypot(p[0] - a[0] - ax * t, p[1] - a[1] - ay * t), t

def check(pl, hero, clip_id, view):
    """-> (problems, warnings, drawing data)"""
    bad, warn = [], []
    cfg, clip, first, motion = pl.prepared(hero, clip_id, view, raw=True)
    rig = pl.rig(view, bool(cfg.get('weapon_length')), cfg); names = [r['name'] for r in rig]
    # head joint
    if view == 'rear' and ('NOSE' in names or pl.SKULL not in names): bad.append('후면 뼈대에 NOSE가 있음')
    if 'LEFT TOE' not in names: bad.append('발끝 관절 없음')
    if not cfg.get('streamers'): warn.append('streamers 없음: 두건 끈·옷깃·소매·망토·깃털처럼 날려야 할 것이 있으면 pixellab.json에 적는다 (없으면 모션 내내 굳어 있다)')
    else:
        for label in [k['label'] for k in motion[0] if k['label'].endswith(' tip') and 'weapon' not in k['label']]:
            pts = [next(k for k in f if k['label'] == label) for f in motion]
            travel = max(math.hypot((a['x'] - b['x']) * 256, (a['y'] - b['y']) * 256) for a in pts for b in pts)
            if travel < 2.0: warn.append('%s: 이 방향에서 끝이 %.1fpx밖에 안 움직임' % (label, travel))
    seen = set()
    for r in rig:
        if r['parent'] is not None and r['parent'] not in seen: bad.append('부모보다 먼저 나온 관절: ' + r['name'])
        seen.add(r['name'])
    # wording
    if view == 'rear':
        w = pl.face_words(cfg, clip_id, clip)
        if w: bad.append('후면 문구에 얼굴 단어: ' + ', '.join(w) + ' (pixellab.json의 description에서 face로 옮길 것)')
        if not cfg.get('rear_detail'): warn.append('rear_detail 없음: 뒤에서 보이는 것(상투, 망토, 화살통 등)을 적으면 좋다')
    # rear direction: bone turned, drawing square
    j0 = pl.solve_view(cfg['family'], 'idle', view)[3][0]
    if view == 'rear' and 'shoulder.L' in j0:
        t = abs(turn(j0, 'shoulder', None))
        import rear
        if rear.needed(cfg['family']):
            r = rear.solve(cfg['family'], clip_id); g = abs(rear.guard_turn(cfg['family'])[1]); kept = max(r[5]) * g
            if r[4]: bad.append('후면 전용 본에 문제: ' + '; '.join(r[4][:3]))
            if kept > TWIST_LIMIT: warn.append('후면 전용 본에서도 동작 중 가슴 회전이 최대 %.0f° 남는 프레임이 있음 (손·발이 닿게 하려고 남김). 그 구간에서 몸이 살짝 돌아 보일 수 있다' % kept)
        if t > TWIST_LIMIT:
            bad.append('본의 대기는 가슴이 %.0f° 틀어져 있는데 후면 원화는 완전 후면이다. 후면 대기를 회전 0으로 따로 잡아야 한다 (장비에서 겪은 원인 1번)' % t)
    # canvas
    out = []
    for i, frame in enumerate([first] + motion):
        for k in frame:
            if not (0.0 <= k['x'] <= 1.0 and 0.0 <= k['y'] <= 1.0): out.append((i, k['label'], round(k['x'] * 256), round(k['y'] * 256)))
    if out:
        worst = max(out, key=lambda o: max(-o[2], o[2] - 256, -o[3], o[3] - 256))
        bad.append('캔버스 밖 관절 %d개 (예: %s번 프레임 %s → %d,%d). fit_canvas.py로 캔버스 배치를 맞추고, 그래도 안 들어가면 무기 길이를 확인' % (len(out), worst[0] or '시작', worst[1], worst[2], worst[3]))
    # weapon through torso, and hands behind the back plate, as this camera sees them
    hits = []; hidden = []
    for i, frame in enumerate(motion):
        by = {k['label']: k for k in frame}; px = lambda l: (by[l]['x'] * 256, by[l]['y'] * 256)
        if 'weapon butt' in by:
            for core, radius in (('NECK', 9.0), ('pelvis', 10.0)):
                d, t = seg_point_dist(px(core), px('weapon butt'), px('weapon tip'))
                depth = by['weapon butt']['depth'] + (by['weapon tip']['depth'] - by['weapon butt']['depth']) * t
                if d < radius and abs(depth - by[core]['depth']) < 5.0: hits.append(i + 1)
        if view == 'rear':
            for hand in ('RIGHT ARM', 'LEFT ARM'):
                d, _t = seg_point_dist(px(hand), px('NECK'), px('pelvis'))
                if by[hand]['depth'] < by['pelvis']['depth'] - 4.0 and d < 9.0: hidden.append((i + 1, hand))
    if hits: warn.append('무기 선이 몸통 중심을 같은 깊이로 지나는 프레임: %s (관통으로 그려질 수 있음)' % sorted(set(hits)))
    both = sorted(i for i in {h[0] for h in hidden} if sum(1 for h in hidden if h[0] == i) == 2)
    if both: warn.append('후면에서 두 손이 모두 몸통 한가운데 뒤로 가려지는 프레임: %s (무기가 사라지거나 손이 등판을 뚫고 나올 수 있음. 가까운 쪽 자루는 보인다고 action에 적을 것)' % both)
    gone = pl.weapon_hidden(motion)
    if len(gone) >= 2: warn.append('무기가 몸통 뒤로 대부분 가려지는 프레임: %s (그 구간에서 무기가 빠져 그려질 수 있어, 제출 문구에 "무기는 사라지지 않는다"가 자동으로 붙는다. 5프레임 넘게 이어지면 본에서 무기를 몸 밖으로 빼는 것이 낫다)' % pl.spans(gone))
    if pl.weapon_far_side(motion): warn.append('이 방향에서는 무기가 몸 반대쪽 손에 있다. 몇 프레임에서 무기가 빠져 그려진 적이 있어(요화·관우·제갈량 측면), 제출 문구에 "모든 프레임에 무기를 그린다"가 자동으로 붙는다')
    # existing job
    d = os.path.join(sm.WORK, 'out', 'pixellab', hero, clip_id, view)
    if os.path.exists(os.path.join(d, 'job.json')): warn.append('이미 제출한 작업이 있음: fetch로 조회')
    return bad, warn, (cfg, rig, first, motion)

BONES = None
def draw(pl, hero, clip_id, view, data, path):
    cfg, rig, first, motion = data; parent = {r['name']: r['parent'] for r in rig}
    cell = 256; cols = 8; rows = 2; sheet = Image.new('RGBA', (cell * cols, cell * rows), (40, 48, 62, 255))
    try: art = pl.art(hero, view, (0.0, 0.0) if pl.stage(hero, view) == 'guard' else pl.shift_of(cfg, view))[0]
    except Exception: art = None
    def skeleton(frame, ox, oy, color):
        d = ImageDraw.Draw(sheet); by = {k['label']: (ox + k['x'] * 256, oy + k['y'] * 256) for k in frame}
        for name, p in parent.items():
            if p and name in by and p in by:
                d.line([by[p], by[name]], fill=(250, 220, 90, 255) if 'weapon' in name else color, width=2)
        for name, pt in by.items():
            c = (255, 80, 80, 255) if name in (pl.SKULL, 'NOSE') else (255, 255, 255, 255)
            d.ellipse([pt[0] - 2, pt[1] - 2, pt[0] + 2, pt[1] + 2], fill=c)
    if art is not None and art.size == (256, 256): sheet.alpha_composite(art, (0, 0))
    skeleton(first, 0, 0, (90, 200, 255, 255))
    for i, frame in enumerate(motion):
        n = i + 1; skeleton(frame, (n % cols) * cell, (n // cols) * cell, (120, 230, 140, 255))
        ImageDraw.Draw(sheet).text(((n % cols) * cell + 4, (n // cols) * cell + 4), str(i + 1), fill=(255, 255, 255, 255))
    ImageDraw.Draw(sheet).text((4, 4), 'art + first', fill=(255, 255, 255, 255))
    sheet.convert('RGB').save(path)

def run(hero, clips):
    import pixellab as pl
    cfg = pl.hero_config(hero); clips = clips or list(cfg['actions'])
    print('시작 그림: ' + ', '.join('%s=%s' % (NAME[v], '전투 대기 확정본' if pl.stage(hero, v) == 'guard' else '기본 자세 원화(대기만 가능)') for v in VIEWS))
    out = os.path.join(sm.WORK, 'out', 'pixellab-preflight', hero); os.makedirs(out, exist_ok=True)
    lines = ['# %s PixelLab 제출 전 검사' % cfg.get('hero', hero), '', '유료 호출 없음. 통과해도 생성 그림을 보증하지는 않는다. 알려진 원인만 미리 없앤다.', '']
    total_bad = 0; ready = 0
    for clip_id in clips:
        for view in VIEWS:
            try: bad, warn, data = check(pl, hero, clip_id, view)
            except Exception as e:
                bad, warn, data = ['검사 실패: %s: %s' % (type(e).__name__, e)], [], None
            if data: draw(pl, hero, clip_id, view, data, os.path.join(out, '%s-%s.png' % (clip_id, view)))
            state = '막힘' if bad else '주의' if warn else '통과'; total_bad += bool(bad); ready += not bad
            lines.append('## %s %s — %s' % (clip_id, NAME[view], state))
            lines += ['- **막힘** ' + b for b in bad] + ['- 주의: ' + w for w in warn] + ['']
            print('%-5s %-4s %s' % (clip_id, NAME[view], state) + ''.join('\n      막힘: ' + b for b in bad) + ''.join('\n      주의: ' + w for w in warn))
    lines += ['---', '제출 가능 %d건 (약 %d회분), 막힌 것 %d건.' % (ready, ready * 4, total_bad)]
    open(os.path.join(out, 'report.md'), 'w', encoding='utf-8', newline='\n').write('\n'.join(lines) + '\n')
    print('\n제출 가능 %d건 (약 %d회분), 막힌 것 %d건 -> %s' % (ready, ready * 4, total_bad, os.path.join(out, 'report.md')))

if __name__ == '__main__':
    if '--types' in sys.argv: types()
    else: run(sys.argv[1], [a for a in sys.argv[2:] if not a.startswith('--')])
