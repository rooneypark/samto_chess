from pathlib import Path
import json
root=Path.cwd();g=root/'bone-motion/art-in/roster-49-v1'
(g/'README.md').write_text('''# 49장수 현재 원화

2026-11-18: 49명 147방향의 PNG 접지 보정을 완료했다. 사용자 지적에 따라 유비·여포·서황·순욱·마초·손권·감녕·태사자·손상향·초선의 측면/후면 20장을 내장 image_gen으로 재제작했다. 이 10명의 정면은 유지했다.

- 현재 원본: `../<id>/base-final-v1/{front,side,back}.png`.
- `index.html`: 같은 캔버스 표시 배율로 3방향 비교. CSS 위치 보정이나 장수별 contain-fit 없음.
- `progress.json`: 현재 경로·해시·상태. 39명 기존 승인 유지, 10명 체격 재제작본 사용자 확인 대기.
- `body-review.json`: 재제작 대상과 선택 경로. 파일명/폴더명의 final은 현재 납품 위치를 뜻하며 신규 재제작 사용자 승인을 뜻하지 않는다.
- `ground-alignment.json` 및 방향별 alignment/generation JSON: 접지 보정, 생성 프롬프트, RGBA 이동 검증 기록.
- `retired-drafts.json`: 사용자 지시로 삭제한 이전 원화/시안 디렉터리 목록. 이전 49장수 원화와 반려/중간본은 현 납품에서 제거했다.
- `art-source/characters/v1/<id>/`와 `art-in/<id>/`의 3방향 PNG는 현재 파일에 대한 하드링크로 연결했다. 구본 복사본이 아니다.

접지는 논리 좌표 (128,224). 48명은 256×256 RGBA, 장비는 픽셀 유지 요청에 따라 기존 1254×1254 원본과 해당 비율의 (627,1097)을 보존한다. 접지 이동은 정수 픽셀 이동이며 배경의 극미세 알파 픽셀도 버리지 않고 보존했다. 재제작 20장은 의도적으로 그림을 새로 그렸으므로 구 원화 픽셀 동일성 검사의 대상이 아니다. 새 출력의 접지 이동만 RGBA 보존을 검사했다.

신체 크기는 정면과 머리·어깨·몸통·다리 비율 및 기마의 말/기수를 나란히 육안 대조했다. 관모·깃털·무기 끝은 신장 기준에서 제외한다. 체격 대조를 완전한 본 피팅·무기 실측·모션 검수 통과로 취급하지 않는다. 모션, 게임/UI 자산, 배포는 변경하지 않았다.
''',encoding='utf8')
with (g/'cross-review-notes.md').open('a',encoding='utf8') as f:f.write('\n## 최신 상태 — 체격 재제작\n\n10명(유비·여포·서황·순욱·마초·손권·감녕·태사자·손상향·초선)의 측면/후면 20장을 정면 체격 기준으로 재제작하고 PNG 접지를 다시 맞췄다. 여포/마초 측면 및 서황 후면은 재생성 결과에서 남은 크기 차이를 재확인하여 한 차례 더 수정했다. 손권 후면 앞장식 반복도 보라색 망토로 정정했다. 현재 선택 경로는 모두 base-final-v1. 이전 보정의 파일 경로는 삭제된 이력이며 현 입력으로 사용하지 않는다. 이전 49장수 원화·시안 125개 디렉터리 삭제 완료. 모션/게임 자산 유지. 이 10명의 재제작본은 사용자 확인 대기이며 전체 본 검증 완료 표기가 아니다.\n')
p=root/'bone-motion/engine/build_roster_review.py';s=p.read_text(encoding='utf-8-sig');s=s.replace("'validation_scope':'User-approved standing artwork; exact RGBA-preserving integer ground alignment verified; body/weapon dimensions and full rig/motion fitting remain separate'","'validation_scope':'147 ground-aligned views; 20 views redrawn for body consistency and visually compared; 10 heroes await user review. Full rig and weapon measurement remain separate.'")
s=s.replace('49장수 확정 원화 · 접지 검수','49장수 원화 · 체격/접지 검토')
s=s.replace("data-key=\"{s[\"name\"]} {ident} {s[\"family\"]}\"", "data-key=\"{s[\"name\"]} {ident} {s[\"family\"]}\" data-body=\"{str(ident in body_ids).lower()}\"")
s=s.replace('<input id="q" placeholder=', '<label><input type="checkbox" id="bodyOnly">체격 보정 10명만</label><input id="q" placeholder=')
s=s.replace("q.oninput=()=>document.querySelectorAll('section').forEach(s=>s.hidden=!s.dataset.key.toLowerCase().includes(q.value.toLowerCase()));", "function filter(){document.querySelectorAll('section').forEach(s=>s.hidden=(!s.dataset.key.toLowerCase().includes(q.value.toLowerCase())||(bodyOnly.checked&&s.dataset.body!=='true')))}q.oninput=filter;bodyOnly.onchange=filter;if(new URLSearchParams(location.search).has('body')){bodyOnly.checked=true;filter()}")
p.write_text(s,encoding='utf8')
