from pathlib import Path
p=Path('bone-motion/engine/build_roster_review.py');s=p.read_text(encoding='utf-8-sig')
s=s.replace("approved = ident in ('2','34')","approved = True")
a=s.index('        if approved:');b=s.index('        if not path.exists():',a)
s=s[:a]+"        path = base/'base-final-v1'/(view+'.png')\n"+s[b:]
s=s.replace("'approved-preserve' if approved else 'generated-awaiting-cross-review'","'user-approved-ground-aligned'")
s=s.replace("if not approved and (im.size != (256,256) or im.mode != 'RGBA' or alpha.getextrema()[0] != 0):","if (im.size != ((1254,1254) if ident == '2' else (256,256)) or im.mode != 'RGBA' or alpha.getextrema()[0] != 0):")
s=s.replace("        if ident == '0':\n            item['alignment'] = 'bone-motion/art-in/0/base-draft-v4/alignment.json'","        item['alignment'] = path.with_name(view+'-alignment.json').relative_to(ROOT).as_posix()")
s=s.replace("status = '기존 승인본 보존' if approved else '생성본 · 교차 검수 대기'","status = '원화 사용자 확정 · PNG 접지 보정 완료'")
a=s.index('    notes = ');b=s.index('    sections.append',a)
s=s[:a]+"    notes = '원본 크기·RGBA 픽셀 보존. 고정 접지 (128,224); 별도 CSS 이동 없음. 본 피팅·모션 검증과 구분합니다.'\n    if ident == '2': notes += ' 장비는 원본 1254×1254 보존, 동일 비율 접지 (627,1097). 표시만 256px입니다.'\n"+s[b:]
s=s.replace("'approved_preserve':2","'approved':49")
s=s.replace("'validation_scope':'PNG dimensions, mode, transparency, file completeness and hashes only; body/weapon measurements and rig fitting pending'","'validation_scope':'User-approved standing artwork; exact RGBA-preserving integer ground alignment verified; body/weapon dimensions and full rig/motion fitting remain separate'")
s=s.replace('49장수 3방향 교차 검수','49장수 확정 원화 · 접지 검수')
s=s.replace('기존 승인 장비·장료 2명 보존 + 기존 검토 8명 + 신규 39명. 모든 방향을 같은 캔버스 배율로 표시합니다. 신규 원화는 <b>교차 검수 대기</b>이며, 치수 오차 범위 합격·본 피팅 완료·모션 납품 승인으로 표시하지 않습니다.','49명 147방향 원화 사용자 확정. 원본 PNG에 접지를 보정했으며 그림 크기·RGBA 픽셀을 보존했습니다. 전체 본 피팅·모션 검증과는 별도입니다. 장비 원본은 1254px, 나머지는 256px이며 이 비교판의 캔버스 표시 폭은 공통 256px입니다.')
s=s.replace('<a href="cross-review-notes.md">수정 및 검토 메모</a>','<a href="cross-review-notes.md">수정 및 검토 메모</a> · <a href="ground-alignment.json">접지 보정·픽셀 보존 검증</a>')
p.write_text(s,encoding='utf8')
