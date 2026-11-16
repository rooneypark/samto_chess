# 승인된 상점 자산

`shop-ui.js`가 실제 등용 및 재화 차감에 연결한다. 배경과 재화 아이콘은 승인된 `previews/shop-v1/` 자산과 동일하다. 장수는 `generals-v2/`의 독립 정면 원화를 그대로 사용한다.

선택된 상점 탭은 원본 상점 아이콘의 닫힌 검은 윤곽선과 글자의 밝은 하이라이트를 모두 보존한다. 재생성 순서:

1. `node game/tools/build-ui-shell.cjs` (공용 selected 생성 및 상점/시안 복사 포함)
2. `node game/previews/shop-v1/build.cjs` (시안은 공용 자산을 복사)
3. `node game/tools/verify-ui-assets.cjs`
4. `node game/tools/verify-navigation.cjs`
5. `node game/tests/run-browser.cjs shop-ui ui-components ui-shell`

상점 테스트는 기존 시안과 픽셀을 비교한다. 사용자가 수정 요청한 공용 하단 탭 영역만 예외로 두고, 해당 영역은 원본 글자 픽셀 보존과 전체 테두리 pressed를 별도로 검증한다. 실제 사용자 저장에는 테스트 재화를 지급하지 않는다.
