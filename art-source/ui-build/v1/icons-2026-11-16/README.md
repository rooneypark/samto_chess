# 2026-11-16 아이콘 전달

UI 아이콘 36종(기능 타일 14, 보상 7, 세력 문장 4, 상품 9, 빈 상태 1, 자물쇠 1)을 내장 image_gen으로 개별 생성했다.

게임 소비 파일은 `game/assets/ui-temp/`의 요청서와 동일한 파일명이다. 36개 파일 모두 96×96 투명 PNG, 가시 색상 16색 이하, 사방 6px 이상 여백, alpha 0/255 검증을 통과했다. 고해상도 생성 결과를 최근접 축소하고 디더링 없이 팔레트를 정리했다. 생성 소재와 원본 경로는 manifest.json에 있다.

검수 비교판은 `test-artifacts/request-icons-review.png`, 수치 결과는 `test-artifacts/request-icons-validation.json`이다. 실제 게임 24~40px 표시 및 사용자 디자인 승인은 별도 확인이 필요하다. 이번 전달은 로컬 파일 교체이며 릴리스 게시와 Git 커밋은 수행하지 않았다.

버튼 수정 원화는 v2 시안이었다(정리 때 삭제, 최종 입력은 v3). 각각 실제 전투 시작과 소환 버튼을 참조했다. 이 두 파일은 고해상도 시안이며 579×143 변환 및 나인슬라이스 검수 전이다. 초록 중앙 사선 질감 정리가 남아 있다. 기존 green-source.png와 blue-source.png는 사용자가 반려한 첫 시안이다.

게시 시 저장소 가이드의 pack → verify → publish → git push 순서를 따른다.

2026-11-16 후속 완료. 버튼 2종은 game/assets/ui-scalable/green-rich.png 및 blue-rich.png에 579×143 최종본으로 교체했고 나인슬라이스 검수를 통과했다. 위 버튼 미완료 기록은 docs/공용버튼_최종적용가이드.md로 대체한다. 재생성 입력은 두 색 모두 source-v3.png다.
