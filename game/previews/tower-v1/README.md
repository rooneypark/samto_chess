# 연무탑 시안

사용자 검토 대기. 기존 공용 상하단·artwork-preview·art-controls·nine-slice·paintArtworkSelection을 재사용한다. 기존 towerStages 30층의 조건과 보상을 표시하며 10층씩 아래에서 위로 진행한다. 5층마다 장수 전투를 구분한다.

3층 클리어·6장수 보유는 시안 메모리 예시다. 실제 저장과 전투에 접근하지 않으며 기존 군주 Lv.15 제한도 변경하지 않는다. 신규 누끼나 원본 자산 변경 없이 승인된 alpha를 재사용했다.

검수: `node game/previews/tower-v1/review.cjs`. 공용 상하단 224470픽셀 동일, 68개 pressed 외곽 변화/테두리 누락 0, 14종 나인슬라이스 모서리 일치. 30층×3크기 선택·잠금·텍스트·좌우 정렬·버튼 상하 20px 검수 통과. 390px 전체 화면 육안 확인. 실제 구현은 승인 후 진행한다.


2026-11-14 연무탑 시안 사용자 확정·실제 적용. tower-ui.js/css와 tower-template.js, #tower 경로를 사용한다. 공용 artwork-screen 호스트/상하단/버튼/선택·28px 나인슬라이스 재사용. 실제 towerStages 30층과 stageUnlocked/stageCleared/towerDeck으로 층별 잠금·클리어·보유 장수 조건을 표시한다. 기존 Lv.15 제한 유지, 실제 newRun/전투 엔진/settle 최초 보상과 반복 보상0·중복 지급 방지 사용. 전투 포기/결과 복귀는 연무탑으로 연결하며 결과 버튼/다음 층 문구도 구분한다. 본문 x20~921, 하단 버튼 상하20 유지. 사용자 프로필에 테스트 값을 넣지 않았다. 실제 사용자 클릭 검수 대기.
검수: tower-flow 통과(Lv.15/이전 층/보유 세력 잠금, 시작 저장 실패·재시도/중복 클릭/재접속, 엔진 승리·최초 골드80·반복0·재접속 중복 방지, 30층×3크기 정렬/여백). tower-alpha 실제45개 pressed 외곽 변화0/테두리 누락0. approved-ui 기존8화면/results-flow 회귀 통과. npm test 87개 및 verify:ui 58자산/5탭 통과. 실제390px 화면 육안 확인. 테스트 데이터는 격리 브라우저에만 사용한다. 확인 링크 http://127.0.0.1:8780/game/?revision=tower-v1#tower .
