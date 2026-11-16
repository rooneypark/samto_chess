# 승인된 동맹 본부 자산

`headquarters.png`는 확정된 `game/previews/alliance-v1/headquarters.png`와 동일한 배경이다. 출처와 생성 프롬프트는 `design-delivery/v2/05-mockups/alliance-headquarters-v1-generation.json`에 있다. 장수는 `generals-v2/1-front.png`, `35-front.png`의 독립 원화를 그대로 사용한다.

`alliance-ui.js`와 `alliance-ui.css`는 확정 시안을 구현한다. 상하단은 `artworkShell`, 버튼 입력은 `art-controls`, 가변 10개 버튼과 2개 패널은 `nineSlice`를 재사용한다. 모서리는 941px 화면 기준 28px로 고정한다. 하단 탭은 공용 normal/selected/pressed 원본을 그대로 쓴다.

출석·기부·군량 지원·보상 수령은 `alliance.js`의 `allianceCommand`와 실제 프로필 저장을 사용한다. 기존 가입 24시간 제한과 일일/주간 한도를 유지한다. 시안의 동맹명·재화·인원은 실제 프로필로 대체하며 테스트 재화를 지급하지 않는다.

검수: `node game/tests/run-browser.cjs alliance-ui expansion dialog`, `npm run verify:ui`. 본부 UI 픽셀 일치, 전체 외곽 pressed 18개, 14종 나인슬라이스 모서리, 320/390/1440px 글자·원화 잘림, 거래·중복 클릭·저장 실패·기간 갱신을 검사한다. 검수 데이터는 격리된 브라우저 프로필에만 저장한다.
