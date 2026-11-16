# 전투지 공용 원화 3종 — 검토 대기

이전 상세 원화는 폐기안이다. 이 시안은 작은 산채·낮은 성벽·간결한 관문 3종만 비교한다. 같은 장의 1·2·3 전투는 동일한 이미지를 사용하고 이름은 공용 나인슬라이스 버튼에 표시한다.

미리보기: http://127.0.0.1:8780/game/previews/campaign-v3/index.html

이미지: `design-delivery/v2/05-mockups/campaign-landmarks-v3.png`. 내장 image_gen으로 생성한 투명 원화를 사용하며 프롬프트 및 원본 경로는 `campaign-landmarks-v3-generation.json`에 기록했다.

실제 게임 적용 전 3종 형태·크기 시안이다. 전체 지도 및 클리어·잠금 변형은 아직 구현하지 않았다. 실제 저장에 접근하지 않는다.

검수: `node game/previews/campaign-v3/review.cjs`. 선택 전후 원화 픽셀 및 버튼 배치 동일, 공용 pressed 마스크, 320/390/941폭 글자 검수. 사용자 디자인 가이드는 `AGENTS.md` 및 `design-delivery/v2/06-components/campaign-landmarks.md`에 기록했다.
