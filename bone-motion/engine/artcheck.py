"""Check a hero's art BEFORE sending it to PixelLab: will the motion come out well?

    python bone-motion/engine/artcheck.py <hero id> [--estimate]

--estimate asks PixelLab for the skeleton of the three drawings first (0.3 generations); without it the saved
estimate is used. Writes out/art-check/<id>-report.md and <id>-check.png and prints the report.

What it looks at
  1. files: three PNGs, 256x256, transparent background, no faint leftover pixels, nothing cut by the canvas edge
  2. ground: the feet stand on the ground line (y = 224) in all three views
  3. weapon: length against the type's standard and against the longest the clips can take
  4. body: how far the drawn joints are from the bone's guard pose (the motion is fitted to the art, but a big gap warps)
  5. three views: the same body in all three (same joint heights)
  6. reach: every frame of every clip this hero uses, fitted to the art, stays inside the canvas
"""
import json, math, os, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm, pixellab as pl

STANDARD = {'foot_spear': 128, 'sword': 40, 'spear_shield': 104, 'dual': 36, 'heavy': 78, 'flexible': 66, 'bow': 68, 'command': 36, 'caster': 24, 'mounted_spear': 140, 'mounted_blade': 148, 'sickle': 30}
LONGEST = {'foot_spear': 140}                      # measured with the clips (see MOTION-GUIDE); others not measured yet
VIEW_KO = {'front': '정면', 'left': '측면', 'rear': '후면'}

def hero_row(hero):
    rows = json.loads(open(os.path.join(sm.WORK, 'sim', 'heroes.js'), encoding='utf-8').read()[len('window.SIM_HEROES = '):-2])
    return next(h for h in rows if h['id'] == hero)

