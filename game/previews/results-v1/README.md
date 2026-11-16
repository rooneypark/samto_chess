# 전투 결과·보상 — 사용자 확정 / 런타임 적용

2026-11-14 사용자 확정한 최종 승리 기준 시안이다. 실제 게임은 `game/results-ui.js`와 `battle.js`에서 승리·패배·재도전·군웅대전 결과 및 실제 보상에 연결했다. 이 미리보기 페이지 자체는 저장에 접근하지 않는 디자인 기준으로 남긴다.

- 미리보기: http://127.0.0.1:8780/game/previews/results-v1/index.html
- 기준 이미지: `design-delivery/v2/05-mockups/battle-results-v1.png`
- 검수: `node game/previews/results-v1/review.cjs`

공용 `ui-shell.js`, `art-controls.js`, `nine-slice.js`와 기존 군웅대전 배경을 재사용한다. 6장수 독립 원화와 기마 대비 보행 70% 비율을 유지하며 신규 이미지 생성·전체 시안 누끼 추출은 하지 않았다. 사수관 아이콘도 확정 전역 원화를 사용한다.

광종 결전 최초 클리어의 골드 100, 무료 다이아 30, 장수 교환재료 5를 실제 전역 정의에서 읽어 보여준다. 예시 결과이며 실제 저장에 접근하거나 보상을 지급하지 않는다. 기존 게임은 전투 종료 시 자동 정산하므로 별도 보상 받기 버튼은 두지 않는다. 전역으로/성문으로/전투 기록 버튼은 안내만 표시한다.

실제 구현 검수는 `node game/tests/run-browser.cjs results-ui results-flow`로 수행한다. 오늘 작업·검수·남은 항목은 `design-delivery/v2/07-worklog/2026-11-14-ui.md`에 기록했다. 원본 기준 PNG는 재기록하지 않는다.
