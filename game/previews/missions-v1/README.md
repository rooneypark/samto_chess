# 임무 · 보상 — 시안 확정 / 실제 게임 적용

2026-11-14 사용자가 상하 여백을 수정한 시안을 확정했다. `game/missions.js`, `missions-ui.js/css`, `missions-ui-template.js`로 실제 게임에 적용했으며 성문의 ‘임무’ 또는 `#missions`로 연다. 이 미리보기는 디자인 기준과 메모리 예시를 유지한다. 후속 확인에서 실제 구현의 사용자 클릭 검수도 완료·최종 확정되었다.

- 미리보기: http://127.0.0.1:8780/game/previews/missions-v1/index.html
- 기준 이미지: `design-delivery/v2/05-mockups/missions-v1.png`
- 작은 화면: `design-delivery/v2/05-mockups/missions-v1-mobile.png`
- 검수: `node game/previews/missions-v1/review.cjs`

`ui-shell`, `art-controls`, `art-layout`, `nine-slice`와 승인된 코인·다이아 원본을 그대로 재사용한다. 새 이미지 생성이나 추가 크롭은 없다. 본문은 x=20~921, 탭 간격은 17/18px의 정수 배치이며 프레임의 논리 모서리는 28px로 고정한다. 일일 4행/주간 5행/업적 3행 모두 같은 좌우 끝선을 사용한다. 선택 전환은 탭 크기를 유지하며 녹색/금색 프레임으로 표시한다. 5일차 훈련권은 기존 독립 아이콘이 없어 텍스트로 표시한다.

보상은 `services.js`의 `questDefs`, `periodBonus`, `attendanceRewards`, `achievementDefs`를 참조한다. 진행 상태와 재화는 메모리 전용 예시다. 수령 버튼은 기존 `serviceCommand`를 예시 프로필에만 적용하며 새로고침하면 초기화된다. 사용자 프로필, localStorage, IndexedDB에는 접근하지 않는다. 미달성/기수령 버튼과 완료 보너스의 수령 조건을 유지한다. 공용 메뉴 버튼은 미리보기 안내만 표시한다.

자동 검수는 공용 상하단 원본 픽셀, 3종 탭의 selected 크기, 활성 버튼의 pressed/알파/전체 테두리, 16종 나인슬라이스 모서리, 3개 화면 크기의 글자/좌우 정렬/패널 겹침, 메모리 수령과 새로고침 초기화를 확인한다. 결과는 `qa.json`에 기록한다.

검수 결과: 공용 상하단 224,470픽셀 일치, 43개 버튼 상태의 pressed 외곽/테두리 통과, 16종 모서리 일치, 3개 탭 × 3개 화면 크기 통과. 실제 저장 접근 없이 출석/임무/업적 수령 예시와 새로고침 초기화를 확인했다.

사용자 여백 수정: 성문 버튼을 y=1414~1478로 20px 올려 공용 하단 프레임(y=1498)과 20px를 띄웠다. 보너스 패널 높이와 안내 문구도 조정하여 문구 앞뒤 각각 12px를 확보했다. 버튼 크기·좌우 끝선·공용 하단 자산은 유지한다.

실제 구현은 `store.get()`의 복사본을 표시하고 수령 시 `store.transact(s=>serviceCommand(s,command))`를 사용한다. 저장 성공 뒤 수령 완료로 갱신하며, 실패 시 기존 상태와 재시도 버튼을 유지한다. 탭 전환/조회 자체는 저장하지 않는다. 날짜·주간 갱신, 출석 순환, 만렙 장수 대체 출정, 업적 상세, 완료 보너스, 메뉴 복귀와 기존 레벨 잠금에 연결했다. 실제 게임 검수는 `node game/tests/run-browser.cjs missions-ui missions-flow`로 실행한다. 사용자 저장을 조작하지 않고 별도 브라우저 프로필에서 검수한다.
