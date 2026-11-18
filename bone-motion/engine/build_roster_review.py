"""Read-only PNG audit and a gallery referencing existing assets, without copies."""
from pathlib import Path
import json, hashlib, html
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'bone-motion/art-in/roster-49-v1'
specs = json.loads((OUT/'design-briefs.json').read_text(encoding='utf-8-sig'))
body_review = json.loads((OUT/'body-review.json').read_text(encoding='utf-8-sig'))
body_ids = set(body_review['ids'])
records, sections, issues = [], [], []
labels = {'front':'정면','side':'왼쪽 측면','back':'후면'}
for s in specs:
    ident = s['id']
    approved = True
    previous = s['status'] == 'correction-and-rig-review'
    base = ROOT/'bone-motion/art-in'/ident
    row = dict(s)
    row['status'] = 'user-approved-ground-aligned'
    if ident in body_ids:
        row['status'] = 'user-approved-ground-aligned'
    row['views'] = {}
    figures = []
    for view, label in labels.items():
        path = base/'base-final-v1'/(view+'.png')
        if not path.exists():
            issues.append(str(path)); row['status'] = 'incomplete'; continue
        with Image.open(path) as im:
            alpha = im.getchannel('A') if 'A' in im.getbands() else None
            item = {'path':path.relative_to(ROOT).as_posix(),'size':list(im.size),'mode':im.mode,
                    'alpha_extrema':list(alpha.getextrema()) if alpha else None,
                    'alpha_bbox':alpha.getbbox() if alpha else None,
                    'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
            if (im.size != ((1254,1254) if ident == '2' else (256,256)) or im.mode != 'RGBA' or alpha.getextrema()[0] != 0):
                issues.append('PNG format: '+str(path))
        meta = path.with_name(view+'-generation.json')
        if meta.exists(): item['generation'] = meta.relative_to(ROOT).as_posix()
        row['views'][view] = item
        relative = '../'+path.relative_to(ROOT/'bone-motion/art-in').as_posix()
        item['alignment'] = path.with_name(view+'-alignment.json').relative_to(ROOT).as_posix()
        figures.append(f'<figure><figcaption>{label}</figcaption><a href="{relative}"><img src="{relative}" alt="{html.escape(s["name"])} {label}"></a></figure>')
    status = '원화 사용자 확정 · PNG 접지 보정 완료'
    if ident in body_ids:
        status = '체격 보정 원화 · 사용자 최종 확정'
    notes = '원본 크기·RGBA 픽셀 보존. 고정 접지 (128,224); 별도 CSS 이동 없음. 본 피팅·모션 검증과 구분합니다.'
    if ident == '2': notes += ' 장비는 원본 1254×1254 보존, 동일 비율 접지 (627,1097). 표시만 256px입니다.'
    if ident in body_ids:
        notes = '정면 유지 · 측면/후면 재제작. 머리·어깨·몸통·다리 비율 대조 및 접지 (128,224) 재보정. 전체 본 피팅 검증과는 별도입니다.'
    sections.append(f'<section id="h{ident}" data-key="{s["name"]} {ident} {s["family"]}" data-body="{str(ident in body_ids).lower()}"><h2>{s["name"]} <small>{ident} · {status}</small></h2><div class="views">'+''.join(figures)+f'</div><p>{notes}</p><details><summary>생성 목표 기준</summary><p>병종 {s["family"]} · 본 높이 {s["body_standard"]}px · 키 계수 {s["height"]} · 폭 계수 {s["width"]} · 무기 {s["weapon_length"]}px / 날 {s["weapon_head"]}px</p><p>목표값이며 실제 치수 합격 판정이 아닙니다. 승인본의 개별 예외는 해당 폴더 문서를 따릅니다.</p></details></section>')
    records.append(row)
summary = {'total':len(records),'approved':49,'review_pending':sum(r['status']=='body-corrected-awaiting-user-review' for r in records),'incomplete':sum(r['status']=='incomplete' for r in records),'views':sum(len(r['views']) for r in records),'new_hero_count':39,'new_views':sum(len(r['views']) for r in records if r['id'] not in ('2','34') and r['id'] not in ('1','15','16','35','32','33','xuchu','simayi')),'format_issues':issues,'validation_scope':'147 ground-aligned views; 20 views redrawn for body consistency and visually compared; All 49 heroes approved on 2026-11-18. Full rig and weapon measurement remain separate.','records':records}
(OUT/'progress.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
page = '''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>49장수 원화 · 체격/접지 검토</title><style>body{margin:24px;background:#252a32;color:#eee;font-family:system-ui}a{color:#9bdcff}h1{font-size:24px}h2{font-size:20px}small{font-size:13px;color:#bbc6d3}.views{display:flex;overflow-x:auto;gap:8px}figure{margin:0;flex:0 0 auto}figcaption{text-align:center;padding:8px}img{width:256px;height:256px;image-rendering:pixelated;background:repeating-conic-gradient(#333 0% 25%,#3b3b3b 0% 50%) 0/24px 24px}section{border-top:1px solid #59616a;padding:16px 0}p{line-height:1.6}header{position:sticky;top:0;background:#252a32;z-index:2;padding:8px}input,select{padding:8px;margin:4px}details{color:#bcc8d4}body.light img{background:#ddd}body.dark img{background:#111}body.zoom img{width:512px;height:512px}</style><header><h1>49장수 · 정면 / 왼쪽 측면 / 후면</h1><label><input type="checkbox" id="bodyOnly">체격 보정 10명만</label><input id="q" placeholder="장수 이름 / ID / 병종 검색"><select id="bg"><option value="">체커 배경</option><option value="light">밝은 배경</option><option value="dark">어두운 배경</option></select><label><input type="checkbox" id="zoom">2배 확대</label></header><p>49명 147방향 접지 보정. 유비·여포·서황·순욱·마초·손권·감녕·태사자·손상향·초선은 정면을 유지하고 측면·후면 20장을 체격 기준으로 재제작했습니다. 재제작 10명을 포함한 전체 49명은 2026-11-18 사용자 최종 확정입니다. 전체 본 피팅·모션 검증과는 별도입니다. 장비 원본은 1254px, 나머지는 256px이며 이 비교판의 캔버스 표시 폭은 공통 256px입니다.</p><p><a href="progress.json">파일 목록·목표 치수·검사 결과·생성 프롬프트 경로</a> · <a href="cross-review-notes.md">수정 및 검토 메모</a> · <a href="ground-alignment.json">접지 보정·픽셀 보존 검증</a></p>'''+''.join(sections)+'''<script>function filter(){document.querySelectorAll('section').forEach(s=>s.hidden=(!s.dataset.key.toLowerCase().includes(q.value.toLowerCase())||(bodyOnly.checked&&s.dataset.body!=='true')))}q.oninput=filter;bodyOnly.onchange=filter;if(new URLSearchParams(location.search).has('body')){bodyOnly.checked=true;filter()}function change(){document.body.className=bg.value+(zoom.checked?' zoom':'')}bg.onchange=change;zoom.onchange=change;</script></html>'''
(OUT/'index.html').write_text(page,encoding='utf-8')
print(json.dumps({k:v for k,v in summary.items() if k!='records'},ensure_ascii=True))