def check(hero, estimate=False):
    cfg = pl.hero_config(hero); row = hero_row(hero); out = []; bad = warn = 0
    def line(level, text):
        nonlocal bad, warn
        bad += level == '불합격'; warn += level == '주의'; out.append('- **%s** %s' % (level, text))
    if estimate:
        for view in pl.ART:
            im, b64 = pl.art(hero, view); r = pl.call('POST', '/estimate-skeleton', {'image': b64})
            json.dump(r['keypoints'], open(os.path.join(sm.WORK, 'art-in', hero, 'estimate-%s.json' % view), 'w', encoding='utf-8'), indent=1)

    out.append('## 1. 파일'); heights = {}
    for view, name in pl.ART.items():
        path = os.path.join(sm.WORK, 'art-in', hero, name)
        if not os.path.exists(path): line('불합격', '%s: `%s` 없음' % (VIEW_KO[view], name)); continue
        im = Image.open(path).convert('RGBA'); al = im.getchannel('A'); px = al.load(); w, h = im.size
        if (w, h) != (256, 256): line('불합격', '%s: 크기 %dx%d (256x256이어야 함)' % (VIEW_KO[view], w, h)); continue
        faint = sum(1 for y in range(h) for x in range(w) if 0 < px[x, y] <= 128); bb = al.point(lambda v: 255 if v > 128 else 0).getbbox()
        if faint > 60: line('주의', '%s: 희미한 잔여 픽셀 %d개 (보낼 때 자동으로 지우지만 원화에서 지우는 게 좋음)' % (VIEW_KO[view], faint))
        if bb[0] < 3 or bb[1] < 3 or bb[2] > 253 or bb[3] > 253: line('불합격', '%s: 그림이 캔버스 가장자리에 닿음 %s' % (VIEW_KO[view], bb))
        heights[view] = bb
        if not (221 <= bb[3] - 1 <= 227): line('불합격', '%s: 발 아래 끝이 y=%d (접지선 224에서 3px 넘게 벗어남)' % (VIEW_KO[view], bb[3] - 1))
    if not any(l.startswith('- **불합격**') or l.startswith('- **주의**') for l in out[1:]): line('통과', '세 장 모두 256x256, 투명 배경, 접지선 위')

    out.append('\n## 2. 무기'); fam = cfg['family']; std = STANDARD[fam]; length = cfg.get('weapon_length')
    if length:
        side = cfg.get('art_weapon', {}).get('left')
        if side:
            t, b = side['weapon tip'], side['weapon butt']; measured = math.hypot(t[0] - b[0], t[1] - b[1])
            if abs(measured - length) > 5: line('불합격', '측면에서 잰 무기 길이 %.0fpx가 설정값 %dpx와 다름' % (measured, length))
            else: line('통과', '측면에서 잰 무기 길이 %.0fpx (설정 %dpx)' % (measured, length))
        longest = LONGEST.get(fam, std + 5)
        if length > longest: line('불합격', '무기 %dpx는 이 유형의 한계 %dpx를 넘음: 찌르거나 휘두를 때 캔버스 밖으로 잘림' % (length, longest))
        elif abs(length - std) > 5: line('주의', '무기 %dpx는 표준 %dpx와 다름 (한계 %dpx 안이라 사용 가능, 늘어난 길이는 끝 쪽으로 나감)' % (length, std, longest))
        else: line('통과', '무기 길이가 표준 %dpx와 같음' % std)

    out.append('\n## 3. 몸 (원화의 관절과 본 대기 자세의 차이)'); est_ok = True; per_view = {}
    for view in pl.ART:
        if not os.path.exists(os.path.join(sm.WORK, 'art-in', hero, 'estimate-%s.json' % view)): est_ok = False
    if not est_ok: line('주의', '원화 뼈대 추정이 없음. `--estimate`로 다시 실행 (0.3회분)')
    else:
        for view in pl.ART:
            cfg2, clip, motion, guard = pl.frames_for(hero, 'idle', view); first = pl.first_frame(hero, view, cfg2, guard)
            gaps = {g['label']: math.hypot((f['x'] - g['x']) * 256, (f['y'] - g['y']) * 256) for g, f in zip(guard, first) if not g['label'].startswith('weapon')}
            worst = max(gaps, key=gaps.get); mean = sum(gaps.values()) / len(gaps); per_view[view] = {f['label']: (f['x'] * 256, f['y'] * 256) for f in first}
            level = '통과' if mean <= 8 and gaps[worst] <= 16 else '주의' if mean <= 14 and gaps[worst] <= 26 else '불합격'
            line(level, '%s: 관절 평균 %.0fpx, 가장 큰 차이 %s %.0fpx' % (VIEW_KO[view], mean, worst, gaps[worst]))
        f = per_view['left']; g = {k['label']: (k['x'] * 256, k['y'] * 256) for k in pl.frames_for(hero, 'idle', 'left')[3]}
        torso_art = f['pelvis'][1] - f['NECK'][1]; torso_bone = g['pelvis'][1] - g['NECK'][1]; leg_art = (f['LEFT LEG'][1] + f['RIGHT LEG'][1]) / 2 - f['pelvis'][1]; leg_bone = (g['LEFT LEG'][1] + g['RIGHT LEG'][1]) / 2 - g['pelvis'][1]
        note = '상체(목~골반) 원화 %.0fpx / 본 %.0fpx, 다리(골반~발목) 원화 %.0fpx / 본 %.0fpx' % (torso_art, torso_bone, leg_art, leg_bone)
        ratio = torso_art / torso_bone
        line('주의' if ratio < 0.75 or ratio > 1.25 else '통과', note + (' → 상체 비율이 본과 %.0f%% 다름. 모션은 원화 비율에 맞춰 보내지만, 숙이거나 도는 동작에서 몸 길이가 흔들릴 수 있음' % abs((ratio - 1) * 100) if ratio < 0.75 or ratio > 1.25 else ''))

        out.append('\n## 4. 세 방향 일치')
        rows_ = {k: [per_view[v][k][1] for v in pl.ART] for k in ('NECK', 'pelvis')}; ok = True
        for k, ys in rows_.items():
            if max(ys) - min(ys) > 5: ok = False; line('주의', '%s 높이가 방향마다 다름: 정면 %.0f, 측면 %.0f, 후면 %.0f' % (k, *ys))
        if ok: line('통과', '목과 골반 높이가 세 방향에서 5px 안으로 같음')

    out.append('\n## 5. 캔버스 (원화에 맞춘 모션이 그림 밖으로 나가는지)'); clips = ['idle', 'move'] + (['b1', 'b2', 'b3'] if row['set'] == 'B' else ['a1', 'a2', 'a3']) + [row['skillClip']]; cut = []
    if est_ok:
        for cid in clips:
            for view in pl.ART:
                _c, clip, first, motion = pl.prepared(hero, cid, view)
                for i, frame in enumerate(motion):
                    for k in frame:
                        x, y = k['x'] * 256, k['y'] * 256
                        if not (3 <= x <= 253 and 3 <= y <= 253): cut.append('%s %s %d번 %s (%.0f, %.0f)' % (cid, VIEW_KO[view], i + 1, k['label'], x, y))
        if cut: line('불합격', '%d곳에서 캔버스 가장자리 3px 안에 닿음: %s' % (len(cut), '; '.join(cut[:6]) + (' …' if len(cut) > 6 else '')))
        else: line('통과', '이 장수가 쓰는 %d개 클립(%s) × 3방향 모두 캔버스 안' % (len(clips), ', '.join(clips)))

    verdict = '불합격 %d건: 원화를 고친 뒤 제출' % bad if bad else ('주의 %d건: 제출 가능, 결과를 확인할 것' % warn if warn else '모두 통과: 제출 가능')
    head = '# 원화 검사: %s (ID %s, %s)\n\n**결론: %s**\n\n예상 사용량: %d개 클립 × 3방향 = %d건, 약 %d회분.\n' % (row['name'], hero, cfg['family'], verdict, len(clips), len(clips) * 3, len(clips) * 12)
    report = head + '\n' + '\n'.join(out) + '\n'
    os.makedirs(os.path.join(sm.WORK, 'out', 'art-check'), exist_ok=True)
    open(os.path.join(sm.WORK, 'out', 'art-check', '%s-report.md' % hero), 'w', encoding='utf-8', newline='\n').write(report)
    if est_ok: picture(hero, row)
    return report

