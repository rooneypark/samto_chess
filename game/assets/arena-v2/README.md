# 확정 군웅대전 자산

`courtyard.png`는 승인 시안 `game/previews/arena-v1/courtyard.png`와 동일하다. 기존 생성 출처/프롬프트는 `design-delivery/v2/05-mockups/arena-versus-v1-generation.json`에 보존한다.

`arena-ui.js`, `arena-ui-template.js`, `arena-ui.css`가 본문을 표시하고 `arena.js`가 기존 대전 규칙·트랜잭션·대전 시작에 연결한다. 상하단은 `artworkShell`, 버튼은 `art-controls`, 9개 가변 버튼·3개 패널은 `nineSlice`를 사용한다.

실제 출전 편성과 선택한 NPC의 장수를 표시한다. 해당 장수의 `generals-v2` 원화가 있으면 그대로 사용하며 그 외 장수는 기존 독립 스프라이트를 쓴다. 사용자 수정 요청에 따라 `character-scale.js`에서 보행 장수는 기마 장수의 70% 높이로 표시한다. 바닥 위치는 같고 무기·장식·발끝을 자르지 않는다. 시안의 장수 영역을 잘라 사용하지 않는다.

검수: `node game/tests/run-browser.cjs arena-ui expansion dialog art approved-ui ui-shell`, `npm test`, `npm run verify:ui`.

- 원본 시안과 UI 픽셀 비교: 실제 장수와 사용자가 요청한 비율 보정 영역 외 픽셀 차이 0.
- 17개 실제 버튼의 pressed 알파/테두리, 14종 나인슬라이스 모서리와 하단 selected 고정 영역.
- 320/390/1440px 원화·문구 영역, 기마 대비 보행 높이 70%.
- NPC 선택·방어 편성·군공 상점·대전 취소·중복 확정·저장 실패 복구.
- 실제 대전 완료 후 골드·군공·점수·기록 반영, 준비/결과 새로고침, 보상 중복 지급 방지.

검수 값은 격리된 브라우저 프로필에서만 사용한다. 사용자 검수 완료로 임시 진입/6장수 표시 모드는 제거되었으며 정상 Lv.6 진입 규칙을 적용한다.
