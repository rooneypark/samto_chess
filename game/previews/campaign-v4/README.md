# 전역 선택 전체 화면 시안 — 확정·실제 적용

사용자가 확정한 `campaign-v3`의 원화 3종을 그대로 재사용한다. 황건/사수관/호뢰관 각 장의 3전투는 동일한 원화이며, 클리어 시 해당 장의 공용 파괴 원화로 교체한다. 선택 시 원화 픽셀과 위치는 바꾸지 않고 바닥 금빛 표시와 공용 녹색 이름 프레임으로 강조한다. 잠금은 자물쇠로 표시하며 눌러서 해금 조건을 확인할 수 있다.

- 기본: http://127.0.0.1:8780/game/previews/campaign-v4/index.html
- 사수관 진행: `index.html?chapter=2`
- 호뢰관 진행/세 장 파괴 원화 확인: `index.html?chapter=3`
- 기준 이미지: `design-delivery/v2/05-mockups/campaign-selection-v4.png`
- 검수: `node game/previews/campaign-v4/review.cjs`

원화 3종의 정상 상태는 승인 시안과 렌더링 픽셀까지 일치한다. 파괴 원화는 내장 image_gen으로 승인 원화를 편집한 별도 파일이며 프롬프트·원본 경로는 `campaign-selection-v4-generation.json`에 기록했다. 이름 프레임과 버튼은 공용 나인슬라이스를 사용하고, 원화 누끼의 alpha=1 잔점만 제거한다.

공용 상하단 224,470픽셀 일치, 30개 버튼 pressed 외곽 마스크, 14종 나인슬라이스, 3개 반응형 폭, 전투 선택·잠금·보상 표시를 검수했다. 추가로 승인 원화 픽셀 일치 및 3가지 진행 예시의 파괴 원화 수와 선택 전후 원화 불변을 확인했다.

이 폴더는 확정 기준을 보존한 독립 시안이며 저장 데이터를 읽거나 쓰지 않는다. 실제 게임은 `game/campaign-ui.js`와 `game/campaign.js`에서 실제 선택·출정·보상·클리어를 연결한다. 실제 주소: http://127.0.0.1:8780/game/#campaign