def picture(hero, row):
    """Top: the art with the skeleton PixelLab will be told it is in. Bottom: the hit frame of the first attack, fitted to the art."""
    attack = 'b1' if row['set'] == 'B' else 'a1'; sheet = Image.new('RGBA', (512 * 3, 512 * 2), (14, 18, 28, 255))
    for c, view in enumerate(pl.ART):
        cfg, clip, first, motion = pl.prepared(hero, attack, view); im, _ = pl.art(hero, view); par = {r['name']: r['parent'] for r in pl.rig(view, bool(cfg.get('weapon_length')))}
        hit = motion[(clip.get('impact') or 8) - 1]
        for r_, (frame, faded) in enumerate(((first, 1.0), (hit, 0.35))):
            a = im.copy(); a.putalpha(a.getchannel('A').point(lambda v: int(v * faded)))
            cell = Image.alpha_composite(Image.new('RGBA', im.size, (40, 48, 62, 255)), a).resize((512, 512), Image.NEAREST); d = ImageDraw.Draw(cell); pos = {k['label']: (k['x'] * 512, k['y'] * 512) for k in frame}
            for n, p in par.items():
                if p: d.line([pos[n], pos[p]], fill=(255, 240, 90, 255) if r_ == 0 else (120, 220, 255, 255), width=2)
            for n, (x, y) in pos.items(): d.ellipse([x - 3, y - 3, x + 3, y + 3], fill=(255, 80, 80, 255))
            sheet.paste(cell, (c * 512, r_ * 512))
    sheet.save(os.path.join(sm.WORK, 'out', 'art-check', '%s-check.png' % hero))

if __name__ == '__main__':
    print(check(sys.argv[1], '--estimate' in sys.argv))
